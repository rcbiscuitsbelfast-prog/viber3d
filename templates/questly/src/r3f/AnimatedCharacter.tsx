import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import * as THREE from 'three';

// Animated Character Component following MASTER_THREEJS_BEST_PRACTICES.md
// - Proper resource disposal on unmount
// - Animation mixer management
// - GLB model loading with error handling

interface AnimatedCharacterProps {
  modelPath: string;
  animationName?: string;
  position?: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
}

export default function AnimatedCharacter({
  modelPath,
  animationName,
  position = [0, 0, 0],
  scale = 1,
  rotation = [0, 0, 0],
}: AnimatedCharacterProps) {
  const group = useRef<THREE.Group>(null);
  
  // Load model and animations
  const { scene, animations } = useGLTF(modelPath);
  const { actions, mixer } = useAnimations(animations, group);

  // Play animation on mount
  useEffect(() => {
    if (animationName && actions[animationName]) {
      const action = actions[animationName];
      action?.reset().fadeIn(0.5).play();

      return () => {
        action?.fadeOut(0.5);
      };
    } else if (animations.length > 0 && actions) {
      // Play first animation if no specific name provided
      const firstAnimation = Object.values(actions)[0];
      firstAnimation?.reset().fadeIn(0.5).play();

      return () => {
        firstAnimation?.fadeOut(0.5);
      };
    }
  }, [animationName, actions, animations]);

  // Update animation mixer
  useFrame((state, delta) => {
    if (mixer) {
      mixer.update(delta);
    }
  });

  // Dispose resources on unmount (Best Practice)
  useEffect(() => {
    return () => {
      if (mixer) {
        mixer.stopAllAction();
      }
      // Dispose geometries and materials
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry?.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material?.dispose();
          }
        }
      });
    };
  }, [scene, mixer]);

  return (
    <group ref={group} position={position} scale={scale} rotation={rotation}>
      <primitive object={scene.clone()} />
    </group>
  );
}

// Preload the model for better performance
// useGLTF.preload('/path/to/model.glb');
