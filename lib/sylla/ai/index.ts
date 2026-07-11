import { createMockStudyToolService } from '@/lib/sylla/ai/mock-provider';
import type { StudyToolService } from '@/lib/sylla/ai/service';

// ============================================================================
// TODO(API integration): this is the ONE place to connect the real AI for
// study tools. Implement StudyToolService with calls to your server routes
// (keep keys server-side) and return it here — e.g.:
//
//   const live = createLiveStudyToolService();      // your implementation
//   export function getStudyToolService() { return live; }
//
// Full guide: docs/api-integration.md
// ============================================================================

const mockService = createMockStudyToolService();

export function getStudyToolService(): StudyToolService {
  return mockService;
}

export { StudyToolError } from '@/lib/sylla/ai/service';
export type {
  StudyToolService,
  SummariseInput,
  ExplainInput,
  FlashcardsInput,
  QuizInput,
  PlanInput,
} from '@/lib/sylla/ai/service';
