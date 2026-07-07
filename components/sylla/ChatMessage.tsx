import type { UIMessage } from 'ai';

/** Renders one chat turn. Only text parts exist in Phase 1. */
export function ChatMessage({ message }: { message: UIMessage }) {
  const isUser = message.role === 'user';
  const text = message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');

  return (
    <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] items-start gap-2.5 sm:max-w-[75%]`}>
        {!isUser && (
          <span
            aria-hidden
            className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-500/15 text-xs font-semibold text-indigo-500"
          >
            S
          </span>
        )}
        <div
          className={
            isUser
              ? 'rounded-2xl rounded-br-md bg-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-sm'
              : 'rounded-2xl rounded-bl-md border border-black/5 bg-black/[0.03] px-4 py-2.5 text-sm leading-relaxed dark:border-white/10 dark:bg-white/[0.06]'
          }
        >
          <p className="whitespace-pre-wrap break-words">{text}</p>
        </div>
      </div>
    </div>
  );
}
