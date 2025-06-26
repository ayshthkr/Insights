"use client"

import { useState, useEffect } from "react"
import { ExternalLink, Globe } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"

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
  const [faviconLoaded, setFaviconLoaded] = useState(false)

  useEffect(() => {
    if (isVisible && !faviconLoaded && source?.url) {
      try {
        const domain = new URL(source.url).hostname
        const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`

        // Preload favicon
        const img = new window.Image()
        img.onload = () => {
          setFaviconUrl(favicon)
          setFaviconLoaded(true)
        }
        img.onerror = () => {
          setFaviconLoaded(true) // Still set to true to avoid retrying
        }
        img.src = favicon
      } catch (error) {
        console.error('Error loading favicon:', error)
        setFaviconLoaded(true) // Prevent retry on URL errors
      }
    }
  }, [isVisible, source?.url, faviconLoaded])

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
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50"
          >
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg p-2.5 max-w-sm w-96">
              {/* Arrow */}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-white dark:border-t-slate-800"></div>

              <div className="flex items-center gap-2">
                {/* Favicon */}
                <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded flex items-center justify-center flex-shrink-0">
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
                    <Globe className="w-3 h-3 text-white" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-xs mb-0.5 line-clamp-1">
                    {source.title}
                  </h3>
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

                <button
                  onClick={handleClick}
                  className="flex items-center gap-1 px-2 py-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/30 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium transition-colors flex-shrink-0"
                >
                  <ExternalLink className="w-3 h-3" />
                  Visit
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  )
}
