import { redirect } from 'next/navigation';

// Sylla is the whole product in this app; the chat lives at /sylla.
export default function RootPage() {
  redirect('/sylla');
}
