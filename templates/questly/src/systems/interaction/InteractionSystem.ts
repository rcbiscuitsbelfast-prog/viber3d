/**
 * InteractionSystem - Handles player interactions (press E to interact)
 * Phase 5.2 - Character Controller Enhancements
 */

import * as THREE from 'three';

export type InteractionType = 'npc' | 'object' | 'item' | 'door' | 'lever' | 'chest';

export interface Interactable {
  id: string;
  type: InteractionType;
  position: THREE.Vector3;
  range: number;
  onInteract: (player: THREE.Object3D) => void | Promise<void>;
  canInteract?: (player: THREE.Object3D) => boolean;
  label?: string;
  icon?: string;
}

export class InteractionSystem {
  private interactables: Map<string, Interactable> = new Map();
  private playerPosition: THREE.Vector3 = new THREE.Vector3();
  private interactionRange: number = 3.0;

  /**
   * Register an interactable object
   */
  register(interactable: Interactable): void {
    this.interactables.set(interactable.id, interactable);
  }

  /**
   * Unregister an interactable object
   */
  unregister(id: string): void {
    this.interactables.delete(id);
  }

  /**
   * Update player position
   */
  updatePlayerPosition(position: THREE.Vector3): void {
    this.playerPosition.copy(position);
  }

  /**
   * Get nearest interactable
   */
  getNearestInteractable(): Interactable | null {
    let nearest: Interactable | null = null;
    let nearestDistance = Infinity;

    this.interactables.forEach((interactable) => {
      const distance = this.playerPosition.distanceTo(interactable.position);
      const range = interactable.range || this.interactionRange;

      if (distance <= range && distance < nearestDistance) {
        // Check if interaction is allowed
        if (!interactable.canInteract || interactable.canInteract({ position: this.playerPosition } as any)) {
          nearest = interactable;
          nearestDistance = distance;
        }
      }
    });

    return nearest;
  }

  /**
   * Try to interact with nearest object
   */
  async interact(): Promise<boolean> {
    const nearest = this.getNearestInteractable();
    if (!nearest) {
      return false;
    }

    try {
      await nearest.onInteract({ position: this.playerPosition } as any);
      return true;
    } catch (error) {
      console.error('[InteractionSystem] Interaction failed:', error);
      return false;
    }
  }

  /**
   * Get all interactables in range
   */
  getInteractablesInRange(): Interactable[] {
    const inRange: Interactable[] = [];

    this.interactables.forEach((interactable) => {
      const distance = this.playerPosition.distanceTo(interactable.position);
      const range = interactable.range || this.interactionRange;

      if (distance <= range) {
        if (!interactable.canInteract || interactable.canInteract({ position: this.playerPosition } as any)) {
          inRange.push(interactable);
        }
      }
    });

    return inRange.sort((a, b) => {
      const distA = this.playerPosition.distanceTo(a.position);
      const distB = this.playerPosition.distanceTo(b.position);
      return distA - distB;
    });
  }

  /**
   * Set interaction range
   */
  setInteractionRange(range: number): void {
    this.interactionRange = range;
  }

  /**
   * Clear all interactables
   */
  clear(): void {
    this.interactables.clear();
  }
}
