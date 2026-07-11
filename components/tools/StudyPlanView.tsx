'use client';

import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { btnGhost, card } from '@/components/ui/classes';
import { deleteStudyPlan, toggleStudyTask } from '@/lib/sylla/stores/study-plans';
import type { StudyPlan } from '@/lib/sylla/types';

/**
 * A study plan with checkable tasks. Toggles persist to the plans store, so
 * progress survives reloads.
 */
export function StudyPlanView({ plan, onDeleted }: { plan: StudyPlan; onDeleted?: () => void }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const done = plan.tasks.filter((t) => t.done).length;

  return (
    <section className={`${card} p-5`} aria-label={`Study plan: ${plan.goal}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">{plan.goal}</h2>
          <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
            Due {new Date(`${plan.deadline}T12:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            {' · '}
            {plan.hoursPerWeek}h/week · {done}/{plan.tasks.length} sessions done
          </p>
        </div>
        <button
          type="button"
          onClick={() => setConfirmingDelete(true)}
          className={btnGhost}
          aria-label={`Delete plan “${plan.goal}”`}
        >
          <Trash2 size={13} aria-hidden /> Delete
        </button>
      </div>

      {plan.notes && (
        <p className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-black/60 dark:bg-white/[0.05] dark:text-white/60">
          {plan.notes}
        </p>
      )}

      <div
        aria-hidden
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-black/[0.06] dark:bg-white/[0.08]"
      >
        <div
          className="h-full rounded-full bg-indigo-500 transition-all"
          style={{ width: `${plan.tasks.length === 0 ? 0 : (done / plan.tasks.length) * 100}%` }}
        />
      </div>

      <ul className="mt-3 space-y-1.5">
        {plan.tasks.map((task) => (
          <li key={task.id}>
            <label
              className={`flex cursor-pointer items-start gap-3 rounded-xl border border-black/5 px-3 py-2.5 text-sm transition-colors hover:border-indigo-300 dark:border-white/10 ${
                task.done ? 'opacity-55' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleStudyTask(plan.id, task.id)}
                className="mt-0.5 accent-indigo-600"
              />
              <span className="flex-1">
                <span className={task.done ? 'line-through' : ''}>{task.label}</span>
                <span className="mt-0.5 block text-[11px] text-black/45 dark:text-white/45">
                  {task.day} · ~{task.minutes} min
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={confirmingDelete}
        title="Delete study plan?"
        description={`“${plan.goal}” and its progress will be removed from this device.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          deleteStudyPlan(plan.id);
          onDeleted?.();
        }}
        onClose={() => setConfirmingDelete(false)}
      />
    </section>
  );
}
