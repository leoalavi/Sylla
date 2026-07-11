'use client';

import { Bookmark, Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { btnSecondary } from '@/components/ui/classes';

interface ResultActionsProps {
  /** Markdown/plain-text serialization for the clipboard. */
  copyText?: string;
  /** Persists the result; return false if already saved. */
  onSave?: () => void;
}

/** Copy/save row used under every tool result. */
export function ResultActions({ copyText, onSave }: ResultActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="mt-3 flex gap-2">
      {copyText !== undefined && (
        <button
          type="button"
          className={btnSecondary}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(copyText);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              // Clipboard unavailable.
            }
          }}
        >
          {copied ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      )}
      {onSave && (
        <button
          type="button"
          className={btnSecondary}
          disabled={saved}
          onClick={() => {
            onSave();
            setSaved(true);
          }}
        >
          {saved ? <Check size={14} aria-hidden /> : <Bookmark size={14} aria-hidden />}
          {saved ? 'Saved' : 'Save'}
        </button>
      )}
    </div>
  );
}
