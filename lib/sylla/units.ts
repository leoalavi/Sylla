import { getStudentUnits } from '@/lib/sylla/student-units';
import type { StudyUnit } from '@/lib/sylla/types';

/**
 * SAMPLE unit data for development. Every entry is marked `sample: true` and
 * the UI labels them as sample data — Sylla must never present invented
 * university information as real.
 *
 * TODO(phase 2): replace with the student's own enrolled units from their
 * Syllabus Sync account (shared Supabase project), keeping this array only
 * as a fallback for signed-out demo mode.
 */
export const SAMPLE_UNITS: StudyUnit[] = [
  {
    id: 'sample-comp1000',
    code: 'COMP1000',
    name: 'Introduction to Programming',
    period: 'Session 2, 2026',
    sample: true,
  },
  {
    id: 'sample-stat1170',
    code: 'STAT1170',
    name: 'Introductory Statistics',
    period: 'Session 2, 2026',
    sample: true,
  },
  {
    id: 'sample-acct1501',
    code: 'ACCT1501',
    name: 'Accounting in Society',
    period: 'Session 2, 2026',
    sample: true,
  },
];

/** A unit by id: the signed-in student's own units first, then sample data. */
export function findUnit(id: string | null): StudyUnit | null {
  if (!id) return null;
  return getStudentUnits().find((u) => u.id === id) ?? SAMPLE_UNITS.find((u) => u.id === id) ?? null;
}
