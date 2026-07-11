'use client';

import { useRouter } from 'next/navigation';
import { useCallback } from 'react';
import { setDraft } from '@/lib/sylla/stores/drafts';
import { bumpNewChat } from '@/lib/sylla/stores/new-chat';

/** Opens a fresh chat with the composer pre-filled (user still hits send). */
export function useStartChat() {
  const router = useRouter();
  return useCallback(
    (prompt: string) => {
      bumpNewChat();
      setDraft('draft', prompt);
      router.push('/chat');
    },
    [router],
  );
}
