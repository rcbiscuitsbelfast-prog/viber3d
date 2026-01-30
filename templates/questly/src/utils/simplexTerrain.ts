// Simplex Noise Terrain Generator
// Uses simplex-noise library for professional-grade procedural terrain

import { createNoise2D } from 'simplex-noise';
import * as THREE from 'three';

export type NoiseType = 'standard' | 'smooth' | 'rocky' | 'ridged' | 'turbulent';

export interface TerrainConfig {
  size: number;
  scale: number;
  seed: number;
  octaves: number;
  persistence: number;
  lacunarity: number;
  islandRadius: number;
  heightScale: number;
  roughness: number;
  isSquareTerrain?: boolean; // If true, no island falloff - square terrain
  noiseType?: NoiseType; // Type of noise pattern to use
}

export interface TerrainData {
  heights: Float32Array;
  colors: THREE.Color[];
  size: number;
}

/**
 * Generate terrain heightmap using Simplex Noise
 */
export function generateSimplexTerrain(config: TerrainConfig): TerrainData {
  const {
    size,
    scale,
    seed,
    octaves = 4,
    persistence = 0.5,
    lacunarity = 2.0,
    islandRadius,
    heightScale,
    roughness,
  } = config;

  // Create noise function with seed
  const noise2D = createNoise2D(() => seed);
  
  const heights = new Float32Array((size + 1) * (size + 1));
  const colors: THREE.Color[] = [];
  
  const centerX = size / 2;
  const centerZ = size / 2;
  const roughnessFactor = roughness / 50;
  
  for (let z = 0; z <= size; z++) {
    for (let x = 0; x <= size; x++) {
      const idx = x + z * (size + 1);
      
      // Normalized coordinates (0-1)
      const nx = x / size;
      const nz = z / size;
      
      // World coordinates
      const worldX = (nx - 0.5) * scale;
      const worldZ = (nz - 0.5) * scale;
      
      // Distance from center
      const centerX_norm = nx - 0.5;
      const centerZ_norm = nz - 0.5;
      const distanceFromCenter = Math.sqrt(centerX_norm * centerX_norm + centerZ_norm * centerZ_norm);
      
      // Fractal Brownian Motion (FBM) for natural terrain
      // Apply different noise types for variation
      const noiseType = config.noiseType || 'standard';
      let noiseValue = 0;
      let amplitude = 1;
      let frequency = 0.01;
      let maxValue = 0;
      
      if (noiseType === 'smooth') {
        // Smooth: gentler, rolling hills - lower frequency, higher persistence
        frequency = 0.005;
        amplitude = 1;
        for (let i = 0; i < octaves; i++) {
          const n = noise2D(worldX * frequency, worldZ * frequency);
          noiseValue += n * amplitude;
          maxValue += amplitude;
          amplitude *= Math.min(persistence * 1.2, 0.9); // Higher persistence for smoother
          frequency *= lacunarity * 0.9; // Slower frequency increase
        }
      } else if (noiseType === 'rocky') {
        // Rocky: sharper peaks and valleys - use absolute value for ridges
        frequency = 0.015;
        amplitude = 1;
        for (let i = 0; i < octaves; i++) {
          const n = noise2D(worldX * frequency, worldZ * frequency);
          // Use absolute value for sharper peaks
          const sharpness = i < 2 ? Math.abs(n) : n;
          noiseValue += sharpness * amplitude;
          maxValue += amplitude;
          amplitude *= persistence * 0.8; // Lower persistence for sharper contrast
          frequency *= lacunarity * 1.2; // Faster frequency increase
        }
      } else if (noiseType === 'ridged') {
        // Ridged: valley/ridge patterns - invert and use absolute
        frequency = 0.01;
        amplitude = 1;
        for (let i = 0; i < octaves; i++) {
          const n = noise2D(worldX * frequency, worldZ * frequency);
          // Create ridges by inverting and using absolute value
          const ridged = 1 - Math.abs(n);
          noiseValue += ridged * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= lacunarity;
        }
      } else if (noiseType === 'turbulent') {
        // Turbulent: chaotic, varied terrain - multiple noise layers with different scales
        frequency = 0.01;
        amplitude = 1;
        for (let i = 0; i < octaves; i++) {
          const n1 = noise2D(worldX * frequency, worldZ * frequency);
          const n2 = noise2D(worldX * frequency * 1.7, worldZ * frequency * 1.3);
          const n3 = noise2D(worldX * frequency * 0.5, worldZ * frequency * 0.7);
          // Combine multiple noise layers for turbulence
          const turbulent = (n1 + n2 * 0.5 + n3 * 0.3) / 1.8;
          noiseValue += turbulent * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= lacunarity * 1.1;
        }
      } else {
        // Standard: default FBM
        for (let i = 0; i < octaves; i++) {
          noiseValue += noise2D(worldX * frequency, worldZ * frequency) * amplitude;
          maxValue += amplitude;
          amplitude *= persistence;
          frequency *= lacunarity;
        }
      }
      
      // Normalize noise value
      noiseValue = noiseValue / maxValue;
      
      // Coast noise for irregular edges
      const coastNoise1 = noise2D((nx + seed * 0.001) * 8, nz * 8) * 0.15 * roughnessFactor;
      const coastNoise2 = noise2D(nx * 12 + seed * 0.001, nz * 8) * 0.1 * roughnessFactor;
      const coastNoise3 = noise2D(nx * 10, (nz + seed * 0.001) * 15) * 0.08 * roughnessFactor;
      
      const angle = Math.atan2(centerZ_norm, centerX_norm);
      const radialNoise = noise2D(Math.cos(angle) * 6 + seed * 0.001, Math.sin(angle) * 4) * 0.12 * roughnessFactor;
      
      // Island falloff (skip if square terrain)
      const isSquareTerrain = config.isSquareTerrain ?? false;
      let islandFalloff = 1.0; // Default to no falloff for square terrain
      let edgeFalloff = 1.0; // For square terrain - hills on edges
      
      if (!isSquareTerrain) {
        const baseRadius = islandRadius / 100;
        const irregularRadius = baseRadius + coastNoise1 + coastNoise2 + coastNoise3 + radialNoise;
        islandFalloff = Math.max(0, 1 - (distanceFromCenter / irregularRadius));
      } else {
        // Square terrain: hills on edges, flat in middle
        // Distance from edge (0 = center, 0.5 = edge)
        const edgeDistanceX = Math.abs(nx - 0.5) * 2; // 0 at center, 1 at edge
        const edgeDistanceZ = Math.abs(nz - 0.5) * 2; // 0 at center, 1 at edge
        const maxEdgeDistance = Math.max(edgeDistanceX, edgeDistanceZ); // Use max to create square pattern
        
        // Create hills on edges: smooth transition from flat center to hilly edges
        // Edge falloff: 0.0 at center (flat), 1.0 at edges (hills)
        // Use stronger curve for more pronounced hills on edges
        edgeFalloff = Math.pow(maxEdgeDistance, 0.5); // Stronger curve, hills start appearing at ~20% from edge
      }
      
      // Cliff detection (only for island terrain)
      const cliffMask = noise2D((nx + seed * 0.0001) * 20, nz * 20);
      const cliffThreshold = 0.85 - (roughness / 200);
      const hasCliff = !isSquareTerrain && cliffMask > cliffThreshold && distanceFromCenter > (islandRadius / 100) * 0.7 && distanceFromCenter < (islandRadius / 100) * 1.2;
      
      // Calculate height
      let height: number;
      if (!isSquareTerrain && islandFalloff < 0.1) {
        // Water edge - smooth transition (only for island)
        height = islandFalloff * 10 - 2;
      } else if (hasCliff) {
        // Cliff areas (only for island)
        height = -1;
      } else if (isSquareTerrain) {
        // Square terrain: flat center with hills on edges
        // Base height is flat (around 2), add hills on edges using edgeFalloff
        const baseHeight = 2.0; // Flat center
        // Increased multiplier (0.3 -> 0.8) and stronger edgeFalloff for taller hills on edges
        const hillHeight = noiseValue * edgeFalloff * heightScale * 0.8; // Hills only on edges - much taller
        height = baseHeight + hillHeight;
      } else {
        // Main terrain - combine noise with falloff (falloff is 1.0 for square terrain)
        height = (noiseValue * islandFalloff * heightScale * 0.5) + 2;
      }
      
      heights[idx] = height;
      
      // Color based on height
      let color: THREE.Color;
      if (height < 0.5) {
        // Sand/beach
        color = new THREE.Color('#d4a574');
      } else if (height < 3) {
        // Light green - low grass
        color = new THREE.Color('#90c850');
      } else if (height < 6) {
        // Medium green - mid grass
        color = new THREE.Color('#6ba84f');
      } else if (height < 10) {
        // Dark green - high grass
        color = new THREE.Color('#4a7c3f');
      } else if (height < 15) {
        // Darker green - forest
        color = new THREE.Color('#2d5a27');
      } else {
        // Darkest green - mountain peaks
        color = new THREE.Color('#1a3d1a');
      }
      
      colors.push(color);
    }
  }
  
  return {
    heights,
    colors,
    size: size + 1,
  };
}

/**
 * Sample height at specific world coordinates (with bilinear interpolation)
 */
export function sampleTerrainHeight(
  terrainData: TerrainData,
  worldX: number,
  worldZ: number,
  scale: number
): number {
  const { heights, size } = terrainData;
  
  // Convert world coordinates to normalized (0-1)
  const nx = (worldX / scale) + 0.5;
  const nz = (worldZ / scale) + 0.5;
  
  // Clamp to valid range
  if (nx < 0 || nx > 1 || nz < 0 || nz > 1) {
    return -10; // Below water
  }
  
  // Convert to grid coordinates
  const gridX = nx * (size - 1);
  const gridZ = nz * (size - 1);
  
  const x0 = Math.floor(gridX);
  const z0 = Math.floor(gridZ);
  const x1 = Math.min(x0 + 1, size - 1);
  const z1 = Math.min(z0 + 1, size - 1);
  
  // Bilinear interpolation
  const fx = gridX - x0;
  const fz = gridZ - z0;
  
  const h00 = heights[x0 + z0 * size];
  const h10 = heights[x1 + z0 * size];
  const h01 = heights[x0 + z1 * size];
  const h11 = heights[x1 + z1 * size];
  
  const h0 = h00 * (1 - fx) + h10 * fx;
  const h1 = h01 * (1 - fx) + h11 * fx;
  
  return h0 * (1 - fz) + h1 * fz;
}
