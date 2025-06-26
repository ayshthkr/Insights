"use client"

import { useState, useEffect, useRef } from "react"
import { Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { FaviconService } from "@/lib/favicon-service"

interface CitationTooltipProps {
  source: {
    title: string
    url: string
    snippet: string
  }
  children: React.ReactNode
  onGoToSource: () => void
}

export function CitationTooltip({ source, children, onGoToSource }: CitationTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [showBelow, setShowBelow] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)

  // Check positioning when tooltip becomes visible
  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipHeight = 200 // Approximate tooltip height

      // If there's not enough space above, show below
      if (triggerRect.top < tooltipHeight + 20) {
        setShowBelow(true)
      } else {
        setShowBelow(false)
      }
    }
  }, [isVisible])

  useEffect(() => {
    if (isVisible && source?.url) {
      // First check if we have a cached favicon
      const cached = FaviconService.getCachedFavicon(source.url)
      if (cached) {
        setFaviconUrl(cached)
      } else {
        // If not cached, fetch it
        FaviconService.getFavicon(source.url).then(setFaviconUrl)
      }
    }
  }, [isVisible, source?.url])

  // Validate source data to prevent runtime errors
  if (!source || typeof source.url !== 'string' || typeof source.title !== 'string') {
    return <span>{children}</span>
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onGoToSource()
  }

  return (
    <span className="relative inline-block">
      <span
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={handleClick}
        className="cursor-pointer"
      >
        {children}
      </span>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: showBelow ? -10 : 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: showBelow ? -10 : 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={`absolute left-1/2 transform -translate-x-1/2 z-50 ${
              showBelow
                ? 'top-full mt-2'
                : 'bottom-full mb-2'
            }`}
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-3 max-w-sm w-96">
              {/* Arrow */}
              <div className={`absolute left-1/2 transform -translate-x-1/2 border-4 border-transparent ${
                showBelow
                  ? 'bottom-full border-b-white dark:border-b-slate-800'
                  : 'top-full border-t-white dark:border-t-slate-800'
              }`}></div>

              <div className="flex items-start gap-3">
                {/* Favicon */}
                <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                  {faviconUrl ? (
                    <Image
                      src={faviconUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="rounded"
                      onError={() => setFaviconUrl(null)}
                    />
                  ) : (
                    <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm mb-1 line-clamp-2 leading-tight">
                    {source.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                    {(() => {
                      try {
                        return new URL(source.url).hostname
                      } catch {
                        return source.url
                      }
                    })()}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {source.snippet}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
