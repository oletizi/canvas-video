import type { TranscriptionWord, TranscriptionResult } from './speech-types';

// Base interface for transcription services
export interface TranscriptionService {
    name: string;
    isAvailable(): boolean;
    transcribe(audioBuffer: AudioBuffer): Promise<TranscriptionResult>;
}

// OpenAI Whisper API implementation
export class WhisperTranscriptionService implements TranscriptionService {
    name = 'OpenAI Whisper';
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || null;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async transcribe(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        if (!this.apiKey) {
            throw new Error('OpenAI API key not provided');
        }

        try {
            // Convert audio buffer to WAV format
            const wavData = this.audioBufferToWav(audioBuffer);
            
            // Create FormData for multipart/form-data request
            const formData = new FormData();
            const audioBlob = new Blob([wavData], { type: 'audio/wav' });
            formData.append('file', audioBlob, 'audio.wav');
            formData.append('model', 'whisper-1');
            formData.append('response_format', 'verbose_json');
            formData.append('timestamp_granularities', 'word');
            
            const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    // Don't set Content-Type - let the browser set it with boundary for multipart/form-data
                },
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Whisper API error: ${response.status} ${response.statusText} - ${errorText}`);
            }

            const result = await response.json();
            return this.convertWhisperResult(result, audioBuffer.duration);
        } catch (error) {
            console.error('Whisper transcription error:', error);
            throw error;
        }
    }

    private audioBufferToBase64(audioBuffer: AudioBuffer): string {
        // Convert audio buffer to WAV format and then to base64
        const wavData = this.audioBufferToWav(audioBuffer);
        return this.arrayBufferToBase64(wavData);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        // Process in chunks to avoid stack overflow
        const chunkSize = 8192; // 8KB chunks
        for (let i = 0; i < len; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
        }
        return btoa(binary);
    }

    private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        
        // WAV header size
        const headerSize = 44;
        const dataSize = length * numChannels * 2; // 16-bit samples
        const buffer = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(buffer);
        
        // Write WAV header
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);
        
        // Write audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return buffer;
    }

    private convertWhisperResult(result: any, audioDuration: number): TranscriptionResult {
        console.log('Whisper API response:', JSON.stringify(result, null, 2));
        console.log('Audio duration:', audioDuration, 'seconds');
        
        const words: TranscriptionWord[] = [];
        
        if (result.words && Array.isArray(result.words)) {
            console.log('Found words array with', result.words.length, 'words');
            result.words.forEach((word: any) => {
                words.push({
                    word: word.word.toLowerCase(),
                    startTime: word.start,
                    endTime: word.end,
                    confidence: word.confidence || 0.8
                });
            });
        } else {
            console.log('No words array found in response, creating word-level timing from full text');
            // Fallback: create word-level timing from full text with more realistic distribution
            const fullText = result.text || '';
            if (fullText) {
                const textWords = fullText.split(/\s+/).filter(word => word.length > 0);
                
                // Use a more realistic timing model based on word length and position
                let currentTime = 0;
                textWords.forEach((word: string, index: number) => {
                    // Base duration based on word length (longer words take more time)
                    const baseDuration = Math.max(0.2, Math.min(0.8, word.length * 0.1));
                    
                    // Add some variation based on position (words at start/end might be slower)
                    const positionFactor = index < 3 || index > textWords.length - 3 ? 1.2 : 1.0;
                    
                    // Add some random variation
                    const randomFactor = 0.8 + (Math.random() * 0.4); // 0.8 to 1.2
                    
                    const wordDuration = baseDuration * positionFactor * randomFactor;
                    
                    words.push({
                        word: word.toLowerCase(),
                        startTime: currentTime,
                        endTime: currentTime + wordDuration,
                        confidence: 0.8
                    });
                    
                    currentTime += wordDuration;
                });
                
                // Scale the timing to fit the actual audio duration
                if (currentTime > 0) {
                    const scaleFactor = audioDuration / currentTime;
                    words.forEach(word => {
                        word.startTime *= scaleFactor;
                        word.endTime *= scaleFactor;
                    });
                }
            }
        }
        
        console.log('Converted result:', { wordCount: words.length, fullText: result.text });
        
        return {
            words,
            fullText: result.text || '',
            isFinal: true,
            timestamp: Date.now()
        };
    }
}

// Google Cloud Speech-to-Text implementation
export class GoogleSpeechTranscriptionService implements TranscriptionService {
    name = 'Google Cloud Speech-to-Text';
    private apiKey: string | null = null;

    constructor(apiKey?: string) {
        this.apiKey = apiKey || null;
    }

    isAvailable(): boolean {
        return !!this.apiKey;
    }

    async transcribe(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        if (!this.apiKey) {
            throw new Error('Google Cloud API key not provided');
        }

        try {
            const audioData = this.audioBufferToBase64(audioBuffer);
            
            const response = await fetch(`https://speech.googleapis.com/v1/speech:recognize?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    config: {
                        encoding: 'LINEAR16',
                        sampleRateHertz: audioBuffer.sampleRate,
                        languageCode: 'en-US',
                        enableWordTimeOffsets: true,
                        enableAutomaticPunctuation: true
                    },
                    audio: {
                        content: audioData
                    }
                })
            });

            if (!response.ok) {
                throw new Error(`Google Speech API error: ${response.statusText}`);
            }

            const result = await response.json();
            return this.convertGoogleResult(result);
        } catch (error) {
            console.error('Google Speech transcription error:', error);
            throw error;
        }
    }

    private audioBufferToBase64(audioBuffer: AudioBuffer): string {
        const wavData = this.audioBufferToWav(audioBuffer);
        return this.arrayBufferToBase64(wavData);
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        const len = bytes.byteLength;
        // Process in chunks to avoid stack overflow
        const chunkSize = 8192; // 8KB chunks
        for (let i = 0; i < len; i += chunkSize) {
            const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
            for (let j = 0; j < chunk.length; j++) {
                binary += String.fromCharCode(chunk[j]);
            }
        }
        return btoa(binary);
    }

    private audioBufferToWav(audioBuffer: AudioBuffer): ArrayBuffer {
        // Same WAV conversion as Whisper service
        const numChannels = audioBuffer.numberOfChannels;
        const sampleRate = audioBuffer.sampleRate;
        const length = audioBuffer.length;
        
        const headerSize = 44;
        const dataSize = length * numChannels * 2;
        const buffer = new ArrayBuffer(headerSize + dataSize);
        const view = new DataView(buffer);
        
        const writeString = (offset: number, string: string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };
        
        writeString(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true);
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);
        
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return buffer;
    }

    private convertGoogleResult(result: any): TranscriptionResult {
        const words: TranscriptionWord[] = [];
        
        if (result.results && Array.isArray(result.results)) {
            result.results.forEach((resultItem: any) => {
                if (resultItem.alternatives && resultItem.alternatives[0].words) {
                    resultItem.alternatives[0].words.forEach((word: any) => {
                        words.push({
                            word: word.word.toLowerCase(),
                            startTime: parseFloat(word.startTime.replace('s', '')),
                            endTime: parseFloat(word.endTime.replace('s', '')),
                            confidence: word.confidence || 0.8
                        });
                    });
                }
            });
        }
        
        return {
            words,
            fullText: result.results?.[0]?.alternatives?.[0]?.transcript || '',
            isFinal: true,
            timestamp: Date.now()
        };
    }
}

// Fallback service that generates sample lyrics
export class SampleTranscriptionService implements TranscriptionService {
    name = 'Sample Lyrics (No API Key)';
    
    isAvailable(): boolean {
        return true; // Always available as fallback
    }

    async transcribe(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        const duration = audioBuffer.duration;
        const sampleLyrics = this.generateSampleLyrics(duration);
        
        console.log('SampleTranscriptionService: Generated sample lyrics for', duration.toFixed(1), 'seconds');
        
        return {
            words: sampleLyrics,
            fullText: sampleLyrics.map(w => w.word).join(' '),
            isFinal: true,
            timestamp: Date.now()
        };
    }

    private generateSampleLyrics(duration: number): TranscriptionWord[] {
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

        const selectedText = sampleTexts[Math.floor(Math.random() * sampleTexts.length)];
        const words = selectedText.split(/\s+/).filter(word => word.length > 0);
        const wordDuration = duration / words.length;
        
        return words.map((word, index) => ({
            word: word.toLowerCase(),
            startTime: index * wordDuration,
            endTime: (index + 1) * wordDuration,
            confidence: 0.8 + (Math.random() * 0.2)
        }));
    }
}

// Transcription service manager
export class TranscriptionServiceManager {
    private services: TranscriptionService[] = [];
    private currentService: TranscriptionService | null = null;

    constructor() {
        // Add available services
        this.addService(new SampleTranscriptionService());
        
        // Check for API keys in environment or localStorage
        const openaiKey = this.getApiKey('openai');
        const googleKey = this.getApiKey('google');
        
        if (openaiKey) {
            this.addService(new WhisperTranscriptionService(openaiKey));
        }
        
        if (googleKey) {
            this.addService(new GoogleSpeechTranscriptionService(googleKey));
        }
        
        // Set default service (prefer real services over sample)
        this.currentService = this.services.find(s => s.name !== 'Sample Lyrics (No API Key)') || this.services[0];
    }

    addService(service: TranscriptionService) {
        this.services.push(service);
    }

    getAvailableServices(): TranscriptionService[] {
        return this.services.filter(s => s.isAvailable());
    }

    setCurrentService(serviceName: string) {
        const service = this.services.find(s => s.name === serviceName);
        if (service && service.isAvailable()) {
            this.currentService = service;
        }
    }

    getCurrentService(): TranscriptionService | null {
        return this.currentService;
    }

    async transcribe(audioBuffer: AudioBuffer): Promise<TranscriptionResult> {
        if (!this.currentService) {
            throw new Error('No transcription service available');
        }
        
        return this.currentService.transcribe(audioBuffer);
    }

    private getApiKey(service: string): string | null {
        // Check localStorage first
        const localKey = localStorage.getItem(`${service}_api_key`);
        if (localKey) return localKey;
        
        // Check environment variables (for server-side)
        if (typeof process !== 'undefined' && process.env) {
            return process.env[`${service.toUpperCase()}_API_KEY`] || null;
        }
        
        return null;
    }

    setApiKey(service: string, apiKey: string) {
        localStorage.setItem(`${service}_api_key`, apiKey);
        
        // Reinitialize services with new key
        this.services = this.services.filter(s => s.name === 'Sample Lyrics (No API Key)');
        
        if (service === 'openai') {
            this.addService(new WhisperTranscriptionService(apiKey));
        } else if (service === 'google') {
            this.addService(new GoogleSpeechTranscriptionService(apiKey));
        }
        
        // Update current service
        this.currentService = this.services.find(s => s.name !== 'Sample Lyrics (No API Key)') || this.services[0];
    }
} 