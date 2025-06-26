import { createServerSupabaseClient } from './supabase-server'
import { auth } from '@clerk/nextjs/server'
import { Database } from '@/types/database.types'

// Simple UUID generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

type Tables = Database['public']['Tables']
type ChatInsert = Tables['chats']['Insert']
type MessageInsert = Tables['messages']['Insert']
type LogInsert = Tables['logs']['Insert']
type UserInsert = Tables['users']['Insert']

export class DatabaseService {
  private getSupabaseClient() {
    return createServerSupabaseClient()
  }

  async getCurrentUser() {
    const { userId } = await auth()
    return userId
  }

  async ensureUserExists(userId: string, userEmail?: string, userName?: string) {
    try {
      const supabase = this.getSupabaseClient()
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', userId)
        .single()

      if (!existingUser) {
        const newUser: UserInsert = {
          user_id: userId,
          email: userEmail || null,
          full_name: userName || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        const { error } = await supabase
          .from('users')
          .insert(newUser)

        if (error) {
          console.error('Error creating user:', error)
        }
      }
    } catch (error) {
      console.error('Error ensuring user exists:', error)
    }
  }

  async createChat(userId: string, title?: string) {
    const chatId = generateUUID()
    const supabase = this.getSupabaseClient()

    const newChat: ChatInsert = {
      chat_id: chatId,
      user_id: userId,
      title: title || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('chats')
      .insert(newChat)
      .select()
      .single()

    if (error) {
      console.error('Error creating chat:', error)
      throw new Error('Failed to create chat')
    }

    await this.logActivity(userId, 'INFO', 'Chat created', { chatId })
    return chatId
  }

  async saveMessage(
    chatId: string,
    role: 'user' | 'assistant',
    content: string,
    webSearchRequired?: boolean,
    searchTerms?: string[],
    sources?: Array<{ title: string; url: string; snippet: string }>
  ) {
    const messageId = generateUUID()
    const supabase = this.getSupabaseClient()

    const newMessage: MessageInsert = {
      message_id: messageId,
      chat_id: chatId,
      role,
      content,
      web_search_required: webSearchRequired || null,
      generated_search_terms: searchTerms ? JSON.stringify(searchTerms) : null,
      sources: sources ? JSON.stringify(sources) : null,
      created_at: new Date().toISOString()
    }

    const { error } = await supabase
      .from('messages')
      .insert(newMessage)

    if (error) {
      console.error('Error saving message:', error)
      throw new Error('Failed to save message')
    }

    return messageId
  }

  async getChatMessages(chatId: string) {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('chat_id', chatId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching chat messages:', error)
      return []
    }

    return data
  }

  async getUserChats(userId: string, limit = 50) {
    const supabase = this.getSupabaseClient()
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching user chats:', error)
      return []
    }

    return data
  }

  async updateChatTitle(chatId: string, title: string) {
    const supabase = this.getSupabaseClient()
    const { error } = await supabase
      .from('chats')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('chat_id', chatId)

    if (error) {
      console.error('Error updating chat title:', error)
      throw new Error('Failed to update chat title')
    }
  }

  async deleteChat(chatId: string, userId: string) {
    const supabase = this.getSupabaseClient()
    // First delete all messages in the chat
    await supabase
      .from('messages')
      .delete()
      .eq('chat_id', chatId)

    // Then delete the chat
    const { error } = await supabase
      .from('chats')
      .delete()
      .eq('chat_id', chatId)
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting chat:', error)
      throw new Error('Failed to delete chat')
    }

    await this.logActivity(userId, 'INFO', 'Chat deleted', { chatId })
  }

  async logActivity(
    userId: string,
    level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL',
    message: string,
    details?: Record<string, unknown>
  ) {
    try {
      const supabase = this.getSupabaseClient()
      const newLog: LogInsert = {
        user_id: userId,
        level,
        message,
        details: details ? JSON.stringify(details) : null,
        created_at: new Date().toISOString()
      }

      await supabase
        .from('logs')
        .insert(newLog)

      // Also log to console for development
      console.log(`[${level}] ${message}`, details)
    } catch (error) {
      console.error('Error logging activity:', error)
      // Don't throw here to avoid breaking the main flow
    }
  }

  async generateChatTitle(firstMessage: string): Promise<string> {
    // Extract first few words or generate a simple title
    const words = firstMessage.trim().split(' ').slice(0, 5)
    if (words.length > 0) {
      let title = words.join(' ')
      if (firstMessage.length > title.length) {
        title += '...'
      }
      return title
    }
    return 'New Chat'
  }

  async updateUser(userId: string, updates: Partial<UserInsert>) {
    const supabase = this.getSupabaseClient()
    const { error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)

    if (error) {
      console.error('Error updating user:', error)
      throw new Error('Failed to update user')
    }
  }

  async deleteUser(userId: string) {
    const supabase = this.getSupabaseClient()
    // Delete user's chats and messages (cascade should handle this with RLS)
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      throw new Error('Failed to delete user')
    }
  }
}

export const db = new DatabaseService()
