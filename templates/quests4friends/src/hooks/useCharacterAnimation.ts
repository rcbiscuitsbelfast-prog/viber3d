import { useEffect, useState, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { animationManager } from '../systems/animation/AnimationManager';
import { animationSetLoader } from '../systems/animation/AnimationSetLoader';

interface UseCharacterAnimationOptions {
  characterId: string;
  assetId: string;
  model: THREE.Object3D | null;
  defaultAnimation?: string;
}

/**
 * Hook to manage character animations
 * Handles loading animation sets and provides controls for playback
 */
export function useCharacterAnimation({
  characterId,
  assetId,
  model,
  defaultAnimation = 'idle',
}: UseCharacterAnimationOptions) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentAnimation, setCurrentAnimation] = useState<string | null>(null);
  const animationsRef = useRef<Record<string, THREE.AnimationClip> | null>(null);
  const hasAutoPlayedRef = useRef(false);

  // Load animations when model is ready
  useEffect(() => {
    if (!model) {
      console.log(`[useCharacterAnimation] No model yet for ${characterId}`);
      return;
    }
    
    // Reset auto-play flag when model changes
    hasAutoPlayedRef.current = false;
    setIsLoaded(false);

    let mounted = true;

    const loadAnimations = async () => {
      try {
        console.log(`[useCharacterAnimation] Loading animations for ${characterId} (assetId: ${assetId})`);
        
        // Load animation set for this character
        let animations = await animationSetLoader.loadCharacterAnimations(assetId);
        
        if (!mounted) {
          console.log(`[useCharacterAnimation] Component unmounted, skipping animation registration`);
          return;
        }

        const animationKeys = Object.keys(animations);
        console.log(`[useCharacterAnimation] Loaded ${animationKeys.length} animations for ${characterId}:`, animationKeys);

        if (animationKeys.length === 0) {
          console.warn(`[useCharacterAnimation] No animations loaded for character ${characterId} (${assetId})`);
          
          // Create a fallback idle animation - freeze the model in current pose
          const idleClip = new THREE.AnimationClip('idle', 0, []);
          animations = { idle: idleClip };
          console.warn(`[useCharacterAnimation] Created fallback idle animation (model will remain static)`);
        }

        // Register character with animation manager
        animationManager.registerCharacter(characterId, model, animations);
        animationsRef.current = animations;
        console.log(`[useCharacterAnimation] Registered ${characterId} with ${Object.keys(animations).length} animations`);

        // Play default animation
        if (defaultAnimation && animations[defaultAnimation]) {
          console.log(`[useCharacterAnimation] Playing default animation '${defaultAnimation}' for ${characterId}`);
          animationManager.playAnimation(characterId, defaultAnimation, { loop: true });
          setCurrentAnimation(defaultAnimation);
          hasAutoPlayedRef.current = true;
        } else {
          // Find any available animation to play
          const availableAnims = Object.keys(animations);
          if (availableAnims.length > 0) {
            // Prefer idle, walk, run - otherwise use first available
            const fallbackAnim = availableAnims.find(a => 
              a.toLowerCase().includes('idle') || 
              a.toLowerCase().includes('walk') ||
              a.toLowerCase().includes('run')
            ) || availableAnims[0];
            
            console.log(`[useCharacterAnimation] Default animation '${defaultAnimation}' not found, using '${fallbackAnim}' instead for ${characterId}`);
            animationManager.playAnimation(characterId, fallbackAnim, { loop: true });
            setCurrentAnimation(fallbackAnim);
            hasAutoPlayedRef.current = true;
          } else {
            console.warn(`[useCharacterAnimation] No animations available for character ${characterId}`);
          }
        }

        setIsLoaded(true);
      } catch (error) {
        console.error(`[useCharacterAnimation] Failed to load animations for ${characterId}:`, error);
        setIsLoaded(true);
      }
    };

    loadAnimations();

    return () => {
      mounted = false;
      // Cleanup on unmount
      animationManager.unregisterCharacter(characterId);
    };
  }, [characterId, assetId, model, defaultAnimation]);

  /**
   * Play an animation
   */
  const playAnimation = useCallback((
    animationName: string,
    options?: {
      loop?: boolean;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      timeScale?: number;
    }
  ): boolean => {
    if (!isLoaded) {
      console.warn(`Animations not loaded yet for ${characterId}`);
      return false;
    }

    if (!animationsRef.current) {
      // No animations available - create procedural animation fallback
      console.warn(`No animation clips for ${characterId}, creating procedural motion`);
      return false;
    }

    if (!animationsRef.current[animationName]) {
      console.warn(`Animation ${animationName} not found for ${characterId}, available:`, Object.keys(animationsRef.current));
      return false;
    }

    animationManager.playAnimation(characterId, animationName, options);
    setCurrentAnimation(animationName);
    return true;
  }, [characterId, isLoaded]);

  /**
   * Crossfade to an animation
   */
  const crossfadeTo = useCallback((animationName: string, duration: number = 0.3): void => {
    if (!isLoaded || !animationsRef.current) return;

    if (!animationsRef.current[animationName]) {
      console.warn(`Animation ${animationName} not found for ${characterId}`);
      return;
    }

    animationManager.crossfadeToAnimation(characterId, animationName, duration);
    setCurrentAnimation(animationName);
  }, [characterId, isLoaded]);

  /**
   * Stop current animation
   */
  const stopAnimation = useCallback((): void => {
    animationManager.stopAnimation(characterId);
    setCurrentAnimation(null);
  }, [characterId]);

  /**
   * Get available animation names
   */
  const getAvailableAnimations = useCallback((): string[] => {
    return animationsRef.current ? Object.keys(animationsRef.current) : [];
  }, []);

  /**
   * Check if an animation is loaded and available
   */
  const hasAnimation = useCallback((name: string): boolean => {
    return animationsRef.current ? name in animationsRef.current : false;
  }, []);

  return {
    isLoaded,
    currentAnimation,
    playAnimation,
    crossfadeTo,
    stopAnimation,
    availableAnimations: getAvailableAnimations(),
    hasAnimation,
  };
}
