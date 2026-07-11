// Sylla domain models. Shared by UI, stores, and the AI service layer.
// Keep these serializable — everything here may be persisted to localStorage
// today and to Supabase (sylla_* tables) in a later phase.

// ---------- Study context ----------

/**
 * A university unit the student can chat/study "in the context of".
 * `sample: true` marks development placeholder data; real units will be
 * loaded from the student's Syllabus Sync account (TODO: Supabase).
 */
export interface StudyUnit {
  id: string;
  code: string;
  name: string;
  period: string;
  sample: boolean;
}

// ---------- Conversations ----------

export interface StoredMessagePart {
  type: 'text';
  text: string;
}

/** Persisted chat message — a minimal, text-only projection of a UIMessage. */
export interface StoredMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  parts: StoredMessagePart[];
}

export interface Conversation {
  id: string;
  title: string;
  unitId: string | null;
  messages: StoredMessage[];
  createdAt: number;
  updatedAt: number;
}

// ---------- Study tool results ----------

export type ExplanationDepth = 'introductory' | 'intermediate' | 'advanced';
export type ResponseStyle = 'concise' | 'detailed';

export interface Flashcard {
  id: string;
  front: string;
  back: string;
}

export interface FlashcardSet {
  id: string;
  topic: string;
  unitId: string | null;
  cards: Flashcard[];
  createdAt: number;
}

export interface MultipleChoiceQuestion {
  id: string;
  kind: 'multiple-choice';
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShortAnswerQuestion {
  id: string;
  kind: 'short-answer';
  prompt: string;
  sampleAnswer: string;
  explanation: string;
}

export type QuizQuestion = MultipleChoiceQuestion | ShortAnswerQuestion;

export interface Quiz {
  id: string;
  topic: string;
  unitId: string | null;
  questions: QuizQuestion[];
  createdAt: number;
}

export interface SummaryTerm {
  term: string;
  definition: string;
}

export interface Summary {
  id: string;
  sourceTitle: string;
  overview: string;
  keyPoints: string[];
  terms: SummaryTerm[];
  followUps: string[];
  createdAt: number;
}

export interface Explanation {
  id: string;
  concept: string;
  depth: ExplanationDepth;
  markdown: string;
  followUps: string[];
  createdAt: number;
}

export interface StudyTask {
  id: string;
  label: string;
  day: string;
  minutes: number;
  done: boolean;
}

export interface StudyPlan {
  id: string;
  goal: string;
  deadline: string;
  hoursPerWeek: number;
  notes: string;
  tasks: StudyTask[];
  createdAt: number;
}

// ---------- Saved items ----------

export type SavedItem =
  | { id: string; kind: 'message'; title: string; markdown: string; createdAt: number }
  | { id: string; kind: 'summary'; title: string; summary: Summary; createdAt: number }
  | { id: string; kind: 'explanation'; title: string; explanation: Explanation; createdAt: number }
  | { id: string; kind: 'flashcards'; title: string; set: FlashcardSet; createdAt: number }
  | { id: string; kind: 'quiz'; title: string; quiz: Quiz; createdAt: number }
  | { id: string; kind: 'plan'; title: string; plan: StudyPlan; createdAt: number };

export type SavedItemKind = SavedItem['kind'];

// ---------- Settings ----------

export type ThemePreference = 'system' | 'light' | 'dark';

/** Developer-only switch for exercising mock AI states. */
export type MockScenario = 'normal' | 'slow' | 'empty' | 'error';

export interface SyllaSettings {
  theme: ThemePreference;
  /** Enter sends (Shift+Enter = newline) vs. Cmd/Ctrl+Enter sends. */
  sendOnEnter: boolean;
  responseStyle: ResponseStyle;
  explanationDepth: ExplanationDepth;
  defaultFlashcardCount: number;
  defaultQuizCount: number;
  mockScenario: MockScenario;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
