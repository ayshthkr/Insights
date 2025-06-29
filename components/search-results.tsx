"use client"
import { useState } from "react"
import { ExternalLink, Clock, Copy, Share, Download, Check, FileText, FileImage, File, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CitationTooltip } from "@/components/ui/citation-tooltip"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import { useEffect } from "react"
import { downloadAsPDF, downloadAsMarkdown, downloadAsDocx, downloadAsText, type DownloadOptions } from "@/lib/download-utils"
import { FollowUpQuestions } from "@/components/follow-up-questions"

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
  chatContext?: Array<{
    userMessage: {
      content: string
    }
    assistantMessage: {
      content: string
    }
  }>
  onFollowUpQuestion?: (question: string) => void
}

export function SearchResults({ result, chatContext = [], onFollowUpQuestion }: SearchResultsProps) {
  const [copied, setCopied] = useState(false)
  const [isDownloadOpen, setIsDownloadOpen] = useState(false)
  const [highlightedSource, setHighlightedSource] = useState<number | null>(null)

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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(result.answer)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareResult = () => {
    if (navigator.share) {
      navigator.share({
        title: `Answer to: ${result.query}`,
        text: result.answer,
      })
    }
  }

  const handleDownload = (format: 'pdf' | 'markdown' | 'docx' | 'text') => {
    const downloadData: DownloadOptions = {
      query: result.query,
      answer: result.answer,
      sources: result.sources,
      timestamp: result.timestamp
    }

    switch (format) {
      case 'pdf':
        downloadAsPDF(downloadData)
        break
      case 'markdown':
        downloadAsMarkdown(downloadData)
        break
      case 'docx':
        downloadAsDocx(downloadData)
        break
      case 'text':
        downloadAsText(downloadData)
        break
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

    const handleClickOutside = (e: Event) => {
      const target = e.target as HTMLElement
      if (!target.closest('.relative')) {
        setIsDownloadOpen(false)
      }
    }

    document.addEventListener('click', handleCitationClick)
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleCitationClick)
      document.removeEventListener('click', handleClickOutside)
    }
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
          <Button
            variant="ghost"
            size="sm"
            onClick={copyToClipboard}
            className={cn(
              "transition-all duration-200",
              copied && "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
            )}
          >
            {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </Button>

          <div className="relative">
            <DropdownMenu>
              <DropdownMenuTrigger
                onClick={() => setIsDownloadOpen(!isDownloadOpen)}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-slate-300 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-50 h-9 px-3"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </DropdownMenuTrigger>
              {isDownloadOpen && (
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => { handleDownload('pdf'); setIsDownloadOpen(false); }}>
                    <FileImage className="w-4 h-4 mr-2" />
                    PDF Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { handleDownload('markdown'); setIsDownloadOpen(false); }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Markdown File
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { handleDownload('docx'); setIsDownloadOpen(false); }}>
                    <File className="w-4 h-4 mr-2" />
                    Word Document
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { handleDownload('text'); setIsDownloadOpen(false); }}>
                    <FileText className="w-4 h-4 mr-2" />
                    Text File
                  </DropdownMenuItem>
                </DropdownMenuContent>
              )}
            </DropdownMenu>
          </div>

          <Button variant="ghost" size="sm" onClick={shareResult}>
            <Share className="w-4 h-4" />
            Share
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
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
          <div className="flex-1">
            <div className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  a: ({ children, href, ...props }) => {
                    // Check if this is a citation link
                    if (href?.startsWith('#source-')) {
                      const sourceIdStr = href.replace('#source-', '')
                      const sourceIndex = parseInt(sourceIdStr, 10)

                      if (!isNaN(sourceIndex)) {
                        const source = result.sources[sourceIndex]

                        if (source && source.title && source.url && source.snippet) {
                          return (
                            <CitationTooltip
                              source={source}
                              onGoToSource={() => {
                                setHighlightedSource(sourceIndex)
                                const element = document.getElementById(`source-${sourceIndex}`)
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth' })
                                  setTimeout(() => setHighlightedSource(null), 3000)
                                }
                              }}
                            >
                              <span className="inline-flex items-center px-1.5 py-0.5 text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-md hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition-colors cursor-pointer no-underline">
                                {children}
                              </span>
                            </CitationTooltip>
                          )
                        }
                        }
                      }

                    return (
                      <a
                        {...props}
                        href={href}
                        className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {children}
                      </a>
                    )
                  },
                  h1: ({ children, ...props }) => (
                    <h1 {...props} className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4 mt-6 first:mt-0 block leading-tight">
                      {children}
                    </h1>
                  ),
                  h2: ({ children, ...props }) => (
                    <h2 {...props} className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3 mt-5 first:mt-0 block leading-tight">
                      {children}
                    </h2>
                  ),
                  h3: ({ children, ...props }) => (
                    <h3 {...props} className="text-lg font-medium text-slate-900 dark:text-slate-100 mb-2 mt-4 first:mt-0 block leading-tight">
                      {children}
                    </h3>
                  ),
                  p: ({ children, ...props }) => (
                    <p {...props} className="mb-4 last:mb-0 leading-relaxed text-slate-700 dark:text-slate-300 block">
                      {children}
                    </p>
                  ),
                  ul: ({ children, ...props }) => (
                    <ul {...props} className="list-disc ml-6 mb-4 space-y-2 block">
                      {children}
                    </ul>
                  ),
                  ol: ({ children, ...props }) => (
                    <ol {...props} className="list-decimal ml-6 mb-4 space-y-2 block">
                      {children}
                    </ol>
                  ),
                  li: ({ children, ...props }) => (
                    <li {...props} className="text-slate-700 dark:text-slate-300 leading-relaxed block">
                      <div className="inline">{children}</div>
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
          <div className="grid gap-2">
            {result.sources.map((source, index) => (
              <motion.a
                key={index}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                id={`source-${index}`}
                className={cn(
                  "group p-2.5 border border-slate-100 dark:border-slate-800 rounded-lg block",
                  "hover:border-emerald-200 dark:hover:border-emerald-700 hover:shadow-md hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer",
                  "scroll-mt-4",
                  highlightedSource === index && "ring-2 ring-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="flex-shrink-0 w-4 h-4 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center justify-center">
                      {index + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors text-sm line-clamp-1 mb-0.5">
                        {source.title}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-500 truncate">
                        {(() => {
                          try {
                            return new URL(source.url).hostname
                          } catch {
                            return source.url
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 p-1 rounded text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Follow-up Questions */}
      {onFollowUpQuestion && (
        <FollowUpQuestions
          result={result}
          chatContext={chatContext}
          onQuestionClick={onFollowUpQuestion}
        />
      )}
    </motion.div>
  )
}
