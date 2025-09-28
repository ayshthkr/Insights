import { NextRequest } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize AI service
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!)

interface ChatContext {
  userMessage: string
  assistantMessage: string
}

interface FollowUpRequest {
  currentQuery: string
  currentAnswer: string
  sources: Array<{
    title: string
    url: string
    snippet: string
  }>
  chatContext?: ChatContext[]
}

interface FollowUpQuestion {
  id: string
  question: string
}

export async function POST(request: NextRequest) {
  try {
    const body: FollowUpRequest = await request.json()
    const { currentQuery, currentAnswer, sources, chatContext = [] } = body

    if (!currentQuery || !currentAnswer) {
      return Response.json(
        { error: "Missing required fields: currentQuery and currentAnswer" },
        { status: 400 }
      )
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        temperature: 0.8,
        topP: 0.9,
        maxOutputTokens: 2048,
      }
    })

    // Build context from previous conversation (limit to last 6 exchanges to avoid token limits)
    const conversationContext = chatContext.length > 0
      ? chatContext.slice(-6).map((ctx, index) =>
          `Q${index + 1}: ${ctx.userMessage}\nA${index + 1}: ${ctx.assistantMessage}`
        ).join('\n\n')
      : ""

    // Build sources context
    const sourcesContext = sources.length > 0
      ? sources.map((source, index) =>
          `Source ${index + 1}: ${source.title} - ${source.snippet}`
        ).join('\n')
      : ""

    const prompt = `You are an intelligent AI assistant that generates thoughtful follow-up questions based on a conversation and search results. Your goal is to help users dive deeper into topics, explore related areas, or clarify important points.

CONVERSATION CONTEXT:
${conversationContext ? `Previous conversation (most recent exchanges):\n${conversationContext}\n\n` : ""}

CURRENT INTERACTION (HIGHEST PRIORITY):
User's most recent question: "${currentQuery}"
AI's most recent response: "${currentAnswer}"

${sourcesContext ? `AVAILABLE SOURCES:\n${sourcesContext}\n\n` : ""}

TASK:
Generate exactly 4 intelligent follow-up questions that:

1. **PRIORITIZE THE MOST RECENT INTERACTION** - Focus primarily on the current query and answer
2. Use the conversation context to maintain continuity but don't let it overshadow the current topic
3. Help the user explore deeper aspects of the current topic
4. Suggest related areas that connect to the current discussion
5. Clarify or expand on key points from the recent answer
6. Are natural, conversational, and immediately useful
7. Avoid being too generic or obvious
8. Consider the sources available to provide context-aware questions
9. Build upon what was just discussed while being forward-looking
10. Create questions that feel like a natural next step in the conversation
11. Keep each question concise and under 2 lines when displayed

IMPORTANT: Return ONLY a valid JSON object with this exact structure (no markdown, no code blocks, no extra text):
{
  "questions": [
    {
      "id": "1",
      "question": "Your first concise follow-up question here"
    },
    {
      "id": "2",
      "question": "Your second concise follow-up question here"
    },
    {
      "id": "3",
      "question": "Your third concise follow-up question here"
    },
    {
      "id": "4",
      "question": "Your fourth concise follow-up question here"
    }
  ]
}

Ensure the JSON is properly formatted and contains exactly 4 questions. Do not include any text outside the JSON object. Do not wrap in markdown code blocks.`

    const result = await model.generateContent(prompt)
    const response = result.response
    let text = response.text()

    // Clean up the response - remove markdown code blocks if present
    text = text.replace(/```json\s*\n?/g, '').replace(/```\s*$/g, '').trim()

    // Try to parse the JSON response
    let questions: FollowUpQuestion[] = []
    try {
      const parsedResponse = JSON.parse(text)
      if (parsedResponse.questions && Array.isArray(parsedResponse.questions)) {
        questions = parsedResponse.questions.map((q: { id?: string; question?: string }, index: number) => ({
          id: q.id || String(index + 1),
          question: q.question || ""
        })).filter((q: FollowUpQuestion) => q.question.length > 0)
      }
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError)
      console.error("Raw response:", text)

      // Fallback: try to extract questions manually if JSON parsing fails
      const questionMatches = text.match(/"question":\s*"([^"]+)"/g)

      if (questionMatches && questionMatches.length > 0) {
        questions = questionMatches.slice(0, 4).map((match, index) => {
          const question = match.match(/"question":\s*"([^"]+)"/)?.[1] || ""
          return {
            id: String(index + 1),
            question
          }
        }).filter(q => q.question.length > 0)
      }
    }

    // Limit to 4 questions maximum
    questions = questions.slice(0, 4)

    return Response.json({
      questions,
      totalGenerated: questions.length
    })

  } catch (error) {
    console.error("Error generating follow-up questions:", error)
    return Response.json(
      {
        error: "Failed to generate follow-up questions",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
