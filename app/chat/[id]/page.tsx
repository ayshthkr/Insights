"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { SearchInterface } from "@/components/search-interface"
import { SearchResults } from "@/components/search-results"
import { SearchProgress } from "@/components/search-progress"
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
  chatId?: string
}

interface StreamingState {
  stage: 'searching' | 'analyzing' | 'generating' | 'complete'
  message: string
  sources?: SearchResult[]
  answer?: string
  searchTerms?: string[]
  requiresSearch?: boolean
  chatId?: string
  searchDetails?: {
    searchedFor: string
    foundSources: number
    exaResults?: string[]
  }
}

interface Message {
  message_id: string
  chat_id: string
  role: 'user' | 'assistant'
  content: string
  web_search_required: boolean | null
  generated_search_terms: string | null
  sources: string | null
  created_at: string
}

export default function ChatPage() {
  const params = useParams()
  const chatId = params.id as string

  const [isLoading, setIsLoading] = useState(false)
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentQuery, setCurrentQuery] = useState<string>("")
  const [streamingState, setStreamingState] = useState<StreamingState | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [streamingAnswer, setStreamingAnswer] = useState<string>("")
  const [loadingMessages, setLoadingMessages] = useState(true)
  const [allMessagePairs, setAllMessagePairs] = useState<Array<{userMessage: Message, assistantMessage: Message, searchResponse: SearchResponse}>>([])
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)
  const [isStreaming, setIsStreaming] = useState(false)

  // Refs to track message elements for scrolling
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map())
  const latestAssistantMessageRef = useRef<string | null>(null)

  // Load existing messages for this chat
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoadingMessages(true)
        const response = await fetch(`/api/chat/${chatId}`)
        if (response.ok) {
          const { messages: chatMessages } = await response.json()
          setHasSearched(chatMessages.length > 0)

          // Create message pairs for display (user + assistant message pairs)
          const pairs = []
          for (let i = 0; i < chatMessages.length; i += 2) {
            const userMessage = chatMessages[i]
            const assistantMessage = chatMessages[i + 1]

            if (userMessage && assistantMessage && userMessage.role === 'user' && assistantMessage.role === 'assistant') {
              const sources = assistantMessage.sources
                ? JSON.parse(assistantMessage.sources)
                : []

              pairs.push({
                userMessage,
                assistantMessage,
                searchResponse: {
                  query: userMessage.content,
                  answer: assistantMessage.content,
                  sources,
                  timestamp: assistantMessage.created_at,
                  requiresSearch: assistantMessage.web_search_required || false,
                  searchTerms: assistantMessage.generated_search_terms
                    ? JSON.parse(assistantMessage.generated_search_terms)
                    : [],
                  chatId
                }
              })
            }
          }

          setAllMessagePairs(pairs)

          // Don't set search result here - message pairs are displayed separately
          // The search result should only show for the currently streaming/loading result
        }
      } catch (err) {
        console.error('Error loading messages:', err)
        setError('Failed to load chat messages')
      } finally {
        setLoadingMessages(false)
      }
    }

    if (chatId) {
      loadMessages()
    }
  }, [chatId])

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true)
    setError(null)
    setCurrentQuery(query)
    setSearchResult(null)
    setStreamingState(null)
    setStreamingAnswer("")
    setHasSearched(true)
    setAutoScrollEnabled(true)
    setIsStreaming(true)

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query, chatId }),
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
            const data = line.slice(6)
            if (data.trim() === '') continue

            try {
              const parsed = JSON.parse(data)

              switch (parsed.type) {
                case 'status':
                  setStreamingState({
                    stage: parsed.stage,
                    message: parsed.message,
                    searchTerms: parsed.searchTerms,
                    requiresSearch: parsed.requiresSearch,
                    chatId: parsed.chatId
                  })
                  break

                case 'sources':
                  setStreamingState(prev => ({
                    ...prev!,
                    stage: parsed.stage,
                    message: parsed.message,
                    sources: parsed.sources,
                    searchTerms: parsed.searchTerms
                  }))
                  // Prefetch favicons for sources
                  if (parsed.sources) {
                    FaviconService.prefetchFavicons(parsed.sources.map((s: SearchResult) => s.url))
                  }
                  break

                case 'answer_chunk':
                  setStreamingAnswer(parsed.fullAnswer)
                  break

                case 'answer':
                  const result = {
                    query: parsed.query,
                    answer: parsed.answer,
                    sources: parsed.sources,
                    timestamp: parsed.timestamp,
                    requiresSearch: parsed.requiresSearch,
                    searchTerms: parsed.searchTerms,
                    chatId: parsed.chatId
                  }
                  setSearchResult(result)

                  // Add new message pair to the conversation
                  const newUserMessage: Message = {
                    message_id: `temp-user-${Date.now()}`,
                    chat_id: chatId,
                    role: 'user',
                    content: parsed.query,
                    web_search_required: null,
                    generated_search_terms: null,
                    sources: null,
                    created_at: new Date().toISOString()
                  }

                  const newAssistantMessage: Message = {
                    message_id: `temp-assistant-${Date.now()}`,
                    chat_id: chatId,
                    role: 'assistant',
                    content: parsed.answer,
                    web_search_required: parsed.requiresSearch,
                    generated_search_terms: parsed.searchTerms ? JSON.stringify(parsed.searchTerms) : null,
                    sources: parsed.sources ? JSON.stringify(parsed.sources) : null,
                    created_at: parsed.timestamp
                  }

                  const newPair = {
                    userMessage: newUserMessage,
                    assistantMessage: newAssistantMessage,
                    searchResponse: result
                  }

                  // Store the latest assistant message ID for scrolling
                  latestAssistantMessageRef.current = newAssistantMessage.message_id

                  setAllMessagePairs(prev => [...prev, newPair])
                  setStreamingState(null)
                  setStreamingAnswer("")
                  setIsStreaming(false)
                  break

                case 'complete':
                  setIsLoading(false)
                  setCurrentQuery("")
                  setIsStreaming(false)
                  break

                case 'error':
                  throw new Error(parsed.message)
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
      setStreamingState(null)
      setStreamingAnswer("")
      setIsStreaming(false)
    } finally {
      setIsLoading(false)
    }
  }, [chatId])

  // Auto-scroll effect during streaming - scroll to bottom
  useEffect(() => {
    if (autoScrollEnabled && isStreaming && (streamingState || streamingAnswer)) {
      const scrollToBottom = () => {
        // Use setTimeout to ensure DOM has updated
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          })
        }, 100)
      }

      // Scroll immediately and set up interval for continuous scrolling during streaming
      scrollToBottom()
      const scrollInterval = setInterval(scrollToBottom, 300)

      return () => clearInterval(scrollInterval)
    }
  }, [streamingState, streamingAnswer, autoScrollEnabled, isStreaming])

  // Scroll to start of latest assistant message when answer is complete
  useEffect(() => {
    // Only scroll if we have a specific message to scroll to (not on initial load)
    if (autoScrollEnabled && !isStreaming && latestAssistantMessageRef.current) {
      const messageId = latestAssistantMessageRef.current
      const messageElement = messageRefs.current.get(messageId)

      if (messageElement) {
        // Wait for the DOM to fully render the new message
        setTimeout(() => {
          const elementTop = messageElement.offsetTop
          const headerHeight = 80 // Approximate header height
          const scrollPosition = Math.max(0, elementTop - headerHeight)

          window.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          })

          // Clear the ref after scrolling
          latestAssistantMessageRef.current = null
        }, 800) // Increased timeout to ensure message is fully rendered
      } else {
        // If element not found, clear the ref to prevent infinite attempts
        latestAssistantMessageRef.current = null
      }
    }
  }, [latestAssistantMessageRef.current, autoScrollEnabled, isStreaming])

  // Function to register message refs
  const setMessageRef = useCallback((messageId: string, element: HTMLDivElement | null) => {
    if (element) {
      messageRefs.current.set(messageId, element)
    } else {
      messageRefs.current.delete(messageId)
    }
  }, [])

  // Handle initial query from homepage redirect
  useEffect(() => {
    // Check sessionStorage for pending query (from homepage redirect)
    const pendingQuery = sessionStorage.getItem('pendingQuery')
    const pendingChatId = sessionStorage.getItem('pendingChatId')

    if (pendingQuery && pendingChatId === chatId && !loadingMessages && !hasSearched) {
      // Clear the pending query to avoid re-running
      sessionStorage.removeItem('pendingQuery')
      sessionStorage.removeItem('pendingChatId')

      // Start search immediately
      handleSearch(pendingQuery)
      return
    }

    // Fallback: Handle query parameter if sessionStorage is not available
    const urlParams = new URLSearchParams(window.location.search)
    const queryParam = urlParams.get('q')

    if (queryParam && !loadingMessages && !hasSearched) {
      // Start search immediately if we have a query parameter and haven't searched yet
      handleSearch(queryParam)
      // Remove the query parameter from URL after starting search
      const newUrl = window.location.pathname
      window.history.replaceState({}, '', newUrl)
    }
  }, [loadingMessages, hasSearched, handleSearch, chatId])

  // Prefetch favicons for search results
  useEffect(() => {
    if (searchResult?.sources) {
      searchResult.sources.forEach((source: SearchResult) => {
        FaviconService.getFavicon(source.url)
      })
    }
  }, [searchResult])

  const handleRetry = () => {
    if (currentQuery) {
      handleSearch(currentQuery)
    }
  }

  if (loadingMessages) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <div className="container mx-auto px-4 py-6">
          <Header />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
              <p className="text-slate-600 dark:text-slate-400">Loading chat...</p>
            </div>
          </div>
        </div>
      </div>
    )
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
                    Continue your conversation
                  </motion.h1>
                  <motion.p
                    className="text-xl text-slate-600 dark:text-slate-400 mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                  >
                    Ask your next question
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

          {/* Chat History - All message pairs */}
          <AnimatePresence>
            {allMessagePairs.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-4xl space-y-8"
              >
                {allMessagePairs.map((pair, index) => (
                  <motion.div
                    key={`${pair.userMessage.message_id}-${pair.assistantMessage.message_id}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="space-y-4"
                  >
                    {/* User Question */}
                    <div className="flex justify-end">
                      <div className="max-w-3xl bg-emerald-500 text-white rounded-2xl rounded-br-md px-6 py-4">
                        <p className="text-sm font-medium">{pair.userMessage.content}</p>
                        <p className="text-xs text-emerald-100 mt-2">
                          {new Date(pair.userMessage.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Assistant Response */}
                    <div className="flex justify-start">
                      <div
                        ref={(el) => setMessageRef(pair.assistantMessage.message_id, el)}
                        className="w-full max-w-4xl"
                      >
                        <SearchResults
                          result={pair.searchResponse}
                          chatContext={allMessagePairs.slice(0, index)}
                          // Only show follow-up questions for the most recent message when not loading
                          onFollowUpQuestion={index === allMessagePairs.length - 1 && !isLoading ? handleSearch : undefined}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
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

          {/* Current Search Results (latest response being generated) */}
          <AnimatePresence>
            {searchResult && isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-4xl"
              >
                <SearchResults
                  result={searchResult}
                  chatContext={allMessagePairs}
                  // Don't show follow-up questions for loading results
                />
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
