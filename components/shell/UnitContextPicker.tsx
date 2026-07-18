'use client';

import { useId } from 'react';
import { activeUnitStore, setActiveUnit } from '@/lib/sylla/stores/unit-context';
import { SAMPLE_UNITS } from '@/lib/sylla/units';
import { hint } from '@/components/ui/classes';

/**
 * Chooses the unit context Sylla responds in. Units shown here are SAMPLE
 * data — real enrolled units will come from the student's Syllabus Sync
 * account in a later phase (TODO in lib/sylla/units.ts).
 */
export function UnitContextPicker({ compact = false }: { compact?: boolean }) {
  const selectId = useId();
  const activeId = activeUnitStore.use();

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
        <optgroup label="Sample units (development data)">
          {SAMPLE_UNITS.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.code} — {unit.name}
            </option>
          ))}
        </optgroup>
      </select>
      {!compact && (
        <p className={`mt-1.5 ${hint}`}>
          Sample units for now — your real Syllabus Sync units will connect in a later phase.
        </p>
      )}
    </div>
  );
}
