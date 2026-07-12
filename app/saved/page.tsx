import type { Metadata } from 'next';
import { SavedScreen } from '@/components/saved/SavedScreen';

export const metadata: Metadata = { title: 'Saved' };

export default function SavedPage() {
  return <SavedScreen />;
}
