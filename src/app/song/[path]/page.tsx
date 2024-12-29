"use client"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef} from "react";

export default async function Page({params}: { params: Promise<{ path: string }> }) {
    const canvasRef = useRef<any>(null);
    const song = newSong()
    const p = (await params).path
    return (<>
        <canvas ref={canvasRef} width={800} height={600} style={{border: "1px solid black"}}/>
        <SongView startAudio={() => song.startAudio(`/api/audio/${p}.wav`)} transport={song.getTransport()}/>
    </>)
}