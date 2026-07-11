'use client';

import { useEffect, useState } from 'react';

// Whether a real AI provider is configured server-side (from
// /api/sylla/status). Cached module-wide — one fetch per page load.
let cachedStatus: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function fetchStatus(): Promise<boolean> {
  try {
    const res = await fetch('/api/sylla/status');
    if (!res.ok) return false;
    const body = (await res.json()) as { aiConfigured?: boolean };
    return Boolean(body.aiConfigured);
  } catch {
    return false;
  }
}

/** null while loading; then true when a live AI provider is configured. */
export function useAIConfigured(): boolean | null {
  const [status, setStatus] = useState<boolean | null>(cachedStatus);

  useEffect(() => {
    if (cachedStatus !== null) return;
    inflight ??= fetchStatus().then((value) => {
      cachedStatus = value;
      return value;
    });
    let cancelled = false;
    inflight.then((value) => {
      if (!cancelled) setStatus(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
