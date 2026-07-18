'use client';

import { useCallback, useState } from 'react';
import { StudyPlanView } from '@/components/tools/StudyPlanView';
import { ToolPage } from '@/components/tools/ToolPage';
import { useToolRunner } from '@/components/tools/useToolRunner';
import { btnPrimary, card, hint, input, label } from '@/components/ui/classes';
import { getStudyToolService, type PlanInput } from '@/lib/sylla/ai';
import { addStudyPlan, useStudyPlans } from '@/lib/sylla/stores/study-plans';
import type { StudyPlan } from '@/lib/sylla/types';

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function PlannerTool() {
  const plans = useStudyPlans();
  const runner = useToolRunner<PlanInput, StudyPlan>(
    useCallback(async (toolInput) => {
      const plan = await getStudyToolService().generateStudyPlan(toolInput);
      if (plan.tasks.length > 0) addStudyPlan(plan); // persist so check-offs survive reloads
      return plan;
    }, []),
  );

  const [goal, setGoal] = useState('');
  const [deadline, setDeadline] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState(6);
  const [priorities, setPriorities] = useState('');
  const [showValidation, setShowValidation] = useState(false);

  const goalInvalid = goal.trim().length < 3;
  const deadlineInvalid = !deadline || deadline <= todayISO();

  // Re-read the generated plan from the store so task check-offs are live.
  const generated = runner.result;
  const livePlan = generated ? (plans.find((p) => p.id === generated.id) ?? generated) : null;
  const otherPlans = plans.filter((p) => p.id !== generated?.id);

  return (
    <ToolPage
      title="Study planner"
      description="Turn a goal and a deadline into a checklist of scheduled study sessions."
      example="“ACCT1501 final exam”, due in three weeks, 6 hours a week."
      status={runner.status}
      errorMessage={runner.errorMessage}
      onRetry={runner.retry}
      onReset={runner.reset}
      resultIsEmpty={generated !== null && generated.tasks.length === 0}
      form={
        <>
          <form
            className={`${card} space-y-4 p-5`}
            onSubmit={(event) => {
              event.preventDefault();
              if (goalInvalid || deadlineInvalid) {
                setShowValidation(true);
                return;
              }
              runner.run({
                goal: goal.trim(),
                deadline,
                hoursPerWeek,
                priorities: priorities.trim() || undefined,
              });
            }}
          >
            <div>
              <label htmlFor="plan-goal" className={label}>
                What are you preparing for?
              </label>
              <input
                id="plan-goal"
                value={goal}
                onChange={(event) => setGoal(event.target.value)}
                placeholder="e.g. STAT1170 mid-session exam"
                aria-invalid={showValidation && goalInvalid}
                aria-describedby={showValidation && goalInvalid ? 'plan-goal-error' : undefined}
                className={input}
              />
              {showValidation && goalInvalid && (
                <p id="plan-goal-error" className="mt-1 text-xs text-destructive">
                  Describe the exam, assignment, or goal you&apos;re planning for.
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              <div>
                <label htmlFor="plan-deadline" className={label}>
                  Deadline
                </label>
                <input
                  id="plan-deadline"
                  type="date"
                  value={deadline}
                  min={todayISO()}
                  onChange={(event) => setDeadline(event.target.value)}
                  aria-invalid={showValidation && deadlineInvalid}
                  aria-describedby={showValidation && deadlineInvalid ? 'plan-deadline-error' : undefined}
                  className={input}
                />
                {showValidation && deadlineInvalid && (
                  <p id="plan-deadline-error" className="mt-1 text-xs text-destructive">
                    Pick a future date.
                  </p>
                )}
              </div>
              <div className="max-w-40">
                <label htmlFor="plan-hours" className={label}>
                  Hours per week
                </label>
                <input
                  id="plan-hours"
                  type="number"
                  min={1}
                  max={40}
                  value={hoursPerWeek}
                  onChange={(event) => {
                    const parsed = Number.parseInt(event.target.value, 10);
                    if (Number.isFinite(parsed)) setHoursPerWeek(Math.min(40, Math.max(1, parsed)));
                  }}
                  className={input}
                />
              </div>
            </div>
            <div>
              <label htmlFor="plan-priorities" className={label}>
                Priorities{' '}
                <span className="font-normal text-faint">(optional)</span>
              </label>
              <input
                id="plan-priorities"
                value={priorities}
                onChange={(event) => setPriorities(event.target.value)}
                placeholder="e.g. weakest on hypothesis testing"
                className={input}
              />
            </div>
            <button type="submit" className={btnPrimary} disabled={runner.status === 'loading'}>
              Build my plan
            </button>
            <p className={hint}>Plans are saved on this device — tick sessions off as you go.</p>
          </form>

          {otherPlans.length > 0 && (
            <section className="mt-6 space-y-3" aria-label="Your existing study plans">
              <h2 className="text-sm font-semibold text-muted-foreground">Your plans</h2>
              {otherPlans.map((plan) => (
                <StudyPlanView key={plan.id} plan={plan} />
              ))}
            </section>
          )}
        </>
      }
    >
      {livePlan && <StudyPlanView plan={livePlan} onDeleted={runner.reset} />}
    </ToolPage>
  );
}
