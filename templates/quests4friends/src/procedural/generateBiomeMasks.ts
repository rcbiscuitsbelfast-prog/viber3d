/**
 * Biome Mask Generation
 * Derives terrain type masks from heightmap
 */

import { Heightmap, BiomeMasks } from './types';

/**
 * Calculate slope from heightmap
 */
function calculateSlope(heightmap: Heightmap, x: number, y: number): number {
  const { data, size } = heightmap;
  
  if (x <= 0 || x >= size - 1 || y <= 0 || y >= size - 1) {
    return 0;
  }
  
  const hL = data[(x - 1) + y * size];
  const hR = data[(x + 1) + y * size];
  const hD = data[x + (y - 1) * size];
  const hU = data[x + (y + 1) * size];
  
  const dx = (hR - hL) / 2;
  const dy = (hU - hD) / 2;
  
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate all biome masks from heightmap
 */
export function generateBiomeMasks(heightmap: Heightmap, waterLevel: number = 0.3): BiomeMasks {
  const { data, size } = heightmap;
  
  const water = new Float32Array(size * size);
  const slope = new Float32Array(size * size);
  const forest = new Float32Array(size * size);
  const grass = new Float32Array(size * size);
  const cliff = new Float32Array(size * size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = x + y * size;
      const height = data[idx];
      const slopeValue = calculateSlope(heightmap, x, y);
      
      // Water mask: below water level
      water[idx] = height < waterLevel ? 1 : 0;
      
      // Slope mask: flat areas (inverse of slope)
      const slopeFlatness = Math.max(0, 1 - slopeValue * 10);
      slope[idx] = slopeFlatness;
      
      // Cliff mask: steep areas
      cliff[idx] = slopeValue > 0.15 ? 1 : 0;
      
      // Forest mask: mid-elevation, not too steep
      const forestHeight = height > waterLevel + 0.1 && height < 0.8;
      const forestSlope = slopeValue < 0.12;
      forest[idx] = (forestHeight && forestSlope) ? 1 : 0;
      
      // Grass mask: low-mid elevation, flat
      const grassHeight = height > waterLevel + 0.05 && height < 0.6;
      const grassSlope = slopeValue < 0.08;
      grass[idx] = (grassHeight && grassSlope) ? 1 : 0;
    }
  }
  
  // Smooth masks with simple box blur
  smoothMask(forest, size, 2);
  smoothMask(grass, size, 1);
  
  return {
    water,
    slope,
    forest,
    grass,
    cliff,
    size,
  };
}

/**
 * Smooth mask using box blur
 */
function smoothMask(mask: Float32Array, size: number, radius: number): void {
  const temp = new Float32Array(mask.length);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let sum = 0;
      let count = 0;
      
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          
          if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
            sum += mask[nx + ny * size];
            count++;
          }
        }
      }
      
      temp[x + y * size] = sum / count;
    }
  }
  
  // Copy back
  mask.set(temp);
}

/**
 * Sample mask at specific coordinates
 */
export function sampleMask(mask: Float32Array, size: number, x: number, y: number): number {
  x = Math.max(0, Math.min(size - 1, Math.floor(x)));
  y = Math.max(0, Math.min(size - 1, Math.floor(y)));
  return mask[x + y * size];
}
