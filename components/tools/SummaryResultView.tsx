'use client';

import { useStartChat } from '@/components/chat/useStartChat';
import { card } from '@/components/ui/classes';
import type { Summary } from '@/lib/sylla/types';

export function summaryToMarkdown(summary: Summary): string {
  return [
    `# Summary: ${summary.sourceTitle}`,
    '',
    summary.overview,
    '',
    '## Key points',
    ...summary.keyPoints.map((point) => `- ${point}`),
    '',
    '## Important terms',
    ...summary.terms.map((t) => `- **${t.term}** — ${t.definition}`),
  ].join('\n');
}

export function SummaryResultView({ summary }: { summary: Summary }) {
  const startChat = useStartChat();

  return (
    <article className={`${card} space-y-5 p-5`} aria-label={`Summary of ${summary.sourceTitle}`}>
      <div>
        <h2 className="text-base font-semibold">{summary.sourceTitle}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-black/70 dark:text-white/70">
          {summary.overview}
        </p>
      </div>

      <div>
        <h3 className="text-sm font-semibold">Key points</h3>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed">
          {summary.keyPoints.map((point, i) => (
            <li key={i}>{point}</li>
          ))}
        </ul>
      </div>

      {summary.terms.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Important terms</h3>
          <dl className="mt-2 space-y-2 text-sm">
            {summary.terms.map((t) => (
              <div key={t.term}>
                <dt className="font-medium text-indigo-600 dark:text-indigo-400">{t.term}</dt>
                <dd className="text-black/60 dark:text-white/60">{t.definition}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {summary.followUps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold">Keep going</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {summary.followUps.map((followUp) => (
              <button
                key={followUp}
                type="button"
                onClick={() => startChat(followUp)}
                className="rounded-full border border-black/10 px-3 py-1.5 text-xs transition-colors hover:border-indigo-400 hover:text-indigo-600 dark:border-white/15 dark:hover:text-indigo-400"
              >
                {followUp}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}
