'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';

interface DetailDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** Larger content dialog on the native <dialog> element (focus-managed). */
export function DetailDialog({ open, title, onClose, children }: DetailDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(640px,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 text-inherit shadow-xl backdrop:bg-black/50"
    >
      <div className="flex max-h-[80dvh] flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3 ">
          <h2 className="truncate text-sm font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-lg p-1.5 text-faint hover:bg-hover"
          >
            <X size={16} aria-hidden />
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </dialog>
  );
}
