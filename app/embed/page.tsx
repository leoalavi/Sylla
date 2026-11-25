import type { Metadata } from 'next';
import { Suspense } from 'react';
import { EmbedChat } from './EmbedChat';

export const metadata: Metadata = {
  title: 'Assistant',
  robots: { index: false, follow: false },
};

/**
 * Sylla inside Syllabus Sync: the chat shown in Syllabus Sync's bottom-right
 * panel. Only Syllabus Sync's origins may frame it (see next.config.ts).
 */
export default function EmbedPage() {
  return (
    <Suspense fallback={null}>
      <EmbedChat />
    </Suspense>
  );
}
