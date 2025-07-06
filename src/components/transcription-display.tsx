import { useState } from 'react';
import type { TranscriptionResult, TranscriptionWord } from '@/lib/speech-types';

interface TranscriptionDisplayProps {
    transcription: TranscriptionResult | null;
    currentTime: number; // Current playback time in seconds
    timeOffset?: number; // Offset to apply to timing (in seconds)
}

const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

export default function TranscriptionDisplay({ 
    transcription, 
    currentTime,
    timeOffset = 0
}: TranscriptionDisplayProps) {
    const [showTimestamps, setShowTimestamps] = useState(true);
    const [groupByLine, setGroupByLine] = useState(true);
    const [syncOffset, setSyncOffset] = useState(-0.5); // User-adjustable sync offset

    // Debug logging
    console.log('TranscriptionDisplay: Received props:', {
        transcription: transcription,
        hasTranscription: !!transcription,
        wordCount: transcription?.words?.length || 0,
        currentTime: currentTime
    });

    if (!transcription || transcription.words.length === 0) {
        return (
            <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-700">Transcription Results</h3>
                </div>
                <div className="text-sm text-gray-500 italic">
                    No transcription available. Upload an audio file to see results.
                    <br />
                    <span className="text-xs">Debug: transcription={JSON.stringify(transcription)}</span>
                </div>
            </div>
        );
    }

    const renderWord = (word: TranscriptionWord, index: number) => {
        const adjustedCurrentTime = currentTime + timeOffset + syncOffset;
        const isCurrent = adjustedCurrentTime >= word.startTime && adjustedCurrentTime <= word.endTime;
        const hasPassed = adjustedCurrentTime > word.endTime;
        
        return (
            <span
                key={index}
                className={`inline-block px-1 rounded transition-colors ${
                    isCurrent 
                        ? 'bg-yellow-200 text-yellow-900 font-semibold' 
                        : hasPassed 
                            ? 'text-gray-600' 
                            : 'text-gray-800'
                }`}
                title={`${formatTime(word.startTime)} - ${formatTime(word.endTime)} (confidence: ${(word.confidence * 100).toFixed(1)}%)`}
            >
                {showTimestamps && (
                    <span className="text-xs text-gray-500 mr-1">
                        [{formatTime(word.startTime)}]
                    </span>
                )}
                {word.word}
            </span>
        );
    };

    const renderWords = () => {
        if (groupByLine) {
            // Group words into lines (similar to lyrics display logic)
            const maxWordsPerLine = 8;
            const lines: TranscriptionWord[][] = [];
            let currentLine: TranscriptionWord[] = [];

            transcription.words.forEach((word, index) => {
                if (currentLine.length >= maxWordsPerLine) {
                    lines.push([...currentLine]);
                    currentLine = [word];
                } else {
                    currentLine.push(word);
                }
            });

            if (currentLine.length > 0) {
                lines.push(currentLine);
            }

            return lines.map((line, lineIndex) => (
                <div key={lineIndex} className="mb-2 leading-relaxed">
                    {line.map((word, wordIndex) => renderWord(word, transcription.words.indexOf(word)))}
                </div>
            ));
        } else {
            // Show all words in a single flow
            return (
                <div className="leading-relaxed">
                    {transcription.words.map((word, index) => renderWord(word, index))}
                </div>
            );
        }
    };

    return (
        <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Transcription Results</h3>
                <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={showTimestamps}
                            onChange={(e) => setShowTimestamps(e.target.checked)}
                            className="w-3 h-3"
                        />
                        <span>Show timestamps</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                        <input
                            type="checkbox"
                            checked={groupByLine}
                            onChange={(e) => setGroupByLine(e.target.checked)}
                            className="w-3 h-3"
                        />
                        <span>Group by line</span>
                    </label>
                    <div className="flex items-center gap-2 text-xs">
                        <span>Sync offset:</span>
                        <input
                            type="range"
                            min="-2"
                            max="2"
                            step="0.1"
                            value={syncOffset}
                            onChange={(e) => setSyncOffset(parseFloat(e.target.value))}
                            className="w-20"
                        />
                        <span className="w-12">{syncOffset.toFixed(1)}s</span>
                    </div>
                </div>
            </div>

            <div className="mb-3 text-xs text-gray-600">
                <div className="flex items-center gap-4">
                    <span>Total words: {transcription.words.length}</span>
                    <span>Duration: {formatTime(transcription.words[transcription.words.length - 1]?.endTime || 0)}</span>
                    <span>Current time: {formatTime(currentTime)}</span>
                    <span>Adjusted time: {formatTime(currentTime + timeOffset + syncOffset)}</span>
                </div>
            </div>

            <div className="bg-white p-3 rounded border max-h-64 overflow-y-auto">
                {renderWords()}
            </div>

            {transcription.fullText && (
                <div className="mt-3 p-2 bg-blue-50 rounded border">
                    <div className="text-xs font-medium text-blue-800 mb-1">Full Text:</div>
                    <div className="text-sm text-blue-700">{transcription.fullText}</div>
                </div>
            )}

            <div className="mt-3 text-xs text-gray-500">
                <div className="flex items-center gap-4">
                    <span>🟡 Current word</span>
                    <span>⚫ Past words</span>
                    <span>⚪ Future words</span>
                </div>
            </div>
        </div>
    );
} 