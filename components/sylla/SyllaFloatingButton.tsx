'use client';

import { useState } from 'react';
import { ChatView } from '@/components/chat/ChatView';

/**
 * EMBEDDED MODE (preview) — floating assistant launcher for Syllabus Sync.
 *
 * Not mounted anywhere in the standalone Sylla app. It is the integration
 * point for the phase where Sylla is embedded inside Syllabus Sync as a
 * Notion-AI-style assistant, and exists now to prove the shared ChatView
 * works in both modes.
 *
 * Integration TODOs for the Syllabus Sync host app:
 * - TODO(embedded): users are always signed in via the host Supabase
 *   session, so no anonymous gate is rendered here.
 * - TODO(embedded): point ChatView at the host's chat endpoint (or allowlist
 *   /api/sylla/ in the Syllabus Sync edge proxy if calling cross-app).
 * - TODO(embedded): pass page context (tasks, study planner items, upcoming
 *   deadlines, unit info) into the request for buildSyllaSystemPrompt().
 * - TODO(rag): surface the user's uploaded documents as retrieval context.
 */
export function SyllaFloatingButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="flex h-[min(560px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-xl">
          <ChatView conversationId={null} />
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-label={open ? 'Close Sylla assistant' : 'Open Sylla assistant'}
        className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-white shadow-lg transition-colors hover:bg-primary-hover"
      >
        {open ? '×' : 'S'}
      </button>
    </div>
  );
}
