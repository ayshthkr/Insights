import { GoogleGenerativeAI } from '@google/generative-ai';
import Exa from 'exa-js';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { NextRequest, NextResponse } from 'next/server';

// Initialize AI services
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
const exa = new Exa(process.env.EXA_API_KEY!);

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

interface SearchResponse {
  query: string;
  answer: string;
  sources: SearchResult[];
  timestamp: string;
}

async function extractContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PerplexityClone/1.0)',
      },
    });

    const $ = cheerio.load(response.data);

    // Remove script, style, nav, header, footer elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();

    // Extract main content
    let content = '';

    // Try to find main content areas
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0) {
        content = element.text().trim();
        break;
      }
    }

    // Fallback to body content if no specific content area found
    if (!content) {
      content = $('body').text().trim();
    }

    // Clean up the content
    content = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Limit content length
    return content.substring(0, 5000);
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error);
    return '';
  }
}

async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const searchResults = await exa.searchAndContents(query, {
      numResults: 5,
      useAutoprompt: true,
      type: 'auto',
    });

    const results: SearchResult[] = [];

    for (const result of searchResults.results) {
      const searchResult: SearchResult = {
        title: result.title || 'Untitled',
        url: result.url,
        snippet: result.text?.substring(0, 200) + '...' || '',
        content: result.text || '',
      };

      // If we don't have content, try to extract it
      if (!searchResult.content && result.url) {
        searchResult.content = await extractContent(result.url);
      }

      results.push(searchResult);
    }

    return results;
  } catch (error) {
    console.error('Error searching web:', error);
    return [];
  }
}

async function generateAnswer(query: string, sources: SearchResult[]): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Combine all source content
    const combinedContent = sources
      .map((source, index) => `
Source ${index + 1}: ${source.title}
URL: ${source.url}
Content: ${source.content || source.snippet}
---`)
      .join('\n');

    const prompt = `
You are an AI assistant that provides comprehensive, accurate answers based on web search results.

Query: "${query}"

Available Sources:
${combinedContent}

Instructions:
1. Provide a comprehensive answer to the user's query based on the provided sources
2. Use specific information from the sources when possible
3. Include relevant details and context
4. If sources contradict each other, mention this
5. Keep the answer informative but concise
6. Use a natural, conversational tone
7. Include citations in the format [1], [2], etc. referencing the source numbers

Please provide a well-structured answer:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Error generating answer:', error);
    return 'I apologize, but I encountered an error while generating an answer. Please try again.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Query is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if API keys are configured
    if (!process.env.GOOGLE_AI_API_KEY || !process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: 'API keys not configured. Please set GOOGLE_AI_API_KEY and EXA_API_KEY in environment variables.' },
        { status: 500 }
      );
    }

    // Search the web
    const sources = await searchWeb(query);

    if (sources.length === 0) {
      return NextResponse.json({
        query,
        answer: 'I apologize, but I could not find any relevant information for your query. Please try rephrasing your question.',
        sources: [],
        timestamp: new Date().toISOString(),
      } as SearchResponse);
    }

    // Generate answer using AI
    const answer = await generateAnswer(query, sources);

    const response: SearchResponse = {
      query,
      answer,
      sources: sources.map(source => ({
        title: source.title,
        url: source.url,
        snippet: source.snippet,
      })),
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}
