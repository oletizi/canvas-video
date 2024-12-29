"use client"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef, useState} from "react";
import {useParams} from "next/navigation";
import {fabric} from "fabric";
import {AnimationType, newDefaultAnimation, SongAnimation} from "@/video/song-animation";
import AnimationTypeSelector from "@/components/animation-type";

export default function Page() {
    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const [animationType, setAnimationType] = useState(AnimationType.DEFAULT)
    const width = window.innerWidth
    const height = 2 * window.innerHeight / 3
    const framerate = 60
    const frameInterval = 1000 / framerate
    const song = newSong()
    let animation: null | SongAnimation = null
    useEffect(() => {
        let canvas = null
        let interval = null
        const transport = song.getTransport()
        if (canvasRef.current) {
            canvas = new fabric.Canvas(canvasRef.current, {selection: false})

            animation = newDefaultAnimation(song, framerate)
            animation?.setup(canvas)
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
    }, [animationType])

    return (<div>
        <canvas ref={canvasRef} width={width} height={height} style={{border: "1px solid black"}}/>
        <div className="container mx-auto pt-5">
            <div className="flex items-center content-center gap-5">
                <SongView startAudio={() => song.startAudio(`/api/audio/${path}.wav`)}
                          transport={song.getTransport()}/>
                <AnimationTypeSelector onChange={(v) => setAnimationType(v)}/>
            </div>
        </div>
    </div>)

}