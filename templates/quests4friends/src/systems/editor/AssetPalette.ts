import { PlaceableAsset } from '../../types/editor.types';

/**
 * Asset Palette System - Registry of placeable assets for the editor
 * 
 * This system provides the available assets that can be placed in tiles
 * during the editing process. It integrates with the existing AssetRegistry
 * to map asset IDs to their 3D model paths.
 */

/**
 * Complete palette of placeable assets for the tile editor
 * Based on existing KayKit assets from the AssetRegistry
 */
export const ASSET_PALETTE: PlaceableAsset[] = [
  // Trees - Multiple variants from KayKit Forest pack
  {
    id: 'tree_oak_1',
    name: 'Oak Tree',
    category: 'tree',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Classic oak tree variant',
    previewIcon: '🌳'
  },
  {
    id: 'tree_pine_1',
    name: 'Pine Tree',
    category: 'tree',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Evergreen pine tree',
    previewIcon: '🌲'
  },
  {
    id: 'tree_birch_1',
    name: 'Birch Tree',
    category: 'tree',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Tall birch with distinctive bark',
    previewIcon: '🌳'
  },
  {
    id: 'tree_dead_1',
    name: 'Dead Tree',
    category: 'tree',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_4_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Dead/dry tree for desolate areas',
    previewIcon: '🌳'
  },
  {
    id: 'tree_stump_1',
    name: 'Tree Stump',
    category: 'tree',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_5_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Tree stump for cut forest areas',
    previewIcon: '🪵'
  },

  // Rocks - Various rock sizes and types
  {
    id: 'rock_large_1',
    name: 'Large Rock',
    category: 'rock',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Large boulder for landscape features',
    previewIcon: '🪨'
  },
  {
    id: 'rock_medium_1',
    name: 'Medium Rock',
    category: 'rock',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Medium-sized rock',
    previewIcon: '🪨'
  },
  {
    id: 'rock_small_1',
    name: 'Small Rock',
    category: 'rock',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_3_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Small pebble or rock',
    previewIcon: '🪨'
  },
  {
    id: 'rock_crystal_1',
    name: 'Crystal Formation',
    category: 'rock',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_4_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Crystal rock formation',
    previewIcon: '💎'
  },
  {
    id: 'rock_cluster_1',
    name: 'Rock Cluster',
    category: 'rock',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_5_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Cluster of smaller rocks',
    previewIcon: '🪨'
  },

  // Flowers - Various flower types for decoration
  {
    id: 'flower_red_1',
    name: 'Red Flowers',
    category: 'flower',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Flowers_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Red flower bush',
    previewIcon: '🌺'
  },
  {
    id: 'flower_yellow_1',
    name: 'Yellow Flowers',
    category: 'flower',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Flowers_2_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Yellow flower bush',
    previewIcon: '🌼'
  },
  {
    id: 'flower_blue_1',
    name: 'Blue Flowers',
    category: 'flower',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Flowers_3_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Blue flower bush',
    previewIcon: '🌸'
  },
  {
    id: 'flower_purple_1',
    name: 'Purple Flowers',
    category: 'flower',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Flowers_4_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Purple flower bush',
    previewIcon: '💜'
  },
  {
    id: 'flower_mix_1',
    name: 'Mixed Flowers',
    category: 'flower',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Flowers_5_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Mixed color flower bush',
    previewIcon: '🌷'
  },

  // Decoration items
  {
    id: 'mushroom_1',
    name: 'Mushroom',
    category: 'decoration',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Mushroom_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Single mushroom for forest floors',
    previewIcon: '🍄'
  },
  {
    id: 'bush_1',
    name: 'Bush',
    category: 'decoration',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Bush_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Green bush for natural barriers',
    previewIcon: '🌿'
  },
  {
    id: 'log_1',
    name: 'Wood Log',
    category: 'decoration',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Log_1_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Fallen tree log',
    previewIcon: '🪵'
  },
  {
    id: 'log_cross_1',
    name: 'Crossed Logs',
    category: 'decoration',
    modelPath: '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Log_2_A_Color1.gltf',
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Two crossed logs',
    previewIcon: '🪵'
  },

  // Buildings (placeholder for future implementation)
  {
    id: 'building_house_1',
    name: 'Small House',
    category: 'building',
    modelPath: '', // Will be implemented later
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Small residential house',
    previewIcon: '🏠'
  },
  {
    id: 'building_well_1',
    name: 'Village Well',
    category: 'building',
    modelPath: '', // Will be implemented later
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Village well for gathering points',
    previewIcon: '⛲'
  },

  // Objects (placeholder for future implementation)
  {
    id: 'object_crate_1',
    name: 'Wooden Crate',
    category: 'object',
    modelPath: '', // Will be implemented later
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Storage crate',
    previewIcon: '📦'
  },
  {
    id: 'object_bench_1',
    name: 'Wooden Bench',
    category: 'object',
    modelPath: '', // Will be implemented later
    defaultScale: [1, 1, 1],
    defaultRotation: [0, 0, 0],
    description: 'Simple wooden bench',
    previewIcon: '🪑'
  }
];

/**
 * Get assets by category
 */
export function getAssetsByCategory(category: PlaceableAsset['category']): PlaceableAsset[] {
  return ASSET_PALETTE.filter(asset => asset.category === category);
}

/**
 * Get asset by ID
 */
export function getAssetById(id: string): PlaceableAsset | undefined {
  return ASSET_PALETTE.find(asset => asset.id === id);
}

/**
 * Search assets by name or category
 */
export function searchAssets(query: string, category?: PlaceableAsset['category']): PlaceableAsset[] {
  const lowerQuery = query.toLowerCase();
  return ASSET_PALETTE.filter(asset => {
    const matchesQuery = asset.name.toLowerCase().includes(lowerQuery) ||
                        asset.description?.toLowerCase().includes(lowerQuery);
    const matchesCategory = !category || asset.category === category;
    return matchesQuery && matchesCategory;
  });
}

/**
 * Get all categories available
 */
export function getAllCategories(): PlaceableAsset['category'][] {
  return [...new Set(ASSET_PALETTE.map(asset => asset.category))];
}

/**
 * Validate asset path (check if model exists)
 */
export async function validateAssetPath(modelPath: string): Promise<boolean> {
  if (!modelPath || modelPath.trim() === '') return false;
  
  try {
    const response = await fetch(modelPath, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}