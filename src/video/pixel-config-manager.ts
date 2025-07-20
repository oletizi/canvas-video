import type { PixelAnimationConfig, PixelConfigValidationResult, PixelData, PixelFrame } from './pixel-config-types';

export class PixelConfigManager {
  private static configs = new Map<string, PixelAnimationConfig>();

  static async loadConfig(configPath: string): Promise<PixelAnimationConfig> {
    try {
      const response = await fetch(configPath);
      if (!response.ok) {
        throw new Error(`Failed to load config: ${response.statusText}`);
      }
      const config = await response.json() as PixelAnimationConfig;
      const validation = this.validateConfig(config);
      
      if (!validation.isValid) {
        throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
      }

      this.configs.set(config.id, config);
      return config;
    } catch (error) {
      console.error('Error loading pixel config:', error);
      throw error;
    }
  }

  static loadConfigSync(config: PixelAnimationConfig): PixelAnimationConfig {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }

    this.configs.set(config.id, config);
    return config;
  }

  static getConfig(id: string): PixelAnimationConfig | undefined {
    return this.configs.get(id);
  }

  static saveConfig(config: PixelAnimationConfig): string {
    const validation = this.validateConfig(config);
    
    if (!validation.isValid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }

    config.metadata.modified = new Date().toISOString();
    this.configs.set(config.id, config);
    
    return JSON.stringify(config, null, 2);
  }

  static validateConfig(config: any): PixelConfigValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.id) errors.push('Config must have an id');
    if (!config.name) errors.push('Config must have a name');
    if (!config.version) errors.push('Config must have a version');
    
    if (!config.canvas) {
      errors.push('Config must have canvas configuration');
    } else {
      if (!config.canvas.pixelCols || config.canvas.pixelCols <= 0) {
        errors.push('Canvas pixelCols must be a positive number');
      }
      if (!config.canvas.pixelRows || config.canvas.pixelRows <= 0) {
        errors.push('Canvas pixelRows must be a positive number');
      }
    }

    if (!config.initialFrame) {
      errors.push('Config must have an initialFrame');
    } else if (!Array.isArray(config.initialFrame.pixels)) {
      errors.push('initialFrame.pixels must be an array');
    } else {
      config.initialFrame.pixels.forEach((pixel: any, index: number) => {
        if (typeof pixel.x !== 'number' || typeof pixel.y !== 'number') {
          errors.push(`Pixel ${index}: x and y must be numbers`);
        }
        if (typeof pixel.color !== 'string') {
          errors.push(`Pixel ${index}: color must be a string`);
        }
        if (config.canvas && (
          pixel.x >= config.canvas.pixelCols || 
          pixel.y >= config.canvas.pixelRows ||
          pixel.x < 0 || 
          pixel.y < 0
        )) {
          warnings.push(`Pixel ${index}: coordinates (${pixel.x}, ${pixel.y}) are outside canvas bounds`);
        }
      });
    }

    if (config.keyframes && !Array.isArray(config.keyframes)) {
      errors.push('keyframes must be an array if provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static createDefaultConfig(id: string, name: string): PixelAnimationConfig {
    return {
      id,
      name,
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString()
      },
      canvas: {
        width: 1920,
        height: 1080,
        pixelCols: 32,
        pixelRows: 18
      },
      initialFrame: {
        name: 'Default Frame',
        pixels: []
      }
    };
  }

  static migrateFromLegacyConfig(legacyConfig: { initialPixels: Array<{ x: number; y: number; color: string }> }): PixelAnimationConfig {
    return {
      id: 'migrated-config',
      name: 'Migrated Configuration',
      version: '1.0.0',
      metadata: {
        created: new Date().toISOString(),
        modified: new Date().toISOString(),
        tags: ['migrated']
      },
      canvas: {
        width: 800,
        height: 600,
        pixelCols: 16,
        pixelRows: 16
      },
      initialFrame: {
        name: 'Migrated Frame',
        description: 'Migrated from legacy configuration',
        pixels: legacyConfig.initialPixels
      }
    };
  }
}