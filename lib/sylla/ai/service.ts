import type {
  Explanation,
  ExplanationDepth,
  FlashcardSet,
  Quiz,
  ResponseStyle,
  StudyPlan,
  StudyUnit,
  Summary,
} from '@/lib/sylla/types';

// ============================================================================
// StudyToolService — THE integration boundary for Sylla's study tools.
//
// The UI only ever talks to this interface. Today the only implementation is
// the deterministic mock provider (./mock-provider.ts). To connect the real
// AI, implement this interface with calls to your server routes and return
// it from getStudyToolService() in ./index.ts — no UI changes required.
// See docs/api-integration.md for the step-by-step guide.
//
// (Conversational chat has its own boundary: app/api/sylla/chat/route.ts,
// which already streams via the AI SDK and runs keyless with a mock reply.)
// ============================================================================

export interface SummariseInput {
  /** The study material to summarise (pasted text for now; files later). */
  text: string;
  title?: string;
  style: ResponseStyle;
  unit: StudyUnit | null;
}

export interface ExplainInput {
  concept: string;
  depth: ExplanationDepth;
  unit: StudyUnit | null;
}

export interface FlashcardsInput {
  topic: string;
  /** Optional pasted source material to draw cards from. */
  material?: string;
  count: number;
  unit: StudyUnit | null;
}

export interface QuizInput {
  topic: string;
  material?: string;
  count: number;
  /** Mix in short-answer (practice) questions alongside multiple choice. */
  includeShortAnswer: boolean;
  unit: StudyUnit | null;
}

export interface PlanInput {
  goal: string;
  /** ISO date (yyyy-mm-dd). */
  deadline: string;
  hoursPerWeek: number;
  priorities?: string;
}

/** Thrown by providers for failures the UI should offer a retry for. */
export class StudyToolError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = true) {
    super(message);
    this.name = 'StudyToolError';
    this.retryable = retryable;
  }
}

export interface StudyToolService {
  /** 'mock' results are badged as development data in the UI. */
  readonly providerName: 'mock' | 'live';
  summarise(input: SummariseInput): Promise<Summary>;
  explain(input: ExplainInput): Promise<Explanation>;
  generateFlashcards(input: FlashcardsInput): Promise<FlashcardSet>;
  generateQuiz(input: QuizInput): Promise<Quiz>;
  generateStudyPlan(input: PlanInput): Promise<StudyPlan>;
}
