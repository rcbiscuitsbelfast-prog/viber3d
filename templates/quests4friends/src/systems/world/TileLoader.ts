import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { Cache, Group, Object3D } from 'three';
import { PlacedTileObject } from '../../types/tile.types';

/**
 * TileContent - Loaded tile data ready for rendering
 */
export interface TileContent {
  objects: LoadedObject[];
}

export interface LoadedObject {
  placedObject: PlacedTileObject;
  mesh: Object3D | null;
  isLoaded: boolean;
  error?: string;
}

/**
 * TileLoader - Manages loading and caching of 3D models for tiles
 * Uses Three.js Cache system and GLTFLoader for efficient asset management
 */
export class TileLoader {
  private static loader: GLTFLoader;
  private static modelCache: Map<string, Group> = new Map();
  private static loadingPromises: Map<string, Promise<Group>> = new Map();

  static initialize() {
    this.loader = new GLTFLoader();
    
    // Enable Three.js caching
    Cache.enabled = true;
    
    // Log cache status
    console.log('[TileLoader] Initialized model loader with caching enabled');
  }

  /**
   * Load a tile's objects asynchronously
   * @param tileId Tile identifier
   * @param objects Array of placed objects to load
   * @returns Promise<TileContent> with loaded meshes
   */
  static async loadTile(tileId: string, objects: PlacedTileObject[]): Promise<TileContent> {
    console.log(`[TileLoader] Loading tile: ${tileId} with ${objects.length} objects`);
    
    const loadPromises = objects.map(obj => this.loadObject(obj));
    const loadedObjects = await Promise.all(loadPromises);
    
    console.log(`[TileLoader] Tile ${tileId} loaded: ${loadedObjects.filter(o => o.isLoaded).length} successful, ${loadedObjects.filter(o => o.error).length} errors`);
    
    return {
      objects: loadedObjects
    };
  }

  /**
   * Load a single object model
   * @param placedObject Object placement data
   * @returns Promise<LoadedObject> with mesh reference
   */
  private static async loadObject(placedObject: PlacedTileObject): Promise<LoadedObject> {
    const { modelId } = placedObject;
    
    try {
      // Check cache first
      const cachedModel = this.modelCache.get(modelId);
      if (cachedModel) {
        console.log(`[TileLoader] Using cached model: ${modelId}`);
        const clonedMesh = this.cloneModel(cachedModel);
        return {
          placedObject,
          mesh: clonedMesh,
          isLoaded: true
        };
      }

      // Check if already loading
      const existingPromise = this.loadingPromises.get(modelId);
      if (existingPromise) {
        console.log(`[TileLoader] Awaiting existing load: ${modelId}`);
        const loadedModel = await existingPromise;
        const clonedMesh = this.cloneModel(loadedModel);
        return {
          placedObject,
          mesh: clonedMesh,
          isLoaded: true
        };
      }

      // Start new load
      const modelPath = this.getModelPath(modelId);
      console.log(`[TileLoader] Loading model: ${modelPath}`);
      
      const loadPromise = this.loadGLTF(modelPath);
      this.loadingPromises.set(modelId, loadPromise);

      const loadedModel = await loadPromise;
      
      // Cache the loaded model
      this.modelCache.set(modelId, loadedModel);
      this.loadingPromises.delete(modelId);

      // Clone for this instance
      const clonedMesh = this.cloneModel(loadedModel);
      
      return {
        placedObject,
        mesh: clonedMesh,
        isLoaded: true
      };

    } catch (error) {
      console.warn(`[TileLoader] Failed to load ${modelId}:`, error);
      
      // Create fallback primitive
      const fallbackMesh = this.createFallbackMesh(placedObject);
      
      return {
        placedObject,
        mesh: fallbackMesh,
        isLoaded: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get the model path for a model ID
   * Maps our model ids to actual file paths
   */
  private static getModelPath(modelId: string): string {
    // Simple mapping for now - in production, use a proper mapping system
    // Map tree_1 to tree_1_A_Color1.gltf, etc.
    if (modelId.startsWith('tree_')) {
      const variant = modelId.split('_')[1];
      return `/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/tree_${variant}/Tree_${variant}_A_Color1.gltf`;
    }
    
    if (modelId.startsWith('rock_')) {
      const variant = modelId.split('_')[1];
      return `/assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/rock_${variant}/Rock_${variant}_A_Color1.gltf`;
    }

    // For now, return a path that will 404 - we'll add proper flower assets later
    console.warn(`[TileLoader] Unknown model ID: ${modelId}, using fallback`);
    throw new Error(`Unknown model: ${modelId}`);
  }

  /**
   * Load GLTF model from path
   */
  private static loadGLTF(path: string): Promise<Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          console.log(`[TileLoader] Successfully loaded: ${path}`);
          resolve(gltf.scene);
        },
        (progress) => {
          // Progress callback
          if (progress.loaded && progress.total) {
            const percent = (progress.loaded / progress.total) * 100;
            console.log(`[TileLoader] Loading ${path}: ${percent.toFixed(1)}%`);
          }
        },
        (error) => {
          console.error(`[TileLoader] Failed to load ${path}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Clone a model for per-instance use
   */
  private static cloneModel(original: Group): Group {
    return original.clone();
  }

  /**
   * Create a fallback primitive mesh when model loading fails
   */
  private static createFallbackMesh(placedObject: any): Group {
    const { type } = placedObject;
    const group = new Group();
    
    // Create simple colored boxes as fallbacks
    // In production, you'd use proper primitive geometries
    console.log(`[TileLoader] Created fallback mesh for: ${placedObject.modelId}`);
    
    return group;
  }

  /**
   * Clear model cache (useful for memory management)
   */
  static clearCache() {
    this.modelCache.clear();
    this.loadingPromises.clear();
    Cache.clear();
    console.log('[TileLoader] Model cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats() {
    return {
      cachedModels: this.modelCache.size,
      activeLoads: this.loadingPromises.size
    };
  }
}