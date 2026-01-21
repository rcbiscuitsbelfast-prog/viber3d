// @ts-nocheck
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { animationManager } from '../systems/animation/AnimationManager';
import { cameraOcclusionManager } from '../systems/camera/CameraOcclusionManager';

// ==================== Constants ====================
const BLANK_TILE_ID = '__blank_grass__';

// ==================== GLTF Utils (from clear_the_dungeon) ====================
// This properly clones models with skeleton binding

function cloneGltf(gltf: GLTF): GLTF {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
  } as GLTF;

  const skinnedMeshes: Record<string, THREE.SkinnedMesh> = {};

  gltf.scene.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) skinnedMeshes[node.name] = node;
  });

  const cloneBones: Record<string, THREE.Bone> = {};
  const cloneSkinnedMeshes: Record<string, THREE.SkinnedMesh> = {};

  clone.scene.traverse((node) => {
    if (node instanceof THREE.Bone) cloneBones[node.name] = node;
    if (node instanceof THREE.SkinnedMesh) cloneSkinnedMeshes[node.name] = node;
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones: THREE.Bone[] = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);
  }

  return clone;
}

// ==================== Animation Updater ====================

function AnimationUpdater() {
  useFrame((_state, delta) => {
    animationManager.update(delta);
  });
  return null;
}

// ==================== Character Component ====================

interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface CameraSettings {
  pitch: number; // Camera pitch angle in radians (0 to PI/2)
  zoom: number; // Camera distance from character
}

interface CharacterModelProps {
  input: CharacterInput;
  cameraSettings: CameraSettings;
  placedAssets: Array<{ position: [number, number, number]; scale: number; type: string }>;
  groundTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  worldSize: number;
}

function CharacterModel({ input, cameraSettings, placedAssets, groundTiles, worldSize }: CharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const verticalVelocityRef = useRef(0); // For jump physics
  const isGroundedRef = useRef(true);
  const directionRef = useRef<'idle' | 'walk' | 'run'>('idle');
  const { camera } = useThree();

  // Load character model (NO ANIMATIONS - animations are in separate files)
  useEffect(() => {
    if (!groupRef.current) return;

    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        console.log('[CharacterModel] Loading Rogue.glb (character model only, no animations)...');
        
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
            (data) => {
              console.log('[CharacterModel] Character model loaded (animations will load separately)');
              resolve(data);
            },
            undefined,
            (err) => {
              console.error('[CharacterModel] Load error:', err);
              reject(err);
            }
          );
        });

        // Use proper cloning with skeleton binding (like clear_the_dungeon)
        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        
        // Clear and add model
        groupRef.current!.clear();
        groupRef.current!.add(characterScene);
        characterScene.scale.setScalar(1.5);

        // Ensure model is visible and positioned correctly
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;
        characterScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Set model for animation hook - use the scene directly
        setModel(characterScene);
        console.log('[CharacterModel] ✓ Character model ready, animations loading...');
      } catch (error) {
        console.error('[CharacterModel] ❌ Failed to load character:', error);
      }
    };

    loadCharacter();
  }, []);

  // Use the existing animation hook - it loads animations from SEPARATE files
  const { crossfadeTo, isLoaded: animationsLoaded, hasAnimation } = useCharacterAnimation({
    characterId: 'minimal-demo-player',
    assetId: 'char_rogue', // Maps to humanoid_basic animation set in kaykit-animations.json
    model: model,
    defaultAnimation: 'idle',
  });

  // Determine movement direction and update animations
  useEffect(() => {
    if (!animationsLoaded || !model) {
      console.log('[CharacterModel] Waiting for animations or model...', { animationsLoaded, hasModel: !!model });
      return;
    }

    let newDirection: typeof directionRef.current = 'idle';

    if (input.forward) {
      newDirection = hasAnimation('run') ? 'run' : 'walk';
    } else if (input.backward || input.left || input.right) {
      newDirection = 'walk'; // Use walk for any movement
    }

    // Only update if direction changed
    if (newDirection !== directionRef.current) {
      directionRef.current = newDirection;
      console.log(`[CharacterModel] Changing animation to: ${newDirection}`);
      
      if (hasAnimation(newDirection)) {
        crossfadeTo(newDirection, 0.2);
      } else if (hasAnimation('walk')) {
        crossfadeTo('walk', 0.2);
      } else if (hasAnimation('idle')) {
        crossfadeTo('idle', 0.2);
      } else {
        console.warn('[CharacterModel] No animations available!');
      }
    }
  }, [input, animationsLoaded, model, crossfadeTo, hasAnimation]);

  // Update movement and camera (isometric)
  useFrame((_state, dt) => {
    if (!groupRef.current) return;

    // Update camera occlusion - make trees between camera and player see-through
    const playerPosition = groupRef.current.position.clone();
    playerPosition.y += 1.5; // Player head height
    cameraOcclusionManager.updateOcclusion(camera.position, playerPosition, _state.scene);

    // Fixed isometric movement vectors (camera is always at 45° angle)
    // This prevents floating-point errors from recalculating camera direction every frame
    const moveSpeed = 5;
    const moveDir = new THREE.Vector3();
    
    // Isometric camera at 45° means:
    // - Forward (away from camera) = diagonal toward -X, -Z
    // - Right (perpendicular) = diagonal toward +X, -Z
    const SQRT2_INV = 0.7071067811865476; // 1/sqrt(2) for normalized 45° vectors
    
    // Forward/Backward: move along the camera's view axis
    if (input.forward) {
      moveDir.x -= moveSpeed * SQRT2_INV; // Move away from camera (negative X)
      moveDir.z -= moveSpeed * SQRT2_INV; // Move away from camera (negative Z)
    } else if (input.backward) {
      moveDir.x += moveSpeed * SQRT2_INV; // Move toward camera (positive X)
      moveDir.z += moveSpeed * SQRT2_INV; // Move toward camera (positive Z)
    }

    // Left/Right: move perpendicular to camera view
    if (input.left) {
      moveDir.x -= moveSpeed * SQRT2_INV; // Move left (negative X)
      moveDir.z += moveSpeed * SQRT2_INV; // Move left (positive Z)
    } else if (input.right) {
      moveDir.x += moveSpeed * SQRT2_INV; // Move right (positive X)
      moveDir.z -= moveSpeed * SQRT2_INV; // Move right (negative Z)
    }

    // Store velocity for rotation and animations
    velocityRef.current.copy(moveDir);

    // Jump physics
    const JUMP_FORCE = 8.0;
    const GRAVITY = -25.0;
    
    if (input.jump && isGroundedRef.current) {
      verticalVelocityRef.current = JUMP_FORCE;
      isGroundedRef.current = false;
    }
    
    // Apply gravity
    verticalVelocityRef.current += GRAVITY * dt;

    // Calculate new position
    const movementDelta = moveDir.clone().multiplyScalar(dt);
    const newPosition = groupRef.current.position.clone().add(movementDelta);
    
    // Get terrain elevation at new position
    const terrainWorldSize = 100;
    const terrainTileSize = 1;
    const terrainWorldRadius = terrainWorldSize / 2;
    const gridX = Math.floor((newPosition.x + terrainWorldRadius) / terrainTileSize);
    const gridZ = Math.floor((newPosition.z + terrainWorldRadius) / terrainTileSize);
    const key = `${gridX},${gridZ}`;
    const tile = groundTiles.get(key);
    
    // Calculate smooth elevation from surrounding tiles
    let terrainElevation = 0;
    if (tile) {
      terrainElevation = tile.elevation;
    } else {
      // Sample from nearby tiles for smooth interpolation
      const nearbyKeys = [
        `${gridX},${gridZ}`,
        `${gridX + 1},${gridZ}`,
        `${gridX - 1},${gridZ}`,
        `${gridX},${gridZ + 1}`,
        `${gridX},${gridZ - 1}`,
      ];
      let totalElevation = 0;
      let count = 0;
      nearbyKeys.forEach(k => {
        const t = groundTiles.get(k);
        if (t) {
          totalElevation += t.elevation;
          count++;
        }
      });
      terrainElevation = count > 0 ? totalElevation / count : 0;
    }
    
    // Set Y position with jump physics
    const targetY = terrainElevation + 0.5;
    newPosition.y = groupRef.current.position.y + (verticalVelocityRef.current * dt);
    
    // Check if landed on ground
    if (newPosition.y <= targetY) {
      newPosition.y = targetY;
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    }
    
    // Check collision with placed assets (3D box collision)
    const playerRadius = 0.8;
    const playerHeight = 2.0; // Player capsule height
    let collision = false;
    
    for (const asset of placedAssets) {
      if (!asset.position || asset.scale <= 0) continue;
      
      // For blocks (Kenny blocks): use full 3D box collision
      if (asset.type && asset.type.includes('block')) {
        // Block dimensions: ~1x1x1 at scale 1, so 3-4 units at scale 3-4
        const blockHalfSize = (asset.scale || 3.0) * 0.5;
        const blockY = asset.position[1] || 0;
        
        // Check 3D box collision (AABB)
        const dx = Math.abs(asset.position[0] - newPosition.x);
        const dy = Math.abs(blockY + blockHalfSize - newPosition.y);
        const dz = Math.abs(asset.position[2] - newPosition.z);
        
        if (dx < (blockHalfSize + playerRadius) && 
            dy < (blockHalfSize + playerHeight * 0.5) && 
            dz < (blockHalfSize + playerRadius)) {
          collision = true;
          break;
        }
      } else {
        // Other assets: use cylindrical collision (legacy)
        const baseRadius = asset.type === 'tree' ? 1.5 : 0.8;
        const assetRadius = asset.scale * baseRadius;
        
        const dx = asset.position[0] - newPosition.x;
        const dz = asset.position[2] - newPosition.z;
        const distSq = dx * dx + dz * dz;
        const minDist = playerRadius + assetRadius;
        
        if (distSq < minDist * minDist) {
          collision = true;
          break;
        }
      }
    }
          
    // Apply movement based on collision
    if (!collision) {
      // Direct copy for responsive movement (no lerp)
      groupRef.current.position.copy(newPosition);
    } else {
      // Keep current position on collision (no sliding to prevent glitches)
      groupRef.current.position.y = newPosition.y; // Still update Y for terrain following
    }

    // Clamp position to world bounds
    const clampWorldSize = (worldSize || 100) / 2;
    groupRef.current.position.x = THREE.MathUtils.clamp(groupRef.current.position.x, -clampWorldSize, clampWorldSize);
    groupRef.current.position.z = THREE.MathUtils.clamp(groupRef.current.position.z, -clampWorldSize, clampWorldSize);

    // Isometric camera follows character
    const angle = Math.PI * 0.25;
    const distance = cameraSettings.zoom;
    const height = Math.sin(cameraSettings.pitch) * distance;
    const horizontalDistance = Math.cos(cameraSettings.pitch) * distance;
    
    const charPosition = groupRef.current.position;

    camera.position.x = charPosition.x + Math.sin(angle) * horizontalDistance;
    camera.position.y = charPosition.y + height;
    camera.position.z = charPosition.z + Math.cos(angle) * horizontalDistance;
    camera.lookAt(charPosition.x, charPosition.y + 0.5, charPosition.z);

    // Smooth character rotation toward movement direction
    if (velocityRef.current.lengthSq() > 0.01) {
      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      
      // Normalize angle difference to prevent 360° spins
      let currentRotation = groupRef.current.rotation.y;
      let angleDiff = targetRotation - currentRotation;
      
      // Wrap to [-PI, PI] range
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      // Apply smooth rotation
      groupRef.current.rotation.y += angleDiff * 0.15;
    }
  });

  return <group ref={groupRef} position={[0, 0, 0]} />;
}

// ==================== Placed Asset Component ====================

interface PlacedAssetProps {
  assetType: string;
  position: [number, number, number];
  rotation?: number; // Y rotation in radians
  scale?: number;
  id?: string; // For occlusion manager registration
}

function PlacedAsset({ assetType, position, rotation = 0, scale = 1.0, id }: PlacedAssetProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [assetScene, setAssetScene] = useState<THREE.Group | null>(null);

  // Tree variants
  const treeVariants = [
    'Tree_1_A_Color1', 'Tree_1_B_Color1', 'Tree_1_C_Color1',
    'Tree_2_A_Color1', 'Tree_2_B_Color1', 'Tree_2_C_Color1', 'Tree_2_D_Color1', 'Tree_2_E_Color1',
    'Tree_3_A_Color1', 'Tree_3_B_Color1', 'Tree_3_C_Color1',
    'Tree_4_A_Color1', 'Tree_4_B_Color1', 'Tree_4_C_Color1',
    'Tree_Bare_1_A_Color1', 'Tree_Bare_1_B_Color1', 'Tree_Bare_1_C_Color1',
    'Tree_Bare_2_A_Color1', 'Tree_Bare_2_B_Color1', 'Tree_Bare_2_C_Color1',
  ];

  // Rock variants
  const rockVariants = [
    'Rock_1_A_Color1', 'Rock_1_B_Color1', 'Rock_1_C_Color1', 'Rock_1_D_Color1', 'Rock_1_E_Color1',
    'Rock_1_F_Color1', 'Rock_1_G_Color1', 'Rock_1_H_Color1', 'Rock_1_I_Color1', 'Rock_1_J_Color1',
    'Rock_1_K_Color1', 'Rock_1_L_Color1', 'Rock_1_M_Color1', 'Rock_1_N_Color1', 'Rock_1_O_Color1',
    'Rock_1_P_Color1', 'Rock_1_Q_Color1',
    'Rock_2_A_Color1', 'Rock_2_B_Color1', 'Rock_2_C_Color1', 'Rock_2_D_Color1', 'Rock_2_E_Color1',
    'Rock_2_F_Color1', 'Rock_2_G_Color1', 'Rock_2_H_Color1',
    'Rock_3_A_Color1', 'Rock_3_B_Color1', 'Rock_3_C_Color1', 'Rock_3_D_Color1', 'Rock_3_E_Color1',
    'Rock_3_F_Color1', 'Rock_3_G_Color1', 'Rock_3_H_Color1', 'Rock_3_I_Color1', 'Rock_3_J_Color1',
    'Rock_3_K_Color1', 'Rock_3_L_Color1', 'Rock_3_M_Color1', 'Rock_3_N_Color1', 'Rock_3_O_Color1',
    'Rock_3_P_Color1', 'Rock_3_Q_Color1', 'Rock_3_R_Color1',
  ];

  // Select random variant once when component mounts (stable per instance)
  const variantName = useMemo(() => {
    if (assetType === 'tree') {
      return treeVariants[Math.floor(Math.random() * treeVariants.length)];
    } else if (assetType === 'rock') {
      return rockVariants[Math.floor(Math.random() * rockVariants.length)];
    }
    return null;
  }, [assetType]); // Only recalculate if assetType changes

  useEffect(() => {
    if (!variantName) {
      console.warn(`[PlacedAsset] Unknown asset type: ${assetType}`);
      return;
    }

    const loader = new GLTFLoader();
    const assetPath = `/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/${variantName}.gltf`;

          loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(scale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
            
            // Register with occlusion manager if ID provided
            if (id) {
              cameraOcclusionManager.registerObject(id, child);
            }
          }
        });
        setAssetScene(cloned);
      },
            undefined,
      (error) => console.warn(`[PlacedAsset] Failed to load ${variantName}:`, error)
    );

    // Cleanup: unregister from occlusion manager
    return () => {
      if (id) {
        cameraOcclusionManager.unregisterObject(id);
      }
    };
  }, [variantName, scale, id]);

  if (!assetScene) {
    // Placeholder colors by type
    const placeholderColor = assetType === 'tree' ? '#2d5016' : '#666666';
    return (
      <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
        <mesh>
          <boxGeometry args={[1, assetType === 'rock' ? 0.5 : 2, 1]} />
          <meshStandardMaterial color={placeholderColor} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={assetScene} />
    </group>
  );
}

// ==================== Loaded World Mesh Component ====================

function LoadedWorldMesh({ mesh }: { mesh: THREE.Group | null }) {
  if (!mesh) return null;
  
  // Offset mesh Y position so block top surfaces align with ground plane (y=0)
  // Kenny blocks are ~1 unit tall at scale 1
  // With scale 3-4x, blocks are 3-4 units tall, so offset by -4.5 to align tops at y=0
  mesh.position.y = -4.5;
  
  return (
    <primitive object={mesh} />
  );
}

// ==================== Base Grass Instanced (shared across all pages) ====================
// REMOVED - using individual GrassBlock components instead

// ==================== Merged Terrain Mesh Component ====================
// REMOVED - using individual GrassBlock components instead

// ==================== Merged Water Mesh Component ====================

interface MergedWaterProps {
  waterTiles: Array<{ key: string; position: [number, number]; elevation: number }>;
  tileSize: number;
  worldSize: number;
}

function MergedWater({ waterTiles, tileSize, worldSize }: MergedWaterProps) {
  const waterRef = useRef<THREE.Mesh>(null);

  // Create merged water mesh
  const waterGeometry = useMemo(() => {
    if (waterTiles.length === 0) return null;
    
    const geometries: THREE.BufferGeometry[] = [];
    
    waterTiles.forEach(tile => {
      const [x, z] = tile.position;
      const worldRadius = worldSize / 2;
      const worldX = (x * tileSize) - worldRadius + (tileSize / 2);
      const worldZ = (z * tileSize) - worldRadius + (tileSize / 2);
      
      const geom = new THREE.PlaneGeometry(tileSize, tileSize);
      geom.translate(worldX, worldZ, 0);
      geometries.push(geom);
    });
    
    if (geometries.length === 0) return null;
    
    // Merge all water geometries using BufferGeometryUtils
    const merged = BufferGeometryUtils.mergeGeometries(geometries);
    merged.rotateX(-Math.PI / 2);
    
    return merged;
  }, [waterTiles, tileSize, worldSize]);

  useFrame((state) => {
    if (waterRef.current && waterGeometry) {
      // Subtle wave animation
      const time = state.clock.getElapsedTime();
      const positions = waterGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        const baseY = positions[i + 1];
        positions[i + 1] = baseY + Math.sin(time * 0.5 + positions[i] + positions[i + 2]) * 0.02;
      }
      waterGeometry.attributes.position.needsUpdate = true;
    }
  });

  if (!waterGeometry) return null;

  return (
    <mesh ref={waterRef} geometry={waterGeometry}>
      <meshStandardMaterial 
        color="#1e90ff" 
        metalness={0.3}
        roughness={0.2}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}


// ==================== Grass Patch Component ====================

function GrassPatch({ position, rotation, type, scale }: { position: [number, number, number]; rotation: number; type: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [grassScene, setGrassScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        // Use provided scale, or random variation if not provided (for backward compatibility)
        const finalScale = scale !== undefined ? scale : (0.8 + Math.random() * 0.4);
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });
        setGrassScene(cloned);
      },
      undefined,
      (error) => {
        // Silently fail if texture doesn't load
        console.warn(`Failed to load grass: ${type}`, error);
      }
    );
  }, [type, scale]);

  if (!grassScene) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={grassScene} />
    </group>
  );
}

// ==================== Base Grass Carpet (dense tiny grass) - REMOVED, using BaseGrassInstanced instead ====================
// Removed GrassCarpet - using BaseGrassInstanced instead

// ==================== Flat Ground Base Plane ====================
// REMOVED - replaced with individual grass blocks

// ==================== Ocean Water Component ====================
function OceanWater({ worldSize }: { worldSize: number }) {
  const waterRef = useRef<THREE.Mesh>(null);
  const oceanSize = worldSize * 4; // Large ocean extending far beyond island

  useFrame((state) => {
    if (waterRef.current) {
      const time = state.clock.getElapsedTime();
      // Subtle wave effect
      (waterRef.current.material as THREE.MeshStandardMaterial).roughness = 0.2 + Math.sin(time * 0.5) * 0.05;
    }
  });

  return (
    <mesh
      ref={waterRef}
      position={[0, -1.5, 0]} // Below ground level
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[oceanSize, oceanSize, 50, 50]} />
      <meshStandardMaterial 
        color="#1e6ba8"
        metalness={0.4}
        roughness={0.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ==================== Island Cliff Edges Component ====================
function IslandCliffEdges({ worldSize }: { worldSize: number }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  
  // Load rock/cliff texture
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      '/Assets/Stylized Nature MegaKit[Standard]/Textures/Rock_01.png',
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(worldSize / 4, 1); // Repeat texture along cliff length
        setTexture(loadedTexture);
      },
      undefined,
      (error) => {
        console.warn('Failed to load cliff texture, using fallback color:', error);
      }
    );
  }, [worldSize]);

  const cliffGeometry = useMemo(() => {
    const halfSize = worldSize / 2;
    const cliffHeight = 3; // Taller cliff for more dramatic effect
    const geometries: THREE.BufferGeometry[] = [];
    
    // Create 4 cliff walls with proper UV mapping
    // North wall (positive Z)
    const northWall = new THREE.PlaneGeometry(worldSize, cliffHeight, 10, 1);
    northWall.translate(0, -cliffHeight / 2, halfSize);
    northWall.rotateY(Math.PI);
    geometries.push(northWall);
    
    // South wall (negative Z)
    const southWall = new THREE.PlaneGeometry(worldSize, cliffHeight, 10, 1);
    southWall.translate(0, -cliffHeight / 2, -halfSize);
    geometries.push(southWall);
    
    // East wall (positive X)
    const eastWall = new THREE.PlaneGeometry(worldSize, cliffHeight, 10, 1);
    eastWall.translate(halfSize, -cliffHeight / 2, 0);
    eastWall.rotateY(Math.PI / 2);
    geometries.push(eastWall);
    
    // West wall (negative X)
    const westWall = new THREE.PlaneGeometry(worldSize, cliffHeight, 10, 1);
    westWall.translate(-halfSize, -cliffHeight / 2, 0);
    westWall.rotateY(-Math.PI / 2);
    geometries.push(westWall);
    
    return BufferGeometryUtils.mergeGeometries(geometries);
  }, [worldSize]);

  return (
    <mesh geometry={cliffGeometry} castShadow receiveShadow>
      <meshStandardMaterial 
        map={texture || undefined}
        color={texture ? '#ffffff' : '#6b5a4a'}
        roughness={0.95}
        metalness={0.1}
      />
    </mesh>
  );
}

// ==================== Crashing Waves Component ====================
function CrashingWaves({ worldSize }: { worldSize: number }) {
  const wavesRef = useRef<THREE.Group>(null);
  
  // Create wave particles along each edge
  const waveParticles = useMemo(() => {
    const particles: Array<{
      position: THREE.Vector3;
      offset: number; // Time offset for lag effect
      edge: 'north' | 'south' | 'east' | 'west';
    }> = [];
    
    const halfSize = worldSize / 2;
    const spacing = 2; // Space between wave particles
    const numParticles = Math.floor(worldSize / spacing);
    
    // North edge
    for (let i = 0; i < numParticles; i++) {
      const x = -halfSize + (i * spacing);
      particles.push({
        position: new THREE.Vector3(x, -1.2, halfSize),
        offset: i * 0.3, // Stagger the waves
        edge: 'north'
      });
    }
    
    // South edge
    for (let i = 0; i < numParticles; i++) {
      const x = -halfSize + (i * spacing);
      particles.push({
        position: new THREE.Vector3(x, -1.2, -halfSize),
        offset: i * 0.3 + 1.5,
        edge: 'south'
      });
    }
    
    // East edge
    for (let i = 0; i < numParticles; i++) {
      const z = -halfSize + (i * spacing);
      particles.push({
        position: new THREE.Vector3(halfSize, -1.2, z),
        offset: i * 0.3 + 3,
        edge: 'east'
      });
    }
    
    // West edge
    for (let i = 0; i < numParticles; i++) {
      const z = -halfSize + (i * spacing);
      particles.push({
        position: new THREE.Vector3(-halfSize, -1.2, z),
        offset: i * 0.3 + 4.5,
        edge: 'west'
      });
    }
    
    return particles;
  }, [worldSize]);
  
  // Animate waves with lag
  useFrame((state) => {
    if (!wavesRef.current) return;
    
    const time = state.clock.getElapsedTime();
    
    wavesRef.current.children.forEach((wave, index) => {
      const particle = waveParticles[index];
      if (!particle) return;
      
      // Wave animation with offset for lag effect
      const animTime = time * 2 + particle.offset;
      const waveHeight = Math.sin(animTime) * 0.15;
      const scale = 0.8 + Math.sin(animTime * 1.5) * 0.3;
      const opacity = Math.abs(Math.sin(animTime)) * 0.6 + 0.2;
      
      wave.position.y = particle.position.y + waveHeight;
      wave.scale.setScalar(scale);
      
      if ((wave as THREE.Mesh).material) {
        ((wave as THREE.Mesh).material as THREE.MeshStandardMaterial).opacity = opacity;
      }
    });
  });
  
  return (
    <group ref={wavesRef}>
      {waveParticles.map((particle, i) => (
        <mesh
          key={i}
          position={[particle.position.x, particle.position.y, particle.position.z]}
        >
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial
            color="#e0f4ff"
            transparent
            opacity={0.6}
            emissive="#b0d8f0"
            emissiveIntensity={0.3}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// ==================== Small Rock Component ====================

function SmallRock({ position, rotation, variant, scale }: { position: [number, number, number]; rotation: number; variant: string; scale?: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rockScene, setRockScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${variant}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        // Use provided scale, or random variation if not provided (for backward compatibility)
        const finalScale = scale !== undefined ? scale : (0.4 + Math.random() * 0.3);
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false; // Ensure they render
          }
        });
        setRockScene(cloned);
      },
      undefined,
      (error) => {
        console.warn(`Failed to load rock: ${variant}`, error);
      }
    );
  }, [variant, scale]);

  if (!rockScene) {
    // Show placeholder while loading
    return (
      <mesh position={position}>
        <sphereGeometry args={[0.15, 6, 6]} />
        <meshStandardMaterial color="#666666" />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={rockScene} />
    </group>
  );
}

// ==================== Grass Block Component ====================

function GrassBlock({ position, elevation }: { position: [number, number, number]; elevation: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const [blockScene, setBlockScene] = useState<THREE.Group | null>(null);
  
  // Grass block variants from Kenny assets
  const grassVariants = ['Grass_1', 'Grass_2', 'Grass_3', 'Grass_Flower', 'Grass_Tall'];
  const variant = useMemo(() => grassVariants[Math.floor(Math.random() * grassVariants.length)], []);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${variant}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(1.0);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.frustumCulled = false;
          }
        });
        setBlockScene(cloned);
      },
      undefined,
      (error) => {
        console.warn(`[GrassBlock] Failed to load ${variant}:`, error);
      }
    );
  }, [variant]);

  if (!blockScene) {
    return (
      <mesh position={position}>
        <boxGeometry args={[1, Math.max(0.3, elevation + 0.3), 1]} />
        <meshStandardMaterial color="#3d6b2d" />
      </mesh>
    );
  }

  return (
    <group ref={groupRef} position={position}>
      <primitive object={blockScene} />
    </group>
  );
}

// ==================== Tree Component (for existing trees) ====================

function Tree({ position }: { position: [number, number, number] }) {
  return <PlacedAsset assetType="tree" position={position} />;
}

// ==================== World Painter Component ====================

function WorldPainter({ 
  onConfirm, 
  onClose,
  mode,
  setMode
}: { 
  onConfirm: (canvas: HTMLCanvasElement, elevationCanvas?: HTMLCanvasElement) => void; 
  onClose: () => void;
  mode: 'base' | 'elevation';
  setMode: (m: 'base' | 'elevation') => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [baseCanvas, setBaseCanvas] = useState<HTMLCanvasElement | null>(null);
  const [brushSize, setBrushSize] = useState(20);

  const canvasSize = 512;
  const greenShades = ['#2ecc71', '#27ae60', '#16a085', '#1abc9c'];
  const elevationShades = ['#90EE90', '#7CCD7C', '#76D776', '#85C585'];

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Fill with light gray background
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    // Draw grid
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const gridSize = 16;
    for (let i = 0; i <= canvasSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }
  }, []);

  const getShades = () => mode === 'base' ? greenShades : elevationShades;
  const shades = getShades();

  const paintShape = (x: number, y: number) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Random shape: circle or blob
    const shapeType = Math.random();
    const color = shades[Math.floor(Math.random() * shades.length)];
    ctx.fillStyle = color;

    if (shapeType < 0.5) {
      // Circle
      ctx.beginPath();
      ctx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Blob (random squiggles)
      ctx.beginPath();
      ctx.moveTo(x, y);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const radius = (brushSize / 2) * (0.7 + Math.random() * 0.3);
        const px = x + Math.cos(angle) * radius;
        const py = y + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      paintShape(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      paintShape(x, y);
    }
  };

  const handleMouseUp = () => setIsDrawing(false);

  const handleClear = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#efefef';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    const gridSize = 16;
    for (let i = 0; i <= canvasSize; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvasSize);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(canvasSize, i);
      ctx.stroke();
    }
  };

  const handleConfirm = () => {
    if (mode === 'base') {
      // Save base canvas and switch to elevation mode
      setBaseCanvas(canvasRef.current);
      handleClear();
      setMode('elevation');
    } else {
      // Both layers done - confirm
      onConfirm(baseCanvas!, canvasRef.current!);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
    }}>
      <div style={{
        background: '#222',
        padding: '30px',
        borderRadius: '10px',
        color: 'white',
        textAlign: 'center',
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '20px' }}>
          {mode === 'base' ? '🎨 Paint Base Layer (Green)' : '⛰️ Paint Elevation Layer (Light Green)'}
        </h2>
        <p style={{ fontSize: '12px', color: '#aaa', marginBottom: '10px' }}>
          {mode === 'base' 
            ? 'Paint green shapes where you want land. Click & drag to paint.' 
            : 'Paint light green shapes where you want higher elevation.'}
        </p>
        <canvas
          ref={canvasRef}
          width={canvasSize}
          height={canvasSize}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            border: '2px solid #555',
            cursor: 'crosshair',
            display: 'block',
            margin: '0 auto 15px',
            backgroundColor: '#efefef',
          }}
        />
        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <label style={{ fontSize: '12px' }}>
            Brush Size: {brushSize}
            <input
              type="range"
              min="5"
              max="60"
              value={brushSize}
              onChange={(e) => setBrushSize(parseInt(e.target.value))}
              style={{ marginLeft: '10px', width: '100px' }}
            />
          </label>
          <button
            onClick={handleClear}
            style={{
              padding: '8px 15px',
              background: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
            }}
          >
            Clear
          </button>
        </div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '10px 20px',
              background: mode === 'base' ? '#3498db' : '#2ecc71',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: 'bold',
            }}
          >
            {mode === 'base' ? 'Next: Elevation →' : '✓ Create World'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== Environment ====================

interface EnvironmentProps {
  groundTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  defaultTerrainTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  worldSize: number;
}

function Environment({ groundTiles, defaultTerrainTiles, worldSize }: EnvironmentProps) {
  const tileSize = 1;

  // Merge user-painted tiles with default tiles
  const allTiles = useMemo(() => {
    const merged = new Map(defaultTerrainTiles);
    groundTiles.forEach((value, key) => {
      merged.set(key, value);
    });
    return merged;
  }, [defaultTerrainTiles, groundTiles]);

  // Generate individual grass blocks at each tile position
  const grassBlocks = useMemo(() => {
    const result: Array<{ key: string; position: [number, number, number]; elevation: number }> = [];
    const worldRadius = worldSize / 2;
    const gridSize = Math.floor(worldSize / tileSize);
    
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const key = `${gx},${gz}`;
        const tile = allTiles.get(key);
        
        // Render grass blocks for grass tiles only
        if (tile && tile.type === 'grass') {
          const worldX = (gx * tileSize) - worldRadius + (tileSize / 2);
          const worldZ = (gz * tileSize) - worldRadius + (tileSize / 2);
          result.push({
            key,
            position: [worldX, tile.elevation, worldZ],
            elevation: tile.elevation,
          });
        }
      }
    }
    return result;
  }, [allTiles, worldSize, tileSize]);

  // Generate trees (fewer now with smaller world)
  const trees: [number, number, number][] = useMemo(() => {
    const result: [number, number, number][] = [];
    const spacing = 12;
    const worldRadius = worldSize / 2;
    // Use seeded random-like pattern for consistent placement
    for (let x = -worldRadius; x <= worldRadius; x += spacing) {
      for (let z = -worldRadius; z <= worldRadius; z += spacing) {
        const hash = ((x * 37 + z * 23) % 10);
        // Only place on grass tiles, not water
        const gridX = Math.floor((x + worldRadius) / tileSize);
        const gridZ = Math.floor((z + worldRadius) / tileSize);
        const key = `${gridX},${gridZ}`;
        const tile = allTiles.get(key);
        
        if (hash > 3 && (x !== 0 || z !== 0) && tile && tile.type === 'grass') {
          result.push([x, tile.elevation, z]);
        }
      }
    }
    return result;
  }, [worldSize, tileSize, allTiles]);

  // Convert water tiles for merged rendering (optimized)
  const waterTilesForRender = useMemo(() => {
    const result: Array<{ key: string; position: [number, number]; elevation: number }> = [];
    allTiles.forEach((value, key) => {
      if (value.type === 'water') {
        const [x, z] = key.split(',').map(Number);
        result.push({ key, position: [x, z], elevation: value.elevation });
      }
    });
    return result;
  }, [allTiles]);

  return (
    <>
      {/* Environment cleared - only Kenny blocks world visible */}
    </>
  );
}

// ==================== NPC Component ====================

interface NPCData {
  id: string;
  assetId: string;
  weaponPath?: string;
  position: [number, number, number];
  waypoints: [number, number, number][]; // Path to follow
}

function WalkingNPC({ npcData }: { npcData: NPCData }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);
  const modelLoadedRef = useRef(false); // Track if model has been loaded
  const npcDataIdRef = useRef(npcData.id); // Track NPC ID to detect changes

  // Load NPC model - only once, even if npcData object reference changes
  useEffect(() => {
    if (!groupRef.current || modelLoadedRef.current) return;
    // Only reload if NPC ID actually changed
    if (npcDataIdRef.current !== npcData.id) {
      modelLoadedRef.current = false;
      npcDataIdRef.current = npcData.id;
    }

    const loadNPC = async () => {
      try {
        const loader = new GLTFLoader();
        const charPath = npcData.assetId === 'char_knight' 
          ? '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb'
          : '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb';

        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(charPath, resolve, undefined, reject);
        });

        const clonedGltf = cloneGltf(gltf);
        const npcScene = clonedGltf.scene;
        
        groupRef.current!.clear();
        groupRef.current!.add(npcScene);
        npcScene.scale.setScalar(1.5);
        npcScene.position.set(0, 0, 0);
        npcScene.visible = true;

        npcScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setModel(npcScene);
        modelLoadedRef.current = true;

        // Load weapon if specified
        if (npcData.weaponPath) {
          const weaponGltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(npcData.weaponPath!, resolve, undefined, reject);
          });

          const weapon = weaponGltf.scene.clone();
          
          // Find hand bone
          let handBone: THREE.Bone | null = null;
          npcScene.traverse((node) => {
            if (node instanceof THREE.Bone && (node.name === 'handslotr' || node.name === 'handr')) {
              handBone = node;
            }
          });

          if (handBone) {
            weapon.scale.setScalar(0.8);
            weapon.position.set(0.1, 0, 0);
            weapon.rotation.set(0, 0, Math.PI / 4);
            (handBone as THREE.Object3D).add(weapon);
          }
        }
      } catch (error) {
        console.error(`[NPC ${npcData.id}] Failed to load:`, error);
      }
    };

    loadNPC();
  }, [npcData.id, npcData.assetId, npcData.weaponPath]); // Only depend on actual values, not object reference

  // Use animation hook - simpler version that works
  const { crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: `npc-${npcData.id}`,
    assetId: npcData.assetId,
    model: model,
    defaultAnimation: 'walk', // Start with walk for NPCs
  });

  // Track if animation has been initialized (only run once per NPC)
  const animationInitializedRef = useRef(false);
  const lastCrossfadeTimeRef = useRef(0);
  const initializedCharacterIdRef = useRef<string | null>(null);

  // Initialize walk animation once when ready (don't re-trigger) - use stable refs
  const crossfadeToRef = useRef(crossfadeTo);
  crossfadeToRef.current = crossfadeTo; // Keep ref current but don't trigger effect

  // Only initialize animation once per character ID, and only if it's actually a new character
  useEffect(() => {
    const currentCharId = `npc-${npcData.id}`;
    
    // Reset if character ID changed
    if (initializedCharacterIdRef.current !== currentCharId) {
      animationInitializedRef.current = false;
      initializedCharacterIdRef.current = currentCharId;
    }
    
    if (isLoaded && model && npcData.waypoints.length > 0 && !animationInitializedRef.current) {
      // Start walking immediately if NPC has waypoints - only once
      const now = Date.now();
      if (now - lastCrossfadeTimeRef.current > 100) { // Throttle crossfade calls
        crossfadeToRef.current('walk', 0.2);
        lastCrossfadeTimeRef.current = now;
        isMovingRef.current = true;
        animationInitializedRef.current = true;
      }
    }
  }, [isLoaded, model, npcData.id, npcData.waypoints.length]); // Include npcData.id to detect character changes

  // Waypoint following behavior
  useFrame((_state, dt) => {
    if (!groupRef.current || !isLoaded || npcData.waypoints.length === 0) return;

    const currentPos = groupRef.current.position;
    const currentWaypoint = new THREE.Vector3(...npcData.waypoints[currentWaypointIndex.current]);
    
    // Check if reached current waypoint
    const distanceToWaypoint = currentPos.distanceTo(currentWaypoint);
    
    if (distanceToWaypoint < 2) {
      // Move to next waypoint (loop around)
      currentWaypointIndex.current = (currentWaypointIndex.current + 1) % npcData.waypoints.length;
    }

    const targetWaypoint = new THREE.Vector3(...npcData.waypoints[currentWaypointIndex.current]);
    
    // Smooth movement direction
    const direction = new THREE.Vector3()
      .subVectors(targetWaypoint, currentPos)
      .normalize();

    // Only move if we have a valid direction
    if (direction.length() > 0.01) {
      const moveSpeed = 2;
      groupRef.current.position.add(direction.multiplyScalar(moveSpeed * dt));

      // Smooth rotation using lerp (prevent abrupt turns that cause T-pose)
      const targetRotation = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1 // Smooth rotation
      );

      // Don't repeatedly call crossfadeTo - animation should already be playing
      // Only set flag to track state
      isMovingRef.current = true;
    } else {
      // Keep walking animation even if temporarily stopped (waypoint will change soon)
      isMovingRef.current = false;
    }
  });

  return <group ref={groupRef} position={npcData.position} />;
}

// ==================== Erase Cursor ====================

function EraseCursor({ size }: { size: number }) {
  const { camera, raycaster, pointer } = useThree();
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const groundPlane = useRef<THREE.Mesh | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!cursorRef.current || !groundPlane.current) return;

    // Update pointer from mouse position
    const rect = document.body.getBoundingClientRect();
    pointer.x = ((mousePosRef.current.x - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((mousePosRef.current.y - rect.top) / rect.height) * 2 + 1;

    // Update raycaster and position cursor
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundPlane.current);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      cursorRef.current.position.set(point.x, 0.1, point.z);
      cursorRef.current.scale.setScalar(size / 1.5); // Scale cursor based on brush size
      cursorRef.current.visible = true;
    } else {
      cursorRef.current.visible = false;
    }
  });

  return (
    <>
      <mesh
        ref={groundPlane}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={cursorRef} visible={false}>
        <sphereGeometry args={[size / 2, 16, 16]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ==================== Elevation Cursor ====================

function ElevationCursor({ size }: { size: number }) {
  const { camera, raycaster, pointer } = useThree();
  const cursorRef = useRef<THREE.Mesh | null>(null);
  const groundPlane = useRef<THREE.Mesh | null>(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mousePosRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (!cursorRef.current || !groundPlane.current) return;

    // Update pointer from mouse position
    const rect = document.body.getBoundingClientRect();
    pointer.x = ((mousePosRef.current.x - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((mousePosRef.current.y - rect.top) / rect.height) * 2 + 1;

    // Update raycaster and position cursor
    raycaster.setFromCamera(pointer, camera);
    const intersects = raycaster.intersectObject(groundPlane.current);
    
    if (intersects.length > 0) {
      const point = intersects[0].point;
      cursorRef.current.position.set(point.x, 0.1, point.z);
      cursorRef.current.visible = true;
    } else {
      cursorRef.current.visible = false;
    }
  });

  return (
    <>
      <mesh
        ref={groundPlane}
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      <mesh ref={cursorRef} visible={false}>
        <sphereGeometry args={[size / 2, 16, 16]} />
        <meshBasicMaterial color="#4a9eff" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}

// ==================== Category Section Component ====================

function CategorySection({ 
  title, 
  isExpanded, 
  onToggle, 
  children 
}: { 
  title: string; 
  isExpanded: boolean; 
  onToggle: () => void; 
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: '8px', border: '1px solid #555', borderRadius: '4px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '8px',
          background: '#444',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          fontSize: '11px',
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>{title}</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </button>
      {isExpanded && (
        <div style={{ padding: '8px', background: '#222' }}>
          {children}
        </div>
      )}
    </div>
  );
}

// ==================== Ground Click Handler ====================

function GroundClickHandler({ 
  selectedAsset, 
  eraseMode,
  elevationMode,
  elevationValue,
  brushSize,
  eraseBrushSize,
  placedAssets,
  groundTiles,
  worldSize,
  isDragging,
  setIsDragging,
  dragStart,
  setDragStart,
  onPlaceAsset,
  onEraseAsset,
  onPaintGround,
  onPaintElevation
}: { 
  selectedAsset: string | null; 
  eraseMode: boolean;
  elevationMode: boolean;
  elevationValue: number;
  brushSize: number;
  eraseBrushSize: number;
  placedAssets: Array<{ id: string; position: [number, number, number] }>;
  groundTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  worldSize: number;
  isDragging: boolean;
  setIsDragging: (value: boolean) => void;
  dragStart: THREE.Vector3 | null;
  setDragStart: (value: THREE.Vector3 | null) => void;
  onPlaceAsset: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onEraseAsset: (id: string) => void;
  onPaintGround: (tiles: Array<{ key: string; type: 'grass' | 'water'; elevation: number }>) => void;
  onPaintElevation: (tiles: Array<{ key: string; elevation: number }>) => void;
}) {
  const { camera, raycaster, pointer } = useThree();
  const groundPlane = useRef<THREE.Mesh | null>(null);

  // Convert world position to square grid key
  const getTileKey = (x: number, z: number): string => {
    const tileSize = 1; // Smaller tiles
    const gridSize = Math.floor(worldSize / tileSize);
    const worldRadius = worldSize / 2;
    
    const gridX = Math.floor((x + worldRadius) / tileSize);
    const gridZ = Math.floor((z + worldRadius) / tileSize);
    
    // Clamp to grid bounds
    const clampedX = Math.max(0, Math.min(gridSize - 1, gridX));
    const clampedZ = Math.max(0, Math.min(gridSize - 1, gridZ));
    
    return `${clampedX},${clampedZ}`;
  };

  // Get all tiles in a circular area (for brush tools)
  const getTilesInBrush = (center: THREE.Vector3, radius: number): string[] => {
    const tiles = new Set<string>();
    const tileSize = 1;
    const worldRadius = worldSize / 2;
    const brushRadiusGrid = Math.ceil(radius / tileSize);
    
    const centerKey = getTileKey(center.x, center.z);
    const [centerX, centerZ] = centerKey.split(',').map(Number);
    
    for (let x = centerX - brushRadiusGrid; x <= centerX + brushRadiusGrid; x++) {
      for (let z = centerZ - brushRadiusGrid; z <= centerZ + brushRadiusGrid; z++) {
        // Calculate actual world position
        const worldX = (x * tileSize) - worldRadius + (tileSize / 2);
        const worldZ = (z * tileSize) - worldRadius + (tileSize / 2);
        
        // Check if within brush radius
        const distance = Math.sqrt(
          Math.pow(center.x - worldX, 2) + Math.pow(center.z - worldZ, 2)
        );
        
        if (distance <= radius) {
          const key = `${x},${z}`;
          const gridSize = Math.floor(worldSize / tileSize);
          if (x >= 0 && x < gridSize && z >= 0 && z < gridSize) {
            tiles.add(key);
          }
        }
      }
    }
    
    return Array.from(tiles);
  };

  // Get all tiles between two points for drag fill
  const getTilesInArea = (start: THREE.Vector3, end: THREE.Vector3): string[] => {
    const tiles = new Set<string>();
    const tileSize = 1; // Smaller tiles
    const gridSize = Math.floor(worldSize / tileSize);
    
    const startKey = getTileKey(start.x, start.z);
    const endKey = getTileKey(end.x, end.z);
    
    const [startX, startZ] = startKey.split(',').map(Number);
    const [endX, endZ] = endKey.split(',').map(Number);
    
    const minX = Math.max(0, Math.min(startX, endX));
    const maxX = Math.min(gridSize - 1, Math.max(startX, endX));
    const minZ = Math.max(0, Math.min(startZ, endZ));
    const maxZ = Math.min(gridSize - 1, Math.max(startZ, endZ));
    
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        tiles.add(`${x},${z}`);
      }
    }
    
    return Array.from(tiles);
  };

  useEffect(() => {
    if (!selectedAsset && !eraseMode && !elevationMode) return;

    const getWorldPosition = (event: MouseEvent): THREE.Vector3 | null => {
      if (!groundPlane.current) return null;

      const rect = (event.target as HTMLElement).getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);
      const intersects = raycaster.intersectObject(groundPlane.current);
      
      if (intersects.length > 0) {
        return intersects[0].point;
      }
      return null;
    };

    const handleMouseDown = (event: MouseEvent) => {
      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      if (elevationMode) {
        // Start drag for elevation painting
        setIsDragging(true);
        setDragStart(worldPos);
        // Paint initial area
        const tileKeys = getTilesInBrush(worldPos, brushSize);
        onPaintElevation(tileKeys.map(key => ({ key, elevation: elevationValue })));
      } else if ((selectedAsset === 'grass' || selectedAsset === 'water')) {
        // Start drag for ground painting
        setIsDragging(true);
        setDragStart(worldPos);
        // Paint initial tile
        const tileKey = getTileKey(worldPos.x, worldPos.z);
        onPaintGround([{ key: tileKey, type: selectedAsset as 'grass' | 'water', elevation: 0 }]);
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDragging || !dragStart) return;
      
      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      if (elevationMode) {
        // Paint elevation in brush area
        const tileKeys = getTilesInBrush(worldPos, brushSize);
        onPaintElevation(tileKeys.map(key => ({ key, elevation: elevationValue })));
      } else if ((selectedAsset === 'grass' || selectedAsset === 'water')) {
        // Paint all tiles in drag area
        const tileKeys = getTilesInArea(dragStart, worldPos);
        onPaintGround(tileKeys.map(key => ({ key, type: selectedAsset as 'grass' | 'water', elevation: 0 })));
      }
    };

    const handleMouseUp = (event: MouseEvent) => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        return;
      }

      if (!groundPlane.current) return;

      const worldPos = getWorldPosition(event);
      if (!worldPos) return;

      if (eraseMode) {
        // Erase assets within brush radius
        const eraseRadius = eraseBrushSize;
        
        // Find all assets within erase radius
        const assetsToErase: string[] = [];
        for (const asset of placedAssets) {
          const distance = Math.sqrt(
            Math.pow(asset.position[0] - worldPos.x, 2) +
            Math.pow(asset.position[2] - worldPos.z, 2)
          );
          if (distance < eraseRadius) {
            assetsToErase.push(asset.id);
          }
        }
        
        // Erase all found assets
        assetsToErase.forEach(id => onEraseAsset(id));
      } else if (elevationMode) {
        // Paint elevation in brush area on single click
        const tileKeys = getTilesInBrush(worldPos, brushSize);
        onPaintElevation(tileKeys.map(key => ({ key, elevation: elevationValue })));
      } else if (selectedAsset && selectedAsset !== 'grass' && selectedAsset !== 'water') {
        // Single click placement for trees/rocks
        // Get terrain elevation at this position
        const tileKey = getTileKey(worldPos.x, worldPos.z);
        const tile = groundTiles.get(tileKey);
        const terrainElevation = tile ? tile.elevation : 0;
        const newPosition: [number, number, number] = [worldPos.x, terrainElevation, worldPos.z];
        const rotation = Math.random() * Math.PI * 2;
        const scale = 0.8 + Math.random() * 0.4;
        onPlaceAsset({ position: newPosition, rotation, scale });
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [selectedAsset, eraseMode, elevationMode, elevationValue, brushSize, eraseBrushSize, placedAssets, groundTiles, isDragging, dragStart, camera, raycaster, pointer, onPlaceAsset, onEraseAsset, onPaintGround, onPaintElevation, setIsDragging, setDragStart]);

  // Invisible ground plane for raycasting
  return (
    <mesh
      ref={groundPlane}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
        <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
      </mesh>
  );
}

// ==================== Main Component ====================

// Load/save camera settings from localStorage
function useCameraSettings() {
  const [settings, setSettings] = useState<CameraSettings>(() => {
    const stored = localStorage.getItem('minimal-demo-camera-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to defaults
      }
    }
    return { pitch: Math.PI / 6, zoom: 20 }; // Default: 30 degrees pitch, distance 20
  });

  const updateSettings = (updates: Partial<CameraSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('minimal-demo-camera-settings', JSON.stringify(newSettings));
  };

  return [settings, updateSettings] as const;
}

export function MinimalDemo() {
  const navigate = useNavigate();
  const [input, setInput] = useState<CharacterInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const [cameraSettings, updateCameraSettings] = useCameraSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [showAssetPanel, setShowAssetPanel] = useState(true);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [eraseMode, setEraseMode] = useState(false);
  const [placedAssets, setPlacedAssets] = useState<Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number; variant?: string }>>([]);
  const [worldSize, setWorldSize] = useState<number>(100); // dynamic world size (meters)
  const [groundTiles, setGroundTiles] = useState<Map<string, { type: 'grass' | 'water'; elevation: number }>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ground', 'nature', 'water']));
  const [elevationMode, setElevationMode] = useState(false);
  const [elevationValue, setElevationValue] = useState(0);
  const [brushSize, setBrushSize] = useState(3);
  const [eraseBrushSize, setEraseBrushSize] = useState(2);
  const [showLoadWorldDialog, setShowLoadWorldDialog] = useState(false);
  const [savedWorlds, setSavedWorlds] = useState<string[]>([]);
  const [loadedWorldMesh, setLoadedWorldMesh] = useState<THREE.Group | null>(null);
  const [showWorldPainter, setShowWorldPainter] = useState(false);
  const [painterMode, setPainterMode] = useState<'base' | 'elevation'>('base');
  const [painterCanvas, setPainterCanvas] = useState<HTMLCanvasElement | null>(null);

  // Wave/Ocean tuning state
  const [waterSettings, setWaterSettings] = useState({
    planeSizeMultiplier: 1.6,
    shorelineBlend: 3.0,
    waveHeight: 0.12,
    distortionStrength: 0.28,
    foamIntensity: 0.85,
    bandWidth: 2.0,
    tiltDegrees: 6,
    amplitude: 0.25,
    speed: 1.0,
    bandShorelineBlend: 2.0,
    bandFoamIntensity: 1.0,
    bandWaveHeight: 0.14,
    bandDistortionStrength: 0.26,
  });

  // Helper: randomize ground tiles using midpoint displacement
  const randomizeGroundTiles = () => {
    const gridSize = Math.floor(worldSize / 1);
    const newGroundTiles = new Map<string, { type: 'grass' | 'water'; elevation: number }>();
    
    // Use Perlin-like noise simulation (simple midpoint displacement)
    const heightmap: number[][] = [];
    for (let i = 0; i < gridSize; i++) {
      heightmap[i] = [];
      for (let j = 0; j < gridSize; j++) {
        heightmap[i][j] = 0;
      }
    }
    
    // Initialize random corners
    heightmap[0][0] = Math.random() * 2 - 1;
    heightmap[0][gridSize - 1] = Math.random() * 2 - 1;
    heightmap[gridSize - 1][0] = Math.random() * 2 - 1;
    heightmap[gridSize - 1][gridSize - 1] = Math.random() * 2 - 1;
    
    // Midpoint displacement for terrain generation
    let stepSize = gridSize - 1;
    let scale = 1.0;
    while (stepSize > 1) {
      const halfStep = stepSize / 2;
      
      // Diamond step
      for (let y = 0; y < gridSize - 1; y += stepSize) {
        for (let x = 0; x < gridSize - 1; x += stepSize) {
          const avg = (
            heightmap[y][x] +
            heightmap[y][x + stepSize] +
            heightmap[y + stepSize][x] +
            heightmap[y + stepSize][x + stepSize]
          ) / 4;
          heightmap[y + halfStep][x + halfStep] = avg + (Math.random() - 0.5) * scale;
        }
      }
      
      // Square step
      for (let y = 0; y < gridSize; y += halfStep) {
        for (let x = (y + halfStep) % stepSize; x < gridSize; x += stepSize) {
          let sum = 0, count = 0;
          if (y >= halfStep) { sum += heightmap[y - halfStep][x]; count++; }
          if (y + halfStep < gridSize) { sum += heightmap[y + halfStep][x]; count++; }
          if (x >= halfStep) { sum += heightmap[y][x - halfStep]; count++; }
          if (x + halfStep < gridSize) { sum += heightmap[y][x + halfStep]; count++; }
          heightmap[y][x] = (sum / count) + (Math.random() - 0.5) * scale;
        }
      }
      
      stepSize = halfStep;
      scale *= 0.5;
    }
    
    // Convert heightmap to ground tiles
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const elevation = Math.max(-0.5, Math.min(3, heightmap[gx][gz]));
        const key = `${gx},${gz}`;
        newGroundTiles.set(key, {
          type: elevation > 0.5 ? 'grass' : 'water',
          elevation: Math.max(0, elevation),
        });
      }
    }
    
    console.log(`[Randomize] Generated ${newGroundTiles.size} terrain tiles`);
    setGroundTiles(newGroundTiles);
  };

  // Helper: add a row of rocks aligned to tile centers along an edge
  const addRockRow = (edge: 'north' | 'south' | 'east' | 'west') => {
    const tileSize = 1;
    const gridSize = Math.floor(worldSize / tileSize);
    const worldRadius = worldSize / 2;
    const newRocks: Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number; variant?: string }> = [];

    if (edge === 'north' || edge === 'south') {
      const gridZ = edge === 'north' ? gridSize - 1 : 0;
      const worldZ = (gridZ * tileSize) - worldRadius + (tileSize / 2);
      for (let gx = 0; gx < gridSize; gx++) {
        const worldX = (gx * tileSize) - worldRadius + (tileSize / 2);
        const key = `${gx},${gridZ}`;
        const tile = (groundTiles.get(key) || defaultTerrainTiles.get(key));
        if (!tile || tile.type !== 'grass') continue;
        newRocks.push({
          id: `rock-row-${edge}-${gx}-${gridZ}-${Math.random()}`,
          type: 'rock',
          position: [worldX, tile.elevation, worldZ],
          rotation: (Math.random() - 0.5) * 0.4,
          scale: 1.6 + Math.random() * 0.4,
        });
      }
    } else {
      const gridX = edge === 'east' ? gridSize - 1 : 0;
      const worldX = (gridX * tileSize) - worldRadius + (tileSize / 2);
      for (let gz = 0; gz < gridSize; gz++) {
        const worldZ = (gz * tileSize) - worldRadius + (tileSize / 2);
        const key = `${gridX},${gz}`;
        const tile = (groundTiles.get(key) || defaultTerrainTiles.get(key));
        if (!tile || tile.type !== 'grass') continue;
        newRocks.push({
          id: `rock-row-${edge}-${gridX}-${gz}-${Math.random()}`,
          type: 'rock',
          position: [worldX, tile.elevation, worldZ],
          rotation: (Math.random() - 0.5) * 0.4,
          scale: 1.6 + Math.random() * 0.4,
        });
      }
    }

    if (newRocks.length > 0) {
      setPlacedAssets(prev => [...prev, ...newRocks]);
    }
  };

  // World generator: create preset 2x4 worlds
  const generatePresetWorlds = () => {
    // Helper to create a tile with assets
    const createTile = (tileId: string, assets: Array<{ type: string; position: [number, number, number]; rotation: number; scale: number; hasCollision?: boolean }>) => {
      const tileData = { assets };
      localStorage.setItem(`tile_${tileId}`, JSON.stringify(tileData));
      return tileId;
    };
    
    // Helper to check if position is on perimeter
    const isPerimeter = (col: number, row: number, cols: number, rows: number) => {
      return col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
    };

    // 1. Meadow World - flowers with tree boundary
    const meadowGrid: WorldCell[][] = [];
    for (let row = 0; row < 4; row++) {
      meadowGrid[row] = [];
      for (let col = 0; col < 2; col++) {
        const tileId = `meadow_${col}_${row}`;
        const assets: Array<{ type: string; position: [number, number, number]; rotation: number; scale: number; hasCollision?: boolean }> = [];
        
        if (isPerimeter(col, row, 2, 4)) {
          // Perimeter: trees
          for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'tree',
              position: [x, 0, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 1.0 + Math.random() * 0.3,
              hasCollision: true,
            });
          }
        } else {
          // Interior: flowers
          for (let i = 0; i < 8; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'flower',
              position: [x, 0.01, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 0.6 + Math.random() * 0.4,
            });
          }
        }
        
        createTile(tileId, assets);
        meadowGrid[row][col] = { tileId, rotation: 0 };
      }
    }
    
    localStorage.setItem('world_Meadow', JSON.stringify({ gridWidth: 2, gridHeight: 4, grid: meadowGrid }));

    // 2. Forest World - dense trees with clear path (middle column path)
    const forestGrid: WorldCell[][] = [];
    for (let row = 0; row < 4; row++) {
      forestGrid[row] = [];
      for (let col = 0; col < 2; col++) {
        const tileId = `forest_${col}_${row}`;
        const assets: Array<{ type: string; position: [number, number, number]; rotation: number; scale: number; hasCollision?: boolean }> = [];
        
        // Dense trees everywhere, but create a clear path down the center (x near 0)
        for (let i = 0; i < 5; i++) {
          let x = (Math.random() - 0.5) * 8;
          const z = (Math.random() - 0.5) * 8;
          
          // Keep center path clear (x between -1.5 and 1.5)
          if (Math.abs(x) < 1.5) {
            // Push trees to sides
            x = x < 0 ? x - 2 : x + 2;
          }
          
          assets.push({
            type: 'tree',
            position: [x, 0, z],
            rotation: Math.random() * Math.PI * 2,
            scale: 0.9 + Math.random() * 0.4,
            hasCollision: true,
          });
        }
        
        createTile(tileId, assets);
        forestGrid[row][col] = { tileId, rotation: 0 };
      }
    }
    
    localStorage.setItem('world_Forest', JSON.stringify({ gridWidth: 2, gridHeight: 4, grid: forestGrid }));

    // 3. Mixed World - variety on perimeter
    const mixedGrid: WorldCell[][] = [];
    for (let row = 0; row < 4; row++) {
      mixedGrid[row] = [];
      for (let col = 0; col < 2; col++) {
        const tileId = `mixed_${col}_${row}`;
        const assets: Array<{ type: string; position: [number, number, number]; rotation: number; scale: number; hasCollision?: boolean }> = [];
        
        if (isPerimeter(col, row, 2, 4)) {
          // Perimeter: mix of trees, rocks, and flowers
          for (let i = 0; i < 2; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'tree',
              position: [x, 0, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 1.0 + Math.random() * 0.3,
              hasCollision: true,
            });
          }
          for (let i = 0; i < 3; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'rock',
              position: [x, 0, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 1.2 + Math.random() * 0.4,
              hasCollision: true,
            });
          }
          for (let i = 0; i < 4; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'flower',
              position: [x, 0.01, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 0.6 + Math.random() * 0.4,
            });
          }
        } else {
          // Interior: mostly grass with some pebbles
          for (let i = 0; i < 5; i++) {
            const x = (Math.random() - 0.5) * 8;
            const z = (Math.random() - 0.5) * 8;
            assets.push({
              type: 'pebble',
              position: [x, 0, z],
              rotation: Math.random() * Math.PI * 2,
              scale: 0.3 + Math.random() * 0.2,
            });
          }
        }
        
        createTile(tileId, assets);
        mixedGrid[row][col] = { tileId, rotation: 0 };
      }
    }
    
    localStorage.setItem('world_Mixed', JSON.stringify({ gridWidth: 2, gridHeight: 4, grid: mixedGrid }));
    
    alert('✅ Created 3 preset worlds:\n• Meadow (flowers + tree boundary)\n• Forest (dense trees + clear path)\n• Mixed (varied perimeter)\n\nClick "🌍 Load World" to explore!');
  };

  // Type for world grid cells (matches WorldFromTilesPage)
  type WorldCell = {
    tileId: string | null;
    rotation: 0 | 1 | 2 | 3;
  };

  // Generate default terrain tiles (shared between Environment and CharacterModel)
  // Flat grass only - no elevation or water
  const defaultTerrainTiles = useMemo(() => {
    const tileSize = 1;
    const gridSize = Math.floor(worldSize / tileSize);
    
    // Generate flat grass tiles only
    const tiles = new Map<string, { type: 'grass' | 'water'; elevation: number }>();
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const key = `${x},${z}`;
        tiles.set(key, {
          type: 'grass',
          elevation: 0 // Flat ground
        });
      }
    }
    return tiles;
  }, [worldSize]);

  // Merge default terrain with user-painted tiles
  const allTerrainTiles = useMemo(() => {
    const merged = new Map(defaultTerrainTiles);
    groundTiles.forEach((value, key) => {
      merged.set(key, value);
    });
    return merged;
  }, [defaultTerrainTiles, groundTiles]);

  // NPCs data with waypoint paths - memoized to prevent re-creation on every render
  const npcs: NPCData[] = useMemo(() => [
    {
      id: 'knight1',
      assetId: 'char_knight',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_1handed.gltf',
      position: [20, 0, 20],
      waypoints: [
        [20, 0, 20],
        [30, 0, 20],
        [30, 0, 30],
        [20, 0, 30],
        [20, 0, 20], // Loop back
      ],
    },
    {
      id: 'knight2',
      assetId: 'char_knight',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_2handed.gltf',
      position: [-20, 0, 20],
      waypoints: [
        [-20, 0, 20],
        [-30, 0, 20],
        [-30, 0, 10],
        [-20, 0, 10],
        [-20, 0, 20],
      ],
    },
    {
      id: 'mage1',
      assetId: 'char_mage',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/staff.gltf',
      position: [20, 0, -20],
      waypoints: [
        [20, 0, -20],
        [10, 0, -20],
        [10, 0, -30],
        [20, 0, -30],
        [20, 0, -20],
      ],
    },
    {
      id: 'mage2',
      assetId: 'char_mage',
      position: [-20, 0, -20],
      waypoints: [
        [-20, 0, -20],
        [-30, 0, -20],
        [-30, 0, -30],
        [-20, 0, -30],
        [-20, 0, -20],
      ],
    },
  ], []); // Empty deps - never recreate

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput((prev) => {
        switch (key) {
          case 'w':
          case 'arrowup':
            return { ...prev, forward: true, backward: false };
          case 's':
          case 'arrowdown':
            return { ...prev, backward: true, forward: false };
          case 'a':
          case 'arrowleft':
            return { ...prev, left: true, right: false };
          case 'd':
          case 'arrowright':
            return { ...prev, right: true, left: false };
          case ' ':
            return { ...prev, jump: true };
          default:
            return prev;
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput((prev) => {
        switch (key) {
          case 'w':
          case 'arrowup':
            return { ...prev, forward: false };
          case 's':
          case 'arrowdown':
            return { ...prev, backward: false };
          case 'a':
          case 'arrowleft':
            return { ...prev, left: false };
          case 'd':
          case 'arrowright':
            return { ...prev, right: false };
          case ' ':
            return { ...prev, jump: false };
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Initialize environment trees as collision objects once
  useEffect(() => {
    if (placedAssets.length === 0 && allTerrainTiles.size > 0) {
      // Generate environment trees for collisions (same logic as Environment component)
      const spacing = 12;
      const worldRadius = worldSize / 2;
      const tileSize = 1;
      const envTrees: Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number }> = [];
      const safeZoneRadius = 8; // Exclude trees within 8 units of origin to prevent invisible wall
      
      for (let x = -worldRadius; x <= worldRadius; x += spacing) {
        for (let z = -worldRadius; z <= worldRadius; z += spacing) {
          const hash = ((x * 37 + z * 23) % 10);
          const gridX = Math.floor((x + worldRadius) / tileSize);
          const gridZ = Math.floor((z + worldRadius) / tileSize);
          const key = `${gridX},${gridZ}`;
          const tile = allTerrainTiles.get(key);
          
          // Exclude center zone and check for grass tiles
          const distFromOrigin = Math.sqrt(x * x + z * z);
          if (hash > 3 && distFromOrigin > safeZoneRadius && tile && tile.type === 'grass') {
            envTrees.push({
              id: `env-tree-${x}-${z}`,
              type: 'tree',
              position: [x, tile.elevation, z],
              rotation: 0,
              scale: 1,
            });
          }
        }
      }
      
      if (envTrees.length > 0) {
        setPlacedAssets(envTrees);
      }
    }
  }, [worldSize, allTerrainTiles]);

  // Convert painted canvas to ground tiles
  const convertPaintedCanvasToTiles = (baseCanvas: HTMLCanvasElement, elevationCanvas?: HTMLCanvasElement) => {
    const ctx = baseCanvas.getContext('2d');
    const elevCtx = elevationCanvas?.getContext('2d');
    if (!ctx) return;

    const newGroundTiles = new Map<string, { type: 'grass' | 'water'; elevation: number }>();
    const canvasSize = baseCanvas.width;
    const gridSize = Math.floor(worldSize / 1);
    const tilePixelsPerTile = canvasSize / gridSize;

    // Sample canvas for each tile
    for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        const key = `${gx},${gz}`;
        const canvasX = Math.floor(gx * tilePixelsPerTile + tilePixelsPerTile / 2);
        const canvasY = Math.floor(gz * tilePixelsPerTile + tilePixelsPerTile / 2);

        // Sample base layer
        const baseImageData = ctx.getImageData(canvasX, canvasY, 1, 1).data;
        const baseGreen = baseImageData[1]; // Green channel
        const isGrass = baseGreen > 100; // Dark green = grass

        // Sample elevation layer if present
        let elevation = 0;
        if (elevCtx) {
          const elevImageData = elevCtx.getImageData(canvasX, canvasY, 1, 1).data;
          const elevGreen = elevImageData[1];
          // Map light green values to elevation
          elevation = Math.max(0, (elevGreen - 100) / 155 * 3); // 0-3 range
        }

        newGroundTiles.set(key, {
          type: isGrass ? 'grass' : 'water',
          elevation: isGrass ? elevation : 0,
        });
      }
    }

    setGroundTiles(newGroundTiles);
    console.log(`[WorldPainter] Converted canvas to ${newGroundTiles.size} tiles`);
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <button
        onClick={() => navigate('/')}
        style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        ← Back
      </button>

      {/* Load World Button */}
      <button
        onClick={() => {
          const worlds = Object.keys(localStorage).filter(key => key.startsWith('world_'));
          setSavedWorlds(worlds.map(key => key.replace('world_', '')));
          setShowLoadWorldDialog(true);
        }}
        style={{
          position: 'absolute',
          top: '20px',
          left: '120px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#4a9eff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        🌍 Load World
      </button>

      {/* Generate Preset Worlds Button */}
      <button
        onClick={generatePresetWorlds}
        style={{
          position: 'absolute',
          top: '20px',
          left: '260px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#2ecc71',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        ✨ Generate Worlds
      </button>

      {/* Randomize Ground Button */}
      <button
        onClick={randomizeGroundTiles}
        style={{
          position: 'absolute',
          top: '20px',
          left: '450px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#e74c3c',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        🌄 Randomize Terrain
      </button>

      {/* World Painter Button */}
      <button
        onClick={() => setShowWorldPainter(true)}
        style={{
          position: 'absolute',
          top: '20px',
          left: '640px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#9b59b6',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold',
        }}
      >
        🎨 World Painter
      </button>

      {/* World Painter Modal */}
      {showWorldPainter && (
        <WorldPainter
          onConfirm={(baseCanvas, elevationCanvas) => {
            convertPaintedCanvasToTiles(baseCanvas, elevationCanvas);
            setShowWorldPainter(false);
            setPainterMode('base');
          }}
          onClose={() => {
            setShowWorldPainter(false);
            setPainterMode('base');
          }}
          mode={painterMode}
          setMode={setPainterMode}
        />
      )}

      {/* Load World Dialog */}
      {showLoadWorldDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#222',
            padding: '30px',
            borderRadius: '10px',
            color: 'white',
            minWidth: '300px',
            maxHeight: '500px',
            overflowY: 'auto',
          }}>
            <h2 style={{ marginTop: 0 }}>Load World</h2>
            {savedWorlds.length === 0 ? (
              <p>No saved worlds found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {savedWorlds.map((name) => (
                  <button
                    key={name}
                    onClick={async () => {
                      // Check storage location (localStorage or IndexedDB)
                      const storageType = localStorage.getItem(`world_glb_${name}_storage`) || 'localStorage';
                      
                      const loadGLBFromBlob = (blob: Blob) => {
                        const loader = new GLTFLoader();
                        const url = URL.createObjectURL(blob);
                        
                        loader.load(
                          url,
                          (gltf) => {
                            const cloned = gltf.scene.clone();
                            cloned.traverse((child) => {
                              if (child instanceof THREE.Mesh) {
                                child.castShadow = true;
                                child.receiveShadow = true;
                              }
                            });
                            setLoadedWorldMesh(cloned);
                            setPlacedAssets([]); // Clear individual assets - using merged mesh instead
                            URL.revokeObjectURL(url);
                          },
                          undefined,
                          (error: unknown) => {
                            console.error('[MinimalDemo] Error loading GLB:', error);
                            URL.revokeObjectURL(url);
                            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                            alert(`Failed to load world GLB: ${errorMessage}`);
                          }
                        );
                      };
                      
                      if (storageType === 'indexeddb') {
                        // Load from IndexedDB
                        const dbName = 'viber3d_worlds';
                        const storeName = 'glb_files';
                        const key = `world_glb_${name}`;
                        
                        const request = indexedDB.open(dbName, 1);
                        
                        request.onsuccess = () => {
                          const db = request.result;
                          const transaction = db.transaction([storeName], 'readonly');
                          const store = transaction.objectStore(storeName);
                          const getRequest = store.get(key);
                          
                          getRequest.onsuccess = () => {
                            const blob = getRequest.result as Blob;
                            if (blob) {
                              loadGLBFromBlob(blob);
                            } else {
                              console.error('[MinimalDemo] GLB not found in IndexedDB');
                              alert('World GLB file not found in storage');
                            }
                          };
                          
                          getRequest.onerror = () => {
                            console.error('[MinimalDemo] IndexedDB get failed:', getRequest.error);
                            alert(`Failed to load world from IndexedDB: ${getRequest.error?.message || 'Unknown error'}`);
                          };
                        };
                        
                        request.onerror = () => {
                          console.error('[MinimalDemo] IndexedDB open failed:', request.error);
                          alert(`Failed to open IndexedDB: ${request.error?.message || 'Unknown error'}`);
                        };
                        
                        request.onupgradeneeded = (event) => {
                          const db = (event.target as IDBOpenDBRequest).result;
                          if (!db.objectStoreNames.contains(storeName)) {
                            db.createObjectStore(storeName);
                          }
                        };
                      } else {
                        // Load from localStorage (base64)
                        const glbData = localStorage.getItem(`world_glb_${name}`);
                        if (glbData) {
                          try {
                            const base64Data = glbData.split(',')[1]; // Remove data URL prefix
                            const binaryString = atob(base64Data);
                            const bytes = new Uint8Array(binaryString.length);
                            for (let i = 0; i < binaryString.length; i++) {
                              bytes[i] = binaryString.charCodeAt(i);
                            }
                            
                            const blob = new Blob([bytes], { type: 'model/gltf-binary' });
                            loadGLBFromBlob(blob);
                          } catch (error) {
                            console.error('[MinimalDemo] Error loading GLB from localStorage:', error);
                            alert(`Failed to load world GLB: ${error instanceof Error ? error.message : 'Unknown error'}`);
                          }
                        } else {
                          // Fallback to JSON assets
                          console.log('[MinimalDemo] No GLB found, loading from JSON...');
                        }
                      }
                      
                      // Still set ground tiles for terrain following (common for both paths)
                      const worldData = localStorage.getItem(`world_${name}`);
                      if (worldData) {
                        try {
                          const parsed = JSON.parse(worldData);
                          const newGroundTiles = new Map<string, { type: 'grass' | 'water'; elevation: number }>();
                          
                          if (parsed.grid && Array.isArray(parsed.grid)) {
                            const cellSize = 10;
                            const computedWorldSize = Math.max(parsed.gridWidth || 0, parsed.gridHeight || 0) * cellSize || worldSize;
                            setWorldSize(computedWorldSize);
                            const tileSize = 1;
                            
                            parsed.grid.forEach((row: WorldCell[], rowIndex: number) => {
                              row.forEach((_cell: WorldCell, colIndex: number) => {
                                const cellCenterX = (colIndex - (parsed.gridWidth - 1) / 2) * cellSize;
                                const cellCenterZ = (rowIndex - (parsed.gridHeight - 1) / 2) * cellSize;
                                
                                for (let tx = 0; tx < cellSize; tx++) {
                                  for (let tz = 0; tz < cellSize; tz++) {
                                    const worldX = cellCenterX - cellSize/2 + tx + 0.5;
                                    const worldZ = cellCenterZ - cellSize/2 + tz + 0.5;
                                  const gridX = Math.floor((worldX + computedWorldSize/2) / tileSize);
                                  const gridZ = Math.floor((worldZ + computedWorldSize/2) / tileSize);
                                    const key = `${gridX},${gridZ}`;
                                    newGroundTiles.set(key, { type: 'grass', elevation: 0 });
                                  }
                                }
                              });
                            });
                            
                            // Fill entire world area
                          const gridSize = Math.floor(computedWorldSize / tileSize);
                            for (let gx = 0; gx < gridSize; gx++) {
                              for (let gz = 0; gz < gridSize; gz++) {
                                const key = `${gx},${gz}`;
                                if (!newGroundTiles.has(key)) {
                                  newGroundTiles.set(key, { type: 'grass', elevation: 0 });
                                }
                              }
                            }
                            
                            setGroundTiles(newGroundTiles);
                            
                            // Build collider assets for trees/rocks even when rendering merged mesh
                            const colliderAssets: Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number; variant?: string }> = [];
                            parsed.grid.forEach((row: WorldCell[], rowIndex: number) => {
                              row.forEach((cell: WorldCell, colIndex: number) => {
                                if (cell.tileId && cell.tileId !== BLANK_TILE_ID) {
                                  const tileData = localStorage.getItem(`tile_${cell.tileId}`);
                                  if (tileData && !tileData.startsWith('data:')) {
                                    try {
                                      const tileParsed = JSON.parse(tileData);
                                      if (tileParsed.assets && Array.isArray(tileParsed.assets)) {
                                        const cellCenterX = (colIndex - (parsed.gridWidth - 1) / 2) * cellSize;
                                        const cellCenterZ = (rowIndex - (parsed.gridHeight - 1) / 2) * cellSize;
                                        const rotationY = cell.rotation * (Math.PI / 2);
                                        const cos = Math.cos(rotationY);
                                        const sin = Math.sin(rotationY);
                                        
                                        tileParsed.assets.forEach((asset: any) => {
                                          const isLarge = (asset.scale ?? 1) >= 1;
                                          const collidable = asset.hasCollision || ((asset.type === 'tree' || asset.type === 'rock') && isLarge);
                                          if (!collidable) return;
                                          
                                          const rotatedX = asset.position[0] * cos - asset.position[2] * sin;
                                          const rotatedZ = asset.position[0] * sin + asset.position[2] * cos;
                                          
                                          colliderAssets.push({
                                            id: `collider-${cell.tileId}-${Math.random()}`,
                                            type: asset.type,
                                            position: [
                                              cellCenterX + rotatedX,
                                              asset.position[1],
                                              cellCenterZ + rotatedZ,
                                            ],
                                            rotation: asset.rotation || 0,
                                            scale: asset.scale || 1,
                                            variant: asset.variant,
                                          });
                                        });
                                      }
                                    } catch (err) {
                                      console.error('[MinimalDemo] Error loading tile assets for colliders:', err);
                                    }
                                  }
                                }
                              });
                            });
                            
                            console.log(`[MinimalDemo] Loaded ${colliderAssets.length} collision assets from world`);
                            setPlacedAssets(colliderAssets);
                          }
                        } catch (error) {
                          console.error('[MinimalDemo] Error parsing world data:', error);
                        }
                      }
                      
                      // Fallback: Load individual assets from JSON if GLB not available
                      if (storageType !== 'indexeddb' && !localStorage.getItem(`world_glb_${name}`)) {
                        const worldData = localStorage.getItem(`world_${name}`);
                        if (worldData) {
                          try {
                            const parsed = JSON.parse(worldData);
                            if (parsed.grid && Array.isArray(parsed.grid)) {
                              const cellSize = 10;
                              const allAssets: Array<{ id: string; position: [number, number, number]; scale: number; type: string; rotation: number; variant?: string }> = [];
                              
                              parsed.grid.forEach((row: WorldCell[], rowIndex: number) => {
                                row.forEach((cell: WorldCell, colIndex: number) => {
                                  if (cell.tileId && cell.tileId !== BLANK_TILE_ID) {
                                    const tileData = localStorage.getItem(`tile_${cell.tileId}`);
                                    if (tileData && !tileData.startsWith('data:')) {
                                      try {
                                        const tile = JSON.parse(tileData);
                                        const cellCenterX = (colIndex - (parsed.gridWidth - 1) / 2) * cellSize;
                                        const cellCenterZ = (rowIndex - (parsed.gridHeight - 1) / 2) * cellSize;
                                        
                                        if (tile.assets) {
                                          tile.assets.forEach((asset: any) => {
                                            const rotationY = cell.rotation * (Math.PI / 2);
                                            const cos = Math.cos(rotationY);
                                            const sin = Math.sin(rotationY);
                                            const rotatedX = asset.position[0] * cos - asset.position[2] * sin;
                                            const rotatedZ = asset.position[0] * sin + asset.position[2] * cos;
                                            
                                            allAssets.push({
                                              id: `asset-${cell.tileId}-${Math.random()}`,
                                              position: [
                                                cellCenterX + rotatedX,
                                                asset.position[1],
                                                cellCenterZ + rotatedZ
                                              ],
                                              scale: asset.scale || 1,
                                              type: asset.type,
                                              rotation: asset.rotation || 0,
                                              variant: asset.variant
                                            });
                                          });
                                        }
                                      } catch (e) {
                                        console.error(`Error loading tile ${cell.tileId}:`, e);
                                      }
                                    }
                                  }
                                });
                              });
                              
                              setPlacedAssets(allAssets);
                            }
                          } catch (error) {
                            console.error('[MinimalDemo] Error loading world from JSON:', error);
                          }
                        }
                      }
                      
                      setShowLoadWorldDialog(false);
                      alert(`World "${name}" loaded successfully!`);
                    }}
                    style={{
                      padding: '10px',
                      background: '#444',
                      color: 'white',
                      border: '1px solid #555',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowLoadWorldDialog(false)}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                width: '100%',
                background: '#666',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          top: '80px',
          right: '20px',
          color: 'white',
          zIndex: 10,
          background: 'rgba(0,0,0,0.7)',
          padding: '15px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0' }}>Animation Demo</h2>
      <p style={{ margin: '5px 0' }}>Use WASD or Arrow Keys to move</p>
        <p style={{ margin: '5px 0' }}>
          Forward: {input.forward ? '✓' : '✗'} | Back: {input.backward ? '✓' : '✗'}
        </p>
        <p style={{ margin: '5px 0' }}>
          Left: {input.left ? '✓' : '✗'} | Right: {input.right ? '✓' : '✗'}
        </p>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          {showSettings ? '▼' : '▶'} Camera Settings
        </button>
        {showSettings && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #555' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Pitch: {(cameraSettings.pitch * 180 / Math.PI).toFixed(0)}°
              </label>
              <input
                type="range"
                min="0"
                max={Math.PI / 2}
                step={0.01}
                value={cameraSettings.pitch}
                onChange={(e) => updateCameraSettings({ pitch: parseFloat(e.target.value) })}
                style={{ width: '150px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Zoom: {cameraSettings.zoom.toFixed(1)}
              </label>
              <input
                type="range"
                min="3"
                max="40"
                step="0.5"
                value={cameraSettings.zoom}
                onChange={(e) => updateCameraSettings({ zoom: parseFloat(e.target.value) })}
                style={{ width: '150px' }}
              />
            </div>
            <p style={{ margin: '5px 0', fontSize: '10px', color: '#aaa' }}>
              Settings saved automatically
            </p>
          </div>
        )}
        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#aaa' }}>
          NPCs walking around with weapons
        </p>
      </div>

      {/* Asset Panel Toggle Button - Always visible when minimized */}
      {!showAssetPanel && (
        <button 
          onClick={() => setShowAssetPanel(true)}
          style={{
            position: 'absolute',
            top: '80px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            border: '1px solid #555',
            borderRadius: '5px',
            cursor: 'pointer',
            padding: '10px 15px',
            fontSize: '14px',
            fontWeight: 'bold',
          }}
        >
          ▶ Assets
        </button>
      )}

      {/* Asset Placement Panel - Left Side */}
      {showAssetPanel && (
        <div
          style={{
            position: 'absolute',
            top: '80px',
            left: '20px',
            zIndex: 10,
            background: 'rgba(0,0,0,0.8)',
            padding: '15px',
            borderRadius: '5px',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '12px',
            width: '180px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h3 style={{ margin: 0, fontSize: '14px' }}>Assets</h3>
            <button 
              onClick={() => setShowAssetPanel(false)}
              style={{
                background: '#555',
            color: 'white',
            border: 'none',
                borderRadius: '3px',
            cursor: 'pointer',
                padding: '5px 8px',
                fontSize: '10px',
          }}
        >
              ◀
        </button>
          </div>
          <div style={{ maxHeight: '80vh', overflowY: 'auto' }}>
            {/* Quick access: Wave tuning panel toggle */}
            <button
              onClick={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('water')) newSet.delete('water'); else newSet.add('water');
                setExpandedCategories(newSet);
              }}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                background: expandedCategories.has('water') ? '#4a9eff' : '#555',
                color: 'white',
                border: expandedCategories.has('water') ? '2px solid #fff' : '1px solid #555',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              ⚙️ Wave Tuning
            </button>
            {/* Erase Button */}
            <button
              onClick={() => {
                setEraseMode(!eraseMode);
                setElevationMode(false);
                setSelectedAsset(null);
              }}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                background: eraseMode ? '#ff4444' : '#555',
                color: 'white',
                border: eraseMode ? '2px solid #fff' : '1px solid #555',
            borderRadius: '4px',
            cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
          }}
        >
              {eraseMode ? '✕ Erase Mode ON' : '✕ Erase'}
        </button>
            
            {/* Erase Size Adjuster */}
            {eraseMode && (
              <div style={{ marginBottom: '10px', padding: '8px', background: '#333', borderRadius: '4px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>
                  Erase Size: {eraseBrushSize.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={eraseBrushSize}
                  onChange={(e) => setEraseBrushSize(parseFloat(e.target.value))}
                  style={{ width: '100%' }}
                />
      </div>
            )}

            {/* Ground Tiles Category */}
            <CategorySection
              title="Ground"
              isExpanded={expandedCategories.has('ground')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('ground')) {
                  newSet.delete('ground');
                } else {
                  newSet.add('ground');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => { setSelectedAsset('grass'); setEraseMode(false); setElevationMode(false); }}
                  title="Paint Grass (Click & Drag)"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: selectedAsset === 'grass' ? '#4a9eff' : '#3d6b2d',
                    border: selectedAsset === 'grass' ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🌱
                </button>
                <button
                  onClick={() => { setSelectedAsset('water'); setEraseMode(false); setElevationMode(false); }}
                  title="Paint Water (Click & Drag)"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: selectedAsset === 'water' ? '#4a9eff' : '#1e90ff',
                    border: selectedAsset === 'water' ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  💧
                </button>
                {/* Elevation Tool */}
                <button
                  onClick={() => { 
                    setElevationMode(!elevationMode); 
                    setEraseMode(false); 
                    setSelectedAsset(null); 
                  }}
                  title="Paint Elevation (Click & Drag)"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: elevationMode ? '#4a9eff' : '#666',
                    border: elevationMode ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  ⛰️
                </button>
                {/* Elevation Controls */}
                {elevationMode && (
                  <>
                    <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>
                        Elevation: {elevationValue.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="-2"
                        max="5"
                        step="0.1"
                        value={elevationValue}
                        onChange={(e) => setElevationValue(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
    </div>
                    <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>
                        Brush Size: {brushSize.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        step="0.5"
                        value={brushSize}
                        onChange={(e) => setBrushSize(parseFloat(e.target.value))}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </>
                )}
              </div>
            </CategorySection>

            {/* Nature Category */}
            <CategorySection
              title="Nature"
              isExpanded={expandedCategories.has('nature')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('nature')) {
                  newSet.delete('nature');
                } else {
                  newSet.add('nature');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <button
                  onClick={() => { setSelectedAsset('tree'); setEraseMode(false); }}
                  title="Place Random Tree"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: selectedAsset === 'tree' ? '#4a9eff' : '#3d6b2d',
                    border: selectedAsset === 'tree' ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🌳
                </button>
                <button
                  onClick={() => { setSelectedAsset('rock'); setEraseMode(false); }}
                  title="Place Random Rock"
                  style={{
                    width: '100%',
                    height: '40px',
                    background: selectedAsset === 'rock' ? '#4a9eff' : '#666666',
                    border: selectedAsset === 'rock' ? '2px solid #fff' : '1px solid #555',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                  }}
                >
                  🪨
                </button>
    </div>
            </CategorySection>

            {/* Water (Wave Tuning) Category */}
            <CategorySection
              title="Water"
              isExpanded={expandedCategories.has('water')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('water')) newSet.delete('water'); else newSet.add('water');
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Ocean Size × {waterSettings.planeSizeMultiplier.toFixed(2)}</label>
                  <input type="range" min="1.0" max="2.5" step="0.05" value={waterSettings.planeSizeMultiplier} onChange={(e) => setWaterSettings(s => ({ ...s, planeSizeMultiplier: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                </div>
                <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Shoreline Blend: {waterSettings.shorelineBlend.toFixed(2)}</label>
                  <input type="range" min="0" max="5" step="0.05" value={waterSettings.shorelineBlend} onChange={(e) => setWaterSettings(s => ({ ...s, shorelineBlend: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Wave Height: {waterSettings.waveHeight.toFixed(2)}</label>
                    <input type="range" min="0" max="0.5" step="0.01" value={waterSettings.waveHeight} onChange={(e) => setWaterSettings(s => ({ ...s, waveHeight: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Distortion: {waterSettings.distortionStrength.toFixed(2)}</label>
                    <input type="range" min="0" max="1" step="0.01" value={waterSettings.distortionStrength} onChange={(e) => setWaterSettings(s => ({ ...s, distortionStrength: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Foam Intensity: {waterSettings.foamIntensity.toFixed(2)}</label>
                    <input type="range" min="0" max="2" step="0.01" value={waterSettings.foamIntensity} onChange={(e) => setWaterSettings(s => ({ ...s, foamIntensity: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ padding: '8px', background: '#333', borderRadius: '4px', marginTop: '4px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Band Width: {waterSettings.bandWidth.toFixed(2)}</label>
                  <input type="range" min="0.5" max="5" step="0.1" value={waterSettings.bandWidth} onChange={(e) => setWaterSettings(s => ({ ...s, bandWidth: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Tilt: {waterSettings.tiltDegrees.toFixed(0)}°</label>
                    <input type="range" min="0" max="20" step="1" value={waterSettings.tiltDegrees} onChange={(e) => setWaterSettings(s => ({ ...s, tiltDegrees: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Amplitude: {waterSettings.amplitude.toFixed(2)}</label>
                    <input type="range" min="0" max="0.6" step="0.01" value={waterSettings.amplitude} onChange={(e) => setWaterSettings(s => ({ ...s, amplitude: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Speed: {waterSettings.speed.toFixed(2)}</label>
                    <input type="range" min="0.2" max="3" step="0.05" value={waterSettings.speed} onChange={(e) => setWaterSettings(s => ({ ...s, speed: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Band Foam: {waterSettings.bandFoamIntensity.toFixed(2)}</label>
                    <input type="range" min="0" max="2" step="0.01" value={waterSettings.bandFoamIntensity} onChange={(e) => setWaterSettings(s => ({ ...s, bandFoamIntensity: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Band Blend: {waterSettings.bandShorelineBlend.toFixed(2)}</label>
                    <input type="range" min="0" max="5" step="0.05" value={waterSettings.bandShorelineBlend} onChange={(e) => setWaterSettings(s => ({ ...s, bandShorelineBlend: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                  <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Band Wave: {waterSettings.bandWaveHeight.toFixed(2)}</label>
                    <input type="range" min="0" max="0.5" step="0.01" value={waterSettings.bandWaveHeight} onChange={(e) => setWaterSettings(s => ({ ...s, bandWaveHeight: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                  </div>
                </div>
                <div style={{ padding: '8px', background: '#333', borderRadius: '4px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#aaa' }}>Band Distortion: {waterSettings.bandDistortionStrength.toFixed(2)}</label>
                  <input type="range" min="0" max="1" step="0.01" value={waterSettings.bandDistortionStrength} onChange={(e) => setWaterSettings(s => ({ ...s, bandDistortionStrength: parseFloat(e.target.value) }))} style={{ width: '100%' }} />
                </div>

                {/* Rock row helpers aligned to tiles */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginTop: '8px' }}>
                  <button onClick={() => addRockRow('north')} style={{ padding: '6px', background: '#666', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>Add Rock Row (North)</button>
                  <button onClick={() => addRockRow('south')} style={{ padding: '6px', background: '#666', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>Add Rock Row (South)</button>
                  <button onClick={() => addRockRow('east')} style={{ padding: '6px', background: '#666', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>Add Rock Row (East)</button>
                  <button onClick={() => addRockRow('west')} style={{ padding: '6px', background: '#666', color: 'white', border: '1px solid #555', borderRadius: '4px', cursor: 'pointer' }}>Add Rock Row (West)</button>
                </div>
              </div>
            </CategorySection>

            {/* Buildings Category */}
            <CategorySection
              title="Buildings"
              isExpanded={expandedCategories.has('buildings')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('buildings')) {
                  newSet.delete('buildings');
                } else {
                  newSet.add('buildings');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ color: '#aaa', fontSize: '10px', padding: '10px', textAlign: 'center' }}>
                Buildings coming soon
              </div>
            </CategorySection>

            {/* NPCs Category */}
            <CategorySection
              title="NPCs"
              isExpanded={expandedCategories.has('npcs')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('npcs')) {
                  newSet.delete('npcs');
                } else {
                  newSet.add('npcs');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ color: '#aaa', fontSize: '10px', padding: '10px', textAlign: 'center' }}>
                NPCs coming soon
              </div>
            </CategorySection>

            {/* Objects Category */}
            <CategorySection
              title="Objects"
              isExpanded={expandedCategories.has('objects')}
              onToggle={() => {
                const newSet = new Set(expandedCategories);
                if (newSet.has('objects')) {
                  newSet.delete('objects');
                } else {
                  newSet.add('objects');
                }
                setExpandedCategories(newSet);
              }}
            >
              <div style={{ color: '#aaa', fontSize: '10px', padding: '10px', textAlign: 'center' }}>
                Objects coming soon
              </div>
            </CategorySection>

            {selectedAsset && !eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#4a9eff', textAlign: 'center' }}>
                Selected: {selectedAsset}
              </p>
            )}
            {eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#ff4444', textAlign: 'center' }}>
                Click assets to delete
              </p>
            )}
          </div>
        </div>
      )}

        <Canvas shadows camera={{ position: [5, 5, 5], near: 0.1, far: 1000 }}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={3}
            maxDistance={50}
            enablePan={true}
          />
          
          <ambientLight intensity={0.8} />
          <directionalLight 
          position={[15, 20, 10]}
          intensity={1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />

        {/* AnimationUpdater - MUST be inside Canvas to update mixers */}
        <AnimationUpdater />

        {/* Environment (rotated to match isometric camera) - no water/coastline */}
        <group rotation={[0, Math.PI / 4, 0]}>
          {/* Land / environment only */}
          <Environment groundTiles={groundTiles} defaultTerrainTiles={defaultTerrainTiles} worldSize={worldSize} />
        </group>
        
        {/* Loaded world mesh (merged, optimized) */}
        {loadedWorldMesh && (
          <group rotation={[0, Math.PI / 4, 0]}>
            <LoadedWorldMesh mesh={loadedWorldMesh} />
          </group>
        )}
        
        <CharacterModel input={input} cameraSettings={cameraSettings} placedAssets={placedAssets} groundTiles={allTerrainTiles} worldSize={worldSize} />
        {npcs.map(npc => (
          <WalkingNPC key={npc.id} npcData={npc} />
        ))}
        {/* Placed assets from drag and drop (render only when not using merged mesh) */}
        <group rotation={[0, Math.PI / 4, 0]}>
        {!loadedWorldMesh && placedAssets.map(asset => {
          // Handle different asset types with appropriate components
          if (asset.type === 'grass') {
            const grassTypes = ['Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall'];
            const type = (asset as any).variant || grassTypes[Math.floor(Math.random() * grassTypes.length)];
            return (
              <GrassPatch 
                key={asset.id} 
                position={asset.position} 
                rotation={asset.rotation} 
                type={type}
                scale={asset.scale}
              />
            );
          } else if (asset.type === 'pebble') {
            const pebbleTypes = ['Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Round_4', 'Pebble_Round_5'];
            const variant = (asset as any).variant || pebbleTypes[Math.floor(Math.random() * pebbleTypes.length)];
            return (
              <SmallRock 
                key={asset.id} 
                position={asset.position} 
                rotation={asset.rotation} 
                variant={variant}
                scale={asset.scale}
              />
            );
          } else if (asset.type === 'flower') {
            const flowerTypes = ['Flower_3_Single', 'Flower_4_Single', 'Petal_1', 'Petal_2', 'Petal_3'];
            const type = (asset as any).variant || flowerTypes[Math.floor(Math.random() * flowerTypes.length)];
            return (
              <GrassPatch 
                key={asset.id} 
                position={asset.position} 
                rotation={asset.rotation} 
                type={type}
                scale={asset.scale}
              />
            );
          } else {
            return (
              <PlacedAsset 
                key={asset.id} 
                assetType={asset.type} 
                position={asset.position} 
                rotation={asset.rotation}
                scale={asset.scale}
                id={asset.id}
              />
            );
          }
        })}
        </group>
        {/* Cursor indicators */}
        {eraseMode && <EraseCursor size={eraseBrushSize} />}
        {elevationMode && <ElevationCursor size={brushSize} />}
        
        {/* Ground click handler for placing/erasing assets */}
        <GroundClickHandler
          selectedAsset={selectedAsset}
          eraseMode={eraseMode}
          elevationMode={elevationMode}
          elevationValue={elevationValue}
          brushSize={brushSize}
          eraseBrushSize={eraseBrushSize}
          placedAssets={placedAssets}
          groundTiles={allTerrainTiles}
          worldSize={worldSize}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          dragStart={dragStart}
          setDragStart={setDragStart}
          onPlaceAsset={(data) => {
            if (selectedAsset && selectedAsset !== 'grass' && selectedAsset !== 'water') {
              const id = `placed-${Date.now()}-${Math.random()}`;
              setPlacedAssets(prev => [...prev, {
                id,
                type: selectedAsset,
                position: data.position,
                rotation: data.rotation,
                scale: data.scale,
              }]);
            }
          }}
          onEraseAsset={(id) => {
            setPlacedAssets(prev => prev.filter(asset => asset.id !== id));
          }}
          onPaintGround={(tiles) => {
            setGroundTiles(prev => {
              const newMap = new Map(prev);
              tiles.forEach(tile => {
                newMap.set(tile.key, { type: tile.type, elevation: tile.elevation });
              });
              return newMap;
            });
          }}
          onPaintElevation={(tiles: Array<{ key: string; elevation: number }>) => {
            setGroundTiles(prev => {
              const newMap = new Map(prev);
              tiles.forEach((tile: { key: string; elevation: number }) => {
                const existing = prev.get(tile.key) || defaultTerrainTiles.get(tile.key);
                if (existing) {
                  newMap.set(tile.key, { type: existing.type, elevation: tile.elevation });
                }
              });
              return newMap;
            });
          }}
        />
        </Canvas>
      </div>
  );
}

export default MinimalDemo;
