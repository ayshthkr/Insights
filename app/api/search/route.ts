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

async function searchWeb(query: string): Promise<SearchResult[]> {
  try {
    const searchResults = await exa.searchAndContents(query, {
      numResults: 5,
      useAutoprompt: true,
      type: "auto",
    })

    const results: SearchResult[] = []

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

      results.push(searchResult)
    }

    return results
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
          // Send initial status
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Searching the web...', stage: 'searching' })}\n\n`))

          // Search the web
          const sources = await searchWeb(query)

          if (sources.length === 0) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No sources found' })}\n\n`))
            controller.close()
            return
          }

          // Send sources found
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'sources',
            sources: sources.map(s => ({ title: s.title, url: s.url, snippet: s.snippet })),
            message: 'Analyzing sources...',
            stage: 'analyzing'
          })}\n\n`))

          // Generate answer with streaming
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'status', message: 'Generating answer...', stage: 'generating' })}\n\n`))

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
            timestamp: new Date().toISOString()
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
