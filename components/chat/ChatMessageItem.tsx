'use client';

import type { UIMessage } from 'ai';
import { BookOpen, Bookmark, Check, Copy, Pencil, RefreshCw, X } from 'lucide-react';
import { useState } from 'react';
import { Markdown } from '@/components/chat/Markdown';
import { btnGhost, btnPrimary, btnSecondary } from '@/components/ui/classes';
import { saveItem } from '@/lib/sylla/stores/saved-items';

export function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is Extract<typeof part, { type: 'text' }> => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

interface ChatMessageItemProps {
  message: UIMessage;
  /** Offer "Regenerate" (last assistant message only). */
  onRegenerate?: () => void;
  /** Offer "Edit & resend" (user messages). */
  onEditResend?: (newText: string) => void;
  /** Hide the actions row (while this message is still streaming). */
  busy?: boolean;
}

export function ChatMessageItem({ message, onRegenerate, onEditResend, busy }: ChatMessageItemProps) {
  const isUser = message.role === 'user';
  const text = messageText(message);
  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(text);

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable — nothing sensible to do.
    }
  }

  function saveMessage() {
    saveItem({
      kind: 'message',
      title: text.replace(/\s+/g, ' ').slice(0, 60) || 'Saved message',
      markdown: text,
    });
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1500);
  }

  if (editing) {
    return (
      <div className="flex w-full justify-end">
        <div className="w-full max-w-[85%] rounded-2xl border border-indigo-400/50 bg-white p-3 dark:bg-white/[0.04] sm:max-w-[75%]">
          <label htmlFor={`edit-${message.id}`} className="sr-only">
            Edit message
          </label>
          <textarea
            id={`edit-${message.id}`}
            value={editText}
            onChange={(event) => setEditText(event.target.value)}
            rows={3}
            className="w-full resize-y bg-transparent text-sm outline-none"
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" className={btnSecondary} onClick={() => setEditing(false)}>
              <X size={14} aria-hidden /> Cancel
            </button>
            <button
              type="button"
              className={btnPrimary}
              disabled={!editText.trim()}
              onClick={() => {
                setEditing(false);
                onEditResend?.(editText.trim());
              }}
            >
              Resend
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`group flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] flex-col sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div className="flex items-start gap-2.5">
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
                : 'min-w-0 rounded-2xl rounded-bl-md border border-black/5 bg-black/[0.03] px-4 py-2.5 dark:border-white/10 dark:bg-white/[0.06]'
            }
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{text}</p>
            ) : (
              <Markdown>{text}</Markdown>
            )}
          </div>
        </div>

        {!busy && (
          <div
            className={`mt-1 flex items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100 ${
              isUser ? '' : 'pl-9'
            }`}
          >
            <button type="button" onClick={copyMessage} className={btnGhost} aria-label="Copy message">
              {copied ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            {!isUser && (
              <button type="button" onClick={saveMessage} className={btnGhost} aria-label="Save message">
                {savedFlash ? <Check size={13} aria-hidden /> : <Bookmark size={13} aria-hidden />}
                {savedFlash ? 'Saved' : 'Save'}
              </button>
            )}
            {isUser && onEditResend && (
              <button
                type="button"
                onClick={() => {
                  setEditText(text);
                  setEditing(true);
                }}
                className={btnGhost}
                aria-label="Edit and resend message"
              >
                <Pencil size={13} aria-hidden /> Edit
              </button>
            )}
            {onRegenerate && (
              <button type="button" onClick={onRegenerate} className={btnGhost} aria-label="Regenerate response">
                <RefreshCw size={13} aria-hidden /> Regenerate
              </button>
            )}
            {!isUser && (
              // Placeholder for future trusted-source citations (RAG phase).
              <span className={`${btnGhost} cursor-default hover:bg-transparent`} title="Responses will cite trusted unit sources once source integration ships.">
                <BookOpen size={13} aria-hidden /> No sources yet
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
