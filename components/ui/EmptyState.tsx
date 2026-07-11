import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span
        aria-hidden
        className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/12 text-indigo-500"
      >
        <Icon size={20} strokeWidth={1.8} />
      </span>
      <div>
        <h3 className="text-sm font-semibold">{title}</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-black/50 dark:text-white/50">
          {description}
        </p>
      </div>
      {action}
    </div>
  );
}
