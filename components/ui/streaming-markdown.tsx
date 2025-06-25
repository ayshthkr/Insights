import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"

interface StreamingMarkdownProps {
  content: string
  className?: string
}

export function StreamingMarkdown({ content, className }: StreamingMarkdownProps) {
  const processMarkdownWithCitations = (answer: string) => {
    // Replace citation numbers with clickable markdown links
    return answer.replace(/\[(\d+)\]/g, (match, num) => {
      return `[${num}](#source-${Number.parseInt(num) - 1})`
    })
  }

  return (
    <div className={className}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          a: ({ children, href, ...props }) => (
            <a
              {...props}
              href={href}
              className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer no-underline"
            >
              {children}
            </a>
          ),
          h1: ({ children, ...props }) => (
            <h1 {...props} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              {children}
            </h1>
          ),
          h2: ({ children, ...props }) => (
            <h2 {...props} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
              {children}
            </h2>
          ),
          h3: ({ children, ...props }) => (
            <h3 {...props} className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
              {children}
            </h3>
          ),
          p: ({ children, ...props }) => (
            <p {...props} className="mb-4 leading-relaxed">
              {children}
            </p>
          ),
          ul: ({ children, ...props }) => (
            <ul {...props} className="list-disc list-inside mb-4 space-y-1">
              {children}
            </ul>
          ),
          ol: ({ children, ...props }) => (
            <ol {...props} className="list-decimal list-inside mb-4 space-y-1">
              {children}
            </ol>
          ),
          li: ({ children, ...props }) => (
            <li {...props} className="text-slate-700 dark:text-slate-300">
              {children}
            </li>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || '')
            return match ? (
              <pre className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto mb-4">
                <code {...props} className={className}>
                  {children}
                </code>
              </pre>
            ) : (
              <code {...props} className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">
                {children}
              </code>
            )
          },
          blockquote: ({ children, ...props }) => (
            <blockquote {...props} className="border-l-4 border-emerald-500 pl-4 italic mb-4 text-slate-600 dark:text-slate-400">
              {children}
            </blockquote>
          ),
          strong: ({ children, ...props }) => (
            <strong {...props} className="font-semibold text-slate-900 dark:text-slate-100">
              {children}
            </strong>
          ),
          em: ({ children, ...props }) => (
            <em {...props} className="italic text-slate-800 dark:text-slate-200">
              {children}
            </em>
          )
        }}
      >
        {processMarkdownWithCitations(content)}
      </ReactMarkdown>
    </div>
  )
}
