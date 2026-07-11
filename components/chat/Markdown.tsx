import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Assistant-message markdown: GFM (tables, strikethrough, task lists) with
 * styling tuned for chat bubbles. Wide tables/code scroll inside their own
 * container so bubbles never overflow the viewport.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="space-y-3 text-sm leading-relaxed [&>*:first-child]:mt-0">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h3 className="mt-4 text-base font-semibold" {...props} />,
          h2: (props) => <h3 className="mt-4 text-base font-semibold" {...props} />,
          h3: (props) => <h4 className="mt-3 text-sm font-semibold" {...props} />,
          h4: (props) => <h5 className="mt-3 text-sm font-semibold" {...props} />,
          p: (props) => <p {...props} />,
          ul: (props) => <ul className="list-disc space-y-1 pl-5" {...props} />,
          ol: (props) => <ol className="list-decimal space-y-1 pl-5" {...props} />,
          a: (props) => (
            <a
              className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote
              className="border-l-2 border-indigo-400/50 pl-3 text-black/60 dark:text-white/60"
              {...props}
            />
          ),
          code: ({ className, children, ...props }) => {
            // Block code arrives wrapped in <pre>; inline code has no newline.
            const isBlock = /language-/.test(className ?? '') || String(children).includes('\n');
            if (isBlock) {
              return (
                <code className={`font-mono text-xs ${className ?? ''}`} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="rounded bg-black/[0.06] px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/[0.1]"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              className="overflow-x-auto rounded-xl border border-black/10 bg-black/[0.04] p-3 dark:border-white/10 dark:bg-black/40"
              {...props}
            />
          ),
          table: (props) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs" {...props} />
            </div>
          ),
          th: (props) => (
            <th
              className="border-b border-black/15 px-2 py-1.5 text-left font-semibold dark:border-white/20"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border-b border-black/5 px-2 py-1.5 align-top dark:border-white/10" {...props} />
          ),
          hr: () => <hr className="border-black/10 dark:border-white/10" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
