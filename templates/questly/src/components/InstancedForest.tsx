// Instanced Forest Component - Efficient rendering of trees using InstancedMesh
// Reduces draw calls from thousands to just a few

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, InstancedMesh } from '@react-three/drei';
import * as THREE from 'three';

interface TreeInstance {
  pos: [number, number, number];
  rotation: number;
  scale: number;
  treeType: 'pine' | 'broad' | 'bushy';
}

interface InstancedForestProps {
  trees: TreeInstance[];
  castShadow?: boolean;
  receiveShadow?: boolean;
}

export function InstancedForest({ trees, castShadow = true, receiveShadow = false }: InstancedForestProps) {
  const pineRef = useRef<THREE.InstancedMesh>(null);
  const broadRef = useRef<THREE.InstancedMesh>(null);
  const bushyRef = useRef<THREE.InstancedMesh>(null);

  // Load tree models
  const { scene: pineScene } = useGLTF('/kaykit/Tree_4_A_Color1.gltf');
  const { scene: broadScene } = useGLTF('/kaykit/Tree_1_A_Color1.gltf');
  const { scene: bushyScene } = useGLTF('/kaykit/Tree_2_A_Color1.gltf');

  // Extract geometry and material from scenes
  const pineGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    pineScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        geo = child.geometry.clone();
        // Apply matrix to geometry
        geo.applyMatrix4(child.matrixWorld);
      }
    });
    return geo || new THREE.BoxGeometry(1, 1, 1);
  }, [pineScene]);

  const broadGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    broadScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
      }
    });
    return geo || new THREE.BoxGeometry(1, 1, 1);
  }, [broadScene]);

  const bushyGeometry = useMemo(() => {
    let geo: THREE.BufferGeometry | null = null;
    bushyScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        geo = child.geometry.clone();
        geo.applyMatrix4(child.matrixWorld);
      }
    });
    return geo || new THREE.BoxGeometry(1, 1, 1);
  }, [bushyScene]);

  // Get materials
  const pineMaterial = useMemo(() => {
    let mat: THREE.Material | null = null;
    pineScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        mat = Array.isArray(child.material) ? child.material[0] : child.material;
      }
    });
    return mat || new THREE.MeshStandardMaterial({ color: 0x228b22 });
  }, [pineScene]);

  const broadMaterial = useMemo(() => {
    let mat: THREE.Material | null = null;
    broadScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        mat = Array.isArray(child.material) ? child.material[0] : child.material;
      }
    });
    return mat || new THREE.MeshStandardMaterial({ color: 0x228b22 });
  }, [broadScene]);

  const bushyMaterial = useMemo(() => {
    let mat: THREE.Material | null = null;
    bushyScene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        mat = Array.isArray(child.material) ? child.material[0] : child.material;
      }
    });
    return mat || new THREE.MeshStandardMaterial({ color: 0x228b22 });
  }, [bushyScene]);

  // Separate trees by type
  const { pineTrees, broadTrees, bushyTrees } = useMemo(() => {
    const pine: TreeInstance[] = [];
    const broad: TreeInstance[] = [];
    const bushy: TreeInstance[] = [];

    trees.forEach((tree) => {
      if (tree.treeType === 'pine') {
        pine.push(tree);
      } else if (tree.treeType === 'broad') {
        broad.push(tree);
      } else {
        bushy.push(tree);
      }
    });

    return { pineTrees: pine, broadTrees: broad, bushyTrees: bushy };
  }, [trees]);

  // Update instance matrices
  useFrame(() => {
    const matrix = new THREE.Matrix4();

    // Update pine trees
    if (pineRef.current) {
      pineTrees.forEach((tree, i) => {
        const [x, y, z] = tree.pos;
        matrix.makeRotationY(tree.rotation);
        matrix.scale(new THREE.Vector3(tree.scale, tree.scale, tree.scale));
        matrix.setPosition(x, y, z);
        pineRef.current!.setMatrixAt(i, matrix);
      });
      pineRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update broad trees
    if (broadRef.current) {
      broadTrees.forEach((tree, i) => {
        const [x, y, z] = tree.pos;
        matrix.makeRotationY(tree.rotation);
        matrix.scale(new THREE.Vector3(tree.scale, tree.scale, tree.scale));
        matrix.setPosition(x, y, z);
        broadRef.current!.setMatrixAt(i, matrix);
      });
      broadRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update bushy trees
    if (bushyRef.current) {
      bushyTrees.forEach((tree, i) => {
        const [x, y, z] = tree.pos;
        matrix.makeRotationY(tree.rotation);
        matrix.scale(new THREE.Vector3(tree.scale, tree.scale, tree.scale));
        matrix.setPosition(x, y, z);
        bushyRef.current!.setMatrixAt(i, matrix);
      });
      bushyRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      {/* Pine Trees Instanced Mesh */}
      {pineTrees.length > 0 && (
        <instancedMesh
          ref={pineRef}
          args={[pineGeometry, pineMaterial, pineTrees.length]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}

      {/* Broad Trees Instanced Mesh */}
      {broadTrees.length > 0 && (
        <instancedMesh
          ref={broadRef}
          args={[broadGeometry, broadMaterial, broadTrees.length]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}

      {/* Bushy Trees Instanced Mesh */}
      {bushyTrees.length > 0 && (
        <instancedMesh
          ref={bushyRef}
          args={[bushyGeometry, bushyMaterial, bushyTrees.length]}
          castShadow={castShadow}
          receiveShadow={receiveShadow}
        />
      )}
    </>
  );
}
