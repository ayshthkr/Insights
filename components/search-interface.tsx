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
}

export function SearchInterface({ onSearch, isLoading = false, hasResults = false }: SearchInterfaceProps) {
  const [query, setQuery] = useState("")
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = "auto"
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
    }
  }

  useEffect(() => {
    adjustTextareaHeight()
  }, [query])

  const suggestedQueries = [
    "What are the latest developments in AI?",
    "Explain quantum computing simply",
    "Best practices for sustainable living",
    "How does blockchain technology work?",
  ]

  return (
    <div className={cn("w-full max-w-4xl mx-auto transition-all duration-500", hasResults ? "max-w-2xl" : "max-w-4xl")}>
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "relative bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200",
            isFocused
              ? "border-emerald-500 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5"
              : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600",
            isLoading && "animate-pulse-glow",
          )}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="flex-shrink-0 mt-1">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>

            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask anything..."
              disabled={isLoading}
              className={cn(
                "flex-1 resize-none bg-transparent text-lg placeholder:text-slate-500 dark:placeholder:text-slate-400",
                "focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed",
                "min-h-[28px] max-h-[120px] leading-7",
              )}
              rows={1}
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

      {!hasResults && !isLoading && (
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
