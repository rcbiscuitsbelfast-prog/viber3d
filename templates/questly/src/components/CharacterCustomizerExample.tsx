/**
 * CharacterCustomizerExample.tsx
 * Complete working example of the KayKit Character Customizer system
 */

import React, { useState } from 'react';
import CharacterCustomizer from '@/components/CharacterCustomizer';
import CharacterSelector, { CHARACTER_OPTIONS } from '@/components/CharacterSelector';
import { CharacterPresets } from '@/modules/character-customizer/CharacterPresets';
import { SavedCharacterVariant } from '@/modules/character-customizer/types';

interface SavedVariant {
  id: string;
  name: string;
  baseModel: string;
}

export default function CharacterCustomizerExample() {
  const [selectedCharacter, setSelectedCharacter] = useState('rogue');
  const [customizingCharacter, setCustomizingCharacter] = useState<string | null>(null);
  const [savedVariants, setSavedVariants] = useState<SavedVariant[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load saved variants on mount
  React.useEffect(() => {
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
  };

  const handleCustomizeClick = () => {
    setCustomizingCharacter(selectedCharacter);
  };

  const handleCustomizerSave = async (variantId: string, name: string) => {
    setSavedVariants([
      ...savedVariants,
      {
        id: variantId,
        name,
        baseModel: selectedCharacter,
      },
    ]);
    setCustomizingCharacter(null);
    showMessage('success', `✓ Character "${name}" saved successfully!`);
  };

  const handleLoadVariant = async (variantId: string) => {
    try {
      const variant = await CharacterPresets.loadVariant(variantId);
      if (!variant) throw new Error('Variant not found');

      showMessage('success', `Loaded variant: ${variant.name}`);
      // You could load this in a preview or editor here
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

  const handleCancelCustomizer = () => {
    setCustomizingCharacter(null);
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const selectedCharacterOption = CHARACTER_OPTIONS.find((c) => c.id === selectedCharacter);
  const isCustomizing = customizingCharacter !== null;
  const selectedCharacterStatus = CHARACTER_OPTIONS.find((c) => c.id === customizingCharacter);

  if (isCustomizing && selectedCharacterStatus) {
    // Full screen customizer
    return (
      <div className="fixed inset-0 bg-gray-900/95 z-50">
        <CharacterCustomizer
          characterPath={selectedCharacterStatus.modelPath}
          characterName={selectedCharacterStatus.name}
          onSave={handleCustomizerSave}
          onCancel={handleCancelCustomizer}
          canvasWidth={800}
          canvasHeight={600}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-white mb-2">Character Customizer</h1>
          <p className="text-gray-300">Create and customize your unique character variants</p>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`max-w-7xl mx-auto px-4 mt-4 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-900/50 border border-green-600 text-green-200'
              : 'bg-red-900/50 border border-red-600 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Character Selection */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">Select Character</h2>
              <CharacterSelector
                selectedCharacter={selectedCharacter}
                onSelectCharacter={handleCharacterSelect}
                className="mb-4"
              />
              <p className="text-sm text-gray-400 mb-4">
                {selectedCharacterOption?.description}
              </p>
              <button
                onClick={handleCustomizeClick}
                className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition transform hover:scale-105"
              >
                🎨 Customize {selectedCharacterOption?.name}
              </button>
            </div>

            {/* Storage Info */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold text-white mb-3">Storage</h3>
              <p className="text-sm text-gray-300 mb-2">
                <span className="font-semibold">{savedVariants.length}</span> variant
                {savedVariants.length !== 1 ? 's' : ''} saved
              </p>
              {savedVariants.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="w-full px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 rounded text-sm font-semibold transition"
                >
                  Clear All Variants
                </button>
              )}
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Saved Variants */}
            <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Saved Variants</h2>
                {loadingVariants && (
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500" />
                )}
              </div>

              {savedVariants.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👻</div>
                  <p className="text-gray-400 text-lg">No saved variants yet</p>
                  <p className="text-gray-500 text-sm mt-2">
                    Select a character above and click "Customize" to create your first variant!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedVariants.map((variant) => (
                    <div
                      key={variant.id}
                      className="bg-gray-700/50 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white">{variant.name}</h3>
                          <p className="text-xs text-gray-400 capitalize">
                            Based on: {variant.baseModel}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleLoadVariant(variant.id)}
                          className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded font-semibold transition"
                        >
                          📂 Load
                        </button>
                        <button
                          onClick={() => handleDeleteVariant(variant.id)}
                          className="flex-1 px-3 py-2 bg-red-900/50 hover:bg-red-900 text-red-300 text-sm rounded font-semibold transition"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Features */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <div className="text-3xl mb-2">🎨</div>
                <h3 className="font-semibold text-white mb-2">Real-time Recoloring</h3>
                <p className="text-sm text-gray-400">
                  Instantly modify character colors with an interactive color wheel
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <div className="text-3xl mb-2">💾</div>
                <h3 className="font-semibold text-white mb-2">Save & Load</h3>
                <p className="text-sm text-gray-400">
                  Store your custom variants and load them anytime
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg shadow-xl p-6 border border-gray-700">
                <div className="text-3xl mb-2">🚀</div>
                <h3 className="font-semibold text-white mb-2">Browser Native</h3>
                <p className="text-sm text-gray-400">
                  Fast, offline-capable customization with no external dependencies
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
