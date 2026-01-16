import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * AnimationLoader - Loads animation clips from GLB files
 * KayKit animations are stored as separate GLB files containing animation data
 */
export class AnimationLoader {
  private static instance: AnimationLoader;
  private loader: GLTFLoader;
  private animationCache: Map<string, THREE.AnimationClip[]> = new Map();
  private loadingPromises: Map<string, Promise<THREE.AnimationClip[]>> = new Map();

  private constructor() {
    this.loader = new GLTFLoader();
  }

  static getInstance(): AnimationLoader {
    if (!AnimationLoader.instance) {
      AnimationLoader.instance = new AnimationLoader();
    }
    return AnimationLoader.instance;
  }

  /**
   * Load animation clips from a GLB file
   */
  async loadAnimations(path: string): Promise<THREE.AnimationClip[]> {
    // Check cache first
    if (this.animationCache.has(path)) {
      return this.animationCache.get(path)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(path)) {
      return this.loadingPromises.get(path)!;
    }

    // Create loading promise
    const loadingPromise = new Promise<THREE.AnimationClip[]>((resolve, reject) => {
      this.loader.load(
        path,
        (gltf) => {
          const animations = gltf.animations || [];
          
          console.log(`Loaded ${animations.length} animation clips from ${path}:`, 
            animations.map(a => a.name));
          
          // Cache the animations
          this.animationCache.set(path, animations);
          
          // Clean up loading promise
          this.loadingPromises.delete(path);
          
          resolve(animations);
        },
        undefined,
        (error) => {
          console.error(`Failed to load animations from ${path}:`, error);
          this.loadingPromises.delete(path);
          reject(error);
        }
      );
    });

    this.loadingPromises.set(path, loadingPromise);
    return loadingPromise;
  }

  /**
   * Load and map multiple animation files
   */
  async loadAnimationSet(animationPaths: Record<string, string>): Promise<Record<string, THREE.AnimationClip>> {
    const results: Record<string, THREE.AnimationClip> = {};
    
    for (const [animName, path] of Object.entries(animationPaths)) {
      try {
        const clips = await this.loadAnimations(path);
        // Use the first clip from the file (KayKit animations typically have one clip per file)
        if (clips.length > 0) {
          results[animName] = clips[0];
        }
      } catch (error) {
        console.warn(`Failed to load animation ${animName} from ${path}:`, error);
      }
    }
    
    return results;
  }

  /**
   * Get a specific animation clip by name from a loaded file
   */
  getAnimationClip(path: string, clipName: string): THREE.AnimationClip | null {
    const clips = this.animationCache.get(path);
    if (!clips) return null;
    
    return clips.find(clip => clip.name === clipName) || null;
  }

  /**
   * Clear animation cache
   */
  clearCache() {
    this.animationCache.clear();
    console.log('Animation cache cleared');
  }
}

// Export singleton instance
export const animationLoader = AnimationLoader.getInstance();
