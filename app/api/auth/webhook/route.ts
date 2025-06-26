import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { Webhook } from 'svix'
import { db } from '@/lib/database'

export async function POST(request: NextRequest) {
  const CLERK_WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!CLERK_WEBHOOK_SECRET) {
    console.warn('CLERK_WEBHOOK_SECRET not configured')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  // Get the headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 })
  }

  // Get the body
  const payload = await request.text()

  // Create a new Svix instance with your secret.
  const wh = new Webhook(CLERK_WEBHOOK_SECRET)

  let evt: {
    type: string
    data: {
      id: string
      [key: string]: unknown
    }
  }

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as typeof evt
  } catch (err) {
    console.error('Error verifying webhook:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Process the webhook
  const eventType = evt.type

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break
      case 'user.updated':
        await handleUserUpdated(evt.data)
        break
      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break
      case 'session.created':
        await handleSessionCreated(evt.data)
        break
      case 'session.ended':
        await handleSessionEnded(evt.data)
        break
      default:
        console.log(`Unhandled webhook type: ${eventType}`)
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Error processing webhook' }, { status: 500 })
  }
}

async function handleUserCreated(data: Record<string, unknown>) {
  const userId = data.id as string
  const emailAddresses = data.email_addresses as Array<{ email_address: string }> | undefined
  const email = emailAddresses?.[0]?.email_address
  const firstName = data.first_name as string | undefined
  const lastName = data.last_name as string | undefined
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName
  const avatarUrl = data.image_url as string | undefined

  try {
    // Ensure user exists in our database
    await db.ensureUserExists(userId, email, fullName)

    // Update with additional details
    await db.updateUser(userId, {
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
    })

    await db.logActivity(userId, 'INFO', 'User account created', {
      email,
      fullName,
      hasAvatar: !!avatarUrl
    })
  } catch (error) {
    console.error('Error handling user created webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await db.logActivity(userId, 'ERROR', 'Failed to process user creation', { error: errorMessage })
  }
}

async function handleUserUpdated(data: Record<string, unknown>) {
  const userId = data.id as string
  const emailAddresses = data.email_addresses as Array<{ email_address: string }> | undefined
  const email = emailAddresses?.[0]?.email_address
  const firstName = data.first_name as string | undefined
  const lastName = data.last_name as string | undefined
  const fullName = firstName && lastName ? `${firstName} ${lastName}` : firstName || lastName
  const avatarUrl = data.image_url as string | undefined

  try {
    await db.updateUser(userId, {
      email,
      full_name: fullName,
      avatar_url: avatarUrl,
    })

    await db.logActivity(userId, 'INFO', 'User profile updated', {
      email,
      fullName,
      hasAvatar: !!avatarUrl
    })
  } catch (error) {
    console.error('Error handling user updated webhook:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    await db.logActivity(userId, 'ERROR', 'Failed to process user update', { error: errorMessage })
  }
}

async function handleUserDeleted(data: Record<string, unknown>) {
  const userId = data.id as string

  try {
    await db.deleteUser(userId)
    console.log(`User ${userId} deleted from database`)
  } catch (error) {
    console.error('Error handling user deleted webhook:', error)
  }
}

async function handleSessionCreated(data: Record<string, unknown>) {
  const userId = data.user_id as string

  try {
    await db.logActivity(userId, 'INFO', 'User session started', {
      sessionId: data.id as string,
      clientType: data.client_type as string | undefined
    })
  } catch (error) {
    console.error('Error handling session created webhook:', error)
  }
}

async function handleSessionEnded(data: Record<string, unknown>) {
  const userId = data.user_id as string

  try {
    await db.logActivity(userId, 'INFO', 'User session ended', {
      sessionId: data.id as string,
      duration: data.last_active_at ? Date.now() - new Date(data.last_active_at as string).getTime() : null
    })
  } catch (error) {
    console.error('Error handling session ended webhook:', error)
  }
}
