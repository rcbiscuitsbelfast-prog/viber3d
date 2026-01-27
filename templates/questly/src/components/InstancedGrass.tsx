// Instanced Grass Component - Efficient rendering of grass using InstancedMesh

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface GrassInstance {
  pos: [number, number, number];
  rotation: number;
  scale: number;
  variant?: number;
}

interface InstancedGrassProps {
  grass: GrassInstance[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// Preload all grass models (hooks must be called unconditionally)
function useGrassModels() {
  const grass1a = useGLTF('/kaykit/Grass_1_A_Color1.gltf');
  const grass1b = useGLTF('/kaykit/Grass_1_B_Color1.gltf');
  const grass1c = useGLTF('/kaykit/Grass_1_C_Color1.gltf');
  const grass1d = useGLTF('/kaykit/Grass_1_D_Color1.gltf');

  return [
    grass1a.scene,
    grass1b.scene,
    grass1c.scene,
    grass1d.scene,
  ];
}

export function InstancedGrass({ grass, castShadow = true, receiveShadow = false }: InstancedGrassProps) {
  // Load all grass variants
  const grassScenes = useGrassModels();

  // Extract geometries and materials for each variant
  const grassData = useMemo(() => {
    return grassScenes.map((scene) => {
      let geo: THREE.BufferGeometry | null = null;
      let mat: THREE.Material | null = null;

      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.geometry && !geo) {
            geo = child.geometry.clone();
            geo.applyMatrix4(child.matrixWorld);
          }
          if (child.material && !mat) {
            mat = Array.isArray(child.material) ? child.material[0] : child.material;
          }
        }
      });

      return {
        geometry: geo || new THREE.BoxGeometry(1, 1, 1),
        material: mat || new THREE.MeshStandardMaterial({ color: 0x90c850 }),
      };
    });
  }, [grassScenes]);

  // Group grass by variant
  const grassByVariant = useMemo(() => {
    const groups: Map<number, GrassInstance[]> = new Map();
    grass.forEach((g) => {
      const variant = (g.variant || 0) % 4; // 4 grass variants
      if (!groups.has(variant)) {
        groups.set(variant, []);
      }
      groups.get(variant)!.push(g);
    });
    return groups;
  }, [grass]);

  // Create refs for each variant's instanced mesh
  const refs = useRef<Map<number, THREE.InstancedMesh>>(new Map());

  // Update instance matrices
  useFrame(() => {
    const matrix = new THREE.Matrix4();

    grassByVariant.forEach((variantGrass, variant) => {
      const mesh = refs.current.get(variant);
      if (mesh) {
        variantGrass.forEach((g, i) => {
          const [x, y, z] = g.pos;
          matrix.makeRotationY(g.rotation);
          matrix.scale(new THREE.Vector3(g.scale, g.scale, g.scale));
          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(i, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {Array.from(grassByVariant.entries()).map(([variant, variantGrass]) => {
        const { geometry, material } = grassData[variant];
        return (
          <instancedMesh
            key={variant}
            ref={(ref) => {
              if (ref) refs.current.set(variant, ref);
            }}
            args={[geometry, material, variantGrass.length]}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        );
      })}
    </>
  );
}
