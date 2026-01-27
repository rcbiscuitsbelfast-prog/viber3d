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
}: WalkingNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);
  const lastAnimationState = useRef<'idle' | 'walk'>('idle');

  // Helper function to get terrain height
  const getTerrainHeight = (x: number, z: number): number => {
    if (!terrainMeshRef?.current) return 2.5; // Default height
    
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.set(x, 100, z);
    raycaster.ray.direction.set(0, -1, 0);
    
    const intersects = raycaster.intersectObject(terrainMeshRef.current, false);
    if (intersects.length > 0) {
      return intersects[0].point.y;
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

  // Initialize position on terrain
  useEffect(() => {
    if (groupRef.current && terrainMeshRef?.current) {
      const terrainHeight = getTerrainHeight(position[0], position[2]);
      groupRef.current.position.set(position[0], terrainHeight + 0.9, position[2]);
    } else if (groupRef.current) {
      groupRef.current.position.set(position[0], position[1] + 0.9, position[2]);
    }
  }, [terrainMeshRef, position]);

  // Waypoint following behavior
  useFrame((_state, delta) => {
    if (!groupRef.current || !modelLoaded || waypoints.length === 0) return;

    const currentPos = groupRef.current.position;
    const currentWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Check if reached current waypoint
    const distanceToWaypoint = currentPos.distanceTo(currentWaypoint);
    
    if (distanceToWaypoint < 2) {
      // Move to next waypoint (loop around)
      currentWaypointIndex.current = (currentWaypointIndex.current + 1) % waypoints.length;
    }

    const targetWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Smooth movement direction
    const direction = new THREE.Vector3()
      .subVectors(targetWaypoint, currentPos)
      .normalize();

    // Only move if we have a valid direction
    if (direction.length() > 0.01) {
      // Move horizontally
      const newX = currentPos.x + direction.x * speed * delta;
      const newZ = currentPos.z + direction.z * speed * delta;
      
      // Get terrain height at new position
      const terrainHeight = getTerrainHeight(newX, newZ);
      
      // Update position with terrain height
      groupRef.current.position.set(newX, terrainHeight + 0.9, newZ);

      // Smooth rotation using lerp
      const targetRotation = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );

      // Update animation state
      if (!isMovingRef.current || lastAnimationState.current !== 'walk') {
        isMovingRef.current = true;
        lastAnimationState.current = 'walk';
        
        // Play walk animation
        if (animationsLoaded && crossfadeTo) {
          crossfadeTo('walk', 0.2);
        }
      }
    } else {
      // Update animation state
      if (isMovingRef.current || lastAnimationState.current !== 'idle') {
        isMovingRef.current = false;
        lastAnimationState.current = 'idle';
        
        // Play idle animation
        if (animationsLoaded && crossfadeTo) {
          crossfadeTo('idle', 0.2);
        }
      }
    }
    
    // Ensure NPC stays on terrain
    const terrainHeight = getTerrainHeight(groupRef.current.position.x, groupRef.current.position.z);
    if (Math.abs(groupRef.current.position.y - (terrainHeight + 0.9)) > 0.1) {
      groupRef.current.position.y = terrainHeight + 0.9;
    }
  });

  if (!modelLoaded || !model) {
    return null;
  }

  return (
    <group 
      ref={groupRef} 
      position={position}
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
