export interface PixelData {
  x: number;
  y: number;
  color: string;
}

export interface PixelFrame {
  name?: string;
  description?: string;
  pixels: PixelData[];
}

export interface AnimationKeyframe {
  frame: number;
  pixels: PixelData[];
}

export interface PixelAnimationConfig {
  id: string;
  name: string;
  description?: string;
  version: string;
  metadata: {
    author?: string;
    created?: string;
    modified?: string;
    tags?: string[];
  };
  canvas: {
    width: number;
    height: number;
    pixelCols: number;
    pixelRows: number;
  };
  initialFrame: PixelFrame;
  keyframes?: AnimationKeyframe[];
  audioReactive?: {
    vuMeterConfig?: {
      attack: number;
      release: number;
    };
    dynamicPixels?: {
      x: number;
      y: number;
      colorFunction: string; // e.g., "rgb(${level * 255}, ${level * 255}, ${level * 255})"
    }[];
  };
}

export interface PixelConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}