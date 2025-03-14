"use client"
import React from "react"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef, useState} from "react";
import {useParams} from "next/navigation";
import {AnimationType, newAnimation, SongAnimation} from "@/video/song-animation";
import AnimationTypeSelector from "@/components/animation-type";
import {Canvas} from "fabric";

export default function Page() {
    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const [animationType, setAnimationType] = useState(AnimationType.DEFAULT)
    const framerate = 60
    const frameInterval = 1000 / framerate
    const song = newSong()
    let animation: SongAnimation
    let canvas: any = null
    let width = 1000
    let height = width * .45

    useEffect(() => {
        width = window.innerWidth
        height = width * .45//window?.innerHeight ? 2 * window.innerHeight / 3 : 500
        console.log(`Setting up canvas...`)
        let interval = null
        const transport = song.getTransport()
        if (canvasRef.current) {
            canvas = new Canvas(canvasRef.current, {selection: false})

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
                <SongView startAudio={() => {
                    song.startAudio(new AudioContext(), `/api/audio/${path}.wav`)
                }}
                          transport={song.getTransport()}/>
                <AnimationTypeSelector onChange={(v) => setAnimationType(v)}/>
            </div>
        </div>
    </div>)

}