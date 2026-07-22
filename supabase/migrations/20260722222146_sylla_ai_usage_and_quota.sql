-- Sylla Gemini chat cost-control + abuse-prevention.
--
-- Mirrors the service_role-only RPC pattern already used by Syllabus Sync's
-- rate_limits table (20260217093000_rate_limits.sql): no RLS policies, all
-- access goes through SECURITY DEFINER functions granted to service_role
-- only. anon/authenticated roles have zero direct table access.
--
-- These functions are the SOLE authority for quota decisions — numeric
-- limits are hardcoded below, not passed in from the application, so a
-- compromised or misconfigured app server cannot widen its own quota.
-- lib/sylla/quota/limits.ts duplicates these numbers for client-side UX
-- hints ONLY; keep the two in sync by hand if limits ever change.
--
-- Identity model: authenticated requests are keyed by user_id. Anonymous
-- requests are keyed by BOTH a durable random cookie id AND a salted IP
-- hash — a request counts against the limit if EITHER matches, so clearing
-- the cookie alone (same IP) or changing IP alone (same cookie) does not
-- reset the anonymous allowance. This is best-effort abuse resistance, not
-- perfect identity enforcement (shared IPs/NAT/VPNs/carrier-grade NAT can
-- cause both false positives and false negatives).
--
-- Every accepted request is inserted as 'reserved' BEFORE the Gemini call
-- starts, so a request that begins processing is logged even if streaming
-- later fails or the server crashes before finalizing — a stale 'reserved'
-- row still counts toward quota (it is not "forgiven"), which is the
-- correct fail-safe for a cost-control feature.

create table if not exists public.sylla_ai_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references auth.users(id) on delete cascade,
  anon_id text null,
  ip_hash text null,
  kind text not null check (kind in ('chat', 'file_upload')),
  model text null,
  input_chars integer null,
  input_tokens integer null,
  output_tokens integer null,
  status text not null default 'reserved' check (status in ('reserved', 'succeeded', 'failed')),
  error_code text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sylla_ai_requests_identity_check check (user_id is not null or anon_id is not null)
);

create index if not exists sylla_ai_requests_user_created_idx
  on public.sylla_ai_requests (user_id, kind, created_at)
  where user_id is not null;

create index if not exists sylla_ai_requests_anon_created_idx
  on public.sylla_ai_requests (anon_id, created_at)
  where anon_id is not null;

create index if not exists sylla_ai_requests_ip_created_idx
  on public.sylla_ai_requests (ip_hash, created_at)
  where ip_hash is not null;

alter table public.sylla_ai_requests enable row level security;
-- No policies: service_role bypasses RLS; anon/authenticated get nothing.

-- One row per user currently generating a reply. Presence + freshness of
-- the row IS the concurrency lock; finalize deletes it when the request
-- completes (success, failure, or client abort). A stale row (server crash
-- mid-request) self-heals after sylla_concurrent_lock_stale_seconds.
create table if not exists public.sylla_active_generations (
  identity text primary key,
  started_at timestamptz not null default now()
);

alter table public.sylla_active_generations enable row level security;
-- No policies: service_role bypasses RLS; anon/authenticated get nothing.


create or replace function public.sylla_reserve_chat_request(
  p_user_id uuid,
  p_anon_id text,
  p_ip_hash text,
  p_model text,
  p_input_chars integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  -- ===== Hardcoded limits — the sole source of truth. =====
  anon_daily_limit constant integer := 3;
  anon_cooldown_seconds constant integer := 15;
  auth_daily_limit constant integer := 20;
  auth_monthly_limit constant integer := 200;
  auth_per_minute_limit constant integer := 5;
  concurrent_lock_stale_seconds constant integer := 90;
  -- =========================================================

  lock_key text;
  identity_label text;
  last_ts timestamptz;
  window_count integer;
  oldest_in_window timestamptz;
  new_id uuid;
  active_started_at timestamptz;
begin
  if p_user_id is null and p_anon_id is null then
    raise exception 'either p_user_id or p_anon_id is required';
  end if;

  lock_key := coalesce(p_user_id::text, p_anon_id);
  identity_label := case when p_user_id is not null then 'user:' || p_user_id::text else null end;

  -- Serializes concurrent calls for the SAME identity so the count-then-
  -- insert below cannot be raced by two simultaneous requests. Released
  -- automatically at transaction end (this function call).
  perform pg_advisory_xact_lock(hashtext(lock_key));

  if p_user_id is null then
    -- ===== Anonymous tier =====
    select max(created_at) into last_ts
    from public.sylla_ai_requests
    where kind = 'chat' and status <> 'failed'
      and ((p_anon_id is not null and anon_id = p_anon_id)
        or (p_ip_hash is not null and ip_hash = p_ip_hash));

    if last_ts is not null and now() - last_ts < make_interval(secs => anon_cooldown_seconds) then
      return jsonb_build_object(
        'allowed', false,
        'code', 'anon_cooldown',
        'limit', anon_cooldown_seconds,
        'reset_at', last_ts + make_interval(secs => anon_cooldown_seconds)
      );
    end if;

    select count(*), min(created_at) into window_count, oldest_in_window
    from public.sylla_ai_requests
    where kind = 'chat' and status <> 'failed'
      and created_at > now() - interval '24 hours'
      and ((p_anon_id is not null and anon_id = p_anon_id)
        or (p_ip_hash is not null and ip_hash = p_ip_hash));

    if window_count >= anon_daily_limit then
      return jsonb_build_object(
        'allowed', false,
        'code', 'anon_daily_limit',
        'limit', anon_daily_limit,
        'reset_at', oldest_in_window + interval '24 hours'
      );
    end if;

    insert into public.sylla_ai_requests (user_id, anon_id, ip_hash, kind, model, input_chars, status)
    values (null, p_anon_id, p_ip_hash, 'chat', p_model, p_input_chars, 'reserved')
    returning id into new_id;

    return jsonb_build_object('allowed', true, 'request_id', new_id);
  end if;

  -- ===== Authenticated tier =====
  select started_at into active_started_at
  from public.sylla_active_generations
  where identity = identity_label;

  if active_started_at is not null then
    if now() - active_started_at < make_interval(secs => concurrent_lock_stale_seconds) then
      return jsonb_build_object(
        'allowed', false,
        'code', 'auth_concurrent',
        'limit', 1,
        'reset_at', active_started_at + make_interval(secs => concurrent_lock_stale_seconds)
      );
    end if;
    -- Stale lock from a crashed/aborted request — reclaim it below.
    delete from public.sylla_active_generations where identity = identity_label;
  end if;

  select count(*), min(created_at) into window_count, oldest_in_window
  from public.sylla_ai_requests
  where user_id = p_user_id and kind = 'chat' and status <> 'failed'
    and created_at > now() - interval '1 minute';

  if window_count >= auth_per_minute_limit then
    return jsonb_build_object(
      'allowed', false,
      'code', 'auth_minute_limit',
      'limit', auth_per_minute_limit,
      'reset_at', oldest_in_window + interval '1 minute'
    );
  end if;

  select count(*), min(created_at) into window_count, oldest_in_window
  from public.sylla_ai_requests
  where user_id = p_user_id and kind = 'chat' and status <> 'failed'
    and created_at > now() - interval '24 hours';

  if window_count >= auth_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'code', 'auth_daily_limit',
      'limit', auth_daily_limit,
      'reset_at', oldest_in_window + interval '24 hours'
    );
  end if;

  select count(*), min(created_at) into window_count, oldest_in_window
  from public.sylla_ai_requests
  where user_id = p_user_id and kind = 'chat' and status <> 'failed'
    and created_at > now() - interval '30 days';

  if window_count >= auth_monthly_limit then
    return jsonb_build_object(
      'allowed', false,
      'code', 'auth_monthly_limit',
      'limit', auth_monthly_limit,
      'reset_at', oldest_in_window + interval '30 days'
    );
  end if;

  insert into public.sylla_ai_requests (user_id, anon_id, ip_hash, kind, model, input_chars, status)
  values (p_user_id, null, p_ip_hash, 'chat', p_model, p_input_chars, 'reserved')
  returning id into new_id;

  insert into public.sylla_active_generations (identity, started_at)
  values (identity_label, now())
  on conflict (identity) do update set started_at = excluded.started_at;

  return jsonb_build_object('allowed', true, 'request_id', new_id);
end;
$$;


create or replace function public.sylla_reserve_upload_request(
  p_user_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  upload_daily_limit constant integer := 2;
  window_count integer;
  oldest_in_window timestamptz;
  new_id uuid;
begin
  if p_user_id is null then
    raise exception 'file uploads require an authenticated user_id';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_user_id::text || ':upload'));

  select count(*), min(created_at) into window_count, oldest_in_window
  from public.sylla_ai_requests
  where user_id = p_user_id and kind = 'file_upload' and status <> 'failed'
    and created_at > now() - interval '24 hours';

  if window_count >= upload_daily_limit then
    return jsonb_build_object(
      'allowed', false,
      'code', 'upload_daily_limit',
      'limit', upload_daily_limit,
      'reset_at', oldest_in_window + interval '24 hours'
    );
  end if;

  insert into public.sylla_ai_requests (user_id, kind, status)
  values (p_user_id, 'file_upload', 'reserved')
  returning id into new_id;

  return jsonb_build_object('allowed', true, 'request_id', new_id);
end;
$$;


create or replace function public.sylla_finalize_request(
  p_request_id uuid,
  p_status text,
  p_input_tokens integer,
  p_output_tokens integer,
  p_error_code text,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_status not in ('succeeded', 'failed') then
    raise exception 'p_status must be succeeded or failed';
  end if;

  update public.sylla_ai_requests
  set status = p_status,
      input_tokens = coalesce(p_input_tokens, input_tokens),
      output_tokens = coalesce(p_output_tokens, output_tokens),
      error_code = p_error_code,
      updated_at = now()
  where id = p_request_id;

  if p_user_id is not null then
    delete from public.sylla_active_generations where identity = 'user:' || p_user_id::text;
  end if;
end;
$$;


create or replace function public.sylla_cleanup_old_ai_requests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer := 0;
begin
  delete from public.sylla_ai_requests where created_at < now() - interval '45 days';
  get diagnostics deleted_count = row_count;

  delete from public.sylla_active_generations
  where started_at < now() - interval '1 day';

  return deleted_count;
end;
$$;

-- Harden privileges — service_role only, matching the existing rate_limits
-- table convention in the Syllabus Sync schema.
revoke all on table public.sylla_ai_requests from public;
revoke all on table public.sylla_active_generations from public;
revoke all on function public.sylla_reserve_chat_request(uuid, text, text, text, integer) from public;
revoke all on function public.sylla_reserve_upload_request(uuid) from public;
revoke all on function public.sylla_finalize_request(uuid, text, integer, integer, text, uuid) from public;
revoke all on function public.sylla_cleanup_old_ai_requests() from public;

grant execute on function public.sylla_reserve_chat_request(uuid, text, text, text, integer) to service_role;
grant execute on function public.sylla_reserve_upload_request(uuid) to service_role;
grant execute on function public.sylla_finalize_request(uuid, text, integer, integer, text, uuid) to service_role;
grant execute on function public.sylla_cleanup_old_ai_requests() to service_role;
