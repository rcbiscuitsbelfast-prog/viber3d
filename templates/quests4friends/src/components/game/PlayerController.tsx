import { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useQuestStore } from '../../store/questStore';
import { assetRegistry } from '../../systems/assets/AssetRegistry';

interface PlayerControllerProps {
  spawnPosition: THREE.Vector3;
  playerAssetId?: string;
}

export function PlayerController({ 
  spawnPosition, 
  playerAssetId = 'char_rogue' 
}: PlayerControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Group | null>(null);
  const { camera } = useThree();
  
  const updatePlayerPosition = useQuestStore((state) => state.updatePlayerPosition);
  const combatState = useQuestStore((state) => state.combatState);

  // Movement state
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveSpeed = 5;
  const rotationSpeed = 5;

  // Keyboard controls subscription
  const [, get] = useKeyboardControls();

  // Load player model
  useEffect(() => {
    let mounted = true;

    console.log(`Loading player model: ${playerAssetId}`);
    
    assetRegistry.loadModel(playerAssetId)
      .then((loadedModel) => {
        console.log('Player model loaded successfully:', loadedModel);
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
          
          console.log('Model bounding box:', { min: box.min, max: box.max, size, center });
          
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
          
          console.log('Player model positioned at:', modelClone.position);
          console.log('Player model children count:', modelClone.children.length);
          setModel(modelClone);
        }
      })
      .catch((error: any) => {
        console.error('Failed to load player model:', error);
        console.error('Asset ID:', playerAssetId);
        console.error('Available assets:', assetRegistry.getAllAssets());
        // Create a fallback character representation
        if (mounted) {
          const fallbackGroup = new THREE.Group();
          // Body
          const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.3, 1.2, 4, 8), new THREE.MeshStandardMaterial({ color: '#ff6b6b' }));
          body.position.y = 0.6;
          body.castShadow = true;
          fallbackGroup.add(body);
          
          // Head
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
  }, [playerAssetId]);

  useFrame((_state, delta) => {
    if (!groupRef.current || !model || combatState?.isActive) return;

    // Get input from keyboard controls
    const { forward, backward, left, right } = get();
    
    // Calculate movement direction
    direction.current.set(0, 0, 0);
    
    if (forward) direction.current.z -= 1;
    if (backward) direction.current.z += 1;
    if (left) direction.current.x -= 1;
    if (right) direction.current.x += 1;

    // Normalize direction
    if (direction.current.length() > 0) {
      direction.current.normalize();
      
      // Apply movement
      velocity.current.copy(direction.current).multiplyScalar(moveSpeed * delta);
      groupRef.current.position.add(velocity.current);

      // Rotate player to face movement direction
      const targetRotation = Math.atan2(direction.current.x, direction.current.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        rotationSpeed * delta
      );
    }

    // Always update store with current position (even when not moving)
    updatePlayerPosition(groupRef.current.position.clone());

    // Camera follow - third person
    const cameraOffset = new THREE.Vector3(0, 5, 8);
    const targetCameraPosition = groupRef.current.position.clone().add(cameraOffset);
    
    camera.position.lerp(targetCameraPosition, 5 * delta);
    camera.lookAt(groupRef.current.position);
  });

  return (
    <group ref={groupRef} position={spawnPosition.toArray()}>
      {model ? (
        <primitive 
          object={model} 
          position={[0, 0, 0]}
          rotation={[0, 0, 0]}
          scale={[1, 1, 1]}
        />
      ) : (
        // Debug fallback - visible capsule to see player position
        <group>
          <mesh castShadow position={[0, 0.6, 0]}>
            <capsuleGeometry args={[0.3, 1.2, 4, 8]} />
            <meshStandardMaterial color="#ff6b6b" />
          </mesh>
          <mesh castShadow position={[0, 1.7, 0]}>
            <sphereGeometry args={[0.25, 8, 8]} />
            <meshStandardMaterial color="#ffdbac" />
          </mesh>
        </group>
      )}
      
      {/* Debug: Always show a visible marker at player position */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.5, 2, 0.5]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </mesh>
      <mesh position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      
      {/* Player collision sphere (invisible) */}
      <mesh visible={false} castShadow>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

// Keyboard controls setup
export const playerControls = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'left', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'right', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'interact', keys: ['KeyE'] },
];
