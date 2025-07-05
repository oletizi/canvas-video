import React, { useEffect, useRef, useState } from 'react';
import { newSong } from '@/song/song';
import { AnimationType, newAnimation } from '@/video/song-animation';
import type { SongAnimation } from '@/video/song-animation';
import { SongView } from '@/components/song-view';
import AnimationTypeSelector from '@/components/animation-type';
import { Canvas } from 'fabric';

interface SongPlayerProps {}

export default function SongPlayer({}: SongPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationType, setAnimationType] = useState(AnimationType.DEFAULT);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
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

    const generateTestVideo = () => {
        const testAudioContext = new AudioContext();
        const duration = 3; // 3 seconds
        const sampleRate = testAudioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = testAudioContext.createBuffer(1, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0);
        
        // Generate a simple 440Hz sine wave
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
        }
        
        // Create audio blob and URL
        const audioBlob = bufferToWav(buffer);
        const audioUrl = URL.createObjectURL(audioBlob);
        
        // Start playing the generated audio
        song.startAudioFromBuffer(testAudioContext, buffer);
        
        console.log('Test video generation started with generated audio');
    };

    const bufferToWav = (buffer: AudioBuffer) => {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
        
        // WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + length * 2, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, length * 2, true);
        
        // Audio data
        const channelData = buffer.getChannelData(0);
        let offset = 44;
        for (let i = 0; i < length; i++) {
            view.setInt16(offset, channelData[i] * 0x7FFF, true);
            offset += 2;
        }
        
        return new Blob([arrayBuffer], { type: 'audio/wav' });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        
        setUploadedFile(file);
        
        try {
            const audioContext = new AudioContext();
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            
            // Start playing the uploaded audio
            song.startAudioFromBuffer(audioContext, audioBuffer);
            
            console.log('Uploaded audio file loaded and started');
        } catch (error) {
            console.error('Error loading uploaded audio file:', error);
        }
    };

    const startUploadedAudio = () => {
        if (!uploadedFile) return;
        
        handleFileUpload({ target: { files: [uploadedFile] } } as any);
    };

    return (
        <div>
            <canvas ref={canvasRef} width={width} height={height} />
            <div className="container mx-auto pt-5">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <label className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded cursor-pointer">
                            Upload Audio File
                            <input 
                                type="file" 
                                accept="audio/*" 
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </label>
                        {uploadedFile && (
                            <span className="text-sm text-gray-600">
                                {uploadedFile.name}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center content-center gap-5">
                        <SongView 
                            startAudio={startUploadedAudio}
                            transport={song.getTransport()}
                            disabled={!uploadedFile}
                        />
                        <AnimationTypeSelector onChange={(v) => setAnimationType(v)} />
                        <button 
                            onClick={generateTestVideo}
                            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                        >
                            Generate Test Video
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}