import type { SupabaseClient } from '@supabase/supabase-js';
import type { QuotaErrorCode } from '@/lib/sylla/quota/errors';
import type { Identity } from '@/lib/sylla/quota/identity';

// Thin, fully-testable wrapper around the sylla_* RPCs. All counting/locking
// logic lives in Postgres (supabase/migrations/…_sylla_ai_usage_and_quota.sql)
// — this module only shapes requests/responses and never itself decides
// whether a request is allowed.

export type QuotaDecision =
  | { allowed: true; requestId: string }
  | { allowed: false; code: QuotaErrorCode; limit: number; resetAt: string };

interface ReserveRpcResult {
  allowed: boolean;
  request_id?: string;
  code?: string;
  limit?: number;
  reset_at?: string;
}

function mapReserveResult(data: ReserveRpcResult): QuotaDecision {
  if (data.allowed) {
    if (!data.request_id) {
      throw new Error('sylla quota RPC returned allowed=true without a request_id');
    }
    return { allowed: true, requestId: data.request_id };
  }
  if (!data.code || data.limit === undefined || !data.reset_at) {
    throw new Error('sylla quota RPC returned allowed=false without code/limit/reset_at');
  }
  return { allowed: false, code: data.code as QuotaErrorCode, limit: data.limit, resetAt: data.reset_at };
}

export async function reserveChatQuota(
  admin: SupabaseClient,
  identity: Identity,
  params: { model: string; inputChars: number },
): Promise<QuotaDecision> {
  const { data, error } = await admin.rpc('sylla_reserve_chat_request', {
    p_user_id: identity.kind === 'authenticated' ? identity.userId : null,
    p_anon_id: identity.kind === 'anonymous' ? identity.anonId : null,
    p_ip_hash: identity.kind === 'anonymous' ? identity.ipHash : null,
    p_model: params.model,
    p_input_chars: params.inputChars,
  });
  if (error) throw error;
  return mapReserveResult(data as ReserveRpcResult);
}

export async function reserveUploadQuota(admin: SupabaseClient, userId: string): Promise<QuotaDecision> {
  const { data, error } = await admin.rpc('sylla_reserve_upload_request', { p_user_id: userId });
  if (error) throw error;
  return mapReserveResult(data as ReserveRpcResult);
}

export interface FinalizeResult {
  status: 'succeeded' | 'failed';
  inputTokens?: number | null;
  outputTokens?: number | null;
  errorCode?: string | null;
  /** Pass the authenticated user id to release their concurrency lock. */
  userId?: string | null;
}

/**
 * Marks a reserved request succeeded/failed and releases the concurrency
 * lock. Never throws — this typically runs inside `after()` once the
 * response has already started streaming to the client, so a DB hiccup here
 * must not crash anything; it only gets logged.
 */
export async function finalizeRequest(
  admin: SupabaseClient,
  requestId: string,
  result: FinalizeResult,
): Promise<void> {
  const { error } = await admin.rpc('sylla_finalize_request', {
    p_request_id: requestId,
    p_status: result.status,
    p_input_tokens: result.inputTokens ?? null,
    p_output_tokens: result.outputTokens ?? null,
    p_error_code: result.errorCode ?? null,
    p_user_id: result.userId ?? null,
  });
  if (error) {
    console.error('[sylla/quota] finalizeRequest failed:', error);
  }
}
