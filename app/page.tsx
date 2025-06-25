"use client";

import React, { useState } from 'react';
import { SearchInput } from '@/components/ui/search-input';
import { SearchResults } from '@/components/ui/search-results';
import { SearchLoading } from '@/components/ui/search-loading';
import { SearchError } from '@/components/ui/search-error';

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

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentQuery, setCurrentQuery] = useState<string>('');

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentQuery(query);
    setSearchResult(null);

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data: SearchResponse = await response.json();
      setSearchResult(data);
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (currentQuery) {
      handleSearch(currentQuery);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Perplexity Clone
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Ask anything and get comprehensive answers powered by AI and real-time web search
          </p>
        </div>

        {/* Search Input */}
        <div className="max-w-3xl mx-auto mb-8">
          <SearchInput
            onSearch={handleSearch}
            isLoading={isLoading}
            placeholder="Ask anything..."
          />
        </div>

        {/* Search State Display */}
        <div className="max-w-5xl mx-auto">
          {isLoading && (
            <SearchLoading query={currentQuery} />
          )}

          {error && (
            <SearchError error={error} onRetry={handleRetry} />
          )}

          {searchResult && !isLoading && !error && (
            <SearchResults result={searchResult} />
          )}

          {/* Welcome message when no search has been made */}
          {!isLoading && !error && !searchResult && (
            <div className="text-center py-16">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Welcome to your AI-powered search assistant
                </h2>
                <p className="text-gray-500 dark:text-gray-400 mb-8">
                  Get instant, comprehensive answers to your questions backed by real-time web research and AI analysis.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      💡 Try asking about current events
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      "What are the latest developments in AI technology?"
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      🔍 Research complex topics
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      "Explain quantum computing and its practical applications"
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      📈 Get market insights
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      "What are the current trends in cryptocurrency markets?"
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                      🛠️ Learn new skills
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      "How do I get started with machine learning?"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
