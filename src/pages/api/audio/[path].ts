import type { APIRoute } from 'astro';
import path from 'path';
import fs from 'fs';

export const GET: APIRoute = async ({ params }) => {
    const audioPath = params.path;
    
    if (!audioPath) {
        return new Response('Path parameter is required', { status: 400 });
    }
    
    const absolutePath = path.join(process.cwd(), 'assets', 'audio', audioPath);
    
    try {
        const stats = fs.statSync(absolutePath);
        const fileStream = fs.createReadStream(absolutePath);
        
        return new Response(fileStream as any, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': stats.size.toString()
            }
        });
    } catch (e) {
        return new Response('File not found', { status: 404 });
    }
};