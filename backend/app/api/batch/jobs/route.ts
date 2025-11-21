import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const jobs = await sql`
      SELECT id, status, original_filename, created_at, completed_at
      FROM batch_jobs
      WHERE user_id = ${session.user.id}
      ORDER BY created_at DESC
    `;

        return NextResponse.json({ jobs });
    } catch (error) {
        console.error('Fetch jobs error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
