import { GoogleGenerativeAI } from "@google/generative-ai"
import Exa from "exa-js"
import axios from "axios"
import * as cheerio from "cheerio"
import { type NextRequest, NextResponse } from "next/server"

// Initialize AI services
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)
const exa = new Exa(process.env.EXA_API_KEY!)

interface SearchResult {
  title: string
  url: string
  snippet: string
  content?: string
}

interface QueryClassification {
  requiresSearch: boolean
  searchTerms: string[]
  reasoning: string
}

async function extractContent(url: string): Promise<string> {
  try {
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; PerplexityClone/1.0)",
      },
    })

    const $ = cheerio.load(response.data)

    // Remove script, style, nav, header, footer elements
    $("script, style, nav, header, footer, aside, .advertisement, .ads").remove()

    // Extract main content
    let content = ""

    // Try to find main content areas
    const contentSelectors = [
      "article",
      "main",
      ".content",
      ".post-content",
      ".entry-content",
      ".article-content",
      "#content",
      ".main-content",
    ]

    for (const selector of contentSelectors) {
      const element = $(selector)
      if (element.length > 0) {
        const textContent = element.text()
        if (textContent && typeof textContent === 'string') {
          content = textContent.trim()
          break
        }
      }
    }

    // Fallback to body content if no specific content area found
    if (!content) {
      const bodyContent = $("body").text()
      if (bodyContent && typeof bodyContent === 'string') {
        content = bodyContent.trim()
      }
    }

    // Clean up the content
    if (content && typeof content === 'string') {
      content = content
        .replace(/\s+/g, " ")
        .replace(/\n\s*\n/g, "\n")
        .trim()
    }

    // Limit content length
    return content.substring(0, 5000)
  } catch (error) {
    console.error(`Error extracting content from ${url}:`, error)
    return ""
  }
}

async function classifyQuery(query: string): Promise<QueryClassification> {
  try {
    // First, do a quick check for obviously simple queries that don't need web search
    const simplePatterns = [
      /^(hi|hello|hey|hiya|greetings)$/i,
      /^(how are you|what's up|wassup)$/i,
      /^(thanks|thank you|thx)$/i,
      /^(bye|goodbye|see you|cya)$/i,
      /^(yes|no|maybe|sure|ok|okay)$/i,
      /^(what is \d+[\+\-\*\/]\d+)$/i, // Simple math
      /^(define|what does .* mean|etymology of)$/i,
    ]

    // Check if query matches simple patterns
    const isSimpleQuery = simplePatterns.some(pattern => pattern.test(query.trim()))

    if (isSimpleQuery) {
      return {
        requiresSearch: false,
        searchTerms: [],
        reasoning: "Simple conversational query or basic question that can be answered with general knowledge"
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
You are an AI assistant that determines whether a user query requires web search or can be answered with general knowledge.

Analyze this query: "${query}"

IMPORTANT: Be conservative - prefer NOT requiring web search unless the query clearly needs current/real-time information.

Consider these criteria for requiring web search:
- Current events, news, or recent developments (after 2023)
- Real-time information (stock prices, weather, sports scores, current time/date)
- Specific facts that change frequently (prices, availability, rankings)
- Product reviews, current pricing, or availability
- Recent research papers or discoveries (2024 or later)
- Current trends, viral content, or social media phenomena
- Breaking news or ongoing situations
- Specific statistics or data that change regularly
- Questions about "what's happening now" or "latest" information

Consider these criteria for NOT requiring web search (use general knowledge):
- Basic greetings, small talk, or conversational responses
- General explanations of concepts, theories, or phenomena
- Historical facts that don't change (events before 2023)
- Mathematical concepts, calculations, or problems
- Basic scientific principles and established facts
- Language questions (definitions, etymology, grammar, translations)
- General advice, how-to questions, or tutorials
- Philosophical discussions or thought experiments
- Creative writing, storytelling, or brainstorming
- Code examples, programming concepts, or technical explanations
- Academic subjects with established knowledge

If web search IS required, generate 2-3 specific, focused search terms that would be most effective for finding relevant information.

Respond in JSON format:
{
  "requiresSearch": boolean,
  "searchTerms": ["term1", "term2", "term3"],
  "reasoning": "Brief explanation of the decision"
}

Important: Keep search terms concise and specific. Focus on key concepts rather than full sentences.
Examples of search terms: "AI trends 2024", "stock market news", "climate change data"
NOT: "what are the latest trends in artificial intelligence technology"`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error("Failed to parse classification response")
    }

    const classification = JSON.parse(jsonMatch[0]) as QueryClassification

    // Validate the response structure
    if (typeof classification.requiresSearch !== 'boolean') {
      throw new Error("Invalid classification response structure")
    }

    return classification
  } catch (error) {
    console.error("Error classifying query:", error)

    // Improved fallback logic - check query length and common patterns
    const queryLower = query.toLowerCase().trim()
    const queryWords = queryLower.split(/\s+/)

    // For very short queries or common greetings, default to no search
    if (queryWords.length <= 2 &&
        (queryLower.includes('hi') || queryLower.includes('hello') ||
         queryLower.includes('hey') || queryLower.includes('thanks') ||
         queryLower.includes('bye') || queryLower.includes('yes') ||
         queryLower.includes('no'))) {
      return {
        requiresSearch: false,
        searchTerms: [],
        reasoning: "Classification failed, but query appears to be simple greeting/response"
      }
    }

    // For longer queries or ambiguous cases, default to search
    return {
      requiresSearch: true,
      searchTerms: [query],
      reasoning: "Classification failed, defaulting to web search for safety"
    }
  }
}

async function searchWeb(searchTerms: string[]): Promise<SearchResult[]> {
  try {
    const allResults: SearchResult[] = []

    // Search for each term and combine results
    for (const term of searchTerms) {
      try {
        const searchResults = await exa.searchAndContents(term, {
          numResults: Math.ceil(5 / searchTerms.length), // Distribute results across terms
          useAutoprompt: true,
          type: "auto",
        })

        for (const result of searchResults.results) {
          // Validate that we have the required fields
          if (!result.url || typeof result.url !== 'string') {
            console.warn('Skipping result with invalid URL:', result)
            continue
          }

          const searchResult: SearchResult = {
            title: (result.title && typeof result.title === 'string') ? result.title : "Untitled",
            url: result.url,
            snippet: (result.text && typeof result.text === 'string') ? result.text.substring(0, 200) + "..." : "No snippet available",
            content: (result.text && typeof result.text === 'string') ? result.text : "",
          }

          // If we don't have content, try to extract it
          if (!searchResult.content && result.url) {
            searchResult.content = await extractContent(result.url)
          }

          allResults.push(searchResult)
        }
      } catch (termError) {
        console.error(`Error searching for term "${term}":`, termError)
        // Continue with other terms if one fails
      }
    }

    // Remove duplicates based on URL and limit total results
    const uniqueResults = allResults.filter((result, index, self) =>
      index === self.findIndex(r => r.url === result.url)
    ).slice(0, 5)

    return uniqueResults
  } catch (error) {
    console.error("Error searching web:", error)
    return []
  }
}

async function* generateAnswer(query: string, sources: SearchResult[]): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    // Combine all source content
    const combinedContent = sources
      .map(
        (source, index) => `
Source ${index + 1}: ${source.title}
URL: ${source.url}
Content: ${source.content || source.snippet}
---`,
      )
      .join("\n")

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
8. Format your response using Markdown syntax for better readability:
   - Use **bold** for emphasis
   - Use *italics* for lesser emphasis
   - Use bullet points and numbered lists where appropriate
   - Use headers (##, ###) to structure longer responses
   - Use code blocks \`\`\` for any code examples
   - Use blockquotes > for quotes from sources

Please provide a well-structured markdown-formatted answer:`

    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        yield chunkText
      }
    }
  } catch (error) {
    console.error("Error generating answer:", error)
    yield "I apologize, but I encountered an error while generating an answer. Please try again."
  }
}

async function* generateDirectAnswer(query: string): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
You are an AI assistant that provides comprehensive, accurate answers using your general knowledge.

Query: "${query}"

Instructions:
1. Provide a comprehensive answer to the user's query using your general knowledge
2. Be accurate and informative
3. Use a natural, conversational tone
4. Format your response using Markdown syntax for better readability:
   - Use **bold** for emphasis
   - Use *italics* for lesser emphasis
   - Use bullet points and numbered lists where appropriate
   - Use headers (##, ###) to structure longer responses
   - Use code blocks \`\`\` for any code examples
   - Use blockquotes > for quotes when appropriate
5. If you're uncertain about current information, mention that the information might be outdated
6. Be helpful and engaging in your response

Please provide a well-structured markdown-formatted answer:`

    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const chunkText = chunk.text()
      if (chunkText) {
        yield chunkText
      }
    }
  } catch (error) {
    console.error("Error generating direct answer:", error)
    yield "I apologize, but I encountered an error while generating an answer. Please try again."
  }
}

export async function POST(request: NextRequest) {
  try {
    const { query } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required and must be a string" }, { status: 400 })
    }

    // Check if API keys are configured
    if (!process.env.GOOGLE_AI_API_KEY || !process.env.EXA_API_KEY) {
      return NextResponse.json(
        { error: "API keys not configured. Please set GOOGLE_AI_API_KEY and EXA_API_KEY in environment variables." },
        { status: 500 },
      )
    }

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Step 1: Classify the query
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Analyzing query...', stage: 'analyzing' })}\n\n`))

          const classification = await classifyQuery(query)

          if (!classification.requiresSearch) {
            // Direct answer without web search
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              message: 'Generating answer from knowledge base...',
              stage: 'generating',
              searchTerms: [],
              requiresSearch: false
            })}\n\n`))

            let fullAnswer = ""
            for await (const chunk of generateDirectAnswer(query)) {
              fullAnswer += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'answer_chunk',
                chunk: chunk,
                fullAnswer: fullAnswer
              })}\n\n`))
            }

            // Send the complete answer without sources
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'answer',
              answer: fullAnswer,
              query,
              sources: [],
              timestamp: new Date().toISOString(),
              requiresSearch: false,
              searchTerms: []
            })}\n\n`))

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
            controller.close()
            return
          }

          // Step 2: Web search is required
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: `Searching for: ${classification.searchTerms.join(', ')}...`,
            stage: 'searching',
            searchTerms: classification.searchTerms,
            requiresSearch: true
          })}\n\n`))

          // Search the web using the generated search terms
          const sources = await searchWeb(classification.searchTerms)

          if (sources.length === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No sources found for the search terms' })}\n\n`))
            controller.close()
            return
          }

          // Send sources found
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'sources',
            sources: sources.map(s => ({ title: s.title, url: s.url, snippet: s.snippet })),
            message: 'Analyzing sources...',
            stage: 'analyzing',
            searchTerms: classification.searchTerms
          })}\n\n`))

          // Generate answer with streaming
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Generating comprehensive answer...',
            stage: 'generating'
          })}\n\n`))

          let fullAnswer = ""
          for await (const chunk of generateAnswer(query, sources)) {
            fullAnswer += chunk
            // Send streaming answer chunks
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'answer_chunk',
              chunk: chunk,
              fullAnswer: fullAnswer
            })}\n\n`))
          }

          // Send the complete answer
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'answer',
            answer: fullAnswer,
            query,
            sources: sources.map(s => ({ title: s.title, url: s.url, snippet: s.snippet })),
            timestamp: new Date().toISOString(),
            requiresSearch: true,
            searchTerms: classification.searchTerms
          })}\n\n`))

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'An error occurred while processing your request' })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error("Search API error:", error)
    return NextResponse.json({ error: "Internal server error. Please try again later." }, { status: 500 })
  }
}
