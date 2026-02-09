/**
 * ColorPaletteBoard.tsx
 * Display extracted color palette as clickable blocks
 */

import React, { useState } from 'react';
import { ExtractedColor } from '../modules/character-customizer/types';

interface ColorPaletteBoardProps {
  colors: ExtractedColor[];
  onColorClick: (colorIndex: number) => void;
  selectedColorIndex?: number | null;
  maxColorsDisplayed?: number;
}

export default function ColorPaletteBoard({
  colors,
  onColorClick,
  selectedColorIndex,
  maxColorsDisplayed = 12,
}: ColorPaletteBoardProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displayedColors = colors.slice(0, maxColorsDisplayed);
  const hasMore = colors.length > maxColorsDisplayed;

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">Extracted Colors</h3>
      
      <div className="grid grid-cols-4 gap-2 mb-2">
        {displayedColors.map((color, index) => (
          <button
            key={index}
            onClick={() => onColorClick(index)}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`
              relative group focus:outline-none transition-all duration-200
              ${
                selectedColorIndex === index
                  ? 'ring-2 ring-blue-400 scale-105'
                  : 'hover:scale-110 hover:shadow-lg'
              }
            `}
          >
            <div
              className="w-full aspect-square rounded-lg border-2 border-gray-700 shadow-md"
              style={{ backgroundColor: color.hex }}
            />

            {/* Hover tooltip */}
            {(hoveredIndex === index || selectedColorIndex === index) && (
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap pointer-events-none shadow-lg z-50 border border-gray-700">
                <div className="font-mono">{color.hex}</div>
                <div className="text-gray-400">{color.pixelCount.toLocaleString()} px</div>
                <div className="text-gray-500">{color.percentage.toFixed(1)}%</div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Info text */}
      <div className="text-xs text-gray-400 mt-2">
        {hasMore ? (
          <p>Showing {displayedColors.length} of {colors.length} colors</p>
        ) : (
          <p>Total {colors.length} unique colors found</p>
        )}
      </div>

      {/* Usage instructions */}
      <div className="mt-3 p-2 bg-gray-700/50 rounded text-xs text-gray-300">
        <p className="mb-1">💡 Click a color to select it for recoloring</p>
      </div>
    </div>
  );
}
