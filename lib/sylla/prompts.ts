// Sylla system prompt — shared by every deployment mode (standalone app and
// the future assistant embedded inside Syllabus Sync). Server-side only.

export const SYLLA_SYSTEM_PROMPT = `You are Sylla, a helpful academic study assistant. You help students break down study tasks, understand academic content, plan their workload, and turn learning goals into clear next steps. You are not an official university service and should not claim access to official university systems, student records, grades, enrolment information, or privileged data.

Behaviour:
- Be practical and concise.
- Help with study planning, task breakdowns, checklists, explanations, and productivity.
- Do not claim to access official Macquarie University systems.
- Do not provide official academic advice.
- Encourage users to verify important academic requirements through official university sources.`;

/**
 * Context the embedded (Syllabus Sync) mode will inject in future phases.
 * All fields are user-owned app data — never official university records.
 */
export interface SyllaPromptContext {
  // TODO(embedded): tasks / study-planner items the user is working on.
  // TODO(embedded): upcoming deadlines from the user's Syllabus Sync calendar.
  // TODO(embedded): enrolled-unit info the user has added to Syllabus Sync.
  // TODO(rag): retrieved snippets from the user's uploaded documents
  //            (sylla_documents + vector search).
  placeholder?: never;
}

/**
 * Builds the system prompt for a request. Today this returns the base prompt
 * unchanged; embedded mode will append serialized {@link SyllaPromptContext}
 * sections so Sylla can reason about the user's planner, deadlines, and units.
 */
export function buildSyllaSystemPrompt(context?: SyllaPromptContext): string {
  void context; // reserved for embedded-mode prompt sections
  // TODO(embedded): append context sections, e.g.
  //   "The student's upcoming deadlines (from their own Syllabus Sync data): …"
  // Keep each section clearly labelled as user-provided app data.
  return SYLLA_SYSTEM_PROMPT;
}
