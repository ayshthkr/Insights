"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { SearchProgress } from "@/components/search-progress"
import { WelcomeSection } from "@/components/welcome-section"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"
import { FaviconService } from "@/lib/favicon-service"

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
  requiresSearch?: boolean
  searchTerms?: string[]
}

interface StreamingState {
  stage: 'searching' | 'analyzing' | 'generating' | 'complete'
  message: string
  sources?: SearchResult[]
  answer?: string
  searchTerms?: string[]
  requiresSearch?: boolean
  searchDetails?: {
    searchedFor: string
    foundSources: number
    exaResults?: string[]
  }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>("")
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null)
  const [showScrollContent, setShowScrollContent] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [streamingAnswer, setStreamingAnswer] = useState<string>("")

  // Handle scroll to show additional content
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      const threshold = 100 // Show content after scrolling 100px
      setShowScrollContent(scrollY > threshold && !hasSearched)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasSearched])

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentQuery(query)
    setSearchResult(null)
    setStreamingState(null)
    setStreamingAnswer("")
    setHasSearched(true)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              switch (data.type) {
                case 'status':
                  setStreamingState({
                    stage: data.stage,
                    message: data.message,
                    searchTerms: data.searchTerms || [],
                    requiresSearch: data.requiresSearch,
                    searchDetails: data.stage === 'searching' ? {
                      searchedFor: query,
                      foundSources: 0
                    } : undefined
                  })
                  break
                case 'sources':
                  const sources = data.sources
                  setStreamingState({
                    stage: data.stage,
                    message: data.message,
                    sources: sources,
                    searchTerms: data.searchTerms || [],
                    searchDetails: {
                      searchedFor: query,
                      foundSources: sources.length,
                      exaResults: sources.map((s: SearchResult) => s.title)
                    }
                  })
                  // Prefetch favicons for all sources
                  if (sources && sources.length > 0) {
                    FaviconService.prefetchFavicons(sources.map((s: SearchResult) => s.url))
                  }
                  break
                case 'answer_chunk':
                  setStreamingAnswer(data.fullAnswer)
                  // Auto-scroll to bottom during streaming
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
                  }, 100)
                  break
                case 'answer':
                  const result = {
                    query: data.query,
                    answer: data.answer,
                    sources: data.sources,
                    timestamp: data.timestamp,
                    requiresSearch: data.requiresSearch,
                    searchTerms: data.searchTerms
                  }
                  setSearchResult(result)
                  setStreamingState(null) // Remove complete stage
                  setStreamingAnswer("")
                  // Prefetch favicons for result sources too
                  if (result.sources && result.sources.length > 0) {
                    FaviconService.prefetchFavicons(result.sources.map((s: SearchResult) => s.url))
                  }
                  break
                case 'complete':
                  setIsLoading(false)
                  setStreamingState(null)
                  setCurrentQuery("") // Clear the query when complete
                  break
                case 'error':
                  throw new Error(data.message)
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (err) {
      console.error("Search error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setIsLoading(false)
      setStreamingState(null)
      setStreamingAnswer("")
    }
  }

  const handleRetry = () => {
    if (currentQuery) {
      handleSearch(currentQuery)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className={cn("container mx-auto px-4 py-6", hasSearched && "pb-32")}>
        <Header />

        <main className="flex flex-col items-center justify-center space-y-8">
          {/* Main Search Interface - Shows only when no search is active */}
          <AnimatePresence mode="wait">
            {!hasSearched && (
              // Initial centered search interface
              <motion.div
                key="initial-search"
                className="w-full max-w-3xl mt-20"
                initial={{ opacity: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  y: typeof window !== 'undefined' ? window.innerHeight : 1000,
                  transition: { duration: 0.8, ease: "easeInOut" }
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <motion.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -50 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <motion.h1
                    className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    Ask anything
                  </motion.h1>
                  <motion.p
                    className="text-xl text-slate-600 dark:text-slate-400 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Get instant, comprehensive answers
                  </motion.p>
                </motion.div>

                <SearchInterface
                  onSearch={handleSearch}
                  isLoading={isLoading}
                  hasSearched={hasSearched}
                  currentQuery={currentQuery}
                />
              </motion.div>
            )}
          </AnimatePresence>



          {/* Progress/Loading State */}
          <AnimatePresence>
            {streamingState && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
              >
                <SearchProgress
                  query={currentQuery}
                  stage={streamingState.stage}
                  sources={streamingState.sources || []}
                  streamingStage={streamingState}
                  streamingAnswer={streamingAnswer}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Results */}
          <AnimatePresence>
            {searchResult && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
              >
                <SearchResults result={searchResult} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error State */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
              >
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Search Error
                  </h3>
                  <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
                  <motion.button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Try Again
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome Section - Only show on scroll and no search */}
          <AnimatePresence>
            {showScrollContent && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full max-w-6xl"
              >
                <WelcomeSection />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Fixed bottom search bar - appears with smooth animation after search */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
              duration: 0.8
            }}
            className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 p-4 z-50 shadow-2xl"
          >
            <div className="container mx-auto max-w-4xl">
              <SearchInterface
                onSearch={handleSearch}
                isLoading={isLoading}
                hasSearched={hasSearched}
                hasResults={!!searchResult}
                currentQuery={isLoading ? currentQuery : ""}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
