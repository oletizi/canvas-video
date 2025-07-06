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

        // Group words into lines
        const lines = this.groupWordsIntoLines(visibleWords);

        // Calculate position
        const position = this.calculatePosition(canvasWidth, canvasHeight, lines.length);

        // Render each line
        lines.forEach((line, lineIndex) => {
            this.renderLine(line, position, lineIndex, canvasWidth);
        });

        this.canvas.renderAll();
    }

    private getVisibleWords(): TranscriptionWord[] {
        const bufferTime = 2; // Show words 2 seconds before and after
        return this.currentWords.filter(word => 
            word.startTime <= this.currentTime + bufferTime && 
            word.endTime >= this.currentTime - bufferTime
        );
    }

    private groupWordsIntoLines(words: TranscriptionWord[]): TranscriptionWord[][] {
        const lines: TranscriptionWord[][] = [];
        let currentLine: TranscriptionWord[] = [];

        words.forEach(word => {
            if (currentLine.length >= this.options.maxWordsPerLine!) {
                lines.push([...currentLine]);
                currentLine = [word];
            } else {
                currentLine.push(word);
            }
        });

        if (currentLine.length > 0) {
            lines.push(currentLine);
        }

        return lines;
    }

    private calculatePosition(canvasWidth: number, canvasHeight: number, lineCount: number): { x: number, y: number } {
        const lineHeight = this.options.fontSize! + this.options.lineSpacing!;
        const totalHeight = lineCount * lineHeight;
        
        let y: number;
        switch (this.options.position) {
            case 'top':
                y = 20;
                break;
            case 'center':
                y = (canvasHeight - totalHeight) / 2;
                break;
            case 'bottom':
            default:
                y = canvasHeight - totalHeight - 20;
                break;
        }

        let x: number;
        switch (this.options.alignment) {
            case 'left':
                x = 20;
                break;
            case 'right':
                x = canvasWidth - 20;
                break;
            case 'center':
            default:
                x = canvasWidth / 2;
                break;
        }

        return { x, y };
    }

    private renderLine(line: TranscriptionWord[], position: { x: number, y: number }, lineIndex: number, canvasWidth: number) {
        if (!this.canvas) return;

        const lineHeight = this.options.fontSize! + this.options.lineSpacing!;
        const y = position.y + (lineIndex * lineHeight);

        // Create text for the line
        const text = line.map(word => word.word).join(' ');
        
        // Create Fabric.js text object
        const textObj = new fabric.Text(text, {
            left: position.x,
            top: y,
            fontSize: this.options.fontSize,
            fontFamily: this.options.fontFamily,
            fill: this.options.color,
            textAlign: this.options.alignment,
            originX: this.options.alignment === 'center' ? 'center' : 
                     this.options.alignment === 'right' ? 'right' : 'left',
            originY: 'top',
            lyricsObject: true, // Mark as lyrics object for easy removal
            selectable: false,
            evented: false
        });

        // Add background if specified
        if (this.options.backgroundColor) {
            const padding = 8;
            const background = new fabric.Rect({
                left: textObj.left! - padding,
                top: textObj.top! - padding,
                width: textObj.width! + (padding * 2),
                height: textObj.height! + (padding * 2),
                fill: this.options.backgroundColor,
                rx: 4,
                ry: 4,
                lyricsObject: true,
                selectable: false,
                evented: false
            });
            this.canvas.add(background);
            this.canvas.sendToBack(background);
        }

        this.canvas.add(textObj);

        // Highlight current word if enabled
        if (this.options.highlightCurrentWord) {
            this.highlightCurrentWord(line, textObj);
        }
    }

    private highlightCurrentWord(line: TranscriptionWord[], textObj: any) {
        const currentWord = line.find(word => 
            this.currentTime >= word.startTime && this.currentTime <= word.endTime
        );

        if (currentWord && this.options.currentWordColor) {
            // Find the position of the current word in the text
            const wordIndex = line.findIndex(word => word === currentWord);
            const wordsBefore = line.slice(0, wordIndex);
            const textBefore = wordsBefore.map(w => w.word).join(' ');
            const wordWidth = this.canvas.getContext().measureText(currentWord.word).width;
            
            // Create highlight rectangle
            const highlight = new fabric.Rect({
                left: textObj.left! + this.canvas.getContext().measureText(textBefore + ' ').width,
                top: textObj.top!,
                width: wordWidth,
                height: textObj.height!,
                fill: this.options.currentWordColor,
                opacity: 0.3,
                lyricsObject: true,
                selectable: false,
                evented: false
            });
            
            this.canvas.add(highlight);
            this.canvas.sendToBack(highlight);
        }
    }

    public setOptions(options: Partial<LyricsDisplayOptions>) {
        this.options = { ...this.options, ...options };
    }
} 