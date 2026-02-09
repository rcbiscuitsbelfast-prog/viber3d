/**
 * ColorPickerWheel.tsx
 * Interactive HSL color wheel for selecting new colors
 */

import React, { useRef, useEffect, useState } from 'react';
import { RGB } from '../modules/character-customizer/types';

interface ColorPickerWheelProps {
  initialColor?: RGB;
  onColorChange: (rgb: RGB) => void;
  size?: number;
  showHexInput?: boolean;
  onClose?: () => void;
}

export default function ColorPickerWheel({
  initialColor = [100, 100, 200],
  onColorChange,
  size = 300,
  showHexInput = true,
  onClose,
}: ColorPickerWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hexInput, setHexInput] = useState(rgbToHex(initialColor));
  const [isDragging, setIsDragging] = useState(false);
  const [mode, setMode] = useState<'wheel' | 'lightness'>('wheel');

  // Sync hex input when initial color changes
  useEffect(() => {
    setHexInput(rgbToHex(initialColor));
  }, [initialColor]);

  // Draw color wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    // Clear canvas
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, size, size);

    if (mode === 'wheel') {
      // Draw hue wheel
      for (let angle = 0; angle < 360; angle += 1) {
        const startAngle = (angle * Math.PI) / 180;
        const endAngle = ((angle + 1) * Math.PI) / 180;

        // Draw radial gradient for saturation
        for (let r = radius * 0.1; r < radius; r += 2) {
          const ratio = r / radius;
          const hsl = `hsl(${angle}, ${ratio * 100}%, 50%)`;
          ctx.fillStyle = hsl;
          ctx.beginPath();
          ctx.arc(centerX, centerY, r, startAngle, endAngle);
          ctx.fill();
        }
      }

      // Draw white center for lightness selection hint
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Draw border
      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Draw lightness slider (gradient bar)
      const [h, s] = rgbToHsl(initialColor);
      const barWidth = radius * 1.8;
      const barHeight = radius * 0.4;
      const barX = centerX - barWidth / 2;
      const barY = centerY - barHeight / 2;

      for (let x = 0; x < barWidth; x++) {
        const lightness = (x / barWidth) * 100;
        const hsl = `hsl(${h}, ${s}%, ${lightness}%)`;
        ctx.fillStyle = hsl;
        ctx.fillRect(barX + x, barY, 1, barHeight);
      }

      ctx.strokeStyle = '#9ca3af';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barWidth, barHeight);
    }
  }, [size, mode, initialColor]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    if (mode === 'wheel') {
      // Get color from wheel
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      if (distance <= radius) {
        const hue = ((angle * 180) / Math.PI + 360) % 360;
        const saturation = Math.min(100, (distance / radius) * 100);
        const lightness = 50;

        const rgb = hslToRgb([hue, saturation, lightness]);
        onColorChange(rgb);
        setHexInput(rgbToHex(rgb));
      }
    } else {
      // Get color from lightness slider
      const [h, s] = rgbToHsl(initialColor);
      const barWidth = radius * 1.8;
      const barX = centerX - barWidth / 2;
      const relativeX = x - barX;
      const lightness = Math.min(100, Math.max(0, (relativeX / barWidth) * 100));

      const rgb = hslToRgb([h, s, lightness]);
      onColorChange(rgb);
      setHexInput(rgbToHex(rgb));
    }
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    try {
      const rgb = hexToRgb(value);
      onColorChange(rgb);
    } catch (e) {
      // Invalid hex, keep current value
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-semibold">Color Picker</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ✕
          </button>
        )}
      </div>

      <canvas
        ref={canvasRef}
        width={size}
        height={size}
        onClick={handleCanvasClick}
        className="w-full border-2 border-gray-700 rounded cursor-crosshair mb-4"
      />

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('wheel')}
          className={`flex-1 py-2 rounded text-sm font-semibold transition ${
            mode === 'wheel'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Hue
        </button>
        <button
          onClick={() => setMode('lightness')}
          className={`flex-1 py-2 rounded text-sm font-semibold transition ${
            mode === 'lightness'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          Light
        </button>
      </div>

      {showHexInput && (
        <div>
          <label className="block text-sm text-gray-300 mb-2">Hex Color</label>
          <input
            type="text"
            value={hexInput}
            onChange={(e) => handleHexInputChange(e.target.value)}
            placeholder="#FF0000"
            className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      <div className="mt-4 flex gap-2 items-center">
        <div
          className="w-16 h-16 rounded border-2 border-gray-600"
          style={{ backgroundColor: hexInput }}
        />
        <div className="text-sm text-gray-400">
          <p>{hexInput}</p>
          <p className="text-xs text-gray-500">{`RGB(${initialColor[0]}, ${initialColor[1]}, ${initialColor[2]})`}</p>
        </div>
      </div>
    </div>
  );
}

// Utility functions
function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) => {
    const hex = n.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb[0])}${toHex(rgb[1])}${toHex(rgb[2])}`.toUpperCase();
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\\d]{2})([a-f\\d]{2})([a-f\\d]{2})$/i.exec(hex);
  if (!result) throw new Error('Invalid hex color');
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

function rgbToHsl(rgb: RGB): [number, number, number] {
  let r = rgb[0] / 255;
  let g = rgb[1] / 255;
  let b = rgb[2] / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s * 100, l * 100];
}

function hslToRgb(hsl: [number, number, number]): RGB {
  const h = hsl[0] / 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;

  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  return [
    Math.round(r * 255),
    Math.round(g * 255),
    Math.round(b * 255),
  ];
}
