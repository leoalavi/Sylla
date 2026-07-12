import type { Metadata } from 'next';
import { FlashcardsTool } from '@/components/tools/FlashcardsTool';

export const metadata: Metadata = { title: 'Flashcards' };

export default function FlashcardsPage() {
  return <FlashcardsTool />;
}
