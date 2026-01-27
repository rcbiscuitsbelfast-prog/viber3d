import React, { Suspense, useState, useMemo, useRef, useEffect } from 'react';
import { useFrame, Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, Sky, useGLTF } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import CustomButton from '@/components/CustomButton';
import * as THREE from 'three';
import { oceanVertexShader, oceanFragmentShader, skyboxVertexShader, skyboxFragmentShader } from '@/shaders/OceanShaders';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { cloneGltf } from '../utils/cloneGltf';
import { animationManager } from '../systems/animation/AnimationManager';
import { usePhysicsWorld } from '../systems/physics/PhysicsWorld';
import { InstancedForest } from '../components/InstancedForest';
import { InstancedRocks } from '../components/InstancedRocks';
import { InstancedGrass } from '../components/InstancedGrass';
import { InstancedBushes } from '../components/InstancedBushes';
import CharacterSelector, { CHARACTER_OPTIONS } from '../components/CharacterSelector';
import { PhysicsWorldProvider } from '../components/PhysicsWorldProvider';
import { QuestMarker } from '../components/QuestLabel';
import { WalkingNPC } from '../components/WalkingNPC';
import { generateSimplexTerrain, sampleTerrainHeight } from '../utils/simplexTerrain';
import { createNoise2D } from 'simplex-noise';
import * as CANNON from 'cannon-es';
import { 
  exportWorldConfig, 
  importWorldConfigFromJSON, 
  configToWorldState,
  saveWorldToLocalStorage,
  loadWorldFromLocalStorage,
  loadAutoSavedWorld,
  getSavedWorldsMetadata,
  deleteWorldFromLocalStorage,
  loadWorldConfigFromFile,
  saveWorldToFirebase,
  loadWorldFromFirebase,
  getUserWorlds,
  deleteWorldFromFirebase,
  isFirebaseAvailable
} from '../systems/world';
import { isFirebaseConfigured } from '../lib/firebase';

// Patch three.js with three-mesh-bvh for accelerated raycasting
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

// Animation Updater Component
function AnimationUpdater() {
  useFrame((_state, delta) => {
    animationManager.update(delta);
  });
  return null;
}

// Camera Controller Component
function CameraController({ 
  cameraView, 
  testMode, 
  characterPositionRef,
  characterRotationRef 
}: { 
  cameraView: 'third-person' | 'topdown' | 'isometric' | 'birdseye';
  testMode: boolean;
  characterPositionRef?: React.RefObject<THREE.Vector3>;
  characterRotationRef?: React.RefObject<number>;
}) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (!testMode || !characterPositionRef?.current) return;
    
    const pos = characterPositionRef.current;
    const rot = characterRotationRef?.current || 0;
    
    switch (cameraView) {
      case 'third-person':
        // Standard third-person view (handled by CharacterController)
        return;
      case 'topdown':
        // Top-down view
        camera.position.set(pos.x, pos.y + 50, pos.z);
        camera.lookAt(pos.x, pos.y, pos.z);
        break;
      case 'isometric':
        // Isometric view (45-degree angle)
        const isoOffset = new THREE.Vector3(15, 15, 15);
        camera.position.copy(pos).add(isoOffset);
        camera.lookAt(pos.x, pos.y, pos.z);
        break;
      case 'birdseye':
        // Bird's eye view (high angle, far back)
        const birdOffset = new THREE.Vector3(0, 30, 20);
        birdOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rot);
        camera.position.copy(pos).add(birdOffset);
        camera.lookAt(pos.x, pos.y, pos.z);
        break;
    }
  });
  
  return null;
}

// Character Controller Component
type CrossfadeFn = (anim: string, duration?: number) => void;
function CharacterController({ 
  startPosition, 
  terrainMeshRef,
  manualAssets,
  proceduralAssets,
  characterModelPath,
  onAnimationTrigger,
  cameraView,
  positionRef: externalPositionRef,
  rotationRef: externalRotationRef,
}: { 
  startPosition: [number, number, number];
  terrainMeshRef: React.RefObject<THREE.Mesh>;
  manualAssets: Array<any>;
  proceduralAssets: { trees: Array<any>; rocks: Array<any> };
  characterModelPath?: string;
  onAnimationTrigger?: (crossfade: CrossfadeFn) => void;
  cameraView?: 'third-person' | 'topdown' | 'isometric' | 'birdseye';
  positionRef?: React.MutableRefObject<THREE.Vector3>;
  rotationRef?: React.MutableRefObject<number>;
}) {
  const characterRef = useRef<THREE.Group>(null);
  const groupRef = useRef<THREE.Group>(null);
  const positionRef = useRef<THREE.Vector3>(new THREE.Vector3(...startPosition));
  const [position, setPosition] = useState<THREE.Vector3>(new THREE.Vector3(...startPosition)); // For React rendering
  const [rotation, setRotation] = useState(0);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const velocity = useRef(new THREE.Vector3());
  const verticalVelocity = useRef(0);
  const isGrounded = useRef(true);
  const isMoving = useRef(false);
  const keys = useRef<{[key: string]: boolean}>({});
  const jumpPressed = useRef(false); // Track if jump was already processed this frame
  const lastPositionUpdate = useRef(0); // Throttle position state updates
  const { camera } = useThree();
  
  // Load KayKit character model
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        const modelPath = characterModelPath || '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb';
        console.log('[CharacterController] Loading character:', modelPath);
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(
            modelPath,
            (gltf) => {
              console.log('[CharacterController] Model loaded successfully');
              resolve(gltf);
            },
            undefined,
            (error) => {
              console.error('[CharacterController] Load error:', error);
              reject(error);
            }
          );
        });
        
        // Use proper cloning with skeleton binding (like other working examples)
        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        
        // Set scale - KayKit models are typically 1 unit = 1 meter
        characterScene.scale.setScalar(1);
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;
        
        // Ensure model is visible and has shadows
        characterScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
          }
        });
        
        console.log('[CharacterController] Character model ready:', characterScene);
        setModel(characterScene);
        setModelLoaded(true);
      } catch (err) {
        console.error('[CharacterController] Failed to load character model:', err);
        // Don't set fallback - let user see the error
        setModelLoaded(true);
      }
    };

    loadCharacter();
  }, [characterModelPath]);

  // Character animation hook
  const { crossfadeTo, isLoaded: animationsLoaded } = useCharacterAnimation({
    characterId: 'testworld-player',
    assetId: 'char_rogue',
    model: model,
    defaultAnimation: 'idle',
  });
  
  // Expose crossfadeTo through callback ref
  useEffect(() => {
    if (onAnimationTrigger && crossfadeTo) {
      onAnimationTrigger(crossfadeTo);
    }
  }, [onAnimationTrigger, crossfadeTo]);
  
  // Character movement controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = true;
      // Also handle space key variations
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = true;
        keys.current['Space'] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = false;
      // Also handle space key variations
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = false;
        keys.current['Space'] = false;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  // Check collision with trees and rocks using exact bounding boxes
  const checkCollision = (newPos: THREE.Vector3) => {
    const characterBox = new THREE.Box3(
      new THREE.Vector3(newPos.x - 0.3, newPos.y - 0.6, newPos.z - 0.2),
      new THREE.Vector3(newPos.x + 0.3, newPos.y + 0.6, newPos.z + 0.2)
    );
    
    // Check manual assets with exact bounding boxes
    for (const asset of manualAssets) {
      if (asset.type === 'tree' || asset.type === 'rock') {
        const pos = asset.position;
        const scale = asset.scale || 1.0;
        
        // Create bounding box based on asset type
        let assetBox;
        if (asset.type === 'tree') {
          // Tree trunk: narrow cylinder approximated as box
          assetBox = new THREE.Box3(
            new THREE.Vector3(pos[0] - 0.3 * scale, pos[1], pos[2] - 0.3 * scale),
            new THREE.Vector3(pos[0] + 0.3 * scale, pos[1] + 3 * scale, pos[2] + 0.3 * scale)
          );
        } else {
          // Rock: wider base box
          assetBox = new THREE.Box3(
            new THREE.Vector3(pos[0] - 0.6 * scale, pos[1], pos[2] - 0.6 * scale),
            new THREE.Vector3(pos[0] + 0.6 * scale, pos[1] + 0.8 * scale, pos[2] + 0.6 * scale)
          );
        }
        
        if (characterBox.intersectsBox(assetBox)) {
          return true;
        }
      }
    }
    
    // Check procedural trees with exact trunk boxes
    for (const tree of proceduralAssets.trees) {
      const groundY = tree.pos[1];
      const treeBox = new THREE.Box3(
        new THREE.Vector3(tree.pos[0] - 0.3, groundY, tree.pos[2] - 0.3),
        new THREE.Vector3(tree.pos[0] + 0.3, groundY + 3, tree.pos[2] + 0.3)
      );
      
      if (characterBox.intersectsBox(treeBox)) {
        return true;
      }
    }
    
    // Check procedural rocks with exact shape boxes - allow stepping over small rocks
    for (const rock of proceduralAssets.rocks) {
      const groundY = rock.pos[1];
      // Rocks use scale * 1.5 in rendering, need to match that
      const rockScale = (rock.scale || 1.0) * 1.5;
      const rockHeight = 0.8 * rockScale;
      
      // Allow stepping over small rocks (< 0.6 units tall)
      if (rockHeight < 0.6) {
        continue;
      }
      
      const rockBox = new THREE.Box3(
        new THREE.Vector3(rock.pos[0] - 0.6 * rockScale, groundY, rock.pos[2] - 0.6 * rockScale),
        new THREE.Vector3(rock.pos[0] + 0.6 * rockScale, groundY + rockHeight, rock.pos[2] + 0.6 * rockScale)
      );
      
      if (characterBox.intersectsBox(rockBox)) {
        return true;
      }
    }
    
    return false;
  };
  
  useFrame((_, delta) => {
    if (!characterRef.current) return;
    
    const moveSpeed = 8;
    const rotSpeed = 3;
    const jumpForce = 6.5;
    const gravity = -15;
    
    // Check if moving
    const wasMoving = isMoving.current;
    isMoving.current = keys.current['w'] || keys.current['s'] || keys.current['arrowup'] || keys.current['arrowdown'];
    
    // Update animation based on movement
    if (animationsLoaded) {
      if (!isGrounded.current) {
        // Jumping
        if (onAnimationTrigger) onAnimationTrigger(crossfadeTo);
      } else if (isMoving.current && !wasMoving) {
        crossfadeTo('run', 0.2);
      } else if (!isMoving.current && wasMoving) {
        crossfadeTo('idle', 0.2);
      }
    }
    
    // Jump with spacebar - only trigger once per key press
    const spacePressed = keys.current[' '] || keys.current['Space'];
    if (spacePressed && isGrounded.current && !jumpPressed.current) {
      verticalVelocity.current = jumpForce;
      isGrounded.current = false;
      jumpPressed.current = true;
      if (animationsLoaded) {
        crossfadeTo('jump', 0.1);
        if (onAnimationTrigger) onAnimationTrigger(crossfadeTo);
      }
    }
    // Reset jump flag when space is released
    if (!spacePressed) {
      jumpPressed.current = false;
    }
    
    // Apply gravity with smoother curve
    verticalVelocity.current += gravity * delta;
    
    // WASD movement
    if (keys.current['w'] || keys.current['arrowup']) {
      velocity.current.z = -moveSpeed * delta;
    } else if (keys.current['s'] || keys.current['arrowdown']) {
      velocity.current.z = moveSpeed * delta;
    } else {
      velocity.current.z = 0;
    }
    
    // Rotation
    if (keys.current['a'] || keys.current['arrowleft']) {
      setRotation(prev => prev + rotSpeed * delta);
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      setRotation(prev => prev - rotSpeed * delta);
    }
    
    // Apply rotation to velocity
    const rotatedVelocity = velocity.current.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
    
    // Update horizontal position using ref (no state update = no jitter)
    const newPos = positionRef.current.clone();
    newPos.x += rotatedVelocity.x;
    newPos.z += rotatedVelocity.z;
    
    // Apply vertical velocity (for jumping/falling)
    newPos.y += verticalVelocity.current * delta;
    
    // Character height offset (feet at ground level, character center ~0.9 units up)
    const characterHeightOffset = 0.9;

    // Check collision before moving
    if (!checkCollision(newPos)) {
      // Use BVH-accelerated raycast to check ground height
      if (terrainMeshRef && terrainMeshRef.current) {
        const raycaster = new THREE.Raycaster();
        // Raycast from character position downward
        raycaster.ray.origin.set(newPos.x, newPos.y + 10, newPos.z);
        raycaster.ray.direction.set(0, -1, 0);
        const intersects = raycaster.intersectObject(terrainMeshRef.current, false);
        
        if (intersects.length > 0) {
          const terrainHeight = intersects[0].point.y;
          const groundDistance = newPos.y - terrainHeight;
          
          // If grounded (within small threshold) or falling into ground
          if (isGrounded.current || (verticalVelocity.current <= 0 && groundDistance <= characterHeightOffset + 0.1)) {
            // Smooth ground snapping - use lerp to reduce jitter
            const targetY = terrainHeight + characterHeightOffset;
            newPos.y = THREE.MathUtils.lerp(newPos.y, targetY, 0.3); // Smooth interpolation
            verticalVelocity.current = 0;
            isGrounded.current = true;
          } else {
            // In air - let gravity work, but check if we're falling into ground
            if (verticalVelocity.current < 0 && newPos.y <= terrainHeight + characterHeightOffset) {
              newPos.y = terrainHeight + characterHeightOffset;
          verticalVelocity.current = 0;
          isGrounded.current = true;
        }
      }
        } else {
          // Raycast failed - if falling and below minimum height, stop falling
          if (verticalVelocity.current < 0 && newPos.y < 2) {
            newPos.y = 2;
            verticalVelocity.current = 0;
            isGrounded.current = true;
          }
        }
      } else {
        // Terrain not ready - prevent falling below minimum
        if (newPos.y < 2) {
          newPos.y = 2;
          verticalVelocity.current = 0;
          isGrounded.current = true;
        }
      }
      
      // Update ref position (immediate, no re-render)
      positionRef.current.copy(newPos);
      
      // Update character mesh position directly (no React state = smooth)
      if (characterRef.current) {
        characterRef.current.position.copy(newPos);
      }
      
      // Throttle React state updates to reduce jitter (update every 100ms)
      const now = Date.now();
      if (now - lastPositionUpdate.current > 100) {
        setPosition(newPos.clone());
        lastPositionUpdate.current = now;
      }
    }
    
    if (characterRef.current) {
      characterRef.current.rotation.y = rotation;
    }
    
    // Update external refs if provided
    if (externalPositionRef?.current) {
      externalPositionRef.current.copy(positionRef.current);
    }
    if (externalRotationRef) {
      externalRotationRef.current = rotation;
    }
    
    // Position camera based on view mode (only if third-person, otherwise CameraController handles it)
    if (cameraView === 'third-person' || !cameraView) {
      const cameraOffset = new THREE.Vector3(0, 4, 6);
      cameraOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation);
      camera.position.copy(positionRef.current).add(cameraOffset);
      camera.lookAt(positionRef.current.x, positionRef.current.y + 1, positionRef.current.z);
    }
  });
  
  // KayKit character model
  return (
    <group ref={characterRef} position={position}>
      <group ref={groupRef} rotation={[0, rotation, 0]}>
        {model ? (
          <primitive object={model} />
        ) : (
          // Show loading indicator only if model hasn't loaded yet
          !modelLoaded ? (
            <mesh>
              <boxGeometry args={[1, 2, 1]} />
              <meshStandardMaterial color="orange" />
      </mesh>
          ) : null
        )}
      </group>
    </group>
  );
}

// Animated Bubble Component - MOVED TO components/VolumetricFog.tsx
// SAVED FOR FUTURE USE - Was working well at normal speed
// See: templates/questly/src/components/VolumetricFog.tsx

// Building area type
interface BuildingArea {
  id: number;
  x: number;
  z: number;
  radius: number;
  height: number;
  minimized: boolean;
}

// Draggable Building Area Marker
function BuildingAreaMarker({ 
  area, 
  onPositionChange,
  getTerrainHeightAtPos
}: { 
  area: BuildingArea;
  onPositionChange: (id: number, x: number, z: number) => void;
  getTerrainHeightAtPos: (x: number, z: number) => number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { gl } = useThree();
  
  // Only allow interaction when area is not minimized
  const isInteractive = !area.minimized;
  
  const handlePointerDown = (e: any) => {
    if (!isInteractive) return;
    e.stopPropagation();
    setIsDragging(true);
    gl.domElement.style.cursor = 'grabbing';
  };
  
  const handlePointerUp = () => {
    if (!isInteractive) return;
    setIsDragging(false);
    gl.domElement.style.cursor = 'grab';
  };
  
  const handlePointerMove = (e: any) => {
    if (!isDragging || !isInteractive) return;
    e.stopPropagation();
    
    // Get intersection point with XZ plane
    const intersects = e.intersections;
    if (intersects && intersects.length > 0) {
      const point = intersects[0].point;
      onPositionChange(area.id, Math.round(point.x), Math.round(point.z));
    }
  };
  
  const handlePointerOver = () => {
    if (!isInteractive) return;
    setIsHovered(true);
    if (!isDragging) {
      gl.domElement.style.cursor = 'grab';
    }
  };
  
  const handlePointerOut = () => {
    if (!isInteractive) return;
    setIsHovered(false);
    if (!isDragging) {
      gl.domElement.style.cursor = 'default';
    }
  };
  
  const terrainHeight = getTerrainHeightAtPos(area.x, area.z);
  
  // Don't render anything when minimized
  if (area.minimized) {
    return null;
  }
  
  // Dynamic colors based on state
  const discColor = isDragging ? "#ffcc00" : (isHovered ? "#ffbb00" : "#ffaa00");
  const discOpacity = isDragging ? 0.5 : (isHovered ? 0.45 : 0.3);
  const ringOpacity = isDragging ? 1.0 : (isHovered ? 0.95 : 0.8);
  
  return (
    <group position={[area.x, terrainHeight + area.height, area.z]}>
      {/* Flat disc marker */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={isInteractive ? handlePointerDown : undefined}
        onPointerUp={isInteractive ? handlePointerUp : undefined}
        onPointerMove={isInteractive ? handlePointerMove : undefined}
        onPointerOver={isInteractive ? handlePointerOver : undefined}
        onPointerOut={isInteractive ? handlePointerOut : undefined}
      >
        <circleGeometry args={[area.radius, 32]} />
        <meshStandardMaterial 
          color={discColor} 
          opacity={discOpacity} 
          transparent 
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Edge ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[area.radius - 0.5, area.radius, 32]} />
        <meshStandardMaterial color={discColor} opacity={ringOpacity} transparent />
      </mesh>
    </group>
  );
}

// Heightmap-based terrain component with ref forwarding for BVH
const LowPolyTerrain = React.forwardRef<THREE.Mesh, {
  roughness: number;
  islandSize: number;
  seed: number;
  terrainDetail: number;
  heightScale: number;
  cliffIntensity: number;
  buildingAreas: BuildingArea[];
}>(({ 
  roughness, 
  islandSize, 
  seed, 
  terrainDetail, 
  heightScale, 
  cliffIntensity,
  buildingAreas
}, ref) => {
  const terrainSize = terrainDetail;
  const scale = 200;
  const terrainDataRef = useRef<ReturnType<typeof generateSimplexTerrain> | null>(null);
  
  // Generate heightmap using Simplex Noise for professional terrain
  const generateHeightmap = () => {
    const size = terrainSize + 1;
    
    // Generate terrain using simplex-noise
    const terrainData = generateSimplexTerrain({
      size: terrainSize,
      scale,
      seed,
      octaves: 4,
      persistence: 0.5,
      lacunarity: 2.0,
      islandRadius: islandSize,
      heightScale,
      roughness,
    });
    
    // Store terrain data for height sampling
    terrainDataRef.current = terrainData;
    
    const heights: number[] = [];
    const colors: THREE.Color[] = [];
    
    // Apply building area modifications and convert to arrays
    for (let z = 0; z < size; z++) {
      for (let x = 0; x < size; x++) {
        const idx = x + z * size;
        let height = terrainData.heights[idx];
      
      // Apply building area leveling with blend zones
      if (buildingAreas.length > 0) {
          const worldX = ((x / terrainSize) - 0.5) * scale;
          const worldZ = ((z / terrainSize) - 0.5) * scale;
        
        for (const area of buildingAreas) {
          const distToBuildArea = Math.sqrt(
            Math.pow(worldX - area.x, 2) + 
            Math.pow(worldZ - area.z, 2)
          );
          
          const blendRadius = area.radius * 0.2;
          
          if (distToBuildArea < area.radius - blendRadius) {
            // Full flat area
            height = area.height;
            break;
          } else if (distToBuildArea < area.radius + blendRadius) {
            // Smooth blend zone
            const blendFactor = (distToBuildArea - (area.radius - blendRadius)) / (blendRadius * 2);
            height = area.height * (1 - blendFactor) + height * blendFactor;
            break;
          }
        }
      }
      
      heights.push(height);
        colors.push(terrainData.colors[idx]);
      }
    }
    
    return { heights, colors };
  };
  
  // Generate heightmap and create terrain geometry
  const geometry = useMemo(() => {
    const { heights, colors } = generateHeightmap();
    const geom = new THREE.PlaneGeometry(
      scale, 
      scale, 
      terrainSize, 
      terrainSize
    );
    
    // Apply heights to vertices
    const positions = geom.attributes.position.array;
    for (let i = 0; i < positions.length / 3; i++) {
      positions[i * 3 + 2] = heights[i];
    }
    
    // Apply vertex colors
    const colorArray = new Float32Array(colors.length * 3);
    for (let i = 0; i < colors.length; i++) {
      colorArray[i * 3] = colors[i].r;
      colorArray[i * 3 + 1] = colors[i].g;
      colorArray[i * 3 + 2] = colors[i].b;
    }
    geom.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    
    geom.computeVertexNormals();
    geom.rotateX(-Math.PI / 2);
    
    return geom;
  }, [terrainSize, roughness, islandSize, seed, heightScale, cliffIntensity, buildingAreas]);
  
  const meshRef = useRef<THREE.Mesh>(null);
  
  // Compute BVH once after geometry is created - CRITICAL for performance
  useEffect(() => {
    if (geometry) {
      // Dispose old BVH if it exists
      if (geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
      
      // Compute new BVH - this makes raycasting 100x faster
      if (geometry.computeBoundsTree) {
        geometry.computeBoundsTree();
        console.log('[BVH] Bounds tree computed for terrain mesh');
      }
    }
    
    if (meshRef.current) {
      meshRef.current.userData.isTerrain = true;
      if (typeof ref === 'function') {
        ref(meshRef.current);
      } else if (ref) {
        (ref as React.MutableRefObject<THREE.Mesh | null>).current = meshRef.current;
      }
    }
    
    // Cleanup: dispose BVH when component unmounts or geometry changes
    return () => {
      if (geometry && geometry.disposeBoundsTree) {
        geometry.disposeBoundsTree();
      }
    };
  }, [geometry, ref]);
  
  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial 
        vertexColors
        flatShading 
        roughness={0.8}
        metalness={0.1}
      />
    </mesh>
  );
});

LowPolyTerrain.displayName = 'LowPolyTerrain';

// Rock component with multiple procedural variations
function Rock({ 
  position, 
  rotation,
  scale,
  variant
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
  variant: number;
}) {
  // KayKit Forest Nature Pack rocks (18 variations)
  const rockPaths = [
    '/kaykit/Rock_1_A_Color1.gltf', '/kaykit/Rock_1_B_Color1.gltf', '/kaykit/Rock_1_C_Color1.gltf',
    '/kaykit/Rock_1_D_Color1.gltf', '/kaykit/Rock_1_E_Color1.gltf', '/kaykit/Rock_1_F_Color1.gltf',
    '/kaykit/Rock_2_A_Color1.gltf', '/kaykit/Rock_2_B_Color1.gltf', '/kaykit/Rock_2_C_Color1.gltf',
    '/kaykit/Rock_2_D_Color1.gltf', '/kaykit/Rock_2_E_Color1.gltf', '/kaykit/Rock_2_F_Color1.gltf',
    '/kaykit/Rock_3_A_Color1.gltf', '/kaykit/Rock_3_B_Color1.gltf', '/kaykit/Rock_3_C_Color1.gltf',
    '/kaykit/Rock_3_D_Color1.gltf', '/kaykit/Rock_3_E_Color1.gltf', '/kaykit/Rock_3_F_Color1.gltf',
  ];
  
  const { scene } = useGLTF(rockPaths[variant % rockPaths.length]);
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale * 1.5}
      castShadow
    />
  );
}

// Bush component - KayKit Model
function Bush({ 
  position, 
  rotation,
  scale,
  variant
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
  variant: number;
}) {
  const bushPaths = [
    '/kaykit/Bush_3_B_Color1.gltf',
    '/kaykit/Bush_3_C_Color1.gltf',
    '/kaykit/Bush_4_A_Color1.gltf',
    '/kaykit/Bush_4_B_Color1.gltf',
    '/kaykit/Bush_4_C_Color1.gltf',
    '/kaykit/Bush_4_D_Color1.gltf',
    '/kaykit/Bush_4_E_Color1.gltf',
    '/kaykit/Bush_4_F_Color1.gltf',
  ];
  
  const { scene } = useGLTF(bushPaths[variant % bushPaths.length]);
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale * 1.2}
      castShadow
    />
  );
}

// Pine Tree Component - KayKit Model (Tree_4 - conifer/pine trees)
function PineTree({ 
  position, 
  rotation,
  scale
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
}) {
  const { scene } = useGLTF('/kaykit/Tree_4_A_Color1.gltf');
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale}
      castShadow
    />
  );
}

// Broad Tree Component - KayKit Model (Tree_1 - large deciduous)
function BroadTree({ 
  position, 
  rotation,
  scale
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
}) {
  const { scene } = useGLTF('/kaykit/Tree_1_A_Color1.gltf');
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale}
      castShadow
    />
  );
}

// Bushy Tree Component - KayKit Model (Tree_2 - medium deciduous)
function BushyTree({ 
  position, 
  rotation,
  scale
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
}) {
  const { scene } = useGLTF('/kaykit/Tree_2_A_Color1.gltf');
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale}
      castShadow
    />
  );
}

// Grass Clump Component - KayKit Model
function GrassClump({ 
  position, 
  rotation,
  scale,
  variant = 0
}: { 
  position: [number, number, number]; 
  rotation: number;
  scale: number;
  variant?: number;
}) {
  const grassPaths = [
    '/kaykit/Grass_1_A_Color1.gltf',
    '/kaykit/Grass_1_B_Color1.gltf',
    '/kaykit/Grass_1_C_Color1.gltf',
    '/kaykit/Grass_1_D_Color1.gltf',
  ];
  
  const { scene } = useGLTF(grassPaths[variant % grassPaths.length]);
  
  return (
    <primitive 
      object={scene.clone()} 
      position={position} 
      rotation={[0, rotation, 0]} 
      scale={scale}
      castShadow
    />
  );
}

// Forest Props Interface
interface ForestProps {
  roughness: number;
  islandSize: number;
  seed: number;
  terrainDetail: number;
  treeAmount: number;
  treeSize: number;
  grassAmount: number;
  grassSize: number;
  terrainGrassCoverage: number;
  buildingGrassFalloff: number;
  rockAmount: number;
  rockSize: number;
  bushAmount: number;
  bushSize: number;
  heightScale: number;
  cliffIntensity: number;
  treeHeightOffset: number;
  grassHeightOffset: number;
  rockHeightOffset: number;
  bushHeightOffset: number;
  buildingAreas: Array<{ x: number; z: number; radius: number; height: number }>;
  slopeAdjustmentIntensity: number;
  getTerrainHeight: (x: number, z: number) => number;
  onAssetsGenerated?: (assets: { trees: Array<{ pos: [number, number, number]; scale: number }>; rocks: Array<{ pos: [number, number, number]; scale: number }> }) => void;
  terrainMeshRef: React.RefObject<THREE.Mesh>;
}

// Forest with multiple trees - positioned on green terrain only
function Forest(props: ForestProps) {
  const {
  roughness, 
  islandSize, 
  seed, 
  terrainDetail, 
  treeAmount, 
  treeSize, 
  grassAmount, 
  grassSize, 
  terrainGrassCoverage,
  buildingGrassFalloff,
  rockAmount, 
  rockSize, 
  bushAmount, 
  bushSize, 
  heightScale, 
  cliffIntensity,
  treeHeightOffset,
  grassHeightOffset,
  rockHeightOffset,
  bushHeightOffset,
  buildingAreas,
  slopeAdjustmentIntensity,
  getTerrainHeight,
    onAssetsGenerated,
    terrainMeshRef
  } = props;
  
  // Calculate slope-based height adjustment for assets
  const getSlopeBasedAdjustment = (worldX: number, worldZ: number) => {
    const sampleDist = 0.5;
    const heightN = getTerrainHeight(worldX, worldZ + sampleDist);
    const heightS = getTerrainHeight(worldX, worldZ - sampleDist);
    const heightE = getTerrainHeight(worldX + sampleDist, worldZ);
    const heightW = getTerrainHeight(worldX - sampleDist, worldZ);
    
    // Calculate slope magnitude (how steep the terrain is)
    const slopeX = Math.abs(heightE - heightW) / (sampleDist * 2);
    const slopeZ = Math.abs(heightN - heightS) / (sampleDist * 2);
    const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
    
    // On flat terrain (slope ~0): minimal offset (-0.2)
    // On steep slopes: more offset (up to -3 or more based on slider)
    // Use intensity slider to control how much slope affects the offset
    const baseOffset = -0.2; // Base offset for flat terrain (less aggressive for grass/rocks/bushes)
    const slopeOffset = -slope * slopeAdjustmentIntensity; // Additional offset based on slope
    
    return baseOffset + slopeOffset;
  };
  
  // Tree-specific adjustment - much lighter to prevent over-burial
  const getTreeSlopeAdjustment = (worldX: number, worldZ: number) => {
    const sampleDist = 0.5;
    const heightN = getTerrainHeight(worldX, worldZ + sampleDist);
    const heightS = getTerrainHeight(worldX, worldZ - sampleDist);
    const heightE = getTerrainHeight(worldX + sampleDist, worldZ);
    const heightW = getTerrainHeight(worldX - sampleDist, worldZ);
    
    const slopeX = Math.abs(heightE - heightW) / (sampleDist * 2);
    const slopeZ = Math.abs(heightN - heightS) / (sampleDist * 2);
    const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
    
    // Trees need much less adjustment - only slight offset even on slopes
    const baseOffset = -0.05; // Minimal base offset for trees
    const slopeOffset = -slope * slopeAdjustmentIntensity * 0.25; // 25% of slope effect
    
    return baseOffset + slopeOffset;
  };
  
  // Adjust height to sit on building plane if within building area
  // Adjust height to sit on building plane if within any building area
  const adjustForBuildingArea = (worldX: number, worldZ: number, currentHeight: number) => {
    if (buildingAreas.length === 0) return { height: currentHeight, inArea: false };
    
    // Check each building area
    for (const area of buildingAreas) {
      const distToBuildArea = Math.sqrt(
        Math.pow(worldX - area.x, 2) + 
        Math.pow(worldZ - area.z, 2)
      );
      
      // If within building area, mark as in area
      if (distToBuildArea < area.radius) {
        return { height: area.height, inArea: true };
      }
    }
    
    return { height: currentHeight, inArea: false };
  };
  
  // Generate tree positions with type-based distribution by height
  const generateTreePositions = () => {
    const positions: Array<{ 
      pos: [number, number, number]; 
      rotation: number;
      scale: number;
      treeType: 'pine' | 'broad' | 'bushy';
    }> = [];
    const scale = 200;
    const attempts = treeAmount; // Use slider value
    
    // Use seed for consistent random generation
    let seedRandom = seed;
    const seededRandom = () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };
    
    const sizeMultiplier = treeSize / 100; // Convert percentage to multiplier
    
    for (let i = 0; i < attempts; i++) {
      const x = (seededRandom() - 0.5) * scale * 0.6;
      const z = (seededRandom() - 0.5) * scale * 0.6;
      const height = getTerrainHeight(x, z);
      
      // Skip if outside island bounds or in water (water level is typically 0.9, so use 1.0 as minimum)
      // Trees should only spawn on land (height >= 1.0)
      if (height < 1.0) {
        continue;
      }
      
      let shouldSpawn = false;
      let treeType: 'pine' | 'broad' | 'bushy' = 'pine';
      
      // Trees spawn at ALL height levels above water
      // Higher elevations (50+): Mostly pine trees
      if (height >= 50) {
        shouldSpawn = seededRandom() < 0.8; // 80% coverage at high elevations
        treeType = seededRandom() < 0.8 ? 'pine' : (seededRandom() < 0.5 ? 'broad' : 'bushy');
      }
      // Very high elevations (30-50): Mixed trees
      else if (height >= 30 && height < 50) {
        const rand = seededRandom();
        if (rand < 0.6) {
          shouldSpawn = true;
          treeType = seededRandom() < 0.6 ? 'pine' : (seededRandom() < 0.5 ? 'broad' : 'bushy');
        }
      }
      // High elevations (15-30): Good coverage
      else if (height >= 15 && height < 30) {
        const rand = seededRandom();
        if (rand < 0.7) {
          shouldSpawn = true;
          treeType = seededRandom() < 0.5 ? 'pine' : (seededRandom() < 0.5 ? 'broad' : 'bushy');
        }
      }
      // Dark green top level (10-15): 90% pine coverage
      else if (height >= 10 && height < 15) {
        shouldSpawn = seededRandom() < 0.9;
        treeType = 'pine';
      }
      // Mid green level (6-10): 40% pine + 30% other trees
      else if (height >= 6 && height < 10) {
        const rand = seededRandom();
        if (rand < 0.4) {
          shouldSpawn = true;
          treeType = 'pine';
        } else if (rand < 0.7) {
          shouldSpawn = true;
          treeType = seededRandom() < 0.5 ? 'broad' : 'bushy';
        }
      }
      // Light green bottom level (3-6): 40% other trees only
      else if (height >= 3 && height < 6) {
        if (seededRandom() < 0.4) {
          shouldSpawn = true;
          treeType = seededRandom() < 0.5 ? 'broad' : 'bushy';
        }
      }
      // Low level (1-3): Some trees
      else if (height >= 1.0 && height < 3) {
        if (seededRandom() < 0.2) {
          shouldSpawn = true;
          treeType = seededRandom() < 0.5 ? 'broad' : 'bushy';
        }
      }
      
      if (shouldSpawn) {
        const rotation = seededRandom() * Math.PI * 2;
        // Add size variation: 0.8 to 1.2 times the base size
        const sizeVariation = 0.8 + (seededRandom() * 0.4);
        const treeScale = sizeMultiplier * sizeVariation;
        
        // Get exact terrain height at this position (no adjustments for placement)
        const exactTerrainHeight = getTerrainHeight(x, z);
        const buildingCheck = adjustForBuildingArea(x, z, exactTerrainHeight);
        
        // Skip if in building area (procedural assets not allowed there)
        if (buildingCheck.inArea) {
          continue;
        }
        
        // Use exact terrain height - trees should sit directly on terrain
        // Only apply minimal offset if needed (treeHeightOffset is typically 0)
        const finalY = exactTerrainHeight + treeHeightOffset;
        
        positions.push({
          pos: [x, finalY, z],
          rotation: rotation,
          scale: treeScale,
          treeType: treeType
        });
      }
    }
    
    return positions;
  };
  
  // Generate grass positions automatically based on terrain grid
  // Much faster: samples terrain grid directly instead of random attempts + raycasting
  const generateGrassPositions = (terrainGrassCoverage: number, buildingGrassFalloff: number) => {
    const positions: Array<{ 
      pos: [number, number, number]; 
      rotation: number;
      scale: number;
      variant?: number;
    }> = [];
    const scale = 200;
    
    // Grid-based sampling for automatic coverage - much faster than random attempts
    // SIGNIFICANTLY increased spacing to prevent freezing and PC lockup
    const gridSpacing = 5.0; // Increased from 3.5 to 5.0 to reduce computation by ~40%
    const gridSize = Math.floor(scale * 0.95 / gridSpacing); // Increased from 0.6 to 0.95 to cover edges
    const MAX_GRASS_INSTANCES = 8000; // Reduced from 15000 to 8000 to prevent memory issues
    
    // Use seed for consistent random generation
    let seedRandom = seed + 1000; // Offset seed for different pattern
    const seededRandom = () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };
    
    const sizeMultiplier = grassSize / 100; // Convert percentage to multiplier
    
    // First, ensure full coverage of building areas with MUCH reduced sampling density
    // This ensures building areas get complete grass coverage across the entire circle
    buildingAreaLoop: for (const area of buildingAreas) {
      // SIGNIFICANTLY reduced density - sample every 5.0 units instead of 2.5 (75% reduction)
      const maxRadius = area.radius * 0.9; // Only sample up to 90% of radius
      const radialSamples = Math.ceil(maxRadius / 5.0); // Increased from 2.5 to 5.0
      
      for (let r = 0; r < radialSamples; r++) {
        // Early exit check before processing this radial ring
        if (positions.length >= MAX_GRASS_INSTANCES) {
          console.warn(`[Grass Generation] Hit max instances cap (${MAX_GRASS_INSTANCES}) during building area generation`);
          break buildingAreaLoop; // Break all loops
        }
        
        const radius = (r / radialSamples) * maxRadius;
        const circumference = Math.PI * 2 * radius;
        const samplesOnCircle = Math.max(6, Math.ceil(circumference / 5.0)); // Increased spacing to 5.0
        
        for (let a = 0; a < samplesOnCircle; a++) {
          // Early exit check in inner loop too
          if (positions.length >= MAX_GRASS_INSTANCES) {
            break buildingAreaLoop; // Break all loops
          }
          
          const angle = (a / samplesOnCircle) * Math.PI * 2;
          
          // Convert polar to cartesian
          const localX = radius * Math.cos(angle);
          const localZ = radius * Math.sin(angle);
          
          // Add smaller random offset to prevent extending beyond circle edges
          const offsetX = (seededRandom() - 0.5) * 0.3;
          const offsetZ = (seededRandom() - 0.5) * 0.3;
          
          const x = area.x + localX + offsetX;
          const z = area.z + localZ + offsetZ;
          
          // Double-check if within circle radius (accounting for offset)
          const distToCenter = Math.sqrt(
            Math.pow(x - area.x, 2) + Math.pow(z - area.z, 2)
          );
          
          // Outer 10% of building area has absolutely no grass
          if (distToCenter > maxRadius) {
            continue;
          }
          
          // Get height - use building area height
          const height = area.height;
          
          // Skip if too low (below water)
          if (height < 0.5) {
            continue;
          }
          
          // Coverage gradually increases from 90% of radius toward center
          // Normalize distance: 0 = center, 1 = 90% of radius (edge of grass area)
          const normalizedDistance = distToCenter / maxRadius;
          // Coverage increases from edge (90% radius) to center
          // falloff slider controls how much coverage increases: 0 = uniform, 100 = full gradient
          const falloffFactor = 1 - (normalizedDistance * (buildingGrassFalloff / 100));
          const baseCoverage = 0.576; // Base coverage at center (64% * 0.9 = 57.6%, reduced by 10%)
          // Apply terrain grass coverage multiplier to match regular terrain
          const coverage = Math.max(0.1, baseCoverage * falloffFactor * (terrainGrassCoverage / 100)); // Minimum 10% coverage
          
          if (seededRandom() < coverage) {
            
            const rotation = seededRandom() * Math.PI * 2;
            const scaleVariation = 0.5 + (seededRandom() * 1.0); // More variation: 0.5 to 1.5
            const grassScale = scaleVariation * sizeMultiplier;
            
            // Add small position jitter for randomness
            const positionJitter = (seededRandom() - 0.5) * 0.4;
            const jitteredX = x + positionJitter;
            const jitteredZ = z + (seededRandom() - 0.5) * 0.4;
            
            const finalY = height + grassHeightOffset;
            const variant = Math.floor(seededRandom() * 4);
            
            positions.push({
              pos: [jitteredX, finalY, jitteredZ],
              rotation: rotation,
              scale: grassScale,
              variant: variant
            });
          }
        }
      }
    }
    
    // Sample terrain on a grid for automatic coverage
    // Add randomness to break up uniform grid pattern
    // Early exit if we've already hit the cap
    if (positions.length >= MAX_GRASS_INSTANCES) {
      console.warn(`[Grass Generation] Skipping terrain grass - already at cap (${MAX_GRASS_INSTANCES})`);
      return positions.slice(0, MAX_GRASS_INSTANCES);
    }
    
    // Process terrain grid with early exit
    terrainGridLoop: for (let gx = 0; gx < gridSize; gx++) {
      for (let gz = 0; gz < gridSize; gz++) {
        // Early exit if we hit the cap
        if (positions.length >= MAX_GRASS_INSTANCES) {
          console.warn(`[Grass Generation] Hit max instances cap (${MAX_GRASS_INSTANCES}) during terrain generation at grid ${gx},${gz}`);
          break terrainGridLoop; // Break all loops
        }
        
        // Add random offset to grid positions for more natural distribution
        const gridOffsetX = (seededRandom() - 0.5) * gridSpacing * 0.6; // Random offset up to 60% of spacing
        const gridOffsetZ = (seededRandom() - 0.5) * gridSpacing * 0.6;
        
        const baseX = (gx / gridSize - 0.5) * scale * 0.95; // Match gridSize coverage area
        const baseZ = (gz / gridSize - 0.5) * scale * 0.95;
        const x = baseX + gridOffsetX;
        const z = baseZ + gridOffsetZ;
        
        // Skip if already covered by building area grass (avoid duplicates)
        // OPTIMIZATION: Only check if we have building areas, and use direct distance check
        if (buildingAreas.length > 0) {
          let inBuildingArea = false;
          for (const area of buildingAreas) {
            const distToBuildArea = Math.sqrt(
              Math.pow(x - area.x, 2) + Math.pow(z - area.z, 2)
            );
            if (distToBuildArea < area.radius * 0.9) {
              inBuildingArea = true;
              break;
            }
          }
          if (inBuildingArea) {
            continue; // Skip - already handled by building area pass above
          }
        }
        
        // Get height directly from terrain mesh if available (fast)
        // Fallback to getTerrainHeight if mesh not ready
        let height: number;
        if (terrainMeshRef?.current?.geometry) {
          // Fast path: sample from geometry directly
          const geometry = terrainMeshRef.current.geometry;
          const geometryPositions = geometry.attributes.position.array as Float32Array;
          const size = Math.sqrt(geometryPositions.length / 3);
          
          // Convert world position to grid coordinates
          const nx = (x / scale + 0.5) * (size - 1);
          const nz = (z / scale + 0.5) * (size - 1);
          
          if (nx >= 0 && nx < size && nz >= 0 && nz < size) {
            const x0 = Math.floor(nx);
            const z0 = Math.floor(nz);
            const x1 = Math.min(x0 + 1, size - 1);
            const z1 = Math.min(z0 + 1, size - 1);
            
            const fx = nx - x0;
            const fz = nz - z0;
            
            // Bilinear interpolation
            const getHeight = (ix: number, iz: number) => {
              const idx = (iz * size + ix) * 3 + 1; // Y component after rotation
              return geometryPositions[idx] || 0;
            };
            
            const h00 = getHeight(x0, z0);
            const h10 = getHeight(x1, z0);
            const h01 = getHeight(x0, z1);
            const h11 = getHeight(x1, z1);
            
            height = (1 - fx) * (1 - fz) * h00 +
                     fx * (1 - fz) * h10 +
                     (1 - fx) * fz * h01 +
                     fx * fz * h11;
          } else {
            height = getTerrainHeight(x, z);
          }
        } else {
          height = getTerrainHeight(x, z);
        }
        
        const finalHeight = height;
        
        // Skip if below sand level (water level is 0.9, sand starts at 0.5)
        if (finalHeight < 0.5) {
          continue; // Skip below sand/water level
        }
        
        // Determine if this is sand area (0.5-1.0) or green area (>= 1.0)
        const isSandArea = finalHeight >= 0.5 && finalHeight < 1.0;
        
        // Automatic coverage based on height - match builder terrain coverage (57.6% base)
        // All green-level terrains (natural terrain) have minimum coverage matching builder terrain
        // Sand areas get <10% coverage
        // Apply terrain grass coverage multiplier from slider
        const builderBaseCoverage = 0.576; // Match builder terrain base coverage (57.6%)
        let baseCoverage: number;
        
        if (isSandArea) {
          // Sand areas: <10% coverage (use 8% base, can be adjusted with slider)
          baseCoverage = 0.08;
        } else {
          // Green areas: full builder terrain coverage
          baseCoverage = builderBaseCoverage; // 57.6% coverage for all green areas
        }
        
        // Apply terrain grass coverage multiplier from slider (100% = no change, 50% = half coverage, 150% = 1.5x coverage)
        // For sand, cap at 10% maximum even with slider
        const coverage = isSandArea 
          ? Math.min(0.10, baseCoverage * (terrainGrassCoverage / 100)) // Sand: max 10%
          : Math.min(1.0, baseCoverage * (terrainGrassCoverage / 100)); // Green: full range
        
        // Spawn grass based on coverage probability
        if (seededRandom() < coverage) {
          // Early exit if we hit the cap
          if (positions.length >= MAX_GRASS_INSTANCES) {
            break terrainGridLoop;
          }
          
          // More random rotation - add some variation
          const rotation = seededRandom() * Math.PI * 2;
          
          // More varied scale for natural look (0.6 to 1.4 instead of 0.8 to 1.2)
          const scaleVariation = 0.6 + (seededRandom() * 0.8); // Wider range
          const grassScale = scaleVariation * sizeMultiplier;
          
          // Add small random position offset for more natural distribution
          const positionJitter = (seededRandom() - 0.5) * 0.3; // Small random offset
          const jitteredX = x + positionJitter;
          const jitteredZ = z + (seededRandom() - 0.5) * 0.3;
          
          // Use terrain height directly without slope adjustment (match builder terrain behavior)
          // Builder terrain grass works fine at regular height, so regular terrain should too
          const finalY = finalHeight + grassHeightOffset;
          
          // Add variant for instanced rendering - more random distribution
          const variant = Math.floor(seededRandom() * 4); // 4 grass variants
          positions.push({
            pos: [jitteredX, finalY, jitteredZ],
            rotation: rotation,
            scale: grassScale,
            variant: variant
          });
        }
      }
    }
    
    // Cap positions to prevent memory allocation errors
    if (positions.length > MAX_GRASS_INSTANCES) {
      // Randomly sample to reduce to max
      const sampled: typeof positions = [];
      const step = positions.length / MAX_GRASS_INSTANCES;
      for (let i = 0; i < MAX_GRASS_INSTANCES; i++) {
        const idx = Math.floor(i * step);
        sampled.push(positions[idx]);
      }
      return sampled;
    }
    
    return positions;
  };
  
  
  // Generate rock positions with height-based placement
  const generateRockPositions = () => {
    const positions: Array<{ 
      pos: [number, number, number]; 
      rotation: number;
      scale: number;
      variant: number;
    }> = [];
    const scale = 200;
    const attempts = rockAmount; // Use slider value
    
    // Use seed for consistent random generation
    let seedRandom = seed + 2000; // Offset seed for different pattern
    const seededRandom = () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };
    
    const sizeMultiplier = rockSize / 100; // Convert percentage to multiplier
    
    for (let i = 0; i < attempts; i++) {
      const x = (seededRandom() - 0.5) * scale * 0.6;
      const z = (seededRandom() - 0.5) * scale * 0.6;
      const height = getTerrainHeight(x, z);
      
      // Skip if outside island bounds
      if (height < 0) {
        continue;
      }
      
      // Calculate slope to reduce rock spawning on steep terrain
      const sampleDist = 1;
      const heightRight = getTerrainHeight(x + sampleDist, z);
      const heightLeft = getTerrainHeight(x - sampleDist, z);
      const heightFront = getTerrainHeight(x, z + sampleDist);
      const heightBack = getTerrainHeight(x, z - sampleDist);
      
      const slopeX = Math.abs(heightRight - heightLeft) / (sampleDist * 2);
      const slopeZ = Math.abs(heightFront - heightBack) / (sampleDist * 2);
      const slope = Math.sqrt(slopeX * slopeX + slopeZ * slopeZ);
      
      // Reduce spawn chance on slopes (0 = flat, 1+ = steep)
      // Flat terrain: 100% of base spawn chance
      // Moderate slope (0.5): 50% of base spawn chance
      // Steep slope (1.0+): 10% of base spawn chance
      const slopeMultiplier = Math.max(0.1, 1 - (slope * 0.9));
      
      // Place rocks on sand/beach (0.5-3) and green areas (3-15)
      let spawnChance = 0;
      if (height >= 0.5 && height < 3) {
        spawnChance = 0.3 * slopeMultiplier; // Rocks on sand/beach
      } else if (height >= 3 && height < 15) {
        spawnChance = (height > 8 ? 0.4 : 0.2) * slopeMultiplier; // More rocks at higher elevations
      }
      
      if (spawnChance > 0 && seededRandom() < spawnChance) {
        const rotation = seededRandom() * Math.PI * 2;
        // Add significant size variation for rocks: 0.6 to 1.6 times the base size
        const sizeVariation = 0.6 + (seededRandom() * 1.0);
        const rockScale = sizeMultiplier * sizeVariation;
        const variant = Math.floor(seededRandom() * 18); // 18 KayKit rock variations
        const slopeAdjustment = getSlopeBasedAdjustment(x, z);
        let finalHeight = height + slopeAdjustment + rockHeightOffset;
        const buildingCheck = adjustForBuildingArea(x, z, finalHeight);
        
        // Skip if in building area
        if (buildingCheck.inArea) {
          continue;
        }
        
        // Use calculated height or building area height
        const finalY = buildingCheck.inArea ? buildingCheck.height : (height + slopeAdjustment + rockHeightOffset);
        
        positions.push({
          pos: [x, finalY, z],
          rotation: rotation,
          scale: rockScale,
          variant: variant
        });
      }
    }
    
    return positions;
  };
  
  // Generate bush positions - low grass areas
  const generateBushPositions = () => {
    const positions: Array<{ 
      pos: [number, number, number]; 
      rotation: number;
      scale: number;
      variant: number;
    }> = [];
    const scale = 200;
    const attempts = bushAmount;
    
    let seedRandom = seed + 3000;
    const seededRandom = () => {
      seedRandom = (seedRandom * 9301 + 49297) % 233280;
      return seedRandom / 233280;
    };
    
    const sizeMultiplier = bushSize / 100;
    
    for (let i = 0; i < attempts; i++) {
      const x = (seededRandom() - 0.5) * scale * 0.6;
      const z = (seededRandom() - 0.5) * scale * 0.6;
      const height = getTerrainHeight(x, z);
      
      // Skip if outside island bounds
      if (height < 0) {
        continue;
      }
      
      // Bushes on lower green areas (3-8)
      if (height >= 3 && height < 8) {
        if (seededRandom() < 0.3) {
          const rotation = seededRandom() * Math.PI * 2;
          // Add size variation: 0.8 to 1.3 times the base size
          const sizeVariation = 0.8 + (seededRandom() * 0.5);
          const bushScale = sizeMultiplier * sizeVariation;
          const variant = Math.floor(seededRandom() * 8); // 8 bush types from KayKit
          const slopeAdjustment = getSlopeBasedAdjustment(x, z);
          let finalHeight = height + slopeAdjustment + bushHeightOffset;
          const buildingCheck = adjustForBuildingArea(x, z, finalHeight);
          
          // Skip if in building area
          if (buildingCheck.inArea) {
            continue;
          }
          
          // Use calculated height or building area height
          const finalY = buildingCheck.inArea ? buildingCheck.height : (height + slopeAdjustment + bushHeightOffset);
          
          positions.push({
            pos: [x, finalY, z],
            rotation: rotation,
            scale: bushScale,
            variant: variant
          });
        }
      }
    }
    
    return positions;
  };
  
  // Generate assets with loading state
  const trees = useMemo(() => {
    console.log('[Loading] Generating trees...');
    const result = generateTreePositions();
    console.log(`[Loading] Generated ${result.length} trees`);
    return result;
  }, [roughness, islandSize, seed, terrainDetail, treeAmount, treeSize, treeHeightOffset, buildingAreas, getTerrainHeight, slopeAdjustmentIntensity]);
  
  const grass = useMemo(() => {
    console.log('[Loading] Generating grass...');
    const result = generateGrassPositions(terrainGrassCoverage, buildingGrassFalloff);
    console.log(`[Loading] Generated ${result.length} grass instances`);
    return result;
  }, [roughness, islandSize, seed, terrainDetail, grassSize, grassHeightOffset, buildingAreas, terrainMeshRef, getTerrainHeight, slopeAdjustmentIntensity, terrainGrassCoverage, buildingGrassFalloff]);
  
  const rocks = useMemo(() => {
    console.log('[Loading] Generating rocks...');
    const result = generateRockPositions();
    console.log(`[Loading] Generated ${result.length} rocks`);
    return result;
  }, [roughness, islandSize, seed, terrainDetail, rockAmount, rockSize, rockHeightOffset, buildingAreas, getTerrainHeight, slopeAdjustmentIntensity]);
  
  const bushes = useMemo(() => {
    console.log('[Loading] Generating bushes...');
    const result = generateBushPositions();
    console.log(`[Loading] Generated ${result.length} bushes`);
    return result;
  }, [roughness, islandSize, seed, terrainDetail, bushAmount, bushSize, bushHeightOffset, buildingAreas, getTerrainHeight, slopeAdjustmentIntensity]);
  
  // Assets are generated, but loading state is managed by parent TestWorld component
  
  // Notify parent component of generated assets for collision detection
  useEffect(() => {
    if (onAssetsGenerated) {
      onAssetsGenerated({ 
        trees: trees.map(t => ({ pos: t.pos, scale: t.scale })), 
        rocks: rocks.map(r => ({ pos: r.pos, scale: r.scale }))
      });
    }
  }, [trees, rocks, onAssetsGenerated]);
  
  return (
    <>
      {/* Trees - Instanced rendering for performance */}
      <InstancedForest trees={trees} castShadow receiveShadow={false} />
      
      {/* Grass - Instanced rendering for performance */}
      <InstancedGrass grass={grass} castShadow receiveShadow={false} />
      
      {/* Rocks - Instanced rendering for performance */}
      <InstancedRocks rocks={rocks} castShadow receiveShadow={false} />
      
      {/* Bushes - Instanced rendering for performance */}
      <InstancedBushes bushes={bushes} castShadow receiveShadow={false} />
    </>
  );
}

// Dynamic Skybox Component
function DynamicSkybox({
  timeOfDay,
  sunIntensity,
}: {
  timeOfDay: number;
  sunIntensity: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.timeOfDay.value = timeOfDay;
      materialRef.current.uniforms.sunIntensity.value = sunIntensity;
      
      // Update sun direction
      const angle = (timeOfDay - 0.25) * Math.PI * 2;
      const sunDir = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();
      materialRef.current.uniforms.sunDirection.value = sunDir;
    }
  }, [timeOfDay, sunIntensity]);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();
    }
  });
  
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      sunIntensity: { value: sunIntensity },
      skyColorDay: { value: new THREE.Color(0.4, 0.6, 0.9) },
      skyColorHorizon: { value: new THREE.Color(0.75, 0.9, 1.0) },
      skyColorNight: { value: new THREE.Color(0.227, 0.270, 0.314) }, // Matches fog/water night color
      timeOfDay: { value: timeOfDay },
    }),
    [timeOfDay, sunIntensity]
  );
  
  return (
    <mesh>
      <sphereGeometry args={[5000, 60, 40]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={skyboxVertexShader}
        fragmentShader={skyboxFragmentShader}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Dynamic Ocean Component
function DynamicOcean({
  waterLevel,
  timeOfDay,
  waveStrength,
  waveSpeed,
  oceanTransparency,
  oceanSize,
  rippleScale,
}: {
  waterLevel: number;
  timeOfDay: number;
  waveStrength: number;
  waveSpeed: number;
  oceanTransparency: number;
  oceanSize: number;
  rippleScale: number;
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Update uniforms when props change
  useEffect(() => {
    if (materialRef.current && materialRef.current.uniforms) {
      materialRef.current.uniforms.waveStrength.value = waveStrength;
      materialRef.current.uniforms.waveSpeed.value = waveSpeed;
      materialRef.current.uniforms.transparency.value = oceanTransparency;
      materialRef.current.uniforms.rippleScale.value = rippleScale;
      
      // Smooth water color transition based on time of day
      // Matches sky and fog colors at all times
      let waterColor;
      if (timeOfDay >= 0.25 && timeOfDay <= 0.75) {
        // Day time - check for sunrise/sunset
        if (timeOfDay < 0.35) {
          // Sunrise transition (night grey -> day blue)
          const t = (timeOfDay - 0.25) / 0.1;
          waterColor = new THREE.Color(
            0.227 + (0.1 - 0.227) * t,
            0.270 + (0.3 - 0.270) * t,
            0.314 + (0.5 - 0.314) * t
          );
        } else if (timeOfDay > 0.65) {
          // Sunset transition (day blue -> night grey)
          const t = (timeOfDay - 0.65) / 0.1;
          waterColor = new THREE.Color(
            0.1 + (0.227 - 0.1) * t,
            0.3 + (0.270 - 0.3) * t,
            0.5 + (0.314 - 0.5) * t
          );
        } else {
          // Full day - normal ocean blue
          waterColor = new THREE.Color(0.1, 0.3, 0.5);
        }
      } else {
        // Night - dark grey (matches fog and sky)
        waterColor = new THREE.Color(0.227, 0.270, 0.314);
      }
      materialRef.current.uniforms.waterColor.value = waterColor;
      
      // Update sun direction
      const angle = (timeOfDay - 0.25) * Math.PI * 2;
      const sunDir = new THREE.Vector3(
        Math.cos(angle),
        Math.sin(angle),
        0
      ).normalize();
      materialRef.current.uniforms.sunDirection.value = sunDir;
    }
  }, [timeOfDay, waveStrength, waveSpeed, oceanTransparency, rippleScale]);
  
  // Update time uniform every frame - critical for wave animation
  useFrame((state) => {
    // Always update time uniform if material exists
    // This ensures waves animate properly regardless of test mode
    const material = materialRef.current;
    if (material && material.uniforms) {
      const timeUniform = material.uniforms.time;
      if (timeUniform) {
        const elapsedTime = state.clock.getElapsedTime();
        timeUniform.value = elapsedTime;
      }
    }
  });
  
  // Initialize uniforms once - values updated via useEffect
  const uniforms = useMemo(
    () => ({
      time: { value: 0 },
      sunDirection: { value: new THREE.Vector3(0, 1, 0) },
      waterColor: { value: new THREE.Color(0.1, 0.3, 0.5) },
      waveStrength: { value: waveStrength },
      waveSpeed: { value: waveSpeed },
      specularStrength: { value: 2.0 },
      transparency: { value: oceanTransparency },
      rippleScale: { value: rippleScale },
    }),
    [] // Empty deps - uniforms created once, values updated via useEffect and useFrame
  );
  
  // Initialize time uniform when material is ready
  useEffect(() => {
    if (materialRef.current?.uniforms?.time) {
      // Start time from 0 when material is first created
      materialRef.current.uniforms.time.value = 0;
    }
  }, []);
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, waterLevel, 0]} receiveShadow>
      <planeGeometry args={[oceanSize, oceanSize, 128, 128]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={oceanVertexShader}
        fragmentShader={oceanFragmentShader}
        transparent
        side={THREE.DoubleSide}
        needsUpdate
      />
    </mesh>
  );
}

// Erase Brush Indicator - Visual orb showing erase area
function EraseIndicator({
  eraseBrushSize,
  getTerrainHeight,
}: {
  eraseBrushSize: number;
  getTerrainHeight: (x: number, z: number) => number;
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  const [hoverPosition, setHoverPosition] = useState<[number, number, number] | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      const terrainMesh = scene.children.find(
        (child) => child.type === 'Mesh' && child.userData.isTerrain
      );

      if (!terrainMesh) return;

      const intersects = raycaster.intersectObject(terrainMesh, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const terrainY = getTerrainHeight(point.x, point.z);
        setHoverPosition([point.x, terrainY + eraseBrushSize / 2, point.z]);
      } else {
        setHoverPosition(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [camera, raycaster, pointer, scene, eraseBrushSize, getTerrainHeight]);

  if (!hoverPosition) return null;

  return (
    <mesh position={hoverPosition}>
      <sphereGeometry args={[eraseBrushSize, 16, 16]} />
      <meshStandardMaterial 
        color="#ff4444" 
        transparent 
        opacity={0.3}
        wireframe
      />
    </mesh>
  );
}

// Ground Click Handler Component for Manual Placement
function GroundClickHandler({
  selectedAssetType,
  eraseMode,
  eraseBrushSize,
  manualAssets,
  onPlaceAsset,
  onEraseAsset,
  getTerrainHeight,
}: {
  selectedAssetType: 'tree' | 'rock' | 'grass' | 'bush' | null;
  eraseMode: boolean;
  eraseBrushSize: number;
  manualAssets: Array<any>;
  onPlaceAsset: (asset: any) => void;
  onEraseAsset: (id: string) => void;
  getTerrainHeight: (x: number, z: number) => number;
}) {
  const { camera, raycaster, pointer, scene } = useThree();
  const manualAssetsRef = useRef(manualAssets);

  useEffect(() => {
    manualAssetsRef.current = manualAssets;
  }, [manualAssets]);

  useEffect(() => {
    if (!selectedAssetType && !eraseMode) return;

    const handleClick = (event: MouseEvent) => {
      // Ignore clicks on UI elements
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.closest('input') ||
        target.closest('div[class*="absolute"]')
      ) {
        return;
      }

      const canvas = event.target as HTMLCanvasElement;
      if (!canvas || canvas.tagName !== 'CANVAS') return;

      const rect = canvas.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointer, camera);

      // Find terrain mesh
      const terrainMesh = scene.children.find(
        (child) => child.type === 'Mesh' && child.userData.isTerrain
      );

      if (!terrainMesh) return;

      const intersects = raycaster.intersectObject(terrainMesh, false);

      if (intersects.length > 0) {
        const point = intersects[0].point;

        if (eraseMode) {
          // Erase assets within brush radius
          const assetsToErase: string[] = [];
          const currentAssets = manualAssetsRef.current;

          if (currentAssets && Array.isArray(currentAssets)) {
            for (const asset of currentAssets) {
              if (!asset || !asset.position) continue;
              const distance = Math.sqrt(
                Math.pow(asset.position[0] - point.x, 2) +
                  Math.pow(asset.position[2] - point.z, 2)
              );
              if (distance < eraseBrushSize) {
                assetsToErase.push(asset.id);
              }
            }
            assetsToErase.forEach((id) => onEraseAsset(id));
          }
        } else if (selectedAssetType) {
          // Place new asset
          let terrainY = getTerrainHeight(point.x, point.z);
          
          // Random variants based on type
          let treeType: 'pine' | 'broad' | 'bushy' | undefined;
          let variant = 0;
          let grassVariant = 0;
          
          if (selectedAssetType === 'tree') {
            const treeTypes: ('pine' | 'broad' | 'bushy')[] = ['pine', 'broad', 'bushy'];
            treeType = treeTypes[Math.floor(Math.random() * treeTypes.length)];
          } else if (selectedAssetType === 'rock') {
            variant = Math.floor(Math.random() * 18); // 18 rock variants
          } else if (selectedAssetType === 'bush') {
            variant = Math.floor(Math.random() * 8); // 8 bush variants
          } else if (selectedAssetType === 'grass') {
            grassVariant = Math.floor(Math.random() * 4); // 4 grass variants
          }
          
          // Add small negative offset for grass and bush manual placement
          let assetY = terrainY;
          if (selectedAssetType === 'grass' || selectedAssetType === 'bush') {
            assetY -= 0.03;
          }
          const newAsset = {
            id: `manual-${Date.now()}-${Math.random()}`,
            type: selectedAssetType,
            position: [point.x, assetY, point.z] as [number, number, number],
            rotation: Math.random() * Math.PI * 2,
            scale: 0.8 + Math.random() * 0.4,
            variant: selectedAssetType === 'grass' ? grassVariant : variant,
            treeType: treeType,
          };
          onPlaceAsset(newAsset);
        }
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [selectedAssetType, eraseMode, eraseBrushSize, onPlaceAsset, onEraseAsset, camera, raycaster, pointer, scene, getTerrainHeight]);

  return null;
}

// Category Section Component for Manual Mode
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
    <div style={{ marginBottom: '8px', border: '1px solid #475569', borderRadius: '4px', overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '8px',
          background: '#334155',
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
        <div style={{ padding: '8px', background: '#1e293b' }}>
          {children}
        </div>
      )}
    </div>
  );
}
// Darkness Overlay - Fullscreen night effect using fog
function DarknessOverlay({ timeOfDay }: { timeOfDay: number }) {
  const { scene } = useThree();
  
  useEffect(() => {
    // Calculate darkness based on sun position
    const sunHeight = Math.sin((timeOfDay - 0.25) * Math.PI * 2);
    const darkness = Math.max(0, -sunHeight * 0.7); // 0 to 0.7 opacity
    
    // Use fog for consistent darkness
    if (darkness > 0.1) {
      const fogColor = new THREE.Color(0.02, 0.03, 0.08); // Dark blue-black
      scene.fog = new THREE.FogExp2(fogColor.getHex(), darkness * 0.015);
    } else {
      scene.fog = null;
    }
    
    return () => {
      scene.fog = null;
    };
  }, [timeOfDay, scene]);
  
  return null;
}

export default function TestWorld() {
  const navigate = useNavigate();
  const [roughness, setRoughness] = useState(26);
  const [islandSize, setIslandSize] = useState(44);
  const [terrainDetail, setTerrainDetail] = useState(64);
  const [seed, setSeed] = useState(0);
  
  // Asset controls
  const [treeAmount, setTreeAmount] = useState(3500);
  const [treeSize, setTreeSize] = useState(100);
  const [grassAmount, setGrassAmount] = useState(2000);
  const [grassSize, setGrassSize] = useState(100);
  const [terrainGrassCoverage, setTerrainGrassCoverage] = useState(100); // Percentage multiplier for terrain grass coverage
  const [buildingGrassFalloff, setBuildingGrassFalloff] = useState(50); // Percentage falloff from center to edge (0-100)
  const [rockAmount, setRockAmount] = useState(400);
  const [rockSize, setRockSize] = useState(100);
  const [bushAmount, setBushAmount] = useState(600);
  const [bushSize, setBushSize] = useState(100);
  const [treeHeightOffset, setTreeHeightOffset] = useState(0);
  const [grassHeightOffset, setGrassHeightOffset] = useState(0);
  const [rockHeightOffset, setRockHeightOffset] = useState(0);
  const [bushHeightOffset, setBushHeightOffset] = useState(0);
  const [slopeAdjustmentIntensity, setSlopeAdjustmentIntensity] = useState(3.5);
  
  // Additional terrain controls
  const [heightScale, setHeightScale] = useState(55);
  const [waterLevel, setWaterLevel] = useState(0.9);
  const [cliffIntensity, setCliffIntensity] = useState(100);
  
  // Building areas - now multiple
  // Default starter terrain at X: 0, Z: 50, Radius: 45, Height: 2.5
  const [buildingAreas, setBuildingAreas] = useState<BuildingArea[]>([
    { id: 0, x: 0, z: 50, radius: 45, height: 2.5, minimized: false }
  ]);
  const [nextAreaId, setNextAreaId] = useState(1);
  
  // Manual placement mode
  const [manualMode, setManualMode] = useState(false);
  const [testMode, setTestMode] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState('rogue');
  const [enablePhysics, setEnablePhysics] = useState(false); // Toggle physics
  const animationTriggerRef = useRef<((anim: string) => void) | null>(null);
  
  // Quest markers for demo
  const [questMarkers, setQuestMarkers] = useState([
    { id: 1, position: [10, 0, 10] as [number, number, number], label: 'Find the Treasure', type: 'quest' as const },
    { id: 2, position: [-15, 0, 5] as [number, number, number], label: 'Merchant', type: 'npc' as const },
    { id: 3, position: [5, 0, -12] as [number, number, number], label: 'Ancient Ruins', type: 'location' as const },
  ]);
  
  // NPCs with waypoints
  const [npcs, setNpcs] = useState([
    {
      id: 'guard1',
      name: 'Guard',
      position: [15, 0, 15] as [number, number, number],
      waypoints: [
        [15, 0, 15],
        [20, 0, 15],
        [20, 0, 20],
        [15, 0, 20],
      ] as [number, number, number][],
      characterModelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb',
    },
    {
      id: 'merchant1',
      name: 'Merchant',
      position: [-15, 0, 5] as [number, number, number],
      waypoints: [
        [-15, 0, 5],
        [-10, 0, 5],
        [-10, 0, 0],
        [-15, 0, 0],
      ] as [number, number, number][],
      characterModelPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb',
    },
  ]);
  
  // Handle quest marker clicks
  const handleMarkerClick = (markerId: number) => {
    console.log('Quest marker clicked:', markerId);
    // TODO: Open quest dialog or show details
  };
  
  // Handle NPC clicks
  const handleNPCClick = (npcId: string) => {
    console.log('NPC clicked:', npcId);
    // TODO: Open NPC dialog or show interaction menu
  };
  const [eraseMode, setEraseMode] = useState(false);
  const [eraseBrushSize, setEraseBrushSize] = useState(3);
  const [selectedAssetType, setSelectedAssetType] = useState<'tree' | 'rock' | 'grass' | 'bush' | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['nature']));
  
  // Camera control modes
  const [panMode, setPanMode] = useState(false);
  const [zoomMode, setZoomMode] = useState(false);
  const [cameraView, setCameraView] = useState<'third-person' | 'topdown' | 'isometric' | 'birdseye'>('third-person');
  const [isLoading, setIsLoading] = useState(true);
  
  // Character position/rotation refs for camera controller
  const characterPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 20, 0));
  const characterRotationRef = useRef<number>(0);
  
  // Build mode camera focus point (center of terrain)
  const buildModeCameraFocus = useRef<THREE.Vector3>(new THREE.Vector3(0, 5, 50));
  
  // Ocean and Skybox controls
  const [timeOfDay, setTimeOfDay] = useState(0.5); // 0-1, where 0.5 is noon
  const [waveStrength, setWaveStrength] = useState(0.02);
  const [waveSpeed, setWaveSpeed] = useState(1.7);
  const [oceanTransparency, setOceanTransparency] = useState(1.0);
  const [sunIntensity, setSunIntensity] = useState(1.0);
  const [enableDynamicSky, setEnableDynamicSky] = useState(true);
  const [oceanSize, setOceanSize] = useState(500);
  const [rippleScale, setRippleScale] = useState(5.0);
  const [fogHeight, setFogHeight] = useState(16);
  const [bubbleScale, setBubbleScale] = useState(0.7);
  const [bubbleDensity, setBubbleDensity] = useState(1.5);
  const [bubbleSpeed, setBubbleSpeed] = useState(0.01); // Speed multiplier (0-1, default 0.01 = 1% speed for very slow rolling fog)
  const [manualAssets, setManualAssets] = useState<Array<{
    id: string;
    type: 'tree' | 'rock' | 'grass' | 'bush';
    position: [number, number, number];
    rotation: number;
    scale: number;
    variant?: number;
    treeType?: 'pine' | 'broad' | 'bushy';
  }>>([]);
  
  const [proceduralAssets, setProceduralAssets] = useState<{
    trees: Array<{ pos: [number, number, number]; scale?: number }>;
    rocks: Array<{ pos: [number, number, number]; scale?: number }>;
  }>({ trees: [], rocks: [] });
  
  // Terrain mesh ref for BVH-accelerated raycasting (must be at top level - React hooks rule)
  const terrainMeshRef = useRef<THREE.Mesh>(null);
  
  const addBuildingArea = () => {
    const newArea: BuildingArea = {
      id: nextAreaId,
      x: 0,
      z: 0,
      radius: 20,
      height: 2.5,
      minimized: false
    };
    setBuildingAreas([...buildingAreas, newArea]);
    setNextAreaId(nextAreaId + 1);
  };
  
  const removeBuildingArea = (id: number) => {
    setBuildingAreas(buildingAreas.filter(area => area.id !== id));
  };
  
  const updateBuildingArea = (id: number, updates: Partial<BuildingArea>) => {
    setBuildingAreas(buildingAreas.map(area => 
      area.id === id ? { ...area, ...updates } : area
    ));
  };
  
  const updateBuildingAreaPosition = (id: number, x: number, z: number) => {
    setBuildingAreas(buildingAreas.map(area => 
      area.id === id ? { ...area, x, z } : area
    ));
  };
  
  // Shared terrain height function - samples from actual terrain mesh geometry (matches rendered terrain)
  const getTerrainHeight = (worldX: number, worldZ: number) => {
    const scale = 200;
    
    // First try to sample from actual terrain mesh geometry (most accurate - matches what's rendered)
    if (terrainMeshRef.current?.geometry) {
      const geometry = terrainMeshRef.current.geometry;
      const positions = geometry.attributes.position.array as Float32Array;
      const size = Math.sqrt(positions.length / 3);
      
      // Convert world coordinates to normalized (0-1)
      const nx = (worldX / scale) + 0.5;
      const nz = (worldZ / scale) + 0.5;
      
      if (nx < 0 || nx > 1 || nz < 0 || nz > 1) return -10;
      
      // Sample from geometry with bilinear interpolation
      const gridX = nx * (size - 1);
      const gridZ = nz * (size - 1);
      const x0 = Math.floor(gridX);
      const z0 = Math.floor(gridZ);
      const x1 = Math.min(x0 + 1, size - 1);
      const z1 = Math.min(z0 + 1, size - 1);
      
      const fx = gridX - x0;
      const fz = gridZ - z0;
      
      const getHeight = (x: number, z: number) => {
        const idx = x + z * size;
        // After rotation [-PI/2, 0, 0], Y component is at index 1 (X=0, Y=1, Z=2)
        return positions[idx * 3 + 1];
      };
      
      const h00 = getHeight(x0, z0);
      const h10 = getHeight(x1, z0);
      const h01 = getHeight(x0, z1);
      const h11 = getHeight(x1, z1);
      
      const h0 = h00 * (1 - fx) + h10 * fx;
      const h1 = h01 * (1 - fx) + h11 * fx;
      let height = h0 * (1 - fz) + h1 * fz;
      
      // Check if within building area and adjust height accordingly
      for (const area of buildingAreas) {
        const distToBuildArea = Math.sqrt(
          Math.pow(worldX - area.x, 2) + 
          Math.pow(worldZ - area.z, 2)
        );
        
        if (distToBuildArea < area.radius) {
          return area.height;
        }
      }
      
      return height;
    }
    
    // Fallback: use simplex-noise calculation (matches terrain generation when mesh not ready)
    const noise2D = createNoise2D(() => seed);
    
    const x = (worldX + scale / 2) / scale;
    const z = (worldZ + scale / 2) / scale;
    
    if (x < 0 || x > 1 || z < 0 || z > 1) return -10;
    
    const centerX = x - 0.5;
    const centerZ = z - 0.5;
    const distanceFromCenter = Math.sqrt(centerX * centerX + centerZ * centerZ);
    
    // FBM noise (matches terrain generation)
    let noiseValue = 0;
    let amplitude = 1;
    let frequency = 0.01;
    let maxValue = 0;
    
    for (let i = 0; i < 4; i++) {
      noiseValue += noise2D(worldX * frequency, worldZ * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    noiseValue = noiseValue / maxValue;
    
    const baseRadius = islandSize / 100;
    const islandFalloff = Math.max(0, 1 - (distanceFromCenter / baseRadius));
    
    let height = (noiseValue * islandFalloff * heightScale * 0.5) + 2;
    
    // Check building areas
    for (const area of buildingAreas) {
      const distToBuildArea = Math.sqrt(
        Math.pow(worldX - area.x, 2) + 
        Math.pow(worldZ - area.z, 2)
      );
      
      if (distToBuildArea < area.radius) {
        return area.height;
      }
    }
    
    return height;
  };

  const handleRegenerate = () => {
    // Regenerate both terrain and assets by changing seed
    // This will trigger terrain geometry regeneration via useMemo dependencies
    setSeed(Math.random() * 1000);
    // Force terrain mesh update by toggling a dependency
    setTerrainDetail(prev => prev); // This will cause terrain to regenerate
  };

  // Manual asset handlers
  const handlePlaceAsset = (asset: any) => {
    setManualAssets([...manualAssets, asset]);
  };

  const handleEraseAsset = (id: string) => {
    setManualAssets(manualAssets.filter((asset) => asset.id !== id));
  };

  // Save/Load system state
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSaveTimeRef = useRef<number>(0);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current world state for saving
  const getCurrentWorldState = () => ({
    roughness,
    islandSize,
    terrainDetail,
    seed,
    heightScale,
    waterLevel,
    cliffIntensity,
    treeAmount,
    treeSize,
    grassAmount,
    grassSize,
    terrainGrassCoverage,
    buildingGrassFalloff,
    rockAmount,
    rockSize,
    bushAmount,
    bushSize,
    treeHeightOffset,
    grassHeightOffset,
    rockHeightOffset,
    bushHeightOffset,
    slopeAdjustmentIntensity,
    buildingAreas,
    nextAreaId,
    manualAssets,
    proceduralAssets,
    questMarkers,
    npcs,
    timeOfDay,
    waveStrength,
    waveSpeed,
    oceanTransparency,
    sunIntensity,
    enableDynamicSky,
    oceanSize,
    rippleScale,
    fogHeight,
    bubbleScale,
    bubbleDensity,
    bubbleSpeed,
  });

  // Save world (manual save) - saves to localStorage and optionally Firebase
  const handleSave = async (saveToCloud: boolean = false) => {
    try {
      setSaveStatus('saving');
      const state = getCurrentWorldState();
      
      // Always save to localStorage
      saveWorldToLocalStorage(state, false);
      
      // Save to Firebase if requested and available
      if (saveToCloud && isFirebaseAvailable()) {
        try {
          await saveWorldToFirebase(state, undefined, {
            name: `World ${new Date().toLocaleString()}`,
            isPublic: false,
          });
          console.log('[WorldSave] World saved to Firebase');
        } catch (firebaseError) {
          console.error('[WorldSave] Firebase save failed:', firebaseError);
          // Continue anyway - localStorage save succeeded
        }
      }
      
      lastSaveTimeRef.current = Date.now();
      setSaveStatus('saved');
      
      // Reset status after 2 seconds
      setTimeout(() => setSaveStatus('idle'), 2000);
      
      console.log('[WorldSave] World saved successfully');
    } catch (error) {
      console.error('[WorldSave] Failed to save world:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Auto-save every 30 seconds
  useEffect(() => {
    // Clear existing interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
    }
    
    // Set up auto-save interval
    autoSaveIntervalRef.current = setInterval(() => {
      try {
        const state = getCurrentWorldState();
        saveWorldToLocalStorage(state, true); // true = isAutoSave
        console.log('[WorldSave] Auto-saved world');
      } catch (error) {
        console.error('[WorldSave] Auto-save failed:', error);
      }
    }, 30000); // 30 seconds
    
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [
    roughness, islandSize, terrainDetail, seed, heightScale, waterLevel, cliffIntensity,
    treeAmount, treeSize, grassAmount, grassSize, terrainGrassCoverage, buildingGrassFalloff,
    rockAmount, rockSize, bushAmount, bushSize,
    treeHeightOffset, grassHeightOffset, rockHeightOffset, bushHeightOffset,
    slopeAdjustmentIntensity, buildingAreas, nextAreaId,
    manualAssets, proceduralAssets, questMarkers, npcs,
    timeOfDay, waveStrength, waveSpeed, oceanTransparency, sunIntensity,
    enableDynamicSky, oceanSize, rippleScale, fogHeight,
    bubbleScale, bubbleDensity, bubbleSpeed
  ]);

  // Keyboard shortcut: Ctrl+S for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty deps - handleSave is stable

  // Load world from config
  const handleLoad = (config: any) => {
    try {
      const worldState = configToWorldState(config);
      
      // Apply all state
      setRoughness(worldState.roughness);
      setIslandSize(worldState.islandSize);
      setTerrainDetail(worldState.terrainDetail);
      setSeed(worldState.seed);
      setHeightScale(worldState.heightScale);
      setWaterLevel(worldState.waterLevel);
      setCliffIntensity(worldState.cliffIntensity);
      setTreeAmount(worldState.treeAmount);
      setTreeSize(worldState.treeSize);
      setGrassAmount(worldState.grassAmount);
      setGrassSize(worldState.grassSize);
      setTerrainGrassCoverage(worldState.terrainGrassCoverage);
      setBuildingGrassFalloff(worldState.buildingGrassFalloff);
      setRockAmount(worldState.rockAmount);
      setRockSize(worldState.rockSize);
      setBushAmount(worldState.bushAmount);
      setBushSize(worldState.bushSize);
      setTreeHeightOffset(worldState.treeHeightOffset);
      setGrassHeightOffset(worldState.grassHeightOffset);
      setRockHeightOffset(worldState.rockHeightOffset);
      setBushHeightOffset(worldState.bushHeightOffset);
      setSlopeAdjustmentIntensity(worldState.slopeAdjustmentIntensity);
      setBuildingAreas(worldState.buildingAreas);
      setNextAreaId(worldState.nextAreaId);
      setManualAssets(worldState.manualAssets);
      setProceduralAssets(worldState.proceduralAssets);
      setQuestMarkers(worldState.questMarkers);
      setNpcs(worldState.npcs);
      setTimeOfDay(worldState.timeOfDay);
      setWaveStrength(worldState.waveStrength);
      setWaveSpeed(worldState.waveSpeed);
      setOceanTransparency(worldState.oceanTransparency);
      setSunIntensity(worldState.sunIntensity);
      setEnableDynamicSky(worldState.enableDynamicSky);
      setOceanSize(worldState.oceanSize);
      setRippleScale(worldState.rippleScale);
      setFogHeight(worldState.fogHeight);
      setBubbleScale(worldState.bubbleScale);
      setBubbleDensity(worldState.bubbleDensity);
      setBubbleSpeed(worldState.bubbleSpeed);
      
      setShowLoadMenu(false);
      console.log('[WorldLoad] World loaded successfully');
    } catch (error) {
      console.error('[WorldLoad] Failed to load world:', error);
      alert('Failed to load world configuration. Please check the file format.');
    }
  };

  // Load from file
  const handleLoadFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      const config = await loadWorldConfigFromFile(file);
      handleLoad(config);
    } catch (error) {
      console.error('[WorldLoad] Failed to load from file:', error);
      alert('Failed to load world configuration from file.');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Load auto-saved world on mount
  useEffect(() => {
    const autoSaved = loadAutoSavedWorld();
    if (autoSaved) {
      const shouldLoad = window.confirm('Found auto-saved world. Load it?');
      if (shouldLoad) {
        handleLoad(autoSaved);
      }
    }
  }, []); // Only on mount
  
  // Set loading to false once terrain mesh is ready and assets are generated
  useEffect(() => {
    // Check if terrain mesh exists and wait a bit for assets to render
    const checkReady = () => {
      if (terrainMeshRef.current) {
        console.log('[Loading] World ready');
        setIsLoading(false);
        return true;
      }
      return false;
    };
    
    // Check immediately
    if (checkReady()) return;
    
    // Also check after a delay to ensure everything is rendered
    const timer = setTimeout(() => {
      if (!checkReady()) {
        // Force loading to false after 30 seconds max to prevent infinite loading
        console.warn('[Loading] Force clearing loading state after timeout');
        setIsLoading(false);
      }
    }, 30000); // 30 second timeout to prevent infinite loading
    
    // Also set a shorter timeout for normal cases
    const normalTimer = setTimeout(() => {
      checkReady();
    }, 2000);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(normalTimer);
    };
  }, [terrainMeshRef]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 text-white">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 backdrop-blur">
          <div className="text-center">
            <div className="mb-4 text-6xl animate-spin">🌍</div>
            <h2 className="text-3xl font-bold text-white mb-2">Generating World...</h2>
            <p className="text-slate-400 mb-4">Creating terrain, trees, grass, rocks, and bushes</p>
            <div className="mt-4 w-80 h-3 bg-slate-700 rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-gradient-to-r from-green-500 to-blue-500 animate-pulse" style={{ width: '70%' }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-4">This may take 10-30 seconds depending on your system</p>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-slate-900/80 backdrop-blur border-b border-slate-700">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Test World</h1>
            <p className="text-sm text-slate-400">Low-poly island terrain with procedural assets</p>
          </div>
          
          {/* Camera Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTestMode(!testMode)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                testMode 
                  ? 'bg-red-600 text-white shadow-lg shadow-red-500/50' 
                  : 'bg-green-600 text-white shadow-lg shadow-green-500/50'
              }`}
              title={testMode ? 'Exit Test Mode' : 'Enter Test Mode'}
            >
              {testMode ? '⏸️ EXIT TEST' : '🎮 TEST SCENE'}
            </button>
            
            <button
              onClick={() => {
                setPanMode(!panMode);
                if (!panMode) setZoomMode(false);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                panMode 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/50' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Pan Mode"
            >
              ✋ {panMode ? 'Pan ON' : 'Pan'}
            </button>
            
            <button
              onClick={() => {
                setZoomMode(!zoomMode);
                if (!zoomMode) setPanMode(false);
              }}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                zoomMode 
                  ? 'bg-green-600 text-white shadow-lg shadow-green-500/50' 
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
              title="Toggle Zoom Mode"
            >
              🔍 {zoomMode ? 'Zoom ON' : 'Zoom'}
            </button>
            
            {/* Camera View Buttons */}
            <div className="flex items-center gap-1 border-l border-slate-600 pl-2 ml-2">
              <button
                onClick={() => setCameraView('third-person')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  cameraView === 'third-person'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Third Person View"
              >
                3rd
              </button>
              <button
                onClick={() => setCameraView('topdown')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  cameraView === 'topdown'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Top Down View"
              >
                ⬇️
              </button>
              <button
                onClick={() => setCameraView('isometric')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  cameraView === 'isometric'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Isometric View"
              >
                📐
              </button>
              <button
                onClick={() => setCameraView('birdseye')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                  cameraView === 'birdseye'
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/50'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
                title="Bird's Eye View"
              >
                🦅
              </button>
            </div>
            
            <CustomButton
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </CustomButton>
          </div>
        </div>
      </div>
      
      {/* Asset Controls - Left Panel */}
      <div className="absolute top-20 left-4 bottom-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-4 w-64 overflow-y-auto relative">
        {!manualMode ? (
          <>
            <h3 className="text-sm font-bold text-slate-300 uppercase mb-4">Asset Controls</h3>
            
            {/* Slope Adjustment Intensity */}
            <div className="pb-3 mb-4 border-b border-slate-700">
              <label className="text-xs text-slate-400 block mb-1">
                Slope Adjustment: <span className="text-white">{slopeAdjustmentIntensity.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="7"
                step="0.5"
                value={slopeAdjustmentIntensity}
                onChange={(e) => setSlopeAdjustmentIntensity(Number(e.target.value))}
                className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">Slope-based height adjustment (-0.6 flat to -3+ steep)</p>
            </div>
            
            {/* Trees Section */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-blue-400">🌲 Trees</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Amount: <span className="text-white">{treeAmount}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="20000"
                  step="100"
                  value={treeAmount}
                  onChange={(e) => setTreeAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Size: <span className="text-white">{treeSize}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={treeSize}
                  onChange={(e) => setTreeSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Height: <span className="text-white">{treeHeightOffset.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={treeHeightOffset}
                  onChange={(e) => setTreeHeightOffset(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Grass Section */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-green-400">🌿 Grass</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Amount: <span className="text-white">{grassAmount}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="16000"
                  step="100"
                  value={grassAmount}
                  onChange={(e) => setGrassAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Size: <span className="text-white">{grassSize}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={grassSize}
                  onChange={(e) => setGrassSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Height: <span className="text-white">{grassHeightOffset.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={grassHeightOffset}
                  onChange={(e) => setGrassHeightOffset(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Terrain Coverage: <span className="text-white">{terrainGrassCoverage}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="200"
                  step="5"
                  value={terrainGrassCoverage}
                  onChange={(e) => setTerrainGrassCoverage(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Builder Falloff: <span className="text-white">{buildingGrassFalloff}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={buildingGrassFalloff}
                  onChange={(e) => setBuildingGrassFalloff(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <p className="text-xs text-slate-500 mt-1">Lower coverage near circle edges</p>
              </div>
            </div>

            {/* Rocks Section */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-slate-400">🪨 Rocks</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Amount: <span className="text-white">{rockAmount}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="2000"
                  step="10"
                  value={rockAmount}
                  onChange={(e) => setRockAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Size: <span className="text-white">{rockSize}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={rockSize}
                  onChange={(e) => setRockSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Height: <span className="text-white">{rockHeightOffset.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={rockHeightOffset}
                  onChange={(e) => setRockHeightOffset(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-500"
                />
              </div>
            </div>

            {/* Bushes Section */}
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-semibold text-emerald-400">🌳 Bushes</h4>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Amount: <span className="text-white">{bushAmount}</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="50"
                  value={bushAmount}
                  onChange={(e) => setBushAmount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Size: <span className="text-white">{bushSize}%</span>
                </label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={bushSize}
                  onChange={(e) => setBushSize(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Height: <span className="text-white">{bushHeightOffset.toFixed(1)}</span>
                </label>
                <input
                  type="range"
                  min="-3"
                  max="3"
                  step="0.1"
                  value={bushHeightOffset}
                  onChange={(e) => setBushHeightOffset(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Manual Placement Mode UI */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', textTransform: 'uppercase', fontWeight: 'bold' }}>
                Manual Assets
              </h3>
            </div>
            
            
            {/* Character Selector - only show in test mode */}
            {testMode && (
              <>
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <CharacterSelector
                    selectedCharacter={selectedCharacter}
                    onSelectCharacter={setSelectedCharacter}
                  />
                </div>
                
                {/* Physics Toggle */}
                <div className="mb-4 pb-4 border-b border-slate-700">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePhysics}
                      onChange={(e) => setEnablePhysics(e.target.checked)}
                      className="w-4 h-4 accent-blue-500"
                    />
                    <span className="text-sm text-slate-300">⚡ Enable Physics</span>
                  </label>
                  <p className="text-xs text-slate-500 mt-1">Use Cannon-ES physics for character movement</p>
                </div>
              </>
            )}
            
            {/* Erase Button */}
            <button
              onClick={() => {
                setEraseMode(!eraseMode);
                setSelectedAssetType(null);
              }}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                background: eraseMode ? '#dc2626' : '#475569',
                color: 'white',
                border: eraseMode ? '2px solid #fff' : '1px solid #475569',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: 'bold',
              }}
            >
              {eraseMode ? '✕ Erase Mode ON' : '✕ Erase'}
            </button>
            
            {eraseMode && (
              <div style={{ marginBottom: '10px', padding: '8px', background: '#1e293b', borderRadius: '4px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '10px', color: '#94a3b8' }}>
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

            {/* Nature Category */}
            <CategorySection
              title="Nature Assets"
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
                {/* Trees - Pine and Broad side by side */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAssetType('tree'); setEraseMode(false); }}
                    title="Place Tree"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAssetType === 'tree' ? '#3b82f6' : '#2d5016',
                      border: selectedAssetType === 'tree' ? '2px solid #fff' : '1px solid #475569',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🌲
                  </button>
                </div>
                
                {/* Rocks */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAssetType('rock'); setEraseMode(false); }}
                    title="Place Rock"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAssetType === 'rock' ? '#3b82f6' : '#64748b',
                      border: selectedAssetType === 'rock' ? '2px solid #fff' : '1px solid #475569',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                    }}
                  >
                    🪨
                  </button>
                </div>
                
                {/* Grass */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAssetType('grass'); setEraseMode(false); }}
                    title="Place Grass"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAssetType === 'grass' ? '#3b82f6' : '#3d6b2d',
                      border: selectedAssetType === 'grass' ? '2px solid #fff' : '1px solid #475569',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🌱
                  </button>
                </div>
                
                {/* Bushes */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  <button
                    onClick={() => { setSelectedAssetType('bush'); setEraseMode(false); }}
                    title="Place Bush"
                    style={{
                      flex: 1,
                      height: '35px',
                      background: selectedAssetType === 'bush' ? '#3b82f6' : '#2d5016',
                      border: selectedAssetType === 'bush' ? '2px solid #fff' : '1px solid #475569',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                    }}
                  >
                    🌳
                  </button>
                </div>
              </div>
            </CategorySection>

            {selectedAssetType && !eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#3b82f6', textAlign: 'center' }}>
                Selected: {selectedAssetType}
              </p>
            )}
            {eraseMode && (
              <p style={{ margin: '10px 0 0 0', fontSize: '10px', color: '#dc2626', textAlign: 'center' }}>
                Click assets to delete
              </p>
            )}
          </>
        )}
        
        {/* Manual Placement Mode Button */}
        <div className="pt-4 mt-4 border-t border-slate-700">
          <button
            onClick={() => setManualMode(!manualMode)}
            className={`w-full font-bold py-3 px-4 rounded-lg transition-all ${
              manualMode 
                ? 'bg-purple-600 hover:bg-purple-700 shadow-lg shadow-purple-500/50' 
                : 'bg-slate-700 hover:bg-slate-600'
            } text-white text-sm`}
          >
            {manualMode ? '← Back to Procedural Mode' : '→ Switch to Manual Placement'}
          </button>
          {manualMode && (
            <p className="text-[10px] text-purple-300 mt-2 text-center">
              Click terrain to place assets
            </p>
          )}
        </div>
      </div>
      
      {/* Island Controls - Right Panel */}
      <div className="absolute top-20 right-4 bottom-4 z-10 bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-4 w-64 overflow-y-auto">
        <h3 className="text-sm font-bold text-slate-300 uppercase mb-2">Island Controls</h3>
        
        {/* Roughness Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Roughness: <span className="text-white">{roughness}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={roughness}
            onChange={(e) => setRoughness(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Island Size Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Island Size: <span className="text-white">{islandSize}</span>
          </label>
          <input
            type="range"
            min="20"
            max="50"
            value={islandSize}
            onChange={(e) => setIslandSize(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        {/* Terrain Detail Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Terrain Detail: <span className="text-white">{terrainDetail}</span>
          </label>
          <input
            type="range"
            min="64"
            max="256"
            step="32"
            value={terrainDetail}
            onChange={(e) => setTerrainDetail(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Height Scale Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Height Scale: <span className="text-white">{heightScale}</span>
          </label>
          <input
            type="range"
            min="20"
            max="80"
            step="5"
            value={heightScale}
            onChange={(e) => setHeightScale(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Water Level Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Water Level: <span className="text-white">{waterLevel.toFixed(1)}</span>
          </label>
          <input
            type="range"
            min="-2"
            max="2"
            step="0.1"
            value={waterLevel}
            onChange={(e) => setWaterLevel(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Cliff Intensity Slider */}
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Cliff Intensity: <span className="text-white">{cliffIntensity}</span>
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="10"
            value={cliffIntensity}
            onChange={(e) => setCliffIntensity(Number(e.target.value))}
            className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
        
        {/* Ocean & Sky Section */}
        <div className="pt-4 border-t border-slate-700">
          <h4 className="text-xs font-semibold text-cyan-400 mb-3">🌊 Ocean & Sky</h4>
          
          {/* Dynamic Sky Toggle */}
          <div className="mb-3">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableDynamicSky}
                onChange={(e) => setEnableDynamicSky(e.target.checked)}
                className="mr-2"
              />
              <span className="text-xs text-slate-300">Enable Dynamic Sky</span>
            </label>
          </div>
          
          {/* Time of Day */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Time of Day: <span className="text-white">{(timeOfDay * 24).toFixed(1)}h</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              {timeOfDay < 0.25 ? 'Night' : timeOfDay < 0.35 ? 'Sunrise' : timeOfDay < 0.65 ? 'Day' : timeOfDay < 0.75 ? 'Sunset' : 'Night'}
            </p>
          </div>
          
          {/* Sun Intensity */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Sun Intensity: <span className="text-white">{sunIntensity.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="2"
              step="0.1"
              value={sunIntensity}
              onChange={(e) => setSunIntensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-yellow-500"
            />
          </div>
          
          {/* Wave Strength */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Wave Strength: <span className="text-white">{waveStrength.toFixed(2)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.01"
              value={waveStrength}
              onChange={(e) => setWaveStrength(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          
          {/* Wave Speed */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Wave Speed: <span className="text-white">{waveSpeed.toFixed(1)}</span>
            </label>
            <input
              type="range"
              min="0"
              max="3"
              step="0.1"
              value={waveSpeed}
              onChange={(e) => setWaveSpeed(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          
          {/* Ocean Transparency */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Ocean Transparency: <span className="text-white">{(oceanTransparency * 100).toFixed(0)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={oceanTransparency}
              onChange={(e) => setOceanTransparency(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          
          {/* Ocean Size */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Ocean Size: <span className="text-white">{oceanSize}</span> units
            </label>
            <input
              type="range"
              min="500"
              max="5000"
              step="100"
              value={oceanSize}
              onChange={(e) => setOceanSize(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>
          
          {/* Ripple Detail */}
          <div className="mb-2">
            <label className="text-xs text-slate-400 block mb-1">
              Ripple Detail: <span className="text-white">{rippleScale.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={rippleScale}
              onChange={(e) => setRippleScale(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-cyan-300 mb-1">
              Fog Height: <span className="text-white">{fogHeight.toFixed(1)}m</span>
            </label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={fogHeight}
              onChange={(e) => setFogHeight(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-cyan-300 mb-1">
              Bubble Scale: <span className="text-white">{bubbleScale.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={bubbleScale}
              onChange={(e) => setBubbleScale(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-cyan-300 mb-1">
              Bubble Density: <span className="text-white">{bubbleDensity.toFixed(1)}x</span>
            </label>
            <input
              type="range"
              min="0.5"
              max="3.0"
              step="0.1"
              value={bubbleDensity}
              onChange={(e) => setBubbleDensity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
          </div>

          <div>
            <div>
            <label className="block text-xs text-cyan-300 mb-1">
              Bubble Speed: <span className="text-white">{(bubbleSpeed * 100).toFixed(1)}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={bubbleSpeed}
              onChange={(e) => {
                const newValue = Number(e.target.value);
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/c15ab070-fd58-47a7-ab6d-662197ee7dfa',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'TestWorld.tsx:2856',message:'BubbleSpeed slider change',data:{oldValue:bubbleSpeed,newValue,newValueType:typeof newValue},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
                // #endregion
                setBubbleSpeed(newValue);
              }}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
            />
            </div>
          </div>
        </div>
        
        {/* Building Area Section */}
        <div className="pt-4 border-t border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-amber-400">🏗️ Building Areas</h4>
            <button
              onClick={addBuildingArea}
              className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1 rounded transition-colors"
            >
              + Add Area
            </button>
          </div>
          
          {buildingAreas.map((area) => (
            <div key={area.id} className="border border-slate-600 rounded-lg p-2 bg-slate-800/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-300">Area #{area.id}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => updateBuildingArea(area.id, { minimized: !area.minimized })}
                    className="text-xs text-slate-400 hover:text-white px-2 py-0.5"
                  >
                    {area.minimized ? '▼' : '▲'}
                  </button>
                  <button
                    onClick={() => removeBuildingArea(area.id)}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-0.5"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              {!area.minimized && (
                <>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Position X: <span className="text-white">{area.x}</span>
                    </label>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="5"
                      value={area.x}
                      onChange={(e) => updateBuildingArea(area.id, { x: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Position Z: <span className="text-white">{area.z}</span>
                    </label>
                    <input
                      type="range"
                      min="-60"
                      max="60"
                      step="5"
                      value={area.z}
                      onChange={(e) => updateBuildingArea(area.id, { z: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Radius: <span className="text-white">{area.radius}</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={area.radius}
                      onChange={(e) => updateBuildingArea(area.id, { radius: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                  
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">
                      Height: <span className="text-white">{area.height.toFixed(1)}</span>
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      step="0.1"
                      value={area.height}
                      onChange={(e) => updateBuildingArea(area.id, { height: Number(e.target.value) })}
                      className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Regenerate Button */}
        <button
          onClick={handleRegenerate}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
        >
          🔄 Regenerate
        </button>

        {/* Save/Load Section */}
        <div className="border-t border-slate-700 pt-4 mt-4">
          <div className="text-xs text-slate-400 mb-2">Save & Load</div>
          
          {/* Save Button */}
          <button
            onClick={() => handleSave(true)}
            disabled={saveStatus === 'saving'}
            className={`w-full font-bold py-2 px-4 rounded transition-colors mb-2 ${
              saveStatus === 'saving' 
                ? 'bg-slate-600 text-slate-400 cursor-not-allowed'
                : saveStatus === 'saved'
                ? 'bg-green-600 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
            title="Save world (Ctrl+S)"
          >
            {saveStatus === 'saving' ? '⏳ Saving...' : saveStatus === 'saved' ? '✅ Saved!' : '💾 Save World'}
          </button>
          
          {/* Load Button */}
          <button
            onClick={() => setShowLoadMenu(!showLoadMenu)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors mb-2"
          >
            📂 Load World
          </button>
          
          {/* Cloud Save Button */}
          <button
            onClick={() => handleSave(true)}
            disabled={!isFirebaseAvailable() || saveStatus === 'saving'}
            className={`w-full font-bold py-2 px-4 rounded transition-colors ${
              isFirebaseAvailable()
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-purple-600/50 text-slate-400 cursor-not-allowed'
            }`}
            title={isFirebaseAvailable() ? 'Save world to cloud (Firebase)' : 'Firebase not configured - set environment variables'}
          >
            {isFirebaseAvailable() ? '☁️ Save to Cloud' : '☁️ Cloud (Not Configured)'}
          </button>
        </div>
        
        {/* Load Menu */}
        {showLoadMenu && (
          <div className="absolute left-full ml-2 top-0 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 z-50 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Load World</h3>
              <button
                onClick={() => setShowLoadMenu(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            {/* Load from File */}
            <div className="mb-4">
              <label className="block text-xs text-slate-400 mb-2">Load from File</label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleLoadFromFile}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white text-sm py-2 px-3 rounded transition-colors"
              >
                📄 Choose File...
              </button>
            </div>
            
            {/* Load from LocalStorage */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Saved Worlds</label>
              <div className="space-y-1">
                {getSavedWorldsMetadata().map((meta) => {
                  const config = loadWorldFromLocalStorage(meta.id);
                  return (
                    <div
                      key={meta.id}
                      className="flex items-center justify-between p-2 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{meta.name}</div>
                        <div className="text-xs text-slate-400">
                          {new Date(meta.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <button
                          onClick={() => config && handleLoad(config)}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          title="Load"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this saved world?')) {
                              deleteWorldFromLocalStorage(meta.id);
                              setShowLoadMenu(false);
                              setTimeout(() => setShowLoadMenu(true), 100);
                            }
                          }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          title="Delete"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
                {getSavedWorldsMetadata().length === 0 && (
                  <div className="text-xs text-slate-500 p-2 text-center">No saved worlds</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* 3D Scene */}
      <div className="h-screen w-full">
        <Canvas
          camera={{ position: [80, 60, 80], fov: 60, far: 10000 }}
          shadows
          gl={{ antialias: true }}
        >
          <PhysicsWorldProvider 
            terrainMeshRef={terrainMeshRef}
            enablePhysics={enablePhysics && testMode}
        >
          <Suspense fallback={null}>
            {/* Animation system updater */}
            <AnimationUpdater />
            
            {/* Dynamic fog color based on time of day */}
            <color attach="background" args={[
              enableDynamicSky 
                ? (timeOfDay > 0.25 && timeOfDay < 0.75 
                    ? '#87ceeb' // Day
                    : '#0a1628') // Night
                : '#87ceeb'
            ]} />
            
            {/* Dynamic Sky or Static Sky */}
            {enableDynamicSky ? (
              <DynamicSkybox timeOfDay={timeOfDay} sunIntensity={sunIntensity} />
            ) : (
              <Sky sunPosition={[100, 20, 100]} />
            )}
            
            {/* Dynamic lighting based on time of day */}
            <ambientLight intensity={0.5} />
            <directionalLight
              position={[
                Math.cos((timeOfDay - 0.25) * Math.PI * 2) * 100,
                Math.sin((timeOfDay - 0.25) * Math.PI * 2) * 100,
                25
              ]}
              intensity={enableDynamicSky ? (
                timeOfDay >= 0.25 && timeOfDay <= 0.75
                  ? sunIntensity * 1.0 // Day - stable full intensity
                  : sunIntensity * 0.3 // Night - stable dim intensity
              ) : 1.2}
              color={enableDynamicSky && (timeOfDay < 0.2 || timeOfDay > 0.8) ? '#ff9944' : '#ffffff'}
              castShadow
              shadow-mapSize={[2048, 2048]}
              shadow-camera-left={-100}
              shadow-camera-right={100}
              shadow-camera-top={100}
              shadow-camera-bottom={-100}
            />
            
            {/* Camera Controls */}
            {testMode ? (
              <>
                <CameraController 
                  cameraView={cameraView} 
                  testMode={testMode}
                  characterPositionRef={characterPositionRef}
                  characterRotationRef={characterRotationRef}
                />
              </>
            ) : (
              <>
                {cameraView === 'third-person' ? (
                  <OrbitControls enablePan={panMode} enableZoom={zoomMode} enableRotate={true} />
                ) : (
                  <>
                    {/* Build mode camera views - focus on center of terrain */}
                    <CameraController 
                      cameraView={cameraView} 
                      testMode={false}
                      characterPositionRef={buildModeCameraFocus}
                    />
                    {/* Disable OrbitControls when using fixed camera views */}
                    <OrbitControls enablePan={false} enableZoom={false} enableRotate={false} />
                  </>
                )}
              </>
            )}
            
            {/* Terrain mesh with ref for BVH raycasting - always render for BVH */}
                <LowPolyTerrain
                  ref={terrainMeshRef}
                  roughness={roughness}
                  islandSize={islandSize}
                  seed={seed}
                  terrainDetail={terrainDetail}
                  heightScale={heightScale}
                  cliffIntensity={cliffIntensity}
                  buildingAreas={buildingAreas}
                />
            
            {/* Dynamic Ocean */}
            <DynamicOcean
              timeOfDay={timeOfDay}
              oceanSize={oceanSize}
              waveStrength={waveStrength}
              waveSpeed={waveSpeed}
              oceanTransparency={oceanTransparency}
              rippleScale={rippleScale}
              waterLevel={waterLevel}
            />
            
            {/* Volumetric Fog / Cloud Mesh - DISABLED FOR NOW */}
            {/* <VolumetricFog
              timeOfDay={timeOfDay}
              fogHeight={fogHeight}
              bubbleScale={bubbleScale}
              bubbleDensity={bubbleDensity}
              bubbleSpeed={bubbleSpeed}
            /> */}
            
            {/* Procedural Forest Assets */}
            <Forest
              roughness={roughness}
              islandSize={islandSize}
              seed={seed}
              terrainDetail={terrainDetail}
              treeAmount={treeAmount}
              treeSize={treeSize}
              grassAmount={grassAmount}
              grassSize={grassSize}
              terrainGrassCoverage={terrainGrassCoverage}
              buildingGrassFalloff={buildingGrassFalloff}
              rockAmount={rockAmount}
              rockSize={rockSize}
              bushAmount={bushAmount}
              bushSize={bushSize}
              heightScale={heightScale}
              cliffIntensity={cliffIntensity}
              treeHeightOffset={treeHeightOffset}
              grassHeightOffset={grassHeightOffset}
              rockHeightOffset={rockHeightOffset}
              bushHeightOffset={bushHeightOffset}
              buildingAreas={buildingAreas}
              slopeAdjustmentIntensity={slopeAdjustmentIntensity}
              getTerrainHeight={getTerrainHeight}
              onAssetsGenerated={(assets) => {
                setProceduralAssets(assets);
              }}
              terrainMeshRef={terrainMeshRef}
            />
            
            {/* Character Controller - only in test mode */}
                {testMode && (
                  <CharacterController
                startPosition={[0, 20, 0]}
                    terrainMeshRef={terrainMeshRef}
                    manualAssets={manualAssets}
                    proceduralAssets={proceduralAssets}
                    characterModelPath={CHARACTER_OPTIONS.find(c => c.id === selectedCharacter)?.modelPath}
                    cameraView={cameraView}
                    positionRef={characterPositionRef}
                    rotationRef={characterRotationRef}
                    onAnimationTrigger={(crossfade) => {
                  if (animationTriggerRef.current) {
                      animationTriggerRef.current = crossfade;
                  }
                    }}
                  />
                )}
            
            {/* Quest Markers - 3D labels */}
            {questMarkers.map((marker) => (
              <QuestMarker
                key={marker.id}
                position={marker.position}
                label={marker.label}
                type={marker.type}
                onClick={() => handleMarkerClick(marker.id)}
              />
            ))}
            
            {/* Walking NPCs */}
            {npcs.map((npc) => (
              <WalkingNPC
                key={npc.id}
                id={npc.id}
                name={npc.name}
                position={npc.position}
                waypoints={npc.waypoints}
                characterModelPath={npc.characterModelPath}
                speed={2}
                onClick={() => handleNPCClick(npc.id)}
                terrainMeshRef={terrainMeshRef}
              />
            ))}
            
            {/* Ground Click Handler for Manual Placement */}
            {manualMode && (
              <>
                <GroundClickHandler
                  selectedAssetType={selectedAssetType}
                  eraseMode={eraseMode}
                  eraseBrushSize={eraseBrushSize}
                  manualAssets={manualAssets}
                  onPlaceAsset={handlePlaceAsset}
                  onEraseAsset={handleEraseAsset}
                  getTerrainHeight={getTerrainHeight}
                />
                
                {/* Erase Brush Visual Indicator */}
                {eraseMode && (
                  <EraseIndicator
                    eraseBrushSize={eraseBrushSize}
                    getTerrainHeight={getTerrainHeight}
                  />
                )}
              </>
            )}
            
            {/* Render manually placed assets */}
            {manualAssets.map((asset) => {
              if (!asset || !asset.position) return null;
              
              const [x, y, z] = asset.position;
              
              if (asset.type === 'tree') {
                if (asset.treeType === 'pine') {
                  return <PineTree key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} />;
                } else if (asset.treeType === 'broad') {
                  return <BroadTree key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} />;
                } else {
                  return <BushyTree key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} />;
                }
              } else if (asset.type === 'rock') {
                return <Rock key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} variant={asset.variant || 0} />;
              } else if (asset.type === 'grass') {
                return <GrassClump key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} />;
              } else if (asset.type === 'bush') {
                return <Bush key={asset.id} position={[x, y, z]} rotation={asset.rotation || 0} scale={asset.scale || 1} variant={asset.variant || 0} />;
              }
              return null;
            })}
            {/* Darkness Overlay for night time */}
            <DarknessOverlay timeOfDay={timeOfDay} />
          </Suspense>
          </PhysicsWorldProvider>
        </Canvas>
      </div>
              </div>
  );
}
