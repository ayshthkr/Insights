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
}

export interface SearchRequest {
  query: string;
}

export interface ApiError {
  error: string;
}
