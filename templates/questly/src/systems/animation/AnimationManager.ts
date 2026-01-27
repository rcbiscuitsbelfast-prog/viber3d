import * as THREE from 'three';

/**
 * AnimationManager - Manages THREE.AnimationMixer instances for all characters
 * Singleton that handles animation playback, blending, and updates
 */
export class AnimationManager {
  private static instance: AnimationManager;
  private mixers: Map<string, THREE.AnimationMixer> = new Map();
  private activeActions: Map<string, THREE.AnimationAction> = new Map();
  private animationClips: Map<string, Record<string, THREE.AnimationClip>> = new Map();

  private constructor() {}

  static getInstance(): AnimationManager {
    if (!AnimationManager.instance) {
      AnimationManager.instance = new AnimationManager();
    }
    return AnimationManager.instance;
  }

  /**
   * Register a new character with its animation clips
   */
  registerCharacter(
    characterId: string,
    model: THREE.Object3D,
    animations: Record<string, THREE.AnimationClip>
  ): THREE.AnimationMixer {
    // Create mixer for this character
    const mixer = new THREE.AnimationMixer(model);
    
    this.mixers.set(characterId, mixer);
    this.animationClips.set(characterId, animations);
    
    console.log(`Registered character ${characterId} with animations:`, Object.keys(animations));
    
    return mixer;
  }

  /**
   * Play an animation for a character
   */
  playAnimation(
    characterId: string,
    animationName: string,
    options: {
      loop?: boolean;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      timeScale?: number;
      disableRootMotion?: boolean;
    } = {}
  ): THREE.AnimationAction | null {
    const mixer = this.mixers.get(characterId);
    const animations = this.animationClips.get(characterId);
    
    if (!mixer || !animations) {
      console.warn(`Character ${characterId} not registered in AnimationManager`);
      return null;
    }

    const clip = animations[animationName];
    if (!clip) {
      console.warn(`Animation ${animationName} not found for character ${characterId}`);
      return null;
    }

    const action = mixer.clipAction(clip);
    
    // Configure action
    action.loop = options.loop !== false ? THREE.LoopRepeat : THREE.LoopOnce;
    action.clampWhenFinished = !options.loop; // Clamp when not looping
    action.timeScale = options.timeScale || 1.0;
    action.enabled = true; // Ensure action is enabled

    // Disable root motion for animations that move the character off-screen
    const shouldDisableRootMotion = options.disableRootMotion || 
      animationName.toLowerCase().match(/turn|strafe|sidestep|shuffle/);
    
    if (shouldDisableRootMotion && action.getClip().tracks.length > 0) {
      // Store original tracks
      const originalClip = action.getClip();
      const newTracks = originalClip.tracks.filter((track: any) => {
        // Remove root position tracks that cause off-screen movement
        return !track.name.match(/\.position|\.quaternion/) || !track.name.includes('Root');
      });
      
      if (newTracks.length < originalClip.tracks.length) {
        const modifiedClip = new THREE.AnimationClip(originalClip.name, originalClip.duration, newTracks);
        const modifiedAction = mixer.clipAction(modifiedClip);
        modifiedAction.loop = action.loop;
        modifiedAction.clampWhenFinished = action.clampWhenFinished;
        modifiedAction.timeScale = action.timeScale;
        modifiedAction.enabled = true;
        
        // Replace the action
        action.stop();
        
        // Stop current action and fade to new one
        const currentActionKey = `${characterId}_current`;
        const currentAction = this.activeActions.get(currentActionKey);
        
        if (currentAction && currentAction !== modifiedAction) {
          if (options.fadeOutDuration) {
            currentAction.fadeOut(options.fadeOutDuration);
          } else {
            currentAction.stop();
          }
        }
        
        modifiedAction.reset();
        modifiedAction.setEffectiveTimeScale(1.0);
        modifiedAction.setEffectiveWeight(1.0);
        
        if (options.fadeInDuration && options.fadeInDuration > 0 && currentAction && currentAction !== modifiedAction) {
          modifiedAction.fadeIn(options.fadeInDuration);
        }
        
        modifiedAction.play();
        this.activeActions.set(currentActionKey, modifiedAction);
        return modifiedAction;
      }
    }

    // Stop current action and fade to new one
    const currentActionKey = `${characterId}_current`;
    const currentAction = this.activeActions.get(currentActionKey);
    
    if (currentAction && currentAction !== action) {
      if (options.fadeOutDuration) {
        currentAction.fadeOut(options.fadeOutDuration);
      } else {
        currentAction.stop();
      }
    }

    // Start new action with proper weight
    action.reset();
    action.setEffectiveTimeScale(1.0);
    action.setEffectiveWeight(1.0);
    
    if (options.fadeInDuration && options.fadeInDuration > 0 && currentAction && currentAction !== action) {
      action.fadeIn(options.fadeInDuration);
    }
    
    action.play();

    // Track active action
    this.activeActions.set(currentActionKey, action);
    
    return action;
  }

  /**
   * Crossfade between animations
   */
  crossfadeToAnimation(
    characterId: string,
    toAnimationName: string,
    duration: number = 0.3
  ): void {
    this.playAnimation(characterId, toAnimationName, {
      fadeInDuration: duration,
      fadeOutDuration: duration,
    });
  }

  /**
   * Stop animation for a character
   */
  stopAnimation(characterId: string): void {
    const currentActionKey = `${characterId}_current`;
    const currentAction = this.activeActions.get(currentActionKey);
    
    if (currentAction) {
      currentAction.stop();
      this.activeActions.delete(currentActionKey);
    }
  }

  /**
   * Get the current animation action for a character
   */
  getCurrentAction(characterId: string): THREE.AnimationAction | null {
    const currentActionKey = `${characterId}_current`;
    return this.activeActions.get(currentActionKey) || null;
  }

  /**
   * Update all animation mixers (call this every frame)
   */
  update(deltaTime: number): void {
    this.mixers.forEach((mixer) => {
      mixer.update(deltaTime);
    });
  }

  /**
   * Unregister a character and cleanup its mixer
   */
  unregisterCharacter(characterId: string): void {
    const mixer = this.mixers.get(characterId);
    if (mixer) {
      mixer.stopAllAction();
      this.mixers.delete(characterId);
      this.animationClips.delete(characterId);
      
      const currentActionKey = `${characterId}_current`;
      this.activeActions.delete(currentActionKey);
      
      console.log(`Unregistered character ${characterId}`);
    }
  }

  /**
   * Get mixer for a character (for advanced usage)
   */
  getMixer(characterId: string): THREE.AnimationMixer | null {
    return this.mixers.get(characterId) || null;
  }

  /**
   * Get animations for a character
   */
  getAnimations(characterId: string): Record<string, THREE.AnimationClip> | null {
    return this.animationClips.get(characterId) || null;
  }

  /**
   * Check if a character is registered
   */
  hasCharacter(characterId: string): boolean {
    return this.mixers.has(characterId);
  }

  /**
   * Get all registered character IDs
   */
  getRegisteredCharacters(): string[] {
    return Array.from(this.mixers.keys());
  }

  /**
   * Cleanup all mixers
   */
  dispose(): void {
    this.mixers.forEach((mixer) => mixer.stopAllAction());
    this.mixers.clear();
    this.activeActions.clear();
    this.animationClips.clear();
    console.log('AnimationManager disposed');
  }
}

// Export singleton instance
export const animationManager = AnimationManager.getInstance();
