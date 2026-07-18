'use client';

import { useEffect, useRef } from 'react';
import { btnDanger, btnPrimary, btnSecondary } from '@/components/ui/classes';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Confirmation dialog on the native <dialog> element — focus trapping,
 * Escape handling, and inerting the background come from the platform.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  destructive = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
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
        // Click on the backdrop (the dialog element itself) dismisses.
        if (event.target === ref.current) onClose();
      }}
      className="m-auto w-[min(420px,calc(100vw-2rem))] rounded-xl border border-border bg-card p-0 text-inherit shadow-xl backdrop:bg-black/50"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary}>
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={destructive ? btnDanger : btnPrimary}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
