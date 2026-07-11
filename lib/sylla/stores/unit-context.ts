'use client';

import { createLocalStore } from '@/lib/sylla/store';
import { findUnit } from '@/lib/sylla/units';
import type { StudyUnit } from '@/lib/sylla/types';

// Which unit Sylla is currently "studying in the context of".
// null = general chat (no unit context).

export const activeUnitStore = createLocalStore<string | null>('active-unit', null);

export function useActiveUnit(): StudyUnit | null {
  const id = activeUnitStore.use();
  return findUnit(id);
}

export function setActiveUnit(id: string | null) {
  activeUnitStore.set(id);
}
