import { Canvas, Circle } from 'fabric';
import type { Song } from '@/song/song';
import { PixelAnimationBase } from '@/video/pixel-animation-base';
import { PixelConfigManager } from '@/video/pixel-config-manager';
import type { PixelAnimationConfig } from '@/video/pixel-config-types';

export class ConfigurablePixelAnimation extends PixelAnimationBase {
  private configId: string;
  private isConfigLoaded = false;
  private loadError: string | null = null;

  constructor(song: Song, fps: number, configId: string) {
    // Create a temporary default config while we load the real one
    const tempConfig = PixelConfigManager.createDefaultConfig('temp', 'Loading...');
    super(song, fps, tempConfig);
    this.configId = configId;
  }

  async loadConfiguration(): Promise<void> {
    try {
      console.log(`ConfigurablePixelAnimation: Loading configuration: ${this.configId}`);
      const loadedConfig = await PixelConfigManager.loadConfigFromFile(this.configId);
      
      console.log(`ConfigurablePixelAnimation: Configuration loaded, updating from ${this.config.canvas.pixelCols}x${this.config.canvas.pixelRows} to ${loadedConfig.canvas.pixelCols}x${loadedConfig.canvas.pixelRows}`);
      
      // Update the configuration
      super.updateConfig(loadedConfig);
      this.isConfigLoaded = true;
      this.loadError = null;
      
      console.log(`ConfigurablePixelAnimation: Successfully loaded configuration: ${loadedConfig.name}`);
    } catch (error) {
      console.error(`ConfigurablePixelAnimation: Failed to load configuration ${this.configId}:`, error);
      this.loadError = error instanceof Error ? error.message : 'Unknown error';
      this.isConfigLoaded = false;
    }
  }

  setup(c: Canvas): void {
    // Always call parent setup first to initialize pixels grid
    super.setup(c);
    
    // If config isn't loaded yet, try to load it
    if (!this.isConfigLoaded && !this.loadError) {
      this.loadConfiguration().then(() => {
        // Re-run setup after config is loaded
        if (this.isConfigLoaded) {
          this.setupAfterConfigLoad(c);
        } else if (this.loadError) {
          this.setupErrorState(c);
        }
      });
      
      // Show loading state (pixels are now initialized)
      this.setupLoadingState(c);
    } else if (this.loadError) {
      // Show error state (pixels are already initialized)
      this.setupErrorState(c);
    }
    // If config is loaded, parent setup already handled everything
  }

  private setupLoadingState(c: Canvas): void {
    // Show loading indicator in center
    const centerX = Math.floor(this.config.canvas.pixelCols / 2);
    const centerY = Math.floor(this.config.canvas.pixelRows / 2);
    
    // Create a simple loading pattern
    this.setPixel(centerX - 1, centerY, '#444444');
    this.setPixel(centerX, centerY, '#666666');
    this.setPixel(centerX + 1, centerY, '#444444');
    this.setPixel(centerX, centerY - 1, '#444444');
    this.setPixel(centerX, centerY + 1, '#444444');
  }

  private setupErrorState(c: Canvas): void {
    this.setupBackground(c);
    
    // Show error indicator in center (red X pattern)
    const centerX = Math.floor(this.config.canvas.pixelCols / 2);
    const centerY = Math.floor(this.config.canvas.pixelRows / 2);
    
    // Create an X pattern to indicate error
    this.setPixel(centerX - 1, centerY - 1, '#ff0000');
    this.setPixel(centerX + 1, centerY + 1, '#ff0000');
    this.setPixel(centerX + 1, centerY - 1, '#ff0000');
    this.setPixel(centerX - 1, centerY + 1, '#ff0000');
    this.setPixel(centerX, centerY, '#ff0000');
  }

  private setupAfterConfigLoad(c: Canvas): void {
    // Update the pixels grid with the new configuration without clearing the canvas
    // The config was already updated in loadConfiguration(), so we just need to
    // recreate our pixels grid and apply the initial frame
    
    console.log(`Configuration loading - Canvas: ${c.width}x${c.height}, Config: ${this.config.canvas.pixelCols}x${this.config.canvas.pixelRows}`);
    
    // Clear and recreate our pixels grid with the new configuration
    this.pixels.clear();
    this.pixels.setup(c);
    
    // Apply the initial frame from the loaded configuration
    this.applyInitialFrame();
    
    console.log(`Configuration loaded and applied: ${this.config.name} (${this.config.canvas.pixelCols}x${this.config.canvas.pixelRows})`);
  }

  protected setupAdditionalElements(c: Canvas): void {
    // No additional elements needed for configurable pixel animations
    // The configuration defines all the pixels
  }

  protected updateAnimation(c: Canvas): void {
    // Only update if config is loaded
    if (!this.isConfigLoaded) {
      // Show animated loading state
      this.updateLoadingAnimation();
      return;
    }

    // Standard audio-reactive behavior from base class handles the rest
  }

  private loadingFrame = 0;
  private updateLoadingAnimation(): void {
    // Simple loading animation - pulse the center pixel
    this.loadingFrame++;
    const centerX = Math.floor(this.config.canvas.pixelCols / 2);
    const centerY = Math.floor(this.config.canvas.pixelRows / 2);
    
    const intensity = Math.floor((Math.sin(this.loadingFrame * 0.2) + 1) * 127);
    const color = `rgb(${intensity}, ${intensity}, ${intensity})`;
    this.setPixel(centerX, centerY, color);
  }

  getConfigurationStatus(): {
    isLoaded: boolean;
    error: string | null;
    configId: string;
    configName?: string;
  } {
    return {
      isLoaded: this.isConfigLoaded,
      error: this.loadError,
      configId: this.configId,
      configName: this.isConfigLoaded ? this.config.name : undefined
    };
  }

  // Method to change configuration at runtime
  async changeConfiguration(newConfigId: string): Promise<void> {
    this.configId = newConfigId;
    this.isConfigLoaded = false;
    this.loadError = null;
    await this.loadConfiguration();
  }
}