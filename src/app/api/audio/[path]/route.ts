"use server"
import {NextRequest, NextResponse} from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest, {params}: { params: Promise<{ path: string }>}) {
    const p = (await params).path
    const absolute = path.join(process.cwd(), 'assets', 'audio', p)
    try {
        const stats = fs.statSync(absolute)
        const fileStream = fs.createReadStream(absolute)
        // @ts-ignore
        return new NextResponse(fileStream, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': stats.size.toString()
            }
        })
    } catch (e) {
        return new NextResponse('File not found', {status: 404})
    }
}