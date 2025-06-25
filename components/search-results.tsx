"use client"
import { ExternalLink, Clock, Copy, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

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

  const formatAnswer = (answer: string) => {
    return answer.replace(/\[(\d+)\]/g, (match, num) => {
      const sourceIndex = Number.parseInt(num) - 1
      if (sourceIndex >= 0 && sourceIndex < result.sources.length) {
        return `<a href="#source-${sourceIndex}" class="citation-link">${num}</a>`
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

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Query and Timestamp */}
      <div className="flex items-center justify-between text-sm text-slate-500 dark:text-slate-400">
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
      </div>

      {/* AI Answer */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-slide-in-right">
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white text-sm font-semibold">AI</span>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100">Answer</h2>
            <div
              className="prose prose-slate dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatAnswer(result.answer) }}
            />
          </div>
        </div>
      </div>

      {/* Sources */}
      {result.sources.length > 0 && (
        <div
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-slide-in-right"
          style={{ animationDelay: "0.1s" }}
        >
          <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Sources
          </h3>
          <div className="grid gap-4">
            {result.sources.map((source, index) => (
              <div
                key={index}
                id={`source-${index}`}
                className={cn(
                  "group p-4 border border-slate-100 dark:border-slate-800 rounded-xl",
                  "hover:border-slate-200 dark:hover:border-slate-700 hover:shadow-sm transition-all",
                  "scroll-mt-4",
                )}
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
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
