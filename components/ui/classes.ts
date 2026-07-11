// Shared class recipes — Sylla's lightweight alternative to a component
// library. Keeps buttons/inputs/cards visually identical across routes.

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-indigo-400 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/15 dark:bg-white/[0.04] dark:hover:text-indigo-400';

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-black/55 transition-colors hover:bg-black/[0.05] hover:text-black/80 disabled:cursor-not-allowed disabled:opacity-40 dark:text-white/55 dark:hover:bg-white/[0.08] dark:hover:text-white/85';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40';

export const card =
  'rounded-2xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]';

export const input =
  'w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none transition-colors placeholder:text-black/40 focus:border-indigo-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/15 dark:bg-white/[0.04] dark:placeholder:text-white/40';

export const label = 'block text-sm font-medium mb-1.5';

export const hint = 'text-xs text-black/45 dark:text-white/45';

export const badgeMock =
  'inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:text-amber-400';
