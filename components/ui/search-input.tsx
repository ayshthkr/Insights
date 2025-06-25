"use client";

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  onSearch,
  isLoading = false,
  placeholder = "Ask anything...",
  className
}: SearchInputProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative w-full", className)}>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={isLoading}
          className={cn(
            "w-full px-4 py-3 pr-12 text-lg border border-gray-200 rounded-2xl",
            "bg-white dark:bg-gray-900 dark:border-gray-700",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "placeholder:text-gray-500 dark:placeholder:text-gray-400",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-all duration-200"
          )}
        />
        <button
          type="submit"
          disabled={!query.trim() || isLoading}
          className={cn(
            "absolute right-2 top-1/2 -translate-y-1/2",
            "p-2 rounded-xl bg-blue-500 text-white",
            "hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed",
            "transition-colors duration-200",
            "flex items-center justify-center"
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </button>
      </div>
    </form>
  );
}
