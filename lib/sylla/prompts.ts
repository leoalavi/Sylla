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
 * Extra, per-request context. `studentContext` is the pre-formatted block from
 * lib/sylla/student-context.ts: the signed-in student's own Syllabus Sync
 * units, deadlines and to-dos (never official university records).
 */
export interface SyllaPromptContext {
  studentContext?: string;
}

/** Builds the system prompt for a request: the base prompt plus any context. */
export function buildSyllaSystemPrompt(context?: SyllaPromptContext): string {
  const studentContext = context?.studentContext?.trim();
  if (!studentContext) return SYLLA_SYSTEM_PROMPT;
  return `${SYLLA_SYSTEM_PROMPT}\n\n## Student context\n${studentContext}`;
}
