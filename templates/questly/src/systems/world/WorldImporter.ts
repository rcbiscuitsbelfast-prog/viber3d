/**
 * WorldImporter - Load world configuration from JSON
 * Phase 4.1 - Save/Load System
 */

import { WorldConfig } from './WorldConfig';
import type { WorldState } from './WorldExporter';

/**
 * Validate and import world config from JSON string
 */
export function importWorldConfigFromJSON(json: string): WorldConfig {
  try {
    const config = JSON.parse(json) as WorldConfig;
    
    // Validate required fields
    if (typeof config.roughness !== 'number') {
      throw new Error('Invalid world config: missing or invalid roughness');
    }
    
    // Set defaults for optional fields
    return {
      version: config.version || '1.0.0',
      roughness: config.roughness,
      islandSize: config.islandSize ?? 44,
      terrainDetail: config.terrainDetail ?? 64,
      seed: config.seed ?? 0,
      heightScale: config.heightScale ?? 55,
      waterLevel: config.waterLevel ?? 0.9,
      cliffIntensity: config.cliffIntensity ?? 100,
      treeAmount: config.treeAmount ?? 3500,
      treeSize: config.treeSize ?? 100,
      grassAmount: config.grassAmount ?? 2000,
      grassSize: config.grassSize ?? 100,
      terrainGrassCoverage: config.terrainGrassCoverage ?? 100,
      buildingGrassFalloff: config.buildingGrassFalloff ?? 50,
      rockAmount: config.rockAmount ?? 400,
      rockSize: config.rockSize ?? 100,
      bushAmount: config.bushAmount ?? 600,
      bushSize: config.bushSize ?? 100,
      treeHeightOffset: config.treeHeightOffset ?? 0,
      grassHeightOffset: config.grassHeightOffset ?? 0,
      rockHeightOffset: config.rockHeightOffset ?? 0,
      bushHeightOffset: config.bushHeightOffset ?? 0,
      slopeAdjustmentIntensity: config.slopeAdjustmentIntensity ?? 3.5,
      buildingAreas: config.buildingAreas ?? [],
      nextAreaId: config.nextAreaId ?? 1,
      manualAssets: config.manualAssets ?? [],
      proceduralAssets: config.proceduralAssets ?? { trees: [], rocks: [] },
      questMarkers: config.questMarkers ?? [],
      npcs: config.npcs ?? [],
      timeOfDay: config.timeOfDay ?? 0.5,
      waveStrength: config.waveStrength ?? 0.02,
      waveSpeed: config.waveSpeed ?? 1.7,
      oceanTransparency: config.oceanTransparency ?? 1.0,
      sunIntensity: config.sunIntensity ?? 1.0,
      enableDynamicSky: config.enableDynamicSky ?? true,
      oceanSize: config.oceanSize ?? 500,
      rippleScale: config.rippleScale ?? 5.0,
      fogHeight: config.fogHeight ?? 16,
      bubbleScale: config.bubbleScale ?? 0.7,
      bubbleDensity: config.bubbleDensity ?? 1.5,
      bubbleSpeed: config.bubbleSpeed ?? 0.01,
      timestamp: config.timestamp || new Date().toISOString(),
      name: config.name,
      description: config.description,
    };
  } catch (error) {
    throw new Error(`Failed to parse world config: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Convert WorldConfig to WorldState (for applying to component state)
 */
export function configToWorldState(config: WorldConfig): WorldState {
  return {
    roughness: config.roughness,
    islandSize: config.islandSize,
    terrainDetail: config.terrainDetail,
    seed: config.seed,
    heightScale: config.heightScale,
    waterLevel: config.waterLevel,
    cliffIntensity: config.cliffIntensity,
    treeAmount: config.treeAmount,
    treeSize: config.treeSize,
    grassAmount: config.grassAmount,
    grassSize: config.grassSize,
    terrainGrassCoverage: config.terrainGrassCoverage,
    buildingGrassFalloff: config.buildingGrassFalloff,
    rockAmount: config.rockAmount,
    rockSize: config.rockSize,
    bushAmount: config.bushAmount,
    bushSize: config.bushSize,
    treeHeightOffset: config.treeHeightOffset,
    grassHeightOffset: config.grassHeightOffset,
    rockHeightOffset: config.rockHeightOffset,
    bushHeightOffset: config.bushHeightOffset,
    slopeAdjustmentIntensity: config.slopeAdjustmentIntensity,
    buildingAreas: config.buildingAreas,
    nextAreaId: config.nextAreaId,
    manualAssets: config.manualAssets,
    proceduralAssets: config.proceduralAssets,
    questMarkers: config.questMarkers,
    npcs: config.npcs,
    timeOfDay: config.timeOfDay,
    waveStrength: config.waveStrength,
    waveSpeed: config.waveSpeed,
    oceanTransparency: config.oceanTransparency,
    sunIntensity: config.sunIntensity,
    enableDynamicSky: config.enableDynamicSky,
    oceanSize: config.oceanSize,
    rippleScale: config.rippleScale,
    fogHeight: config.fogHeight,
    bubbleScale: config.bubbleScale,
    bubbleDensity: config.bubbleDensity,
    bubbleSpeed: config.bubbleSpeed,
    name: config.name,
    description: config.description,
  };
}

/**
 * Load world config from file input
 */
export function loadWorldConfigFromFile(file: File): Promise<WorldConfig> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const config = importWorldConfigFromJSON(json);
        resolve(config);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
