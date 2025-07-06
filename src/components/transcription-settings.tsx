import { useState, useEffect } from 'react';
import type { TranscriptionServiceManager } from '@/lib/transcription-services';

interface TranscriptionSettingsProps {
    serviceManager: TranscriptionServiceManager;
    onServiceChange: (serviceName: string) => void;
}

export default function TranscriptionSettings({
    serviceManager,
    onServiceChange
}: TranscriptionSettingsProps) {
    const [showSettings, setShowSettings] = useState(false);
    const [openaiKey, setOpenaiKey] = useState('');
    const [googleKey, setGoogleKey] = useState('');
    const [currentService, setCurrentService] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Load saved API keys
        const savedOpenaiKey = localStorage.getItem('openai_api_key') || '';
        const savedGoogleKey = localStorage.getItem('google_api_key') || '';
        setOpenaiKey(savedOpenaiKey);
        setGoogleKey(savedGoogleKey);
        
        // Set current service
        const service = serviceManager.getCurrentService();
        setCurrentService(service?.name || '');
    }, [serviceManager]);

    const handleSaveApiKey = (service: string, apiKey: string) => {
        setIsLoading(true);
        try {
            serviceManager.setApiKey(service, apiKey);
            const serviceName = service === 'openai' ? 'OpenAI Whisper' : 'Google Cloud Speech-to-Text';
            setCurrentService(serviceName);
            onServiceChange(serviceName);
            console.log(`${serviceName} API key saved successfully`);
        } catch (error) {
            console.error('Error saving API key:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleServiceChange = (serviceName: string) => {
        serviceManager.setCurrentService(serviceName);
        setCurrentService(serviceName);
        onServiceChange(serviceName);
    };

    const availableServices = serviceManager.getAvailableServices();

    return (
        <div className="flex flex-col gap-3 p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">Transcription Service</h3>
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-blue-500 hover:bg-blue-600 text-white"
                >
                    {showSettings ? 'Hide' : 'Settings'}
                </button>
            </div>

            {/* Current Service Display */}
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600">Current:</span>
                <span className="text-xs font-medium text-gray-800">
                    {currentService || 'No service selected'}
                </span>
            </div>

            {/* Service Selection */}
            <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-gray-700">Select Service:</label>
                <select
                    value={currentService}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    {availableServices.map(service => (
                        <option key={service.name} value={service.name}>
                            {service.name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="space-y-4 pt-4 border-t border-gray-200">
                    {/* OpenAI Whisper Settings */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700">OpenAI Whisper API</h4>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                placeholder="Enter OpenAI API key"
                                value={openaiKey}
                                onChange={(e) => setOpenaiKey(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => handleSaveApiKey('openai', openaiKey)}
                                disabled={isLoading || !openaiKey.trim()}
                                className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Get your API key from{' '}
                            <a 
                                href="https://platform.openai.com/api-keys" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                OpenAI Platform
                            </a>
                        </p>
                    </div>

                    {/* Google Cloud Speech Settings */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700">Google Cloud Speech-to-Text</h4>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                placeholder="Enter Google Cloud API key"
                                value={googleKey}
                                onChange={(e) => setGoogleKey(e.target.value)}
                                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <button
                                onClick={() => handleSaveApiKey('google', googleKey)}
                                disabled={isLoading || !googleKey.trim()}
                                className="px-3 py-1 text-xs font-medium rounded-md transition-colors bg-green-500 hover:bg-green-600 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500">
                            Get your API key from{' '}
                            <a 
                                href="https://console.cloud.google.com/apis/credentials" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline"
                            >
                                Google Cloud Console
                            </a>
                        </p>
                    </div>

                    {/* Information */}
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <h5 className="text-xs font-medium text-blue-800 mb-2">How to get API keys:</h5>
                        <div className="space-y-1 text-xs text-blue-700">
                            <p><strong>OpenAI Whisper:</strong> Free tier available, very accurate for music transcription</p>
                            <p><strong>Google Cloud Speech:</strong> Requires billing setup, excellent for multiple languages</p>
                            <p><strong>Sample Lyrics:</strong> Fallback option when no API key is provided</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
} 