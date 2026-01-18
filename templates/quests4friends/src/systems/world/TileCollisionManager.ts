import { Vector3, Box3, Sphere } from 'three';
import { ColliderConfig } from '../../types/tile.types';

/**
 * CollisionResult - Result of a collision check
 */
export interface CollisionResult {
  hasCollision: boolean;
  collisionPoint?: Vector3;
  normal?: Vector3;
  distance: number;
}

/**
 * PlayerBounds - Simplified player collision representation
 */
export interface PlayerBounds {
  position: Vector3;
  radius: number; // For sphere collision
  height: number; // For capsule collision
}

/**
 * TileCollisionManager - Handles collision detection between player and tile colliders
 * Provides efficient collision queries for active tiles only
 */
export class TileCollisionManager {
  private activeColliders: ColliderConfig[] = [];
  private debug: boolean = false;

  constructor(debug: boolean = false) {
    this.debug = debug;
  }

  /**
   * Update active colliders from world tiles
   * @param colliders Array of colliders from currently active tiles
   */
  updateActiveColliders(colliders: ColliderConfig[]) {
    this.activeColliders = colliders;
    
    if (this.debug) {
      console.log(`[TileCollisionManager] Updated ${colliders.length} active colliders`);
    }
  }

  /**
   * Check if a sphere (player) collides with any tile colliders
   * @param position Player position to check
   * @param radius Player collision radius
   * @returns CollisionResult with collision info
   */
  checkCollision(position: Vector3, radius: number): CollisionResult {
    const playerSphere = new Sphere(position.clone(), radius);
    let closestCollision: CollisionResult | null = null;
    let minDistance = Infinity;

    // Check against all active colliders
    for (const collider of this.activeColliders) {
      if (collider.isTrigger) continue; // Skip trigger colliders
      
      const collision = this.checkColliderCollision(playerSphere, collider);
      
      if (collision.hasCollision && collision.distance < minDistance) {
        minDistance = collision.distance;
        closestCollision = collision;
      }
    }

    return closestCollision || {
      hasCollision: false,
      distance: minDistance
    };
  }

  /**
   * Check collision between player sphere and a single collider
   */
  private checkColliderCollision(playerSphere: Sphere, collider: ColliderConfig): CollisionResult {
    if (collider.type === 'box') {
      return this.checkBoxCollision(playerSphere, collider);
    } else if (collider.type === 'sphere') {
      return this.checkSphereCollision(playerSphere, collider);
    }

    return { hasCollision: false, distance: Infinity };
  }

  /**
   * Check collision between sphere and box collider
   */
  private checkBoxCollision(playerSphere: Sphere, collider: ColliderConfig): CollisionResult {
    // Create box from collider
    const halfSize = collider.size.clone().multiplyScalar(0.5);
    const boxMin = collider.offset.clone().sub(halfSize);
    const boxMax = collider.offset.clone().add(halfSize);
    
    const box = new Box3(boxMin, boxMax);
    
    // Sphere vs AABB collision
    const closestPoint = this.closestPointOnBox(playerSphere.center, box);
    const distance = playerSphere.center.distanceTo(closestPoint);
    
    if (distance < playerSphere.radius) {
      return {
        hasCollision: true,
        collisionPoint: closestPoint,
        normal: this.getCollisionNormal(playerSphere.center, closestPoint),
        distance: playerSphere.radius - distance
      };
    }

    return {
      hasCollision: false,
      distance: distance - playerSphere.radius
    };
  }

  /**
   * Check collision between two spheres
   */
  private checkSphereCollision(playerSphere: Sphere, collider: ColliderConfig): CollisionResult {
    const colliderSphere = new Sphere(
      collider.offset.clone(),
      collider.size.x // Radius for sphere collider
    );
    
    const distance = playerSphere.center.distanceTo(colliderSphere.center);
    const minDistance = playerSphere.radius + colliderSphere.radius;
    
    if (distance < minDistance) {
      return {
        hasCollision: true,
        collisionPoint: colliderSphere.center.clone().lerp(playerSphere.center, colliderSphere.radius / distance),
        normal: playerSphere.center.clone().sub(colliderSphere.center).normalize(),
        distance: minDistance - distance
      };
    }

    return {
      hasCollision: false,
      distance: distance - minDistance
    };
  }

  /**
   * Find closest point on box to a point
   */
  private closestPointOnBox(point: Vector3, box: Box3): Vector3 {
    const result = point.clone();
    
    result.x = Math.max(box.min.x, Math.min(point.x, box.max.x));
    result.y = Math.max(box.min.y, Math.min(point.y, box.max.y));
    result.z = Math.max(box.min.z, Math.min(point.z, box.max.z));
    
    return result;
  }

  /**
   * Calculate collision normal from collision point
   */
  private getCollisionNormal(playerPos: Vector3, collisionPoint: Vector3): Vector3 {
    return collisionPoint.clone().sub(playerPos).normalize();
  }

  /**
   * Check if a position is clear (no collision) - convenience method
   */
  isPositionClear(position: Vector3, radius: number): boolean {
    return !this.checkCollision(position, radius).hasCollision;
  }

  /**
   * Find valid position near target position by sliding along surface
   * @param targetPos Desired position
   * @param currentPos Current player position
   * @param radius Player radius
   * @param maxIterations Max adjustment attempts
   * @returns Validated position
   */
  findValidPosition(
    targetPos: Vector3, 
    currentPos: Vector3, 
    radius: number, 
    maxIterations: number = 5
  ): Vector3 {
    let testPos = targetPos.clone();
    let iterations = 0;

    while (iterations < maxIterations) {
      const collision = this.checkCollision(testPos, radius);
      
      if (!collision.hasCollision || !collision.normal) {
        return testPos; // Position is clear
      }

      // Slide along collision surface
      const slideVector = collision.normal.clone().multiplyScalar(collision.distance);
      testPos.add(slideVector);
      
      iterations++;
    }

    // If we can't find valid position, return current position
    if (this.debug) {
      console.warn('[TileCollisionManager] Could not find valid position after', maxIterations, 'iterations');
    }
    return currentPos;
  }

  /**
   * Cast a ray against tile colliders
   * @param origin Ray origin
   * @param direction Ray direction
   * @param maxDistance Maximum ray distance
   * @returns Collision result if hit
   */
  raycast(origin: Vector3, direction: Vector3, maxDistance: number = 100): CollisionResult | null {
    let closestHit: CollisionResult | null = null;
    let closestDistance = Infinity;

    for (const collider of this.activeColliders) {
      if (collider.isTrigger) continue;
      
      let hit: CollisionResult | null = null;
      
      if (collider.type === 'box') {
        hit = this.raycastBox(origin, direction, collider, maxDistance);
      } else if (collider.type === 'sphere') {
        hit = this.raycastSphere(origin, direction, collider, maxDistance);
      }
      
      if (hit && hit.distance < closestDistance) {
        closestDistance = hit.distance;
        closestHit = hit;
      }
    }

    return closestHit;
  }

  /**
   * Raycast against box collider
   */
  private raycastBox(origin: Vector3, direction: Vector3, collider: ColliderConfig, maxDistance: number): CollisionResult | null {
    // Simple AABB raycast implementation
    // In production, use a proper physics library like Rapier or Cannon.js
    
    const halfSize = collider.size.clone().multiplyScalar(0.5);
    const boxMin = collider.offset.clone().sub(halfSize);
    const boxMax = collider.offset.clone().add(halfSize);

    // Slab method for AABB intersection
    const invDir = new Vector3(1 / direction.x, 1 / direction.y, 1 / direction.z);
    
    const t1 = (boxMin.x - origin.x) * invDir.x;
    const t2 = (boxMax.x - origin.x) * invDir.x;
    const t3 = (boxMin.y - origin.y) * invDir.y;
    const t4 = (boxMax.y - origin.y) * invDir.y;
    const t5 = (boxMin.z - origin.z) * invDir.z;
    const t6 = (boxMax.z - origin.z) * invDir.z;

    const tMin = Math.max(Math.max(Math.min(t1, t2), Math.min(t3, t4)), Math.min(t5, t6));
    const tMax = Math.min(Math.min(Math.max(t1, t2), Math.max(t3, t4)), Math.max(t5, t6));

    if (tMax < 0 || tMin > tMax || tMin > maxDistance) {
      return null;
    }

    const hitDistance = tMin > 0 ? tMin : tMax; // Use closer of the two intersection points
    
    return {
      hasCollision: true,
      collisionPoint: origin.clone().add(direction.clone().multiplyScalar(hitDistance)),
      normal: this.calculateBoxNormal(origin.clone().add(direction.clone().multiplyScalar(hitDistance)), collider),
      distance: hitDistance
    };
  }

  /**
   * Raycast against sphere collider
   */
  private raycastSphere(origin: Vector3, direction: Vector3, collider: ColliderConfig, maxDistance: number): CollisionResult | null {
    const sphereCenter = collider.offset.clone();
    const sphereRadius = collider.size.x;
    
    const oc = origin.clone().sub(sphereCenter);
    const a = direction.dot(direction);
    const b = 2 * oc.dot(direction);
    const c = oc.dot(oc) - sphereRadius * sphereRadius;
    
    const discriminant = b * b - 4 * a * c;
    
    if (discriminant < 0) {
      return null;
    }
    
    const sqrtDiscriminant = Math.sqrt(discriminant);
    const t1 = (-b - sqrtDiscriminant) / (2 * a);
    const t2 = (-b + sqrtDiscriminant) / (2 * a);
    
    let hitDistance: number;
    
    if (t1 > 0 && t1 <= maxDistance) {
      hitDistance = t1;
    } else if (t2 > 0 && t2 <= maxDistance) {
      hitDistance = t2;
    } else {
      return null;
    }
    
    const hitPoint = origin.clone().add(direction.clone().multiplyScalar(hitDistance));
    
    return {
      hasCollision: true,
      collisionPoint: hitPoint,
      normal: hitPoint.clone().sub(sphereCenter).normalize(),
      distance: hitDistance
    };
  }

  /**
   * Calculate box normal at hit point
   */
  private calculateBoxNormal(point: Vector3, collider: ColliderConfig): Vector3 {
    const halfSize = collider.size.clone().multiplyScalar(0.5);
    const localPoint = point.clone().sub(collider.offset);
    
    // Determine which face was hit
    const absX = Math.abs(localPoint.x);
    const absY = Math.abs(localPoint.y);
    const absZ = Math.abs(localPoint.z);
    
    if (absX > absY && absX > absZ) {
      return new Vector3(Math.sign(localPoint.x), 0, 0);
    } else if (absY > absZ) {
      return new Vector3(0, Math.sign(localPoint.y), 0);
    } else {
      return new Vector3(0, 0, Math.sign(localPoint.z));
    }
  }

  /**
   * Get statistics for debugging
   */
  getStats() {
    return {
      activeColliders: this.activeColliders.length,
      enabled: this.activeColliders.length > 0
    };
  }

  /**
   * Enable or disable debug logging
   */
  setDebug(enabled: boolean) {
    this.debug = enabled;
  }

  /**
   * Clear current colliders (called when tiles unload)
   */
  clearColliders() {
    this.activeColliders = [];
  }
}