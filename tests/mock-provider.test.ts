import { describe, expect, it } from 'vitest';
import { createMockStudyToolService } from '@/lib/sylla/ai/mock-provider';
import { StudyToolError } from '@/lib/sylla/ai/service';

const LONG_TEXT =
  'Photosynthesis converts light energy into chemical energy. Chlorophyll absorbs light in the thylakoid membranes. ' +
  'The light-dependent reactions produce ATP and NADPH. The Calvin cycle then fixes carbon dioxide into glucose.';

function service(scenario: 'normal' | 'empty' | 'error' = 'normal') {
  return createMockStudyToolService({ delayMs: 0, scenario });
}

describe('mock StudyToolService', () => {
  it('identifies itself as the mock provider', () => {
    expect(service().providerName).toBe('mock');
  });

  it('summarises material into overview, key points, and terms', async () => {
    const summary = await service().summarise({
      text: LONG_TEXT,
      title: 'Week 3 — Photosynthesis',
      style: 'concise',
      unit: null,
    });
    expect(summary.sourceTitle).toBe('Week 3 — Photosynthesis');
    expect(summary.overview).toContain('concise');
    expect(summary.keyPoints.length).toBeGreaterThan(0);
    expect(summary.keyPoints.length).toBeLessThanOrEqual(4);
    expect(summary.terms.length).toBeGreaterThan(0);
  });

  it('produces more key points for detailed summaries', async () => {
    const detailed = await service().summarise({
      text: LONG_TEXT,
      style: 'detailed',
      unit: null,
    });
    expect(detailed.keyPoints.length).toBeGreaterThanOrEqual(4);
  });

  it('generates exactly the requested number of flashcards', async () => {
    const set = await service().generateFlashcards({
      topic: 'SQL joins',
      count: 6,
      unit: null,
    });
    expect(set.cards).toHaveLength(6);
    expect(set.cards[0].front).not.toBe('');
    expect(set.cards[0].back).not.toBe('');
    expect(new Set(set.cards.map((c) => c.id)).size).toBe(6);
  });

  it('mixes short-answer questions into quizzes only when asked', async () => {
    const withSA = await service().generateQuiz({
      topic: 'supply and demand',
      count: 6,
      includeShortAnswer: true,
      unit: null,
    });
    expect(withSA.questions.some((q) => q.kind === 'short-answer')).toBe(true);

    const withoutSA = await service().generateQuiz({
      topic: 'supply and demand',
      count: 6,
      includeShortAnswer: false,
      unit: null,
    });
    expect(withoutSA.questions.every((q) => q.kind === 'multiple-choice')).toBe(true);
  });

  it('marks a valid correct option on every multiple-choice question', async () => {
    const quiz = await service().generateQuiz({
      topic: 'cells',
      count: 5,
      includeShortAnswer: false,
      unit: null,
    });
    for (const q of quiz.questions) {
      if (q.kind === 'multiple-choice') {
        expect(q.correctIndex).toBeGreaterThanOrEqual(0);
        expect(q.correctIndex).toBeLessThan(q.options.length);
      }
    }
  });

  it('builds a study plan with scheduled, undone tasks', async () => {
    const deadline = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10);
    const plan = await service().generateStudyPlan({
      goal: 'STAT1170 exam',
      deadline,
      hoursPerWeek: 6,
    });
    expect(plan.tasks.length).toBeGreaterThanOrEqual(3);
    expect(plan.tasks.every((t) => !t.done)).toBe(true);
    expect(plan.tasks.every((t) => t.minutes >= 25)).toBe(true);
  });

  it('returns empty results in the empty scenario', async () => {
    const set = await service('empty').generateFlashcards({ topic: 'x', count: 8, unit: null });
    expect(set.cards).toHaveLength(0);
    const summary = await service('empty').summarise({ text: LONG_TEXT, style: 'concise', unit: null });
    expect(summary.keyPoints).toHaveLength(0);
  });

  it('throws a retryable StudyToolError in the error scenario', async () => {
    await expect(
      service('error').explain({ concept: 'recursion', depth: 'intermediate', unit: null }),
    ).rejects.toThrowError(StudyToolError);
  });
});
