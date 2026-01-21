/**
 * Procedural Island Generation Types
 * Fully isolated from existing game systems
 */

export interface HeightmapConfig {
  size: number;          // Grid resolution (e.g. 128x128)
  scale: number;         // Noise scale (larger = smoother)
  octaves: number;       // Fractal detail layers
  persistence: number;   // Amplitude falloff per octave
  lacunarity: number;    // Frequency increase per octave
  waterLevel: number;    // Height below which is water
  islandRadius: number;  // Falloff radius for island shape
  seed: number;          // Random seed
}

export interface Heightmap {
  data: Float32Array;    // Flattened 2D array [x + y * size]
  size: number;
  min: number;
  max: number;
}

export interface BiomeMasks {
  water: Float32Array;   // 0-1, where 1 = water
  slope: Float32Array;   // 0-1, where 1 = flat
  forest: Float32Array;  // 0-1, forest coverage
  grass: Float32Array;   // 0-1, grass coverage
  cliff: Float32Array;   // 0-1, cliff/steep areas
  size: number;
}

export interface DensityField {
  data: Float32Array;
  size: number;
}

export interface PlacementConfig {
  type: 'tree' | 'rock' | 'bush' | 'grass';
  density: number;       // Base density multiplier
  minSlope: number;      // Min slope to place
  maxSlope: number;      // Max slope to place
  avoidWater: boolean;   // Don't place in water
  jitter: number;        // Random position offset
  scaleRange: [number, number]; // Random scale range
}

export interface PlacedObject {
  type: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

export interface ProceduralWorld {
  heightmap: Heightmap;
  biomeMasks: BiomeMasks;
  densityFields: Map<string, DensityField>;
  objects: PlacedObject[];
  config: HeightmapConfig;
}

export interface TerrainMeshData {
  positions: Float32Array;
  normals: Float32Array;
  uvs: Float32Array;
  colors: Float32Array;
  indices: Uint32Array;
}
