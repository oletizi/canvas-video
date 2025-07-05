import { VideoFormat, VIDEO_PRESETS } from "@/components/video-format-presets";

export default function VideoFormatSelector({ 
    onChange, 
    currentFormat = VideoFormat.Custom 
}: { 
    onChange: (format: VideoFormat) => void;
    currentFormat?: VideoFormat;
}) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Video Format:</label>
            <div className="flex gap-1">
                {Object.values(VideoFormat).map((format) => {
                    const preset = VIDEO_PRESETS[format];
                    return (
                        <button
                            key={format}
                            onClick={() => onChange(format)}
                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                currentFormat === format
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                            title={`${preset.description} (${preset.width}x${preset.height})`}
                        >
                            {format}
                        </button>
                    );
                })}
            </div>
            {currentFormat !== VideoFormat.Custom && (
                <div className="text-xs text-gray-600 mt-1">
                    {VIDEO_PRESETS[currentFormat].description} - {VIDEO_PRESETS[currentFormat].recommendedUse}
                </div>
            )}
        </div>
    );
} 