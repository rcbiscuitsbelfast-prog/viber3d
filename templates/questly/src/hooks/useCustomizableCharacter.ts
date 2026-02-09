/**
 * useCustomizableCharacter.ts
 * React hook for managing character customization workflow
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { TextureExtractor } from '../modules/character-customizer/TextureExtractor';
import { ColorReplacement } from '../modules/character-customizer/ColorReplacement';
import { ModelCloner } from '../modules/character-customizer/ModelCloner';
import { CharacterPresets } from '../modules/character-customizer/CharacterPresets';
import { resolveAssetPath } from '../lib/paths';
import {
  ExtractedColor,
  CustomizerState,
  RGB,
  ColorSwap,
  SavedCharacterVariant,
} from '../modules/character-customizer/types';

interface UseCustomizableCharacterProps {
  characterPath: string;
  onColorSwap?: (original: RGB, replacement: RGB) => void;
  onError?: (error: string) => void;
}

interface UseCustomizableCharacterReturn {
  model: THREE.Group | null;
  materials: THREE.Material[];
  colorPalette: ExtractedColor[];
  selectedColorIndex: number | null;
  colorSwaps: ColorSwap[];
  selectColor: (index: number) => void;
  replaceColor: (original: RGB, replacement: RGB, tolerance?: number) => Promise<void>;
  undoLastChange: () => void;
  loadVariant: (variantId: string) => Promise<void>;
  saveVariant: (name: string, tags?: string[]) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

export function useCustomizableCharacter({
  characterPath,
  onColorSwap,
  onError,
}: UseCustomizableCharacterProps): UseCustomizableCharacterReturn {
  const [state, setState] = useState<CustomizerState>({
    model: null,
    materials: [],
    originalTextures: new Map(),
    currentCanvas: null,
    colorPalette: [],
    selectedColorIndex: null,
    colorSwaps: [],
    isLoading: true,
    error: null,
  });

  const historyRef = useRef<CustomizerState[]>([]);
  const targetTextureRef = useRef<THREE.Texture | null>(null);

  // Load character model
  useEffect(() => {
    const loadCharacter = async () => {
      console.log('[useCustomizableCharacter] Starting load, characterPath:', characterPath);
      
      if (!characterPath) {
        console.log('[useCustomizableCharacter] No characterPath provided, skipping load');
        setState((prev) => ({ ...prev, isLoading: false, error: null }));
        return;
      }
      
      try {
        setState((prev) => ({ ...prev, isLoading: true, error: null }));

        // Resolve asset path with BASE_URL for correct path on localhost and GitHub Pages
        const resolvedPath = resolveAssetPath(characterPath);
        console.log('[useCustomizableCharacter] Resolved path:', resolvedPath);

        // Load GLTF
        console.log('[useCustomizableCharacter] Loading GLTF from:', resolvedPath);
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          const loader = new GLTFLoader();
          loader.load(
            resolvedPath,
            resolve,
            undefined,
            (error) => {
              reject(new Error(`Failed to load model from ${resolvedPath}: ${error.message || error}`));
            }
          );
        });

        console.log('[useCustomizableCharacter] GLTF loaded successfully');
        
        // Clone model
        const cloned = ModelCloner.cloneGltfModel(gltf);
        console.log('[useCustomizableCharacter] Model cloned, materials:', cloned.materials.length);

        // Extract colors from texture
        let colorPalette: ExtractedColor[] = [];
        let currentCanvas: HTMLCanvasElement | null = null;

        if (cloned.materials.length > 0) {
          const texturedMaterial = cloned.materials.find(
            (material) => 'map' in material && Boolean(material.map)
          );

          if (texturedMaterial && 'map' in texturedMaterial && texturedMaterial.map) {
            targetTextureRef.current = texturedMaterial.map;
            console.log('[useCustomizableCharacter] Extracting colors from texture...');
            try {
              const extraction = await TextureExtractor.extractColors(
                texturedMaterial.map,
                'smart',
                15,
                5
              );
              colorPalette = extraction.colors;
              console.log('[useCustomizableCharacter] Extracted', colorPalette.length, 'colors');

              // Create working canvas
              currentCanvas = extraction.canvasData.canvas as HTMLCanvasElement;
              if (!currentCanvas) {
                currentCanvas = document.createElement('canvas');
                currentCanvas.width = extraction.textureWidth;
                currentCanvas.height = extraction.textureHeight;
                const ctx = currentCanvas.getContext('2d')!;
                ctx.putImageData(extraction.canvasData, 0, 0);
              }
            } catch (extractionError) {
              console.warn('[useCustomizableCharacter] Color extraction failed:', extractionError);
            }
          }
        }

        console.log('[useCustomizableCharacter] Character loaded successfully, setting state');
        
        setState({
          model: cloned.scene,
          materials: cloned.materials,
          originalTextures: cloned.originalTextures,
          currentCanvas,
          colorPalette,
          selectedColorIndex: colorPalette.length > 0 ? 0 : null,
          colorSwaps: [],
          isLoading: false,
          error: null,
        });

        // Save to history
        historyRef.current = [state];
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load character';
        console.error('[useCustomizableCharacter] Error:', errorMessage, error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: errorMessage,
        }));
        onError?.(errorMessage);
      }
    };

    loadCharacter();
  }, [characterPath]);

  const selectColor = useCallback((index: number) => {
    setState((prev) => ({ ...prev, selectedColorIndex: index }));
  }, []);

  const replaceColor = useCallback(
    async (original: RGB, replacement: RGB, tolerance: number = 20) => {
      if (!state.currentCanvas) {
        throw new Error('No canvas available');
      }

      try {
        // Save to history
        historyRef.current.push({ ...state });

        // Replace color on canvas
        const result = ColorReplacement.replaceColor(state.currentCanvas, original, replacement, {
          tolerance,
        });

        // Update materials with new texture (only for the targeted texture)
        let updatedTexture: THREE.Texture | null = null;
        for (const material of state.materials) {
          if ('map' in material && material.map && targetTextureRef.current) {
            if (material.map.uuid !== targetTextureRef.current.uuid) continue;
          }

          if ('map' in material && material.map) {
            updatedTexture = ColorReplacement.updateMaterialTexture(
              material,
              result.updatedCanvas
            );
          }
        }

        if (updatedTexture) {
          targetTextureRef.current = updatedTexture;
        }

        // Update state
        setState((prev) => {
          const updatedPalette = prev.colorPalette.map((color, index) => {
            if (index !== prev.selectedColorIndex) return color;
            return {
              ...color,
              rgb: replacement,
              rgba: [replacement[0], replacement[1], replacement[2], 255],
              hex: `#${((1 << 24) + (replacement[0] << 16) + (replacement[1] << 8) + replacement[2])
                .toString(16)
                .slice(1)
                .toUpperCase()}`,
            };
          });

          return {
            ...prev,
            currentCanvas: result.updatedCanvas,
            colorPalette: updatedPalette,
            colorSwaps: [
              ...prev.colorSwaps,
              { original, replacement, tolerance, label: undefined },
            ],
          };
        });

        onColorSwap?.(original, replacement);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Color replacement failed';
        setState((prev) => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
      }
    },
    [state, onColorSwap, onError]
  );

  const undoLastChange = useCallback(() => {
    if (historyRef.current.length > 1) {
      historyRef.current.pop();
      const previousState = historyRef.current[historyRef.current.length - 1];
      setState(previousState);

      // Re-apply materials
      if (previousState.currentCanvas) {
        let updatedTexture: THREE.Texture | null = null;
        for (const material of previousState.materials) {
          if ('map' in material && material.map && targetTextureRef.current) {
            if (material.map.uuid !== targetTextureRef.current.uuid) continue;
          }

          if ('map' in material && material.map) {
            updatedTexture = ColorReplacement.updateMaterialTexture(
              material,
              previousState.currentCanvas
            );
          }
        }

        if (updatedTexture) {
          targetTextureRef.current = updatedTexture;
        }
      }
    }
  }, []);

  const saveVariant = useCallback(
    async (name: string, tags: string[] = []): Promise<string> => {
      if (!state.currentCanvas || !state.model) {
        throw new Error('Character not loaded');
      }

      try {
        // Export canvas to PNG data URL
        const textureDataUrl = state.currentCanvas.toDataURL('image/png');

        // Extract base model name from path
        const baseModel = characterPath.includes('Rogue')
          ? 'rogue'
          : characterPath.includes('Knight')
            ? 'knight'
            : characterPath.includes('Ranger')
              ? 'ranger'
              : characterPath.includes('Mage')
                ? 'mage'
                : characterPath.includes('Barbarian')
                  ? 'barbarian'
                  : 'rogue';

        const variant: Omit<SavedCharacterVariant, 'id'> = {
          name,
          baseModel: baseModel as any,
          baseModelPath: characterPath,
          textureDataUrl,
          colorSwaps: state.colorSwaps,
          metadata: {
            version: '1.0',
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
            tags,
          },
        };

        const variantId = await CharacterPresets.saveVariant(variant);
        return variantId;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to save variant';
        setState((prev) => ({ ...prev, error: errorMessage }));
        onError?.(errorMessage);
        throw error;
      }
    },
    [state, characterPath, onError]
  );

  const loadVariant = useCallback(
    async (variantId: string) => {
      try {
        setState((prev) => ({ ...prev, isLoading: true }));

        const variant = await CharacterPresets.loadVariant(variantId);
        if (!variant) {
          throw new Error('Variant not found');
        }

        if (!state.currentCanvas) {
          throw new Error('Canvas not initialized');
        }

        // Load texture from data URL
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = variant.textureDataUrl;
        });

        const canvas = state.currentCanvas;
        const ctx = canvas.getContext('2d')!;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        // Update materials
        for (const material of state.materials) {
          ColorReplacement.updateMaterialTexture(material, canvas);
        }

        setState((prev) => ({
          ...prev,
          currentCanvas: canvas,
          colorSwaps: variant.colorSwaps,
          isLoading: false,
        }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load variant';
        setState((prev) => ({ ...prev, error: errorMessage, isLoading: false }));
        onError?.(errorMessage);
      }
    },
    [state, onError]
  );

  return {
    model: state.model,
    materials: state.materials,
    colorPalette: state.colorPalette,
    selectedColorIndex: state.selectedColorIndex,
    colorSwaps: state.colorSwaps,
    selectColor,
    replaceColor,
    undoLastChange,
    loadVariant,
    saveVariant,
    isLoading: state.isLoading,
    error: state.error,
  };
}
