import { getSignInUrl, LIMIT_REACHED_MESSAGE } from '@/lib/sylla/config';

/** Shown in place of the input once the anonymous free-message limit is hit. */
export function UsageLimitNotice() {
  return (
    <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/[0.06] p-4 text-center sm:p-5">
      <p className="text-sm font-medium">Free preview limit reached</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-black/60 dark:text-white/60">
        {LIMIT_REACHED_MESSAGE}
      </p>
      <a
        href={getSignInUrl()}
        className="mt-3 inline-block rounded-xl bg-indigo-600 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
      >
        Sign in with Syllabus Sync
      </a>
    </div>
  );
}
