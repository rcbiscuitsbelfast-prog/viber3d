/**
 * WorldConfig - Type definitions for world configuration
 * Used for save/load system in Phase 4.1
 */

export interface BuildingArea {
  id: number;
  x: number;
  z: number;
  radius: number;
  height: number;
  minimized: boolean;
}

export interface QuestMarker {
  id: number;
  position: [number, number, number];
  label: string;
  type: 'quest' | 'npc' | 'location';
}

export interface NPCData {
  id: string;
  name: string;
  position: [number, number, number];
  waypoints: [number, number, number][];
  characterModelPath?: string;
}

export interface ManualAsset {
  id: string;
  type: 'tree' | 'rock' | 'grass' | 'bush';
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant?: number;
  treeType?: 'pine' | 'broad' | 'bushy';
}

export interface ProceduralAsset {
  pos: [number, number, number];
  scale?: number;
}

export interface ProceduralAssets {
  trees: ProceduralAsset[];
  rocks: ProceduralAsset[];
}

/**
 * Complete world configuration that can be saved/loaded
 */
export interface WorldConfig {
  // Version for future compatibility
  version: string;
  
  // Terrain settings
  roughness: number;
  islandSize: number;
  terrainDetail: number;
  seed: number;
  heightScale: number;
  waterLevel: number;
  cliffIntensity: number;
  
  // Asset controls
  treeAmount: number;
  treeSize: number;
  grassAmount: number;
  grassSize: number;
  terrainGrassCoverage: number;
  buildingGrassFalloff: number;
  rockAmount: number;
  rockSize: number;
  bushAmount: number;
  bushSize: number;
  treeHeightOffset: number;
  grassHeightOffset: number;
  rockHeightOffset: number;
  bushHeightOffset: number;
  slopeAdjustmentIntensity: number;
  
  // Building areas
  buildingAreas: BuildingArea[];
  nextAreaId: number;
  
  // Manual and procedural assets
  manualAssets: ManualAsset[];
  proceduralAssets: ProceduralAssets;
  
  // NPCs and quest markers
  questMarkers: QuestMarker[];
  npcs: NPCData[];
  
  // Ocean and skybox settings
  timeOfDay: number;
  waveStrength: number;
  waveSpeed: number;
  oceanTransparency: number;
  sunIntensity: number;
  enableDynamicSky: boolean;
  oceanSize: number;
  rippleScale: number;
  fogHeight: number;
  bubbleScale: number;
  bubbleDensity: number;
  bubbleSpeed: number;
  
  // Metadata
  timestamp: string;
  name?: string;
  description?: string;
}
