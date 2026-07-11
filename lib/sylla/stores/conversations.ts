'use client';

import { createLocalStore } from '@/lib/sylla/store';
import { newId, type Conversation, type StoredMessage } from '@/lib/sylla/types';

// Local conversation history (Phase 1 persistence).
// TODO(phase 2): mirror to Supabase sylla_conversations / sylla_messages for
// signed-in users so history follows the account across devices and into the
// embedded assistant inside Syllabus Sync.

const MAX_CONVERSATIONS = 50;

export const conversationsStore = createLocalStore<Conversation[]>('conversations', []);

export function useConversations(): Conversation[] {
  return conversationsStore.use();
}

export function getConversation(id: string): Conversation | undefined {
  return conversationsStore.get().find((c) => c.id === id);
}

export function createConversation(unitId: string | null): Conversation {
  const now = Date.now();
  const conversation: Conversation = {
    id: newId(),
    title: 'New conversation',
    unitId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  conversationsStore.set((prev) => [conversation, ...prev].slice(0, MAX_CONVERSATIONS));
  return conversation;
}

/** Derives a list title from the first user message. */
export function titleFromMessages(messages: StoredMessage[]): string {
  const firstUser = messages.find((m) => m.role === 'user');
  const text = firstUser?.parts.map((p) => p.text).join(' ') ?? '';
  const trimmed = text.trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New conversation';
  return trimmed.length > 48 ? `${trimmed.slice(0, 48)}…` : trimmed;
}

export function saveConversationMessages(id: string, messages: StoredMessage[]) {
  conversationsStore.set((prev) =>
    prev.map((c) =>
      c.id === id
        ? {
            ...c,
            messages,
            title: c.title === 'New conversation' ? titleFromMessages(messages) : c.title,
            updatedAt: Date.now(),
          }
        : c,
    ),
  );
}

export function renameConversation(id: string, title: string) {
  const clean = title.trim();
  if (!clean) return;
  conversationsStore.set((prev) =>
    prev.map((c) => (c.id === id ? { ...c, title: clean, updatedAt: Date.now() } : c)),
  );
}

export function deleteConversation(id: string) {
  conversationsStore.set((prev) => prev.filter((c) => c.id !== id));
}
