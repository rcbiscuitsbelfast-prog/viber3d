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

  // Track previous model to detect actual changes
  const previousModelRef = useRef<THREE.Object3D | null>(null);

  // Load animations when model is ready
  useEffect(() => {
    if (!model) {
      console.log(`[useCharacterAnimation] No model yet for ${characterId}`);
      return;
    }
    
    // If model hasn't actually changed (same object reference), don't re-register
    if (previousModelRef.current === model) {
      console.log(`[useCharacterAnimation] Model unchanged for ${characterId}, skipping re-registration`);
      return;
    }
    
    // Model has changed - update ref and proceed
    previousModelRef.current = model;
    
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

        // Check if model has bones - important for debugging Quaternius vs KayKit compatibility
        let boneCount = 0;
        const sampleBones: string[] = [];
        model.traverse((child) => {
          if (child instanceof THREE.Bone) {
            boneCount++;
            if (sampleBones.length < 5) {
              sampleBones.push(child.name || 'unnamed');
            }
          }
        });
        
        console.log(`[useCharacterAnimation] Model ${characterId} has ${boneCount} bones`);
        if (boneCount === 0) {
          console.warn(`[useCharacterAnimation] ⚠️ Model ${assetId} has no armature/bones - animations will not work!`);
        } else {
          console.log(`[useCharacterAnimation] Sample bone names:`, sampleBones);
        }

        // Check if model has built-in animations (for self-contained models)
        if (animationKeys.length === 0) {
          console.log(`[useCharacterAnimation] No external animations loaded, checking for built-in animations...`);
          
          // Try to get animations from the model's userData (stored by AnimatedCharacter)
          const modelAnimations: Record<string, THREE.AnimationClip> = {};
          
          if (model.userData.builtInAnimations && Array.isArray(model.userData.builtInAnimations)) {
            model.userData.builtInAnimations.forEach((clip: THREE.AnimationClip, index: number) => {
              const animName = clip.name || `animation_${index}`;
              modelAnimations[animName] = clip;
              console.log(`  Found built-in animation: ${animName} (${clip.duration.toFixed(2)}s, ${clip.tracks.length} tracks)`);
            });
          }
          
          if (Object.keys(modelAnimations).length > 0) {
            console.log(`[useCharacterAnimation] Using ${Object.keys(modelAnimations).length} built-in animations from model`);
            animations = modelAnimations;
          } else {
            console.warn(`[useCharacterAnimation] No animations found for character ${characterId} (${assetId})`);
            
            // Create a fallback idle animation - freeze the model in current pose
            const idleClip = new THREE.AnimationClip('idle', 0, []);
            animations = { idle: idleClip };
            console.log(`[useCharacterAnimation] Created static idle animation for ${characterId}`);
          }
        }

        // Register character with animation manager
        animationManager.registerCharacter(characterId, model, animations);
        animationsRef.current = animations;
        console.log(`[useCharacterAnimation] Registered ${characterId} with ${Object.keys(animations).length} animations`);

        // Play default animation immediately with full weight
        if (defaultAnimation && animations[defaultAnimation]) {
          console.log(`[useCharacterAnimation] Playing default animation '${defaultAnimation}' for ${characterId}`);
          const action = animationManager.playAnimation(characterId, defaultAnimation, { 
            loop: true,
            fadeInDuration: 0 // No fade in for initial animation to prevent T-pose
          });
          if (action) {
            action.setEffectiveWeight(1.0); // Ensure full weight immediately
          }
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
            const action = animationManager.playAnimation(characterId, fallbackAnim, { 
              loop: true,
              fadeInDuration: 0 // No fade in for initial animation
            });
            if (action) {
              action.setEffectiveWeight(1.0); // Ensure full weight immediately
            }
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
      // Don't unregister here - only unregister on component unmount (handled by cleanup effect below)
      // This prevents unregistering when model changes but component stays mounted
    };
  }, [characterId, assetId, model, defaultAnimation]);
  
  // Separate cleanup effect for component unmounting only
  useEffect(() => {
    return () => {
      // This cleanup only runs when the component unmounts (characterId changes or component removed)
      // Unregister the character to clean up the animation mixer
      animationManager.unregisterCharacter(characterId);
    };
  }, [characterId]); // Only depend on characterId - this will run when component unmounts or characterId changes

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
