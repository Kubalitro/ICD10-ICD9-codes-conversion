import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';
import { sql } from '@/lib/db';

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const job = await sql`
      SELECT results, original_filename
      FROM batch_jobs
      WHERE id = ${params.id} AND user_id = ${session.user.id}
    `;

        if (job.length === 0) {
            return NextResponse.json({ error: 'Job not found' }, { status: 404 });
        }

        const results = job[0].results;

        if (!Array.isArray(results)) {
            return NextResponse.json({ error: 'No results available' }, { status: 400 });
        }

        // Generate CSV
        const header = 'Original Code,Converted Code,System\n';
        const rows = results.map((r: any) => {
            const original = r.original ? `"${r.original}"` : '';
            const converted = r.converted ? `"${r.converted}"` : '';
            const system = r.system ? `"${r.system}"` : '';
            return `${original},${converted},${system}`;
        }).join('\n');

        const csv = header + rows;
        const filename = `batch_results_${job[0].original_filename}.csv`;

        return new NextResponse(csv, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Download error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
