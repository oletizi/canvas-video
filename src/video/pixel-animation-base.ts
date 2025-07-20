import type { SongAnimation } from '@/video/song-animation';
import type { Song } from '@/song/song';
import type { VuMeter } from '@/ts/audio/vu-meter';
import { Canvas, Rect } from 'fabric';
import { Pixels } from '@/video/pixels';
import { PixelConfigManager } from '@/video/pixel-config-manager';
import type { PixelAnimationConfig, PixelData } from '@/video/pixel-config-types';
import { scale } from '@/lib/lib-core';

export abstract class PixelAnimationBase implements SongAnimation {
  protected readonly pixels: Pixels;
  protected readonly vu: VuMeter;
  protected config: PixelAnimationConfig;
  private background?: Rect;

  constructor(song: Song, fps: number, config: PixelAnimationConfig) {
    this.config = config;
    this.vu = song.newVuMeter(0.1, 0.3, fps);
    this.pixels = new Pixels(config.canvas.pixelCols, config.canvas.pixelRows);
  }

  setup(c: Canvas): void {
    this.setupBackground(c);
    this.pixels.setup(c);
    this.applyInitialFrame();
    this.setupAdditionalElements(c);
  }

  protected setupBackground(c: Canvas): void {
    this.background = new Rect({
      width: c.width,
      height: c.height,
      fill: 'black'
    });
    c.add(this.background);
  }

  protected applyInitialFrame(): void {
    this.config.initialFrame.pixels.forEach(pixel => {
      this.setPixel(pixel.x, pixel.y, pixel.color);
    });
  }

  protected setPixel(x: number, y: number, color: string): void {
    if (x >= 0 && x < this.config.canvas.pixelCols && 
        y >= 0 && y < this.config.canvas.pixelRows) {
      this.pixels.set(x, y, color);
    }
  }

  protected applyPixelFrame(pixels: PixelData[]): void {
    pixels.forEach(pixel => {
      this.setPixel(pixel.x, pixel.y, pixel.color);
    });
  }

  protected processAudioReactivePixels(): void {
    if (!this.config.audioReactive?.dynamicPixels) return;

    const level = this.vu.getValue();
    
    this.config.audioReactive.dynamicPixels.forEach(dynamicPixel => {
      try {
        const colorFunction = new Function('level', `return \`${dynamicPixel.colorFunction}\``);
        const color = colorFunction(level);
        this.setPixel(dynamicPixel.x, dynamicPixel.y, color);
      } catch (error) {
        console.warn('Error evaluating dynamic pixel color function:', error);
      }
    });
  }

  draw(c: Canvas): void {
    this.processAudioReactivePixels();
    this.updateAnimation(c);
    this.pixels.draw(c);
  }

  protected abstract setupAdditionalElements(c: Canvas): void;
  protected abstract updateAnimation(c: Canvas): void;

  updateConfig(newConfig: PixelAnimationConfig): void {
    const validation = PixelConfigManager.validateConfig(newConfig);
    if (!validation.isValid) {
      throw new Error(`Invalid config: ${validation.errors.join(', ')}`);
    }
    this.config = newConfig;
  }

  getConfig(): PixelAnimationConfig {
    return { ...this.config };
  }

  exportConfig(): string {
    return PixelConfigManager.saveConfig(this.config);
  }

  protected interpolateColor(color1: string, color2: string, factor: number): string {
    if (factor <= 0) return color1;
    if (factor >= 1) return color2;

    const c1 = this.parseColor(color1);
    const c2 = this.parseColor(color2);
    
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    
    return `rgb(${r}, ${g}, ${b})`;
  }

  private parseColor(color: string): { r: number; g: number; b: number } {
    if (color.startsWith('#')) {
      const hex = color.slice(1);
      return {
        r: parseInt(hex.substr(0, 2), 16),
        g: parseInt(hex.substr(2, 2), 16),
        b: parseInt(hex.substr(4, 2), 16)
      };
    } else if (color.startsWith('rgb(')) {
      const matches = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (matches) {
        return {
          r: parseInt(matches[1]),
          g: parseInt(matches[2]),
          b: parseInt(matches[3])
        };
      }
    }
    
    // Default to white if parsing fails
    return { r: 255, g: 255, b: 255 };
  }
}