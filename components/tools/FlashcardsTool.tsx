'use client';

import { useCallback, useState } from 'react';
import { FlashcardViewer } from '@/components/tools/FlashcardViewer';
import { ResultActions } from '@/components/tools/ResultActions';
import { ToolPage } from '@/components/tools/ToolPage';
import { useToolRunner } from '@/components/tools/useToolRunner';
import { btnPrimary, card, input, label } from '@/components/ui/classes';
import { getStudyToolService, type FlashcardsInput } from '@/lib/sylla/ai';
import { saveItem } from '@/lib/sylla/stores/saved-items';
import { useSettings } from '@/lib/sylla/stores/settings';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import type { FlashcardSet } from '@/lib/sylla/types';

export function setToMarkdown(set: FlashcardSet): string {
  return [
    `# Flashcards: ${set.topic}`,
    '',
    ...set.cards.flatMap((c, i) => [`${i + 1}. **Q:** ${c.front}`, `   **A:** ${c.back}`]),
  ].join('\n');
}

export function FlashcardsTool() {
  const settings = useSettings();
  const activeUnit = useActiveUnit();
  const runner = useToolRunner<FlashcardsInput, FlashcardSet>(
    useCallback((toolInput) => getStudyToolService().generateFlashcards(toolInput), []),
  );

  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [countOverride, setCountOverride] = useState<number | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const count = countOverride ?? settings.defaultFlashcardCount;
  const invalid = topic.trim().length < 3;
  const set = runner.result;

  return (
    <ToolPage
      title="Generate flashcards"
      description="Create a front/back deck from a topic — optionally grounded in your own pasted material."
      example="“SQL joins”, with your week-6 lecture notes pasted below."
      status={runner.status}
      errorMessage={runner.errorMessage}
      onRetry={runner.retry}
      onReset={runner.reset}
      resultIsEmpty={set !== null && set.cards.length === 0}
      form={
        <form
          className={`${card} space-y-4 p-5`}
          onSubmit={(event) => {
            event.preventDefault();
            if (invalid) {
              setShowValidation(true);
              return;
            }
            runner.run({
              topic: topic.trim(),
              material: material.trim() || undefined,
              count,
              unit: activeUnit,
            });
          }}
        >
          <div>
            <label htmlFor="flashcards-topic" className={label}>
              Topic
            </label>
            <input
              id="flashcards-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Cell membrane transport"
              aria-invalid={showValidation && invalid}
              aria-describedby={showValidation && invalid ? 'flashcards-topic-error' : undefined}
              className={input}
            />
            {showValidation && invalid && (
              <p id="flashcards-topic-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                Enter a topic for the deck (at least 3 characters).
              </p>
            )}
          </div>
          <div>
            <label htmlFor="flashcards-material" className={label}>
              Source material{' '}
              <span className="font-normal text-black/40 dark:text-white/40">(optional)</span>
            </label>
            <textarea
              id="flashcards-material"
              rows={4}
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              placeholder="Paste notes or readings to draw cards from…"
              className={input}
            />
          </div>
          <div className="max-w-40">
            <label htmlFor="flashcards-count" className={label}>
              Number of cards
            </label>
            <input
              id="flashcards-count"
              type="number"
              min={4}
              max={20}
              value={count}
              onChange={(event) => {
                const parsed = Number.parseInt(event.target.value, 10);
                if (Number.isFinite(parsed)) setCountOverride(Math.min(20, Math.max(4, parsed)));
              }}
              className={input}
            />
          </div>
          <button type="submit" className={btnPrimary} disabled={runner.status === 'loading'}>
            Generate flashcards
          </button>
        </form>
      }
    >
      {set && (
        <>
          <FlashcardViewer set={set} />
          <ResultActions
            copyText={setToMarkdown(set)}
            onSave={() => saveItem({ kind: 'flashcards', title: `Flashcards: ${set.topic}`, set })}
          />
        </>
      )}
    </ToolPage>
  );
}
