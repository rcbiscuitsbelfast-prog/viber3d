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

    // First, load all GLB files that contain animations
    const loadedFileClips: Record<string, THREE.AnimationClip[]> = {};
    
    for (const [fileKey, fileName] of Object.entries(animationSet.files)) {
      const path = `${animationDatabase.basePath}/${fileName}`;
      try {
        const clips = await animationLoader.loadAnimations(path);
        loadedFileClips[fileKey] = clips;
      } catch (error) {
        console.error(`Failed to load animation file ${fileName}:`, error);
      }
    }

    // Map animation names to clips
    const animations: Record<string, THREE.AnimationClip> = {};
    
    for (const [animName, config] of Object.entries(animationSet.animations)) {
      const fileClips = loadedFileClips[config.file];
      
      if (!fileClips) {
        console.warn(`Animation file ${config.file} not loaded for ${animName}`);
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
      } else {
        console.warn(`Could not find animation clip for ${animName}`);
      }
    }

    // Cache the loaded set
    this.loadedSets.set(setName, animations);
    
    console.log(`Loaded ${Object.keys(animations).length} animations for set ${setName}:`, 
      Object.keys(animations));
    
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
   * Clear cached animation sets
   */
  clearCache(): void {
    this.loadedSets.clear();
    console.log('Animation set cache cleared');
  }
}

// Export singleton instance
export const animationSetLoader = AnimationSetLoader.getInstance();
