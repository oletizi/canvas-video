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

    const handleInstagramShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }
        
        // Instagram sharing guide
        const guide = `
Instagram Video Sharing Guide:

1. Download the video file
2. Open Instagram app on your mobile device
3. Tap the + button to create a new post
4. Select the downloaded video
5. Adjust the crop if needed (Instagram will auto-crop to fit)
6. Add caption and hashtags
7. Share to your feed

Video Details:
- Format: ${videoFormat}
- Dimensions: ${dimensions.width}x${dimensions.height}
- File: canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm

Suggested hashtags: #music #visualization #art #audio #creative
        `;
        
        alert(guide);
        
        // Trigger download for manual sharing
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleYouTubeShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }
        
        // YouTube sharing guide
        const guide = `
YouTube Video Sharing Guide:

1. Download the video file
2. Go to YouTube Studio (studio.youtube.com)
3. Click "CREATE" → "Upload videos"
4. Drag and drop the downloaded video
5. Add title, description, and tags
6. Set visibility (Public, Unlisted, or Private)
7. Click "PUBLISH"

Video Details:
- Format: ${videoFormat}
- Dimensions: ${dimensions.width}x${dimensions.height}
- File: canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm

Suggested title: "Audio Visualization - [Your Song Name]"
Suggested tags: #music #visualization #art #audio #creative #musicvisualization
        `;
        
        alert(guide);
        
        // Trigger download for manual sharing
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleTwitterShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }
        
        // Twitter/X sharing guide
        const guide = `
Twitter/X Video Sharing Guide:

1. Download the video file
2. Go to Twitter/X (twitter.com or x.com)
3. Click the "Post" button
4. Click the media icon to attach video
5. Select the downloaded video
6. Add your tweet text
7. Click "Post"

Video Details:
- Format: ${videoFormat}
- Dimensions: ${dimensions.width}x${dimensions.height}
- File: canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm

Note: Twitter has a 2:20 minute limit for videos
Suggested tweet: "Check out this audio visualization! 🎵 #music #visualization"
        `;
        
        alert(guide);
        
        // Trigger download for manual sharing
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `canvas-video-${videoFormat.toLowerCase()}-${dimensions.width}x${dimensions.height}-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-700">Record & Share:</label>
                <div className="flex gap-3">
                    {/* Instagram Record Button */}
                    <button
                        onClick={handleInstagramRecording}
                        disabled={isRecording}
                        className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            isRecording
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        title="Record video optimized for Instagram (1:1 square format)"
                    >
                        📷 Record for Instagram
                    </button>
                    
                    {/* YouTube Record Button */}
                    <button
                        onClick={handleYouTubeRecording}
                        disabled={isRecording}
                        className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            isRecording
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-red-500 hover:bg-red-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        title="Record video optimized for YouTube (16:9 widescreen format)"
                    >
                        📺 Record for YouTube
                    </button>
                    
                    {/* Twitter Record Button */}
                    <button
                        onClick={handleTwitterRecording}
                        disabled={isRecording}
                        className={`px-6 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center gap-2 ${
                            isRecording
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                        }`}
                        title="Record video optimized for Twitter/X (16:9 widescreen format)"
                    >
                        🐦 Record for Twitter
                    </button>
                </div>
            </div>
            
            {/* Share buttons - only show when video is available */}
            {videoBlob && (
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-gray-700">Share Recorded Video:</label>
                    <div className="flex gap-3">
                        <button
                            onClick={handleInstagramShare}
                            disabled={isRecording}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                isRecording
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                            }`}
                            title="Share to Instagram"
                        >
                            📷 Share to Instagram
                        </button>
                        
                        <button
                            onClick={handleYouTubeShare}
                            disabled={isRecording}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                isRecording
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-red-500 hover:bg-red-600 text-white'
                            }`}
                            title="Share to YouTube"
                        >
                            📺 Share to YouTube
                        </button>
                        
                        <button
                            onClick={handleTwitterShare}
                            disabled={isRecording}
                            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                                isRecording
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                            title="Share to Twitter/X"
                        >
                            🐦 Share to Twitter
                        </button>
                    </div>
                </div>
            )}
            
            {isRecording && (
                <div className="text-sm text-red-600 font-medium">
                    ⏺️ Recording in progress... Please wait for completion.
                </div>
            )}
            
            {!videoBlob && !isRecording && (
                <div className="text-xs text-gray-500">
                    Click a platform button above to start recording with optimized settings
                </div>
            )}
        </div>
    );
} 