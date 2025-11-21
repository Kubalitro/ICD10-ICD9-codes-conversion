import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { sql } from '../../../../lib/db';
import * as XLSX from 'xlsx';

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        // Basic validation: check if we have data
        if (jsonData.length < 2) { // Header + at least one row
            return NextResponse.json({ error: 'File is empty or invalid' }, { status: 400 });
        }

        // Extract codes (assuming first column for now, or look for 'code' header)
        // For simplicity, let's assume the first column contains the codes.
        // We'll filter out empty rows.
        const codes = jsonData.slice(1).map((row: any) => row[0]).filter((c: any) => c);

        if (codes.length === 0) {
            return NextResponse.json({ error: 'No codes found in file' }, { status: 400 });
        }

        // Create job in DB
        const result = await sql`
      INSERT INTO batch_jobs (user_id, status, original_filename, results)
      VALUES (${session.user.id}, 'pending', ${file.name}, ${JSON.stringify({ total: codes.length, processed: 0, codes: codes })})
      RETURNING id
    `;

        const jobId = result[0].id;

        // Trigger processing (in a real app, this would be a queue)
        // For now, we'll just return the job ID and let the client poll or trigger processing separately?
        // Or we can start processing asynchronously here (fire and forget).

        // Let's fire and forget the processing logic
        processBatch(jobId, codes);

        return NextResponse.json({ success: true, jobId });

    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

async function processBatch(jobId: string, codes: any[]) {
    try {
        await sql`UPDATE batch_jobs SET status = 'processing' WHERE id = ${jobId}`;

        const results = [];

        // Process codes (mocking conversion for now, or calling the conversion logic)
        // We need to call the actual conversion logic. 
        // Since we are in the backend, we can't easily call the external API if it's client-side only.
        // But we have the DB. We can query the DB directly for conversions.

        for (const code of codes) {
            // Simple mock conversion for demonstration until we hook up the real logic
            // In a real scenario, we'd query the 'icd10' or 'icd9' tables.
            results.push({
                original: code,
                converted: `Converted ${code}`, // Placeholder
                system: 'Unknown' // Placeholder
            });
        }

        await sql`
            UPDATE batch_jobs 
            SET status = 'completed', 
                completed_at = NOW(), 
                results = ${JSON.stringify(results)} 
            WHERE id = ${jobId}
        `;

    } catch (error) {
        console.error(`Error processing job ${jobId}:`, error);
        await sql`UPDATE batch_jobs SET status = 'failed' WHERE id = ${jobId}`;
    }
}
