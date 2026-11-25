'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useSyncExternalStore } from 'react';
import { ChatView } from '@/components/chat/ChatView';
import { useSupabaseSession } from '@/lib/supabase/use-session';
import { getSignInUrl } from '@/lib/sylla/config';

// The referrer never changes for the life of the frame.
const subscribeToNothing = () => () => {};

export function EmbedChat() {
  const params = useSearchParams();
  const theme = params.get('theme');
  const session = useSupabaseSession();
  // Signing in happens in the top window; afterwards return to the
  // Syllabus Sync page that hosts this panel (the frame's referrer).
  const signInUrl = useSyncExternalStore(
    subscribeToNothing,
    () => getSignInUrl(document.referrer || undefined),
    () => getSignInUrl(),
  );

  // Match the host app's light/dark mode.
  useEffect(() => {
    if (theme === 'dark' || theme === 'light') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  return (
    <main className="flex h-full min-h-0 flex-1 flex-col bg-background">
      {session.ready && !session.isSignedIn && (
        <p role="status" className="border-b border-border/60 px-4 py-2 text-xs text-muted-foreground">
          Sylla can&apos;t see your Syllabus Sync session.{' '}
          <a href={signInUrl} target="_top" className="font-medium text-primary underline">
            Sign in again
          </a>{' '}
          to get answers based on your units and deadlines.
        </p>
      )}
      <ChatView conversationId={null} syncUrl={false} />
    </main>
  );
}
