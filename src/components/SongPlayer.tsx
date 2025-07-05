import React, { useEffect, useRef, useState } from 'react';
import { newSong } from '@/song/song';
import { AnimationType, newAnimation, PulsingEyeTheme, WandererTheme } from '@/video/song-animation';
import type { SongAnimation } from '@/video/song-animation';
import AnimationTypeSelector from '@/components/animation-type';
import ThemeSelector from '@/components/theme-selector';
import AspectRatioSelector, { AspectRatio } from '@/components/aspect-ratio-selector';
import { TransportView } from '@/ts/components/transport';
import { Canvas } from 'fabric';

interface SongPlayerProps {}

// Helper function to format time in MM:SS format
const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

// Helper function to get themes for current animation type
const getThemesForAnimation = (animationType: AnimationType): (PulsingEyeTheme | WandererTheme)[] => {
    switch (animationType) {
        case AnimationType.PulsingEye:
            return Object.values(PulsingEyeTheme);
        case AnimationType.Wanderer:
            return Object.values(WandererTheme);
        default:
            return [];
    }
};

export default function SongPlayer({}: SongPlayerProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [animationType, setAnimationType] = useState(AnimationType.PulsingEye);
    const [currentTheme, setCurrentTheme] = useState<PulsingEyeTheme | WandererTheme>(PulsingEyeTheme.BlackHole);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.Widescreen);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(3000); // Will be updated to audio duration when audio is loaded
    const [currentVuLevel, setCurrentVuLevel] = useState(0);
    const [transportPosition, setTransportPosition] = useState(0); // Current position in milliseconds
    const [audioDuration, setAudioDuration] = useState(0); // Total audio duration in milliseconds
    const framerate = 60;
    const frameInterval = 1000 / framerate;

    // Persistent objects as refs
    const songRef = useRef(newSong());
    const animationRef = useRef<SongAnimation | null>(null);
    const fabricCanvasRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const currentAudioUrlRef = useRef<string | null>(null);

    // Canvas dimensions
    const [dimensions, setDimensions] = useState({ width: 1000, height: 450 });

    useEffect(() => {
        // Update canvas size on mount and window resize
        const updateDimensions = () => {
            const width = window.innerWidth;
            let height: number;
            
            // Calculate height based on aspect ratio
            switch (aspectRatio) {
                case AspectRatio.Widescreen: // 16:9
                    height = width * (9 / 16);
                    break;
                case AspectRatio.Standard: // 4:3
                    height = width * (3 / 4);
                    break;
                case AspectRatio.Square: // 1:1
                    height = width;
                    break;
                default:
                    height = width * (9 / 16); // Default to 16:9
            }
            
            setDimensions({ width, height });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio]);

    useEffect(() => {
        // Setup canvas and animation
        if (canvasRef.current) {
            fabricCanvasRef.current = new Canvas(canvasRef.current, { selection: false });
            fabricCanvasRef.current.backgroundColor = '#444444'; // Slightly lighter for debugging
            fabricCanvasRef.current.renderAll();
            
            animationRef.current = newAnimation(animationType, songRef.current, framerate, currentTheme);
            console.log('Animation created:', animationType, 'animation object:', animationRef.current);
            animationRef.current?.setup(fabricCanvasRef.current);
            console.log('Animation setup complete. Canvas objects:', fabricCanvasRef.current.getObjects().length);
            
            // Animation loop
            const transport = songRef.current.getTransport();
            const interval = setInterval(() => {
                if (animationRef.current && fabricCanvasRef.current) {
                    animationRef.current.draw(fabricCanvasRef.current);
                    transport.tick();
                    fabricCanvasRef.current.renderAll();
                    
                    // Update VU meter level display for debugging
                    const analyzer = songRef.current.getSampleAnalyzer();
                    if (analyzer) {
                        const level = analyzer.getLevel();
                        setCurrentVuLevel(level);
                        
                        // Update transport position for progress indicator
                        // Convert transport ticks to milliseconds (60fps = 16.67ms per tick)
                        const transportTicks = transport.getPosition();
                        const transportMs = transportTicks * (1000 / 60); // Convert ticks to milliseconds
                        setTransportPosition(transportMs);
                        
                        // Debug: Log if transport position exceeds audio duration
                        if (audioDuration > 0 && transportMs > audioDuration) {
                            console.log('Transport position exceeds audio duration:', {
                                transportMs: transportMs.toFixed(0),
                                audioDuration: audioDuration.toFixed(0),
                                transportTicks: transportTicks,
                                percentage: ((transportMs / audioDuration) * 100).toFixed(1) + '%'
                            });
                        }
                        
                        // Debug logging - log every 60 frames (about once per second)
                        if (Math.random() < 0.016) { // ~1/60 chance
                            console.log('Animation frame:', {
                                vuLevel: level.toFixed(3),
                                transportRunning: transport.isRunning(),
                                transportPosition: transport.getPosition(),
                                canvasObjects: fabricCanvasRef.current.getObjects().length,
                                animationType: animationType
                            });
                        }
                    }
                }
            }, frameInterval);
            return () => {
                fabricCanvasRef.current?.dispose();
                clearInterval(interval);
            };
        }
    }, [animationType, currentTheme]);

    // Separate effect to handle canvas resizing when dimensions change
    useEffect(() => {
        if (fabricCanvasRef.current && canvasRef.current) {
            // Update the fabric canvas dimensions
            fabricCanvasRef.current.setDimensions({
                width: dimensions.width,
                height: dimensions.height
            });
            
            // Re-setup the animation with the new canvas dimensions
            if (animationRef.current) {
                // Clear existing objects
                fabricCanvasRef.current.clear();
                // Re-setup the animation
                animationRef.current.setup(fabricCanvasRef.current);
                console.log('Canvas resized to:', dimensions.width, 'x', dimensions.height);
            }
        }
    }, [dimensions.width, dimensions.height]);

    const startVideoRecording = async () => {
        if (!canvasRef.current || isRecording) return;
        try {
            // Stop any currently playing audio before starting recording
            const transport = songRef.current.getTransport();
            if (transport.isRunning()) {
                console.log('Stopping currently playing audio before recording');
                transport.stop();
                // Give a small delay to ensure audio stops cleanly
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            setIsRecording(true);
            recordedChunksRef.current = [];
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
                    currentAudioUrlRef.current = URL.createObjectURL(uploadedFile);
                    audioElement = new Audio(currentAudioUrlRef.current);
                    await new Promise((resolve, reject) => {
                        audioElement.addEventListener('canplaythrough', resolve, { once: true });
                        audioElement.addEventListener('error', reject, { once: true });
                        audioElement.load();
                    });
                } catch (error) {
                    throw new Error('Unable to decode uploaded audio file. Please try a different audio format (MP3, WAV, OGG).');
                }
            } else {
                // Load the default test audio file and extract a 3-second clip
                try {
                    const response = await fetch('/audio/test.mp3');
                    if (!response.ok) {
                        throw new Error(`Failed to load audio file: ${response.statusText}`);
                    }
                    const arrayBuffer = await response.arrayBuffer();
                    const fullAudioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    // Extract a 3-second clip from the start
                    const clipDuration = 3;
                    const sampleRate = fullAudioBuffer.sampleRate;
                    const totalDuration = fullAudioBuffer.duration;
                    const startTime = 0;
                    const startSample = Math.floor(startTime * sampleRate);
                    const clipSamples = Math.min(Math.floor(clipDuration * sampleRate), fullAudioBuffer.length - startSample);
                    audioBuffer = audioContext.createBuffer(
                        fullAudioBuffer.numberOfChannels,
                        clipSamples,
                        sampleRate
                    );
                    for (let channel = 0; channel < fullAudioBuffer.numberOfChannels; channel++) {
                        const sourceData = fullAudioBuffer.getChannelData(channel);
                        const targetData = audioBuffer.getChannelData(channel);
                        for (let i = 0; i < clipSamples; i++) {
                            const sourceIndex = startSample + i;
                            if (sourceIndex < sourceData.length) {
                                targetData[i] = sourceData[sourceIndex];
                            } else {
                                targetData[i] = 0;
                            }
                        }
                    }
                    const audioBlob = bufferToWav(audioBuffer);
                    currentAudioUrlRef.current = URL.createObjectURL(audioBlob);
                    audioElement = new Audio(currentAudioUrlRef.current);
                } catch (error) {
                    // Fallback to sine wave if the file can't be loaded
                    const duration = recordingDuration / 1000;
                    const sampleRate = audioContext.sampleRate;
                    const frameCount = sampleRate * duration;
                    audioBuffer = audioContext.createBuffer(1, frameCount, sampleRate);
                    const channelData = audioBuffer.getChannelData(0);
                    for (let i = 0; i < frameCount; i++) {
                        channelData[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate) * 0.5;
                    }
                    const audioBlob = bufferToWav(audioBuffer);
                    currentAudioUrlRef.current = URL.createObjectURL(audioBlob);
                    audioElement = new Audio(currentAudioUrlRef.current);
                }
            }
            // Start song first to set up audio analysis
            songRef.current.startAudioFromBuffer(audioContext, audioBuffer);
            // Reset transport position to beginning for recording
            songRef.current.getTransport().reset();
            setTransportPosition(0); // This is now in milliseconds
            // Ensure canvas is rendered and animation is running before capturing
            if (fabricCanvasRef.current && animationRef.current) {
                // Don't change background color - keep the existing one
                animationRef.current.draw(fabricCanvasRef.current);
                fabricCanvasRef.current.renderAll();
                await new Promise(resolve => setTimeout(resolve, 200));
                animationRef.current.draw(fabricCanvasRef.current);
                fabricCanvasRef.current.renderAll();
            }
            // Get canvas stream after ensuring canvas is actively rendered
            const canvasStream = canvasRef.current.captureStream(framerate);
            // Create a new buffer source for the MediaRecorder 
            bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            // Create media stream destination for recording
            const dest = audioContext.createMediaStreamDestination();
            bufferSource.connect(dest);
            // Don't connect to audioContext.destination to avoid double audio playback
            // Start the transport and audio
            songRef.current.getTransport().start();
            await new Promise(resolve => setTimeout(resolve, 500));
            // Combine canvas and audio streams
            const videoTracks = canvasStream.getVideoTracks();
            const audioTracks = dest.stream.getAudioTracks();
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
            mediaRecorderRef.current = new MediaRecorder(combinedStream, {
                mimeType: mimeType
            });
            mediaRecorderRef.current.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    recordedChunksRef.current.push(event.data);
                }
            };
            mediaRecorderRef.current.onstop = () => {
                console.log('Recording stopped - animation should continue');
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                downloadVideo(blob);
                setIsRecording(false);
                if (currentAudioUrlRef.current) {
                    URL.revokeObjectURL(currentAudioUrlRef.current);
                    currentAudioUrlRef.current = null;
                }
            };
            // Start recording
            mediaRecorderRef.current.start();
            console.log('Recording started - animation should continue running');
            
            // Force a redraw of the animation and canvas after starting recording
            if (animationRef.current && fabricCanvasRef.current) {
                animationRef.current.draw(fabricCanvasRef.current);
                fabricCanvasRef.current.renderAll();
                console.log('Forced redraw after starting recording');
            }
            // Start the buffer source for recording (separate from the sample's transport-managed source)
            bufferSource.start();
            // Calculate recording duration based on audio length or user setting
            const actualDuration = uploadedFile 
                ? Math.min(audioBuffer.duration * 1000, recordingDuration) // Use audio duration as default, but allow user override
                : recordingDuration;
            // Stop recording after specified duration
            setTimeout(() => {
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                    mediaRecorderRef.current.stop();
                    songRef.current.getTransport().stop();
                    bufferSource.stop();
                }
            }, actualDuration);
        } catch (error) {
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
    };

    const bufferToWav = (buffer: AudioBuffer) => {
        const length = buffer.length;
        const sampleRate = buffer.sampleRate;
        const arrayBuffer = new ArrayBuffer(44 + length * 2);
        const view = new DataView(arrayBuffer);
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
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            const arrayBuffer = await file.arrayBuffer();
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            // Set recording duration to match audio duration
            setRecordingDuration(audioBuffer.duration * 1000);
            setAudioDuration(audioBuffer.duration * 1000);
            songRef.current.startAudioFromBuffer(audioContext, audioBuffer);
            songRef.current.getTransport().start();
        } catch (error) {}
    };

    const handleProgressBarClick = (event: React.MouseEvent<HTMLDivElement>) => {
        if (audioDuration <= 0) return;
        
        const progressBar = event.currentTarget;
        const rect = progressBar.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const progressBarWidth = rect.width;
        const clickPercentage = clickX / progressBarWidth;
        
        // Calculate the new position in milliseconds
        const newPosition = Math.max(0, Math.min(audioDuration, clickPercentage * audioDuration));
        
        // Seek to the new position
        const transport = songRef.current.getTransport();
        // Convert milliseconds to transport ticks (60fps = 16.67ms per tick)
        const seekTicks = Math.round(newPosition / (1000 / 60));
        transport.seek(seekTicks);
        
        // Immediately update the transport position state to reflect the seek
        setTransportPosition(newPosition);
        
        console.log(`Seeking to ${formatTime(newPosition)} (${(clickPercentage * 100).toFixed(1)}% of audio)`);
    };

    return (
        <div>
            <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
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
                                {uploadedFile.name} ({(recordingDuration / 1000).toFixed(1)}s)
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
                                    max={uploadedFile ? Math.ceil(recordingDuration / 1000) : 30} 
                                    value={recordingDuration / 1000}
                                    onChange={(e) => setRecordingDuration(Number(e.target.value) * 1000)}
                                    className="ml-2 px-2 py-1 border border-gray-300 rounded w-16"
                                    disabled={isRecording}
                                />
                            </label>
                        </div>
                        <div className="flex items-center content-center gap-5">
                            <TransportView model={songRef.current.getTransport()} />
                            <AnimationTypeSelector onChange={(v) => {
                                setAnimationType(v);
                                // Reset theme to default for new animation type
                                if (v === AnimationType.PulsingEye) {
                                    setCurrentTheme(PulsingEyeTheme.BlackHole);
                                } else if (v === AnimationType.Wanderer) {
                                    setCurrentTheme(WandererTheme.BlackHole);
                                }
                            }} />
                            <AspectRatioSelector 
                                onChange={setAspectRatio} 
                                currentAspectRatio={aspectRatio}
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium">VU Level:</span>
                                <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-green-500 transition-all duration-100"
                                        style={{ width: `${currentVuLevel * 100}%` }}
                                    />
                                </div>
                                <span className="text-sm text-gray-600 w-12">
                                    {(currentVuLevel * 100).toFixed(1)}%
                                </span>
                            </div>
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
                                        : 'Record Test'
                                }
                            </button>
                        </div>
                        {/* Theme selector - show for PulsingEye and Wanderer */}
                        {(animationType === AnimationType.PulsingEye || animationType === AnimationType.Wanderer) && (
                            <ThemeSelector 
                                onChange={setCurrentTheme} 
                                currentTheme={currentTheme}
                                themes={getThemesForAnimation(animationType)}
                            />
                        )}
                        {/* Progress indicator */}
                        {audioDuration > 0 && (
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center justify-between text-sm text-gray-600">
                                    <span>Progress</span>
                                    <span>
                                        {formatTime(transportPosition)} / {formatTime(audioDuration)}
                                    </span>
                                </div>
                                <div 
                                    className="w-full bg-gray-200 rounded-full h-2 cursor-pointer hover:bg-gray-300 transition-colors duration-150 relative"
                                    onClick={handleProgressBarClick}
                                    title="Click to seek to position"
                                >
                                    <div 
                                        className="bg-blue-500 h-2 rounded-full"
                                        style={{ 
                                            width: `${audioDuration > 0 ? Math.min(100, (transportPosition / audioDuration) * 100) : 0}%` 
                                        }}
                                    />
                                    {/* Hover indicator */}
                                    <div className="absolute inset-0 opacity-0 hover:opacity-20 bg-blue-300 rounded-full transition-opacity duration-150" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}