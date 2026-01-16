// src/components/game/entities/NPCEntity.tsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Entity } from '../../../types/quest.types';
import { useQuestStore } from '../../../store/questStore';
import { assetRegistry } from '../../../systems/assets/AssetRegistry';

interface NPCEntityProps {
  entity: Entity;
}

export function NPCEntity({ entity }: NPCEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [showInteract, setShowInteract] = useState(false);
  
  const playerState = useQuestStore((state) => state.playerState);
  const showDialogue = useQuestStore((state) => state.showDialogue);

  const npcData = entity.npcData;
  const interactionRadius = npcData?.interactionRadius || 3;

  // Load NPC model
  useEffect(() => {
    let mounted = true;

    assetRegistry.loadModel(entity.assetId)
      .then((loadedModel) => {
        if (mounted) {
          setModel(loadedModel);
        }
      })
      .catch((error) => {
        console.error('Failed to load NPC model:', error);
      });

    return () => {
      mounted = false;
    };
  }, [entity.assetId]);

  // Check distance to player
  useFrame(() => {
    if (!groupRef.current || !playerState) return;

    const npcPos = new THREE.Vector3(
      entity.position.x,
      entity.position.y,
      entity.position.z
    );
    
    const playerPos = new THREE.Vector3(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z
    );

    const distance = npcPos.distanceTo(playerPos);
    setShowInteract(distance < interactionRadius);
  });

  // Handle interaction
  useEffect(() => {
    if (!showInteract || !npcData?.dialog) return;

    const handleInteract = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        showDialogue(entity.id, npcData.dialog);
      }
    };

    window.addEventListener('keydown', handleInteract);
    return () => window.removeEventListener('keydown', handleInteract);
  }, [showInteract, entity.id, npcData?.dialog, showDialogue]);

  return (
    <group
      ref={groupRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {model && <primitive object={model} />}

      {/* Interaction prompt */}
      {showInteract && (
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2">
            <span className="bg-white text-black px-2 py-1 rounded text-xs">E</span>
            <span>Talk to {npcData?.name || 'NPC'}</span>
          </div>
        </Html>
      )}

      {/* Name label */}
      {npcData?.name && (
        <Html
          position={[0, 2, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
            {npcData.name}
          </div>
        </Html>
      )}

      {/* Collision sphere */}
      <mesh visible={false}>
        <sphereGeometry args={[interactionRadius, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}