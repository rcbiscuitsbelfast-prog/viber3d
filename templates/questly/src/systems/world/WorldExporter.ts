/**
 * WorldExporter - Export world configuration to JSON
 * Phase 4.1 - Save/Load System
 */

import { WorldConfig } from './WorldConfig';
import type { BuildingArea, QuestMarker, NPCData, ManualAsset, ProceduralAssets } from './WorldConfig';

export interface WorldState {
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
  
  // Optional metadata
  name?: string;
  description?: string;
}

/**
 * Export world state to WorldConfig JSON
 */
export function exportWorldConfig(state: WorldState): WorldConfig {
  return {
    version: '1.0.0',
    roughness: state.roughness,
    islandSize: state.islandSize,
    terrainDetail: state.terrainDetail,
    seed: state.seed,
    heightScale: state.heightScale,
    waterLevel: state.waterLevel,
    cliffIntensity: state.cliffIntensity,
    treeAmount: state.treeAmount,
    treeSize: state.treeSize,
    grassAmount: state.grassAmount,
    grassSize: state.grassSize,
    terrainGrassCoverage: state.terrainGrassCoverage,
    buildingGrassFalloff: state.buildingGrassFalloff,
    rockAmount: state.rockAmount,
    rockSize: state.rockSize,
    bushAmount: state.bushAmount,
    bushSize: state.bushSize,
    treeHeightOffset: state.treeHeightOffset,
    grassHeightOffset: state.grassHeightOffset,
    rockHeightOffset: state.rockHeightOffset,
    bushHeightOffset: state.bushHeightOffset,
    slopeAdjustmentIntensity: state.slopeAdjustmentIntensity,
    buildingAreas: state.buildingAreas,
    nextAreaId: state.nextAreaId,
    manualAssets: state.manualAssets,
    proceduralAssets: state.proceduralAssets,
    questMarkers: state.questMarkers,
    npcs: state.npcs,
    timeOfDay: state.timeOfDay,
    waveStrength: state.waveStrength,
    waveSpeed: state.waveSpeed,
    oceanTransparency: state.oceanTransparency,
    sunIntensity: state.sunIntensity,
    enableDynamicSky: state.enableDynamicSky,
    oceanSize: state.oceanSize,
    rippleScale: state.rippleScale,
    fogHeight: state.fogHeight,
    bubbleScale: state.bubbleScale,
    bubbleDensity: state.bubbleDensity,
    bubbleSpeed: state.bubbleSpeed,
    timestamp: new Date().toISOString(),
    name: state.name,
    description: state.description,
  };
}

/**
 * Export world config to JSON string
 */
export function exportWorldConfigToJSON(state: WorldState, pretty: boolean = true): string {
  const config = exportWorldConfig(state);
  return pretty ? JSON.stringify(config, null, 2) : JSON.stringify(config);
}

/**
 * Download world config as JSON file (DEPRECATED - use cloud storage instead)
 * Kept for backwards compatibility but not recommended
 */
export function downloadWorldConfig(state: WorldState, filename?: string): void {
  console.warn('[WorldExporter] downloadWorldConfig is deprecated. Use cloud storage instead.');
  // Removed download functionality - use cloud storage or localStorage instead
}
