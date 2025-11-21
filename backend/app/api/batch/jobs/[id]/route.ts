import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const job = await sql`
      SELECT *
      FROM batch_jobs
      WHERE id = ${params.id} AND user_id = ${session.user.id}
    `;

        if (job.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        return NextResponse.json({ job: job[0] });
    } catch (error) {
        console.error('Fetch job details error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
