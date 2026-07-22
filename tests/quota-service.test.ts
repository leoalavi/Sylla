import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { finalizeRequest, reserveChatQuota, reserveUploadQuota } from '@/lib/sylla/quota/service';

function fakeAdmin(rpcImpl: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>) {
  return { rpc: vi.fn(rpcImpl) } as unknown as SupabaseClient;
}

describe('reserveChatQuota', () => {
  it('maps an allowed response to a requestId decision', async () => {
    const admin = fakeAdmin(async () => ({ data: { allowed: true, request_id: 'req-1' }, error: null }));
    const decision = await reserveChatQuota(
      admin,
      { kind: 'authenticated', userId: 'u1' },
      { model: 'gemini-3.5-flash-lite', inputChars: 42 },
    );
    expect(decision).toEqual({ allowed: true, requestId: 'req-1' });
  });

  it('passes authenticated identity fields (anon fields null) to the RPC', async () => {
    const rpc = vi.fn(async () => ({ data: { allowed: true, request_id: 'r' }, error: null }));
    await reserveChatQuota(
      { rpc } as unknown as SupabaseClient,
      { kind: 'authenticated', userId: 'u1' },
      { model: 'm', inputChars: 10 },
    );
    expect(rpc).toHaveBeenCalledWith('sylla_reserve_chat_request', {
      p_user_id: 'u1',
      p_anon_id: null,
      p_ip_hash: null,
      p_model: 'm',
      p_input_chars: 10,
    });
  });

  it('passes anonymous identity fields (user id null) to the RPC', async () => {
    const rpc = vi.fn(async () => ({ data: { allowed: true, request_id: 'r' }, error: null }));
    await reserveChatQuota(
      { rpc } as unknown as SupabaseClient,
      { kind: 'anonymous', anonId: 'a1', ipHash: 'hash1' },
      { model: 'm', inputChars: 10 },
    );
    expect(rpc).toHaveBeenCalledWith('sylla_reserve_chat_request', {
      p_user_id: null,
      p_anon_id: 'a1',
      p_ip_hash: 'hash1',
      p_model: 'm',
      p_input_chars: 10,
    });
  });

  it.each([
    ['anon_cooldown', 15],
    ['anon_daily_limit', 3],
    ['auth_minute_limit', 5],
    ['auth_daily_limit', 20],
    ['auth_monthly_limit', 200],
    ['auth_concurrent', 1],
  ] as const)('maps a rejected %s response with its limit and resetAt', async (code, limit) => {
    const resetAt = '2026-08-01T00:00:00.000Z';
    const admin = fakeAdmin(async () => ({
      data: { allowed: false, code, limit, reset_at: resetAt },
      error: null,
    }));
    const decision = await reserveChatQuota(
      admin,
      { kind: 'authenticated', userId: 'u1' },
      { model: 'm', inputChars: 1 },
    );
    expect(decision).toEqual({ allowed: false, code, limit, resetAt });
  });

  it('throws when the RPC itself errors', async () => {
    const admin = fakeAdmin(async () => ({ data: null, error: new Error('db down') }));
    await expect(
      reserveChatQuota(admin, { kind: 'authenticated', userId: 'u1' }, { model: 'm', inputChars: 1 }),
    ).rejects.toThrow('db down');
  });

  it('throws if the RPC claims allowed=true without a request_id (contract violation)', async () => {
    const admin = fakeAdmin(async () => ({ data: { allowed: true }, error: null }));
    await expect(
      reserveChatQuota(admin, { kind: 'authenticated', userId: 'u1' }, { model: 'm', inputChars: 1 }),
    ).rejects.toThrow(/request_id/);
  });

  it('throws if the RPC claims allowed=false without code/limit/resetAt (contract violation)', async () => {
    const admin = fakeAdmin(async () => ({ data: { allowed: false }, error: null }));
    await expect(
      reserveChatQuota(admin, { kind: 'authenticated', userId: 'u1' }, { model: 'm', inputChars: 1 }),
    ).rejects.toThrow(/code\/limit\/reset_at/);
  });
});

describe('reserveUploadQuota', () => {
  it('maps an upload_daily_limit rejection', async () => {
    const resetAt = '2026-08-02T00:00:00.000Z';
    const admin = fakeAdmin(async () => ({
      data: { allowed: false, code: 'upload_daily_limit', limit: 2, reset_at: resetAt },
      error: null,
    }));
    const decision = await reserveUploadQuota(admin, 'u1');
    expect(decision).toEqual({ allowed: false, code: 'upload_daily_limit', limit: 2, resetAt });
  });

  it('maps an allowed upload reservation', async () => {
    const admin = fakeAdmin(async () => ({ data: { allowed: true, request_id: 'up-1' }, error: null }));
    const decision = await reserveUploadQuota(admin, 'u1');
    expect(decision).toEqual({ allowed: true, requestId: 'up-1' });
  });
});

describe('finalizeRequest', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('calls the finalize RPC with status, token usage, and user id (to release the concurrency lock)', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    await finalizeRequest({ rpc } as unknown as SupabaseClient, 'req-1', {
      status: 'succeeded',
      inputTokens: 120,
      outputTokens: 300,
      userId: 'u1',
    });
    expect(rpc).toHaveBeenCalledWith('sylla_finalize_request', {
      p_request_id: 'req-1',
      p_status: 'succeeded',
      p_input_tokens: 120,
      p_output_tokens: 300,
      p_error_code: null,
      p_user_id: 'u1',
    });
  });

  it('never throws when the finalize RPC errors — logs instead (best-effort, runs after the response streams)', async () => {
    const admin = fakeAdmin(async () => ({ data: null, error: new Error('transient') }));
    await expect(
      finalizeRequest(admin, 'req-1', { status: 'failed', errorCode: 'stream_error' }),
    ).resolves.toBeUndefined();
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('finalizes a failed request with an error code and no user id for anonymous requests', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }));
    await finalizeRequest({ rpc } as unknown as SupabaseClient, 'req-2', {
      status: 'failed',
      errorCode: 'client_abort',
    });
    expect(rpc).toHaveBeenCalledWith('sylla_finalize_request', {
      p_request_id: 'req-2',
      p_status: 'failed',
      p_input_tokens: null,
      p_output_tokens: null,
      p_error_code: 'client_abort',
      p_user_id: null,
    });
  });
});
