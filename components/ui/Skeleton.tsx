export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`animate-pulse rounded-lg bg-black/[0.07] dark:bg-white/[0.08] ${className}`}
    />
  );
}
