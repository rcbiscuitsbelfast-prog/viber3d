// Instanced Rocks Component - Efficient rendering of rocks using InstancedMesh

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface RockInstance {
  pos: [number, number, number];
  rotation: number;
  scale: number;
  variant: number;
}

interface InstancedRocksProps {
  rocks: RockInstance[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// Preload all rock models (hooks must be called unconditionally)
function useRockModels() {
  const rock1a = useGLTF('/kaykit/Rock_1_A_Color1.gltf');
  const rock1b = useGLTF('/kaykit/Rock_1_B_Color1.gltf');
  const rock1c = useGLTF('/kaykit/Rock_1_C_Color1.gltf');
  const rock1d = useGLTF('/kaykit/Rock_1_D_Color1.gltf');
  const rock1e = useGLTF('/kaykit/Rock_1_E_Color1.gltf');
  const rock1f = useGLTF('/kaykit/Rock_1_F_Color1.gltf');
  const rock2a = useGLTF('/kaykit/Rock_2_A_Color1.gltf');
  const rock2b = useGLTF('/kaykit/Rock_2_B_Color1.gltf');
  const rock2c = useGLTF('/kaykit/Rock_2_C_Color1.gltf');
  const rock2d = useGLTF('/kaykit/Rock_2_D_Color1.gltf');
  const rock2e = useGLTF('/kaykit/Rock_2_E_Color1.gltf');
  const rock2f = useGLTF('/kaykit/Rock_2_F_Color1.gltf');
  const rock3a = useGLTF('/kaykit/Rock_3_A_Color1.gltf');
  const rock3b = useGLTF('/kaykit/Rock_3_B_Color1.gltf');
  const rock3c = useGLTF('/kaykit/Rock_3_C_Color1.gltf');
  const rock3d = useGLTF('/kaykit/Rock_3_D_Color1.gltf');
  const rock3e = useGLTF('/kaykit/Rock_3_E_Color1.gltf');
  const rock3f = useGLTF('/kaykit/Rock_3_F_Color1.gltf');

  return [
    rock1a.scene, rock1b.scene, rock1c.scene, rock1d.scene, rock1e.scene, rock1f.scene,
    rock2a.scene, rock2b.scene, rock2c.scene, rock2d.scene, rock2e.scene, rock2f.scene,
    rock3a.scene, rock3b.scene, rock3c.scene, rock3d.scene, rock3e.scene, rock3f.scene,
  ];
}

export function InstancedRocks({ rocks, castShadow = true, receiveShadow = false }: InstancedRocksProps) {
  // Load all rock variants
  const rockScenes = useRockModels();

  // Extract geometries and materials for each variant
  const rockData = useMemo(() => {
    return rockScenes.map((scene) => {
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
        material: mat || new THREE.MeshStandardMaterial({ color: 0x888888 }),
      };
    });
  }, [rockScenes]);

  // Group rocks by variant
  const rocksByVariant = useMemo(() => {
    const groups: Map<number, RockInstance[]> = new Map();
    rocks.forEach((rock) => {
      const variant = rock.variant % 18; // 18 rock variants
      if (!groups.has(variant)) {
        groups.set(variant, []);
      }
      groups.get(variant)!.push(rock);
    });
    return groups;
  }, [rocks]);

  // Create refs for each variant's instanced mesh
  const refs = useRef<Map<number, THREE.InstancedMesh>>(new Map());

  // Update instance matrices
  useFrame(() => {
    const matrix = new THREE.Matrix4();

    rocksByVariant.forEach((variantRocks, variant) => {
      const mesh = refs.current.get(variant);
      if (mesh) {
        variantRocks.forEach((rock, i) => {
          const [x, y, z] = rock.pos;
          const scale = rock.scale * 1.5; // Match original rock scale
          matrix.makeRotationY(rock.rotation);
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
      {Array.from(rocksByVariant.entries()).map(([variant, variantRocks]) => {
        const { geometry, material } = rockData[variant];
        return (
          <instancedMesh
            key={variant}
            ref={(ref) => {
              if (ref) refs.current.set(variant, ref);
            }}
            args={[geometry, material, variantRocks.length]}
            castShadow={castShadow}
            receiveShadow={receiveShadow}
          />
        );
      })}
    </>
  );
}
