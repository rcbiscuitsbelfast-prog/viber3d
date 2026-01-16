import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Entity } from '../../../types/quest.types';
import { useQuestStore } from '../../../store/questStore';
import { assetRegistry } from '../../../systems/assets/AssetRegistry';

interface CollectibleEntityProps {
  entity: Entity;
}

export function CollectibleEntity({ entity }: CollectibleEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [isCollected, setIsCollected] = useState(false);
  
  const playerState = useQuestStore((state) => state.playerState);
  const addToInventory = useQuestStore((state) => state.addToInventory);

  const collectibleData = entity.collectibleData;
  const collectionRadius = collectibleData?.collectionRadius || 1.5;

  // Load collectible model
  useEffect(() => {
    let mounted = true;

    assetRegistry.loadModel(entity.assetId)
      .then((loadedModel: any) => {
        if (mounted) {
          setModel(loadedModel as THREE.Group);
        }
      })
      .catch((error) => {
        console.error('Failed to load collectible model:', error);
        // Create fallback collectible (a spinning box)
        if (mounted) {
          const fallbackGroup = new THREE.Group();
          const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.4), new THREE.MeshStandardMaterial({ color: '#ffd700' }));
          box.castShadow = true;
          fallbackGroup.add(box);
          setModel(fallbackGroup);
        }
      });

    return () => {
      mounted = false;
    };
  }, [entity.assetId]);

  // Check if already collected
  useEffect(() => {
    if (collectibleData?.collected) {
      setIsCollected(true);
    }
  }, [collectibleData?.collected]);

  // Floating animation and collection check
  useFrame((state) => {
    if (!groupRef.current || isCollected || !playerState) return;

    // Floating animation
    const time = state.clock.getElapsedTime();
    groupRef.current.position.y = entity.position.y + Math.sin(time * 2) * 0.2;
    groupRef.current.rotation.y += 0.02;

    // Check distance to player for collection
    if (collectibleData?.autoCollect) {
      const collectiblePos = new THREE.Vector3(
        entity.position.x,
        entity.position.y,
        entity.position.z
      );
      
      const playerPos = new THREE.Vector3(
        playerState.position.x,
        playerState.position.y,
        playerState.position.z
      );

      const distance = collectiblePos.distanceTo(playerPos);
      
      if (distance < collectionRadius) {
        setIsCollected(true);
        addToInventory(entity.id);
        console.log('Collected:', collectibleData?.name || entity.id);
      }
    }
  });

  // Don't render if collected
  if (isCollected) return null;

  return (
    <group
      ref={groupRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {model && <primitive object={model} />}

      {/* Glow effect */}
      <mesh visible={false}>
        <sphereGeometry args={[collectionRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}
