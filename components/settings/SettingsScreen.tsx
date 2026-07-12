'use client';

import { useId, useState, type ReactNode } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { btnDanger, card, hint, input } from '@/components/ui/classes';
import { useSupabaseSession } from '@/lib/supabase/use-session';
import { getSignInUrl, SYLLA_DISCLAIMER } from '@/lib/sylla/config';
import {
  clearLocalStudyData,
  updateSettings,
  useSettings,
} from '@/lib/sylla/stores/settings';
import { useAIConfigured } from '@/lib/sylla/use-ai-status';
import type { ExplanationDepth, MockScenario, ResponseStyle, ThemePreference } from '@/lib/sylla/types';

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <section className={`${card} p-5`} aria-label={title}>
      <h2 className="text-sm font-semibold">{title}</h2>
      {description && <p className={`mt-1 ${hint}`}>{description}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, htmlFor, children, help }: { label: string; htmlFor?: string; children: ReactNode; help?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
      <div className="min-w-40">
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
        {help && <p className={hint}>{help}</p>}
      </div>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, labelledBy }: { checked: boolean; onChange: (next: boolean) => void; labelledBy: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition-colors ${
        checked ? 'bg-indigo-600' : 'bg-black/20 dark:bg-white/20'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
          checked ? 'left-[22px]' : 'left-0.5'
        }`}
      />
    </button>
  );
}

export function SettingsScreen() {
  const settings = useSettings();
  const session = useSupabaseSession();
  const aiConfigured = useAIConfigured();
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [cleared, setCleared] = useState(false);
  const sendOnEnterLabelId = useId();

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-8 sm:px-6 sm:py-10">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
      </header>

      <Section title="Appearance">
        <Row label="Theme">
          <div className="flex gap-2" role="radiogroup" aria-label="Theme">
            {(['system', 'light', 'dark'] as ThemePreference[]).map((option) => (
              <label
                key={option}
                className={`cursor-pointer rounded-xl border px-3 py-1.5 text-sm capitalize transition-colors ${
                  settings.theme === option
                    ? 'border-indigo-400 bg-indigo-500/[0.08] font-medium text-indigo-600 dark:text-indigo-400'
                    : 'border-black/10 dark:border-white/15'
                }`}
              >
                <input
                  type="radio"
                  name="theme"
                  className="sr-only"
                  checked={settings.theme === option}
                  onChange={() => updateSettings({ theme: option })}
                />
                {option}
              </label>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Chat behaviour">
        <Row
          label="Enter sends message"
          help="Off: Enter makes a new line, Cmd/Ctrl+Enter sends."
        >
          <span id={sendOnEnterLabelId} className="sr-only">
            Enter sends message
          </span>
          <Toggle
            checked={settings.sendOnEnter}
            onChange={(next) => updateSettings({ sendOnEnter: next })}
            labelledBy={sendOnEnterLabelId}
          />
        </Row>
        <Row label="Response style" htmlFor="setting-style" help="Used as the default for summaries; sent to the AI once connected.">
          <select
            id="setting-style"
            value={settings.responseStyle}
            onChange={(event) => updateSettings({ responseStyle: event.target.value as ResponseStyle })}
            className={`${input} max-w-44`}
          >
            <option value="concise">Concise</option>
            <option value="detailed">Detailed</option>
          </select>
        </Row>
      </Section>

      <Section title="Study preferences" description="Defaults for the study tools — you can still change them per run.">
        <Row label="Explanation depth" htmlFor="setting-depth">
          <select
            id="setting-depth"
            value={settings.explanationDepth}
            onChange={(event) =>
              updateSettings({ explanationDepth: event.target.value as ExplanationDepth })
            }
            className={`${input} max-w-44`}
          >
            <option value="introductory">Introductory</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </Row>
        <Row label="Flashcards per deck" htmlFor="setting-cards">
          <input
            id="setting-cards"
            type="number"
            min={4}
            max={20}
            value={settings.defaultFlashcardCount}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(parsed))
                updateSettings({ defaultFlashcardCount: Math.min(20, Math.max(4, parsed)) });
            }}
            className={`${input} max-w-24`}
          />
        </Row>
        <Row label="Quiz questions" htmlFor="setting-questions">
          <input
            id="setting-questions"
            type="number"
            min={3}
            max={10}
            value={settings.defaultQuizCount}
            onChange={(event) => {
              const parsed = Number.parseInt(event.target.value, 10);
              if (Number.isFinite(parsed))
                updateSettings({ defaultQuizCount: Math.min(10, Math.max(3, parsed)) });
            }}
            className={`${input} max-w-24`}
          />
        </Row>
      </Section>

      <Section title="Account" description="Sylla shares its accounts with Syllabus Sync.">
        {session.isSignedIn ? (
          <p className="text-sm">
            Signed in as <span className="font-medium">{session.email}</span>
          </p>
        ) : (
          <p className="text-sm">
            You&apos;re browsing anonymously.{' '}
            <a
              href={getSignInUrl()}
              className="font-medium text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
            >
              Sign in with Syllabus Sync
            </a>{' '}
            to lift the free-message limit. Saved history synced to your account is coming in a
            later phase.
          </p>
        )}
      </Section>

      <Section
        title="Data & privacy"
        description="Conversations, saved items, study plans, and preferences are stored only in this browser. Chat messages are sent to Sylla's chat endpoint to generate replies; study-tool inputs currently stay on-device (mock mode)."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnDanger} onClick={() => setConfirmingClear(true)}>
            Clear local study data
          </button>
          {cleared && (
            <span role="status" className="text-xs text-green-600">
              Local study data cleared.
            </span>
          )}
        </div>
      </Section>

      <Section
        title="Developer"
        description="Development-only controls for exercising the mock AI service."
      >
        <Row
          label="Mock scenario"
          htmlFor="setting-scenario"
          help="Applies to the study tools: normal, slow (~4s), empty result, or a simulated error."
        >
          <select
            id="setting-scenario"
            value={settings.mockScenario}
            onChange={(event) => updateSettings({ mockScenario: event.target.value as MockScenario })}
            className={`${input} max-w-44`}
          >
            <option value="normal">Normal</option>
            <option value="slow">Slow response</option>
            <option value="empty">Empty response</option>
            <option value="error">Service error</option>
          </select>
        </Row>
        <p className={hint}>
          Chat AI provider:{' '}
          {aiConfigured === null
            ? 'checking…'
            : aiConfigured
              ? 'configured (live model)'
              : 'not configured — chat streams a canned mock reply'}
        </p>
      </Section>

      <Section title="About">
        <p className="text-sm text-black/60 dark:text-white/60">
          Sylla is an AI study assistant in the Syllabus Sync ecosystem — it helps you summarise
          material, understand concepts, make flashcards and quizzes, and plan study time.
        </p>
        <p className={hint}>{SYLLA_DISCLAIMER}</p>
      </Section>

      <ConfirmDialog
        open={confirmingClear}
        title="Clear local study data?"
        description="All conversations, saved items, and study plans stored in this browser will be deleted. Your preferences are kept. This can't be undone."
        confirmLabel="Clear data"
        destructive
        onConfirm={() => {
          clearLocalStudyData();
          setCleared(true);
          setTimeout(() => setCleared(false), 3000);
        }}
        onClose={() => setConfirmingClear(false)}
      />
    </div>
  );
}
