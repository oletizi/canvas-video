// Speech-to-text functionality using Web Speech API
import type { TranscriptionWord, TranscriptionResult } from './speech-types';

export class SpeechToText {
    private recognition: SpeechRecognition | null = null;
    private isListening = false;
    private onTranscriptionUpdate: ((result: TranscriptionResult) => void) | null = null;
    private currentWords: TranscriptionWord[] = [];
    private audioContext: AudioContext | null = null;
    private audioStartTime = 0;

    constructor() {
        // Check if Web Speech API is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Web Speech API not supported in this browser');
            return;
        }

        // Initialize speech recognition
        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        this.setupRecognition();
    }

    private setupRecognition() {
        if (!this.recognition) return;

        // Configure recognition settings
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        // Handle recognition results
        this.recognition.onresult = (event: SpeechRecognitionEvent) => {
            const result = event.results[event.results.length - 1];
            const isFinal = result.isFinal;
            
            if (isFinal) {
                // Process final result
                this.processFinalResult(result);
            } else {
                // Process interim result
                this.processInterimResult(result);
            }
        };

        // Handle errors
        this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech') {
                // Restart recognition if no speech detected
                this.restart();
            }
        };

        // Handle end of recognition
        this.recognition.onend = () => {
            if (this.isListening) {
                // Restart if we're supposed to be listening
                this.restart();
            }
        };
    }

    private processFinalResult(result: SpeechRecognitionResult) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        console.log('Speech recognition final result:', transcript, 'confidence:', confidence);
        
        // Split transcript into words
        const words = transcript.split(/\s+/).filter(word => word.length > 0);
        
        // Estimate timing for each word (simple approach)
        const wordDuration = transcript.length / words.length * 0.1; // Rough estimate
        const currentTime = this.audioContext ? this.audioContext.currentTime - this.audioStartTime : 0;
        
        const transcriptionWords: TranscriptionWord[] = words.map((word, index) => ({
            word: word.toLowerCase(),
            startTime: currentTime + (index * wordDuration),
            endTime: currentTime + ((index + 1) * wordDuration),
            confidence: confidence
        }));

        // Add to current words
        this.currentWords.push(...transcriptionWords);

        // Create result
        const transcriptionResult: TranscriptionResult = {
            words: [...this.currentWords],
            fullText: this.currentWords.map(w => w.word).join(' '),
            isFinal: true,
            timestamp: Date.now()
        };

        console.log('Speech recognition: Total words now:', this.currentWords.length);

        // Notify listeners
        if (this.onTranscriptionUpdate) {
            this.onTranscriptionUpdate(transcriptionResult);
        }
    }

    private processInterimResult(result: SpeechRecognitionResult) {
        const transcript = result[0].transcript;
        const confidence = result[0].confidence;
        
        // Create interim result
        const transcriptionResult: TranscriptionResult = {
            words: [...this.currentWords],
            fullText: transcript,
            isFinal: false,
            timestamp: Date.now()
        };

        // Notify listeners
        if (this.onTranscriptionUpdate) {
            this.onTranscriptionUpdate(transcriptionResult);
        }
    }

    public start(audioContext: AudioContext) {
        if (!this.recognition) {
            console.error('Speech recognition not available');
            return;
        }

        this.audioContext = audioContext;
        this.audioStartTime = audioContext.currentTime;
        this.currentWords = [];
        this.isListening = true;

        try {
            this.recognition.start();
            console.log('Speech recognition started at time:', audioContext.currentTime);
        } catch (error) {
            console.error('Failed to start speech recognition:', error);
        }
    }

    public stop() {
        if (!this.recognition) return;

        this.isListening = false;
        this.recognition.stop();
        console.log('Speech recognition stopped');
    }

    public restart() {
        if (!this.recognition || !this.isListening) return;

        try {
            this.recognition.stop();
            setTimeout(() => {
                if (this.isListening) {
                    this.recognition?.start();
                }
            }, 100);
        } catch (error) {
            console.error('Failed to restart speech recognition:', error);
        }
    }

    public onTranscription(callback: (result: TranscriptionResult) => void) {
        this.onTranscriptionUpdate = callback;
    }

    public getCurrentWords(): TranscriptionWord[] {
        return [...this.currentWords];
    }

    public clear() {
        this.currentWords = [];
    }

    public isSupported(): boolean {
        return this.recognition !== null;
    }
}

// Alternative: Use pre-recorded audio file transcription
export class AudioFileTranscription {
    private audioContext: AudioContext | null = null;

    constructor() {
        this.audioContext = new AudioContext();
    }

    // Generate sample lyrics based on audio duration
    // This is a placeholder - in production, use a real transcription service
    public async transcribeAudioFile(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        const duration = audioBuffer.duration;
        
        // Generate sample lyrics that match the audio duration
        const sampleLyrics = this.generateSampleLyrics(duration);
        
        console.log('AudioFileTranscription: Generated sample lyrics for', duration.toFixed(1), 'seconds');
        
        return {
            words: sampleLyrics,
            fullText: sampleLyrics.map(w => w.word).join(' '),
            isFinal: true,
            timestamp: Date.now()
        };
    }

    private generateSampleLyrics(duration: number): TranscriptionWord[] {
        // Sample lyrics that can be used for testing
        const sampleTexts = [
            "This is a sample song with lyrics that will appear on the screen",
            "The music plays and the words flow like a river through time",
            "Every beat and every note tells a story of its own",
            "Listen to the rhythm feel the groove let it move your soul",
            "Music is the universal language that connects us all together",
            "From the first note to the last we journey through sound",
            "The melody carries us away to places we've never been",
            "In the silence between the notes we find our own voice",
            "Let the music guide you through the darkness and the light",
            "Together we create something beautiful something true"
        ];

        // Select a random sample text or cycle through them
        const selectedText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        const words = selectedText.split(/\s+/).filter(word => word.length > 0);
        
        // Distribute words evenly across the audio duration
        const wordDuration = duration / words.length;
        
        return words.map((word, index) => ({
            word: word.toLowerCase(),
            startTime: index * wordDuration,
            endTime: (index + 1) * wordDuration,
            confidence: 0.8 + (Math.random() * 0.2) // Random confidence between 0.8-1.0
        }));
    }

    // Method to integrate with real transcription services
    // Uncomment and configure for production use
    /*
    public async transcribeWithService(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        // Convert audio buffer to format suitable for API
        const audioData = this.audioBufferToWav(audioBuffer);
        
        // Example: Google Cloud Speech-to-Text API
        const response = await fetch('/api/transcribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                audio: audioData,
                encoding: 'LINEAR16',
                sampleRateHertz: audioBuffer.sampleRate,
                languageCode: 'en-US',
                enableWordTimeOffsets: true
            })
        });
        
        const result = await response.json();
        return this.convertApiResult(result);
    }
    */
} 