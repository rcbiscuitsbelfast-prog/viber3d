import { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader, GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import { cloneGltf } from '../utils/cloneGltf';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { animationManager } from '../systems/animation/AnimationManager';

interface AnimatedCharacterProps {
  characterPath: string;
  assetId: string;
  characterId: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
  currentAnimation?: string;
  weaponPath?: string;
  shieldPath?: string;
  onAnimationsLoaded?: (animations: string[]) => void;
}

export default function AnimatedCharacter({
  characterPath,
  assetId,
  characterId,
  scale = 1,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  currentAnimation,
  weaponPath,
  shieldPath,
  onAnimationsLoaded,
}: AnimatedCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const modelLoadedRef = useRef(false);
  const characterIdRef = useRef(characterId);
  const weaponLoadedRef = useRef<string | null>(null);
  const shieldLoadedRef = useRef<string | null>(null);

  // Load character model - only once per character
  useEffect(() => {
    if (!groupRef.current) return;
    
    // If character ID changed, reset the loaded flag
    if (characterIdRef.current !== characterId) {
      modelLoadedRef.current = false;
      characterIdRef.current = characterId;
    }

    // Skip if already loaded for this character
    if (modelLoadedRef.current) return;

    const loadCharacter = async () => {
      try {
        console.log(`[AnimatedCharacter] Loading character: ${characterPath}`);
        
        let gltf: GLTF;
        const isFBX = characterPath.endsWith('.fbx');
        
        if (isFBX) {
          console.log('Loading FBX model (Humanoid Rig Version)');
          const fbxLoader = new FBXLoader();
          const fbxModel = await new Promise<THREE.Group>((resolve, reject) => {
            fbxLoader.load(characterPath, resolve, undefined, reject);
          });
          
          // Convert FBX to GLTF-like structure
          gltf = {
            scene: fbxModel,
            animations: fbxModel.animations || [],
            scenes: [fbxModel],
            cameras: [],
            asset: {},
            parser: {} as any,
            userData: {}
          } as GLTF;
        } else {
          console.log('Loading glTF model');
          const gltfLoader = new GLTFLoader();
          gltf = await new Promise<GLTF>((resolve, reject) => {
            gltfLoader.load(characterPath, resolve, undefined, reject);
          });
        }

        console.log(`✓ Character model loaded:`, characterPath);
        console.log(`  - Model animations:`, gltf.animations.length);
        console.log(`  - Asset ID:`, assetId);

        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        
        // Store built-in animations in the scene's userData so they can be accessed later
        if (gltf.animations && gltf.animations.length > 0) {
          characterScene.userData.builtInAnimations = gltf.animations;
          console.log(`  - Stored ${gltf.animations.length} built-in animations in scene.userData`);
        }
        
        // Debug bone structure for Quaternius vs KayKit compatibility
        let boneCount = 0;
        const sampleBones: string[] = [];
        characterScene.traverse((child) => {
          if (child instanceof THREE.Bone) {
            boneCount++;
            if (sampleBones.length < 10) {
              sampleBones.push(child.name || 'unnamed');
            }
          }
        });
        
        console.log(`  - Model bones:`, boneCount);
        if (boneCount > 0) {
          console.log(`  - Sample bone names:`, sampleBones);
        } else {
          console.warn(`  - ⚠️ No bones found in model! This might explain why animations don't work.`);
        }
        
        groupRef.current!.clear();
        groupRef.current!.add(characterScene);
        
        // Auto-scale model to fit in viewport
        const box = new THREE.Box3().setFromObject(characterScene);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetSize = 4; // Target size in world units (doubled from 2)
        const autoScale = maxDim > 0 ? targetSize / maxDim : 1;
        const finalScale = scale * autoScale;
        
        characterScene.scale.setScalar(finalScale);
        
        // Position model so its bottom is on the ground (y=0)
        box.setFromObject(characterScene); // Recalculate after scaling
        const min = box.min;
        characterScene.position.set(0, -min.y, 0);
        characterScene.rotation.set(rotation[0], rotation[1], rotation[2]);
        
        console.log(`  - Auto-scaled: original size=${maxDim.toFixed(2)}, scale=${finalScale.toFixed(2)}, bottom at y=${min.y.toFixed(2)}`);
        characterScene.visible = true;
        characterScene.traverse((child: any) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setModel(characterScene);
        modelLoadedRef.current = true;
        console.log(`[AnimatedCharacter] Character loaded successfully`);
      } catch (error) {
        console.error('[AnimatedCharacter] Failed to load character:', error);
      }
    };

    loadCharacter();
  }, [characterPath, scale, rotation, characterId]);

  // Separate effect to handle weapon loading/changing
  useEffect(() => {
    if (!model) return;

    // Remove existing weapon if weaponPath changed
    if (weaponLoadedRef.current && weaponLoadedRef.current !== weaponPath) {
      console.log(`[AnimatedCharacter] Removing previous weapon`);
      model.traverse((node: any) => {
        if (node instanceof THREE.Bone) {
          const weaponsToRemove = node.children.filter((child: any) => 
            child.userData.isWeapon || child.name.includes('weapon')
          );
          weaponsToRemove.forEach((weapon: any) => node.remove(weapon));
        }
      });
      weaponLoadedRef.current = null;
    }

    // Load new weapon if specified
    if (weaponPath && weaponLoadedRef.current !== weaponPath) {
      const loadWeapon = async () => {
        try {
          console.log(`[AnimatedCharacter] Loading weapon: ${weaponPath}`);
          const gltfLoader = new GLTFLoader();
          const weaponGltf = await new Promise<GLTF>((resolve, reject) => {
            gltfLoader.load(weaponPath, resolve, undefined, reject);
          });

          const weapon = weaponGltf.scene.clone();
          weapon.userData.isWeapon = true;
          weapon.traverse((child: any) => {
            child.castShadow = true;
            child.receiveShadow = true;
          });
          
          // Find right hand bone
          let handBone: THREE.Bone | null = null;
          const boneNames = ['handslotr', 'handr', 'hand.r', 'Hand_R', 'hand_right', 'righthand'];
          
          model.traverse((node: any) => {
            if (handBone) return;
            if (node instanceof THREE.Bone) {
              const nodeName = node.name.toLowerCase();
              if (boneNames.some(name => nodeName === name.toLowerCase())) {
                handBone = node;
                console.log(`[AnimatedCharacter] Found hand bone: ${node.name}`);
              }
            }
          });

          if (handBone) {
            // Adjust weapon positioning based on type
            const isBow = weaponPath.includes('bow');
            const isStaff = weaponPath.includes('staff');
            
            if (isBow) {
              weapon.scale.setScalar(0.5);
              weapon.position.set(0.05, 0.1, 0);
              weapon.rotation.set(Math.PI, Math.PI, 0); // Rotate bow 180 degrees on X and Y
            } else if (isStaff) {
              weapon.scale.setScalar(0.6);
              weapon.position.set(0.05, 0, 0);
              weapon.rotation.set(0, 0, Math.PI / 4);
            } else {
              weapon.scale.setScalar(0.5);
              weapon.position.set(0.05, 0, 0);
              weapon.rotation.set(0, 0, Math.PI / 4);
            }
            
            (handBone as THREE.Object3D).add(weapon);
            weaponLoadedRef.current = weaponPath;
            console.log(`[AnimatedCharacter] ✓ Weapon attached successfully`);
          } else {
            console.warn(`[AnimatedCharacter] Could not find hand bone for weapon`);
          }
        } catch (error) {
          console.error('[AnimatedCharacter] Failed to load weapon:', error);
        }
      };

      loadWeapon();
    } else if (!weaponPath && weaponLoadedRef.current) {
      // Remove weapon if weaponPath is undefined
      console.log(`[AnimatedCharacter] Removing weapon (none selected)`);
      model.traverse((node: any) => {
        if (node instanceof THREE.Bone) {
          const weaponsToRemove = node.children.filter((child: any) => 
            child.userData.isWeapon
          );
          weaponsToRemove.forEach((weapon: any) => node.remove(weapon));
        }
      });
      weaponLoadedRef.current = null;
    }
  }, [weaponPath, model]);

  // Separate effect to handle shield loading/changing (left hand)
  useEffect(() => {
    if (!model) return;

    // Remove existing shield if shieldPath changed
    if (shieldLoadedRef.current && shieldLoadedRef.current !== shieldPath) {
      console.log(`[AnimatedCharacter] Removing previous shield`);
      model.traverse((node: any) => {
        if (node instanceof THREE.Bone) {
          const shieldsToRemove = node.children.filter((child: any) => 
            child.userData.isShield
          );
          shieldsToRemove.forEach((shield: any) => node.remove(shield));
        }
      });
      shieldLoadedRef.current = null;
    }

    // Load new shield if specified
    if (shieldPath && shieldLoadedRef.current !== shieldPath) {
      const loadShield = async () => {
        try {
          console.log(`[AnimatedCharacter] Loading shield: ${shieldPath}`);
          const gltfLoader = new GLTFLoader();
          const shieldGltf = await new Promise<GLTF>((resolve, reject) => {
            gltfLoader.load(shieldPath, resolve, undefined, reject);
          });

          const shield = shieldGltf.scene.clone();
          shield.userData.isShield = true;
          shield.traverse((child: any) => {
            child.castShadow = true;
            child.receiveShadow = true;
          });
          
          // Find left hand bone
          let leftHandBone: THREE.Bone | null = null;
          const leftBoneNames = ['handslotl', 'handl', 'hand.l', 'Hand_L', 'hand_left', 'lefthand'];
          
          model.traverse((node: any) => {
            if (leftHandBone) return;
            if (node instanceof THREE.Bone) {
              const nodeName = node.name.toLowerCase();
              if (leftBoneNames.some(name => nodeName === name.toLowerCase())) {
                leftHandBone = node;
                console.log(`[AnimatedCharacter] Found left hand bone: ${node.name}`);
              }
            }
          });

          if (leftHandBone) {
            shield.scale.setScalar(0.5);
            shield.position.set(-0.05, 0, 0);
            shield.rotation.set(Math.PI, Math.PI, 0); // Rotate shield 180 degrees on X and Y
            (leftHandBone as THREE.Object3D).add(shield);
            shieldLoadedRef.current = shieldPath;
            console.log(`[AnimatedCharacter] ✓ Shield attached successfully`);
          } else {
            console.warn(`[AnimatedCharacter] Could not find left hand bone for shield`);
          }
        } catch (error) {
          console.error('[AnimatedCharacter] Failed to load shield:', error);
        }
      };

      loadShield();
    } else if (!shieldPath && shieldLoadedRef.current) {
      // Remove shield if shieldPath is undefined
      console.log(`[AnimatedCharacter] Removing shield (none selected)`);
      model.traverse((node: any) => {
        if (node instanceof THREE.Bone) {
          const shieldsToRemove = node.children.filter((child: any) => 
            child.userData.isShield
          );
          shieldsToRemove.forEach((shield: any) => node.remove(shield));
        }
      });
      shieldLoadedRef.current = null;
    }
  }, [shieldPath, model]);

  // Use character animation hook
  const { crossfadeTo, isLoaded: animationsLoaded, hasAnimation } = useCharacterAnimation({
    characterId,
    assetId,
    model,
    defaultAnimation: 'idle',
  });

  // Notify parent when animations loaded
  useEffect(() => {
    if (animationsLoaded && onAnimationsLoaded) {
      const animations = animationManager.getAnimations(characterId);
      if (animations) {
        const animationNames = Object.keys(animations);
        onAnimationsLoaded(animationNames);
      }
    }
  }, [animationsLoaded, characterId, onAnimationsLoaded]);

  // Handle animation switching
  useEffect(() => {
    if (!animationsLoaded || !model || !currentAnimation) return;

    if (hasAnimation(currentAnimation)) {
      crossfadeTo(currentAnimation, 0.3);
    }
  }, [currentAnimation, animationsLoaded, model, crossfadeTo, hasAnimation]);

  // Update mixer every frame
  useFrame((_, delta) => {
    animationManager.update(delta);
  });

  return <group ref={groupRef} position={position} />;
}

