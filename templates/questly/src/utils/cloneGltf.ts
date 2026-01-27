import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';

/**
 * Deep clone a GLTF object, properly handling skinned meshes and bones
 * Essential for character models with skeletal animations
 */
export function cloneGltf(gltf: GLTF): GLTF {
  const clone: GLTF = {
    scene: gltf.scene.clone(true),
    scenes: gltf.scenes,
    cameras: gltf.cameras,
    animations: gltf.animations,
    asset: gltf.asset,
    parser: gltf.parser,
    userData: gltf.userData,
  };

  const skinnedMeshes: Record<string, THREE.SkinnedMesh> = {};
  
  gltf.scene.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) {
      skinnedMeshes[node.name] = node;
    }
  });

  const cloneBones: Record<string, THREE.Bone> = {};
  const cloneSkinnedMeshes: Record<string, THREE.SkinnedMesh> = {};

  clone.scene.traverse((node) => {
    if (node instanceof THREE.Bone) {
      cloneBones[node.name] = node;
    }
    if (node instanceof THREE.SkinnedMesh) {
      cloneSkinnedMeshes[node.name] = node;
    }
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones: THREE.Bone[] = [];

    for (const bone of skeleton.bones) {
      const cloneBone = cloneBones[bone.name];
      if (cloneBone) {
        orderedCloneBones.push(cloneBone);
      }
    }

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );
  }

  return clone;
}
