
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Define upload path
        const uploadDir = join(process.cwd(), 'public', 'uploads');

        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        // Generate unique filename
        const filename = `${crypto.randomUUID()}-${file.name.replace(/\s+/g, '_')}`;
        const path = join(uploadDir, filename);

        // Write file
        await writeFile(path, buffer);

        const url = `/uploads/${filename}`;

        return NextResponse.json({
            success: true,
            url,
            name: file.name,
            size: file.size,
            type: file.type
        });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
