import { ChatScreen } from '@/components/chat/ChatScreen';

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatScreen key={id} conversationId={id} />;
}
