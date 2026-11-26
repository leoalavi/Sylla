'use client';

import { useSyncExternalStore } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { StudyUnit } from '@/lib/sylla/types';

// The signed-in student's own units from Syllabus Sync (shared Supabase
// project), read with their session so Row Level Security applies. Held in
// memory only and cleared on sign-out; never persisted in the browser.

const NO_UNITS: StudyUnit[] = [];
let units: StudyUnit[] = NO_UNITS;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

export function getStudentUnits(): StudyUnit[] {
  return units;
}

export function setStudentUnits(next: StudyUnit[]): void {
  units = next;
  emit();
}

export function useStudentUnits(): StudyUnit[] {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getStudentUnits,
    // Stable reference: a new [] per call makes React warn about an infinite loop.
    () => NO_UNITS,
  );
}

export async function loadStudentUnits(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    const { data, error } = await supabase
      .from('units')
      .select('id,code,name')
      .eq('user_id', userId)
      .is('deleted_at', null)
      .order('code', { ascending: true })
      .limit(50);
    setStudentUnits(
      error || !data
        ? []
        : data.map((u) => ({ id: u.id, code: u.code, name: u.name, period: '', sample: false })),
    );
  } catch {
    // Network or client failure: show no units rather than break the picker.
    setStudentUnits([]);
  }
}
