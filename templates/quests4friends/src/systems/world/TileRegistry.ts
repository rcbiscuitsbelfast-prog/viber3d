import { TileDefinition } from '../../types/tile.types';
import { Vector3 } from 'three';

/**
 * TileRegistry - Central repository for all tile template definitions
 * Defines 9 base tile types using KayKit Forest Nature Pack assets
 */

// Base asset paths from KayKit Forest Nature Pack
const ASSET_BASE_PATH = '/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf';

// Tree model variants
const TREE_MODELS = {
  tree_1: `${ASSET_BASE_PATH}/tree_1`,
  tree_2: `${ASSET_BASE_PATH}/tree_2`,
  tree_3: `${ASSET_BASE_PATH}/tree_3`,
  tree_4: `${ASSET_BASE_PATH}/tree_4`,
  tree_bare_1: `${ASSET_BASE_PATH}/tree_bare_1`,
  tree_bare_2: `${ASSET_BASE_PATH}/tree_bare_2`
};

// Rock model variants
const ROCK_MODELS = {
  rock_1: `${ASSET_BASE_PATH}/rock_1`, // Small rocks
  rock_2: `${ASSET_BASE_PATH}/rock_2`, // Medium rocks
  rock_3: `${ASSET_BASE_PATH}/rock_3`  // Large boulders
};

export class TileRegistry {
  private static definitions: Map<string, TileDefinition> = new Map();

  static initialize() {
    this.registerTileDefinitions();
  }

  private static registerTileDefinitions() {
    // 1. Forest Dense - 12-15 mixed trees, boundary colliders
    this.definitions.set('forest_dense', {
      id: 'forest_dense',
      displayName: 'Dense Forest',
      description: 'Thick forest with many trees and minimal open space',
      size: 10,
      baseTexture: 'grass',
      treeConfigs: [
        {
          modelId: 'tree_1',
          minCount: 3,
          maxCount: 5,
          minScale: 0.8,
          maxScale: 1.2
        },
        {
          modelId: 'tree_2',
          minCount: 4,
          maxCount: 6,
          minScale: 0.9,
          maxScale: 1.3
        },
        {
          modelId: 'tree_3',
          minCount: 2,
          maxCount: 3,
          minScale: 0.7,
          maxScale: 1.0
        },
        {
          modelId: 'tree_4',
          minCount: 1,
          maxCount: 2,
          minScale: 0.8,
          maxScale: 1.1
        }
      ],
      // Boundary colliders only - prevent walking off tile
      colliderConfigs: [
        {
          type: 'box',
          size: new Vector3(10, 5, 0.5),
          offset: new Vector3(0, 2.5, 5),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(10, 5, 0.5),
          offset: new Vector3(0, 2.5, -5),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(0.5, 5, 10),
          offset: new Vector3(5, 2.5, 0),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(0.5, 5, 10),
          offset: new Vector3(-5, 2.5, 0),
          isTrigger: false
        }
      ]
    });

    // 2. Forest Sparse - 4-6 mixed trees, no colliders (open)
    this.definitions.set('forest_sparse', {
      id: 'forest_sparse',
      displayName: 'Sparse Forest',
      description: 'Open forest with scattered trees and clear paths',
      size: 10,
      baseTexture: 'grass',
      treeConfigs: [
        {
          modelId: 'tree_bare_1',
          minCount: 1,
          maxCount: 2,
          minScale: 0.9,
          maxScale: 1.1
        },
        {
          modelId: 'tree_bare_2',
          minCount: 1,
          maxCount: 2,
          minScale: 0.9,
          maxScale: 1.1
        },
        {
          modelId: 'tree_4',
          minCount: 1,
          maxCount: 2,
          minScale: 0.8,
          maxScale: 1.0
        }
      ]
      // No colliders - completely open
    });

    // 3. Meadow Stones - grass with 3-5 small stone rocks, colliders on rocks
    this.definitions.set('meadow_stones', {
      id: 'meadow_stones',
      displayName: 'Meadow with Stones',
      description: 'Grassy meadow with decorative stone formations',
      size: 10,
      baseTexture: 'grass',
      rockConfigs: [
        {
          modelId: 'rock_1',
          minCount: 2,
          maxCount: 3,
          minScale: 0.5,
          maxScale: 0.8,
          colliderSize: new Vector3(0.8, 0.6, 0.8)
        },
        {
          modelId: 'rock_2',
          minCount: 1,
          maxCount: 2,
          minScale: 0.6,
          maxScale: 1.0,
          colliderSize: new Vector3(1.2, 0.8, 1.2)
        }
      ]
    });

    // 4. Rocky Outcrop - 2-3 large rocks + grass, colliders
    this.definitions.set('rocky_outcrop', {
      id: 'rocky_outcrop',
      displayName: 'Rocky Outcrop',
      description: 'Rocky terrain with large boulders and sparse vegetation',
      size: 10,
      baseTexture: 'rock',
      rockConfigs: [
        {
          modelId: 'rock_3',
          minCount: 2,
          maxCount: 3,
          minScale: 1.2,
          maxScale: 1.8,
          colliderSize: new Vector3(2.5, 1.8, 2.5)
        },
        {
          modelId: 'rock_2',
          minCount: 1,
          maxCount: 2,
          minScale: 0.8,
          maxScale: 1.2,
          colliderSize: new Vector3(1.5, 1.0, 1.5)
        }
      ],
      treeConfigs: [
        {
          modelId: 'tree_bare_1',
          minCount: 0,
          maxCount: 2,
          minScale: 0.7,
          maxScale: 0.9
        }
      ]
    });

    // 5. Flowers Field - grass base + 6-8 scattered flowers, no colliders
    this.definitions.set('flowers_field', {
      id: 'flowers_field',
      displayName: 'Field of Flowers',
      description: 'Beautiful meadow filled with colorful wildflowers',
      size: 10,
      baseTexture: 'grass',
      flowerConfigs: [
        {
          modelId: 'plant_flower_red',
          minCount: 2,
          maxCount: 3,
          minScale: 0.3,
          maxScale: 0.5
        },
        {
          modelId: 'plant_flower_yellow',
          minCount: 2,
          maxCount: 3,
          minScale: 0.3,
          maxScale: 0.5
        },
        {
          modelId: 'plant_flower_purple',
          minCount: 1,
          maxCount: 2,
          minScale: 0.3,
          maxScale: 0.5
        }
      ],
      treeConfigs: [
        {
          modelId: 'tree_4',
          minCount: 0,
          maxCount: 1,
          minScale: 0.8,
          maxScale: 1.0
        }
      ]
    });

    // 6. Mixed Nature - 4-5 trees + 2-3 rocks + flowers, rock colliders
    this.definitions.set('mixed_nature', {
      id: 'mixed_nature',
      displayName: 'Mixed Nature',
      description: 'Diverse landscape with trees, rocks, and flowers',
      size: 10,
      baseTexture: 'grass',
      treeConfigs: [
        {
          modelId: 'tree_1',
          minCount: 1,
          maxCount: 2,
          minScale: 0.8,
          maxScale: 1.1
        },
        {
          modelId: 'tree_2',
          minCount: 1,
          maxCount: 2,
          minScale: 0.9,
          maxScale: 1.2
        },
        {
          modelId: 'tree_4',
          minCount: 1,
          maxCount: 2,
          minScale: 0.8,
          maxScale: 1.0
        }
      ],
      rockConfigs: [
        {
          modelId: 'rock_1',
          minCount: 1,
          maxCount: 2,
          minScale: 0.6,
          maxScale: 0.9,
          colliderSize: new Vector3(1.0, 0.7, 1.0)
        },
        {
          modelId: 'rock_2',
          minCount: 1,
          maxCount: 2,
          minScale: 0.7,
          maxScale: 1.1,
          colliderSize: new Vector3(1.3, 0.9, 1.3)
        }
      ],
      flowerConfigs: [
        {
          modelId: 'plant_flower_white',
          minCount: 2,
          maxCount: 4,
          minScale: 0.3,
          maxScale: 0.4
        }
      ]
    });

    // 7. Barren Rocky - 3-4 very large boulders, large colliders
    this.definitions.set('barren_rocky', {
      id: 'barren_rocky',
      displayName: 'Barren Rocky',
      description: 'Desolate rocky terrain with massive boulders',
      size: 10,
      baseTexture: 'rock',
      rockConfigs: [
        {
          modelId: 'rock_3',
          minCount: 3,
          maxCount: 4,
          minScale: 1.5,
          maxScale: 2.2,
          colliderSize: new Vector3(3.0, 2.2, 3.0)
        },
        {
          modelId: 'rock_2',
          minCount: 1,
          maxCount: 2,
          minScale: 1.0,
          maxScale: 1.5,
          colliderSize: new Vector3(1.8, 1.2, 1.8)
        }
      ],
      treeConfigs: [
        {
          modelId: 'tree_bare_2',
          minCount: 0,
          maxCount: 1,
          minScale: 0.6,
          maxScale: 0.8
        }
      ]
    });

    // 8. Clearing - just grass, no colliders (open space)
    this.definitions.set('clearing', {
      id: 'clearing',
      displayName: 'Clearing',
      description: 'Open grassy clearing perfect for encounters',
      size: 10,
      baseTexture: 'grass'
      // No objects, completely open
    });

    // 9. Water Pond - water plane + surrounding stones, full perimeter collider
    this.definitions.set('water_pond', {
      id: 'water_pond',
      displayName: 'Water Pond',
      description: 'Peaceful pond with bordering stones',
      size: 10,
      baseTexture: 'water',
      rockConfigs: [
        {
          modelId: 'rock_1',
          minCount: 6,
          maxCount: 8,
          minScale: 0.4,
          maxScale: 0.7,
          colliderSize: new Vector3(0.9, 0.5, 0.9)
        }
      ],
      // Full perimeter collider to prevent walking into water
      colliderConfigs: [
        {
          type: 'box',
          size: new Vector3(10, 5, 0.5),
          offset: new Vector3(0, 2.5, 5),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(10, 5, 0.5),
          offset: new Vector3(0, 2.5, -5),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(0.5, 5, 10),
          offset: new Vector3(5, 2.5, 0),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(0.5, 5, 10),
          offset: new Vector3(-5, 2.5, 0),
          isTrigger: false
        },
        {
          type: 'box',
          size: new Vector3(4, 5, 4),
          offset: new Vector3(0, 2.5, 0),
          isTrigger: false
        }
      ]
    });
  }

  static getTileDefinition(id: string): TileDefinition | undefined {
    return this.definitions.get(id);
  }

  static getAllDefinitions(): TileDefinition[] {
    return Array.from(this.definitions.values());
  }

  static getTileIds(): string[] {
    return Array.from(this.definitions.keys());
  }

  static getModelPath(modelId: string): string {
    // Map modelIds to actual file paths
    const modelPaths: Record<string, string> = {
      // Trees
      'tree_1': `${TREE_MODELS.tree_1}/Tree_1_A_Color1.gltf`,
      'tree_2': `${TREE_MODELS.tree_2}/Tree_2_A_Color1.gltf`,
      'tree_3': `${TREE_MODELS.tree_3}/Tree_3_A_Color1.gltf`,
      'tree_4': `${TREE_MODELS.tree_4}/Tree_4_A_Color1.gltf`,
      'tree_bare_1': `${TREE_MODELS.tree_bare_1}/Tree_Bare_1_A_Color1.gltf`,
      'tree_bare_2': `${TREE_MODELS.tree_bare_2}/Tree_Bare_2_A_Color1.gltf`,
      
      // Rocks
      'rock_1': `${ROCK_MODELS.rock_1}/Rock_1_A_Color1.gltf`,
      'rock_2': `${ROCK_MODELS.rock_2}/Rock_2_A_Color1.gltf`,
      'rock_3': `${ROCK_MODELS.rock_3}/Rock_3_A_Color1.gltf`,
      
      // Flowers (using simplified names - actual flower models would be in plants category)
      'plant_flower_red': `${ASSET_BASE_PATH}/plant_flower_red.gltf`,
      'plant_flower_yellow': `${ASSET_BASE_PATH}/plant_flower_yellow.gltf`,
      'plant_flower_purple': `${ASSET_BASE_PATH}/plant_flower_purple.gltf`,
      'plant_flower_white': `${ASSET_BASE_PATH}/plant_flower_white.gltf`
    };
    
    return modelPaths[modelId] || `${ASSET_BASE_PATH}/${modelId}.gltf`;
  }
}