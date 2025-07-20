import React, { useState, useCallback, useEffect } from 'react';
import { PixelConfigManager } from '@/video/pixel-config-manager';
import type { PixelAnimationConfig, PixelData } from '@/video/pixel-config-types';
import PixelPreview from './PixelPreview';

interface PixelGridProps {
  config: PixelAnimationConfig;
  onPixelChange: (x: number, y: number, color: string) => void;
  selectedColor: string;
}

function PixelGrid({ config, onPixelChange, selectedColor }: PixelGridProps) {
  const { pixelCols, pixelRows } = config.canvas;
  
  const getPixelColor = (x: number, y: number): string => {
    const pixel = config.initialFrame.pixels.find(p => p.x === x && p.y === y);
    return pixel?.color || '#808080';
  };

  const handlePixelClick = (x: number, y: number) => {
    onPixelChange(x, y, selectedColor);
  };

  // Calculate pixel aspect ratio based on canvas aspect ratio
  const canvasAspectRatio = config.canvas.width / config.canvas.height;
  const gridAspectRatio = pixelCols / pixelRows;
  const pixelAspectRatio = canvasAspectRatio / gridAspectRatio;

  return (
    <div 
      className="grid gap-0.5 p-3 bg-white rounded-lg shadow-md w-full"
      style={{
        gridTemplateColumns: `repeat(${pixelCols}, minmax(0, 1fr))`,
        aspectRatio: `${config.canvas.width}/${config.canvas.height}`
      }}
    >
      {Array.from({ length: pixelRows }, (_, y) =>
        Array.from({ length: pixelCols }, (_, x) => (
          <button
            key={`${x}-${y}`}
            className="border border-gray-300 hover:border-gray-500 transition-colors w-full"
            style={{ 
              backgroundColor: getPixelColor(x, y),
              aspectRatio: pixelAspectRatio.toString()
            }}
            onClick={() => handlePixelClick(x, y)}
            title={`Pixel (${x}, ${y})`}
          />
        ))
      )}
    </div>
  );
}

interface ColorPickerProps {
  selectedColor: string;
  onColorChange: (color: string) => void;
}

function ColorPicker({ selectedColor, onColorChange }: ColorPickerProps) {
  const presetColors = [
    '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff',
    '#ffff00', '#ff00ff', '#00ffff', '#ff8000', '#8000ff',
    '#808080', '#ff3f00', '#3f3f3f', '#c0c0c0', '#800000',
    '#008000', '#000080', '#808000', '#800080', '#008080'
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3">Color Picker</h3>
      
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Custom Color:</label>
        <input
          type="color"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-12 h-12 border border-gray-300 rounded cursor-pointer"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Hex Value:</label>
        <input
          type="text"
          value={selectedColor}
          onChange={(e) => onColorChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          placeholder="#000000"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Preset Colors:</label>
        <div className="grid grid-cols-5 gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              className={`w-8 h-8 border-2 rounded ${
                selectedColor === color ? 'border-blue-500' : 'border-gray-300'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => onColorChange(color)}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ConfigPanelProps {
  config: PixelAnimationConfig;
  onConfigChange: (config: PixelAnimationConfig) => void;
  onSave: () => void;
  onLoad: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onLoadFromFile: (filename: string) => void;
  onNew: () => void;
  availableConfigs: Array<{
    id: string;
    name: string;
    version: string;
    created: string;
    modified: string;
    pixelCount: number;
    needsMigration: boolean;
  }>;
  onRefreshConfigs: () => void;
}

function ConfigPanel({ config, onConfigChange, onSave, onLoad, onLoadFromFile, onNew, availableConfigs, onRefreshConfigs }: ConfigPanelProps) {
  const updateConfig = (updates: Partial<PixelAnimationConfig>) => {
    onConfigChange({ ...config, ...updates });
  };

  const updateCanvas = (updates: Partial<typeof config.canvas>) => {
    updateConfig({
      canvas: { ...config.canvas, ...updates }
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-3">Configuration</h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Animation Name:</label>
          <input
            type="text"
            value={config.name}
            onChange={(e) => updateConfig({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description:</label>
          <textarea
            value={config.description || ''}
            onChange={(e) => updateConfig({ description: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Grid Presets:</label>
          <select
            onChange={(e) => {
              const [cols, rows] = e.target.value.split('x').map(Number);
              if (cols && rows) {
                updateCanvas({ pixelCols: cols, pixelRows: rows });
              }
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 mb-4"
          >
            <option value="">Select a preset...</option>
            <option value="32x18">32x18 (16:9 Standard)</option>
            <option value="64x36">64x36 (16:9 High)</option>
            <option value="16x16">16x16 (Square)</option>
            <option value="24x24">24x24 (Square)</option>
            <option value="48x27">48x27 (16:9 Ultra)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Grid Columns:</label>
            <input
              type="number"
              min="1"
              max="64"
              value={config.canvas.pixelCols}
              onChange={(e) => updateCanvas({ pixelCols: parseInt(e.target.value) || 32 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Grid Rows:</label>
            <input
              type="number"
              min="1"
              max="64"
              value={config.canvas.pixelRows}
              onChange={(e) => updateCanvas({ pixelRows: parseInt(e.target.value) || 18 })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Saved Configurations:</label>
          <div className="flex gap-2 mb-2">
            <select
              onChange={(e) => e.target.value && onLoadFromFile(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              value=""
            >
              <option value="">Select saved config...</option>
              {availableConfigs.map(config => (
                <option key={config.id} value={config.id}>
                  {config.name} {config.needsMigration && '⚠️'} ({config.pixelCount} pixels)
                </option>
              ))}
            </select>
            <button
              onClick={onRefreshConfigs}
              className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              title="Refresh list"
            >
              ↻
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onNew}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            New Configuration
          </button>
          
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Save to ~/.config/canvas-video/
          </button>
          
          <label className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors cursor-pointer text-center">
            Import from File
            <input
              type="file"
              accept=".json"
              onChange={onLoad}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function PixelEditor() {
  const [config, setConfig] = useState<PixelAnimationConfig>(() =>
    PixelConfigManager.createDefaultConfig('pixel-editor-config', 'New Pixel Animation')
  );
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [availableConfigs, setAvailableConfigs] = useState<Array<{
    id: string;
    name: string;
    version: string;
    created: string;
    modified: string;
    pixelCount: number;
    needsMigration: boolean;
  }>>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handlePixelChange = useCallback((x: number, y: number, color: string) => {
    setConfig(prevConfig => {
      const newPixels = prevConfig.initialFrame.pixels.filter(p => !(p.x === x && p.y === y));
      if (color !== '#808080') { // Don't store default gray color
        newPixels.push({ x, y, color });
      }
      
      return {
        ...prevConfig,
        initialFrame: {
          ...prevConfig.initialFrame,
          pixels: newPixels
        },
        metadata: {
          ...prevConfig.metadata,
          modified: new Date().toISOString()
        }
      };
    });
  }, []);

  const refreshAvailableConfigs = useCallback(async () => {
    try {
      const configs = await PixelConfigManager.listConfigFiles();
      setAvailableConfigs(configs);
    } catch (error) {
      console.error('Error refreshing config list:', error);
    }
  }, []);

  const handleSave = useCallback(async () => {
    setIsLoading(true);
    try {
      const filename = await PixelConfigManager.saveConfigToFile(config);
      await refreshAvailableConfigs();
      alert(`Configuration saved as "${filename}"!`);
    } catch (error) {
      alert(`Error saving configuration: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, [config, refreshAvailableConfigs]);

  const handleLoad = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const configData = JSON.parse(e.target?.result as string);
        const loadedConfig = PixelConfigManager.loadConfigSync(configData);
        setConfig(loadedConfig);
      } catch (error) {
        alert(`Error loading configuration: ${error}`);
      }
    };
    reader.readAsText(file);
  }, []);

  const handleLoadFromFile = useCallback(async (filename: string) => {
    setIsLoading(true);
    try {
      const loadedConfig = await PixelConfigManager.loadConfigFromFile(filename);
      setConfig(loadedConfig);
    } catch (error) {
      alert(`Error loading configuration: ${error}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNew = useCallback(() => {
    setConfig(PixelConfigManager.createDefaultConfig(
      `pixel-config-${Date.now()}`,
      'New Pixel Animation'
    ));
  }, []);

  // Load available configs on component mount
  useEffect(() => {
    refreshAvailableConfigs();
  }, [refreshAvailableConfigs]);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Pixel Animation Editor</h1>
          {isLoading && (
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading...</span>
            </div>
          )}
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Main Grid Editor */}
          <div className="xl:col-span-3">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Pixel Grid ({config.canvas.pixelCols}x{config.canvas.pixelRows})</h2>
              <PixelGrid
                config={config}
                onPixelChange={handlePixelChange}
                selectedColor={selectedColor}
              />
            </div>
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            <ColorPicker
              selectedColor={selectedColor}
              onColorChange={setSelectedColor}
            />
            
            <ConfigPanel
              config={config}
              onConfigChange={setConfig}
              onSave={handleSave}
              onLoad={handleLoad}
              onLoadFromFile={handleLoadFromFile}
              onNew={handleNew}
              availableConfigs={availableConfigs}
              onRefreshConfigs={refreshAvailableConfigs}
            />

            {/* Preview Panel */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Preview</h3>
              <div className="flex flex-col items-center space-y-4">
                <PixelPreview config={config} isPlaying={isPreviewPlaying} />
                <button
                  onClick={() => setIsPreviewPlaying(!isPreviewPlaying)}
                  className={`px-4 py-2 rounded transition-colors ${
                    isPreviewPlaying
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isPreviewPlaying ? 'Stop Preview' : 'Start Preview'}
                </button>
              </div>
            </div>

            {/* Info Panel */}
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-3">Animation Info</h3>
              <div className="text-sm space-y-2">
                <p><strong>ID:</strong> {config.id}</p>
                <p><strong>Version:</strong> {config.version}</p>
                <p><strong>Pixels:</strong> {config.initialFrame.pixels.length}</p>
                <p><strong>Modified:</strong> {config.metadata.modified ? new Date(config.metadata.modified).toLocaleString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}