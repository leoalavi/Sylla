'use client';

import { ArrowLeft, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';
import { badgeMock, btnSecondary, card } from '@/components/ui/classes';
import { getStudyToolService } from '@/lib/sylla/ai';
import { useActiveUnit } from '@/lib/sylla/stores/unit-context';
import type { ToolStatus } from '@/components/tools/useToolRunner';

interface ToolPageProps {
  title: string;
  description: string;
  /** Short example of good input, shown under the description. */
  example: string;
  status: ToolStatus;
  errorMessage: string | null;
  onRetry: () => void;
  onReset: () => void;
  /** The input form (shown while idle/loading/error). */
  form: ReactNode;
  /** The result view (shown on success). */
  children: ReactNode;
  /** Rendered on success when the provider returned nothing useful. */
  resultIsEmpty?: boolean;
}

/**
 * Shared layout + state presentation for every study tool: header, mock-data
 * badge, form ↔ loading ↔ error ↔ result/empty transitions, and start-over.
 */
export function ToolPage({
  title,
  description,
  example,
  status,
  errorMessage,
  onRetry,
  onReset,
  form,
  children,
  resultIsEmpty = false,
}: ToolPageProps) {
  const activeUnit = useActiveUnit();
  const isMock = getStudyToolService().providerName === 'mock';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/tools"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-faint hover:text-primary "
      >
        <ArrowLeft size={13} aria-hidden /> All study tools
      </Link>
      <header className="mt-3">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{title}</h1>
          {isMock && <span className={badgeMock}>Mock AI mode</span>}
          {activeUnit && (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {activeUnit.code}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <p className="mt-1 text-xs text-faint">Example: {example}</p>
      </header>

      <div className="mt-6">
        {status === 'success' ? (
          <div>
            {resultIsEmpty ? (
              <div className={`${card} px-5 py-6 text-center`}>
                <p className="text-sm font-medium">Nothing came back</p>
                <p className="mx-auto mt-1 max-w-sm text-sm text-faint">
                  The service returned an empty result. Try adding more detail to your input, then
                  generate again.
                </p>
              </div>
            ) : (
              children
            )}
            <button type="button" onClick={onReset} className={`${btnSecondary} mt-4`}>
              <RotateCcw size={14} aria-hidden /> Start over
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div aria-busy={status === 'loading'}>{form}</div>

            {status === 'loading' && (
              <div role="status" aria-label="Generating" className={`${card} space-y-3 p-5`}>
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-1/2" />
                <p className="pt-1 text-xs text-faint">Generating…</p>
              </div>
            )}

            {status === 'error' && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                {errorMessage}
                <button
                  type="button"
                  onClick={onRetry}
                  className="rounded-lg border border-destructive/40 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-destructive/10"
                >
                  Retry
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
