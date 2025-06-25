"use client"

import { useState, useEffect } from "react"
import { Search, Brain, CheckCircle, Globe } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface SearchProgressProps {
  query: string
  stage: string
}

const stages = [
  { id: "searching", label: "Searching the web", icon: Search, description: "Finding relevant sources" },
  { id: "analyzing", label: "Analyzing sources", icon: Globe, description: "Processing information" },
  { id: "generating", label: "Generating answer", icon: Brain, description: "Creating comprehensive response" },
  { id: "complete", label: "Complete", icon: CheckCircle, description: "Ready to display" },
]

export function SearchProgress({ query, stage }: SearchProgressProps) {
  const [progress, setProgress] = useState(0)
  const [currentStageIndex, setCurrentStageIndex] = useState(0)

  useEffect(() => {
    const stageIndex = stages.findIndex((s) => stage.toLowerCase().includes(s.id))
    if (stageIndex !== -1) {
      setCurrentStageIndex(stageIndex)
      setProgress((stageIndex + 1) * 25)
    }
  }, [stage])

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in-up">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        {/* Query Display */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Searching for: <span className="text-emerald-600 dark:text-emerald-400">&ldquo;{query}&rdquo;</span>
          </h2>
          <Progress value={progress} className="h-2 progress-bar" />
        </div>

        {/* Stages */}
        <div className="space-y-4">
          {stages.map((stageItem, index) => {
            const isActive = index === currentStageIndex
            const isCompleted = index < currentStageIndex
            const Icon = stageItem.icon

            return (
              <div
                key={stageItem.id}
                className={cn(
                  "flex items-center gap-4 p-3 rounded-xl transition-all duration-300",
                  isActive && "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
                  isCompleted && "opacity-60",
                )}
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
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
