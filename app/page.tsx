"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { SearchProgress } from "@/components/search-progress"
import { WelcomeSection } from "@/components/welcome-section"
import { Header } from "@/components/header"

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

interface StreamingState {
  stage: 'searching' | 'analyzing' | 'generating' | 'complete'
  message: string
  sources?: SearchResult[]
  answer?: string
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
                    searchDetails: data.stage === 'searching' ? {
                      searchedFor: query,
                      foundSources: 0
                    } : undefined
                  })
                  break
                case 'sources':
                  setStreamingState({
                    stage: data.stage,
                    message: data.message,
                    sources: data.sources,
                    searchDetails: {
                      searchedFor: query,
                      foundSources: data.sources.length,
                      exaResults: data.sources.map((s: SearchResult) => s.title)
                    }
                  })
                  break
                case 'answer_chunk':
                  setStreamingAnswer(data.fullAnswer)
                  break
                case 'answer':
                  setSearchResult({
                    query: data.query,
                    answer: data.answer,
                    sources: data.sources,
                    timestamp: data.timestamp
                  })
                  setStreamingState({ stage: 'complete', message: 'Complete' })
                  setStreamingAnswer("")
                  break
                case 'complete':
                  setIsLoading(false)
                  setStreamingState(null)
                  break
                case 'error':
                  throw new Error(data.message)
              }
            } catch (e) {
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
      <div className="container mx-auto px-4 py-6">
        <Header />

        <main className="flex flex-col items-center justify-center space-y-8">
          {/* Main Search Interface - Always visible */}
          <motion.div
            className={`w-full max-w-3xl ${hasSearched ? 'mt-4' : 'mt-20'}`}
            layout
            transition={{ duration: 0.6, ease: "easeInOut" }}
          >
            <AnimatePresence mode="wait">
              {!hasSearched && (
                <motion.div
                  initial={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="text-center mb-12"
                >
                  <motion.h1
                    className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 bg-clip-text text-transparent"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                  >
                    What would you like to know?
                  </motion.h1>
                  <motion.p
                    className="text-xl text-slate-600 dark:text-slate-400 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Ask me anything and get comprehensive, AI-powered answers with real-time sources
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              layout
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="flex items-center justify-center"
            >
              <SearchInterface onSearch={handleSearch} isLoading={isLoading} />
            </motion.div>
          </motion.div>

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
    </div>
  )
}
