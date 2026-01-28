// Walking NPC Component with Pathfinding
// NPCs that walk along waypoints using three-pathfinding

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cloneGltf } from '../utils/cloneGltf';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { QuestLabel } from './QuestLabel';

interface WalkingNPCProps {
  id: string;
  name: string;
  position: [number, number, number];
  waypoints: [number, number, number][]; // Path to follow
  characterModelPath?: string;
  speed?: number;
  onClick?: () => void;
  terrainMeshRef?: React.RefObject<THREE.Mesh>;
  getTerrainHeight?: (x: number, z: number) => number; // Use shared terrain height function
  isInteracting?: boolean; // Stop and face player when interacting
  playerPosition?: THREE.Vector3; // Player position to face when interacting
  showPath?: boolean; // Show visible walk path
}

export function WalkingNPC({
  id,
  name,
  position,
  waypoints,
  characterModelPath,
  speed = 2,
  onClick,
  terrainMeshRef,
  getTerrainHeight: externalGetTerrainHeight,
  isInteracting = false,
  playerPosition,
  showPath = false,
}: WalkingNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);
  const lastAnimationState = useRef<'idle' | 'walk'>('idle');
  const lastHeightUpdate = useRef(0);

  // Use external terrain height function if provided, otherwise fallback to raycasting
  const getTerrainHeight = (x: number, z: number): number => {
    if (externalGetTerrainHeight) {
      return externalGetTerrainHeight(x, z);
    }
    
    // Fallback: raycast (but filter out ocean)
    if (!terrainMeshRef?.current) return 2.5;
    
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.set(x, 100, z);
    raycaster.ray.direction.set(0, -1, 0);
    
    // Only intersect terrain mesh, not ocean
    const intersects = raycaster.intersectObject(terrainMeshRef.current, false);
    if (intersects.length > 0) {
      const height = intersects[0].point.y;
      // Ensure we're not getting ocean height (water level is ~0.9)
      return height > 1.0 ? height : 2.5;
    }
    
    return 2.5; // Fallback to default height
  };

  // Load NPC model
  useEffect(() => {
    const loadNPC = async () => {
      try {
        const loader = new GLTFLoader();
        const modelPath = characterModelPath || 
          '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb';
        
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(modelPath, resolve, undefined, reject);
        });

        const clonedGltf = cloneGltf(gltf);
        const npcScene = clonedGltf.scene;
        npcScene.scale.setScalar(1);
        npcScene.position.set(0, 0, 0);
        npcScene.visible = true;

        npcScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
          }
        });

        setModel(npcScene);
        setModelLoaded(true);
      } catch (err) {
        console.error('[WalkingNPC] Failed to load model:', err);
        setModelLoaded(true);
      }
    };

    loadNPC();
  }, [characterModelPath]);

  // Character animation - use proper asset ID based on model path
  const getAssetId = () => {
    if (characterModelPath?.includes('Mage')) return 'char_mage';
    if (characterModelPath?.includes('Ranger')) return 'char_ranger';
    if (characterModelPath?.includes('Barbarian')) return 'char_barbarian';
    if (characterModelPath?.includes('Rogue')) return 'char_rogue';
    return 'char_knight'; // Default
  };

  const { crossfadeTo, isLoaded: animationsLoaded } = useCharacterAnimation({
    characterId: `npc-${id}`,
    assetId: getAssetId(),
    model: model,
    defaultAnimation: 'idle',
  });

  // Ensure animations start playing when they become available
  useEffect(() => {
    if (animationsLoaded && crossfadeTo && model) {
      // Force start with idle animation when animations load - don't check state
      try {
        crossfadeTo('idle', 0.2);
        lastAnimationState.current = 'idle'; // Set state to match
      } catch (err) {
        console.warn(`[WalkingNPC ${id}] Failed to initialize idle animation:`, err);
      }
    }
  }, [animationsLoaded, crossfadeTo, model, id]);

  // Initialize position on terrain - use the passed position prop which already has terrain height
  // Set initial position when component mounts or terrain becomes available
  useEffect(() => {
    if (groupRef.current) {
      // Use the position prop which already has terrain height calculated in parent
      // But also verify with terrain if available
      if (terrainMeshRef?.current) {
        const terrainHeight = getTerrainHeight(position[0], position[2]);
        // Use the higher of the two (passed position or calculated) to ensure NPC is on terrain
        const finalY = Math.max(position[1], terrainHeight + 0.0);
        groupRef.current.position.set(position[0], finalY, position[2]);
      } else {
        // If terrain not ready, use passed position (which should have correct Y from parent)
        groupRef.current.position.set(position[0], position[1], position[2]);
      }
    }
  }, [position, terrainMeshRef?.current, getTerrainHeight]); // Re-run when position changes or terrain becomes available

  // Waypoint following behavior
  useFrame((_state, delta) => {
    if (!groupRef.current || !modelLoaded || waypoints.length === 0) return;
    
    // Ensure position is set correctly if it wasn't set in useEffect (fallback)
    if (groupRef.current.position.y === 0 && terrainMeshRef?.current) {
      const terrainHeight = getTerrainHeight(groupRef.current.position.x, groupRef.current.position.z);
      groupRef.current.position.y = terrainHeight + 0.0;
    }

    const currentPos = groupRef.current.position;
    
    // If interacting, stop and face player
    if (isInteracting && playerPosition) {
      // Stop movement
      isMovingRef.current = false;
      
      // Face player
      const directionToPlayer = new THREE.Vector3()
        .subVectors(playerPosition, currentPos)
        .normalize();
      
      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.15 // Faster rotation to face player
      );
      
      // Play idle animation
      if (lastAnimationState.current !== 'idle') {
        lastAnimationState.current = 'idle';
        if (animationsLoaded && crossfadeTo) {
          crossfadeTo('idle', 0.2);
        }
      }
      
      // Still update terrain height
      const terrainHeight = getTerrainHeight(currentPos.x, currentPos.z);
      const targetY = terrainHeight + 0.0;
      const currentY = groupRef.current.position.y;
      const lerpFactor = Math.min(1.0, delta * 12);
      const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const finalY = Math.max(smoothedY, targetY);
      groupRef.current.position.y = finalY;
      
      return; // Don't continue with waypoint following
    }
    
    // Normal waypoint following behavior
    const currentWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Check if reached current waypoint (with larger threshold to prevent rapid switching)
    const distanceToWaypoint = currentPos.distanceTo(currentWaypoint);
    
    if (distanceToWaypoint < 2.5) {
      // Move to next waypoint (loop around)
      currentWaypointIndex.current = (currentWaypointIndex.current + 1) % waypoints.length;
    }

    const targetWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Smooth movement direction with normalized check
    const direction = new THREE.Vector3()
      .subVectors(targetWaypoint, currentPos);
    
    const distance = direction.length();
    
    // Only move if we have a valid direction and distance
    if (distance > 0.01) {
      direction.normalize();
      
      // Move horizontally with clamped delta to prevent large jumps
      const clampedDelta = Math.min(delta, 0.05); // Cap delta at 50ms to prevent frame spikes
      const newX = currentPos.x + direction.x * speed * clampedDelta;
      const newZ = currentPos.z + direction.z * speed * clampedDelta;
      
      // Get terrain height at new position BEFORE moving (prevents walking into hills)
      const terrainHeight = getTerrainHeight(newX, newZ);
      
      // Use delta-based lerp for smooth, frame-rate independent interpolation
      const targetY = terrainHeight + 0.0; // Ground level - 0.0 offset
      const currentY = groupRef.current.position.y;
      const lerpFactor = Math.min(1.0, clampedDelta * 12); // Faster lerp for better responsiveness
      const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      
      // Clamp to prevent going under ground - always stay on top
      const finalY = Math.max(smoothedY, targetY);
      
      // Update position with smoothed terrain height
      groupRef.current.position.set(newX, finalY, newZ);

      // Smooth rotation using lerp
      const targetRotation = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );

      // Update animation state - always check and update animation
      if (lastAnimationState.current !== 'walk') {
        isMovingRef.current = true;
        lastAnimationState.current = 'walk';
        
        // Play walk animation - ensure animations are loaded
        if (animationsLoaded && crossfadeTo && model) {
          try {
            crossfadeTo('walk', 0.2);
          } catch (err) {
            console.warn(`[WalkingNPC ${id}] Failed to play walk animation:`, err);
          }
        }
      }
    } else {
      // Update animation state - always check and update animation
      if (lastAnimationState.current !== 'idle') {
        isMovingRef.current = false;
        lastAnimationState.current = 'idle';
        
        // Play idle animation - ensure animations are loaded
        if (animationsLoaded && crossfadeTo && model) {
          try {
            crossfadeTo('idle', 0.2);
          } catch (err) {
            console.warn(`[WalkingNPC ${id}] Failed to play idle animation:`, err);
          }
        }
      }
    }
    
    // Ensure NPC stays on terrain - use delta-based smoothing
    const terrainHeight = getTerrainHeight(groupRef.current.position.x, groupRef.current.position.z);
    const targetY = terrainHeight + 0.0; // Ground level - 0.0 offset
    const currentY = groupRef.current.position.y;
    
    // Use delta-based lerp for smooth, frame-rate independent interpolation
    const clampedDelta = Math.min(delta, 0.05); // Cap delta at 50ms to prevent frame spikes
    const lerpFactor = Math.min(1.0, clampedDelta * 12); // Faster lerp for better responsiveness
    const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
    
    // Clamp to prevent going under ground - always stay on top
    const finalY = Math.max(smoothedY, targetY);
    groupRef.current.position.y = finalY;
  });

  if (!modelLoaded || !model) {
    return null;
  }

  return (
    <group 
      ref={groupRef} 
      onClick={onClick}
      onPointerOver={() => {
        // Optional: highlight on hover
      }}
    >
      <primitive object={model} />
      
      {/* NPC Name Label */}
      <QuestLabel
        position={[0, 2.5, 0]}
        text={name}
        color="#4ade80"
        fontSize={0.35}
        offset={0}
      />
    </group>
  );
}
