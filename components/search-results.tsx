"use client"
import { ExternalLink, Clock, Copy, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { useEffect } from "react"

interface SearchResult {
  title: string
  url: string
  snippet: string
}

interface SearchResponse {
  query: string
  answer: string
  sources: SearchResult[]
  timestamp: string
}

interface SearchResultsProps {
  result: SearchResponse
}

export function SearchResults({ result }: SearchResultsProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const processMarkdownWithCitations = (answer: string) => {
    // Replace citation numbers with clickable markdown links
    return answer.replace(/\[(\d+)\]/g, (match, num) => {
      const sourceIndex = Number.parseInt(num) - 1
      if (sourceIndex >= 0 && sourceIndex < result.sources.length) {
        return `[${num}](#source-${sourceIndex})`
      }
      return match
    })
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result.answer)
  }

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: `Answer to: ${result.query}`,
        text: result.answer,
      })
    }
  }

  // Add click handlers for citations after component mounts
  useEffect(() => {
    const handleCitationClick = (e: Event) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'A' && target.getAttribute('href')?.startsWith('#source-')) {
        e.preventDefault()
        const sourceId = target.getAttribute('href')?.substring(1)
        if (sourceId) {
          const element = document.getElementById(sourceId)
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' })
          }
        }
      }
    }

    document.addEventListener('click', handleCitationClick)
    return () => document.removeEventListener('click', handleCitationClick)
  }, [])

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Query and Timestamp */}
      <motion.div
        className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>Searched at {formatTimestamp(result.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={copyToClipboard}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={shareResult}>
            <Share className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>

      {/* AI Answer */}
      <motion.div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        <div className="flex items-start gap-4">
          <motion.div
            className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
          >
            <span className="text-white text-sm font-semibold">AI</span>
          </motion.div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Answer</h2>
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: ({ node, children, href, ...props }) => (
                    <a
                      {...props}
                      href={href}
                      className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer no-underline"
                    >
                      {children}
                    </a>
                  ),
                  h1: ({ node, children, ...props }) => (
                    <h1 {...props} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
                      {children}
                    </h1>
                  ),
                  h2: ({ node, children, ...props }) => (
                    <h2 {...props} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                      {children}
                    </h2>
                  ),
                  h3: ({ node, children, ...props }) => (
                    <h3 {...props} className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2">
                      {children}
                    </h3>
                  ),
                  p: ({ node, children, ...props }) => (
                    <p {...props} className="mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ node, children, ...props }) => (
                    <ul {...props} className="list-disc list-inside mb-4 space-y-1">
                      {children}
                    </ul>
                  ),
                  ol: ({ node, children, ...props }) => (
                    <ol {...props} className="list-decimal list-inside mb-4 space-y-1">
                      {children}
                    </ol>
                  ),
                  li: ({ node, children, ...props }) => (
                    <li {...props} className="text-slate-700 dark:text-slate-300">
                      {children}
                    </li>
                  ),
                  code: ({ node, children, className, ...props }) => {
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
                  blockquote: ({ node, children, ...props }) => (
                    <blockquote {...props} className="border-l-4 border-emerald-500 pl-4 italic mb-4 text-slate-600 dark:text-slate-400">
                      {children}
                    </blockquote>
                  ),
                  strong: ({ node, children, ...props }) => (
                    <strong {...props} className="font-semibold text-slate-900 dark:text-slate-100">
                      {children}
                    </strong>
                  ),
                  em: ({ node, children, ...props }) => (
                    <em {...props} className="italic text-slate-800 dark:text-slate-200">
                      {children}
                    </em>
                  )
                }}
              >
                {processMarkdownWithCitations(result.answer)}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Sources */}
      {result.sources.length > 0 && (
        <motion.div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Sources
          </h3>
          <div className="grid gap-4">
            {result.sources.map((source, index) => (
              <motion.div
                key={index}
                id={`source-${index}`}
                className={cn(
                  "group p-4 border border-slate-100 dark:border-slate-800 rounded-xl",
                  "hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all",
                  "scroll-mt-4",
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {source.title}
                      </h4>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2 line-clamp-2">{source.snippet}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{source.url}</p>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex-shrink-0 p-2 rounded-lg opacity-0 group-hover:opacity-100",
                      "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300",
                      "hover:bg-slate-100 dark:hover:bg-slate-800",
                      "transition-all",
                    )}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
