// src/components/game/PlayerController.tsx
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
  const playerState = useQuestStore((state) => state.playerState);
  const combatState = useQuestStore((state) => state.combatState);

  // Movement state
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveSpeed = 5;
  const rotationSpeed = 5;

  // Load player model
  useEffect(() => {
    let mounted = true;

    assetRegistry.loadModel(playerAssetId)
      .then((loadedModel) => {
        if (mounted) {
          setModel(loadedModel);
        }
      })
      .catch((error) => {
        console.error('Failed to load player model:', error);
      });

    return () => {
      mounted = false;
    };
  }, [playerAssetId]);

  // Keyboard controls subscription
  const [sub, get] = useKeyboardControls();

  useFrame((state, delta) => {
    if (!groupRef.current || !model || combatState?.isActive) return;

    // Get input
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

      // Update store
      updatePlayerPosition(groupRef.current.position.clone());
    }

    // Camera follow - third person
    const cameraOffset = new THREE.Vector3(0, 5, 8);
    const targetCameraPosition = groupRef.current.position.clone().add(cameraOffset);
    
    camera.position.lerp(targetCameraPosition, 5 * delta);
    camera.lookAt(groupRef.current.position);
  });

  return (
    <group ref={groupRef} position={spawnPosition}>
      {model && <primitive object={model} />}
      
      {/* Player collision sphere (invisible) */}
      <mesh visible={false}>
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