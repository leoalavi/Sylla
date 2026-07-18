// Shared class recipes — Sylla's lightweight alternative to a component
// library. Built entirely on the semantic tokens in app/globals.css, which
// mirror the Syllabus Sync (Macquarie) design system, so every button/input/
// card here matches the main app.

export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-mq-sm transition-all hover:bg-primary-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const btnSecondary =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-mq-sm transition-all hover:bg-hover active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const btnGhost =
  'inline-flex items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50';

export const btnDanger =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white shadow-mq-sm transition-all hover:bg-destructive/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50';

export const card = 'rounded-xl border border-border bg-card shadow-mq-sm';

export const input =
  'w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm outline-none transition-colors placeholder:text-faint focus:border-primary disabled:cursor-not-allowed disabled:opacity-50';

export const label = 'block text-sm font-medium mb-1.5';

export const hint = 'text-xs text-faint';

export const badgeMock =
  'inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning';

export const badgeLive =
  'inline-flex items-center gap-1 rounded-full border border-success/40 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success';

/** Small brand chip, e.g. the active unit code. */
export const badgeUnit =
  'rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary';
