'use client';

import { useId } from 'react';
import { activeUnitStore, setActiveUnit } from '@/lib/sylla/stores/unit-context';
import { SAMPLE_UNITS } from '@/lib/sylla/units';
import { useStudentUnits } from '@/lib/sylla/student-units';
import { useSupabaseSession } from '@/lib/supabase/use-session';
import { hint } from '@/components/ui/classes';

/**
 * Chooses the unit context for a conversation. Signed-in students see their
 * own Syllabus Sync units; signed-out visitors see labelled sample units.
 */
export function UnitContextPicker({ compact = false }: { compact?: boolean }) {
  const selectId = useId();
  const activeId = activeUnitStore.use();
  const session = useSupabaseSession();
  const studentUnits = useStudentUnits();
  const signedIn = session.isSignedIn;

  return (
    <div>
      <label
        htmlFor={selectId}
        className={compact ? 'sr-only' : 'mb-1.5 block text-xs font-medium text-muted-foreground'}
      >
        Study context
      </label>
      <select
        id={selectId}
        value={activeId ?? ''}
        onChange={(event) => setActiveUnit(event.target.value || null)}
        className="w-full rounded-xl border border-border bg-input-bg px-3 py-2 text-sm outline-none transition-colors focus:border-primary"
      >
        <option value="">General — no unit context</option>
        {signedIn ? (
          studentUnits.length > 0 && (
            <optgroup label="Your Syllabus Sync units">
              {studentUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.code} — {unit.name}
                </option>
              ))}
            </optgroup>
          )
        ) : (
          <optgroup label="Sample units (sign in for your own)">
            {SAMPLE_UNITS.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.code} — {unit.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
      {!compact && (
        <p className={`mt-1.5 ${hint}`}>
          {signedIn
            ? studentUnits.length > 0
              ? 'Your units from Syllabus Sync.'
              : 'Add units in Syllabus Sync to see them here.'
            : 'Sample units. Sign in with Syllabus Sync to use your own.'}
        </p>
      )}
    </div>
  );
}
