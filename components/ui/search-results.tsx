"use client";

import React from 'react';
import { ExternalLink, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

interface SearchResponse {
  query: string;
  answer: string;
  sources: SearchResult[];
  timestamp: string;
}

interface SearchResultsProps {
  result: SearchResponse;
  className?: string;
}

export function SearchResults({ result, className }: SearchResultsProps) {
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatAnswer = (answer: string) => {
    // Replace citation patterns [1], [2], etc. with clickable links
    return answer.replace(/\[(\d+)\]/g, (match, num) => {
      const sourceIndex = parseInt(num) - 1;
      if (sourceIndex >= 0 && sourceIndex < result.sources.length) {
        return `<a href="#source-${sourceIndex}" class="citation-link text-blue-600 hover:text-blue-800 font-medium">[${num}]</a>`;
      }
      return match;
    });
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-6", className)}>
      {/* Query Display */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Clock className="w-4 h-4" />
        <span>Searched at {formatTimestamp(result.timestamp)}</span>
      </div>

      {/* AI Answer */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Answer
        </h2>
        <div
          className="prose prose-gray dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: formatAnswer(result.answer) }}
        />
      </div>

      {/* Sources */}
      {result.sources.length > 0 && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
            Sources
          </h3>
          <div className="space-y-4">
            {result.sources.map((source, index) => (
              <div
                key={index}
                id={`source-${index}`}
                className={cn(
                  "p-4 border border-gray-100 dark:border-gray-800 rounded-xl",
                  "hover:border-gray-200 dark:hover:border-gray-700 transition-colors",
                  "scroll-mt-4" // For smooth scrolling to citations
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium flex items-center justify-center">
                        {index + 1}
                      </span>
                      <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                        {source.title}
                      </h4>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {source.snippet}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate">
                      {source.url}
                    </p>
                  </div>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "flex-shrink-0 p-2 rounded-lg",
                      "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300",
                      "hover:bg-gray-100 dark:hover:bg-gray-800",
                      "transition-colors"
                    )}
                    title="Open in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
