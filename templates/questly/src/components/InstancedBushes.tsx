// Instanced Bushes Component - Efficient rendering of bushes using InstancedMesh

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface BushInstance {
  pos: [number, number, number];
  rotation: number;
  scale: number;
  variant: number;
}

interface InstancedBushesProps {
  bushes: BushInstance[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// Preload all bush models (hooks must be called unconditionally)
function useBushModels() {
  const bush3b = useGLTF('/kaykit/Bush_3_B_Color1.gltf');
  const bush3c = useGLTF('/kaykit/Bush_3_C_Color1.gltf');
  const bush4a = useGLTF('/kaykit/Bush_4_A_Color1.gltf');
  const bush4b = useGLTF('/kaykit/Bush_4_B_Color1.gltf');
  const bush4c = useGLTF('/kaykit/Bush_4_C_Color1.gltf');
  const bush4d = useGLTF('/kaykit/Bush_4_D_Color1.gltf');
  const bush4e = useGLTF('/kaykit/Bush_4_E_Color1.gltf');
  const bush4f = useGLTF('/kaykit/Bush_4_F_Color1.gltf');

  return [
    bush3b.scene,
    bush3c.scene,
    bush4a.scene,
    bush4b.scene,
    bush4c.scene,
    bush4d.scene,
    bush4e.scene,
    bush4f.scene,
  ];
}

export function InstancedBushes({ bushes, castShadow = true, receiveShadow = false }: InstancedBushesProps) {
  // Load all bush variants
  const bushScenes = useBushModels();

  // Extract geometries and materials for each variant
  const bushData = useMemo(() => {
    return bushScenes.map((scene) => {
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
        material: mat || new THREE.MeshStandardMaterial({ color: 0x6ba84f }),
      };
    });
  }, [bushScenes]);

  // Group bushes by variant
  const bushesByVariant = useMemo(() => {
    const groups: Map<number, BushInstance[]> = new Map();
    bushes.forEach((bush) => {
      const variant = bush.variant % 8; // 8 bush variants
      if (!groups.has(variant)) {
        groups.set(variant, []);
      }
      groups.get(variant)!.push(bush);
    });
    return groups;
  }, [bushes]);

  // Create refs for each variant's instanced mesh
  const refs = useRef<Map<number, THREE.InstancedMesh>>(new Map());

  // Update instance matrices
  useFrame(() => {
    const matrix = new THREE.Matrix4();

    bushesByVariant.forEach((variantBushes, variant) => {
      const mesh = refs.current.get(variant);
      if (mesh) {
        variantBushes.forEach((bush, i) => {
          const [x, y, z] = bush.pos;
          const scale = bush.scale * 1.2; // Match original bush scale
          matrix.makeRotationY(bush.rotation);
          matrix.scale(new THREE.Vector3(scale, scale, scale));
          matrix.setPosition(x, y, z);
          mesh.setMatrixAt(i, matrix);
        });
        mesh.instanceMatrix.needsUpdate = true;
      }
    });
  });

  return (
    <>
      {Array.from(bushesByVariant.entries()).map(([variant, variantBushes]) => {
        const { geometry, material } = bushData[variant];
        return (
          <instancedMesh
            key={variant}
            ref={(ref) => {
              if (ref) refs.current.set(variant, ref);
            }}
            args={[geometry, material, variantBushes.length]}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        );
      })}
    </>
  );
}
