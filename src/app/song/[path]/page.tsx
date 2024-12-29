"use client"
import {newSong} from "@/song/song";
import {SongView} from "@/components/song-view";
import {useEffect, useRef, useState} from "react";
import {useParams} from "next/navigation";
import {fabric} from "fabric";

export default function Page() {
    const canvasRef = useRef<any>(null);
    const {path} = useParams()
    const [fabricComponents, setFabricComponents] = useState<{ canvas: null | fabric.Canvas }>({canvas: null})
    const width = window.innerWidth
    useEffect(() => {
        let canvas = null
        if (canvasRef.current) {
            canvas = new fabric.Canvas(canvasRef.current)
            const circle = new fabric.Circle({radius: 100, left: width/ 4, top: + 150})
            canvas.add(circle)
            setFabricComponents({canvas: canvas})
        }
        return () => {
            canvas?.dispose().then(canvasRef.current = null)
        }
    }, [])
    const song = newSong()

    return (<div>
        <canvas ref={canvasRef} width={width} height={600} style={{border: "1px solid black"}}/>
        <SongView startAudio={() => song.startAudio(`/api/audio/${path}.wav`)}
                  transport={song.getTransport()}/>
    </div>)

}