'use client';

import { useState } from 'react';
import { SyllaChatPanel } from '@/components/sylla/SyllaChatPanel';

/**
 * EMBEDDED MODE (preview) — floating assistant launcher for Syllabus Sync.
 *
 * This component is not mounted anywhere in the standalone Sylla app. It is
 * the integration point for Phase 2+, when Sylla is embedded inside
 * Syllabus Sync as a Notion-AI-style assistant. It exists now so the shared
 * `SyllaChatPanel` API is proven against both modes.
 *
 * Integration TODOs for the Syllabus Sync host app:
 * - TODO(embedded): read the current Syllabus Sync Supabase session — users
 *   here are always signed in, so no anonymous gate is rendered.
 * - TODO(embedded): point `api` at the host's chat endpoint (or allowlist
 *   /api/sylla/ in the Syllabus Sync edge proxy if calling cross-app).
 * - TODO(phase 2): load/save conversations (sylla_conversations /
 *   sylla_messages) so the panel reopens with history.
 * - TODO(embedded): pass page context (current tasks, study planner items,
 *   upcoming deadlines, unit info) into the request for
 *   buildSyllaSystemPrompt(context).
 * - TODO(rag): surface the user's uploaded documents (sylla_documents) as
 *   retrieval context.
 */
export function SyllaFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(560px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col">
          <SyllaChatPanel className="shadow-xl" />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Close Sylla assistant' : 'Open Sylla assistant'}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white shadow-lg transition-colors hover:bg-indigo-500"
      >
        {open ? '×' : 'S'}
      </button>
    </div>
  );
}
