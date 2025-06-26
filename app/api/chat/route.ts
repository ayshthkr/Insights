import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title } = await request.json()

    // Ensure user exists in our database
    await db.ensureUserExists(userId)

    // Create new chat
    const chatId = await db.createChat(userId, title)

    return NextResponse.json({ chatId })
  } catch (error) {
    console.error('Error creating chat:', error)
    return NextResponse.json({ error: 'Failed to create chat' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's chats
    const chats = await db.getUserChats(userId)

    return NextResponse.json({ chats })
  } catch (error) {
    console.error('Error fetching chats:', error)
    return NextResponse.json({ error: 'Failed to fetch chats' }, { status: 500 })
  }
}
