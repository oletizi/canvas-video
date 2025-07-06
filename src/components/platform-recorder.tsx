import { VideoFormat } from "@/components/video-format-presets";
import { AspectRatio } from "@/components/aspect-ratio-selector";

interface PlatformRecorderProps {
    onFormatChange: (format: VideoFormat) => void;
    onAspectRatioChange: (aspectRatio: AspectRatio) => void;
    onStartRecording: () => void;
    videoBlob: Blob | null;
    dimensions: { width: number; height: number };
    isRecording: boolean;
    videoFormat: VideoFormat;
}

export default function PlatformRecorder({
    onFormatChange,
    onAspectRatioChange,
    onStartRecording,
    videoBlob,
    dimensions,
    isRecording,
    videoFormat
}: PlatformRecorderProps) {

    const handleInstagramRecording = async () => {
        if (isRecording) return;
        
        // Set Instagram format and aspect ratio
        onFormatChange(VideoFormat.Instagram);
        onAspectRatioChange(AspectRatio.Square);
        
        // Start recording
        onStartRecording();
    };

    const handleYouTubeRecording = async () => {
        if (isRecording) return;
        
        // Set YouTube format and aspect ratio
        onFormatChange(VideoFormat.YouTube);
        onAspectRatioChange(AspectRatio.Widescreen);
        
        // Start recording
        onStartRecording();
    };

    const handleTwitterRecording = async () => {
        if (isRecording) return;
        
        // Set Twitter format (16:9 widescreen)
        onFormatChange(VideoFormat.YouTube); // Use YouTube format for 16:9
        onAspectRatioChange(AspectRatio.Widescreen);
        
        // Start recording
        onStartRecording();
    };

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Record for Platform:</label>
                
                {isRecording && (
                    <div className="text-sm text-red-600 font-medium">
                        ⏺️ Recording...
                    </div>
                )}
            </div>
            
            <div className="flex gap-3">
                {/* Instagram Record Button */}
                <button
                    onClick={handleInstagramRecording}
                    disabled={isRecording}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                        isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md hover:shadow-lg'
                    }`}
                    title="Record video optimized for Instagram (1:1 square format)"
                >
                    📷 Record for Instagram
                </button>
                
                {/* YouTube Record Button */}
                <button
                    onClick={handleYouTubeRecording}
                    disabled={isRecording}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                        isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white shadow-md hover:shadow-lg'
                    }`}
                    title="Record video optimized for YouTube (16:9 widescreen format)"
                >
                    📺 Record for YouTube
                </button>
                
                {/* Twitter Record Button */}
                <button
                    onClick={handleTwitterRecording}
                    disabled={isRecording}
                    className={`px-6 py-2 text-sm font-medium rounded-md transition-all duration-200 flex items-center gap-2 ${
                        isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
                    }`}
                    title="Record video optimized for Twitter/X (16:9 widescreen format)"
                >
                    🐦 Record for Twitter
                </button>
            </div>
            
            {!videoBlob && !isRecording && (
                <div className="text-xs text-gray-500 text-center">
                    Click a platform button to start recording
                </div>
            )}
        </div>
    );
} 