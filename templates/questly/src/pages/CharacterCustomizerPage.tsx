/**
 * CharacterCustomizerPage.tsx
 * Dedicated page for character customization
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Save } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CharacterSelector, { CHARACTER_OPTIONS } from '@/components/CharacterSelector';
import ColorPickerWheel from '@/components/ColorPickerWheel';
import ColorPaletteBoard from '@/components/ColorPaletteBoard';
import { useCustomizableCharacter } from '@/hooks/useCustomizableCharacter';
import { CharacterPresets } from '@/modules/character-customizer/CharacterPresets';
import { RGB } from '@/modules/character-customizer/types';
import * as THREE from 'three';

interface SavedVariant {
  id: string;
  name: string;
  baseModel: string;
}

const AnimatedCharacterPreview = ({ model }: { model: THREE.Group | null }) => {
  if (!model) return null;
  
  return (
    <group>
      <primitive object={model.clone()} scale={1.5} position={[0, -1, 0]} />
    </group>
  );
};

export default function CharacterCustomizerPage() {
  const navigate = useNavigate();
  const [selectedCharacter, setSelectedCharacter] = useState('rogue');
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [variantName, setVariantName] = useState('');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const selectedCharacterOption = CHARACTER_OPTIONS.find((c) => c.id === selectedCharacter);
  
  // Log when character changes
  useEffect(() => {
    console.log('[CharacterCustomizerPage] Selected character:', selectedCharacter);
    console.log('[CharacterCustomizerPage] Model path:', selectedCharacterOption?.modelPath);
  }, [selectedCharacter, selectedCharacterOption]);
  
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
    characterPath: selectedCharacterOption?.modelPath || '',
  });

  // Load saved variants on mount
  useEffect(() => {
    loadSavedVariants();
  }, []);

  const loadSavedVariants = async () => {
    try {
      setLoadingVariants(true);
      const variants = await CharacterPresets.getAllVariants();
      setSavedVariants(
        variants.map((v) => ({
          id: v.id,
          name: v.name,
          baseModel: v.baseModel,
        }))
      );
    } catch (error) {
      console.error('Failed to load variants:', error);
      showMessage('error', 'Failed to load saved variants');
    } finally {
      setLoadingVariants(false);
    }
  };

  const handleCharacterSelect = (characterId: string) => {
    setSelectedCharacter(characterId);
    setVariantName('');
  };

  const handleColorPickerChange = async (newColor: RGB) => {
    if (selectedColorIndex === null || !colorPalette[selectedColorIndex]) return;

    const selectedColor = colorPalette[selectedColorIndex];
    try {
      await replaceColor(selectedColor.rgb, newColor, 20);
    } catch (error) {
      console.error('Color replacement failed:', error);
      showMessage('error', 'Failed to apply color change');
    }
  };

  const handleSave = async () => {
    if (!variantName.trim()) {
      showMessage('error', 'Please enter a name for your variant');
      return;
    }

    try {
      setIsSaving(true);
      const variantId = await saveVariant(variantName.trim(), selectedCharacter);
      
      setSavedVariants([
        ...savedVariants,
        {
          id: variantId,
          name: variantName.trim(),
          baseModel: selectedCharacter,
        },
      ]);
      
      setVariantName('');
      showMessage('success', `Variant "${variantName}" saved successfully!`);
    } catch (error) {
      console.error('Save failed:', error);
      showMessage('error', 'Failed to save variant');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadVariant = async (variantId: string) => {
    try {
      const variant = await CharacterPresets.loadVariant(variantId);
      if (!variant) throw new Error('Variant not found');

      const baseModelOption = CHARACTER_OPTIONS.find(c => c.id === variant.baseModel);
      if (baseModelOption) {
        setSelectedCharacter(variant.baseModel);
        showMessage('success', `Loading: ${variant.name}`);
      }
    } catch (error) {
      showMessage('error', 'Failed to load variant');
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Delete this variant permanently?')) return;

    try {
      await CharacterPresets.deleteVariant(variantId);
      setSavedVariants(savedVariants.filter((v) => v.id !== variantId));
      showMessage('success', 'Variant deleted');
    } catch (error) {
      showMessage('error', 'Failed to delete variant');
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Delete ALL saved variants? This cannot be undone.')) return;

    try {
      await CharacterPresets.clearAll();
      setSavedVariants([]);
      showMessage('success', 'All variants cleared');
    } catch (error) {
      showMessage('error', 'Failed to clear variants');
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 pt-20">
      <div className="bg-gradient-to-r from-primary to-primary/80 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-primary-foreground hover:opacity-80 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-semibold">Back to Dashboard</span>
          </button>
          <h1 className="text-4xl font-bold text-primary-foreground mb-2">Character Customizer</h1>
          <p className="text-primary-foreground/90">Create and customize your unique character variants</p>
        </div>
      </div>

      {message && (
        <div className="max-w-7xl mx-auto px-4 mt-4">
          <div
            className={
              message.type === 'success'
                ? 'p-4 rounded-lg bg-green-900/50 border border-green-600 text-green-200'
                : 'p-4 rounded-lg bg-red-900/50 border border-red-600 text-red-200'
            }
          >
            {message.text}
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Character Selection */}
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
              <h2 className="text-xl font-bold text-white mb-4">Select Character</h2>
              <CharacterSelector
                selectedCharacter={selectedCharacter}
                onSelectCharacter={handleCharacterSelect}
                className="mb-4"
              />
              <p className="text-sm text-gray-400 mb-4">
                {selectedCharacterOption?.description}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-white mb-3">Storage</h3>
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold text-primary">{savedVariants.length}</span> variant
                {savedVariants.length !== 1 ? 's' : ''} saved
              </p>
              {savedVariants.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded text-sm font-semibold transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          {/* Center Column - 3D Preview & Color Controls */}
          <div className="lg:col-span-2 space-y-6">
            {/* 3D Model Preview */}
            <div className="bg-gray-800 rounded-lg shadow-xl border border-primary/20 overflow-hidden">
              <div className="p-4 bg-gray-900/50">
                <h2 className="text-xl font-bold text-white">
                  {selectedCharacterOption?.name || 'Character'} Preview
                </h2>
              </div>
              <div className="relative" style={{ height: '500px' }}>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
                      <p className="text-white">Loading model...</p>
                    </div>
                  </div>
                )}
                {customizationError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
                    <div className="text-center text-red-400 p-6">
                      <p className="font-semibold mb-2">Error loading model</p>
                      <p className="text-sm">{customizationError}</p>
                    </div>
                  </div>
                )}
                <Canvas
                  camera={{ position: [0, 1, 3], fov: 50 }}
                  style={{ background: 'linear-gradient(to bottom, #1e293b, #0f172a)' }}
                >
                  <ambientLight intensity={0.7} />
                  <directionalLight position={[5, 5, 5]} intensity={1} />
                  <directionalLight position={[-5, 3, -5]} intensity={0.5} />
                  {model && <AnimatedCharacterPreview model={model} />}
                  <OrbitControls
                    enablePan={false}
                    minDistance={2}
                    maxDistance={8}
                    target={[0, 0.5, 0]}
                  />
                </Canvas>
              </div>
            </div>

            {/* Color Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Color Palette */}
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
                <h3 className="text-lg font-semibold text-white mb-4">Color Palette</h3>
                {colorPalette.length === 0 && !isLoading && (
                  <p className="text-gray-400 text-sm">No colors detected</p>
                )}
                {colorPalette.length > 0 && (
                  <ColorPaletteBoard
                    colors={colorPalette}
                    selectedColorIndex={selectedColorIndex}
                    onColorClick={selectColor}
                  />
                )}
              </div>

              {/* Color Picker */}
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Color Editor</h3>
                  <button
                    onClick={undoLastChange}
                    className="p-2 bg-gray-700 hover:bg-gray-600 text-white rounded transition"
                    title="Undo last change"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
                
                {selectedColorIndex !== null && colorPalette[selectedColorIndex] ? (
                  <div>
                    <button
                      onClick={() => setShowColorPicker(!showColorPicker)}
                      className="w-full px-4 py-2 bg-primary/20 hover:bg-primary/40 text-primary rounded font-semibold transition border border-primary/50 mb-4"
                    >
                      {showColorPicker ? 'Hide' : 'Show'} Color Wheel
                    </button>
                    {showColorPicker && (
                      <div className="flex justify-center">
                        <ColorPickerWheel
                          initialColor={colorPalette[selectedColorIndex].rgb}
                          onColorChange={handleColorPickerChange}
                          size={220}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm text-center py-8">
                    Select a color from the palette to edit
                  </p>
                )}
              </div>
            </div>

            {/* Save Controls */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
              <h3 className="text-lg font-semibold text-white mb-4">Save Variant</h3>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={variantName}
                  onChange={(e) => setVariantName(e.target.value)}
                  placeholder="Enter variant name..."
                  className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-primary"
                  disabled={isSaving || !model}
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving || !variantName.trim() || !model}
                  className="px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            {/* Saved Variants */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-primary/20">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Saved Variants</h2>
                {loadingVariants && (
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                )}
              </div>

              {savedVariants.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400 text-lg">No saved variants yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Customize colors and click Save to create your first variant
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-primary transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{variant.name}</h3>
                          <p className="text-xs text-gray-400 capitalize">
                            Based on: <span className="text-primary font-semibold">{variant.baseModel}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadVariant(variant.id)}
                          className="flex-1 px-3 py-2 bg-primary/20 hover:bg-primary/40 text-primary text-sm rounded font-semibold transition border border-primary/50"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="flex-1 px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded font-semibold transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
