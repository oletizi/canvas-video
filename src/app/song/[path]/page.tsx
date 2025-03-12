"use client"
import React from "react"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef, useState} from "react";
import {useParams} from "next/navigation";
import {fabric} from "fabric";
import {AnimationType, newAnimation, SongAnimation} from "@/video/song-animation";
import AnimationTypeSelector from "@/components/animation-type";

export default function Page() {
    const width = window.innerWidth
    const height = width * .45//window?.innerHeight ? 2 * window.innerHeight / 3 : 500
    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const [animationType, setAnimationType] = useState(AnimationType.DEFAULT)
    const framerate = 60
    const frameInterval = 1000 / framerate
    const song = newSong()
    let animation: null | SongAnimation = null
    let canvas: any = null
    useEffect(() => {
        console.log(`Setting up canvas...`)
        let interval = null
        const transport = song.getTransport()
        if (canvasRef.current) {
            canvas = new fabric.Canvas(canvasRef.current, {selection: false})

            animation = newAnimation(animationType, song, framerate)
            animation?.setup(canvas)
            interval = setInterval(() => {
                animation?.draw(canvas)
                transport.tick()
                canvas?.renderAll()
            }, frameInterval)
        } else {
            console.log(`Canvas ref is null. Not setting up canvas.`)
        }
        return () => {

            canvas?.dispose()
            if (interval) {
                clearInterval(interval)
            }
        }
    }, [animationType])

    return (<div>
        <canvas ref={canvasRef} width={width} height={height}/>
        <div className="container mx-auto pt-5">
            <div className="flex items-center content-center gap-5">
                <SongView startAudio={() => song.startAudio(`/api/audio/${path}.wav`)}
                          transport={song.getTransport()}/>
                <AnimationTypeSelector onChange={(v) => setAnimationType(v)}/>
            </div>
        </div>
    </div>)

}