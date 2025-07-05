import { useState } from 'react';
import { VideoFormat } from "@/components/video-format-presets";
import { AspectRatio } from "@/components/aspect-ratio-selector";
import { PlatformAuth, InstagramAPI, YouTubeAPI, TwitterAPI, UploadProgress } from "@/lib/platform-apis";
import PlatformAuthComponent from "./platform-auth";
import UploadProgressComponent from "./upload-progress";

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
    const [platformAuths, setPlatformAuths] = useState<Record<string, PlatformAuth>>({});
    const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<string>('');

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

    const handleAuthSuccess = (platform: string, auth: PlatformAuth) => {
        setPlatformAuths(prev => ({ ...prev, [platform]: auth }));
        setShowAuth(false);
    };

    const handleAuthError = (platform: string, error: string) => {
        console.error(`Authentication error for ${platform}:`, error);
        alert(`Failed to authenticate with ${platform}: ${error}`);
    };

    const handleUploadProgress = (progress: UploadProgress) => {
        setUploadProgress(progress);
        if (progress.status === 'complete' || progress.status === 'error') {
            setTimeout(() => setUploadProgress(null), 5000);
        }
    };

    const handleInstagramShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }

        const auth = platformAuths['instagram'];
        if (!auth) {
            setSelectedPlatform('instagram');
            setShowAuth(true);
            return;
        }

        try {
            setUploadProgress({
                platform: 'Instagram',
                progress: 0,
                status: 'preparing',
                message: 'Preparing Instagram upload...'
            });

            const caption = `🎵 Audio Visualization\n\n#music #visualization #art #audio #creative #musicvisualization`;
            
            const progress = await InstagramAPI.uploadVideo(videoBlob, caption, auth);
            handleUploadProgress(progress);

        } catch (error) {
            handleUploadProgress({
                platform: 'Instagram',
                progress: 0,
                status: 'error',
                message: `Upload failed: ${error.message}`
            });
        }
    };

    const handleYouTubeShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }

        const auth = platformAuths['youtube'];
        if (!auth) {
            setSelectedPlatform('youtube');
            setShowAuth(true);
            return;
        }

        try {
            setUploadProgress({
                platform: 'YouTube',
                progress: 0,
                status: 'preparing',
                message: 'Preparing YouTube upload...'
            });

            const title = `Audio Visualization - ${new Date().toLocaleDateString()}`;
            const description = `🎵 Audio visualization created with Canvas Video\n\n#music #visualization #art #audio #creative #musicvisualization`;
            
            const progress = await YouTubeAPI.uploadVideo(videoBlob, title, description, auth);
            handleUploadProgress(progress);

        } catch (error) {
            handleUploadProgress({
                platform: 'YouTube',
                progress: 0,
                status: 'error',
                message: `Upload failed: ${error.message}`
            });
        }
    };

    const handleTwitterShare = async () => {
        if (!videoBlob) {
            alert('No video available to share. Please record a video first.');
            return;
        }

        const auth = platformAuths['twitter'];
        if (!auth) {
            setSelectedPlatform('twitter');
            setShowAuth(true);
            return;
        }

        try {
            setUploadProgress({
                platform: 'Twitter',
                progress: 0,
                status: 'preparing',
                message: 'Preparing Twitter upload...'
            });

            const text = `Check out this audio visualization! 🎵 #music #visualization #art #audio #creative`;
            
            const progress = await TwitterAPI.uploadVideo(videoBlob, text, auth);
            handleUploadProgress(progress);

        } catch (error) {
            handleUploadProgress({
                platform: 'Twitter',
                progress: 0,
                status: 'error',
                message: `Upload failed: ${error.message}`
            });
        }
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
                            📷 {platformAuths['instagram'] ? 'Upload to Instagram' : 'Connect & Upload to Instagram'}
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
                            📺 {platformAuths['youtube'] ? 'Upload to YouTube' : 'Connect & Upload to YouTube'}
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
                            🐦 {platformAuths['twitter'] ? 'Upload to Twitter' : 'Connect & Upload to Twitter'}
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

            {/* Authentication Modal */}
            {showAuth && selectedPlatform && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold">Connect to {selectedPlatform}</h3>
                            <button
                                onClick={() => setShowAuth(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>
                        <PlatformAuthComponent
                            platform={selectedPlatform}
                            onAuthSuccess={(auth) => handleAuthSuccess(selectedPlatform, auth)}
                            onAuthError={(error) => handleAuthError(selectedPlatform, error)}
                        />
                    </div>
                </div>
            )}

            {/* Upload Progress Modal */}
            <UploadProgressComponent
                progress={uploadProgress}
                onClose={() => setUploadProgress(null)}
            />
        </div>
    );
} 