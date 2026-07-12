'use client';

import { useCallback, useState } from 'react';
import { QuizPlayer } from '@/components/tools/QuizPlayer';
import { ResultActions } from '@/components/tools/ResultActions';
import { ToolPage } from '@/components/tools/ToolPage';
import { useToolRunner } from '@/components/tools/useToolRunner';
import { btnPrimary, card, hint, input, label } from '@/components/ui/classes';
import { getStudyToolService, type QuizInput } from '@/lib/sylla/ai';
import { saveItem } from '@/lib/sylla/stores/saved-items';
import { useSettings } from '@/lib/sylla/stores/settings';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import type { Quiz } from '@/lib/sylla/types';

export function QuizTool() {
  const settings = useSettings();
  const activeUnit = useActiveUnit();
  const runner = useToolRunner<QuizInput, Quiz>(
    useCallback((toolInput) => getStudyToolService().generateQuiz(toolInput), []),
  );

  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [countOverride, setCountOverride] = useState<number | null>(null);
  const [includeShortAnswer, setIncludeShortAnswer] = useState(true);
  const [showValidation, setShowValidation] = useState(false);

  const count = countOverride ?? settings.defaultQuizCount;
  const invalid = topic.trim().length < 3;
  const quiz = runner.result;

  return (
    <ToolPage
      title="Quiz &amp; practice questions"
      description="Test yourself with multiple-choice and short-answer practice questions, with feedback after every answer."
      example="“supply and demand”, 5 questions, short answers on."
      status={runner.status}
      errorMessage={runner.errorMessage}
      onRetry={runner.retry}
      onReset={runner.reset}
      resultIsEmpty={quiz !== null && quiz.questions.length === 0}
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
              includeShortAnswer,
              unit: activeUnit,
            });
          }}
        >
          <div>
            <label htmlFor="quiz-topic" className={label}>
              Topic
            </label>
            <input
              id="quiz-topic"
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Newton's laws of motion"
              aria-invalid={showValidation && invalid}
              aria-describedby={showValidation && invalid ? 'quiz-topic-error' : undefined}
              className={input}
            />
            {showValidation && invalid && (
              <p id="quiz-topic-error" className="mt-1 text-xs text-red-600 dark:text-red-400">
                Enter a topic to be quizzed on (at least 3 characters).
              </p>
            )}
          </div>
          <div>
            <label htmlFor="quiz-material" className={label}>
              Source material{' '}
              <span className="font-normal text-black/40 dark:text-white/40">(optional)</span>
            </label>
            <textarea
              id="quiz-material"
              rows={4}
              value={material}
              onChange={(event) => setMaterial(event.target.value)}
              placeholder="Paste notes to base questions on…"
              className={input}
            />
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div className="max-w-40">
              <label htmlFor="quiz-count" className={label}>
                Questions
              </label>
              <input
                id="quiz-count"
                type="number"
                min={3}
                max={10}
                value={count}
                onChange={(event) => {
                  const parsed = Number.parseInt(event.target.value, 10);
                  if (Number.isFinite(parsed)) setCountOverride(Math.min(10, Math.max(3, parsed)));
                }}
                className={input}
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm">
              <input
                type="checkbox"
                checked={includeShortAnswer}
                onChange={(event) => setIncludeShortAnswer(event.target.checked)}
                className="accent-indigo-600"
              />
              Include short-answer practice questions
            </label>
          </div>
          <button type="submit" className={btnPrimary} disabled={runner.status === 'loading'}>
            Generate quiz
          </button>
          <p className={hint}>Multiple-choice answers are scored; short answers are self-checked.</p>
        </form>
      }
    >
      {quiz && (
        <>
          <QuizPlayer quiz={quiz} />
          <ResultActions
            onSave={() => saveItem({ kind: 'quiz', title: `Quiz: ${quiz.topic}`, quiz })}
          />
        </>
      )}
    </ToolPage>
  );
}
