import { GoogleGenerativeAI } from "@google/generative-ai"
import Exa from "exa-js"
import axios from "axios"
import * as cheerio from "cheerio"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

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

async function classifyQuery(query: string, chatContext?: string): Promise<QueryClassification> {
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

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Get current date information for temporal context
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
    const currentDay = currentDate.getDate()
    const dateContext = `\n\nCURRENT DATE CONTEXT: Today is ${currentMonth} ${currentDay}, ${currentYear}. Use this date information when generating search terms to ensure they are temporally appropriate and current.`

    const contextPrompt = chatContext
      ? `\n\nPrevious conversation context:\n${chatContext}\n\nCurrent query is in context of this conversation. Consider what has been discussed before when determining if web search is needed.`
      : ""

    const prompt = `
You are an AI assistant that determines whether a user query requires web search or can be answered with general knowledge.

Analyze this query: "${query}"${contextPrompt}${dateContext}

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
- Follow-up questions that can be answered based on conversation context
- Current year is 2025

If web search IS required, generate 2-3 specific, focused search terms that would be most effective for finding relevant information.

IMPORTANT FOR SEARCH TERMS:
- Include temporal context when the query relates to current events, trends, or time-sensitive information
- For "latest" or "recent" queries, include the current year (${currentYear}) in search terms
- For current events, add terms like "news", "updates", or the current month/year
- For trends or developments, include "2024" or "2025" to get current information
- For data that changes regularly, include "current" or the specific time period

Respond in JSON format:
{
  "requiresSearch": boolean,
  "searchTerms": ["term1", "term2", "term3"],
  "reasoning": "Brief explanation of the decision"
}

Important: Keep search terms concise and specific. Focus on key concepts rather than full sentences.
Examples of good search terms:
- "AI trends 2025", "stock market news January 2025", "climate change data 2024"
- "latest iPhone release 2025", "current inflation rates", "recent medical breakthroughs 2024"
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

async function evaluateContextQuality(query: string, sources: SearchResult[]): Promise<{ isInsufficient: boolean; newSearchTerms?: string[] }> {
  try {
    if (sources.length === 0) {
      return { isInsufficient: true, newSearchTerms: [query] }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    // Get current date information for temporal context
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
    const dateContext = `\n\nCURRENT DATE CONTEXT: Today is ${currentMonth} ${currentDate.getDate()}, ${currentYear}. When generating new search terms, include appropriate temporal context (current year, recent, latest, etc.) for time-sensitive queries.`

    // Combine source content for evaluation
    const combinedContent = sources
      .map(source => `${source.title}: ${source.content || source.snippet}`)
      .join("\n\n")
      .substring(0, 3000) // Limit content for evaluation

    const prompt = `
Evaluate whether the provided search results contain sufficient information to answer the user's query.

User Query: "${query}"${dateContext}

Search Results:
${combinedContent}

Analyze the search results and determine:
1. Do the results contain relevant information to answer the user's query?
2. Are there enough details to provide a comprehensive answer?
3. If insufficient, what alternative search terms would be more effective?

When generating new search terms:
- Include temporal context for current events, trends, or time-sensitive information
- For queries about "latest", "recent", or "current" information, include "${currentYear}" in search terms
- Add contextual terms like "news", "updates", "current data" for better results

Respond in JSON format:
{
  "isInsufficient": boolean,
  "reasoning": "Brief explanation of the evaluation",
  "newSearchTerms": ["term1", "term2"] // Only if isInsufficient is true, include temporal context when relevant
}

Consider results insufficient if:
- They don't directly relate to the query topic
- They lack the specific information requested
- They are too vague or general
- The query requires more recent or specialized information`

    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return { isInsufficient: false }
    }

    const evaluation = JSON.parse(jsonMatch[0])

    return {
      isInsufficient: evaluation.isInsufficient || false,
      newSearchTerms: evaluation.newSearchTerms || []
    }
  } catch (error) {
    console.error("Error evaluating context quality:", error)
    // If evaluation fails, assume context is sufficient to avoid infinite loops
    return { isInsufficient: false }
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

async function* generateAnswer(query: string, sources: SearchResult[], chatContext?: string): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

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

    const contextPrompt = chatContext
      ? `\n\nPrevious conversation context:\n${chatContext}\n\nConsider this context when answering. Reference previous parts of the conversation if relevant.`
      : ""

    const prompt = `
You are a helpful AI assistant providing direct, comprehensive answers based on web search results.

User Query: "${query}"${contextPrompt}

Available Sources:
${combinedContent}

Instructions:
1. Answer the user's query directly and comprehensively using the provided sources
2. Start your response by directly addressing the question - do not begin with phrases like "Here's a summary" or "Based on my research"
3. Use specific information from the sources when possible
4. Include relevant details and context that would be helpful to the user
5. If sources contradict each other, acknowledge the conflicting information
6. Maintain a natural, conversational tone while being informative
7. Include citations in the format [1], [2], etc. referencing the source numbers
8. If there is previous conversation context, maintain continuity and reference it when relevant
9. Format your response using Markdown syntax for better readability:
   - Use **bold** for emphasis
   - Use *italics* for lesser emphasis
   - Use bullet points and numbered lists where appropriate
   - Use headers (##, ###) to structure longer responses
   - Use code blocks \`\`\` for any code examples
   - Use blockquotes > for quotes from sources

Provide a well-structured, directly responsive answer that immediately addresses the user's question:`

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

async function* generateDirectAnswer(query: string, chatContext?: string): AsyncGenerator<string, void, unknown> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

    const contextPrompt = chatContext
      ? `\n\nPrevious conversation context:\n${chatContext}\n\nConsider this context when answering. Reference previous parts of the conversation if relevant.`
      : ""

    const prompt = `
You are a helpful AI assistant providing direct, comprehensive answers using your general knowledge.

User Query: "${query}"${contextPrompt}

Instructions:
1. Answer the user's query directly and comprehensively using your general knowledge
2. Start your response by directly addressing the question - do not begin with phrases like "Here's a summary" or "Based on my knowledge"
3. Be accurate and informative while maintaining a natural, conversational tone
4. If there is previous conversation context, maintain continuity and reference it when relevant
5. Format your response using Markdown syntax for better readability:
   - Use **bold** for emphasis
   - Use *italics* for lesser emphasis
   - Use bullet points and numbered lists where appropriate
   - Use headers (##, ###) to structure longer responses
   - Use code blocks \`\`\` for any code examples
   - Use blockquotes > for quotes when appropriate
6. If you're uncertain about current information, mention that the information might be outdated
7. Be helpful and engaging in your response

Provide a well-structured, directly responsive answer that immediately addresses the user's question:`

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
    const { query, chatId } = await request.json()

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required and must be a string" }, { status: 400 })
    }

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Ensure user exists in database
    await db.ensureUserExists(userId)

    // Log search activity
    await db.logActivity(userId, 'INFO', 'Search initiated', { query, chatId })

    // Check if API keys are configured
    if (!process.env.GOOGLE_AI_API_KEY || !process.env.EXA_API_KEY) {
      await db.logActivity(userId, 'ERROR', 'API keys not configured')
      return NextResponse.json(
        { error: "API keys not configured. Please set GOOGLE_AI_API_KEY and EXA_API_KEY in environment variables." },
        { status: 500 },
      )
    }

    // Determine if we need to create a new chat or use existing
    let currentChatId = chatId
    if (!currentChatId) {
      // Generate a title from the query for new chat
      const title = await db.generateChatTitle(query)
      currentChatId = await db.createChat(userId, title)
    }

    // Get previous messages for context if this is an existing chat
    let chatContext = ""
    if (currentChatId) {
      const previousMessages = await db.getChatMessages(currentChatId)
      if (previousMessages.length > 0) {
        // Format previous messages as context (limit to last 10 messages to avoid token limits)
        // Exclude the current query if it's already in the messages (for retry scenarios)
        const recentMessages = previousMessages.slice(-10)
        chatContext = recentMessages
          .map(msg => `${msg.role === 'user' ? 'Human' : 'Assistant'}: ${msg.content}`)
          .join('\n\n')

        await db.logActivity(userId, 'INFO', 'Using chat context', {
          chatId: currentChatId,
          contextMessages: recentMessages.length,
          hasContext: chatContext.length > 0,
          contextPreview: chatContext.substring(0, 100) + (chatContext.length > 100 ? '...' : '')
        })
      }
    }

    // Save user message to database (save after getting context to avoid including current message in context)
    await db.saveMessage(currentChatId, 'user', query)

    // Create a ReadableStream for streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        try {
          // Step 1: Classify the query
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Analyzing query...',
            stage: 'analyzing',
            chatId: currentChatId
          })}\n\n`))

          const classification = await classifyQuery(query, chatContext)

          // Log classification with context info
          await db.logActivity(userId, 'INFO', 'Query classified', {
            chatId: currentChatId,
            requiresSearch: classification.requiresSearch,
            hasContext: !!chatContext,
            contextLength: chatContext?.length || 0,
            reasoning: classification.reasoning
          })

          if (!classification.requiresSearch) {
            // Direct answer without web search
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              message: chatContext ? 'Generating answer using conversation context...' : 'Generating answer from knowledge base...',
              stage: 'generating',
              searchTerms: [],
              requiresSearch: false,
              chatId: currentChatId
            })}\n\n`))

            let fullAnswer = ""
            for await (const chunk of generateDirectAnswer(query, chatContext)) {
              fullAnswer += chunk
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'answer_chunk',
                chunk: chunk,
                fullAnswer: fullAnswer,
                chatId: currentChatId
              })}\n\n`))
            }

            // Save assistant response to database
            await db.saveMessage(
              currentChatId,
              'assistant',
              fullAnswer,
              false,
              [],
              []
            )

            // Send the complete answer without sources
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'answer',
              answer: fullAnswer,
              query,
              sources: [],
              timestamp: new Date().toISOString(),
              requiresSearch: false,
              searchTerms: [],
              chatId: currentChatId
            })}\n\n`))

            await db.logActivity(userId, 'INFO', 'Search completed without web search', {
              chatId: currentChatId,
              query,
              answerLength: fullAnswer.length
            })

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
            requiresSearch: true,
            chatId: currentChatId
          })}\n\n`))

          // Implement feedback loop: search and evaluate context up to 3 times
          let sources: SearchResult[] = []
          let currentSearchTerms = classification.searchTerms
          let searchAttempt = 1
          const maxAttempts = 3

          while (searchAttempt <= maxAttempts) {
            // Search the web using the current search terms
            sources = await searchWeb(currentSearchTerms)

            if (sources.length === 0) {
              if (searchAttempt === maxAttempts) {
                await db.logActivity(userId, 'WARN', 'No sources found after all attempts', {
                  chatId: currentChatId,
                  query,
                  searchTerms: currentSearchTerms
                })
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'No sources found for the search terms' })}\n\n`))
                controller.close()
                return
              }
              // Try with broader search terms
              currentSearchTerms = [query]
              searchAttempt++
              continue
            }

            // Evaluate context quality
            const evaluation = await evaluateContextQuality(query, sources)

            if (!evaluation.isInsufficient || searchAttempt === maxAttempts) {
              // Context is sufficient or we've reached max attempts
              break
            }

            // Context is insufficient, try again with new search terms
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'status',
              message: `Refining search: ${evaluation.newSearchTerms?.join(', ')}...`,
              stage: 'searching',
              searchTerms: evaluation.newSearchTerms || [query],
              requiresSearch: true,
              chatId: currentChatId
            })}\n\n`))

            currentSearchTerms = evaluation.newSearchTerms || [query]
            searchAttempt++
          }

          // Send sources found
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'sources',
            sources: sources.map(s => ({ title: s.title, url: s.url, snippet: s.snippet })),
            message: 'Analyzing sources...',
            stage: 'analyzing',
            searchTerms: currentSearchTerms,
            chatId: currentChatId
          })}\n\n`))

          // Generate answer with streaming
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'status',
            message: 'Generating comprehensive answer...',
            stage: 'generating',
            chatId: currentChatId
          })}\n\n`))

          let fullAnswer = ""
          for await (const chunk of generateAnswer(query, sources, chatContext)) {
            fullAnswer += chunk
            // Send streaming answer chunks
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'answer_chunk',
              chunk: chunk,
              fullAnswer: fullAnswer,
              chatId: currentChatId
            })}\n\n`))
          }

          // Save assistant response to database
          const sourcesForDb = sources.map(s => ({ title: s.title, url: s.url, snippet: s.snippet }))
          await db.saveMessage(
            currentChatId,
            'assistant',
            fullAnswer,
            true,
            currentSearchTerms,
            sourcesForDb
          )

          // Send the complete answer
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'answer',
            answer: fullAnswer,
            query,
            sources: sourcesForDb,
            timestamp: new Date().toISOString(),
            requiresSearch: true,
            searchTerms: currentSearchTerms,
            chatId: currentChatId
          })}\n\n`))

          await db.logActivity(userId, 'INFO', 'Search completed with web search', {
            chatId: currentChatId,
            query,
            sourcesFound: sources.length,
            answerLength: fullAnswer.length,
            searchTerms: currentSearchTerms
          })

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'complete' })}\n\n`))
          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          await db.logActivity(userId, 'ERROR', 'Streaming error occurred', {
            chatId: currentChatId,
            query,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
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
