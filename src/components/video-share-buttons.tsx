import { VideoFormat } from "@/components/video-format-presets";

interface VideoShareButtonsProps {
    videoBlob: Blob | null;
    videoFormat: VideoFormat;
    dimensions: { width: number; height: number };
    isRecording: boolean;
}

export default function VideoShareButtons({ 
    videoBlob, 
    videoFormat, 
    dimensions, 
    isRecording 
}: VideoShareButtonsProps) {
    
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

Tips:
- Add relevant tags like #music #visualization #art
- Include a description explaining your audio visualization
- Consider adding timestamps if the video is long
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
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">Share Video:</label>
            <div className="flex gap-2">
                <button
                    onClick={handleInstagramShare}
                    disabled={!videoBlob || isRecording}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        !videoBlob || isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white'
                    }`}
                    title="Share to Instagram"
                >
                    📷 Instagram
                </button>
                
                <button
                    onClick={handleYouTubeShare}
                    disabled={!videoBlob || isRecording}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        !videoBlob || isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                    }`}
                    title="Share to YouTube"
                >
                    📺 YouTube
                </button>
                
                <button
                    onClick={handleTwitterShare}
                    disabled={!videoBlob || isRecording}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        !videoBlob || isRecording
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                    title="Share to Twitter/X"
                >
                    🐦 Twitter/X
                </button>
            </div>
            
            {!videoBlob && (
                <div className="text-xs text-gray-500">
                    Record a video first to enable sharing options
                </div>
            )}
        </div>
    );
} 