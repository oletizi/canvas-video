import { UploadProgress } from "@/lib/platform-apis";

interface UploadProgressProps {
    progress: UploadProgress | null;
    onClose: () => void;
}

export default function UploadProgressComponent({ progress, onClose }: UploadProgressProps) {
    if (!progress) return null;

    const getStatusColor = (status: UploadProgress['status']) => {
        switch (status) {
            case 'preparing':
                return 'text-blue-600';
            case 'uploading':
                return 'text-yellow-600';
            case 'processing':
                return 'text-purple-600';
            case 'complete':
                return 'text-green-600';
            case 'error':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    const getStatusIcon = (status: UploadProgress['status']) => {
        switch (status) {
            case 'preparing':
                return '⚙️';
            case 'uploading':
                return '📤';
            case 'processing':
                return '🔄';
            case 'complete':
                return '✅';
            case 'error':
                return '❌';
            default:
                return '📋';
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                        {getStatusIcon(progress.status)} Uploading to {progress.platform}
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                        disabled={progress.status === 'uploading' || progress.status === 'processing'}
                    >
                        ✕
                    </button>
                </div>
                
                <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                                progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                        />
                    </div>
                </div>
                
                <div className={`text-sm font-medium ${getStatusColor(progress.status)} mb-4`}>
                    {progress.message}
                </div>
                
                {progress.status === 'complete' && (
                    <div className="bg-green-50 border border-green-200 rounded p-3 mb-4">
                        <p className="text-green-800 text-sm">
                            🎉 Your video has been successfully uploaded to {progress.platform}!
                        </p>
                    </div>
                )}
                
                {progress.status === 'error' && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
                        <p className="text-red-800 text-sm">
                            ❌ Upload failed. Please try again or use manual sharing.
                        </p>
                    </div>
                )}
                
                <div className="flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                            progress.status === 'uploading' || progress.status === 'processing'
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                        disabled={progress.status === 'uploading' || progress.status === 'processing'}
                    >
                        {progress.status === 'uploading' || progress.status === 'processing' 
                            ? 'Please wait...' 
                            : 'Close'
                        }
                    </button>
                </div>
            </div>
        </div>
    );
} 