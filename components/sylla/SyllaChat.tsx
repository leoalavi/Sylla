'use client';

import { SyllaChatPanel } from '@/components/sylla/SyllaChatPanel';
import { UsageLimitNotice } from '@/components/sylla/UsageLimitNotice';
import { useAnonymousLimit } from '@/lib/sylla/usage-limit';

/**
 * Standalone-mode Sylla chat: the shared `SyllaChatPanel` plus the
 * standalone-only policy — an anonymous free-message allowance that ends in
 * a "sign in with Syllabus Sync" gate.
 *
 * The embedded assistant inside Syllabus Sync will NOT use this wrapper
 * (users there are already signed in); it composes `SyllaChatPanel` directly.
 */
export function SyllaChat() {
  const { ready, isSignedIn, remaining, limitReached, recordMessageSent } = useAnonymousLimit();

  const inputHint =
    ready && !isSignedIn && !limitReached
      ? `${remaining} free ${remaining === 1 ? 'message' : 'messages'} remaining`
      : undefined;

  return (
    <SyllaChatPanel
      disabled={!ready}
      inputHint={inputHint}
      gated={limitReached}
      gateNotice={<UsageLimitNotice />}
      onMessageSent={recordMessageSent}
    />
  );
}
