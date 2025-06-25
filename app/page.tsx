"use client"

import { useState } from "react"
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

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>("")
  const [searchStage, setSearchStage] = useState<string>("")

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentQuery(query)
    setSearchResult(null)

    try {
      // Simulate search stages
      setSearchStage("Searching the web...")
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSearchStage("Analyzing sources...")
      await new Promise((resolve) => setTimeout(resolve, 800))

      setSearchStage("Generating answer...")

      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Search failed")
      }

      const data: SearchResponse = await response.json()
      setSearchResult(data)
      setSearchStage("Complete")
    } catch (err) {
      console.error("Search error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
    } finally {
      setIsLoading(false)
      setSearchStage("")
    }
  }

  const handleRetry = () => {
    if (currentQuery) {
      handleSearch(currentQuery)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <Header />

        <div className="mt-8 mb-12">
          <SearchInterface onSearch={handleSearch} isLoading={isLoading} hasResults={!!searchResult} />
        </div>

        <div className="space-y-8">
          {isLoading && <SearchProgress query={currentQuery} stage={searchStage} />}

          {error && (
            <div className="animate-fade-in-up">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-6 h-6 bg-red-100 dark:bg-red-900/40 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-600 dark:text-red-400 text-sm">!</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Search Error</h3>
                    <p className="text-red-700 dark:text-red-200 mb-4">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 border border-red-200 dark:border-red-700 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors font-medium"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {searchResult && !isLoading && !error && (
            <div className="animate-fade-in-up">
              <SearchResults result={searchResult} />
            </div>
          )}

          {!isLoading && !error && !searchResult && <WelcomeSection />}
        </div>
      </div>
    </div>
  )
}
