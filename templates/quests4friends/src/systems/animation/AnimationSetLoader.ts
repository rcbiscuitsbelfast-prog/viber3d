import * as THREE from 'three';
import { animationLoader } from './AnimationLoader';
import animationDatabase from '../../data/kaykit-animations.json';

interface AnimationConfig {
  file: string;
  clipName: string;
  loop?: boolean;
  clampWhenFinished?: boolean;
  description?: string;
}

interface AnimationSet {
  name: string;
  description: string;
  files: Record<string, string>;
  animations: Record<string, AnimationConfig>;
}

/**
 * AnimationSetLoader - Loads complete animation sets for characters
 * Uses the kaykit-animations.json database to map animations to characters
 */
export class AnimationSetLoader {
  private static instance: AnimationSetLoader;
  private loadedSets: Map<string, Record<string, THREE.AnimationClip>> = new Map();

  private constructor() {}

  static getInstance(): AnimationSetLoader {
    if (!AnimationSetLoader.instance) {
      AnimationSetLoader.instance = new AnimationSetLoader();
    }
    return AnimationSetLoader.instance;
  }

  /**
   * Get the base path for animation files
   * Supports both regular and large rig animations
   */
  private getBasePath(setName: string): string {
    // Check if this set uses the large rig base path
    if (setName.includes('large') || setName === 'large_humanoid') {
      return (animationDatabase as any).basePathLarge || 
             (animationDatabase as any).basePath?.replace('Rig_Medium', 'Rig_Large') ||
             '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Large';
    }
    return (animationDatabase as any).basePath || 
           '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium';
  }

  /**
   * Load all animations for a character based on their asset ID
   */
  async loadCharacterAnimations(assetId: string): Promise<Record<string, THREE.AnimationClip>> {
    // Get the animation set name for this character
    const setName = (animationDatabase.characterMappings as Record<string, string>)[assetId];
    
    if (!setName) {
      console.warn(`No animation mapping found for character: ${assetId}`);
      return {};
    }

    // Check if already loaded
    if (this.loadedSets.has(setName)) {
      console.log(`Using cached animation set: ${setName}`);
      return this.loadedSets.get(setName)!;
    }

    console.log(`Loading animation set: ${setName} for character: ${assetId}`);
    
    return this.loadAnimationSet(setName);
  }

  /**
   * Load a specific animation set by name
   */
  async loadAnimationSet(setName: string): Promise<Record<string, THREE.AnimationClip>> {
    const animationSet = (animationDatabase.animationSets as Record<string, AnimationSet>)[setName];
    
    if (!animationSet) {
      console.error(`Animation set not found: ${setName}`);
      return {};
    }

    const basePath = this.getBasePath(setName);
    
    // First, load all GLB files that contain animations
    const loadedFileClips: Record<string, THREE.AnimationClip[]> = {};
    
    for (const [fileKey, fileName] of Object.entries(animationSet.files)) {
      const path = `${basePath}/${fileName}`;
      try {
        const clips = await animationLoader.loadAnimations(path);
        loadedFileClips[fileKey] = clips;
        console.log(`Loaded ${clips.length} clips from ${fileName}`);
      } catch (error) {
        console.warn(`Failed to load animation file ${fileName}:`, error);
        // Try with .glb extension if not already
        if (!fileName.endsWith('.glb')) {
          try {
            const pathWithExt = `${basePath}/${fileName}.glb`;
            const clips = await animationLoader.loadAnimations(pathWithExt);
            loadedFileClips[fileKey] = clips;
            console.log(`Loaded ${clips.length} clips from ${fileName}.glb`);
          } catch (e) {
            console.warn(`Also failed to load ${fileName}.glb`);
          }
        }
      }
    }

    // Map animation names to clips
    const animations: Record<string, THREE.AnimationClip> = {};
    let loadedCount = 0;
    let failedCount = 0;

    for (const [animName, config] of Object.entries(animationSet.animations)) {
      const fileClips = loadedFileClips[config.file];
      
      if (!fileClips || fileClips.length === 0) {
        console.warn(`Animation file ${config.file} not loaded for ${animName}, trying fallback...`);
        failedCount++;
        
        // Try finding in any other loaded file as fallback
        for (const [key, clips] of Object.entries(loadedFileClips)) {
          // Try finding clip by partial name match
          const clip = clips.find((c: THREE.AnimationClip) => 
            c.name.toLowerCase().includes(config.clipName.toLowerCase()) ||
            config.clipName.toLowerCase().includes(c.name.toLowerCase())
          );
          
          if (clip) {
            animations[animName] = clip;
            loadedCount++;
            console.log(`Found fallback clip for ${animName} in ${key}: ${clip.name}`);
            break;
          }
        }
        continue;
      }

      // Find clip by name (case-insensitive search)
      let clip = fileClips.find((c: THREE.AnimationClip) => 
        c.name.toLowerCase() === config.clipName.toLowerCase()
      );

      // If not found, try finding by partial match
      if (!clip) {
        clip = fileClips.find((c: THREE.AnimationClip) => 
          c.name.toLowerCase().includes(config.clipName.toLowerCase()) ||
          config.clipName.toLowerCase().includes(c.name.toLowerCase())
        );
      }

      // If still not found, use first clip as fallback
      if (!clip && fileClips.length > 0) {
        console.warn(
          `Clip "${config.clipName}" not found in ${config.file}. Available clips:`,
          fileClips.map((c: THREE.AnimationClip) => c.name),
          `Using first clip as fallback.`
        );
        clip = fileClips[0];
      }

      if (clip) {
        animations[animName] = clip;
        loadedCount++;
      } else {
        console.warn(`Could not find animation clip for ${animName}`);
        failedCount++;
      }
    }

    // Cache the loaded set
    this.loadedSets.set(setName, animations);
    
    console.log(`Animation set ${setName} summary:`, {
      totalAnimations: Object.keys(animationSet.animations).length,
      loaded: loadedCount,
      failed: failedCount,
      available: Object.keys(animations)
    });
    
    return animations;
  }

  /**
   * Get animation configuration
   */
  getAnimationConfig(setName: string, animName: string): AnimationConfig | null {
    const animationSet = (animationDatabase.animationSets as Record<string, AnimationSet>)[setName];
    if (!animationSet) return null;
    
    return animationSet.animations[animName] || null;
  }

  /**
   * Get all available animation names for a character
   */
  getAvailableAnimations(assetId: string): string[] {
    const setName = (animationDatabase.characterMappings as Record<string, string>)[assetId];
    if (!setName) return [];
    
    const animationSet = (animationDatabase.animationSets as Record<string, AnimationSet>)[setName];
    if (!animationSet) return [];
    
    return Object.keys(animationSet.animations);
  }

  /**
   * Get the animation set name for a character
   */
  getAnimationSetName(assetId: string): string | null {
    return (animationDatabase.characterMappings as Record<string, string>)[assetId] || null;
  }

  /**
   * Check if an animation exists for a character
   */
  hasAnimation(assetId: string, animationName: string): boolean {
    const animations = this.loadedSets.get(assetId);
    if (animations) {
      return animationName in animations;
    }
    
    // Check if defined in config
    const setName = (animationDatabase.characterMappings as Record<string, string>)[assetId];
    if (!setName) return false;
    
    const animationSet = (animationDatabase.animationSets as Record<string, AnimationSet>)[setName];
    if (!animationSet) return false;
    
    return animationName in animationSet.animations;
  }

  /**
   * Clear cached animation sets
   */
  clearCache(): void {
    this.loadedSets.clear();
    animationLoader.clearCache();
    console.log('Animation set cache cleared');
  }
}

// Export singleton instance
export const animationSetLoader = AnimationSetLoader.getInstance();
