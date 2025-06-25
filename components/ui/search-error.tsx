"use client";

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function SearchError({ error, onRetry, className }: SearchErrorProps) {
  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">
              Search Error
            </h3>
            <p className="text-red-700 dark:text-red-200 mb-4">
              {error}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className={cn(
                  "inline-flex items-center gap-2 px-4 py-2",
                  "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200",
                  "border border-red-200 dark:border-red-700 rounded-lg",
                  "hover:bg-red-200 dark:hover:bg-red-900/60",
                  "transition-colors font-medium"
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
