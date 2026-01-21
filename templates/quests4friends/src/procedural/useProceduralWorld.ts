/**
 * Procedural World Generation Hook
 * Orchestrates the complete generation pipeline
 */

import { useMemo } from 'react';
import { ProceduralWorld, HeightmapConfig } from './types';
import { generateHeightmap } from './generateHeightmap';
import { generateBiomeMasks } from './generateBiomeMasks';
import { generateDensityFields } from './generateDensityFields';
import { placeAllObjects } from './placeObjects';

/**
 * Default heightmap configuration
 */
const DEFAULT_CONFIG: HeightmapConfig = {
  size: 1024,          // 1024x1024 grid (ultra high detail - seamless)
  scale: 48,           // Noise scale for varied features
  octaves: 10,         // Maximum detail layers
  persistence: 0.55,   // Amplitude falloff
  lacunarity: 2.1,     // Frequency increase
  waterLevel: 0.25,    // Water threshold
  islandRadius: 200,   // Massive island
  seed: 42,            // Random seed
};

/**
 * Generate complete procedural world
 */
export function useProceduralWorld(
  config: Partial<HeightmapConfig> = {},
  worldSize: number = 100
): ProceduralWorld {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  const world = useMemo(() => {
    console.log('[ProceduralIsland] Starting generation...');
    const startTime = performance.now();
    
    // Step 1: Generate heightmap
    console.log('[ProceduralIsland] Generating heightmap...');
    const heightmap = generateHeightmap(fullConfig);
    
    // Step 2: Generate biome masks
    console.log('[ProceduralIsland] Generating biome masks...');
    const biomeMasks = generateBiomeMasks(heightmap, fullConfig.waterLevel);
    
    // Step 3: Generate density fields
    console.log('[ProceduralIsland] Generating density fields...');
    const densityFields = generateDensityFields(biomeMasks, fullConfig.seed);
    
    // Step 4: Place objects
    console.log('[ProceduralIsland] Placing objects...');
    const objects = placeAllObjects(densityFields, heightmap, worldSize, fullConfig.seed);
    
    const elapsed = performance.now() - startTime;
    console.log(`[ProceduralIsland] Generation complete in ${elapsed.toFixed(2)}ms`);
    console.log(`[ProceduralIsland] Objects placed: ${objects.length}`);
    
    return {
      heightmap,
      biomeMasks,
      densityFields,
      objects,
      config: fullConfig,
    };
  }, [
    fullConfig.seed, 
    fullConfig.size, 
    fullConfig.scale, 
    fullConfig.octaves,
    fullConfig.persistence,
    fullConfig.lacunarity,
    fullConfig.waterLevel,
    fullConfig.islandRadius,
    worldSize
  ]);
  
  return world;
}
