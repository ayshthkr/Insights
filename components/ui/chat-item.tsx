"use client"

import { motion } from "framer-motion"

interface ChatData {
  chat_id: string
  title: string | null
  updated_at: string
  created_at: string
}

interface ChatItemProps {
  chat: ChatData
  delay?: number
  onClick?: () => void
}

function formatTimeAgo(dateString: string) {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    } else {
      return date.toLocaleDateString()
    }
  } catch {
    return 'Recently'
  }
}

export default function ChatItem({ chat, delay = 0, onClick }: ChatItemProps) {
  const displayTitle = chat.title || 'New Chat'
  const timeAgo = formatTimeAgo(chat.updated_at)

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md transition-all duration-200 cursor-pointer"
      initial={{ opacity: 0, x: 20, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay,
        ease: "easeOut",
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          {/* Chat title */}
          <motion.h3
            className="font-medium text-gray-900 dark:text-gray-100 truncate"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: delay + 0.2, duration: 0.3 }}
          >
            {displayTitle}
          </motion.h3>
        </div>

        {/* Timestamp */}
        <motion.div
          className="flex items-center text-xs text-gray-500 dark:text-gray-400 ml-4 flex-shrink-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.4, duration: 0.3 }}
        >
          {timeAgo}
        </motion.div>
      </div>
    </motion.div>
  )
}
