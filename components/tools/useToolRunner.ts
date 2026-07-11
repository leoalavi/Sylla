'use client';

import { useCallback, useRef, useState } from 'react';
import { StudyToolError } from '@/lib/sylla/ai/service';

export type ToolStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ToolRunner<TInput, TResult> {
  status: ToolStatus;
  result: TResult | null;
  errorMessage: string | null;
  run: (input: TInput) => void;
  retry: () => void;
  reset: () => void;
}

/**
 * Shared run/retry/reset state machine for every study tool. Keeps service
 * calls (and their failure handling) out of the form components.
 */
export function useToolRunner<TInput, TResult>(
  execute: (input: TInput) => Promise<TResult>,
): ToolRunner<TInput, TResult> {
  const [status, setStatus] = useState<ToolStatus>('idle');
  const [result, setResult] = useState<TResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const lastInputRef = useRef<TInput | null>(null);
  const callIdRef = useRef(0);

  const run = useCallback(
    (input: TInput) => {
      lastInputRef.current = input;
      const callId = ++callIdRef.current;
      setStatus('loading');
      setErrorMessage(null);
      execute(input).then(
        (value) => {
          if (callId !== callIdRef.current) return; // superseded by a newer run
          setResult(value);
          setStatus('success');
        },
        (error: unknown) => {
          if (callId !== callIdRef.current) return;
          setErrorMessage(
            error instanceof StudyToolError
              ? error.message
              : 'Something went wrong while generating. Please try again.',
          );
          setStatus('error');
        },
      );
    },
    [execute],
  );

  const retry = useCallback(() => {
    if (lastInputRef.current !== null) run(lastInputRef.current);
  }, [run]);

  const reset = useCallback(() => {
    callIdRef.current += 1;
    setStatus('idle');
    setResult(null);
    setErrorMessage(null);
  }, []);

  return { status, result, errorMessage, run, retry, reset };
}
