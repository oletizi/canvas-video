import React, { useState, useEffect, useCallback } from 'react';
import { PixelConfigManager } from '@/video/pixel-config-manager';

interface PixelConfig {
  id: string;
  name: string;
  version: string;
  created: string;
  modified: string;
  pixelCount: number;
  needsMigration: boolean;
}

interface PixelConfigSelectorProps {
  selectedConfigId: string | null;
  onConfigSelect: (configId: string | null) => void;
  disabled?: boolean;
}

export default function PixelConfigSelector({ 
  selectedConfigId, 
  onConfigSelect, 
  disabled = false 
}: PixelConfigSelectorProps) {
  const [availableConfigs, setAvailableConfigs] = useState<PixelConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const configs = await PixelConfigManager.listConfigFiles();
      setAvailableConfigs(configs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configurations';
      setError(errorMessage);
      console.error('Error loading pixel configurations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleConfigChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    onConfigSelect(value === '' ? null : value);
  };

  const formatConfigOption = (config: PixelConfig) => {
    const migrationWarning = config.needsMigration ? ' ⚠️' : '';
    const date = new Date(config.modified).toLocaleDateString();
    return `${config.name}${migrationWarning} (${config.pixelCount} pixels, ${date})`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span className="text-sm text-gray-600">Loading pixel configs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <span className="text-sm text-red-600">Error: {error}</span>
        <button
          onClick={loadConfigs}
          className="text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Pixel Configuration:
        </label>
        <button
          onClick={loadConfigs}
          disabled={disabled}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded disabled:opacity-50"
          title="Refresh configurations"
        >
          ↻ Refresh
        </button>
      </div>
      
      <select
        value={selectedConfigId || ''}
        onChange={handleConfigChange}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <option value="">Select a pixel configuration...</option>
        {availableConfigs.map((config) => (
          <option key={config.id} value={config.id}>
            {formatConfigOption(config)}
          </option>
        ))}
      </select>
      
      {availableConfigs.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No pixel configurations found. Create some in the{' '}
          <a 
            href="/pixel-editor" 
            className="text-blue-600 hover:text-blue-800 underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Pixel Editor
          </a>
          .
        </p>
      )}
      
      {selectedConfigId && (
        <div className="text-xs text-gray-600">
          <span className="font-medium">Selected:</span>{' '}
          {availableConfigs.find(c => c.id === selectedConfigId)?.name || selectedConfigId}
        </div>
      )}
      
      {availableConfigs.some(c => c.needsMigration) && (
        <div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
          ⚠️ Some configurations need migration. They will be automatically updated when loaded.
        </div>
      )}
    </div>
  );
}