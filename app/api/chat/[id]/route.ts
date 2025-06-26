import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { db } from '@/lib/database'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Get chat messages
    const messages = await db.getChatMessages(chatId)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching chat messages:', error)
    return NextResponse.json({ error: 'Failed to fetch chat messages' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params
    const { title } = await request.json()

    // Update chat title
    await db.updateChatTitle(chatId, title)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating chat title:', error)
    return NextResponse.json({ error: 'Failed to update chat title' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: chatId } = await params

    // Delete chat
    await db.deleteChat(chatId, userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting chat:', error)
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 })
  }
}
