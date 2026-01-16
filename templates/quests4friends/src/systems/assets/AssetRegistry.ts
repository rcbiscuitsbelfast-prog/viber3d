import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Asset Descriptor Interface
export interface AssetDescriptor {
  id: string;
  category: 'environment' | 'character' | 'weapon' | 'item';
  subcategory: string;
  name: string;
  gltfPath: string;
  previewImage?: string;
  tags: string[];
}

// Asset Loading Cache
interface AssetCache {
  [id: string]: THREE.Group | THREE.Object3D;
}

export class AssetRegistry {
  private static instance: AssetRegistry;
  private assets: Map<string, AssetDescriptor> = new Map();
  private cache: AssetCache = {};
  private loader: GLTFLoader;
  private loadingPromises: Map<string, Promise<THREE.Group | THREE.Object3D>> = new Map();

  private constructor() {
    this.loader = new GLTFLoader();
  }

  static getInstance(): AssetRegistry {
    if (!AssetRegistry.instance) {
      AssetRegistry.instance = new AssetRegistry();
    }
    return AssetRegistry.instance;
  }

  /**
   * Initialize the registry with asset manifests
   */
  async initialize() {
    try {
      // Load both asset manifests
      const [adventurersData, forestData] = await Promise.all([
        fetch('/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/assets.json').then(r => r.json()),
        fetch('/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/assets.json').then(r => r.json())
      ]);

      // Normalize adventurers assets
      this.normalizeAdventurersAssets(adventurersData);
      
      // Normalize forest assets
      this.normalizeForestAssets(forestData);

      console.log(`Asset Registry initialized with ${this.assets.size} assets`);
    } catch (error) {
      console.error('Failed to initialize Asset Registry:', error);
      throw error;
    }
  }

  /**
   * Convert display name to file name
   * Examples: "Sword 1-Handed" -> "sword_1handed", "Bow with String" -> "bow_withString"
   */
  private nameToFileName(name: string): string {
    // Handle special case "Bow with String" -> "bow_withString"
    if (name === 'Bow with String') {
      return 'bow_withString';
    }
    // General conversion: lowercase, replace spaces with underscores, remove hyphens
    return name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '');
  }

  /**
   * Normalize Adventurers pack assets
   */
  private normalizeAdventurersAssets(data: any) {
    const basePath = '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE';

    // Characters
    if (data.characters?.gltf) {
      data.characters.gltf.forEach((char: any) => {
        const id = `char_${char.name.toLowerCase().replace(/\s+/g, '_')}`;
        this.assets.set(id, {
          id,
          category: 'character',
          subcategory: 'player',
          name: char.name,
          gltfPath: `${basePath}/${char.file}`,
          previewImage: char.texture ? `${basePath}/${char.texture}` : undefined,
          tags: ['character', 'player', char.name.toLowerCase()]
        });
      });
    }

    // Weapons - Melee
    if (data.weapons?.melee) {
      data.weapons.melee.forEach((weapon: any) => {
        const id = `weapon_${weapon.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}`;
        const fileName = this.nameToFileName(weapon.name);
        this.assets.set(id, {
          id,
          category: 'weapon',
          subcategory: 'melee',
          name: weapon.name,
          gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
          tags: ['weapon', 'melee', ...weapon.name.toLowerCase().split(' ')]
        });
      });
    }

    // Weapons - Ranged
    if (data.weapons?.ranged) {
      data.weapons.ranged.forEach((weapon: any) => {
        const id = `weapon_${weapon.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}`;
        const fileName = this.nameToFileName(weapon.name);
        this.assets.set(id, {
          id,
          category: 'weapon',
          subcategory: 'ranged',
          name: weapon.name,
          gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
          tags: ['weapon', 'ranged', ...weapon.name.toLowerCase().split(' ')]
        });
      });
    }

    // Shields
    if (data.shields) {
      data.shields.forEach((shield: any) => {
        const id = `shield_${shield.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}`;
        const fileName = this.nameToFileName(shield.name);
        this.assets.set(id, {
          id,
          category: 'item',
          subcategory: 'shield',
          name: shield.name,
          gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
          tags: ['item', 'shield', 'defense']
        });
      });
    }

    // Items
    if (data.items) {
      data.items.forEach((item: any) => {
        const id = `item_${item.name.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')}`;
        const fileName = this.nameToFileName(item.name);
        this.assets.set(id, {
          id,
          category: 'item',
          subcategory: 'collectible',
          name: item.name,
          gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
          tags: ['item', 'collectible']
        });
      });
    }
  }

  /**
   * Normalize Forest pack assets
   */
  private normalizeForestAssets(data: any) {
    const basePath = '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE';

    // Trees
    if (data.categories?.trees) {
      Object.entries(data.categories.trees).forEach(([treeType, variants]: [string, any]) => {
        if (Array.isArray(variants)) {
          variants.forEach((tree: any) => {
            const id = `tree_${tree.name.toLowerCase().replace(/\s+/g, '_')}`;
            // Convert "Tree 1 A Color1" to "Tree_1_A_Color1"
            const fileName = tree.name.replace(/\s+/g, '_');
            this.assets.set(id, {
              id,
              category: 'environment',
              subcategory: 'tree',
              name: tree.name,
              gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
              tags: ['environment', 'tree', 'nature', treeType]
            });
          });
        }
      });
    }

    // Rocks
    if (data.categories?.rocks) {
      Object.entries(data.categories.rocks).forEach(([rockType, variants]: [string, any]) => {
        if (Array.isArray(variants)) {
          variants.forEach((rock: any) => {
            const id = `rock_${rock.name.toLowerCase().replace(/\s+/g, '_')}`;
            // Convert "Rock 3 A Color1" to "Rock_3_A_Color1"
            const fileName = rock.name.replace(/\s+/g, '_');
            this.assets.set(id, {
              id,
              category: 'environment',
              subcategory: 'rock',
              name: rock.name,
              gltfPath: `${basePath}/Assets/gltf/${fileName}.gltf`,
              tags: ['environment', 'rock', 'stone', rockType]
            });
          });
        }
      });
    }
  }

  /**
   * Get asset descriptor by ID
   */
  getAsset(id: string): AssetDescriptor | undefined {
    return this.assets.get(id);
  }

  /**
   * Get all assets
   */
  getAllAssets(): AssetDescriptor[] {
    return Array.from(this.assets.values());
  }

  /**
   * Get assets by category
   */
  getAssetsByCategory(category: AssetDescriptor['category']): AssetDescriptor[] {
    return Array.from(this.assets.values()).filter(asset => asset.category === category);
  }

  /**
   * Get assets by tags
   */
  getAssetsByTags(tags: string[]): AssetDescriptor[] {
    return Array.from(this.assets.values()).filter(asset =>
      tags.some(tag => asset.tags.includes(tag))
    );
  }

  /**
   * Load a 3D model asset
   */
  async loadModel(assetId: string): Promise<THREE.Group | THREE.Object3D> {
    // Check cache first
    if (this.cache[assetId]) {
      return this.cache[assetId].clone();
    }

    // Check if already loading
    if (this.loadingPromises.has(assetId)) {
      const cached = await this.loadingPromises.get(assetId);
      return cached!.clone();
    }

    const asset = this.assets.get(assetId);
    if (!asset) {
      throw new Error(`Asset not found: ${assetId}`);
    }

    // Create loading promise
    const loadingPromise = new Promise<THREE.Group | THREE.Object3D>((resolve, reject) => {
      this.loader.load(
        asset.gltfPath,
        (gltf: any) => {
          // Store in cache
          this.cache[assetId] = gltf.scene;
          
          // Clean up loading promise
          this.loadingPromises.delete(assetId);
          
          // Return a clone
          resolve(gltf.scene.clone());
        },
        undefined,
        (error: any) => {
          console.error(`Failed to load asset ${assetId}:`, error);
          this.loadingPromises.delete(assetId);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(assetId, loadingPromise);
    return loadingPromise;
  }

  /**
   * Preload multiple assets
   */
  async preloadAssets(assetIds: string[]): Promise<void> {
    const loadPromises = assetIds.map(id => 
      this.loadModel(id).catch(error => {
        console.warn(`Failed to preload asset ${id}:`, error);
      })
    );
    
    await Promise.all(loadPromises);
  }

  /**
   * Clear the asset cache
   */
  clearCache() {
    Object.values(this.cache).forEach(model => {
      model.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach(m => m.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
    });
    
    this.cache = {};
    console.log('Asset cache cleared');
  }
}

// Export singleton instance
export const assetRegistry = AssetRegistry.getInstance();
