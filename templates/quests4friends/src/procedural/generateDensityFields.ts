/**
 * Density Field Generation
 * Combines multiple masks multiplicatively for object placement
 */

import { BiomeMasks, DensityField } from './types';

/**
 * Create a circular playable area mask (avoids cluttering center)
 */
function createPlayableMask(size: number, centerRadius: number): Float32Array {
  const mask = new Float32Array(size * size);
  const centerX = size / 2;
  const centerY = size / 2;
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - centerX;
      const dy = y - centerY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const normalized = distance / centerRadius;
      
      // Inside center = 0 (no objects), outside = 1 (objects allowed)
      mask[x + y * size] = normalized > 1 ? 1 : 0;
    }
  }
  
  return mask;
}

/**
 * Add noise variation to density field
 */
function addNoise(density: Float32Array, size: number, seed: number, intensity: number = 0.3): void {
  const random = (x: number, y: number) => {
    let h = seed + x * 374761393 + y * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    h = h ^ (h >>> 16);
    return ((h >>> 0) / 0xffffffff) * intensity;
  };
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = x + y * size;
      const noise = random(x, y);
      density[idx] = Math.max(0, Math.min(1, density[idx] + noise));
    }
  }
}

/**
 * Generate density fields for different object types
 */
export function generateDensityFields(
  biomeMasks: BiomeMasks,
  seed: number = 12345
): Map<string, DensityField> {
  const { size, water, slope, forest, grass } = biomeMasks;
  const fields = new Map<string, DensityField>();
  
  // Create playable mask (no objects in center)
  const playableMask = createPlayableMask(size, size * 0.15);
  
  // Tree density: forest areas, not too steep, not water, not center
  const treeDensity = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    treeDensity[i] = forest[i] * slope[i] * (1 - water[i]) * playableMask[i];
  }
  addNoise(treeDensity, size, seed, 0.2);
  fields.set('tree', { data: treeDensity, size });
  
  // Rock density: varied elevation, moderate slopes
  const rockDensity = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    const moderateSlope = slope[i] > 0.3 ? 0.5 : slope[i];
    rockDensity[i] = moderateSlope * (1 - water[i]) * playableMask[i] * 0.3;
  }
  addNoise(rockDensity, size, seed + 1, 0.4);
  fields.set('rock', { data: rockDensity, size });
  
  // Bush density: grass areas, flat, not water
  const bushDensity = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    bushDensity[i] = grass[i] * slope[i] * (1 - water[i]) * playableMask[i] * 0.6;
  }
  addNoise(bushDensity, size, seed + 2, 0.3);
  fields.set('bush', { data: bushDensity, size });
  
  // Grass patch density: open grass areas
  const grassPatchDensity = new Float32Array(size * size);
  for (let i = 0; i < size * size; i++) {
    grassPatchDensity[i] = grass[i] * slope[i] * (1 - water[i]) * 0.4;
  }
  addNoise(grassPatchDensity, size, seed + 3, 0.5);
  fields.set('grass', { data: grassPatchDensity, size });
  
  return fields;
}

/**
 * Sample density at specific coordinates
 */
export function sampleDensity(field: DensityField, x: number, y: number): number {
  const { data, size } = field;
  x = Math.max(0, Math.min(size - 1, Math.floor(x)));
  y = Math.max(0, Math.min(size - 1, Math.floor(y)));
  return data[x + y * size];
}
