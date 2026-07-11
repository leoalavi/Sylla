'use client';

import { useCallback, useState } from 'react';
import { ResultActions } from '@/components/tools/ResultActions';
import { SummaryResultView, summaryToMarkdown } from '@/components/tools/SummaryResultView';
import { ToolPage } from '@/components/tools/ToolPage';
import { useToolRunner } from '@/components/tools/useToolRunner';
import { btnPrimary, card, hint, input, label } from '@/components/ui/classes';
import { getStudyToolService, type SummariseInput } from '@/lib/sylla/ai';
import { saveItem } from '@/lib/sylla/stores/saved-items';
import { useSettings } from '@/lib/sylla/stores/settings';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import type { ResponseStyle, Summary } from '@/lib/sylla/types';

const MIN_CHARS = 80;

export function SummariseTool() {
  const settings = useSettings();
  const activeUnit = useActiveUnit();
  const runner = useToolRunner<SummariseInput, Summary>(
    useCallback((toolInput) => getStudyToolService().summarise(toolInput), []),
  );

  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [styleOverride, setStyleOverride] = useState<ResponseStyle | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const style = styleOverride ?? settings.responseStyle;
  const tooShort = text.trim().length < MIN_CHARS;

  const summary = runner.result;

  return (
    <ToolPage
      title="Summarise material"
      description="Paste study material and get an overview, key points, and important terms."
      example="a lecture transcript, a unit guide section, or your own notes."
      status={runner.status}
      errorMessage={runner.errorMessage}
      onRetry={runner.retry}
      onReset={runner.reset}
      resultIsEmpty={summary !== null && summary.keyPoints.length === 0 && !summary.overview}
      form={
        <form
          className={`${card} space-y-4 p-5`}
          onSubmit={(event) => {
            event.preventDefault();
            if (tooShort) {
              setShowValidation(true);
              return;
            }
            runner.run({ text, title: title || undefined, style, unit: activeUnit });
          }}
        >
          <div>
            <label htmlFor="summarise-title" className={label}>
              Title <span className="font-normal text-black/40 dark:text-white/40">(optional)</span>
            </label>
            <input
              id="summarise-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Week 4 lecture — Recursion"
              className={input}
            />
          </div>
          <div>
            <label htmlFor="summarise-text" className={label}>
              Study material
            </label>
            <textarea
              id="summarise-text"
              rows={8}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Paste the text you want summarised…"
              aria-invalid={showValidation && tooShort}
              aria-describedby="summarise-text-help"
              className={input}
            />
            <p
              id="summarise-text-help"
              className={`mt-1 text-xs ${showValidation && tooShort ? 'text-red-600 dark:text-red-400' : 'text-black/45 dark:text-white/45'}`}
            >
              {showValidation && tooShort
                ? `Please paste at least ${MIN_CHARS} characters so there is enough to summarise.`
                : `${text.trim().length} characters — minimum ${MIN_CHARS}.`}
            </p>
          </div>
          <div>
            <span className={label}>Summary style</span>
            <div className="flex gap-2" role="radiogroup" aria-label="Summary style">
              {(['concise', 'detailed'] as const).map((option) => (
                <label
                  key={option}
                  className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm capitalize transition-colors ${
                    style === option
                      ? 'border-indigo-400 bg-indigo-500/[0.08] font-medium text-indigo-600 dark:text-indigo-400'
                      : 'border-black/10 dark:border-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="summary-style"
                    className="sr-only"
                    checked={style === option}
                    onChange={() => setStyleOverride(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
          </div>
          <button type="submit" className={btnPrimary} disabled={runner.status === 'loading'}>
            Generate summary
          </button>
          <p className={hint}>Nothing you paste is stored — summaries live only on this device.</p>
        </form>
      }
    >
      {summary && (
        <>
          <SummaryResultView summary={summary} />
          <ResultActions
            copyText={summaryToMarkdown(summary)}
            onSave={() =>
              saveItem({ kind: 'summary', title: `Summary: ${summary.sourceTitle}`, summary })
            }
          />
        </>
      )}
    </ToolPage>
  );
}
