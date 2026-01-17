import * as THREE from 'three';

/**
 * CameraOcclusionManager - Handles hiding/fading objects that block camera view
 * Uses raycasting to detect occluding objects between camera and player
 */
export class CameraOcclusionManager {
  private static instance: CameraOcclusionManager;
  private occludableObjects: Map<string, {
    mesh: THREE.Object3D;
    originalOpacity: number;
    currentOpacity: number;
    isOccluded: boolean;
    fadeSpeed: number;
  }> = new Map();
  private raycaster: THREE.Raycaster;
  private tempDirection: THREE.Vector3;

  private constructor() {
    this.raycaster = new THREE.Raycaster();
    this.tempDirection = new THREE.Vector3();
  }

  static getInstance(): CameraOcclusionManager {
    if (!CameraOcclusionManager.instance) {
      CameraOcclusionManager.instance = new CameraOcclusionManager();
    }
    return CameraOcclusionManager.instance;
  }

  /**
   * Register an object as potentially occluding
   */
  registerObject(id: string, mesh: THREE.Object3D, initialOpacity: number = 1): void {
    // Find the mesh material to get opacity
    let originalOpacity = initialOpacity;
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.Material;
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
          originalOpacity = mat.opacity ?? 1;
        }
      }
    });

    this.occludableObjects.set(id, {
      mesh,
      originalOpacity,
      currentOpacity: originalOpacity,
      isOccluded: false,
      fadeSpeed: 5, // Speed of opacity transition
    });
  }

  /**
   * Unregister an occludable object
   */
  unregisterObject(id: string): void {
    const obj = this.occludableObjects.get(id);
    if (obj) {
      // Restore original opacity
      this.restoreOpacity(obj.mesh);
      this.occludableObjects.delete(id);
    }
  }

  /**
   * Check for occlusion between camera and player, update object visibility
   * @param camera - The camera position
   * @param playerPosition - The target position (usually player)
   * @param scene - The scene containing all objects (used for additional validation)
   */
  updateOcclusion(camera: THREE.Vector3, playerPosition: THREE.Vector3, _scene: THREE.Scene): void {
    // Calculate direction from camera to player
    this.tempDirection.subVectors(playerPosition, camera).normalize();
    
    // Set raycaster from camera towards player
    this.raycaster.set(camera, this.tempDirection);
    
    // Get all occludable meshes
    const occludableMeshes: THREE.Object3D[] = [];
    this.occludableObjects.forEach((obj) => {
      occludableMeshes.push(obj.mesh);
    });

    // Check for intersections
    const intersects = this.raycaster.intersectObjects(occludableMeshes, true);

    // Calculate distance to player
    const distanceToPlayer = camera.distanceTo(playerPosition);

    // Mark all objects as not occluded first
    this.occludableObjects.forEach((obj) => {
      obj.isOccluded = false;
    });

    // Check which objects are actually between camera and player
    for (const intersect of intersects) {
      if (!intersect.object.visible) continue;
      
      // Find which registered object this mesh belongs to
      let currentObject: THREE.Object3D | null = intersect.object;
      while (currentObject) {
        for (const [_id, obj] of this.occludableObjects.entries()) {
          if (obj.mesh === currentObject || obj.mesh === intersect.object) {
            // Only occlude if object is closer than player
            if (intersect.distance < distanceToPlayer) {
              obj.isOccluded = true;
            }
            break;
          }
        }
        currentObject = currentObject.parent;
      }
    }

    // Smoothly update opacity based on occlusion state
    const delta = 1 / 60; // Assume ~60fps for smooth updates
    this.occludableObjects.forEach((obj) => {
      const targetOpacity = obj.isOccluded ? 0.2 : obj.originalOpacity;
      
      // Smooth lerp to target opacity
      obj.currentOpacity += (targetOpacity - obj.currentOpacity) * obj.fadeSpeed * delta;
      
      // Clamp opacity
      obj.currentOpacity = Math.max(0.05, Math.min(obj.originalOpacity, obj.currentOpacity));
      
      // Apply opacity to all materials
      obj.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.Material;
          if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
            mat.opacity = obj.currentOpacity;
            mat.transparent = obj.currentOpacity < obj.originalOpacity;
            mat.needsUpdate = true;
          }
        }
      });
    });
  }

  /**
   * Restore original opacity for an object
   */
  private restoreOpacity(mesh: THREE.Object3D): void {
    mesh.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material) {
        const mat = child.material as THREE.Material;
        if (mat instanceof THREE.MeshStandardMaterial || mat instanceof THREE.MeshBasicMaterial) {
          mat.opacity = 1;
          mat.transparent = false;
          mat.needsUpdate = true;
        }
      }
    });
  }

  /**
   * Clear all registered objects
   */
  clear(): void {
    this.occludableObjects.forEach((obj) => {
      this.restoreOpacity(obj.mesh);
    });
    this.occludableObjects.clear();
  }

  /**
   * Get count of registered objects
   */
  getCount(): number {
    return this.occludableObjects.size;
  }
}

// Export singleton instance
export const cameraOcclusionManager = CameraOcclusionManager.getInstance();
