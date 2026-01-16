import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { Entity } from '../../../types/quest.types';
import { useQuestStore } from '../../../store/questStore';
import { assetRegistry } from '../../../systems/assets/AssetRegistry';
import { useCharacterAnimation } from '../../../hooks/useCharacterAnimation';

interface EnemyEntityProps {
  entity: Entity;
}

export function EnemyEntity({ entity }: EnemyEntityProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [showInteract, setShowInteract] = useState(false);
  const [isDefeated, setIsDefeated] = useState(false);
  
  const playerState = useQuestStore((state) => state.playerState);
  const combatState = useQuestStore((state) => state.combatState);
  const startCombat = useQuestStore((state) => state.startCombat);

  const enemyData = entity.enemyData;
  const engageRadius = 3;
  const isBoss = entity.type === 'boss' || enemyData?.isBoss;

  // Animation system
  const { playAnimation, isLoaded: animationsLoaded } = useCharacterAnimation({
    characterId: `enemy_${entity.id}`,
    assetId: entity.assetId,
    model,
    defaultAnimation: enemyData?.idleAnimation || 'idle',
  });

  // Load enemy model
  useEffect(() => {
    let mounted = true;

    assetRegistry.loadModel(entity.assetId)
      .then((loadedModel: any) => {
        if (mounted) {
          setModel(loadedModel as THREE.Group);
        }
      })
      .catch((error) => {
        console.error('Failed to load enemy model:', error);
      });

    return () => {
      mounted = false;
    };
  }, [entity.assetId]);

  // Check if enemy is defeated
  useEffect(() => {
    if (enemyData && enemyData.hp <= 0 && !isDefeated) {
      setIsDefeated(true);
      // Play death animation
      if (animationsLoaded && enemyData?.deathAnimation) {
        playAnimation(enemyData.deathAnimation, { 
          loop: false
        });
      }
    }
  }, [enemyData?.hp, isDefeated, animationsLoaded, playAnimation, enemyData?.deathAnimation]);

  // Check distance to player for engagement
  useFrame(() => {
    if (!groupRef.current || !playerState || isDefeated || combatState?.isActive) return;

    const enemyPos = new THREE.Vector3(
      entity.position.x,
      entity.position.y,
      entity.position.z
    );
    
    const playerPos = new THREE.Vector3(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z
    );

    const distance = enemyPos.distanceTo(playerPos);
    setShowInteract(distance < engageRadius);
  });

  // Handle combat initiation
  useEffect(() => {
    if (!showInteract || !enemyData || isDefeated) return;

    const handleEngage = (e: KeyboardEvent) => {
      if (e.key === 'e' || e.key === 'E') {
        startCombat(entity.id, enemyData.hp);
      }
    };

    window.addEventListener('keydown', handleEngage);
    return () => window.removeEventListener('keydown', handleEngage);
  }, [showInteract, entity.id, enemyData, isDefeated, startCombat]);

  // Don't render if defeated
  if (isDefeated) return null;

  return (
    <group
      ref={groupRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {model && <primitive object={model} />}

      {/* Health bar */}
      {enemyData && (
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className={`px-3 py-1 rounded-full text-xs font-bold ${
              isBoss ? 'bg-red-600' : 'bg-orange-600'
            } text-white`}>
              {enemyData.name || (isBoss ? 'Boss' : 'Enemy')}
            </div>
            
            <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  isBoss ? 'bg-red-500' : 'bg-orange-500'
                }`}
                style={{
                  width: `${(enemyData.hp / enemyData.maxHp) * 100}%`,
                }}
              />
            </div>
          </div>
        </Html>
      )}

      {/* Combat prompt */}
      {showInteract && !combatState?.isActive && (
        <Html
          position={[0, 3.2, 0]}
          center
          distanceFactor={10}
          style={{
            pointerEvents: 'none',
          }}
        >
          <div className="bg-black/80 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2">
            <span className="bg-white text-black px-2 py-1 rounded text-xs">E</span>
            <span>Battle {enemyData?.name || 'Enemy'}</span>
          </div>
        </Html>
      )}
    </group>
  );
}
