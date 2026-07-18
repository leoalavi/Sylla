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
              className="text-primary underline underline-offset-2"
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          blockquote: (props) => (
            <blockquote
              className="border-l-2 border-primary/50 pl-3 text-muted-foreground"
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
                className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]"
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: (props) => (
            <pre
              className="overflow-x-auto rounded-xl border border-border bg-muted p-3"
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
              className="border-b border-border px-2 py-1.5 text-left font-semibold"
              {...props}
            />
          ),
          td: (props) => (
            <td className="border-b border-border/60 px-2 py-1.5 align-top" {...props} />
          ),
          hr: () => <hr className="border-border" />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
