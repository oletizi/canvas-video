"use client"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef, useState} from "react";
import {useParams} from "next/navigation";
import {fabric} from "fabric";
import {newDefaultAnimation, SongAnimation} from "@/video/song-animation";


export default function Page() {

    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const width = window.innerWidth
    const framerate = 24
    const frameInterval = 1000 / framerate
    const song = newSong()
    let animation: null | SongAnimation = null
    useEffect(() => {
        let canvas = null
        let interval = null
        const transport = song.getTransport()
        if (canvasRef.current) {
            canvas = new fabric.Canvas(canvasRef.current, {selection: false})

            animation = newDefaultAnimation(transport)
            animation?.setup(canvas)
            console.log(`Starting animation loop...`)
            interval = setInterval(() => {
                animation?.draw(canvas)
                transport.tick()
                canvas.renderAll()
            }, frameInterval)
        }
        return () => {
            canvas?.dispose().then(canvasRef.current = null)
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [])

    return (<div>
        <canvas ref={canvasRef} width={width} height={600} style={{border: "1px solid black"}}/>
        <SongView startAudio={() => song.startAudio(`/api/audio/${path}.wav`)}
                  transport={song.getTransport()}/>
    </div>)

}