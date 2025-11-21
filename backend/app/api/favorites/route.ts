import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { sql } from '@/lib/db'

export async function GET(request: Request) {
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

        // Fetch favorites (assuming 'Favorites' list is created automatically or we use a default list)
        // For simplicity, we'll query saved_list_items directly joined with saved_lists

        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const system = searchParams.get('system')

        let favorites;
        if (code && system) {
            favorites = await sql`
                SELECT i.id, i.code, i.system, i.notes, i.added_at
                FROM saved_list_items i
                JOIN saved_lists l ON i.list_id = l.id
                WHERE l.user_id = ${userId} AND l.name = 'Favorites'
                AND i.code = ${code} AND i.system = ${system}
                ORDER BY i.added_at DESC
            `
        } else {
            favorites = await sql`
                SELECT i.id, i.code, i.system, i.notes, i.added_at
                FROM saved_list_items i
                JOIN saved_lists l ON i.list_id = l.id
                WHERE l.user_id = ${userId} AND l.name = 'Favorites'
                ORDER BY i.added_at DESC
            `
        }

        return NextResponse.json({ favorites })
    } catch (error) {
        console.error('Error fetching favorites:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function POST(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { code, system, notes } = await request.json()

        if (!code || !system) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = users[0].id

        // Ensure 'Favorites' list exists
        let lists = await sql`SELECT id FROM saved_lists WHERE user_id = ${userId} AND name = 'Favorites'`
        let listId

        if (lists.length === 0) {
            const newList = await sql`
        INSERT INTO saved_lists (user_id, name, description)
        VALUES (${userId}, 'Favorites', 'My favorite codes')
        RETURNING id
      `
            listId = newList[0].id
        } else {
            listId = lists[0].id
        }

        // Check if already exists
        const existing = await sql`
      SELECT id FROM saved_list_items 
      WHERE list_id = ${listId} AND code = ${code} AND system = ${system}
    `

        if (existing.length > 0) {
            // Update notes if provided
            if (notes !== undefined) {
                await sql`
          UPDATE saved_list_items 
          SET notes = ${notes}
          WHERE id = ${existing[0].id}
        `
            }
            return NextResponse.json({ success: true, message: 'Updated' })
        }

        // Add to favorites
        await sql`
      INSERT INTO saved_list_items (list_id, code, system, notes)
      VALUES (${listId}, ${code}, ${system}, ${notes || null})
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error adding favorite:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}

export async function DELETE(request: Request) {
    const session = await getServerSession()

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const code = searchParams.get('code')
        const system = searchParams.get('system')

        if (!code || !system) {
            return NextResponse.json({ error: 'Missing code or system' }, { status: 400 })
        }

        const users = await sql`SELECT id FROM users WHERE email = ${session.user.email}`
        if (users.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }
        const userId = users[0].id

        // Get Favorites list ID
        const lists = await sql`SELECT id FROM saved_lists WHERE user_id = ${userId} AND name = 'Favorites'`
        if (lists.length === 0) {
            return NextResponse.json({ error: 'Favorites list not found' }, { status: 404 })
        }
        const listId = lists[0].id

        await sql`
      DELETE FROM saved_list_items
      WHERE list_id = ${listId} AND code = ${code} AND system = ${system}
    `

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error removing favorite:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
