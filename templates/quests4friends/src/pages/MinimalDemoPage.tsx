import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as BufferGeometryUtils from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { animationManager } from '../systems/animation/AnimationManager';
import { cameraOcclusionManager } from '../systems/camera/CameraOcclusionManager';

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
}

function CharacterModel({ input, cameraSettings, placedAssets, groundTiles }: CharacterModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const velocityRef = useRef(new THREE.Vector3());
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

    // Camera-relative movement: transform input based on camera orientation
    const moveSpeed = 5;
    const inputDir = new THREE.Vector3();
    
    if (input.forward) inputDir.z = -1;
    else if (input.backward) inputDir.z = 1;

    if (input.left) inputDir.x = -1;
    else if (input.right) inputDir.x = 1;

    if (inputDir.length() > 0) {
      inputDir.normalize();
      
      // Get camera's forward and right vectors (projected onto XZ plane)
      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0; // Project to XZ plane
      cameraForward.normalize();

      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
      cameraRight.normalize();

      // Transform input direction to camera-relative direction
      velocityRef.current
        .copy(cameraForward.multiplyScalar(-inputDir.z))
        .add(cameraRight.multiplyScalar(inputDir.x))
        .multiplyScalar(moveSpeed);
    } else {
      velocityRef.current.set(0, 0, 0);
    }

    // Calculate new position
    const newPosition = groupRef.current.position.clone().add(velocityRef.current.clone().multiplyScalar(dt));
    
    // Get terrain elevation at new position
    const terrainWorldSize = 100;
    const terrainTileSize = 1; // Smaller tiles
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
      // If tile not found, sample from nearby tiles for smooth interpolation
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
    
    // Set Y position to terrain elevation (smooth lerp)
    newPosition.y = THREE.MathUtils.lerp(groupRef.current.position.y, terrainElevation + 0.5, 0.15);
    
    // Check collision with placed assets
    const playerRadius = 0.8; // Player collision radius
    let canMove = true;
    
    for (const asset of placedAssets) {
      // Different collision radii for trees vs rocks (trees are bigger)
      const baseRadius = asset.type === 'tree' ? 1.5 : 0.8;
      const assetRadius = asset.scale * baseRadius;
      
      const distance = Math.sqrt(
        Math.pow(asset.position[0] - newPosition.x, 2) +
        Math.pow(asset.position[2] - newPosition.z, 2)
      );
      
      // Collision if player is too close to asset
      if (distance < playerRadius + assetRadius) {
        canMove = false;
              break;
            }
          }
          
    // Only apply movement if no collision - smooth movement with lerp to reduce jitter
    if (canMove) {
      groupRef.current.position.lerp(newPosition, 1.0); // Smooth transition
    } else {
      // If blocked, try to slide along the obstruction (partial movement)
      const slideFactor = 0.3; // Allow slight movement when blocked
      const partialPosition = groupRef.current.position.clone().lerp(newPosition, slideFactor);
      groupRef.current.position.copy(partialPosition);
    }

    // Clamp position (world size)
    const clampWorldSize = 50; // Half of worldSize since world is 100
    groupRef.current.position.x = Math.max(-clampWorldSize, Math.min(clampWorldSize, groupRef.current.position.x));
    groupRef.current.position.z = Math.max(-clampWorldSize, Math.min(clampWorldSize, groupRef.current.position.z));

    // Isometric camera FOLLOWS character with adjustable pitch and zoom
    const angle = Math.PI * 0.25; // Base angle
    const distance = cameraSettings.zoom; // Use setting
    const height = Math.sin(cameraSettings.pitch) * distance; // Pitch affects height
    const horizontalDistance = Math.cos(cameraSettings.pitch) * distance; // Horizontal distance
    
    const charPosition = groupRef.current.position;

    camera.position.x = charPosition.x + Math.sin(angle) * horizontalDistance;
    camera.position.y = charPosition.y + height;
    camera.position.z = charPosition.z + Math.cos(angle) * horizontalDistance;
    camera.lookAt(
      charPosition.x,
      charPosition.y + 0.5,
      charPosition.z
    );

    // Face direction of movement
    if (velocityRef.current.length() > 0.1) {
      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );
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

// ==================== Merged Terrain Mesh Component ====================

interface MergedTerrainProps {
  allTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  tileSize: number;
  worldSize: number;
}

function MergedTerrain({ allTiles, tileSize, worldSize }: MergedTerrainProps) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const terrainRef = useRef<THREE.Mesh>(null);
  
  // Load grass texture if available
  useEffect(() => {
    const loader = new THREE.TextureLoader();
          loader.load(
      '/Assets/Stylized Nature MegaKit[Standard]/glTF/Grass.png',
      (loadedTexture) => {
        loadedTexture.wrapS = THREE.RepeatWrapping;
        loadedTexture.wrapT = THREE.RepeatWrapping;
        loadedTexture.repeat.set(worldSize / 10, worldSize / 10); // Scale texture appropriately
        setTexture(loadedTexture);
      },
            undefined,
      () => {
        setTexture(null);
      }
    );
  }, [worldSize]);

  // Create single merged terrain mesh with smooth interpolation
  const terrainGeometry = useMemo(() => {
    const gridSize = Math.floor(worldSize / tileSize);
    const worldRadius = worldSize / 2;
    
    // Create heightmap array with smooth interpolation
    const heightmap: number[][] = [];
    for (let x = 0; x <= gridSize; x++) {
      heightmap[x] = [];
      for (let z = 0; z <= gridSize; z++) {
        const key = `${x},${z}`;
        const tile = allTiles.get(key);
        const baseElevation = tile ? tile.elevation : 0;
        
        // Sample neighbors for smooth interpolation (only grass tiles)
        let totalElevation = baseElevation;
        let count = 1;
        
        // Check 8 neighbors
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            if (dx === 0 && dz === 0) continue;
            const nKey = `${x + dx},${z + dz}`;
            const neighbor = allTiles.get(nKey);
            if (neighbor && neighbor.type === 'grass') {
              totalElevation += neighbor.elevation;
              count++;
            }
          }
        }
        
        // Smooth interpolation - blend with neighbors
        if (count > 1) {
          const avgElevation = totalElevation / count;
          // Blend between current and average (more weight on neighbors for smoothness)
          heightmap[x][z] = baseElevation * 0.3 + avgElevation * 0.7;
        } else {
          heightmap[x][z] = baseElevation;
        }
      }
    }
    
    // Create plane geometry for entire terrain
    const geometry = new THREE.PlaneGeometry(worldSize, worldSize, gridSize, gridSize);
    const positions = geometry.attributes.position.array as Float32Array;
    
    // Set vertex heights from heightmap
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]; // -worldSize/2 to +worldSize/2
      const z = positions[i + 2]; // -worldSize/2 to +worldSize/2
      
      // Convert to grid coordinates
      const gridX = Math.floor((x + worldRadius) / tileSize);
      const gridZ = Math.floor((z + worldRadius) / tileSize);
      
      // Clamp to bounds
      const clampedX = Math.max(0, Math.min(gridSize, gridX));
      const clampedZ = Math.max(0, Math.min(gridSize, gridZ));
      
      // Get height from heightmap
      const height = heightmap[clampedX]?.[clampedZ] ?? 0;
      positions[i + 1] = height; // Y position (becomes Z after rotation)
    }
    
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();
    
    return geometry;
  }, [allTiles, tileSize, worldSize]);

  return (
    <mesh
      ref={terrainRef}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    >
      <primitive object={terrainGeometry} />
      <meshStandardMaterial 
        map={texture || undefined}
        color={texture ? '#ffffff' : '#3d6b2d'}
        roughness={0.8}
      />
    </mesh>
  );
}

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

function GrassPatch({ position, rotation, type }: { position: [number, number, number]; rotation: number; type: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [grassScene, setGrassScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${type}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(0.8 + Math.random() * 0.4); // Random scale variation
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
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
  }, [type]);

  if (!grassScene) return null;

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]}>
      <primitive object={grassScene} />
    </group>
  );
}

// ==================== Small Rock Component ====================

function SmallRock({ position, rotation, variant }: { position: [number, number, number]; rotation: number; variant: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [rockScene, setRockScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    const assetPath = `/Assets/Stylized Nature MegaKit[Standard]/glTF/${variant}.gltf`;

    loader.load(
      assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        const scale = 0.4 + Math.random() * 0.3; // Slightly larger so they're visible
        cloned.scale.setScalar(scale);
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
  }, [variant]);

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

// ==================== Tree Component (for existing trees) ====================

function Tree({ position }: { position: [number, number, number] }) {
  return <PlacedAsset assetType="tree1" position={position} />;
}

// ==================== Environment ====================

interface EnvironmentProps {
  groundTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
  defaultTerrainTiles: Map<string, { type: 'grass' | 'water'; elevation: number }>;
}

function Environment({ groundTiles, defaultTerrainTiles }: EnvironmentProps) {
  const worldSize = 100;
  const tileSize = 1; // Smaller tiles for more natural feel

  // Merge user-painted tiles with default tiles
  const allTiles = useMemo(() => {
    const merged = new Map(defaultTerrainTiles);
    groundTiles.forEach((value, key) => {
      merged.set(key, value);
    });
    return merged;
  }, [defaultTerrainTiles, groundTiles]);

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


  // Generate random grass patches
  const grassPatches = useMemo(() => {
    const result: Array<{ position: [number, number, number]; rotation: number; type: string }> = [];
    const worldRadius = worldSize / 2;
    const numPatches = 150; // More grass patches for natural look
    
    const grassTypes = ['Grass_Common_Short', 'Grass_Common_Tall', 'Grass_Wispy_Short', 'Grass_Wispy_Tall'];
    
    for (let i = 0; i < numPatches; i++) {
      const x = (Math.random() - 0.5) * worldSize * 0.9;
      const z = (Math.random() - 0.5) * worldSize * 0.9;
      
      // Get elevation at this position
      const gridX = Math.floor((x + worldRadius) / tileSize);
      const gridZ = Math.floor((z + worldRadius) / tileSize);
      const key = `${gridX},${gridZ}`;
      const tile = allTiles.get(key);
      
      // Only place on grass, not water
      if (tile && tile.type === 'grass') {
        const type = grassTypes[Math.floor(Math.random() * grassTypes.length)];
        result.push({
          position: [x, tile.elevation, z],
          rotation: Math.random() * Math.PI * 2,
          type
        });
      }
    }
    
    return result;
  }, [worldSize, tileSize, allTiles]);

  // Generate random small rocks (optimized count)
  const smallRocks = useMemo(() => {
    const result: Array<{ position: [number, number, number]; rotation: number; variant: string }> = [];
    const worldRadius = worldSize / 2;
    const numRocks = 50; // Reduced for performance
    
    const pebbleVariants = [
      'Pebble_Round_1', 'Pebble_Round_2', 'Pebble_Round_3', 'Pebble_Round_4', 'Pebble_Round_5',
      'Pebble_Square_1', 'Pebble_Square_2', 'Pebble_Square_3', 'Pebble_Square_4', 'Pebble_Square_5', 'Pebble_Square_6'
    ];
    
    for (let i = 0; i < numRocks; i++) {
      const x = (Math.random() - 0.5) * worldSize * 0.9;
      const z = (Math.random() - 0.5) * worldSize * 0.9;
      
      // Get elevation at this position
      const gridX = Math.floor((x + worldRadius) / tileSize);
      const gridZ = Math.floor((z + worldRadius) / tileSize);
      const key = `${gridX},${gridZ}`;
      const tile = allTiles.get(key);
      
      // Only place on grass, not water
      if (tile && tile.type === 'grass') {
        const variant = pebbleVariants[Math.floor(Math.random() * pebbleVariants.length)];
        result.push({
          position: [x, tile.elevation + 0.01, z], // Slightly above ground
          rotation: Math.random() * Math.PI * 2,
          variant
        });
      }
    }
    
    return result;
  }, [worldSize, tileSize, allTiles]);

  const worldRadius = worldSize / 2;

  return (
    <>
      {/* Merged terrain mesh (single draw call) */}
      <MergedTerrain allTiles={allTiles} tileSize={tileSize} worldSize={worldSize} />
      
      {/* Merged water mesh */}
      <MergedWater waterTiles={waterTilesForRender} tileSize={tileSize} worldSize={worldSize} />

      {/* Grass patches scattered randomly */}
      {grassPatches.map((patch, i) => (
        <GrassPatch key={`grass-patch-${i}`} position={patch.position} rotation={patch.rotation} type={patch.type} />
      ))}

      {/* Small rocks scattered randomly */}
      {smallRocks.map((rock, i) => (
        <SmallRock key={`rock-${i}`} position={rock.position} rotation={rock.rotation} variant={rock.variant} />
      ))}

      {/* Trees scattered around - no grid helper (removed) */}
      {trees.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
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
    const worldSize = 100;
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
    const worldSize = 100;
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
    const worldSize = 100;
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
  const [placedAssets, setPlacedAssets] = useState<Array<{ id: string; type: string; position: [number, number, number]; rotation: number; scale: number }>>([]);
  const [groundTiles, setGroundTiles] = useState<Map<string, { type: 'grass' | 'water'; elevation: number }>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['ground', 'nature']));
  const [elevationMode, setElevationMode] = useState(false);
  const [elevationValue, setElevationValue] = useState(0);
  const [brushSize, setBrushSize] = useState(3);
  const [eraseBrushSize, setEraseBrushSize] = useState(2);

  // Generate default terrain tiles (shared between Environment and CharacterModel)
  const defaultTerrainTiles = useMemo(() => {
    const worldSize = 100;
    const tileSize = 1; // Smaller tiles for more natural feel
    const gridSize = Math.floor(worldSize / tileSize);
    const centerX = gridSize / 2;
    const centerZ = gridSize / 2;
    const hillRadius = gridSize * 0.15;
    const hillHeight = 2.5;
    
    // Generate elevation map
    const elevationMap: number[][] = [];
    for (let x = 0; x < gridSize; x++) {
      elevationMap[x] = [];
      for (let z = 0; z < gridSize; z++) {
        const dx = x - centerX;
        const dz = z - centerZ;
        const distFromCenter = Math.sqrt(dx * dx + dz * dz);
        
        let elevation = 0;
        if (distFromCenter < hillRadius) {
          const normalizedDist = distFromCenter / hillRadius;
          elevation = hillHeight * (1 - normalizedDist * normalizedDist);
        } else {
          const nx = (x / gridSize) * 4;
          const nz = (z / gridSize) * 4;
          elevation = Math.sin(nx) * Math.cos(nz) * 0.3 + 
                     Math.sin(nx * 2) * Math.cos(nz * 2) * 0.15;
        }
        elevationMap[x][z] = Math.max(-0.5, Math.min(3, elevation));
      }
    }
    
    // Generate default tiles
    const tiles = new Map<string, { type: 'grass' | 'water'; elevation: number }>();
    for (let x = 0; x < gridSize; x++) {
      for (let z = 0; z < gridSize; z++) {
        const key = `${x},${z}`;
        const elevation = elevationMap[x][z];
        const isWater = elevation < -0.2 && 
                       (Math.pow(x - gridSize/2, 2) + Math.pow(z - gridSize/2, 2) < Math.pow(gridSize * 0.3, 2) ||
                        Math.pow(x - gridSize/4, 2) + Math.pow(z - gridSize/3, 2) < Math.pow(gridSize * 0.15, 2));
        tiles.set(key, {
          type: isWater ? 'water' : 'grass',
          elevation: isWater ? -0.3 : elevation
        });
      }
    }
    return tiles;
  }, []);

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

        {/* Always use default Environment for now - TiledWorldRenderer can be added later */}
        <Environment groundTiles={groundTiles} defaultTerrainTiles={defaultTerrainTiles} />
        <CharacterModel input={input} cameraSettings={cameraSettings} placedAssets={placedAssets} groundTiles={allTerrainTiles} />
        {npcs.map(npc => (
          <WalkingNPC key={npc.id} npcData={npc} />
        ))}
        {/* Placed assets from drag and drop */}
        {placedAssets.map(asset => (
          <PlacedAsset 
            key={asset.id} 
            assetType={asset.type} 
            position={asset.position} 
            rotation={asset.rotation}
            scale={asset.scale}
            id={asset.id}
          />
        ))}
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
