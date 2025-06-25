"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Sparkles, ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface SearchInterfaceProps {
  onSearch: (query: string) => void
  isLoading?: boolean
  hasResults?: boolean
  hasSearched?: boolean
  currentQuery?: string // Add this to show the current query during loading
  onQueryComplete?: () => void // Add this to clear the query when complete
}

export function SearchInterface({
  onSearch,
  isLoading = false,
  hasResults = false,
  hasSearched = false,
  currentQuery = "",
  onQueryComplete
}: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Show current query during loading, otherwise show the input query
  const displayQuery = isLoading && currentQuery ? currentQuery : query

  // Clear query when search is complete
  useEffect(() => {
    if (!isLoading && hasResults && onQueryComplete) {
      setQuery("")
    }
  }, [isLoading, hasResults, onQueryComplete])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim() && !isLoading) {
      onSearch(query.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  const adjustTextareaHeight = () => {      const textarea = textareaRef.current
      if (textarea) {
        textarea.style.height = "auto"
        textarea.style.height = `${Math.min(textarea.scrollHeight, 90)}px` // Reduced max height slightly
      }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [displayQuery])

  const suggestedQueries = [
    "What are the latest developments in AI?",
    "Explain quantum computing simply",
    "Best practices for sustainable living",
    "How does blockchain technology work?",
  ]

  return (
    <div className={cn("w-full max-w-5xl mx-auto transition-all duration-500", hasResults ? "max-w-3xl" : "max-w-5xl")}>
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200",
            isFocused
              ? "border-emerald-500 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            isLoading && "border-emerald-500 shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10",
          )}
          style={isLoading ? {
            background: `linear-gradient(90deg,
              rgba(16, 185, 129, 0.1) 0%,
              rgba(5, 150, 105, 0.2) 50%,
              rgba(16, 185, 129, 0.1) 100%
            )`,
            backgroundSize: '200% 100%',
            animation: 'shimmer 2s infinite'
          } : {}}
        >
          <div className="flex items-center gap-3 p-4 relative z-10"> {/* Increased padding back */}
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={displayQuery}
              onChange={(e) => !isLoading && setQuery(e.target.value)} // Disable input during loading
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder={isLoading ? "" : "Ask anything..."}
              disabled={isLoading}
              className={cn(
                "flex-1 resize-none bg-transparent text-base placeholder:text-slate-500 dark:placeholder:text-slate-400", // Reduced font size
                "focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed",
                "min-h-[32px] max-h-[100px] leading-7", // Increased width through container changes
                "flex items-center py-2" // Slightly reduced height
              )}
              rows={1}
              style={{
                lineHeight: '1.5',
                paddingTop: '8px',
                paddingBottom: '8px'
              }}
            />

            <Button
              type="submit"
              disabled={!query.trim() || isLoading}
              size="sm"
              className={cn(
                "rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-all duration-200 flex-shrink-0 mt-0.5",
              )}
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Only show suggestions on initial state */}
      {!hasResults && !isLoading && !hasSearched && (
        <div className="mt-6 animate-fade-in-up">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 text-center">Try asking about:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {suggestedQueries.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => setQuery(suggestion)}
                className="px-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-700 dark:text-slate-300"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
