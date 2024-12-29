"use client"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useRef, useState} from "react";
import {useParams} from "next/navigation";

export default function Page() {
    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const song = newSong()
    const width = window.innerWidth

    let content = (<div>Loading...</div>)
    if (path) {
        content = (
            <div>
                <canvas ref={canvasRef} width={width} height={600} style={{border: "1px solid black"}}/>
                <SongView startAudio={() => song.startAudio(`/api/audio/${path}.wav`)}
                          transport={song.getTransport()}/>
            </div>)
    }
    return content
}