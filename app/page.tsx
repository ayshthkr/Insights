"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { SearchInterface } from "@/components/search-interface"
import { ChatHistory } from "@/components/chat-history"
import { Header } from "@/components/header"
import { cn } from "@/lib/utils"

export default function Home() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>("")
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentQuery(query)
    setHasSearched(true)

    try {
      // First create a new chat
      const chatResponse = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: query.length > 50 ? query.substring(0, 47) + "..." : query
        }),
      })

      if (!chatResponse.ok) {
        throw new Error('Failed to create chat')
      }

      const { chatId } = await chatResponse.json()

      // Store the query in sessionStorage to be picked up immediately by chat page
      sessionStorage.setItem('pendingQuery', query)
      sessionStorage.setItem('pendingChatId', chatId)

      // Redirect to the chat page immediately
      window.location.href = `/chat/${chatId}`

    } catch (error) {
      console.error("Search error:", error)
      setError(error instanceof Error ? error.message : "An error occurred")
      setIsLoading(false)
      setHasSearched(false)
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
                initial={{ opacity: 1 }}
                exit={{
                  opacity: 0,
                  transition: { duration: 0.5, ease: "easeInOut" }
                }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
              >
                <motion.div
                  className="text-center mb-12"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
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

          {/* Progress/Loading State - Not needed since we redirect immediately */}

          {/* Search Results - Not needed since we redirect immediately */}

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



          {/* Chat History - Show below welcome section when user is signed in */}
          <AnimatePresence>
            {!hasSearched && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="w-full max-w-6xl"
              >
                <ChatHistory className="mt-16" />
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
                hasResults={false}
                currentQuery={isLoading ? currentQuery : ""}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
