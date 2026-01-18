import { Vector3 } from 'three';

/**
 * Tile Object Configuration - Base interface for objects placed in tiles
 */
export interface TileObjectConfig {
  modelId: string;
  position: Vector3;
  rotation: Vector3;
  scale: number;
  collider?: ColliderConfig;
}

/**
 * Collider configuration for collision detection
 */
export interface ColliderConfig {
  type: 'box' | 'sphere';
  size: Vector3; // For box: [width, height, depth], For sphere: [radius, 0, 0]
  offset: Vector3;
  isTrigger: boolean;
}

/**
 * Asset configuration - defines what models to use and how many
 */
export interface AssetConfig {
  modelId: string;
  minCount: number;
  maxCount: number;
  minScale: number;
  maxScale: number;
  colliderSize?: Vector3; // Optional collider size for this asset type
}

/**
 * Tile Definition - Template for a tile type
 */
export interface TileDefinition {
  id: string;
  displayName: string;
  description: string;
  size: number; // Tile size in units (e.g., 10 for 10x10 unit tiles)
  
  // Asset configurations
  treeConfigs?: AssetConfig[];
  rockConfigs?: AssetConfig[];
  flowerConfigs?: AssetConfig[];
  
  // Base ground texture/appearance
  baseTexture: 'grass' | 'dirt' | 'rock' | 'water';
  
  // Colliders defined at tile level
  colliderConfigs?: ColliderConfig[];
}

/**
 * Tile Instance - A concrete instance of a tile in the world
 */
export interface TileInstance {
  id: string;
  position: [number, number]; // Grid coordinates [x, y]
  tileId: string; // References TileDefinition.id
  seed: number; // Deterministic seed for procedural generation
  
  // Generated contents
  objects: TileObjectConfig[];
  colliders: ColliderConfig[];
  
  // Tile bounds
  worldBounds: {
    min: Vector3;
    max: Vector3;
  };
}

/**
 * World Grid - Contains all tiles in the game world
 */
export interface WorldGrid {
  tiles: TileInstance[][]; // 2D array of tiles, max 10x10
  width: number;
  height: number;
  worldSeed: number; // Global seed for world generation
  
  metadata: {
    tileSize: number;
    loadedTileCount: number;
    activeTileCount: number;
  };
}

/**
 * Placed object in a tile with full transform data
 */
export interface PlacedTileObject {
  id: string;
  type: 'tree' | 'rock' | 'flower' | 'ground';
  modelId: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  collider?: ColliderConfig;
}

/**
 * Player position for tile streaming
 */
export interface PlayerPosition {
  x: number;
  z: number; // Using Y as up axis in 3D space
  gridX: number; // Current tile grid X coordinate
  gridY: number; // Current tile grid Y coordinate
}