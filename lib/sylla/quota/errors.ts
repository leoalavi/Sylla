// Isomorphic (client + server safe) quota error vocabulary. No server-only
// imports here — ChatView renders these same codes/messages client-side.

export type QuotaErrorCode =
  | 'anon_cooldown'
  | 'anon_daily_limit'
  | 'auth_minute_limit'
  | 'auth_daily_limit'
  | 'auth_monthly_limit'
  | 'auth_concurrent'
  | 'upload_daily_limit';

export interface QuotaErrorBody {
  error: 'rate_limited';
  code: QuotaErrorCode;
  limit: number;
  resetAt: string;
  message: string;
}

/** Codes where the sign-in CTA is the right next step (anonymous, exhausted). */
export function isAnonExhaustionCode(code: QuotaErrorCode): boolean {
  return code === 'anon_daily_limit' || code === 'anon_cooldown';
}

/** Codes where an immediate Retry is pointless (long window, must wait). */
export function isLongWindowCode(code: QuotaErrorCode): boolean {
  return code === 'anon_daily_limit' || code === 'auth_daily_limit' || code === 'auth_monthly_limit';
}

function relativeTime(resetAt: string): string {
  const ms = new Date(resetAt).getTime() - Date.now();
  if (ms <= 0) return 'shortly';
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h`;
  return `${Math.round(hours / 24)}d`;
}

export function friendlyQuotaMessage(code: QuotaErrorCode, limit: number, resetAt: string): string {
  const wait = relativeTime(resetAt);
  switch (code) {
    case 'anon_cooldown':
      return `You're sending messages a little fast — try again in ${wait}.`;
    case 'anon_daily_limit':
      return `You've used your ${limit} free preview messages for today. Sign in with Syllabus Sync to keep chatting, or try again in ${wait}.`;
    case 'auth_minute_limit':
      return `Too many messages at once (max ${limit}/minute) — try again in ${wait}.`;
    case 'auth_daily_limit':
      return `You've reached today's limit of ${limit} messages. Try again in ${wait}.`;
    case 'auth_monthly_limit':
      return `You've reached this month's limit of ${limit} messages. Try again in ${wait}.`;
    case 'auth_concurrent':
      return `Sylla is still finishing your last reply — send this once that's done.`;
    case 'upload_daily_limit':
      return `You've used your ${limit} file uploads for today. Try again in ${wait}.`;
  }
}

export function buildQuotaErrorBody(code: QuotaErrorCode, limit: number, resetAt: string): QuotaErrorBody {
  return { error: 'rate_limited', code, limit, resetAt, message: friendlyQuotaMessage(code, limit, resetAt) };
}
