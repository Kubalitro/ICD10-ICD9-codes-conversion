import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Get user ID from email
        const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = users[0].id

        // Fetch history
        const history = await sql`
      SELECT id, code, system, searched_at
      FROM user_search_history
      WHERE user_id = ${userId}
      ORDER BY searched_at DESC
      LIMIT 50
    `

        return NextResponse.json({ history })
    } catch (error) {
        console.error('Error fetching history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { code, system } = await request.json()

        if (!code || !system) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Get user ID
        const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = users[0].id

        // Add to history
        await sql`
      INSERT INTO user_search_history (user_id, code, system)
      VALUES (${userId}, ${code}, ${system})
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error adding to history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = users[0].id

        await sql`
      DELETE FROM user_search_history
      WHERE user_id = ${userId}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error clearing history:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
