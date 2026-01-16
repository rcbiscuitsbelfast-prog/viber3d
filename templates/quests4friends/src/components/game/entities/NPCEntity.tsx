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
  const activeDialogue = useQuestStore((state) => state.activeDialogue);

  const npcData = entity.npcData;
  const interactionRadius = npcData?.interactionRadius || 3;

  // Load NPC model
  useEffect(() => {
    let mounted = true;

    assetRegistry.loadModel(entity.assetId)
      .then((loadedModel: any) => {
        if (mounted) {
          const model = loadedModel as THREE.Group;
          
          // Clone the model to avoid modifying the cached version
          const modelClone = model.clone();
          
          // Reset model transforms to ensure it's at origin relative to group
          modelClone.position.set(0, 0, 0);
          modelClone.rotation.set(0, 0, 0);
          modelClone.scale.set(1, 1, 1);
          
          // Center the model if it has an offset (ensure feet are at y=0)
          const box = new THREE.Box3().setFromObject(modelClone);
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());
          
          console.log('NPC model bounding box:', entity.assetId, { min: box.min, max: box.max, size, center });
          
          if (box.min.y < 0) {
            // Adjust so model sits on ground (feet at y=0)
            modelClone.position.y = -box.min.y;
          }
          
          // Ensure model is visible and has proper materials
          modelClone.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.visible = true;
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Ensure materials are properly set
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                      mat.needsUpdate = true;
                    }
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.needsUpdate = true;
                }
              }
            }
          });
          
          console.log('NPC model loaded and positioned:', entity.assetId, modelClone.position);
          console.log('NPC model children count:', modelClone.children.length);
          setModel(modelClone);
        }
      })
      .catch((error) => {
        console.error('Failed to load NPC model:', error);
        // Create fallback NPC model
        if (mounted) {
          const fallbackGroup = new THREE.Group();
          const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: '#4ecdc4' }));
          body.position.y = 0.6;
          body.castShadow = true;
          fallbackGroup.add(body);
          
          const head = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 8), new THREE.MeshStandardMaterial({ color: '#ffdbac' }));
          head.position.y = 1.7;
          head.castShadow = true;
          fallbackGroup.add(head);
          
          setModel(fallbackGroup);
        }
      });

    return () => {
      mounted = false;
    };
  }, [entity.assetId]);

  // Check distance to player
  useFrame(() => {
    if (!groupRef.current || !playerState || activeDialogue) {
      setShowInteract(false);
      return;
    }

    // Use group's actual world position
    const npcPos = new THREE.Vector3();
    groupRef.current.getWorldPosition(npcPos);
    
    const playerPos = new THREE.Vector3(
      playerState.position.x,
      playerState.position.y,
      playerState.position.z
    );

    const distance = npcPos.distanceTo(playerPos);
    setShowInteract(distance < interactionRadius);
    
    // Debug log (remove in production)
    if (distance < interactionRadius + 1) {
      console.log('NPC distance:', distance, 'Show interact:', distance < interactionRadius);
    }
  });

  // Handle interaction - use drei keyboard controls
  useEffect(() => {
    if (!showInteract || !npcData?.dialog || activeDialogue) return;

    const handleInteract = (e: KeyboardEvent) => {
      // Check for 'e' or 'E' key
      if (e.key === 'e' || e.key === 'E' || e.code === 'KeyE') {
        e.preventDefault();
        e.stopPropagation();
        console.log('=== INTERACTION TRIGGERED ===');
        console.log('Entity ID:', entity.id);
        console.log('Dialogue:', npcData.dialog);
        console.log('Calling showDialogue...');
        
        try {
          showDialogue(entity.id, npcData.dialog);
          console.log('showDialogue called successfully');
          
          // Verify state was updated
          setTimeout(() => {
            const storeState = useQuestStore.getState();
            console.log('Store state after showDialogue:', {
              activeDialogue: storeState.activeDialogue,
              activeNPCId: storeState.activeNPCId
            });
          }, 100);
        } catch (error) {
          console.error('Error calling showDialogue:', error);
        }
      }
    };

    window.addEventListener('keydown', handleInteract, true); // Use capture phase
    return () => window.removeEventListener('keydown', handleInteract, true);
  }, [showInteract, entity.id, npcData?.dialog, showDialogue, activeDialogue]);

  return (
    <group
      ref={groupRef}
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {model && (
        <primitive 
          object={model} 
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
        />
      )}

      {/* Interaction prompt */}
      {showInteract && model && (
        <Html
          position={[0, 2.5, 0]}
          center
          distanceFactor={10}
          zIndexRange={[100, 0]}
          style={{
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap flex items-center gap-2 border-2 border-white/30">
            <span className="bg-white text-black px-2 py-1 rounded text-xs font-mono">E</span>
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
