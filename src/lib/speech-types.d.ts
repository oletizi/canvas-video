export interface TranscriptionWord {
    word: string;
    startTime: number; // in seconds
    endTime: number;   // in seconds
    confidence: number;
}

export interface TranscriptionResult {
    words: TranscriptionWord[];
    fullText: string;
    isFinal: boolean;
    timestamp: number;
}

export interface LyricsDisplayOptions {
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    backgroundColor?: string;
    position?: 'top' | 'center' | 'bottom';
    alignment?: 'left' | 'center' | 'right';
    fadeInDuration?: number;
    fadeOutDuration?: number;
    maxWordsPerLine?: number;
    lineSpacing?: number;
    showWordTiming?: boolean;
    highlightCurrentWord?: boolean;
    currentWordColor?: string;
} 