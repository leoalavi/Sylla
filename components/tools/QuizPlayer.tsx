'use client';

import { Check, RotateCcw, X } from 'lucide-react';
import { useState } from 'react';
import { btnPrimary, btnSecondary, card } from '@/components/ui/classes';
import type { Quiz } from '@/lib/sylla/types';

interface AnswerState {
  /** MCQ: chosen option index. Short answer: the typed text. */
  value: number | string | null;
  checked: boolean;
}

/**
 * One-question-at-a-time quiz flow: answer → check (feedback + explanation)
 * → next → score summary with retry. Short-answer questions are self-checked
 * against a sample answer.
 */
export function QuizPlayer({ quiz }: { quiz: Quiz }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>(() =>
    quiz.questions.map(() => ({ value: null, checked: false })),
  );
  const [finished, setFinished] = useState(false);

  const total = quiz.questions.length;
  if (total === 0) return null;

  function restart() {
    setIndex(0);
    setAnswers(quiz.questions.map(() => ({ value: null, checked: false })));
    setFinished(false);
  }

  if (finished) {
    const mcq = quiz.questions
      .map((q, i) => ({ q, a: answers[i] }))
      .filter(({ q }) => q.kind === 'multiple-choice');
    const correct = mcq.filter(
      ({ q, a }) => q.kind === 'multiple-choice' && a.value === q.correctIndex,
    ).length;
    const shortCount = total - mcq.length;
    return (
      <div className={`${card} p-6 text-center`} role="status">
        <p className="text-sm font-medium">Quiz complete</p>
        <p className="mt-2 text-3xl font-bold text-indigo-600 dark:text-indigo-400">
          {correct} / {mcq.length}
        </p>
        <p className="mt-1 text-sm text-black/55 dark:text-white/55">
          multiple-choice questions correct
          {shortCount > 0 && ` · ${shortCount} short-answer ${shortCount === 1 ? 'question' : 'questions'} self-checked`}
        </p>
        <button type="button" onClick={restart} className={`${btnSecondary} mt-5`}>
          <RotateCcw size={14} aria-hidden /> Try again
        </button>
      </div>
    );
  }

  const question = quiz.questions[index];
  const answer = answers[index];

  function setAnswer(patch: Partial<AnswerState>) {
    setAnswers((prev) => prev.map((a, i) => (i === index ? { ...a, ...patch } : a)));
  }

  const canCheck =
    !answer.checked &&
    (question.kind === 'multiple-choice'
      ? typeof answer.value === 'number'
      : typeof answer.value === 'string' && answer.value.trim().length > 0);

  const mcqCorrect =
    question.kind === 'multiple-choice' && answer.checked && answer.value === question.correctIndex;

  return (
    <div className={`${card} p-5`}>
      <p className="text-xs font-medium text-black/50 dark:text-white/50" aria-live="polite">
        Question {index + 1} of {total}
        {question.kind === 'short-answer' && ' · short answer'}
      </p>

      {question.kind === 'multiple-choice' ? (
        <fieldset className="mt-3" disabled={answer.checked}>
          <legend className="text-sm font-medium leading-relaxed">{question.prompt}</legend>
          <div className="mt-3 space-y-2">
            {question.options.map((option, optionIndex) => {
              const selected = answer.value === optionIndex;
              const showCorrect = answer.checked && optionIndex === question.correctIndex;
              const showWrong = answer.checked && selected && optionIndex !== question.correctIndex;
              return (
                <label
                  key={optionIndex}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    showCorrect
                      ? 'border-green-500/50 bg-green-500/[0.08]'
                      : showWrong
                        ? 'border-red-500/50 bg-red-500/[0.08]'
                        : selected
                          ? 'border-indigo-400 bg-indigo-500/[0.06]'
                          : 'border-black/10 hover:border-indigo-300 dark:border-white/12'
                  }`}
                >
                  <input
                    type="radio"
                    name={question.id}
                    checked={selected}
                    onChange={() => setAnswer({ value: optionIndex })}
                    className="accent-indigo-600"
                  />
                  <span className="flex-1">{option}</span>
                  {showCorrect && <Check size={15} className="text-green-600" aria-label="Correct answer" />}
                  {showWrong && <X size={15} className="text-red-600" aria-label="Your incorrect answer" />}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <div className="mt-3">
          <label htmlFor={`sa-${question.id}`} className="text-sm font-medium leading-relaxed">
            {question.prompt}
          </label>
          <textarea
            id={`sa-${question.id}`}
            rows={3}
            disabled={answer.checked}
            value={typeof answer.value === 'string' ? answer.value : ''}
            onChange={(event) => setAnswer({ value: event.target.value })}
            placeholder="Type your answer…"
            className="mt-2 w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-400 disabled:opacity-60 dark:border-white/15 dark:bg-white/[0.04]"
          />
          {answer.checked && (
            <div className="mt-2 rounded-xl border border-indigo-400/30 bg-indigo-500/[0.06] px-3 py-2.5 text-sm">
              <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                Sample answer
              </p>
              <p className="mt-1">{question.sampleAnswer}</p>
            </div>
          )}
        </div>
      )}

      {answer.checked && (
        <div role="status" className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2.5 text-sm dark:bg-white/[0.05]">
          {question.kind === 'multiple-choice' && (
            <p className={`font-medium ${mcqCorrect ? 'text-green-600' : 'text-red-600 dark:text-red-400'}`}>
              {mcqCorrect ? 'Correct!' : 'Not quite.'}
            </p>
          )}
          <p className="mt-0.5 text-black/60 dark:text-white/60">{question.explanation}</p>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {answer.checked ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => (index === total - 1 ? setFinished(true) : setIndex(index + 1))}
          >
            {index === total - 1 ? 'See results' : 'Next question'}
          </button>
        ) : (
          <button
            type="button"
            className={btnPrimary}
            disabled={!canCheck}
            onClick={() => setAnswer({ checked: true })}
          >
            Check answer
          </button>
        )}
      </div>
    </div>
  );
}
