import React, { useEffect, useRef, useState } from 'react';
import { newSong } from '@/song/song';
import { AnimationType, newAnimation, PulsingEyeTheme, WandererTheme } from '@/video/song-animation';
import type { SongAnimation } from '@/video/song-animation';
import AnimationTypeSelector from '@/components/animation-type';
import ThemeSelector from '@/components/theme-selector';
import AspectRatioSelector, { AspectRatio } from '@/components/aspect-ratio-selector';
import { VideoFormat, getPresetByFormat } from '@/components/video-format-presets';
import PlatformRecorder from '@/components/platform-recorder';
import { TransportView } from '@/ts/components/transport';
import { Canvas } from 'fabric';
import { SpeechToText } from '@/lib/speech-to-text';
import { TranscriptionServiceManager } from '@/lib/transcription-services';
import type { TranscriptionResult } from '@/lib/speech-types';
import { LyricsDisplay } from '@/components/lyrics-display';
import type { LyricsDisplayOptions } from '@/lib/speech-types';
import TranscriptionSettings from '@/components/transcription-settings';
import TranscriptionDisplay from '@/components/transcription-display';
import LyricsControls from '@/components/lyrics-controls';
import PixelConfigSelector from '@/components/pixel-config-selector';

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
    const [videoFormat, setVideoFormat] = useState<VideoFormat>(VideoFormat.Custom);
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(3000); // Will be updated to audio duration when audio is loaded
    const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);
    const [currentVuLevel, setCurrentVuLevel] = useState(0);
    const [transportPosition, setTransportPosition] = useState(0); // Current position in milliseconds
    const [audioDuration, setAudioDuration] = useState(0); // Total audio duration in milliseconds
    const [isTranscribing, setIsTranscribing] = useState(false);
    const [currentTranscription, setCurrentTranscription] = useState<TranscriptionResult | null>(null);
    const [lyricsOptions, setLyricsOptions] = useState<LyricsDisplayOptions>({
        fontSize: 24,
        fontFamily: 'Arial, sans-serif',
        color: '#b8860b',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        position: 'bottom',
        alignment: 'center',
        maxWordsPerLine: 8,
        lineSpacing: 8,
        highlightCurrentWord: true,
        currentWordColor: '#ffff00'
    });
    const framerate = 60;
    const frameInterval = 1000 / framerate;
    const [transcriptionApiCallCount, setTranscriptionApiCallCount] = useState(0);
    const [transcriptionEnabled, setTranscriptionEnabled] = useState(false);
    const [selectedPixelConfigId, setSelectedPixelConfigId] = useState<string | null>(null);

    // Persistent objects as refs
    const songRef = useRef(newSong());
    const animationRef = useRef<SongAnimation | null>(null);
    const fabricCanvasRef = useRef<any>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recordedChunksRef = useRef<Blob[]>([]);
    const currentAudioUrlRef = useRef<string | null>(null);
    const speechToTextRef = useRef<SpeechToText | null>(null);
    const transcriptionServiceManagerRef = useRef<TranscriptionServiceManager | null>(null);
    const lyricsDisplayRef = useRef<LyricsDisplay | null>(null);

    // Canvas dimensions
    const [dimensions, setDimensions] = useState({ width: 1000, height: 450 });

    useEffect(() => {
        // Update canvas size based on video format or aspect ratio
        const updateDimensions = () => {
            let width: number;
            const height = 500; // Always 500px high
            
            if (videoFormat !== VideoFormat.Custom) {
                // Use video format presets but scale to 500px height
                const preset = getPresetByFormat(videoFormat);
                const scale = height / preset.height;
                width = preset.width * scale;
            } else {
                // Use aspect ratio calculation
                // Calculate width based on aspect ratio
                switch (aspectRatio) {
                    case AspectRatio.Widescreen: // 16:9
                        width = height * (16 / 9);
                        break;
                    case AspectRatio.Standard: // 4:3
                        width = height * (4 / 3);
                        break;
                    case AspectRatio.Square: // 1:1
                        width = height;
                        break;
                    default:
                        width = height * (16 / 9); // Default to 16:9
                }
            }
            
            setDimensions({ width, height });
        };
        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
    }, [aspectRatio, videoFormat]);

    useEffect(() => {
        // Setup canvas and animation
        if (canvasRef.current) {
            fabricCanvasRef.current = new Canvas(canvasRef.current, { selection: false });
            fabricCanvasRef.current.backgroundColor = '#444444'; // Slightly lighter for debugging
            fabricCanvasRef.current.renderAll();
            
            // Initialize speech-to-text
            speechToTextRef.current = new SpeechToText();
            
            // Initialize transcription service manager
            transcriptionServiceManagerRef.current = new TranscriptionServiceManager();
            
            // Initialize lyrics display
            lyricsDisplayRef.current = new LyricsDisplay(lyricsOptions);
            lyricsDisplayRef.current.setCanvas(fabricCanvasRef.current);
            console.log('SongPlayer: Lyrics display initialized');
            
            // Set up transcription callback
            if (speechToTextRef.current) {
                speechToTextRef.current.onTranscription((result) => {
                    setCurrentTranscription(result);
                    if (lyricsDisplayRef.current) {
                        lyricsDisplayRef.current.updateTranscription(result);
                    }
                });
            }
            
            // Save lyrics objects before animation setup
            const lyricsObjects = fabricCanvasRef.current ? 
                fabricCanvasRef.current.getObjects().filter((obj: any) => obj.lyricsObject === true) : [];
            
            animationRef.current = newAnimation(animationType, songRef.current, framerate, currentTheme, selectedPixelConfigId || undefined);
            console.log('Animation created:', animationType, 'animation object:', animationRef.current);
            animationRef.current?.setup(fabricCanvasRef.current);
            console.log('Animation setup complete. Canvas objects:', fabricCanvasRef.current.getObjects().length);
            
            // Restore lyrics objects after animation setup
            if (lyricsObjects.length > 0) {
                lyricsObjects.forEach((obj: any) => {
                    fabricCanvasRef.current.add(obj);
                });
                console.log('Restored', lyricsObjects.length, 'lyrics objects after animation setup');
            }
            
            // Animation loop
            const transport = songRef.current.getTransport();
            const interval = setInterval(() => {
                if (animationRef.current && fabricCanvasRef.current) {
                    animationRef.current.draw(fabricCanvasRef.current);
                    transport.tick();
                    
                    // Update lyrics display with current time
                    if (lyricsDisplayRef.current) {
                        // Use transport ticks directly for more accurate timing
                        const transportTicks = transport.getPosition();
                        const currentTimeInSeconds = transportTicks / 60; // 60fps = 60 ticks per second
                        lyricsDisplayRef.current.updateTime(currentTimeInSeconds);
                    }
                    
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
    }, [animationType, currentTheme, selectedPixelConfigId]);

    // Separate effect to handle canvas resizing when dimensions change
    useEffect(() => {
        if (fabricCanvasRef.current && canvasRef.current) {
            // Update the fabric canvas dimensions
            fabricCanvasRef.current.setDimensions({
                width: dimensions.width,
                height: dimensions.height
            });
            
            // Update lyrics display canvas reference
            if (lyricsDisplayRef.current) {
                lyricsDisplayRef.current.setCanvas(fabricCanvasRef.current);
                console.log('SongPlayer: Lyrics display canvas updated after resize');
            }
            
            // Re-setup the animation with the new canvas dimensions
            if (animationRef.current) {
                // Save lyrics objects before clearing
                const lyricsObjects = fabricCanvasRef.current.getObjects().filter((obj: any) => obj.lyricsObject === true);
                
                // Clear existing objects
                fabricCanvasRef.current.clear();
                // Re-setup the animation
                animationRef.current.setup(fabricCanvasRef.current);
                console.log('Canvas resized to:', dimensions.width, 'x', dimensions.height);
                
                // Restore lyrics objects after animation setup
                if (lyricsObjects.length > 0) {
                    lyricsObjects.forEach((obj: any) => {
                        fabricCanvasRef.current.add(obj);
                    });
                    console.log('Restored', lyricsObjects.length, 'lyrics objects after resize');
                }
                
                // Re-render lyrics if we have any
                if (lyricsDisplayRef.current) {
                    lyricsDisplayRef.current.updateTime(0); // Force a re-render
                }
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
            setTransportPosition(0);
            
            // Get canvas stream first
            const canvasStream = canvasRef.current.captureStream(framerate);
            
            // Create a new buffer source for the MediaRecorder 
            bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = audioBuffer;
            
            // Create media stream destination for recording
            const dest = audioContext.createMediaStreamDestination();
            bufferSource.connect(dest);
            
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
                console.log('Recording stopped');
                const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
                downloadVideo(blob);
                setIsRecording(false);
                if (currentAudioUrlRef.current) {
                    URL.revokeObjectURL(currentAudioUrlRef.current);
                    currentAudioUrlRef.current = null;
                }
            };
            
            // Start recording first
            mediaRecorderRef.current.start();
            console.log('Recording started');
            
            // Wait a moment for the recorder to initialize
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Start both audio and transport simultaneously
            const startTime = audioContext.currentTime;
            bufferSource.start(startTime);
            songRef.current.getTransport().start();
            
            console.log('Audio and transport started simultaneously at:', startTime);
            
            // Calculate recording duration based on audio length or user setting
            const actualDuration = uploadedFile 
                ? Math.min(audioBuffer.duration * 1000, recordingDuration)
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
        // Store the blob for sharing
        setRecordedVideoBlob(blob);
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Create filename with format info
        const formatName = videoFormat.toLowerCase();
        const timestamp = Date.now();
        const dimensionString = `${dimensions.width}x${dimensions.height}`;
        a.download = `canvas-video-${formatName}-${dimensionString}-${timestamp}.webm`;
        
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
            setRecordingDuration(audioBuffer.duration * 1000);
            setAudioDuration(audioBuffer.duration * 1000);
            songRef.current.startAudioFromBuffer(audioContext, audioBuffer);
            songRef.current.getTransport().start();

            // Transcribe the audio file only if transcription is enabled
            if (transcriptionEnabled && transcriptionServiceManagerRef.current) {
                setTranscriptionApiCallCount(count => count + 1);
                console.log('SongPlayer: Starting audio file transcription...');
                try {
                    const transcriptionResult = await transcriptionServiceManagerRef.current.transcribe(audioBuffer);
                    console.log('SongPlayer: Transcription result received:', transcriptionResult);
                    setCurrentTranscription(transcriptionResult);
                    if (lyricsDisplayRef.current) {
                        lyricsDisplayRef.current.updateTranscription(transcriptionResult);
                    }
                    console.log('SongPlayer: Audio file transcription complete:', transcriptionResult.words.length, 'words');
                } catch (error) {
                    console.error('SongPlayer: Transcription failed:', error);
                    alert('Transcription failed. Using sample lyrics instead.');
                }
            }
        } catch (error) {
            console.error('SongPlayer: Error processing audio file:', error);
        }
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

    const handleToggleTranscription = () => {
        if (!speechToTextRef.current) return;

        if (isTranscribing) {
            speechToTextRef.current.stop();
            setIsTranscribing(false);
        } else {
            // Start transcription when audio is playing
            const transport = songRef.current.getTransport();
            if (transport.isRunning()) {
                const audioContext = songRef.current.getAudioContext();
                if (audioContext) {
                    speechToTextRef.current.start(audioContext);
                    setIsTranscribing(true);
                }
            } else {
                alert('Please start playing audio before starting transcription');
            }
        }
    };

    const handleLyricsOptionsChange = (options: Partial<LyricsDisplayOptions>) => {
        const newOptions = { ...lyricsOptions, ...options };
        setLyricsOptions(newOptions);
        if (lyricsDisplayRef.current) {
            lyricsDisplayRef.current.setOptions(newOptions);
        }
    };

    const handleTestLyrics = () => {
        console.log('SongPlayer: Test lyrics button clicked');
        if (lyricsDisplayRef.current) {
            lyricsDisplayRef.current.addTestWords();
        } else {
            console.log('SongPlayer: Lyrics display ref is null');
        }
    };

    const handleTranscriptionServiceChange = (serviceName: string) => {
        console.log('SongPlayer: Transcription service changed to:', serviceName);
        // The service manager will handle the change internally
    };

    const handleToggleTranscriptionEnabled = () => {
        setTranscriptionEnabled(!transcriptionEnabled);
        // Clear transcription when disabling
        if (transcriptionEnabled) {
            setCurrentTranscription(null);
            if (lyricsDisplayRef.current) {
                lyricsDisplayRef.current.clear();
            }
        }
    };

    return (
        <div>
            <div className="flex justify-center">
                <canvas ref={canvasRef} width={dimensions.width} height={dimensions.height} />
            </div>
            <div className="container mx-auto pt-5">
                <div className="flex flex-col gap-4">
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
                            // Reset pixel config when switching away from PixelConfig type
                            if (v !== AnimationType.PixelConfig) {
                                setSelectedPixelConfigId(null);
                            }
                        }} />
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
                    </div>
                    
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
                    
                    {/* Pixel Config selector - show for PixelConfig */}
                    {animationType === AnimationType.PixelConfig && (
                        <PixelConfigSelector
                            selectedConfigId={selectedPixelConfigId}
                            onConfigSelect={setSelectedPixelConfigId}
                            disabled={isRecording}
                        />
                    )}
                    
                    {/* Theme selector - show for PulsingEye and Wanderer */}
                    {(animationType === AnimationType.PulsingEye || animationType === AnimationType.Wanderer) && (
                        <ThemeSelector 
                            onChange={setCurrentTheme} 
                            currentTheme={currentTheme}
                            themes={getThemesForAnimation(animationType)}
                        />
                    )}

                    {/* Transcription Toggle */}
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
                        <label className="text-sm font-medium">
                            Duration (s):
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
                        <button
                            onClick={handleToggleTranscriptionEnabled}
                            className={`px-4 py-2 rounded font-medium transition-colors ${
                                transcriptionEnabled 
                                    ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                            }`}
                        >
                            {transcriptionEnabled ? 'Transcription: ON' : 'Transcription: OFF'}
                        </button>
                        {transcriptionEnabled && (
                            <span className="text-sm text-gray-600">
                                API calls: {transcriptionApiCallCount}
                            </span>
                        )}
                    </div>

                    {/* Transcription Controls - only show when enabled */}
                    {transcriptionEnabled && (
                        <>
                            {/* Lyrics Controls */}
                            <LyricsControls
                                isTranscribing={isTranscribing}
                                onToggleTranscription={handleToggleTranscription}
                                onOptionsChange={handleLyricsOptionsChange}
                                currentOptions={lyricsOptions}
                                transcriptionSupported={speechToTextRef.current?.isSupported() || false}
                                currentText={currentTranscription?.fullText || ''}
                                onTestLyrics={handleTestLyrics}
                            />

                            {/* Transcription Display */}
                            <TranscriptionDisplay
                                transcription={currentTranscription}
                                currentTime={transportPosition / 1000} // Convert milliseconds to seconds
                                timeOffset={-0.5} // Delay transcription by 0.5 seconds to sync with audio
                            />

                            {/* Transcription Service Settings */}
                            {transcriptionServiceManagerRef.current && (
                                <TranscriptionSettings
                                    serviceManager={transcriptionServiceManagerRef.current}
                                    onServiceChange={handleTranscriptionServiceChange}
                                />
                            )}
                        </>
                    )}
                    
                    {/* Platform-specific recording and sharing */}
                    <PlatformRecorder 
                        onFormatChange={setVideoFormat}
                        onAspectRatioChange={setAspectRatio}
                        onStartRecording={startVideoRecording}
                        videoBlob={recordedVideoBlob}
                        dimensions={dimensions}
                        isRecording={isRecording}
                        videoFormat={videoFormat}
                    />
                </div>
            </div>
        </div>
    );
}