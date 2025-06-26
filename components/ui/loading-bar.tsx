"use client"

import { motion } from "framer-motion"

interface LoadingBarProps {
  delay?: number
}

export default function LoadingBar({ delay = 0 }: LoadingBarProps) {
  return (
    <motion.div
      className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, x: -20 }}
      transition={{
        duration: 0.3,
        delay,
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-2">
          {/* Title placeholder */}
          <motion.div
            className="h-4 bg-gray-300 dark:bg-gray-600 rounded-md"
            style={{ width: "60%" }}
            animate={{
              opacity: [0.5, 1, 0.5],
              backgroundColor: ["#d1d5db", "#9ca3af", "#d1d5db"],
            }}
            transition={{
              duration: 1.8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />
        </div>

        {/* Timestamp placeholder */}
        <motion.div
          className="w-12 h-3 bg-gray-300 dark:bg-gray-600 rounded-md"
          animate={{
            opacity: [0.5, 1, 0.5],
            backgroundColor: ["#d1d5db", "#9ca3af", "#d1d5db"],
          }}
          transition={{
            duration: 1.6,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 0.6,
          }}
        />
      </div>
    </motion.div>
  )
}
