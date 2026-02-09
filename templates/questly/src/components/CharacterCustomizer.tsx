/**
 * CharacterCustomizer.tsx
 * Main customizer component orchestrating all features
 */

import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import ColorPickerWheel from './ColorPickerWheel';
import ColorPaletteBoard from './ColorPaletteBoard';
import { useCustomizableCharacter } from '../hooks/useCustomizableCharacter';
import { RGB } from '../modules/character-customizer/types';

interface CharacterCustomizerProps {
  characterPath: string;
  characterName: string;
  onSave?: (variantId: string, name: string) => void;
  onCancel?: () => void;
  canvasWidth?: number;
  canvasHeight?: number;
}

interface AnimatedCharacterProps {
  model: THREE.Group | null;
  scale?: number;
}

const AnimatedCharacterPreview = React.forwardRef<THREE.Group, AnimatedCharacterProps>(
  ({ model, scale = 1 }, ref) => {
    const groupRef = useRef<THREE.Group>(null);

    useEffect(() => {
      if (groupRef.current && model) {
        groupRef.current.clear();
        groupRef.current.add(model);
      }
    }, [model]);

    return <group ref={groupRef} scale={scale} />;
  }
);

AnimatedCharacterPreview.displayName = 'AnimatedCharacterPreview';

export default function CharacterCustomizer({
  characterPath,
  characterName,
  onSave,
  onCancel,
  canvasWidth = 800,
  canvasHeight = 600,
}: CharacterCustomizerProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [variantName, setVariantName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const modelRef = useRef<THREE.Group>(null);

  const {
    model,
    colorPalette,
    selectedColorIndex,
    selectColor,
    replaceColor,
    undoLastChange,
    saveVariant,
    isLoading,
    error: customizationError,
  } = useCustomizableCharacter({
    characterPath,
  });

  const handleColorPickerChange = async (newColor: RGB) => {
    if (selectedColorIndex === null || !colorPalette[selectedColorIndex]) return;

    const selectedColor = colorPalette[selectedColorIndex];
    try {
      await replaceColor(selectedColor.rgb, newColor, 20);
    } catch (error) {
      console.error('Color replacement failed:', error);
    }
  };

  const handleSave = async () => {
    if (!variantName.trim()) {
      setSaveError('Please enter a character name');
      return;
    }

    if (variantName.length < 3 || variantName.length > 50) {
      setSaveError('Character name must be 3-50 characters');
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      const variantId = await saveVariant(variantName, [characterName.toLowerCase()]);
      onSave?.(variantId, variantName);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : 'Failed to save character variant'
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 rounded-lg">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4" />
          <p className="text-gray-300">Loading {characterName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">{characterName} Customizer</h2>
          <p className="text-gray-400 text-sm">Customize and save your own character variant</p>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white text-2xl"
            title="Close"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex h-screen max-h-96 gap-4 p-4">
        {/* 3D Preview */}
        <div className="flex-1 bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
          {model ? (
            <Canvas camera={{ position: [0, 1, 2.5], fov: 50 }}>
              <ambientLight intensity={0.6} />
              <directionalLight position={[5, 5, 5]} intensity={0.8} />
              <AnimatedCharacterPreview ref={modelRef} model={model} scale={1.5} />
              <OrbitControls />
              <gridHelper args={[10, 10]} />
            </Canvas>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-400">Failed to load model</p>
            </div>
          )}
        </div>

        {/* Controls Panel */}
        <div className="w-80 flex flex-col gap-4 overflow-y-auto">
          {/* Errors */}
          {(customizationError || saveError) && (
            <div className="bg-red-900/50 border border-red-600 rounded p-3 text-red-200 text-sm">
              {customizationError || saveError}
            </div>
          )}

          {/* Color Palette */}
          {!showColorPicker && (
            <ColorPaletteBoard
              colors={colorPalette}
              onColorClick={(index) => {
                selectColor(index);
                setShowColorPicker(true);
              }}
              selectedColorIndex={selectedColorIndex}
              maxColorsDisplayed={12}
            />
          )}

          {/* Color Picker */}
          {showColorPicker && selectedColorIndex !== null && colorPalette[selectedColorIndex] && (
            <ColorPickerWheel
              initialColor={colorPalette[selectedColorIndex].rgb}
              onColorChange={handleColorPickerChange}
              size={250}
              showHexInput={true}
              onClose={() => setShowColorPicker(false)}
            />
          )}

          {/* Actions */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <button
              onClick={undoLastChange}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition font-semibold text-sm"
            >
              ↶ Undo Last Change
            </button>
            <button
              onClick={() => setShowColorPicker(false)}
              className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition font-semibold text-sm"
            >
              ← Back to Palette
            </button>
          </div>

          {/* Save Form */}
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">
                Character Name
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="e.g., Shadow Rogue"
                className="w-full px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
              <div className="text-xs text-gray-500 mt-1">
                {variantName.length}/50
              </div>
            </div>

            <div className="flex gap-2">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition font-semibold text-sm"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSaving || !variantName.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition font-semibold text-sm"
              >
                {isSaving ? 'Saving...' : 'Save Variant'}
              </button>
            </div>
          </div>

          {/* Info */}
          <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400 space-y-2">
            <p>
              <span className="font-semibold">Unique Colors:</span> {colorPalette.length}
            </p>
            <p className="text-gray-500">
              Save your customized character as a new variant that you can load and edit anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
