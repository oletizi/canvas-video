import { useState, useEffect } from 'react';
import { PlatformAuth, AuthManager } from '@/lib/platform-apis';

interface PlatformAuthProps {
    platform: string;
    onAuthSuccess: (auth: PlatformAuth) => void;
    onAuthError: (error: string) => void;
}

export default function PlatformAuthComponent({ platform, onAuthSuccess, onAuthError }: PlatformAuthProps) {
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [authStatus, setAuthStatus] = useState<'none' | 'authenticating' | 'authenticated' | 'error'>('none');

    useEffect(() => {
        // Check if we have stored auth for this platform
        const storedAuth = localStorage.getItem(`${platform}_auth`);
        if (storedAuth) {
            try {
                const auth: PlatformAuth = JSON.parse(storedAuth);
                // Check if token is still valid
                if (auth.expiresAt && auth.expiresAt > Date.now()) {
                    setAuthStatus('authenticated');
                    onAuthSuccess(auth);
                } else {
                    // Token expired, remove it
                    localStorage.removeItem(`${platform}_auth`);
                }
            } catch (error) {
                localStorage.removeItem(`${platform}_auth`);
            }
        }
    }, [platform, onAuthSuccess]);

    const handleAuthenticate = async () => {
        setIsAuthenticating(true);
        setAuthStatus('authenticating');

        try {
            let auth: PlatformAuth | null = null;

            switch (platform.toLowerCase()) {
                case 'instagram':
                    auth = await AuthManager.authenticateInstagram();
                    break;
                case 'youtube':
                    auth = await AuthManager.authenticateYouTube();
                    break;
                case 'twitter':
                    auth = await AuthManager.authenticateTwitter();
                    break;
                default:
                    throw new Error(`Unsupported platform: ${platform}`);
            }

            if (auth) {
                // Store auth in localStorage
                localStorage.setItem(`${platform}_auth`, JSON.stringify(auth));
                setAuthStatus('authenticated');
                onAuthSuccess(auth);
            }
            // If auth is null, it means we're being redirected to OAuth
            // The callback will handle the rest

        } catch (error) {
            setAuthStatus('error');
            onAuthError(error.message);
        } finally {
            setIsAuthenticating(false);
        }
    };

    const handleDisconnect = () => {
        localStorage.removeItem(`${platform}_auth`);
        setAuthStatus('none');
    };

    const getPlatformIcon = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram':
                return '📷';
            case 'youtube':
                return '📺';
            case 'twitter':
                return '🐦';
            default:
                return '🔗';
        }
    };

    const getPlatformColor = (platform: string) => {
        switch (platform.toLowerCase()) {
            case 'instagram':
                return 'bg-gradient-to-r from-purple-500 to-pink-500';
            case 'youtube':
                return 'bg-gradient-to-r from-red-500 to-red-600';
            case 'twitter':
                return 'bg-gradient-to-r from-blue-400 to-blue-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                    <span className="text-2xl mr-2">{getPlatformIcon(platform)}</span>
                    <h3 className="font-semibold capitalize">{platform}</h3>
                </div>
                <div className="flex items-center space-x-2">
                    {authStatus === 'authenticated' && (
                        <span className="text-green-600 text-sm font-medium">✓ Connected</span>
                    )}
                    {authStatus === 'authenticating' && (
                        <span className="text-blue-600 text-sm font-medium">🔄 Connecting...</span>
                    )}
                    {authStatus === 'error' && (
                        <span className="text-red-600 text-sm font-medium">❌ Error</span>
                    )}
                </div>
            </div>

            {authStatus === 'none' && (
                <button
                    onClick={handleAuthenticate}
                    disabled={isAuthenticating}
                    className={`w-full py-2 px-4 rounded-md text-white font-medium transition-colors ${
                        isAuthenticating 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : `${getPlatformColor(platform)} hover:opacity-90`
                    }`}
                >
                    {isAuthenticating ? 'Connecting...' : `Connect to ${platform}`}
                </button>
            )}

            {authStatus === 'authenticated' && (
                <div className="space-y-2">
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                        <p className="text-green-800 text-sm">
                            ✓ Successfully connected to {platform}. You can now upload videos automatically.
                        </p>
                    </div>
                    <button
                        onClick={handleDisconnect}
                        className="w-full py-2 px-4 rounded-md border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                    >
                        Disconnect
                    </button>
                </div>
            )}

            {authStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-red-800 text-sm">
                        ❌ Failed to connect to {platform}. Please try again.
                    </p>
                    <button
                        onClick={handleAuthenticate}
                        className="mt-2 w-full py-2 px-4 rounded-md bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                    >
                        Try Again
                    </button>
                </div>
            )}
        </div>
    );
} 