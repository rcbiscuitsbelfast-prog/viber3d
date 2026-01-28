/**
 * CharacterController - Enhanced character controller with physics, sprint, crouch, jump
 * Phase 5.2 - Character Controller Enhancements
 */

import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { CharacterStats } from './CharacterStats';

export interface CharacterControllerConfig {
  stats: CharacterStats;
  physicsWorld?: CANNON.World;
  enablePhysics?: boolean;
}

export class CharacterController {
  private stats: CharacterStats;
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private isOnGround: boolean = false;
  private isSprinting: boolean = false;
  private isCrouching: boolean = false;
  private canJump: boolean = true;
  private physicsBody: CANNON.Body | null = null;
  private physicsWorld: CANNON.World | null = null;

  constructor(config: CharacterControllerConfig) {
    this.stats = config.stats;
    this.physicsWorld = config.physicsWorld || null;

    if (config.enablePhysics && this.physicsWorld) {
      this.initPhysics();
    }
  }

  /**
   * Initialize physics body
   */
  private initPhysics(): void {
    if (!this.physicsWorld) return;

    const shape = new CANNON.Capsule(0.5, 1.5);
    this.physicsBody = new CANNON.Body({
      mass: this.stats.mass,
      material: new CANNON.Material({ friction: this.stats.friction }),
    });
    this.physicsBody.addShape(shape);
    this.physicsWorld.addBody(this.physicsBody);
  }

  /**
   * Update character movement
   */
  update(
    delta: number,
    input: {
      forward: boolean;
      backward: boolean;
      left: boolean;
      right: boolean;
      jump: boolean;
      sprint: boolean;
      crouch: boolean;
    },
    cameraDirection: THREE.Vector3
  ): { velocity: THREE.Vector3; position: THREE.Vector3; rotation: number } {
    // Determine movement speed based on state
    let speed = this.stats.walkSpeed;
    if (this.isSprinting && input.sprint) {
      speed = this.stats.sprintSpeed;
    } else if (this.isCrouching && input.crouch) {
      speed = this.stats.crouchSpeed;
    } else {
      speed = this.stats.runSpeed;
    }

    // Calculate movement direction
    this.direction.set(0, 0, 0);
    if (input.forward) this.direction.z -= 1;
    if (input.backward) this.direction.z += 1;
    if (input.left) this.direction.x -= 1;
    if (input.right) this.direction.x += 1;

    // Normalize direction
    if (this.direction.length() > 0) {
      this.direction.normalize();
    }

    // Apply camera rotation to movement direction
    const cameraForward = new THREE.Vector3();
    cameraForward.setFromMatrixColumn(cameraDirection as any, 0);
    cameraForward.y = 0;
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3();
    cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));

    const moveDirection = new THREE.Vector3();
    moveDirection.addScaledVector(cameraForward, -this.direction.z);
    moveDirection.addScaledVector(cameraRight, this.direction.x);
    moveDirection.normalize();

    // Apply movement
    this.velocity.x = moveDirection.x * speed;
    this.velocity.z = moveDirection.z * speed;

    // Handle jumping
    if (input.jump && this.isOnGround && this.canJump) {
      this.velocity.y = this.stats.jumpHeight;
      this.isOnGround = false;
      this.canJump = false;
    }

    // Apply gravity
    if (!this.isOnGround) {
      this.velocity.y -= 9.81 * delta; // Gravity
    }

    // Update physics body if enabled
    if (this.physicsBody) {
      this.physicsBody.velocity.set(this.velocity.x, this.velocity.y, this.velocity.z);
      const position = this.physicsBody.position;
      return {
        velocity: this.velocity.clone(),
        position: new THREE.Vector3(position.x, position.y, position.z),
        rotation: Math.atan2(moveDirection.x, moveDirection.z),
      };
    }

    // Return movement data
    return {
      velocity: this.velocity.clone(),
      position: new THREE.Vector3(0, 0, 0), // Will be updated by caller
      rotation: Math.atan2(moveDirection.x, moveDirection.z),
    };
  }

  /**
   * Set on ground state
   */
  setOnGround(isOnGround: boolean): void {
    this.isOnGround = isOnGround;
    if (isOnGround) {
      this.canJump = true;
      this.velocity.y = 0;
    }
  }

  /**
   * Set sprint state
   */
  setSprinting(isSprinting: boolean): void {
    this.isSprinting = isSprinting;
  }

  /**
   * Set crouch state
   */
  setCrouching(isCrouching: boolean): void {
    this.isCrouching = isCrouching;
  }

  /**
   * Get current speed
   */
  getCurrentSpeed(): number {
    if (this.isSprinting) return this.stats.sprintSpeed;
    if (this.isCrouching) return this.stats.crouchSpeed;
    return this.stats.runSpeed;
  }

  /**
   * Cleanup physics body
   */
  dispose(): void {
    if (this.physicsBody && this.physicsWorld) {
      this.physicsWorld.removeBody(this.physicsBody);
      this.physicsBody = null;
    }
  }
}
