import { useState } from 'react';
import type { LyricsDisplayOptions } from '@/lib/speech-types';

interface LyricsControlsProps {
    isTranscribing: boolean;
    onToggleTranscription: () => void;
    onOptionsChange: (options: Partial<LyricsDisplayOptions>) => void;
    currentOptions: LyricsDisplayOptions;
    transcriptionSupported: boolean;
    currentText: string;
    onTestLyrics?: () => void;
}

export default function LyricsControls({
    isTranscribing,
    onToggleTranscription,
    onOptionsChange,
    currentOptions,
    transcriptionSupported,
    currentText,
    onTestLyrics
}: LyricsControlsProps) {
    const [showAdvanced, setShowAdvanced] = useState(false);

    if (!transcriptionSupported) {
        return (
            <div className="flex flex-col gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2">
                    <span className="text-yellow-800 text-sm">⚠️</span>
                    <span className="text-yellow-800 text-sm font-medium">Speech Recognition Not Supported</span>
                </div>
                <p className="text-yellow-700 text-xs">
                    Your browser doesn't support the Web Speech API. Try using Chrome, Edge, or Safari for lyrics transcription.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Lyrics Transcription</h3>
                <div className="flex gap-2">
                    {onTestLyrics && (
                        <button
                            onClick={onTestLyrics}
                            className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-blue-500 hover:bg-blue-600 text-white"
                        >
                            Test Lyrics
                        </button>
                    )}
                    <button
                        onClick={onToggleTranscription}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                            isTranscribing
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                    >
                        {isTranscribing ? 'Stop' : 'Start'} Transcription
                    </button>
                </div>
            </div>

            {isTranscribing && (
                <div className="text-xs text-gray-600">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        <span>Listening for speech...</span>
                    </div>
                    {currentText && (
                        <div className="bg-white p-2 rounded border text-xs">
                            <span className="font-medium">Current text:</span> {currentText}
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                >
                    {showAdvanced ? 'Hide' : 'Show'} Advanced Options
                </button>
            </div>

            {showAdvanced && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <label className="block text-gray-600 mb-1">Position</label>
                        <select
                            value={currentOptions.position}
                            onChange={(e) => onOptionsChange({ position: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            <option value="top">Top</option>
                            <option value="center">Center</option>
                            <option value="bottom">Bottom</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Alignment</label>
                        <select
                            value={currentOptions.alignment}
                            onChange={(e) => onOptionsChange({ alignment: e.target.value as any })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        >
                            <option value="left">Left</option>
                            <option value="center">Center</option>
                            <option value="right">Right</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Font Size</label>
                        <input
                            type="number"
                            min="12"
                            max="48"
                            value={currentOptions.fontSize}
                            onChange={(e) => onOptionsChange({ fontSize: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Max Words/Line</label>
                        <input
                            type="number"
                            min="3"
                            max="15"
                            value={currentOptions.maxWordsPerLine}
                            onChange={(e) => onOptionsChange({ maxWordsPerLine: parseInt(e.target.value) })}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Text Color</label>
                        <input
                            type="color"
                            value={currentOptions.color}
                            onChange={(e) => onOptionsChange({ color: e.target.value })}
                            className="w-full h-8 border border-gray-300 rounded"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 mb-1">Highlight Color</label>
                        <input
                            type="color"
                            value={currentOptions.currentWordColor}
                            onChange={(e) => onOptionsChange({ currentWordColor: e.target.value })}
                            className="w-full h-8 border border-gray-300 rounded"
                        />
                    </div>

                    <div className="col-span-2">
                        <label className="flex items-center gap-2 text-gray-600">
                            <input
                                type="checkbox"
                                checked={currentOptions.highlightCurrentWord}
                                onChange={(e) => onOptionsChange({ highlightCurrentWord: e.target.checked })}
                                className="rounded"
                            />
                            <span>Highlight current word</span>
                        </label>
                    </div>

                    <div className="col-span-2">
                        <label className="flex items-center gap-2 text-gray-600">
                            <input
                                type="checkbox"
                                checked={!!currentOptions.backgroundColor}
                                onChange={(e) => onOptionsChange({ 
                                    backgroundColor: e.target.checked ? 'rgba(0, 0, 0, 0.7)' : undefined 
                                })}
                                className="rounded"
                            />
                            <span>Show background</span>
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
} 