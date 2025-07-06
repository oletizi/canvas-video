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
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationClicks, setCalibrationClicks] = useState<Array<{wordIndex: number, clickTime: number}>>([]);

    // Calibration logic
    const calculateOptimalOffset = () => {
        if (calibrationClicks.length < 2) return;
        
        let totalOffset = 0;
        let validComparisons = 0;
        
        calibrationClicks.forEach(click => {
            const word = transcription?.words[click.wordIndex];
            if (word) {
                // Calculate the offset needed to align this word's timing with when it was clicked
                const neededOffset = click.clickTime - word.startTime;
                totalOffset += neededOffset;
                validComparisons++;
            }
        });
        
        if (validComparisons > 0) {
            const averageOffset = totalOffset / validComparisons;
            console.log(`Calibration complete: ${validComparisons} clicks, average offset: ${averageOffset.toFixed(2)}s`);
            setSyncOffset(averageOffset);
            setIsCalibrating(false);
            setCalibrationClicks([]);
        }
    };
    
    const startCalibration = () => {
        setIsCalibrating(true);
        setCalibrationClicks([]);
        console.log('Starting calibration mode - click words as you hear them');
    };
    
    const cancelCalibration = () => {
        setIsCalibrating(false);
        setCalibrationClicks([]);
        console.log('Calibration cancelled');
    };

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
        
        // Check if this word was clicked during calibration
        const isCalibrated = calibrationClicks.some(click => click.wordIndex === index);
        
        const handleWordClick = () => {
            if (isCalibrating) {
                const clickTime = currentTime;
                console.log(`Calibration click: word "${word.word}" at index ${index}, time ${clickTime.toFixed(2)}s`);
                setCalibrationClicks(prev => [...prev, { wordIndex: index, clickTime }]);
            }
        };
        
        return (
            <span
                key={index}
                className={`inline-block px-1 rounded transition-colors cursor-pointer ${
                    isCalibrating 
                        ? 'hover:bg-blue-100 hover:text-blue-900' 
                        : isCurrent 
                            ? 'bg-yellow-200 text-yellow-900 font-semibold' 
                            : hasPassed 
                                ? 'text-gray-600' 
                                : 'text-gray-800'
                } ${isCalibrated ? 'ring-2 ring-green-500' : ''}`}
                title={isCalibrating 
                    ? `Click when you hear "${word.word}"` 
                    : `${formatTime(word.startTime)} - ${formatTime(word.endTime)} (confidence: ${(word.confidence * 100).toFixed(1)}%)`
                }
                onClick={handleWordClick}
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
                            disabled={isCalibrating}
                        />
                        <span className="w-12">{syncOffset.toFixed(1)}s</span>
                    </div>
                </div>
            </div>
            
            {/* Calibration Controls */}
            <div className="mb-3 p-2 bg-blue-50 rounded border">
                <div className="flex items-center justify-between">
                    <div className="text-xs">
                        <span className="font-medium text-blue-800">Sync Calibration:</span>
                        {isCalibrating ? (
                            <span className="text-blue-600 ml-2">
                                Click words as you hear them ({calibrationClicks.length} clicks)
                            </span>
                        ) : (
                            <span className="text-gray-600 ml-2">
                                Click words during playback to auto-sync
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isCalibrating ? (
                            <button
                                onClick={startCalibration}
                                className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Start Calibration
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={calculateOptimalOffset}
                                    disabled={calibrationClicks.length < 2}
                                    className="px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Apply ({calibrationClicks.length})
                                </button>
                                <button
                                    onClick={cancelCalibration}
                                    className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Cancel
                                </button>
                            </>
                        )}
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