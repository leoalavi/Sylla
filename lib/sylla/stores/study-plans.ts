'use client';

import { createLocalStore } from '@/lib/sylla/store';
import type { StudyPlan } from '@/lib/sylla/types';

// Study plans persist independently of saved items so task check-offs update
// in place. TODO(phase 2): move to Supabase alongside planner integration
// with Syllabus Sync's real task/deadline data.

export const studyPlansStore = createLocalStore<StudyPlan[]>('study-plans', []);

export function useStudyPlans(): StudyPlan[] {
  return studyPlansStore.use();
}

export function addStudyPlan(plan: StudyPlan) {
  studyPlansStore.set((prev) => [plan, ...prev].slice(0, 20));
}

export function toggleStudyTask(planId: string, taskId: string) {
  studyPlansStore.set((prev) =>
    prev.map((plan) =>
      plan.id === planId
        ? {
            ...plan,
            tasks: plan.tasks.map((t) => (t.id === taskId ? { ...t, done: !t.done } : t)),
          }
        : plan,
    ),
  );
}

export function deleteStudyPlan(planId: string) {
  studyPlansStore.set((prev) => prev.filter((plan) => plan.id !== planId));
}
