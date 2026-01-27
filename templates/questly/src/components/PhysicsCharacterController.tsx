// Physics-based Character Controller using Cannon-ES
// Integrates physics world with character movement

import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cloneGltf } from '../utils/cloneGltf';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';

type CrossfadeFn = (anim: string, duration?: number) => void;

interface PhysicsCharacterControllerProps {
  startPosition: [number, number, number];
  physicsWorld: CANNON.World;
  characterModelPath?: string;
  onAnimationTrigger?: (crossfade: CrossfadeFn) => void;
}

export function PhysicsCharacterController({
  startPosition,
  physicsWorld,
  characterModelPath,
  onAnimationTrigger,
}: PhysicsCharacterControllerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const characterBodyRef = useRef<CANNON.Body | null>(null);
  const keys = useRef<{[key: string]: boolean}>({});
  const jumpPressed = useRef(false);
  const { camera } = useThree();

  // Initialize physics body
  useEffect(() => {
    if (!physicsWorld) return;

    // Create character physics body (capsule shape)
    const radius = 0.4;
    const height = 1.6;
    const shape = new CANNON.Cylinder(radius, radius, height, 8);
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(startPosition[0], startPosition[1], startPosition[2]);
    body.fixedRotation = true; // Prevent tipping
    body.material = new CANNON.Material('character');
    body.material.friction = 0.1;
    body.material.restitution = 0;

    physicsWorld.addBody(body);
    characterBodyRef.current = body;

    return () => {
      if (body && physicsWorld) {
        physicsWorld.removeBody(body);
      }
    };
  }, [physicsWorld, startPosition]);

  // Load character model
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        const modelPath = characterModelPath || '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb';
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(modelPath, resolve, undefined, reject);
        });
        
        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        characterScene.scale.setScalar(1);
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;
        
        characterScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
          }
        });
        
        setModel(characterScene);
        setModelLoaded(true);
      } catch (err) {
        console.error('[PhysicsCharacterController] Failed to load character:', err);
        setModelLoaded(true);
      }
    };

    loadCharacter();
  }, [characterModelPath]);

  // Character animation
  const { crossfadeTo } = useCharacterAnimation({
    characterId: 'physics-player',
    assetId: 'char_rogue',
    model: model,
    defaultAnimation: 'idle',
  });

  useEffect(() => {
    if (onAnimationTrigger && crossfadeTo) {
      onAnimationTrigger(crossfadeTo);
    }
  }, [onAnimationTrigger, crossfadeTo]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = true;
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = true;
        keys.current['Space'] = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      keys.current[key] = false;
      if (e.code === 'Space' || key === ' ') {
        keys.current[' '] = false;
        keys.current['Space'] = false;
        jumpPressed.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Physics-based movement
  useFrame((_state, delta) => {
    if (!characterBodyRef.current || !groupRef.current) return;

    const body = characterBodyRef.current;
    const moveSpeed = 5.0;
    const jumpForce = 8.0;

    // Check if grounded (simple check - can be improved)
    const isGrounded = body.velocity.y < 0.1 && body.velocity.y > -0.1 && body.position.y < startPosition[1] + 2;

    // Movement input
    const moveVector = new CANNON.Vec3(0, 0, 0);
    
    if (keys.current['w'] || keys.current['arrowup']) {
      moveVector.z -= 1;
    }
    if (keys.current['s'] || keys.current['arrowdown']) {
      moveVector.z += 1;
    }
    if (keys.current['a'] || keys.current['arrowleft']) {
      moveVector.x -= 1;
    }
    if (keys.current['d'] || keys.current['arrowright']) {
      moveVector.x += 1;
    }

    // Apply movement force
    if (moveVector.length() > 0) {
      moveVector.normalize();
      moveVector.scale(moveSpeed, moveVector);
      
      // Apply force in world space
      body.velocity.x = moveVector.x;
      body.velocity.z = moveVector.z;
      
      // Rotate character to face movement direction
      if (groupRef.current) {
        const angle = Math.atan2(moveVector.x, moveVector.z);
        groupRef.current.rotation.y = angle;
      }

      // Play walk animation
      if (crossfadeTo) {
        crossfadeTo('walk', 0.2);
      }
    } else {
      // Damping when not moving
      body.velocity.x *= 0.9;
      body.velocity.z *= 0.9;
      
      // Play idle animation
      if (crossfadeTo) {
        crossfadeTo('idle', 0.2);
      }
    }

    // Jump
    if ((keys.current[' '] || keys.current['Space']) && isGrounded && !jumpPressed.current) {
      body.velocity.y = jumpForce;
      jumpPressed.current = true;
      
      if (crossfadeTo) {
        crossfadeTo('jump', 0.1);
      }
    }

    // Sync Three.js group with physics body
    groupRef.current.position.copy(body.position as any);
    groupRef.current.position.y -= 0.8; // Adjust for capsule center

    // Update camera to follow character
    camera.position.set(
      body.position.x + 5,
      body.position.y + 3,
      body.position.z + 5
    );
    camera.lookAt(body.position.x, body.position.y + 1, body.position.z);
  });

  if (!modelLoaded || !model) {
    return null;
  }

  return (
    <group ref={groupRef}>
      <primitive object={model} />
    </group>
  );
}
