"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useUser } from "@clerk/nextjs"
import { useRouter } from "next/navigation"
import ChatItem from "./ui/chat-item"
import LoadingBar from "./ui/loading-bar"

interface Chat {
  chat_id: string
  title: string | null
  updated_at: string
  created_at: string
}

interface ChatHistoryProps {
  className?: string
}

export function ChatHistory({ className = "" }: ChatHistoryProps) {
  const [chats, setChats] = useState<Chat[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isSignedIn, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadChats()
    }
  }, [isLoaded, isSignedIn])

  const loadChats = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/chat')

      if (!response.ok) {
        throw new Error('Failed to load chats')
      }

      const data = await response.json()
      setChats(data.chats || [])
    } catch (error) {
      console.error('Error loading chats:', error)
      setError(error instanceof Error ? error.message : 'Failed to load chats')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`)
  }

  if (!isLoaded || !isSignedIn) {
    return null
  }

  return (
    <div className={className}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full max-w-4xl mx-auto"
      >
        <motion.h2
          className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Recent Conversations
        </motion.h2>

        <div className="space-y-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              // Show loading bars
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[...Array(5)].map((_, index) => (
                  <LoadingBar key={index} delay={index * 0.1} />
                ))}
              </motion.div>
            ) : error ? (
              // Show error state
              <motion.div
                key="error"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
                <motion.button
                  onClick={loadChats}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </motion.div>
            ) : chats.length > 0 ? (
              // Show chat items
              <motion.div
                key="chats"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {chats.map((chat, index) => (
                  <ChatItem
                    key={chat.chat_id}
                    chat={chat}
                    delay={index * 0.05}
                    onClick={() => handleChatClick(chat.chat_id)}
                  />
                ))}
              </motion.div>
            ) : (
              // Show empty state
              <motion.div
                key="empty"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center py-8"
              >
                <div className="text-gray-500 dark:text-gray-400">
                  <p className="text-lg mb-2">No conversations yet</p>
                  <p className="text-sm">Start a conversation by asking a question above</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
