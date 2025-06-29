"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Brain, MessageCircle, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface FollowUpQuestion {
  id: string
  question: string
}

interface FollowUpQuestionsProps {
  result: {
    query: string
    answer: string
    sources: Array<{
      title: string
      url: string
      snippet: string
    }>
    timestamp: string
  }
  chatContext?: Array<{
    userMessage: {
      content: string
    }
    assistantMessage: {
      content: string
    }
  }>
  onQuestionClick?: (question: string) => void
  className?: string
}

export function FollowUpQuestions({
  result,
  chatContext = [],
  onQuestionClick,
  className
}: FollowUpQuestionsProps) {
  const [questions, setQuestions] = useState<FollowUpQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Don't generate questions if no click handler is provided
    if (!onQuestionClick) {
      return
    }

    const generateQuestions = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch('/api/follow-up-questions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currentQuery: result.query,
            currentAnswer: result.answer,
            sources: result.sources,
            chatContext: chatContext.map(pair => ({
              userMessage: pair.userMessage.content,
              assistantMessage: pair.assistantMessage.content
            }))
          })
        })

        if (!response.ok) {
          throw new Error('Failed to generate follow-up questions')
        }

        const data = await response.json()
        setQuestions(data.questions || [])
      } catch (err) {
        console.error('Error generating follow-up questions:', err)
        setError(err instanceof Error ? err.message : 'Failed to generate questions')
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small delay to make the loading state visible
    const timer = setTimeout(generateQuestions, 800)
    return () => clearTimeout(timer)
  }, [result.query, result.answer, result.sources, chatContext, onQuestionClick])

  // Don't render if no click handler is provided
  if (!onQuestionClick) {
    return null
  }

  if (error) {
    return null // Fail silently for better UX
  }

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <motion.div
            className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <MessageCircle className="w-3.5 h-3.5 text-white" />
          </motion.div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Follow-up Questions
          </h3>
          <motion.div
            className="flex-1 h-px bg-gradient-to-r from-emerald-200 to-transparent dark:from-emerald-800"
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ delay: 0.8, duration: 0.6 }}
          />
        </div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {[0, 1, 2, 3].map((index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30"
                >
                  <div className="flex-shrink-0">
                    <motion.div
                      className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500"
                      animate={{
                        scale: [1, 1.1, 1],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: index * 0.2
                      }}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <motion.div
                      className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"
                      style={{ width: `${60 + Math.random() * 30}%` }}
                    />
                    <motion.div
                      className="h-3 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
                      style={{ width: `${40 + Math.random() * 20}%` }}
                    />
                  </div>
                  <div className="flex-shrink-0">
                    <motion.div
                      className="w-6 h-6 bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
                    />
                  </div>
                </motion.div>
              ))}

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center gap-2 mt-6 text-sm text-slate-500 dark:text-slate-400"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Brain className="w-4 h-4" />
                </motion.div>
                <span>AI is crafting intelligent follow-up questions...</span>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="questions"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              {questions.length > 0 ? (
                questions.map((question, index) => (
                  <motion.button
                    key={question.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{
                      scale: 1.02,
                      transition: { type: "spring", stiffness: 400, damping: 10 }
                    }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onQuestionClick(question.question)}
                    className="w-full text-left group p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-emerald-200 dark:hover:border-emerald-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-900/10 transition-all cursor-pointer hover:shadow-sm"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <motion.div
                          className="w-5 h-5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 flex items-center justify-center"
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <span className="text-xs font-medium text-white">
                            {index + 1}
                          </span>
                        </motion.div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors line-clamp-2">
                          {question.question}
                        </p>
                      </div>
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <motion.div
                          initial={{ x: -5 }}
                          whileHover={{ x: 0 }}
                          transition={{ type: "spring", stiffness: 400, damping: 10 }}
                        >
                          <ArrowRight className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                      </div>
                    </div>
                  </motion.button>
                ))
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8 text-slate-500 dark:text-slate-400"
                >
                  <motion.div
                    animate={{
                      rotate: [0, 10, -10, 0],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  </motion.div>
                  <p className="text-sm">No follow-up questions available at the moment.</p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
