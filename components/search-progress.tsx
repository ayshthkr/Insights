"use client"

import { useState, useEffect } from "react"
import { Search, Brain, CheckCircle, Globe, ExternalLink } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "framer-motion"
import { StreamingMarkdown } from "@/components/ui/streaming-markdown"

interface SearchResult {
  title: string
  url: string
  snippet: string
}

interface SearchProgressProps {
  query: string
  stage: string
  sources?: SearchResult[]
  streamingStage?: {
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
  streamingAnswer?: string
}

const stages = [
  { id: "analyzing", label: "Analyzing query", icon: Brain, description: "Understanding your question" },
  { id: "searching", label: "Searching the web", icon: Search, description: "Finding relevant sources" },
  { id: "processing", label: "Processing content", icon: Globe, description: "Analyzing information" },
  { id: "generating", label: "Generating answer", icon: Brain, description: "Creating comprehensive response" },
  { id: "complete", label: "Complete", icon: CheckCircle, description: "Ready to display" },
]

// Create a dynamic stages array based on whether search is required
function getStagesForQuery(requiresSearch?: boolean) {
  if (requiresSearch === false) {
    return [
      { id: "analyzing", label: "Analyzing query", icon: Brain, description: "Understanding your question" },
      { id: "generating", label: "Generating answer", icon: Brain, description: "Creating response from knowledge" },
      { id: "complete", label: "Complete", icon: CheckCircle, description: "Ready to display" },
    ]
  }
  return stages
}

export function SearchProgress({ query, stage, sources, streamingStage, streamingAnswer }: SearchProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)

  // Get appropriate stages based on whether search is required
  const currentStages = getStagesForQuery(streamingStage?.requiresSearch)

  useEffect(() => {
    let stageIndex = 0
    if (streamingStage) {
      stageIndex = currentStages.findIndex((s) => s.id === streamingStage.stage)
    } else {
      stageIndex = currentStages.findIndex((s) => stage.toLowerCase().includes(s.id))
    }

    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex)
      setProgress(((stageIndex + 1) / currentStages.length) * 100)
    }
  }, [stage, streamingStage, currentStages])

  return (
    <motion.div
      className="w-full max-w-4xl mx-auto"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        {/* Query Display with personalized details */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center"
              animate={{ rotate: streamingStage?.stage === 'searching' ? 360 : 0 }}
              transition={{ duration: 2, repeat: streamingStage?.stage === 'searching' ? Infinity : 0, ease: "linear" }}
            >
              <Search className="w-4 h-4 text-white" />
            </motion.div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {streamingStage?.searchDetails ? (
                <>
                  Searching for: <span className="text-emerald-600 dark:text-emerald-400">&ldquo;{streamingStage.searchDetails.searchedFor}&rdquo;</span>
                </>
              ) : (
                <>
                  {streamingStage?.requiresSearch === false ? (
                    <>Answering: <span className="text-emerald-600 dark:text-emerald-400">&ldquo;{query}&rdquo;</span></>
                  ) : (
                    <>Searching for: <span className="text-emerald-600 dark:text-emerald-400">&ldquo;{query}&rdquo;</span></>
                  )}
                </>
              )}
            </h2>
          </div>

          {/* Search Terms Display */}
          {streamingStage?.searchTerms && streamingStage.searchTerms.length > 0 && streamingStage.requiresSearch && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">🔍 Searching with terms:</span>
                {streamingStage.searchTerms.map((term, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Detailed search information */}
          {streamingStage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="text-sm text-slate-600 dark:text-slate-400 mb-3"
            >
              {streamingStage.stage === 'analyzing' && streamingStage.requiresSearch === false && (
                <p>🤖 Using general knowledge to answer your question...</p>
              )}
              {streamingStage.stage === 'searching' && streamingStage.requiresSearch === true && (
                <p>🔍 Scanning the web with Exa AI for relevant sources...</p>
              )}
              {streamingStage.stage === 'analyzing' && streamingStage.searchDetails && streamingStage.searchDetails.foundSources > 0 && (
                <p>📊 Found {streamingStage.searchDetails.foundSources} relevant sources, analyzing content...</p>
              )}
              {streamingStage.stage === 'generating' && (
                <p>🧠 Using Google Gemini 2.5 Flash to generate comprehensive answer...</p>
              )}
            </motion.div>
          )}

          <Progress value={progress} className="h-2 progress-bar" />
        </div>

        {/* Stages */}
        <div className="space-y-4 mb-6">
          {currentStages.map((stageItem, index) => {
            const isActive = index === currentStageIndex
            const isCompleted = index < currentStageIndex
            const Icon = stageItem.icon

            return (
              <motion.div
                key={stageItem.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                  isActive && "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
                  isCompleted && "opacity-60",
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isActive && "bg-emerald-500 text-white animate-pulse-glow",
                    isCompleted && "bg-emerald-500 text-white",
                    !isActive && !isCompleted && "bg-slate-100 dark:bg-slate-800 text-slate-400",
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-medium transition-colors",
                        isActive && "text-emerald-700 dark:text-emerald-300",
                        isCompleted && "text-emerald-600 dark:text-emerald-400",
                        !isActive && !isCompleted && "text-slate-500 dark:text-slate-400",
                      )}
                    >
                      {stageItem.label}
                    </h3>
                    {isActive && (
                      <div className="flex gap-1">
                        <div
                          className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "0ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "150ms" }}
                        />
                        <div
                          className="w-1 h-1 bg-emerald-500 rounded-full animate-bounce"
                          style={{ animationDelay: "300ms" }}
                        />
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm transition-colors",
                      isActive && "text-emerald-600 dark:text-emerald-400",
                      !isActive && "text-slate-500 dark:text-slate-400",
                    )}
                  >
                    {stageItem.description}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Sources Display */}
        <AnimatePresence>
          {sources && sources.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4"
            >
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Found {sources.length} relevant sources from Exa
              </h3>
              <div className="space-y-2">
                {sources.slice(0, 3).map((source, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 rounded-lg group hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    <div className="w-5 h-5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-medium flex items-center justify-center flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {source.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {(() => {
                          try {
                            return new URL(source.url).hostname
                          } catch {
                            return source.url
                          }
                        })()}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors flex-shrink-0" />
                  </motion.div>
                ))}
                {sources.length > 3 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 pl-9">
                    And {sources.length - 3} more sources...
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Streaming Answer Display */}
        <AnimatePresence>
          {streamingAnswer && streamingAnswer.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t border-slate-200 dark:border-slate-700 pt-4"
            >
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" />
                Generating Answer...
              </h3>
              <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
                <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
                  <StreamingMarkdown
                    content={streamingAnswer}
                    className="text-slate-700 dark:text-slate-300 leading-relaxed"
                  />
                  <motion.span
                    className="inline-block w-2 h-5 bg-emerald-500 ml-1"
                    animate={{ opacity: [1, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
