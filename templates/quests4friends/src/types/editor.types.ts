/**
 * Asset placement configuration - individual asset in a tile
 */
export interface AssetPlacement {
  id: string; // Unique per tile instance
  assetId: string; // Reference to PlaceableAsset.id
  position: [number, number, number]; // [x, y, z] in tile coordinates (0-10 range)
  rotation: [number, number, number]; // [x, y, z] in radians
  scale: [number, number, number]; // [x, y, z] scale factors
}

/**
 * Tile draft - composition of assets on a 10x10 unit tile
 */
export interface TileDraft {
  id: string;
  name: string;
  assets: AssetPlacement[];
  createdAt: Date;
  updatedAt: Date;
  size: 10; // Always 10x10
  baseTexture?: 'grass' | 'dirt' | 'rock' | 'water';
}

/**
 * World draft - grid of tiles
 */
export interface WorldDraft {
  id: string;
  name: string;
  gridSize: number; // 10, 15, or 20
  tiles: (string | null)[][]; // 2D array of tile IDs, null for empty cells
  createdAt: Date;
  updatedAt: Date;
  metadata?: {
    tileSize: number;
    description?: string;
  };
}

/**
 * Placeable asset definition - available assets for placement
 */
export interface PlaceableAsset {
  id: string;
  name: string;
  category: 'tree' | 'rock' | 'flower' | 'decoration' | 'building' | 'object';
  modelPath: string;
  defaultScale: [number, number, number];
  defaultRotation: [number, number, number];
  previewIcon?: string;
  description?: string;
}

/**
 * Saved tile template - stored tile with metadata
 */
export interface SavedTileTemplate {
  id: string;
  name: string;
  tileDraft: TileDraft;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  thumbnail?: string;
}

/**
 * Saved world template - stored world with metadata
 */
export interface SavedWorldTemplate {
  id: string;
  name: string;
  worldDraft: WorldDraft;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
  thumbnail?: string;
  description?: string;
}

/**
 * Export formats
 */
export interface TileExportData {
  name: string;
  assets: AssetPlacement[];
  metadata: {
    size: number;
    exportedAt: Date;
    version: string;
  };
}

export interface WorldExportData {
  name: string;
  gridSize: number;
  tiles: (string | null)[][];
  metadata: {
    exportedAt: Date;
    version: string;
    tileSize: number;
  };
}

/**
 * Editor modes and states
 */
export type EditorMode = 'select' | 'place' | 'erase' | 'move' | 'rotate' | 'scale';

export interface EditorState {
  mode: EditorMode;
  selectedAssetId: string | null;
  selectedTileId: string | null;
  selectedPlacementId: string | null;
  isDirty: boolean;
}

/**
 * Grid interaction data
 */
export interface GridPosition {
  x: number; // Grid coordinate (0-based)
  y: number; // Grid coordinate (0-based)
}

export interface TilePosition {
  tileX: number; // Tile grid coordinate
  tileY: number; // Tile grid coordinate
  localPosition: [number, number, number]; // Position within tile (0-10 range)
}

/**
 * Camera and control settings for editors
 */
export interface EditorCameraSettings {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
}