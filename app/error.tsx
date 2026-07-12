'use client';

import { AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { btnPrimary } from '@/components/ui/classes';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log for developers; the UI shows a friendly message, never the raw error.
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-1 items-center justify-center py-16">
      <EmptyState
        icon={AlertTriangle}
        title="Something went wrong"
        description="An unexpected error occurred. Your local data is safe — try again, and if it keeps happening, reload the page."
        action={
          <button type="button" onClick={reset} className={btnPrimary}>
            Try again
          </button>
        }
      />
    </div>
  );
}
