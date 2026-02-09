/**
 * ModelCloner.ts
 * Clone KayKit models while preserving rigging and animations
 */

import * as THREE from 'three';
import { GLTF } from 'three/examples/jsm/loaders/GLTFLoader';
import { ClonedModel } from './types';

export class ModelCloner {
  /**
   * Clone a GLTF model with all materials, textures, and rigging intact
   */
  static cloneGltfModel(gltf: GLTF): ClonedModel {
    // Deep clone the scene
    const clonedScene = gltf.scene.clone();

    // Collect all materials
    const materials: THREE.Material[] = [];
    const originalTextures = new Map<string, THREE.Texture>();
    const materialMap = new Map<THREE.Material, THREE.Material>();

    // Traverse and clone materials
    gltf.scene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];

        for (const mat of mats) {
          if (!materialMap.has(mat)) {
            const clonedMat = this.cloneMaterial(mat);
            materialMap.set(mat, clonedMat);
            materials.push(clonedMat);

            // Store original texture for reference
            if ('map' in mat && mat.map) {
              const mapName = `material_${materials.length}_map`;
              originalTextures.set(mapName, mat.map);
            }
          }
        }
      }
    });

    // Apply cloned materials to cloned scene
    clonedScene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material) {
        const mats = Array.isArray(node.material) ? node.material : [node.material];

        for (let i = 0; i < mats.length; i++) {
          const clonedMat = materialMap.get(mats[i]);
          if (clonedMat) {
            if (Array.isArray(node.material)) {
              node.material[i] = clonedMat;
            } else {
              node.material = clonedMat;
            }
          }
        }
      }
    });

    // Extract skeleton info
    let skeleton: THREE.Skeleton | null = null;
    let boneCount = 0;

    clonedScene.traverse((node) => {
      if (node instanceof THREE.SkinnedMesh && node.skeleton) {
        skeleton = node.skeleton;
        boneCount = node.skeleton.bones.length;
      }
      if (node instanceof THREE.Bone) {
        boneCount++;
      }
    });

    // Count meshes
    let meshCount = 0;
    clonedScene.traverse((node) => {
      if (node instanceof THREE.Mesh) meshCount++;
    });

    // Detect texture atlas name
    let textureAtlas: string | null = null;
    clonedScene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.material && 'map' in node.material) {
        const map = (node.material as any).map;
        if (map?.source?.data?.currentSrc) {
          textureAtlas = map.source.data.currentSrc;
        }
      }
    });

    return {
      scene: clonedScene as THREE.Group,
      materials,
      originalTextures,
      skeleton,
      metadata: {
        textureAtlas,
        boneCount,
        meshCount,
      },
    };
  }

  /**
   * Deep clone a material with all properties
   */
  private static cloneMaterial(material: THREE.Material): THREE.Material {
    let cloned: THREE.Material;

    if (material instanceof THREE.MeshStandardMaterial) {
      cloned = new THREE.MeshStandardMaterial();
      this.copyStandardMaterialProperties(material, cloned);
    } else if (material instanceof THREE.MeshPhongMaterial) {
      cloned = new THREE.MeshPhongMaterial();
      this.copyPhongMaterialProperties(material, cloned);
    } else if (material instanceof THREE.MeshLambertMaterial) {
      cloned = new THREE.MeshLambertMaterial();
      this.copyLambertMaterialProperties(material, cloned);
    } else if (material instanceof THREE.MeshBasicMaterial) {
      cloned = new THREE.MeshBasicMaterial();
      this.copyBasicMaterialProperties(material, cloned);
    } else {
      // Fallback to basic clone
      cloned = material.clone();
    }

    return cloned;
  }

  /**
   * Copy properties from standard material
   */
  private static copyStandardMaterialProperties(
    from: THREE.MeshStandardMaterial,
    to: THREE.MeshStandardMaterial
  ): void {
    to.color.copy(from.color);
    to.map = from.map;
    to.metalness = from.metalness;
    to.roughness = from.roughness;
    to.normalMap = from.normalMap;
    to.aoMap = from.aoMap;
    to.transparent = from.transparent;
    to.opacity = from.opacity;
    to.side = from.side;
    to.alphaMap = from.alphaMap;
  }

  /**
   * Copy properties from phong material
   */
  private static copyPhongMaterialProperties(
    from: THREE.MeshPhongMaterial,
    to: THREE.MeshPhongMaterial
  ): void {
    to.color.copy(from.color);
    to.map = from.map;
    to.specular.copy(from.specular);
    to.shininess = from.shininess;
    to.normalMap = from.normalMap;
    to.transparent = from.transparent;
    to.opacity = from.opacity;
    to.side = from.side;
  }

  /**
   * Copy properties from lambert material
   */
  private static copyLambertMaterialProperties(
    from: THREE.MeshLambertMaterial,
    to: THREE.MeshLambertMaterial
  ): void {
    to.color.copy(from.color);
    to.map = from.map;
    to.transparent = from.transparent;
    to.opacity = from.opacity;
    to.side = from.side;
  }

  /**
   * Copy properties from basic material
   */
  private static copyBasicMaterialProperties(
    from: THREE.MeshBasicMaterial,
    to: THREE.MeshBasicMaterial
  ): void {
    to.color.copy(from.color);
    to.map = from.map;
    to.transparent = from.transparent;
    to.opacity = from.opacity;
    to.side = from.side;
  }

  /**
   * Clone a texture
   */
  static cloneTexture(texture: THREE.Texture): THREE.Texture {
    const cloned = texture.clone();
    cloned.needsUpdate = true;
    return cloned;
  }

  /**
   * Check if model has all required bones for animations
   */
  static validateBoneStructure(
    scene: THREE.Object3D,
    requiredBones: string[] = ['Hips', 'Spine', 'LeftArm', 'RightArm']
  ): { valid: boolean; missingBones: string[] } {
    const foundBones = new Set<string>();

    scene.traverse((node) => {
      if (node instanceof THREE.Bone) {
        foundBones.add(node.name);
      }
    });

    const missingBones = requiredBones.filter((bone) => !foundBones.has(bone));

    return {
      valid: missingBones.length === 0,
      missingBones,
    };
  }

  /**
   * Get all animations from a GLTF model
   */
  static getAnimations(gltf: GLTF): Array<{ name: string; duration: number }> {
    if (!gltf.animations || gltf.animations.length === 0) {
      return [];
    }

    return gltf.animations.map((clip) => ({
      name: clip.name,
      duration: clip.duration,
    }));
  }

  /**
   * Dispose all resources in a cloned model
   */
  static disposeClonedModel(cloned: ClonedModel): void {
    // Dispose materials
    for (const material of cloned.materials) {
      material.dispose();
    }

    // Dispose textures
    for (const texture of cloned.originalTextures.values()) {
      texture.dispose();
    }

    // Dispose geometries
    cloned.scene.traverse((node) => {
      if (node instanceof THREE.Mesh && node.geometry) {
        node.geometry.dispose();
      }
    });
  }
}
