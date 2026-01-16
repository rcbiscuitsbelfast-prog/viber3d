import { useEffect, useState, useRef } from 'react';
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

  // Load animations when model is ready
  useEffect(() => {
    if (!model) return;

    let mounted = true;

    const loadAnimations = async () => {
      try {
        // Load animation set for this character
        const animations = await animationSetLoader.loadCharacterAnimations(assetId);
        
        if (!mounted) return;

        if (Object.keys(animations).length === 0) {
          console.warn(`No animations loaded for character ${characterId} (${assetId})`);
          setIsLoaded(true);
          return;
        }

        // Register character with animation manager
        animationManager.registerCharacter(characterId, model, animations);
        animationsRef.current = animations;

        // Play default animation
        if (defaultAnimation && animations[defaultAnimation]) {
          animationManager.playAnimation(characterId, defaultAnimation, { loop: true });
          setCurrentAnimation(defaultAnimation);
        }

        setIsLoaded(true);
        console.log(`Animations loaded for ${characterId}:`, Object.keys(animations));
      } catch (error) {
        console.error(`Failed to load animations for ${characterId}:`, error);
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
  const playAnimation = (
    animationName: string,
    options?: {
      loop?: boolean;
      fadeInDuration?: number;
      fadeOutDuration?: number;
      timeScale?: number;
    }
  ): void => {
    if (!isLoaded || !animationsRef.current) {
      console.warn(`Animations not loaded for ${characterId}`);
      return;
    }

    if (!animationsRef.current[animationName]) {
      console.warn(`Animation ${animationName} not found for ${characterId}`);
      return;
    }

    animationManager.playAnimation(characterId, animationName, options);
    setCurrentAnimation(animationName);
  };

  /**
   * Crossfade to an animation
   */
  const crossfadeTo = (animationName: string, duration: number = 0.3): void => {
    if (!isLoaded || !animationsRef.current) return;

    if (!animationsRef.current[animationName]) {
      console.warn(`Animation ${animationName} not found for ${characterId}`);
      return;
    }

    animationManager.crossfadeToAnimation(characterId, animationName, duration);
    setCurrentAnimation(animationName);
  };

  /**
   * Stop current animation
   */
  const stopAnimation = (): void => {
    animationManager.stopAnimation(characterId);
    setCurrentAnimation(null);
  };

  /**
   * Get available animation names
   */
  const getAvailableAnimations = (): string[] => {
    return animationsRef.current ? Object.keys(animationsRef.current) : [];
  };

  return {
    isLoaded,
    currentAnimation,
    playAnimation,
    crossfadeTo,
    stopAnimation,
    availableAnimations: getAvailableAnimations(),
  };
}
