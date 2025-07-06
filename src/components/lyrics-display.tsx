import type { TranscriptionWord, TranscriptionResult, LyricsDisplayOptions } from '@/lib/speech-types';
import * as fabric from 'fabric';

export class LyricsDisplay {
    private options: LyricsDisplayOptions;
    private currentWords: TranscriptionWord[] = [];
    private currentTime: number = 0;
    private canvas: any; // Fabric.js canvas

    constructor(options: LyricsDisplayOptions = {}) {
        this.options = {
            fontSize: 24,
            fontFamily: 'Arial, sans-serif',
            color: '#ffffff',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            position: 'bottom',
            alignment: 'center',
            fadeInDuration: 0.3,
            fadeOutDuration: 0.3,
            maxWordsPerLine: 8,
            lineSpacing: 8,
            showWordTiming: false,
            highlightCurrentWord: true,
            currentWordColor: '#ffff00',
            ...options
        };
    }

    public setCanvas(canvas: any) {
        this.canvas = canvas;
        console.log('LyricsDisplay: Canvas set', canvas ? 'successfully' : 'failed');
    }

    public updateTranscription(result: TranscriptionResult) {
        this.currentWords = result.words;
        console.log('LyricsDisplay: Updated transcription with', result.words.length, 'words:', result.fullText);
    }

    // Test method to add some sample words for debugging
    public addTestWords() {
        const testWords: TranscriptionWord[] = [
            { word: 'hello', startTime: 0, endTime: 0.5, confidence: 0.9 },
            { word: 'world', startTime: 0.5, endTime: 1.0, confidence: 0.9 },
            { word: 'this', startTime: 1.0, endTime: 1.5, confidence: 0.9 },
            { word: 'is', startTime: 1.5, endTime: 2.0, confidence: 0.9 },
            { word: 'a', startTime: 2.0, endTime: 2.5, confidence: 0.9 },
            { word: 'test', startTime: 2.5, endTime: 3.0, confidence: 0.9 }
        ];
        this.currentWords = testWords;
        console.log('LyricsDisplay: Added test words, count:', this.currentWords.length);
        console.log('LyricsDisplay: Canvas available:', !!this.canvas);
        
        // Force a render with current time
        this.updateTime(0);
    }

    public updateTime(currentTime: number) {
        this.currentTime = currentTime;
        this.render();
    }

    public forceRender() {
        this.render();
    }

    public clear() {
        this.currentWords = [];
        this.clearCanvas();
    }

    private clearCanvas() {
        if (!this.canvas) return;

        // Remove existing lyrics objects
        const objects = this.canvas.getObjects();
        const lyricsObjects = objects.filter((obj: any) => obj.lyricsObject === true);
        lyricsObjects.forEach((obj: any) => this.canvas.remove(obj));
        this.canvas.renderAll();
    }

    private render() {
        if (!this.canvas || this.currentWords.length === 0) {
            console.log('LyricsDisplay: No canvas or no words to display');
            return;
        }

        this.clearCanvas();

        const canvasWidth = this.canvas.getWidth();
        const canvasHeight = this.canvas.getHeight();

        // Get words that should be visible at current time
        const visibleWords = this.getVisibleWords();
        if (visibleWords.length === 0) {
            console.log('LyricsDisplay: No visible words at time', this.currentTime);
            return;
        }

        console.log('LyricsDisplay: Rendering', visibleWords.length, 'words at time', this.currentTime);

        // Calculate position for horizontal scroll
        const position = this.calculateHorizontalPosition(canvasWidth, canvasHeight);

        // Render horizontal scrolling text
        this.renderHorizontalScroll(visibleWords, position, canvasWidth);

        this.canvas.renderAll();
    }

    private getVisibleWords(): TranscriptionWord[] {
        const bufferTime = 5; // Show more words for smooth scrolling
        return this.currentWords.filter(word => 
            word.startTime <= this.currentTime + bufferTime && 
            word.endTime >= this.currentTime - bufferTime
        );
    }



    private calculateHorizontalPosition(canvasWidth: number, canvasHeight: number): { x: number, y: number } {
        let y: number;
        switch (this.options.position) {
            case 'top':
                y = 20;
                break;
            case 'center':
                y = canvasHeight / 2;
                break;
            case 'bottom':
            default:
                y = canvasHeight - this.options.fontSize! - 20;
                break;
        }

        // For horizontal scroll, we'll calculate x dynamically based on current word position
        const x = canvasWidth / 2; // Center point for scrolling

        return { x, y };
    }

    private renderHorizontalScroll(words: TranscriptionWord[], position: { x: number, y: number }, canvasWidth: number) {
        if (!this.canvas || words.length === 0) return;

        const ctx = this.canvas.getContext();
        const wordSpacing = 20; // Space between words
        let currentX = position.x;
        
        // Find the current word to center the scroll
        const currentWordIndex = words.findIndex(word => 
            this.currentTime >= word.startTime && this.currentTime <= word.endTime
        );
        
        // Calculate the offset to center the current word
        let centerOffset = 0;
        if (currentWordIndex !== -1) {
            // Calculate width of all words before the current word
            for (let i = 0; i < currentWordIndex; i++) {
                const wordWidth = ctx.measureText(words[i].word).width;
                centerOffset += wordWidth + wordSpacing;
            }
            // Add half the current word width
            const currentWordWidth = ctx.measureText(words[currentWordIndex].word).width;
            centerOffset += currentWordWidth / 2;
        }
        
        // Adjust starting position to center the current word
        currentX -= centerOffset;

        // Render each word
        words.forEach((word, index) => {
            const wordWidth = ctx.measureText(word.word).width;
            
            // Determine word color based on timing
            let wordColor = this.options.color;
            let isCurrent = false;
            
            if (this.currentTime >= word.startTime && this.currentTime <= word.endTime) {
                wordColor = this.options.currentWordColor || this.options.color;
                isCurrent = true;
            } else if (this.currentTime > word.endTime) {
                // Past words - dimmed
                wordColor = this.dimColor(this.options.color, 0.5);
            }
            
            // Create word text object
            const textObj = new fabric.Text(word.word, {
                left: currentX,
                top: position.y,
                fontSize: this.options.fontSize,
                fontFamily: this.options.fontFamily,
                fill: wordColor,
                originX: 'left',
                originY: 'top',
                lyricsObject: true,
                selectable: false,
                evented: false
            });
            
            // Add background for current word if highlighting is enabled
            if (isCurrent && this.options.highlightCurrentWord && this.options.backgroundColor) {
                const padding = 4;
                const background = new fabric.Rect({
                    left: currentX - padding,
                    top: position.y - padding,
                    width: wordWidth + (padding * 2),
                    height: this.options.fontSize! + (padding * 2),
                    fill: this.options.backgroundColor,
                    rx: 2,
                    ry: 2,
                    lyricsObject: true,
                    selectable: false,
                    evented: false
                });
                this.canvas.add(background);
            }
            
            this.canvas.add(textObj);
            
            // Move to next word position
            currentX += wordWidth + wordSpacing;
        });
    }
    
    private dimColor(color: string, factor: number): string {
        // Simple color dimming - convert hex to rgba and reduce opacity
        if (color.startsWith('#')) {
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${factor})`;
        }
        return color;
    }



    public setOptions(options: Partial<LyricsDisplayOptions>) {
        this.options = { ...this.options, ...options };
    }
} 