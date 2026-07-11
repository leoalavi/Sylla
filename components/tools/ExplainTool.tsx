'use client';

import { useCallback, useState } from 'react';
import { Markdown } from '@/components/chat/Markdown';
import { useStartChat } from '@/components/chat/useStartChat';
import { ResultActions } from '@/components/tools/ResultActions';
import { ToolPage } from '@/components/tools/ToolPage';
import { useToolRunner } from '@/components/tools/useToolRunner';
import { btnPrimary, card, input, label } from '@/components/ui/classes';
import { getStudyToolService, type ExplainInput } from '@/lib/sylla/ai';
import { saveItem } from '@/lib/sylla/stores/saved-items';
import { useSettings } from '@/lib/sylla/stores/settings';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import type { Explanation, ExplanationDepth } from '@/lib/sylla/types';

const DEPTHS: ExplanationDepth[] = ['introductory', 'intermediate', 'advanced'];

export function ExplainTool() {
  const settings = useSettings();
  const activeUnit = useActiveUnit();
  const startChat = useStartChat();
  const runner = useToolRunner<ExplainInput, Explanation>(
    useCallback((toolInput) => getStudyToolService().explain(toolInput), []),
  );

  const [concept, setConcept] = useState('');
  const [depthOverride, setDepthOverride] = useState<ExplanationDepth | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const depth = depthOverride ?? settings.explanationDepth;
  const invalid = concept.trim().length < 3;
  const explanation = runner.result;

  return (
    <ToolPage
      title="Explain a concept"
      description="Get a structured, plain-language explanation at the depth you choose."
      example="“binary search trees”, “opportunity cost”, or “the Krebs cycle”."
      status={runner.status}
      errorMessage={runner.errorMessage}
      onRetry={runner.retry}
      onReset={runner.reset}
      resultIsEmpty={explanation !== null && !explanation.markdown}
      form={
        <form
          className={`${card} space-y-4 p-5`}
          onSubmit={(event) => {
            event.preventDefault();
            if (invalid) {
              setShowValidation(true);
              return;
            }
            runner.run({ concept: concept.trim(), depth, unit: activeUnit });
          }}
        >
          <div>
            <label htmlFor="explain-concept" className={label}>
              Concept to explain
            </label>
            <input
              id="explain-concept"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              placeholder="e.g. Normalisation in databases"
              aria-invalid={showValidation && invalid}
              aria-describedby={showValidation && invalid ? 'explain-concept-error' : undefined}
              className={input}
            />
            {showValidation && invalid && (
              <p id="explain-concept-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                Enter the concept you want explained (at least 3 characters).
              </p>
            )}
          </div>
          <div>
            <label htmlFor="explain-depth" className={label}>
              Depth
            </label>
            <select
              id="explain-depth"
              value={depth}
              onChange={(event) => setDepthOverride(event.target.value as ExplanationDepth)}
              className={input}
            >
              {DEPTHS.map((d) => (
                <option key={d} value={d}>
                  {d[0].toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className={btnPrimary} disabled={runner.status === 'loading'}>
            Explain it
          </button>
        </form>
      }
    >
      {explanation && (
        <>
          <article className={`${card} p-5`}>
            <Markdown>{explanation.markdown}</Markdown>
          </article>
          {explanation.followUps.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {explanation.followUps.map((followUp) => (
                <button
                  key={followUp}
                  type="button"
                  onClick={() => startChat(followUp)}
                  className="rounded-full border border-black/10 px-3 py-1.5 text-xs transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:hover:text-indigo-400"
                >
                  {followUp}
                </button>
              ))}
            </div>
          )}
          <ResultActions
            copyText={explanation.markdown}
            onSave={() =>
              saveItem({ kind: 'explanation', title: `Explanation: ${explanation.concept}`, explanation })
            }
          />
        </>
      )}
    </ToolPage>
  );
}
