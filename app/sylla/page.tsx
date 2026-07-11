import { redirect } from 'next/navigation';

// Legacy route from Phase 1 — the chat now lives at /chat.
export default function LegacySyllaPage() {
  redirect('/chat');
}
