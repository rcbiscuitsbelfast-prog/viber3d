/**
 * World Storage System
 * 
 * Provides a storage abstraction layer for saving/loading worlds.
 * Currently implements LocalStorage adapter, but interface is designed
 * for easy migration to Firebase Storage.
 */

import type { WavePreset } from '@/components/OptimizedOcean';
import type { FogDensityPreset } from '@/components/OptimizedFog';

// ============================================================================
// TYPES
// ============================================================================

export interface WorldData {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string; // Base64 data URL
  template: 'forest' | 'island' | 'custom';
  worldType?: 'openWorld' | 'platformer' | 'multiLevel';

  // Procedural asset configuration
  assetSeed?: number;
  
  // Terrain configuration
  terrain: {
    seed: number;
    roughness: number;
    islandSize: number;
    terrainDetail: number;
    heightScale: number;
    waterLevel: number;
    cliffIntensity: number;
    isSquareTerrain: boolean;
    noiseType: string;
  };
  
  // Asset amounts
  assets: {
    treeAmount: number;
    treeSize: number;
    grassAmount: number;
    grassSize: number;
    rockAmount: number;
    rockSize: number;
    bushAmount: number;
    bushSize: number;
  };
  
  // Environment settings
  environment: {
    timeOfDay: number;
    waveStrength: number;
    waveSpeed: number;
    oceanTransparency: number;
    fogHeight: number;
    fogOffset: number;
    // New optimized ocean/fog settings (optional for backward compatibility)
    wavePreset?: WavePreset;
    waveHeight?: number;
    waveAmplitude?: number; // Kept for migration
    bubbleDensity?: number; // Kept for migration
    fogPreset?: FogDensityPreset;
  };
  
  // Building areas
  buildingAreas: Array<{
    id: number;
    x: number;
    z: number;
    radius: number;
    height: number;
  }>;
  
  // Placed assets
  placedBuildings: Array<{
    id: string;
    packId: string;
    assetType: string;
    position: [number, number, number];
    rotation: number;
    scale: number;
  }>;
  
  placedNPCs: Array<{
    id: string;
    packId: string;
    assetType: string;
    position: [number, number, number];
    rotation: number;
    scale: number;
    characterId?: string;
    modelPath?: string;
    assetId?: string;
    weaponPath?: string;
    shieldPath?: string;
  }>;
  
  // Manual nature assets
  manualTrees: Array<{
    id: string;
    pos: [number, number, number];
    scale: number;
    treeType: string;
    rotation: number;
  }>;
  
  manualRocks: Array<{
    id: string;
    pos: [number, number, number];
    scale: number;
    variant: number;
    rotation: number;
  }>;

  manualGrass?: Array<{
    id: string;
    pos: [number, number, number];
    scale: number;
    variant: number;
    rotation: number;
  }>;

  manualBushes?: Array<{
    id: string;
    pos: [number, number, number];
    scale: number;
    variant: number;
    rotation: number;
  }>;

  // Voice & Audio
  voice?: {
    voiceSample: string; // Text sample for TTS
    recordingUrl?: string; // Data URL of recorded audio
    selectedVoice?: string; // TTS voice ID
    npcVoiceLines?: Record<string, {
      text: string;
      recordingUrl?: string;
      voiceId?: string;
    }>; // Per-NPC voice recordings
  };
}

export interface WorldMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  thumbnail?: string;
  template: string;
  worldType?: 'openWorld' | 'platformer' | 'multiLevel';
}

// ============================================================================
// STORAGE INTERFACE
// ============================================================================

export interface WorldStorageAdapter {
  /**
   * Save a world. Returns the world ID.
   */
  save(world: WorldData): Promise<string>;
  
  /**
   * Load a world by ID.
   */
  load(id: string): Promise<WorldData | null>;
  
  /**
   * List all saved worlds (metadata only).
   */
  list(): Promise<WorldMetadata[]>;
  
  /**
   * Delete a world by ID.
   */
  delete(id: string): Promise<void>;
  
  /**
   * Check if a world exists.
   */
  exists(id: string): Promise<boolean>;
}

// ============================================================================
// LOCAL STORAGE ADAPTER
// ============================================================================

const LOCAL_STORAGE_PREFIX = 'questly_world_';
const WORLDS_INDEX_KEY = 'questly_worlds_index';

export class LocalStorageAdapter implements WorldStorageAdapter {
  async save(world: WorldData): Promise<string> {
    try {
      // Generate ID if not present
      if (!world.id) {
        world.id = `world_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Update timestamp
      world.updatedAt = Date.now();
      if (!world.createdAt) {
        world.createdAt = world.updatedAt;
      }
      
      // Compress thumbnail if too large (limit to 100KB base64)
      if (world.thumbnail && world.thumbnail.length > 100000) {
        world.thumbnail = await this.compressThumbnail(world.thumbnail);
      }
      
      // Save world data
      const key = LOCAL_STORAGE_PREFIX + world.id;
      localStorage.setItem(key, JSON.stringify(world));
      
      // Update index
      await this.updateIndex(world);
      window.dispatchEvent(new CustomEvent('questly:worlds-updated'));
      
      console.log(`[WorldStorage] Saved world: ${world.name} (${world.id})`);
      return world.id;
    } catch (error) {
      console.error('[WorldStorage] Failed to save world:', error);
      throw new Error('Failed to save world');
    }
  }
  
  async load(id: string): Promise<WorldData | null> {
    try {
      const key = LOCAL_STORAGE_PREFIX + id;
      const data = localStorage.getItem(key);
      
      if (!data) {
        console.warn(`[WorldStorage] World not found: ${id}`);
        return null;
      }
      
      return JSON.parse(data) as WorldData;
    } catch (error) {
      console.error('[WorldStorage] Failed to load world:', error);
      return null;
    }
  }
  
  async list(): Promise<WorldMetadata[]> {
    try {
      const indexData = localStorage.getItem(WORLDS_INDEX_KEY);
      if (!indexData) {
        return [];
      }
      
      const index: WorldMetadata[] = JSON.parse(indexData);
      // Sort by most recently updated
      return index.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (error) {
      console.error('[WorldStorage] Failed to list worlds:', error);
      return [];
    }
  }
  
  async delete(id: string): Promise<void> {
    try {
      const key = LOCAL_STORAGE_PREFIX + id;
      localStorage.removeItem(key);
      
      // Update index
      const index = await this.list();
      const filtered = index.filter(w => w.id !== id);
      localStorage.setItem(WORLDS_INDEX_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new CustomEvent('questly:worlds-updated'));
      
      console.log(`[WorldStorage] Deleted world: ${id}`);
    } catch (error) {
      console.error('[WorldStorage] Failed to delete world:', error);
      throw new Error('Failed to delete world');
    }
  }
  
  async exists(id: string): Promise<boolean> {
    const key = LOCAL_STORAGE_PREFIX + id;
    return localStorage.getItem(key) !== null;
  }
  
  private async updateIndex(world: WorldData): Promise<void> {
    const index = await this.list();
    
    // Remove existing entry if present
    const filtered = index.filter(w => w.id !== world.id);
    
    // Add new/updated entry
    filtered.push({
      id: world.id,
      name: world.name,
      createdAt: world.createdAt,
      updatedAt: world.updatedAt,
      thumbnail: world.thumbnail,
      template: world.template,
      worldType: world.worldType,
    });
    
    localStorage.setItem(WORLDS_INDEX_KEY, JSON.stringify(filtered));
  }
  
  private async compressThumbnail(dataUrl: string): Promise<string> {
    // Simple compression: reduce image quality
    // In production, this could use canvas to resize/compress
    return dataUrl.substring(0, 100000);
  }
}

// ============================================================================
// FIREBASE STORAGE ADAPTER (PLACEHOLDER)
// ============================================================================

export class FirebaseStorageAdapter implements WorldStorageAdapter {
  private userId: string;
  
  constructor(userId: string) {
    this.userId = userId;
  }
  
  async save(world: WorldData): Promise<string> {
    // TODO: Implement Firebase save
    // 1. Upload thumbnail to Firebase Storage
    // 2. Save world data to Firestore
    // 3. Return world ID
    throw new Error('Firebase adapter not yet implemented');
  }
  
  async load(id: string): Promise<WorldData | null> {
    // TODO: Implement Firebase load
    // 1. Fetch world data from Firestore
    // 2. Return world data
    throw new Error('Firebase adapter not yet implemented');
  }
  
  async list(): Promise<WorldMetadata[]> {
    // TODO: Implement Firebase list
    // 1. Query Firestore for user's worlds
    // 2. Return metadata array
    throw new Error('Firebase adapter not yet implemented');
  }
  
  async delete(id: string): Promise<void> {
    // TODO: Implement Firebase delete
    // 1. Delete world data from Firestore
    // 2. Delete thumbnail from Firebase Storage
    throw new Error('Firebase adapter not yet implemented');
  }
  
  async exists(id: string): Promise<boolean> {
    // TODO: Implement Firebase exists check
    throw new Error('Firebase adapter not yet implemented');
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

// Default to localStorage adapter
let currentAdapter: WorldStorageAdapter = new LocalStorageAdapter();

export function setStorageAdapter(adapter: WorldStorageAdapter): void {
  currentAdapter = adapter;
}

export function getStorageAdapter(): WorldStorageAdapter {
  return currentAdapter;
}

// Convenience functions using current adapter
export async function saveWorld(world: WorldData): Promise<string> {
  return currentAdapter.save(world);
}

export async function loadWorld(id: string): Promise<WorldData | null> {
  return currentAdapter.load(id);
}

export async function listWorlds(): Promise<WorldMetadata[]> {
  return currentAdapter.list();
}

export async function deleteWorld(id: string): Promise<void> {
  return currentAdapter.delete(id);
}

export async function worldExists(id: string): Promise<boolean> {
  return currentAdapter.exists(id);
}
