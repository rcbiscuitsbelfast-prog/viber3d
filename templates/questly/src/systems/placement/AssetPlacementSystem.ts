/**
 * AssetPlacementSystem - Handles click-to-place, drag-to-move, and entity manipulation
 * Phase 4.3 - Asset Placement System
 */

import * as THREE from 'three';
import type { Raycaster, Camera, Object3D } from 'three';

export interface PlacementResult {
  position: THREE.Vector3;
  normal: THREE.Vector3;
  hit: boolean;
}

export interface EntityTransform {
  position: THREE.Vector3;
  rotation: number;
  scale: number;
}

export class AssetPlacementSystem {
  private raycaster: Raycaster;
  private mouse: THREE.Vector2;
  private selectedEntity: Object3D | null = null;
  private isDragging: boolean = false;
  private dragStartPosition: THREE.Vector3 = new THREE.Vector3();
  private snapToGrid: boolean = false;
  private gridSize: number = 1.0;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
  }

  /**
   * Set mouse position for raycasting
   */
  setMousePosition(x: number, y: number, width: number, height: number): void {
    this.mouse.x = (x / width) * 2 - 1;
    this.mouse.y = -(y / height) * 2 + 1;
  }

  /**
   * Raycast against terrain mesh
   */
  raycastTerrain(
    camera: Camera,
    terrainMesh: THREE.Mesh | null,
    objects: Object3D[] = []
  ): PlacementResult | null {
    if (!terrainMesh) return null;

    this.raycaster.setFromCamera(this.mouse, camera);
    
    // Raycast against terrain and other objects
    const intersects = this.raycaster.intersectObjects([terrainMesh, ...objects], false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const position = hit.point.clone();
      const normal = hit.face?.normal.clone() || new THREE.Vector3(0, 1, 0);

      // Apply snap to grid if enabled
      if (this.snapToGrid) {
        position.x = Math.round(position.x / this.gridSize) * this.gridSize;
        position.z = Math.round(position.z / this.gridSize) * this.gridSize;
      }

      return {
        position,
        normal,
        hit: true,
      };
    }

    return null;
  }

  /**
   * Start dragging an entity
   */
  startDrag(entity: Object3D, startPosition: THREE.Vector3): void {
    this.selectedEntity = entity;
    this.isDragging = true;
    this.dragStartPosition.copy(startPosition);
  }

  /**
   * Update drag position
   */
  updateDrag(newPosition: THREE.Vector3): void {
    if (!this.selectedEntity || !this.isDragging) return;

    const delta = newPosition.clone().sub(this.dragStartPosition);
    this.selectedEntity.position.add(delta);
    this.dragStartPosition.copy(newPosition);
  }

  /**
   * End dragging
   */
  endDrag(): void {
    this.isDragging = false;
    // Keep selectedEntity for property editing
  }

  /**
   * Select an entity
   */
  selectEntity(entity: Object3D | null): void {
    this.selectedEntity = entity;
  }

  /**
   * Get selected entity
   */
  getSelectedEntity(): Object3D | null {
    return this.selectedEntity;
  }

  /**
   * Rotate entity (mouse wheel)
   */
  rotateEntity(delta: number): void {
    if (!this.selectedEntity) return;
    
    const rotationSpeed = 0.1;
    this.selectedEntity.rotation.y += delta * rotationSpeed;
  }

  /**
   * Scale entity
   */
  scaleEntity(factor: number): void {
    if (!this.selectedEntity) return;
    
    const currentScale = this.selectedEntity.scale.x;
    const newScale = Math.max(0.1, Math.min(3.0, currentScale * factor));
    this.selectedEntity.scale.setScalar(newScale);
  }

  /**
   * Set entity transform
   */
  setEntityTransform(entity: Object3D, transform: Partial<EntityTransform>): void {
    if (transform.position) {
      entity.position.copy(transform.position);
    }
    if (transform.rotation !== undefined) {
      entity.rotation.y = transform.rotation;
    }
    if (transform.scale !== undefined) {
      entity.scale.setScalar(transform.scale);
    }
  }

  /**
   * Get entity transform
   */
  getEntityTransform(entity: Object3D): EntityTransform {
    return {
      position: entity.position.clone(),
      rotation: entity.rotation.y,
      scale: entity.scale.x,
    };
  }

  /**
   * Enable/disable snap to grid
   */
  setSnapToGrid(enabled: boolean, gridSize: number = 1.0): void {
    this.snapToGrid = enabled;
    this.gridSize = gridSize;
  }

  /**
   * Check if snap to grid is enabled
   */
  isSnapToGridEnabled(): boolean {
    return this.snapToGrid;
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectedEntity = null;
    this.isDragging = false;
  }
}
