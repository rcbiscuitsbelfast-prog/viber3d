/**
 * Object Placement System
 * Density-based procedural object distribution
 */

import { PlacedObject, DensityField, Heightmap, PlacementConfig } from './types';
import { sampleHeightmap } from './generateHeightmap';
import { sampleDensity } from './generateDensityFields';

/**
 * Pseudorandom number generator for consistent placement
 */
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

/**
 * Place objects using Poisson disk sampling variant
 */
export function placeObjects(
  densityField: DensityField,
  heightmap: Heightmap,
  config: PlacementConfig,
  worldSize: number = 100,
  seed: number = 12345
): PlacedObject[] {
  const objects: PlacedObject[] = [];
  const random = new SeededRandom(seed);
  const { size } = densityField;
  
  // Grid cell size for spatial distribution
  const cellSize = 2; // meters
  const gridRes = Math.ceil(worldSize / cellSize);
  const grid: boolean[][] = Array.from({ length: gridRes }, () => Array(gridRes).fill(false));
  
  // Sample points based on density
  const sampleRate = config.density;
  const samplesPerCell = Math.ceil(sampleRate * 2);
  
  for (let sy = 0; sy < gridRes; sy++) {
    for (let sx = 0; sx < gridRes; sx++) {
      // Try multiple samples per cell
      for (let attempt = 0; attempt < samplesPerCell; attempt++) {
        // Random position within cell
        const wx = (sx + random.next()) * cellSize - worldSize / 2;
        const wz = (sy + random.next()) * cellSize - worldSize / 2;
        
        // Convert to heightmap coordinates
        const hx = ((wx + worldSize / 2) / worldSize) * size;
        const hz = ((wz + worldSize / 2) / worldSize) * size;
        
        // Check if within bounds
        if (hx < 0 || hx >= size || hz < 0 || hz >= size) continue;
        
        // Sample density
        const density = sampleDensity(densityField, hx, hz);
        
        // Probabilistic placement based on density
        if (random.next() > density) continue;
        
        // Get height
        const height = sampleHeightmap(heightmap, hx, hz);
        
        // Check water
        if (config.avoidWater && height < 0.3) continue;
        
        // Apply jitter
        const jitterX = (random.next() - 0.5) * config.jitter;
        const jitterZ = (random.next() - 0.5) * config.jitter;
        
        const finalX = wx + jitterX;
        const finalZ = wz + jitterZ;
        
        // Scale height to world units
        const finalY = height * 10; // Assume 10m max height
        
        // Random rotation
        const rotation = random.next() * Math.PI * 2;
        
        // Random scale
        const [minScale, maxScale] = config.scaleRange;
        const scale = minScale + random.next() * (maxScale - minScale);
        
        objects.push({
          type: config.type,
          position: [finalX, finalY, finalZ],
          rotation,
          scale,
        });
        
        // Mark grid cell as occupied
        grid[sy][sx] = true;
        break; // Only one object per cell
      }
    }
  }
  
  return objects;
}

/**
 * Place all object types
 */
export function placeAllObjects(
  densityFields: Map<string, DensityField>,
  heightmap: Heightmap,
  worldSize: number = 100,
  seed: number = 12345
): PlacedObject[] {
  const allObjects: PlacedObject[] = [];
  
  // Trees
  const treeField = densityFields.get('tree');
  if (treeField) {
    const trees = placeObjects(
      treeField,
      heightmap,
      {
        type: 'tree',
        density: 1.5,
        minSlope: 0,
        maxSlope: 0.2,
        avoidWater: true,
        jitter: 1.0,
        scaleRange: [0.8, 1.4],
      },
      worldSize,
      seed
    );
    allObjects.push(...trees);
  }
  
  // Rocks
  const rockField = densityFields.get('rock');
  if (rockField) {
    const rocks = placeObjects(
      rockField,
      heightmap,
      {
        type: 'rock',
        density: 0.8,
        minSlope: 0,
        maxSlope: 0.3,
        avoidWater: true,
        jitter: 0.8,
        scaleRange: [0.6, 1.2],
      },
      worldSize,
      seed + 1000
    );
    allObjects.push(...rocks);
  }
  
  // Bushes
  const bushField = densityFields.get('bush');
  if (bushField) {
    const bushes = placeObjects(
      bushField,
      heightmap,
      {
        type: 'bush',
        density: 1.0,
        minSlope: 0,
        maxSlope: 0.15,
        avoidWater: true,
        jitter: 0.6,
        scaleRange: [0.7, 1.1],
      },
      worldSize,
      seed + 2000
    );
    allObjects.push(...bushes);
  }
  
  // Grass patches
  const grassField = densityFields.get('grass');
  if (grassField) {
    const grassPatches = placeObjects(
      grassField,
      heightmap,
      {
        type: 'grass',
        density: 2.0,
        minSlope: 0,
        maxSlope: 0.1,
        avoidWater: true,
        jitter: 0.4,
        scaleRange: [0.8, 1.3],
      },
      worldSize,
      seed + 3000
    );
    allObjects.push(...grassPatches);
  }
  
  console.log(`[ProceduralIsland] Placed ${allObjects.length} objects`);
  
  return allObjects;
}
