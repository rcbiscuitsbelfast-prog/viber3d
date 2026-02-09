/**
 * Shared types for KayKit Character Customizer system
 */

import * as THREE from 'three';

export type RGB = [number, number, number];
export type RGBA = [number, number, number, number];

export interface ExtractedColor {
  hex: string;
  rgb: RGB;
  rgba: RGBA;
  pixelCount: number;
  indexInPalette: number;
  percentage: number;
}

export interface TextureExtractionResult {
  colors: ExtractedColor[];
  canvasData: ImageData;
  textureWidth: number;
  textureHeight: number;
  totalPixels: number;
  uniqueColorCount: number;
}

export interface ColorSwap {
  original: RGB;
  replacement: RGB;
  tolerance?: number;
  label?: string;
}

export interface ColorReplacementOptions {
  tolerance?: number; // 0-255, default 20
  preserveAlpha?: boolean;
  affectAlpha?: boolean;
}

export interface ColorReplacementResult {
  updatedCanvas: HTMLCanvasElement;
  pixelsModified: number;
  originalPixels: ImageData;
}

export interface ClonedModel {
  scene: THREE.Group;
  materials: THREE.Material[];
  originalTextures: Map<string, THREE.Texture>;
  skeleton: THREE.Skeleton | null;
  metadata: {
    textureAtlas: string | null;
    boneCount: number;
    meshCount: number;
  };
}

export interface SavedCharacterVariant {
  id: string;
  name: string;
  baseModel: 'rogue' | 'knight' | 'ranger' | 'mage' | 'barbarian';
  baseModelPath: string;
  textureDataUrl: string;
  colorSwaps: ColorSwap[];
  metadata: {
    version: string;
    createdAt: string;
    modifiedAt: string;
    author?: string;
    description?: string;
    tags: string[];
  };
}

export interface CustomizerState {
  model: THREE.Group | null;
  materials: THREE.Material[];
  originalTextures: Map<string, THREE.Texture>;
  currentCanvas: HTMLCanvasElement | null;
  colorPalette: ExtractedColor[];
  selectedColorIndex: number | null;
  colorSwaps: ColorSwap[];
  isLoading: boolean;
  error: string | null;
}
