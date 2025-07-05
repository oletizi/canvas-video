import React, { useEffect, useRef, useState } from 'react';
import { newSong } from '@/song/song';
import { AnimationType, newAnimation, SongAnimation } from '@/video/song-animation';
import { SongView } from '@/components/song-view';
import AnimationTypeSelector from '@/components/animation-type';
import { Canvas } from 'fabric';

interface SongPlayerProps {
    songPath: string;
}

export default function SongPlayer({ songPath }: SongPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationType, setAnimationType] = useState(AnimationType.DEFAULT);
    const framerate = 60;
    const frameInterval = 1000 / framerate;
    const song = newSong();
    let animation: SongAnimation;
    let canvas: any = null;
    let width = 1000;
    let height = width * 0.45;

    useEffect(() => {
        width = window.innerWidth;
        height = width * 0.45;
        console.log(`Setting up canvas...`);
        let interval: NodeJS.Timeout | null = null;
        const transport = song.getTransport();
        
        if (canvasRef.current) {
            canvas = new Canvas(canvasRef.current, { selection: false });
            
            animation = newAnimation(animationType, song, framerate);
            animation?.setup(canvas);
            
            interval = setInterval(() => {
                animation?.draw(canvas);
                transport.tick();
                canvas?.renderAll();
            }, frameInterval);
        } else {
            console.log(`Canvas ref is null. Not setting up canvas.`);
        }
        
        return () => {
            canvas?.dispose();
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [animationType]);

    return (
        <div>
            <canvas ref={canvasRef} width={width} height={height} />
            <div className="container mx-auto pt-5">
                <div className="flex items-center content-center gap-5">
                    <SongView 
                        startAudio={() => {
                            song.startAudio(new AudioContext(), `/api/audio/${songPath}.wav`);
                        }}
                        transport={song.getTransport()}
                    />
                    <AnimationTypeSelector onChange={(v) => setAnimationType(v)} />
                </div>
            </div>
        </div>
    );
}