// ============================================================================
// Future Supabase schema — ROW TYPES ONLY. No tables exist yet.
//
// These types define the shape Sylla's data takes when persistence moves
// from localStorage into the shared Syllabus Sync Supabase project. They are
// the contract between today's localStorage stores (lib/sylla/stores/*) and
// the future repository layer: each store's domain model maps 1:1 onto a row
// type here, so the migration swaps the storage adapter without touching UI.
//
// Migration plan (do NOT fake persistence before this lands):
//   1. Add migrations in the Syllabus Sync repo (it owns supabase/migrations)
//      creating the tables below, each with RLS `user_id = auth.uid()`.
//   2. Implement a Supabase-backed adapter behind the same store API used by
//      the localStorage stores; keep localStorage as the signed-out fallback.
//   3. On first signed-in load, offer a one-time import of local data.
//
// All rows are user-owned app data — never official university records.
// ============================================================================

import type { SavedItem, StoredMessage, StudyTask, SyllaSettings } from '@/lib/sylla/types';

/** Table: sylla_conversations */
export interface SyllaConversationRow {
  id: string;
  user_id: string;
  title: string;
  unit_id: string | null;
  /** Which surface created it: standalone app or embedded assistant. */
  created_in: 'standalone' | 'embedded';
  created_at: string;
  updated_at: string;
}

/** Table: sylla_messages */
export interface SyllaMessageRow {
  id: string;
  conversation_id: string;
  user_id: string;
  role: StoredMessage['role'];
  /** Serialized message parts (text-only today). */
  parts: StoredMessage['parts'];
  position: number;
  created_at: string;
}

/** Table: sylla_saved_items */
export interface SyllaSavedItemRow {
  id: string;
  user_id: string;
  kind: SavedItem['kind'];
  title: string;
  /** The full SavedItem payload (summary/quiz/deck/plan), JSON. */
  payload: Omit<SavedItem, 'id' | 'createdAt'>;
  created_at: string;
}

/** Table: sylla_usage_events — server-side fair-use limits + analytics. */
export interface SyllaUsageEventRow {
  id: string;
  /** Null for anonymous previews (keyed by hashed IP server-side). */
  user_id: string | null;
  event: 'chat_message' | 'tool_run';
  detail: string | null;
  created_at: string;
}

/** Table: sylla_preferences — settings synced across devices. */
export interface SyllaPreferencesRow {
  user_id: string;
  preferences: Partial<SyllaSettings>;
  updated_at: string;
}

/** Convenience: plan tasks as stored inside saved-plan payloads. */
export type { StudyTask };
