export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export interface SearchResponse {
  query: string;
  answer: string;
  sources: SearchResult[];
  timestamp: string;
  requiresSearch?: boolean;
  searchTerms?: string[];
}

export interface SearchRequest {
  query: string;
}

export interface ApiError {
  error: string;
}

export interface QueryClassification {
  requiresSearch: boolean;
  searchTerms: string[];
  reasoning: string;
}
