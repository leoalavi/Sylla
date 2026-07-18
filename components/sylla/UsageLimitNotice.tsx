import { getSignInUrl, LIMIT_REACHED_MESSAGE } from '@/lib/sylla/config';

/** Shown in place of the input once the anonymous free-message limit is hit. */
export function UsageLimitNotice() {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 text-center sm:p-5">
      <p className="text-sm font-medium">Unlock Sylla with Syllabus Sync</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        {LIMIT_REACHED_MESSAGE}
      </p>
      <a
        href={getSignInUrl()}
        className="mt-3 inline-block rounded-xl bg-primary px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Sign in with Syllabus Sync
      </a>
    </div>
  );
}
