"use server"
// noinspection JSUnusedGlobalSymbols

import {NextRequest, NextResponse} from "next/server";
import path from "path";
import fs from "fs";

export async function GET(request: NextRequest, {params}: { params: Promise<{ path: string }>}) {
    const p = (await params).path
    // noinspection TypeScriptUnresolvedReference
    const absolute = path.join(process.cwd(), 'assets', 'audio', p)
    try {
        const stats = fs.statSync(absolute)
        const fileStream = fs.createReadStream(absolute)
        // noinspection TypeScriptValidateTypes
        return new NextResponse(fileStream, {
            headers: {
                'Content-Type': 'audio/wav',
                'Content-Length': stats.size.toString()
            }
        })
    } catch (e) {
        // noinspection TypeScriptValidateTypes
        return new NextResponse('File not found', {status: 404})
    }
}