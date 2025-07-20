import React, { useEffect, useRef, useState } from 'react';
import type { PixelAnimationConfig } from '@/video/pixel-config-types';

interface PixelPreviewProps {
  config: PixelAnimationConfig;
  isPlaying: boolean;
}

export default function PixelPreview({ config, isPlaying }: PixelPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const [audioLevel, setAudioLevel] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { pixelCols, pixelRows } = config.canvas;
    
    // Calculate pixel dimensions to match the actual canvas aspect ratio
    const canvasAspectRatio = config.canvas.width / config.canvas.height;
    const displayAspectRatio = canvas.width / canvas.height;
    
    let cellWidth = canvas.width / pixelCols;
    let cellHeight = canvas.height / pixelRows;
    
    // Adjust cell dimensions to maintain pixel aspect ratio
    const targetPixelAspectRatio = canvasAspectRatio / (pixelCols / pixelRows);
    const currentPixelAspectRatio = cellWidth / cellHeight;
    
    if (Math.abs(targetPixelAspectRatio - currentPixelAspectRatio) > 0.01) {
      if (targetPixelAspectRatio > currentPixelAspectRatio) {
        cellWidth = cellHeight * targetPixelAspectRatio;
      } else {
        cellHeight = cellWidth / targetPixelAspectRatio;
      }
    }

    // Clear canvas
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = '#333333';
    ctx.lineWidth = 1;
    
    for (let x = 0; x <= pixelCols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellWidth, 0);
      ctx.lineTo(x * cellWidth, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= pixelRows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellHeight);
      ctx.lineTo(canvas.width, y * cellHeight);
      ctx.stroke();
    }

    // Draw initial frame pixels
    config.initialFrame.pixels.forEach(pixel => {
      const x = pixel.x * cellWidth;
      const y = pixel.y * cellHeight;
      
      ctx.fillStyle = pixel.color;
      ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
    });

    // Draw audio-reactive pixels if playing
    if (isPlaying && config.audioReactive?.dynamicPixels) {
      config.audioReactive.dynamicPixels.forEach(dynamicPixel => {
        try {
          // Create a safe evaluation context
          const level = audioLevel;
          const colorFunction = new Function('level', `return \`${dynamicPixel.colorFunction}\``);
          const color = colorFunction(level);
          
          const x = dynamicPixel.x * cellWidth;
          const y = dynamicPixel.y * cellHeight;
          
          ctx.fillStyle = color;
          ctx.fillRect(x + 1, y + 1, cellWidth - 2, cellHeight - 2);
        } catch (error) {
          console.warn('Error evaluating dynamic pixel color function:', error);
        }
      });
    }
  }, [config, audioLevel, isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      // Simulate audio level changes
      const updateAudioLevel = () => {
        setAudioLevel(Math.random() * 0.8 + 0.1); // Random value between 0.1 and 0.9
        animationRef.current = requestAnimationFrame(updateAudioLevel);
      };
      animationRef.current = requestAnimationFrame(updateAudioLevel);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAudioLevel(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const canvasAspectRatio = config.canvas.width / config.canvas.height;
  const previewWidth = 320;
  const previewHeight = Math.round(previewWidth / canvasAspectRatio);

  return (
    <canvas
      ref={canvasRef}
      width={previewWidth}
      height={previewHeight}
      className="border border-gray-300 rounded bg-black"
      style={{ imageRendering: 'pixelated' }}
    />
  );
}