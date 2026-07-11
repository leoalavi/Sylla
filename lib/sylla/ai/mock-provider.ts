import {
  StudyToolError,
  type ExplainInput,
  type FlashcardsInput,
  type PlanInput,
  type QuizInput,
  type StudyToolService,
  type SummariseInput,
} from '@/lib/sylla/ai/service';
import {
  newId,
  type Explanation,
  type Flashcard,
  type FlashcardSet,
  type MockScenario,
  type Quiz,
  type QuizQuestion,
  type StudyPlan,
  type StudyTask,
  type Summary,
} from '@/lib/sylla/types';

// ============================================================================
// MOCK PROVIDER — development-only StudyToolService implementation.
//
// Produces deterministic, clearly-generic results derived from the user's
// input so the full UI (loading → result → save/copy/reset) is exercisable
// without any API key. Results are labelled as mock data in the UI via
// providerName === 'mock'.
//
// The active scenario ('normal' | 'slow' | 'empty' | 'error') comes from
// Settings → Developer, letting you test success, latency, empty and failure
// flows. Delete this file when the live provider ships.
// ============================================================================

export interface MockProviderOptions {
  /** Override latency (ms). Tests pass 0. */
  delayMs?: number;
  /** Fixed scenario; defaults to reading Settings → Developer at call time. */
  scenario?: MockScenario;
}

const NORMAL_DELAY_MS = 700;
const SLOW_DELAY_MS = 4000;

function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 12);
}

/** Deterministically picks "key terms": longer distinct words, in order. */
function keyTerms(text: string, max: number): string[] {
  const seen = new Set<string>();
  const terms: string[] = [];
  for (const raw of text.split(/[^A-Za-z0-9-]+/)) {
    const word = raw.trim();
    const lower = word.toLowerCase();
    if (word.length < 6 || seen.has(lower)) continue;
    seen.add(lower);
    terms.push(word[0].toUpperCase() + word.slice(1));
    if (terms.length >= max) break;
  }
  return terms;
}

function unitSuffix(unit: { code: string } | null): string {
  return unit ? ` (in the context of ${unit.code})` : '';
}

export function createMockStudyToolService(options: MockProviderOptions = {}): StudyToolService {
  async function begin(): Promise<MockScenario> {
    const scenario = options.scenario ?? (await readScenarioFromSettings());
    const delay =
      options.delayMs ?? (scenario === 'slow' ? SLOW_DELAY_MS : NORMAL_DELAY_MS);
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
    if (scenario === 'error') {
      throw new StudyToolError(
        'The study service is unavailable right now (simulated development error).',
      );
    }
    return scenario;
  }

  return {
    providerName: 'mock',

    async summarise(input: SummariseInput): Promise<Summary> {
      const scenario = await begin();
      const title = input.title?.trim() || 'Pasted study material';
      if (scenario === 'empty') {
        return {
          id: newId(),
          sourceTitle: title,
          overview: '',
          keyPoints: [],
          terms: [],
          followUps: [],
          createdAt: Date.now(),
        };
      }
      const lines = sentences(input.text);
      const pointCount = input.style === 'concise' ? 4 : 7;
      const keyPoints = lines
        .slice(0, pointCount)
        .map((s) => (s.length > 140 ? `${s.slice(0, 140)}…` : s));
      const terms = keyTerms(input.text, 4).map((term) => ({
        term,
        definition: `Placeholder definition of “${term}” drawn from your material — the live AI will define this properly.`,
      }));
      return {
        id: newId(),
        sourceTitle: title,
        overview: `A ${input.style} summary of “${title}”${unitSuffix(input.unit)} will appear here. This mock version restates the opening of your material so you can check the layout.`,
        keyPoints: keyPoints.length > 0 ? keyPoints : ['Your material was too short to extract key points from.'],
        terms,
        followUps: ['Generate flashcards from this summary', 'Quiz me on this material'],
        createdAt: Date.now(),
      };
    },

    async explain(input: ExplainInput): Promise<Explanation> {
      const scenario = await begin();
      const concept = input.concept.trim();
      if (scenario === 'empty') {
        return {
          id: newId(),
          concept,
          depth: input.depth,
          markdown: '',
          followUps: [],
          createdAt: Date.now(),
        };
      }
      const markdown = [
        `## ${concept}`,
        '',
        `This is a **mock ${input.depth} explanation**${unitSuffix(input.unit)} showing how a real answer will be structured once the AI provider is connected.`,
        '',
        '### The core idea',
        `A real explanation of *${concept}* opens with a one-paragraph intuition before introducing any formal detail.`,
        '',
        '### Step by step',
        `1. Define what ${concept} means in plain language.`,
        '2. Show the smallest useful example.',
        '3. Connect it to concepts you already know.',
        '4. Point out the most common misunderstanding.',
        '',
        '### Example',
        '```text',
        `worked example for: ${concept}`,
        '(the live AI replaces this block with a real example)',
        '```',
        '',
        '| Aspect | What to look for |',
        '| --- | --- |',
        `| Definition | Plain-language meaning of ${concept} |`,
        '| Common mistake | Where students usually go wrong |',
        '| Exam relevance | How it typically gets assessed |',
        '',
        '> Sylla flags uncertainty rather than guessing — when the live AI is unsure, it will say so and point you to official unit materials.',
      ].join('\n');
      return {
        id: newId(),
        concept,
        depth: input.depth,
        markdown,
        followUps: [`Give me practice questions on ${concept}`, `Explain ${concept} more simply`],
        createdAt: Date.now(),
      };
    },

    async generateFlashcards(input: FlashcardsInput): Promise<FlashcardSet> {
      const scenario = await begin();
      const topic = input.topic.trim();
      const cards: Flashcard[] =
        scenario === 'empty'
          ? []
          : Array.from({ length: input.count }, (_, i) => {
              const terms = keyTerms(`${topic} ${input.material ?? ''}`, input.count);
              const focus = terms[i % Math.max(terms.length, 1)] ?? topic;
              return {
                id: newId(),
                front: `Card ${i + 1}: What is the role of “${focus}” in ${topic}?`,
                back: `Mock answer ${i + 1} about ${focus}. The live AI will write a concise, accurate answer here based on your material.`,
              };
            });
      return {
        id: newId(),
        topic,
        unitId: input.unit?.id ?? null,
        cards,
        createdAt: Date.now(),
      };
    },

    async generateQuiz(input: QuizInput): Promise<Quiz> {
      const scenario = await begin();
      const topic = input.topic.trim();
      const questions: QuizQuestion[] =
        scenario === 'empty'
          ? []
          : Array.from({ length: input.count }, (_, i) => {
              const isShortAnswer = input.includeShortAnswer && i % 3 === 2;
              if (isShortAnswer) {
                return {
                  id: newId(),
                  kind: 'short-answer' as const,
                  prompt: `Practice question ${i + 1}: In your own words, describe one key aspect of ${topic}.`,
                  sampleAnswer: `A model answer about ${topic} will appear here when the live AI is connected.`,
                  explanation: 'Compare your answer with the sample — the live AI will give tailored feedback.',
                };
              }
              const correctIndex = i % 4;
              return {
                id: newId(),
                kind: 'multiple-choice' as const,
                prompt: `Question ${i + 1}: Which option best relates to ${topic}?`,
                options: [0, 1, 2, 3].map((o) =>
                  o === correctIndex
                    ? `The correct mock option for question ${i + 1}`
                    : `Distractor option ${o + 1} (mock)`,
                ),
                correctIndex,
                explanation: `Mock explanation for question ${i + 1}. The live AI will justify the correct answer using your unit material.`,
              };
            });
      return {
        id: newId(),
        topic,
        unitId: input.unit?.id ?? null,
        questions,
        createdAt: Date.now(),
      };
    },

    async generateStudyPlan(input: PlanInput): Promise<StudyPlan> {
      const scenario = await begin();
      if (scenario === 'empty') {
        return {
          id: newId(),
          goal: input.goal,
          deadline: input.deadline,
          hoursPerWeek: input.hoursPerWeek,
          notes: '',
          tasks: [],
          createdAt: Date.now(),
        };
      }
      const deadline = new Date(`${input.deadline}T12:00:00`);
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const daysLeft = Math.max(
        1,
        Math.round((deadline.getTime() - today.getTime()) / 86_400_000),
      );
      const sessionCount = Math.min(Math.max(3, Math.ceil(daysLeft / 2)), 10);
      const minutesPerSession = Math.max(
        25,
        Math.round((input.hoursPerWeek * 60) / Math.max(1, Math.min(sessionCount, 7))),
      );
      const stages = [
        'Skim the material and list what you already know about',
        'Read actively and take structured notes on',
        'Work through practice examples for',
        'Create flashcards covering the hardest parts of',
        'Test yourself without notes on',
        'Review mistakes and re-study weak spots in',
        'Do a full timed practice run of',
        'Final light review and summary of',
        'Rest and confidence pass over',
        'Buffer session for anything unfinished in',
      ];
      const formatter = new Intl.DateTimeFormat('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
      const tasks: StudyTask[] = Array.from({ length: sessionCount }, (_, i) => {
        const date = new Date(today.getTime() + Math.round((i * daysLeft) / sessionCount) * 86_400_000);
        return {
          id: newId(),
          label: `${stages[i % stages.length]} “${input.goal}”`,
          day: formatter.format(date),
          minutes: minutesPerSession,
          done: false,
        };
      });
      return {
        id: newId(),
        goal: input.goal,
        deadline: input.deadline,
        hoursPerWeek: input.hoursPerWeek,
        notes: input.priorities?.trim()
          ? `Prioritising: ${input.priorities.trim()}. (Mock plan — the live AI will weight sessions around these priorities.)`
          : 'Mock plan — the live AI will tailor session content to your actual material.',
        tasks,
        createdAt: Date.now(),
      };
    },
  };
}

async function readScenarioFromSettings(): Promise<MockScenario> {
  if (typeof window === 'undefined') return 'normal';
  // Dynamic import keeps this dev-only coupling out of the service interface.
  const { settingsStore } = await import('@/lib/sylla/stores/settings');
  return settingsStore.get().mockScenario;
}
