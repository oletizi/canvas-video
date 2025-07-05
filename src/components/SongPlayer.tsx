import React, { useEffect, useRef, useState } from 'react';
import { newSong } from '@/song/song';
import { AnimationType, newAnimation } from '@/video/song-animation';
import type { SongAnimation } from '@/video/song-animation';
import AnimationTypeSelector from '@/components/animation-type';
import { TransportView } from '@/ts/components/transport';
import { Canvas } from 'fabric';

interface SongPlayerProps {}

export default function SongPlayer({}: SongPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationType, setAnimationType] = useState(AnimationType.PulsingEye);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(3000); // 3 seconds default
    const framerate = 60;
    const frameInterval = 1000 / framerate;
    const song = newSong();
    let animation: SongAnimation;
    let canvas: any = null;
    let width = 1000;
    let height = width * 0.45;
    let mediaRecorder: MediaRecorder | null = null;
    let recordedChunks: Blob[] = [];
    let currentAudioUrl: string | null = null;

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

    const startVideoRecording = async () => {
        if (!canvasRef.current || isRecording) return;
        
        try {
            setIsRecording(true);
            recordedChunks = [];
            
            let audioElement: HTMLAudioElement;
            let audioBuffer: AudioBuffer;
            let audioContext: AudioContext;
            let bufferSource: AudioBufferSourceNode;
            
            audioContext = new AudioContext();
            
            if (uploadedFile) {
                // Use uploaded audio file
                try {
                    const arrayBuffer = await uploadedFile.arrayBuffer();
                    audioBuffer = await audioContext.decodeAudioData(arrayBuffer.slice(0));
                    
                    // Create audio element directly from the original file
                    currentAudioUrl = URL.createObjectURL(uploadedFile);
                    audioElement = new Audio(currentAudioUrl);
                    
                    // Ensure the audio element is ready
                    await new Promise((resolve, reject) => {
                        audioElement.addEventListener('canplaythrough', resolve, { once: true });
                        audioElement.addEventListener('error', reject, { once: true });
                        audioElement.load();
                    });
                    
                    console.log('Using uploaded audio file:', uploadedFile.name);
                } catch (error) {
                    console.error('Error decoding uploaded audio:', error);
                    throw new Error('Unable to decode uploaded audio file. Please try a different audio format (MP3, WAV, OGG).');
                }
            } else {
                // Generate default test audio (sine wave)
                const duration = recordingDuration / 1000;
                const sampleRate = audioContext.sampleRate;
                const frameCount = sampleRate * duration;
                audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
                const channelData = audioBuffer.getChannelData(0);
                
                // Generate a simple 440Hz sine wave
                for (let i = 0; i < frameCount; i++) {
                    channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
                }
                
                const audioBlob = bufferToWav(audioBuffer);
                currentAudioUrl = URL.createObjectURL(audioBlob);
                audioElement = new Audio(currentAudioUrl);
                
                console.log('Using generated sine wave test audio');
            }
            
            // Start song first to set up audio analysis
            song.startAudioFromBuffer(audioContext, audioBuffer);
            
            // Ensure canvas is rendered before capturing
            if (canvas) {
                canvas.renderAll();
            }
            
            // Get canvas stream after ensuring canvas is rendered
            const canvasStream = canvasRef.current.captureStream(framerate);
            
            // Create a new buffer source for the MediaRecorder 
            bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            
            // Create media stream destination for recording
            const dest = audioContext.createMediaStreamDestination();
            bufferSource.connect(dest);
            // Don't connect to audioContext.destination to avoid double audio playback
            
            // Start the transport and audio
            song.getTransport().start();
            
            // Wait for canvas to start rendering actively
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // Combine canvas and audio streams
            const videoTracks = canvasStream.getVideoTracks();
            const audioTracks = dest.stream.getAudioTracks();
            
            console.log('Video tracks:', videoTracks.length, 'Audio tracks:', audioTracks.length);
            
            const combinedStream = new MediaStream([
                ...videoTracks,
                ...audioTracks
            ]);
            
            // Set up MediaRecorder with fallback codec options
            let mimeType = 'video/webm;codecs=vp9,opus';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
                mimeType = 'video/webm;codecs=vp8,opus';
                if (!MediaRecorder.isTypeSupported(mimeType)) {
                    mimeType = 'video/webm';
                }
            }
            
            console.log('Using MediaRecorder with mimeType:', mimeType);
            
            mediaRecorder = new MediaRecorder(combinedStream, {
                mimeType: mimeType
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = () => {
                const blob = new Blob(recordedChunks, { type: 'video/webm' });
                downloadVideo(blob);
                setIsRecording(false);
                
                // Clean up audio URL
                if (currentAudioUrl) {
                    URL.revokeObjectURL(currentAudioUrl);
                    currentAudioUrl = null;
                }
            };
            
            // Start recording
            mediaRecorder.start();
            
            // Start the buffer source for recording (separate from the sample's transport-managed source)
            bufferSource.start();
            
            // Calculate recording duration based on audio length or user setting
            const actualDuration = uploadedFile 
                ? Math.min(audioBuffer.duration * 1000, recordingDuration)
                : recordingDuration;
            
            // Stop recording after specified duration
            setTimeout(() => {
                if (mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                    song.getTransport().stop();
                    bufferSource.stop();
                }
            }, actualDuration);
            
            console.log('Video recording started');
        } catch (error) {
            console.error('Error starting video recording:', error);
            setIsRecording(false);
        }
    };
    
    const downloadVideo = (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-video-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        console.log('Video download initiated');
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
            
            // Start playing the uploaded audio immediately
            song.startAudioFromBuffer(audioContext, audioBuffer);
            
            console.log('Uploaded audio file loaded and started');
        } catch (error) {
            console.error('Error loading uploaded audio file:', error);
        }
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
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium">
                                Recording Duration (seconds):
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="30" 
                                    value={recordingDuration / 1000}
                                    onChange={(e) => setRecordingDuration(Number(e.target.value) * 1000)}
                                    className="ml-2 px-2 py-1 border border-gray-300 rounded w-16"
                                    disabled={isRecording}
                                />
                            </label>
                        </div>
                        <div className="flex items-center content-center gap-5">
                            <TransportView model={song.getTransport()} />
                            <AnimationTypeSelector onChange={(v) => setAnimationType(v)} />
                            <button 
                                onClick={startVideoRecording}
                                disabled={isRecording}
                                className={`font-bold py-2 px-4 rounded ${
                                    isRecording 
                                        ? 'bg-red-500 text-white cursor-not-allowed' 
                                        : 'bg-blue-500 hover:bg-blue-700 text-white'
                                }`}
                            >
                                {isRecording 
                                    ? 'Recording...' 
                                    : uploadedFile 
                                        ? 'Record Video with Uploaded Audio'
                                        : 'Record Video with Test Audio'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}