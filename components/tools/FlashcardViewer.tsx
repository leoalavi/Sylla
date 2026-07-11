'use client';

import { ChevronLeft, ChevronRight, RotateCcw, Shuffle } from 'lucide-react';
import { useState, type KeyboardEvent } from 'react';
import { btnGhost } from '@/components/ui/classes';
import type { FlashcardSet } from '@/lib/sylla/types';

function shuffled(length: number): number[] {
  const order = Array.from({ length }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * Front/back flashcard study interaction. Keyboard: ←/→ navigate,
 * Enter/Space flips (the card is a button).
 */
export function FlashcardViewer({ set }: { set: FlashcardSet }) {
  const [order, setOrder] = useState<number[]>(() => set.cards.map((_, i) => i));
  const [position, setPosition] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const total = set.cards.length;
  if (total === 0) return null;
  const card = set.cards[order[position]];

  function go(delta: number) {
    setPosition((p) => Math.min(Math.max(p + delta, 0), total - 1));
    setFlipped(false);
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      go(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      go(1);
    }
  }

  return (
    <section aria-label={`Flashcards: ${set.topic}`} onKeyDown={handleKeyDown}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-black/55 dark:text-white/55" aria-live="polite">
          Card {position + 1} of {total}
        </p>
        <div className="flex gap-1">
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setOrder(shuffled(total));
              setPosition(0);
              setFlipped(false);
            }}
          >
            <Shuffle size={13} aria-hidden /> Shuffle
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              setOrder(set.cards.map((_, i) => i));
              setPosition(0);
              setFlipped(false);
            }}
          >
            <RotateCcw size={13} aria-hidden /> Reset
          </button>
        </div>
      </div>

      <div
        aria-hidden
        className="mt-2 h-1 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${((position + 1) / total) * 100}%` }}
        />
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        aria-pressed={flipped}
        aria-label={flipped ? 'Showing answer — press to show question' : 'Showing question — press to reveal answer'}
        className="mt-3 flex min-h-44 w-full items-center justify-center rounded-2xl border border-black/10 bg-white p-6 text-center shadow-sm transition-colors hover:border-indigo-400 dark:border-white/12 dark:bg-white/[0.04]"
      >
        <span>
          <span className="block text-[11px] font-medium uppercase tracking-wide text-black/40 dark:text-white/40">
            {flipped ? 'Answer' : 'Question'} · tap to flip
          </span>
          <span className="mt-2 block text-sm leading-relaxed sm:text-base">
            {flipped ? card.back : card.front}
          </span>
        </span>
      </button>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => go(-1)}
          disabled={position === 0}
          className={btnGhost}
          aria-label="Previous card"
        >
          <ChevronLeft size={15} aria-hidden /> Previous
        </button>
        <button
          type="button"
          onClick={() => go(1)}
          disabled={position === total - 1}
          className={btnGhost}
          aria-label="Next card"
        >
          Next <ChevronRight size={15} aria-hidden />
        </button>
      </div>
    </section>
  );
}
