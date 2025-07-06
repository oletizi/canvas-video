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
    const [calibratedWords, setCalibratedWords] = useState<Map<number, {startTime: number, endTime: number}>>(new Map());

    // Calibration logic
    const applyCalibration = () => {
        if (calibrationClicks.length === 0) return;
        
        // Create a map of calibrated word timings
        const newCalibratedWords = new Map<number, {startTime: number, endTime: number}>();
        
        calibrationClicks.forEach(click => {
            const word = transcription?.words[click.wordIndex];
            if (word) {
                // Set the word's start time to when it was clicked
                const wordDuration = word.endTime - word.startTime;
                newCalibratedWords.set(click.wordIndex, {
                    startTime: click.clickTime,
                    endTime: click.clickTime + wordDuration
                });
            }
        });
        
        setCalibratedWords(newCalibratedWords);
        console.log(`Calibration applied: ${calibrationClicks.length} words calibrated`);
        setIsCalibrating(false);
        setCalibrationClicks([]);
    };
    
    const startCalibration = () => {
        setIsCalibrating(true);
        setCalibrationClicks([]);
        setCalibratedWords(new Map()); // Clear previous calibrations
        console.log('Starting calibration mode - click words as you hear them');
    };
    
    const cancelCalibration = () => {
        setIsCalibrating(false);
        setCalibrationClicks([]);
        console.log('Calibration cancelled');
    };
    
    const clearCalibration = () => {
        setCalibratedWords(new Map());
        console.log('Calibration cleared');
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
        // Calculate interpolated timing for uncalibrated words
        const getInterpolatedTiming = (wordIndex: number): {startTime: number, endTime: number} => {
            const calibratedTiming = calibratedWords.get(wordIndex);
            if (calibratedTiming) {
                return calibratedTiming;
            }
            
            // Find the nearest calibrated words before and after this word
            const calibratedIndices = Array.from(calibratedWords.keys()).sort((a, b) => a - b);
            const beforeIndex = calibratedIndices.filter(i => i < wordIndex).pop();
            const afterIndex = calibratedIndices.find(i => i > wordIndex);
            
            if (beforeIndex !== undefined && afterIndex !== undefined) {
                // Interpolate between two calibrated words
                const beforeWord = transcription?.words[beforeIndex];
                const afterWord = transcription?.words[afterIndex];
                const beforeTiming = calibratedWords.get(beforeIndex);
                
                if (beforeWord && afterWord && beforeTiming) {
                    const beforeOriginalStart = beforeWord.startTime;
                    const afterOriginalStart = afterWord.startTime;
                    const beforeCalibratedStart = beforeTiming.startTime;
                    
                    // Calculate the ratio of this word's position between the two calibrated words
                    const originalPosition = (word.startTime - beforeOriginalStart) / (afterOriginalStart - beforeOriginalStart);
                    
                    // Estimate the calibrated start time of the after word (use original duration)
                    const afterCalibratedStart = beforeCalibratedStart + (afterOriginalStart - beforeOriginalStart);
                    
                    // Interpolate this word's start time
                    const interpolatedStart = beforeCalibratedStart + (afterCalibratedStart - beforeCalibratedStart) * originalPosition;
                    const wordDuration = word.endTime - word.startTime;
                    
                    return {
                        startTime: interpolatedStart,
                        endTime: interpolatedStart + wordDuration
                    };
                }
            } else if (beforeIndex !== undefined) {
                // Extrapolate from the last calibrated word
                const beforeWord = transcription?.words[beforeIndex];
                const beforeTiming = calibratedWords.get(beforeIndex);
                
                if (beforeWord && beforeTiming) {
                    const timeDiff = word.startTime - beforeWord.startTime;
                    const wordDuration = word.endTime - word.startTime;
                    
                    return {
                        startTime: beforeTiming.startTime + timeDiff,
                        endTime: beforeTiming.startTime + timeDiff + wordDuration
                    };
                }
            } else if (afterIndex !== undefined) {
                // Extrapolate from the first calibrated word
                const afterWord = transcription?.words[afterIndex];
                const afterTiming = calibratedWords.get(afterIndex);
                
                if (afterWord && afterTiming) {
                    const timeDiff = afterWord.startTime - word.startTime;
                    const wordDuration = word.endTime - word.startTime;
                    
                    return {
                        startTime: afterTiming.startTime - timeDiff,
                        endTime: afterTiming.startTime - timeDiff + wordDuration
                    };
                }
            }
            
            // Fallback to original timing
            return { startTime: word.startTime, endTime: word.endTime };
        };
        
        const timing = getInterpolatedTiming(index);
        const wordStartTime = timing.startTime;
        const wordEndTime = timing.endTime;
        
        const adjustedCurrentTime = currentTime + timeOffset + syncOffset;
        const isCurrent = adjustedCurrentTime >= wordStartTime && adjustedCurrentTime <= wordEndTime;
        const hasPassed = adjustedCurrentTime > wordEndTime;
        
        // Check if this word was clicked during calibration or is interpolated
        const isCalibrated = calibrationClicks.some(click => click.wordIndex === index) || calibratedWords.has(index);
        const isInterpolated = !isCalibrated && calibratedWords.size > 0 && (
            Array.from(calibratedWords.keys()).some(calibratedIndex => calibratedIndex < index) ||
            Array.from(calibratedWords.keys()).some(calibratedIndex => calibratedIndex > index)
        );
        
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
                } ${isCalibrated ? 'ring-2 ring-green-500' : ''} ${isInterpolated ? 'ring-1 ring-blue-300' : ''}`}
                title={isCalibrating 
                    ? `Click when you hear "${word.word}"` 
                    : `${formatTime(wordStartTime)} - ${formatTime(wordEndTime)} (confidence: ${(word.confidence * 100).toFixed(1)}%)`
                }
                onClick={handleWordClick}
            >
                {showTimestamps && (
                    <span className="text-xs text-gray-500 mr-1">
                        [{formatTime(wordStartTime)}]
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
                        <span className="font-medium text-blue-800">Word Calibration:</span>
                        {isCalibrating ? (
                            <span className="text-blue-600 ml-2">
                                Click words as you hear them ({calibrationClicks.length} clicks)
                            </span>
                        ) : (
                            <span className="text-gray-600 ml-2">
                                Set individual word timings by clicking during playback
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {!isCalibrating ? (
                            <>
                                <button
                                    onClick={startCalibration}
                                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    Start Calibration
                                </button>
                                {calibratedWords.size > 0 && (
                                    <button
                                        onClick={clearCalibration}
                                        className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
                                    >
                                        Clear ({calibratedWords.size})
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={applyCalibration}
                                    disabled={calibrationClicks.length === 0}
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
                    <span>Calibrated words: {calibratedWords.size}</span>
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
                    {calibratedWords.size > 0 && (
                        <>
                            <span>🟢 Calibrated words</span>
                            <span>🔵 Interpolated words</span>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
} 