'use client';

import { ChatScreen } from '@/components/chat/ChatScreen';
import { useNewChatNonce } from '@/lib/sylla/stores/new-chat';

export default function ChatPage() {
  // Keyed by the new-chat nonce so "New chat" always yields a fresh composer,
  // even when /chat is already mounted.
  const nonce = useNewChatNonce();
  return <ChatScreen key={`new-${nonce}`} conversationId={null} />;
}
