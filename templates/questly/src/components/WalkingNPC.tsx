// Walking NPC Component with Pathfinding and Combat
// NPCs that walk along waypoints and can engage in turn-based combat

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Sparkles } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { cloneGltf } from '../utils/cloneGltf';
import { getAssetPath } from '../utils/assetPath';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { QuestLabel } from './QuestLabel';

// Combat state types
type CombatState = 'approaching' | 'engaging' | 'attacking' | 'blocking' | 'waiting';

// Global combat coordinator - syncs turn-based combat between fighters
const combatCoordinator = {
  fighters: new Map<string, {
    position: THREE.Vector3;
    state: CombatState;
    isAttacker: boolean;
    lastActionTime: number;
  }>(),
  combatActive: false,
  currentAttacker: '',
  lastSwapTime: 0,
  swapInterval: 1500, // ms between attack/block swaps

  register(id: string, position: THREE.Vector3) {
    this.fighters.set(id, {
      position,
      state: 'approaching',
      isAttacker: id.includes('fighter1'), // fighter1 starts as attacker
      lastActionTime: 0
    });
  },

  unregister(id: string) {
    this.fighters.delete(id);
    if (this.fighters.size < 2) {
      this.combatActive = false;
    }
  },

  updatePosition(id: string, position: THREE.Vector3) {
    const fighter = this.fighters.get(id);
    if (fighter) {
      fighter.position.copy(position);
    }
  },

  checkCombatRange(id: string, combatRange: number, fightingDistance: number): {
    inLineOfSight: boolean;
    atFightingDistance: boolean;
    distance: number;
    targetPosition: THREE.Vector3 | null
  } {
    const fighter = this.fighters.get(id);
    if (!fighter) {
      return { inLineOfSight: false, atFightingDistance: false, distance: Infinity, targetPosition: null };
    }

    // Find opposing fighter
    for (const [otherId, otherFighter] of this.fighters) {
      if (otherId !== id && otherId.includes('fighter')) {
        const distance = fighter.position.distanceTo(otherFighter.position);
        const inLineOfSight = distance < combatRange;
        const atFightingDistance = distance < fightingDistance;

        if (atFightingDistance && !this.combatActive) {
          this.combatActive = true;
          this.lastSwapTime = Date.now();
          console.log(`[Combat] ${id} and ${otherId} ENGAGED! Distance: ${distance.toFixed(2)}`);
        }

        return {
          inLineOfSight,
          atFightingDistance,
          distance,
          targetPosition: otherFighter.position.clone()
        };
      }
    }
    return { inLineOfSight: false, atFightingDistance: false, distance: Infinity, targetPosition: null };
  },

  getCombatRole(id: string): 'attack' | 'block' | null {
    if (!this.combatActive) return null;

    const fighter = this.fighters.get(id);
    if (!fighter) return null;

    // Check if it's time to swap roles
    const now = Date.now();
    if (now - this.lastSwapTime > this.swapInterval) {
      // Swap roles for all fighters
      for (const [fighterId, f] of this.fighters) {
        f.isAttacker = !f.isAttacker;
      }
      this.lastSwapTime = now;
    }

    return fighter.isAttacker ? 'attack' : 'block';
  }
};

interface WalkingNPCProps {
  id: string;
  name: string;
  position: [number, number, number];
  waypoints: [number, number, number][]; // Path to follow
  characterModelPath?: string;
  speed?: number;
  onClick?: () => void;
  terrainMeshRef?: React.RefObject<THREE.Mesh>;
  getTerrainHeight?: (x: number, z: number) => number; // Use shared terrain height function
  isInteracting?: boolean; // Stop and face player when interacting
  playerPosition?: THREE.Vector3; // Player position to face when interacting
  showPath?: boolean; // Show visible walk path
  // Combat props
  isFighter?: boolean; // Is this NPC a fighter that can engage in combat?
  combatRange?: number; // Line of sight detection range (default 8)
  fightingDistance?: number; // Distance to stop and fight (default 2)
  weaponPath?: string; // Path to weapon model
  shieldPath?: string; // Path to shield model
  // Collision callback
  onPositionUpdate?: (id: string, position: THREE.Vector3) => void;
}

export function WalkingNPC({
  id,
  name,
  position,
  waypoints,
  characterModelPath,
  speed = 2,
  onClick,
  terrainMeshRef,
  getTerrainHeight: externalGetTerrainHeight,
  isInteracting = false,
  playerPosition,
  showPath = false,
  isFighter = false,
  combatRange = 8,
  fightingDistance = 2.5,
  weaponPath,
  shieldPath,
  onPositionUpdate,
}: WalkingNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);
  const lastAnimationState = useRef<'idle' | 'walk' | 'attack' | 'block'>('idle');
  const lastHeightUpdate = useRef(0);
  const hasInitializedPosition = useRef(false);

  // Combat state
  const [inCombat, setInCombat] = useState(false);
  const [combatTargetPosition, setCombatTargetPosition] = useState<THREE.Vector3 | null>(null);
  const combatPositionRef = useRef(new THREE.Vector3());
  const lastCombatRole = useRef<'attack' | 'block' | null>(null);

  // Combat VFX state
  const [showSwordTrail, setShowSwordTrail] = useState(false);
  const [showImpactSparks, setShowImpactSparks] = useState(false);
  const impactPosition = useRef(new THREE.Vector3());
  const lastAttackTime = useRef(0);

  // Use external terrain height function if provided, otherwise fallback to raycasting
  const getTerrainHeight = (x: number, z: number): number => {
    if (externalGetTerrainHeight) {
      return externalGetTerrainHeight(x, z);
    }
    
    // Fallback: raycast (but filter out ocean)
    if (!terrainMeshRef?.current) return 2.5;
    
    const raycaster = new THREE.Raycaster();
    raycaster.ray.origin.set(x, 100, z);
    raycaster.ray.direction.set(0, -1, 0);
    
    // Only intersect terrain mesh, not ocean
    const intersects = raycaster.intersectObject(terrainMeshRef.current, false);
    if (intersects.length > 0) {
      const height = intersects[0].point.y;
      // Ensure we're not getting ocean height (water level is ~0.9)
      return height > 1.0 ? height : 2.5;
    }
    
    return 2.5; // Fallback to default height
  };

  // Load NPC model
  useEffect(() => {
    const loadNPC = async () => {
      try {
        const loader = new GLTFLoader();
        const modelPath = getAssetPath(characterModelPath ||
          '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb');
        
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(modelPath, resolve, undefined, reject);
        });

        const clonedGltf = cloneGltf(gltf);
        const npcScene = clonedGltf.scene;
        npcScene.scale.setScalar(1);
        npcScene.position.set(0, 0, 0);
        npcScene.visible = true;

        npcScene.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.visible = true;
          }
        });

        // Store built-in animations as fallback (ensures animations work if external files fail to load)
        if (gltf.animations && gltf.animations.length > 0) {
          npcScene.userData.builtInAnimations = gltf.animations;
          console.log(`[WalkingNPC] Stored ${gltf.animations.length} built-in animations as fallback`);
        }

        setModel(npcScene);
        setModelLoaded(true);
      } catch (err) {
        console.error('[WalkingNPC] Failed to load model:', err);
        setModelLoaded(true);
      }
    };

    loadNPC();
  }, [characterModelPath]);

  // Load and attach weapon when model is ready
  useEffect(() => {
    if (!model || !weaponPath) return;

    const loadWeapon = async () => {
      try {
        const loader = new GLTFLoader();
        const resolvedPath = getAssetPath(weaponPath);

        const weaponGltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(resolvedPath, resolve, undefined, reject);
        });

        const weapon = weaponGltf.scene.clone();
        weapon.userData.isWeapon = true;
        weapon.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Helper to detect if bone is right hand (not left)
        const isRightHandBone = (name: string): boolean => {
          const n = name.toLowerCase();
          if (!n.includes('hand')) return false;
          // Must NOT be left hand
          if (n.includes('left') || n.endsWith('.l') || n.endsWith('_l') || n.startsWith('l_') || n.startsWith('l.')) return false;
          if (/\bl\b/.test(n)) return false; // standalone 'l'
          // Must be right hand
          if (n.includes('right') || n.endsWith('.r') || n.endsWith('_r') || n.startsWith('r_') || n.startsWith('r.')) return true;
          if (/\br\b/.test(n)) return true; // standalone 'r'
          // Check for patterns like "handr" or "rhand"
          if (n.includes('handr') || n.includes('rhand') || n.includes('hand_r') || n.includes('hand.r')) return true;
          return false;
        };

        // Find right hand bone for weapon
        let handBone: THREE.Bone | null = null;
        const boneNames: string[] = [];
        model.traverse((node: THREE.Object3D) => {
          if (node instanceof THREE.Bone) {
            boneNames.push(node.name);
            if (!handBone && isRightHandBone(node.name)) {
              handBone = node;
            }
          }
        });
        console.log(`[WalkingNPC ${id}] Available bones:`, boneNames.join(', '));

        if (handBone) {
          // Default weapon config for fighters
          weapon.scale.setScalar(1);
          weapon.position.set(0, 0, 0);
          weapon.rotation.set(0, 0, 0);
          (handBone as THREE.Object3D).add(weapon);
          console.log(`[WalkingNPC ${id}] Weapon attached to ${(handBone as THREE.Bone).name}`);
        } else {
          console.warn(`[WalkingNPC ${id}] Could not find hand bone for weapon`);
        }
      } catch (err) {
        console.error(`[WalkingNPC ${id}] Failed to load weapon:`, err);
      }
    };

    loadWeapon();
  }, [model, weaponPath, id]);

  // Load and attach shield when model is ready
  useEffect(() => {
    if (!model || !shieldPath) return;

    const loadShield = async () => {
      try {
        const loader = new GLTFLoader();
        const resolvedPath = getAssetPath(shieldPath);

        const shieldGltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(resolvedPath, resolve, undefined, reject);
        });

        const shield = shieldGltf.scene.clone();
        shield.userData.isShield = true;
        shield.traverse((child: THREE.Object3D) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Helper to detect if bone is left hand (not right)
        const isLeftHandBone = (name: string): boolean => {
          const n = name.toLowerCase();
          if (!n.includes('hand')) return false;
          // Must NOT be right hand
          if (n.includes('right') || n.endsWith('.r') || n.endsWith('_r') || n.startsWith('r_') || n.startsWith('r.')) return false;
          if (/\br\b/.test(n)) return false; // standalone 'r'
          // Must be left hand
          if (n.includes('left') || n.endsWith('.l') || n.endsWith('_l') || n.startsWith('l_') || n.startsWith('l.')) return true;
          if (/\bl\b/.test(n)) return true; // standalone 'l'
          // Check for patterns like "handl" or "lhand"
          if (n.includes('handl') || n.includes('lhand') || n.includes('hand_l') || n.includes('hand.l')) return true;
          return false;
        };

        // Find left hand bone for shield
        let handBone: THREE.Bone | null = null;
        model.traverse((node: THREE.Object3D) => {
          if (node instanceof THREE.Bone) {
            if (!handBone && isLeftHandBone(node.name)) {
              handBone = node;
            }
          }
        });

        if (handBone) {
          shield.scale.setScalar(1);
          shield.position.set(0, 0, 0);
          shield.rotation.set(0, 0, 0);
          (handBone as THREE.Object3D).add(shield);
          console.log(`[WalkingNPC ${id}] Shield attached to ${(handBone as THREE.Bone).name}`);
        } else {
          console.warn(`[WalkingNPC ${id}] Could not find left hand bone for shield`);
        }
      } catch (err) {
        console.error(`[WalkingNPC ${id}] Failed to load shield:`, err);
      }
    };

    loadShield();
  }, [model, shieldPath, id]);

  // Character animation - use proper asset ID based on model path
  const getAssetId = () => {
    if (characterModelPath?.includes('Mage')) return 'char_mage';
    if (characterModelPath?.includes('Ranger')) return 'char_ranger';
    if (characterModelPath?.includes('Barbarian')) return 'char_barbarian';
    if (characterModelPath?.includes('Rogue')) return 'char_rogue';
    return 'char_knight'; // Default
  };

  const { crossfadeTo, isLoaded: animationsLoaded } = useCharacterAnimation({
    characterId: `npc-${id}`,
    assetId: getAssetId(),
    model: model,
    defaultAnimation: 'idle',
  });

  // Ensure animations start playing when they become available
  useEffect(() => {
    if (animationsLoaded && crossfadeTo && model) {
      // Force start with idle animation when animations load - don't check state
      try {
        crossfadeTo('idle', 0.2);
        lastAnimationState.current = 'idle'; // Set state to match
      } catch (err) {
        console.warn(`[WalkingNPC ${id}] Failed to initialize idle animation:`, err);
      }
    }
  }, [animationsLoaded, crossfadeTo, model, id]);

  // Initialize position on terrain ONCE - only on first mount
  // After initialization, useFrame handles all position updates for waypoint following
  // ALSO register fighters with combat coordinator after position is set
  useEffect(() => {
    if (groupRef.current && !hasInitializedPosition.current && modelLoaded) {
      // Set initial position at first waypoint (or passed position if no waypoints)
      const startPos = waypoints.length > 0 ? waypoints[0] : position;

      // Try to get terrain height, but initialize anyway even if terrain not ready
      let finalY = startPos[1];
      if (terrainMeshRef?.current || externalGetTerrainHeight) {
        const terrainHeight = getTerrainHeight(startPos[0], startPos[2]);
        finalY = Math.max(startPos[1], terrainHeight + 0.0);
      }

      groupRef.current.position.set(startPos[0], finalY, startPos[2]);
      hasInitializedPosition.current = true;
      console.log(`[WalkingNPC ${id}] Initialized at (${startPos[0]}, ${finalY}, ${startPos[2]})`);

      // Register fighter with combat coordinator AFTER position is set
      if (isFighter) {
        combatCoordinator.register(id, groupRef.current.position);
        console.log(`[WalkingNPC ${id}] Registered as fighter at position (${startPos[0]}, ${finalY}, ${startPos[2]})`);
      }
    }
  }, [terrainMeshRef?.current, externalGetTerrainHeight, modelLoaded, isFighter, id, waypoints, position]);

  // Cleanup fighter registration on unmount
  useEffect(() => {
    return () => {
      if (isFighter) {
        combatCoordinator.unregister(id);
        console.log(`[WalkingNPC ${id}] Unregistered from combat`);
      }
    };
  }, [isFighter, id]);

  // Waypoint following behavior
  useFrame((_state, delta) => {
    if (!groupRef.current || !modelLoaded || waypoints.length === 0) return;

    // Ensure position is set correctly if it wasn't set in useEffect (fallback)
    if (groupRef.current.position.y === 0 && terrainMeshRef?.current) {
      const terrainHeight = getTerrainHeight(groupRef.current.position.x, groupRef.current.position.z);
      groupRef.current.position.y = terrainHeight + 0.0;
    }

    const currentPos = groupRef.current.position;

    // Report position update for collision detection (do this early, before any returns)
    if (onPositionUpdate) {
      onPositionUpdate(id, currentPos);
    }

    // Update combat coordinator position
    if (isFighter) {
      combatPositionRef.current.copy(currentPos);
      combatCoordinator.updatePosition(id, currentPos);

      // Check combat ranges - line of sight (wedge) and fighting distance
      const { inLineOfSight, atFightingDistance, distance, targetPosition } =
        combatCoordinator.checkCombatRange(id, combatRange, fightingDistance);

      // Always update target position for wedge visualization
      if (targetPosition) {
        setCombatTargetPosition(targetPosition);
      }

      if (atFightingDistance && targetPosition) {
        // At fighting distance - stop and fight!
        if (!inCombat) {
          setInCombat(true);
          console.log(`[WalkingNPC ${id}] Now fighting at distance ${distance.toFixed(2)}`);
        }

        // Face opponent
        const directionToTarget = new THREE.Vector3()
          .subVectors(targetPosition, currentPos)
          .normalize();

        const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation,
          0.15
        );

        // Get current combat role
        const combatRole = combatCoordinator.getCombatRole(id);

        // Play attack or block animation based on role
        if (combatRole === 'attack' && lastCombatRole.current !== 'attack') {
          lastCombatRole.current = 'attack';
          lastAnimationState.current = 'attack';
          lastAttackTime.current = Date.now();

          // Show sword trail VFX during attack
          setShowSwordTrail(true);
          setTimeout(() => setShowSwordTrail(false), 600); // Trail duration

          if (animationsLoaded && crossfadeTo) {
            try {
              crossfadeTo('attackMelee', 0.15);
            } catch (err) {
              console.warn(`[WalkingNPC ${id}] Failed to play attack animation:`, err);
            }
          }
        } else if (combatRole === 'block' && lastCombatRole.current !== 'block') {
          lastCombatRole.current = 'block';
          lastAnimationState.current = 'block';

          // Show impact sparks VFX when blocking (delayed to sync with incoming attack)
          impactPosition.current.copy(currentPos);
          impactPosition.current.y += 1.2; // Shield height
          setTimeout(() => {
            setShowImpactSparks(true);
            setTimeout(() => setShowImpactSparks(false), 400); // Sparks duration
          }, 300); // Delay to sync with attack animation hitting

          if (animationsLoaded && crossfadeTo) {
            try {
              crossfadeTo('blockHit', 0.15);
            } catch (err) {
              // Fallback to block if blockHit doesn't exist
              try {
                crossfadeTo('block', 0.15);
              } catch (e) {
                console.warn(`[WalkingNPC ${id}] Failed to play block animation:`, e);
              }
            }
          }
        }

        // Update terrain height while in combat
        const terrainHeight = getTerrainHeight(currentPos.x, currentPos.z);
        const targetY = terrainHeight + 0.0;
        const currentY = groupRef.current.position.y;
        const lerpFactor = Math.min(1.0, delta * 12);
        const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
        groupRef.current.position.y = Math.max(smoothedY, targetY);

        return; // Don't continue with waypoint following - we're fighting!

      } else if (inLineOfSight && targetPosition) {
        // In line of sight but not at fighting distance - APPROACH opponent
        if (inCombat) {
          setInCombat(false);
          lastCombatRole.current = null;
        }

        // Debug: Log approach state periodically
        if (Math.random() < 0.01) {
          console.log(`[Combat ${id}] Approaching target, distance: ${distance.toFixed(2)}, fightingDist: ${fightingDistance}`);
        }

        // Move towards opponent
        const directionToTarget = new THREE.Vector3()
          .subVectors(targetPosition, currentPos)
          .normalize();

        // Face opponent while approaching
        const targetRotation = Math.atan2(directionToTarget.x, directionToTarget.z);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(
          groupRef.current.rotation.y,
          targetRotation,
          0.15
        );

        // Move towards opponent (faster than normal walk)
        const clampedDelta = Math.min(delta, 0.05);
        const approachSpeed = speed * 1.5; // Faster approach
        let newX = currentPos.x + directionToTarget.x * approachSpeed * clampedDelta;
        let newZ = currentPos.z + directionToTarget.z * approachSpeed * clampedDelta;

        // Check collision with player - fighters should also avoid the player
        if (playerPosition) {
          const distToPlayer = Math.sqrt(
            Math.pow(newX - playerPosition.x, 2) + Math.pow(newZ - playerPosition.z, 2)
          );
          const minDistance = 1.0;

          if (distToPlayer < minDistance) {
            // Too close to player - slide around or stop
            const currentDistToPlayer = Math.sqrt(
              Math.pow(currentPos.x - playerPosition.x, 2) + Math.pow(currentPos.z - playerPosition.z, 2)
            );

            if (currentDistToPlayer < minDistance) {
              // Already too close, push away
              const pushDir = new THREE.Vector3(
                currentPos.x - playerPosition.x,
                0,
                currentPos.z - playerPosition.z
              ).normalize();
              newX = currentPos.x + pushDir.x * approachSpeed * clampedDelta * 0.5;
              newZ = currentPos.z + pushDir.z * approachSpeed * clampedDelta * 0.5;
            } else {
              // Would walk into player - don't move closer
              newX = currentPos.x;
              newZ = currentPos.z;
            }
          }
        }

        const terrainHeight = getTerrainHeight(newX, newZ);
        const targetY = terrainHeight + 0.0;
        const currentY = groupRef.current.position.y;
        const lerpFactor = Math.min(1.0, clampedDelta * 12);
        const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
        const finalY = Math.max(smoothedY, targetY);

        groupRef.current.position.set(newX, finalY, newZ);

        // Play walk animation while approaching
        if (lastAnimationState.current !== 'walk') {
          lastAnimationState.current = 'walk';
          if (animationsLoaded && crossfadeTo) {
            try {
              crossfadeTo('walk', 0.2);
            } catch (err) {
              console.warn(`[WalkingNPC ${id}] Failed to play walk animation:`, err);
            }
          }
        }

        return; // Don't continue with normal waypoint following
      } else {
        // Not in line of sight
        if (inCombat) {
          setInCombat(false);
          lastCombatRole.current = null;
        }
      }
    }

    // If interacting, stop and face player
    if (isInteracting && playerPosition) {
      // Stop movement
      isMovingRef.current = false;

      // Face player
      const directionToPlayer = new THREE.Vector3()
        .subVectors(playerPosition, currentPos)
        .normalize();

      const targetRotation = Math.atan2(directionToPlayer.x, directionToPlayer.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.15 // Faster rotation to face player
      );

      // Play idle animation
      if (lastAnimationState.current !== 'idle') {
        lastAnimationState.current = 'idle';
        if (animationsLoaded && crossfadeTo) {
          crossfadeTo('idle', 0.2);
        }
      }

      // Still update terrain height
      const terrainHeight = getTerrainHeight(currentPos.x, currentPos.z);
      const targetY = terrainHeight + 0.0;
      const currentY = groupRef.current.position.y;
      const lerpFactor = Math.min(1.0, delta * 12);
      const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
      const finalY = Math.max(smoothedY, targetY);
      groupRef.current.position.y = finalY;

      return; // Don't continue with waypoint following
    }

    // Normal waypoint following behavior
    const currentWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Check if reached current waypoint (with larger threshold to prevent rapid switching)
    const distanceToWaypoint = currentPos.distanceTo(currentWaypoint);
    
    if (distanceToWaypoint < 2.5) {
      // Move to next waypoint
      // Fighters don't loop - they stop at their last waypoint (waiting for combat)
      if (isFighter) {
        if (currentWaypointIndex.current < waypoints.length - 1) {
          currentWaypointIndex.current = currentWaypointIndex.current + 1;
        }
        // At last waypoint - stay here and wait for opponent
      } else {
        // Non-fighters loop around
        currentWaypointIndex.current = (currentWaypointIndex.current + 1) % waypoints.length;
      }
    }

    const targetWaypoint = new THREE.Vector3(...waypoints[currentWaypointIndex.current]);
    
    // Smooth movement direction with normalized check
    const direction = new THREE.Vector3()
      .subVectors(targetWaypoint, currentPos);
    
    const distance = direction.length();
    
    // Only move if we have a valid direction and distance
    if (distance > 0.01) {
      direction.normalize();

      // Move horizontally with clamped delta to prevent large jumps
      const clampedDelta = Math.min(delta, 0.05); // Cap delta at 50ms to prevent frame spikes
      let newX = currentPos.x + direction.x * speed * clampedDelta;
      let newZ = currentPos.z + direction.z * speed * clampedDelta;

      // Check collision with player - NPCs should not walk through the player
      if (playerPosition) {
        const distToPlayer = Math.sqrt(
          Math.pow(newX - playerPosition.x, 2) + Math.pow(newZ - playerPosition.z, 2)
        );
        const minDistance = 1.0; // Minimum distance to maintain from player

        if (distToPlayer < minDistance) {
          // Too close to player - stop or slide around
          const currentDistToPlayer = Math.sqrt(
            Math.pow(currentPos.x - playerPosition.x, 2) + Math.pow(currentPos.z - playerPosition.z, 2)
          );

          if (currentDistToPlayer < minDistance) {
            // Already too close, push away from player
            const pushDir = new THREE.Vector3(
              currentPos.x - playerPosition.x,
              0,
              currentPos.z - playerPosition.z
            ).normalize();
            newX = currentPos.x + pushDir.x * speed * clampedDelta * 0.5;
            newZ = currentPos.z + pushDir.z * speed * clampedDelta * 0.5;
          } else {
            // Would walk into player - don't move
            newX = currentPos.x;
            newZ = currentPos.z;
          }
        }
      }

      // Get terrain height at new position BEFORE moving (prevents walking into hills)
      const terrainHeight = getTerrainHeight(newX, newZ);

      // Use delta-based lerp for smooth, frame-rate independent interpolation
      const targetY = terrainHeight + 0.0; // Ground level - 0.0 offset
      const currentY = groupRef.current.position.y;
      const lerpFactor = Math.min(1.0, clampedDelta * 12); // Faster lerp for better responsiveness
      const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);

      // Clamp to prevent going under ground - always stay on top
      const finalY = Math.max(smoothedY, targetY);

      // Update position with smoothed terrain height
      groupRef.current.position.set(newX, finalY, newZ);

      // Smooth rotation using lerp
      const targetRotation = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );

      // Update animation state - always check and update animation
      if (lastAnimationState.current !== 'walk') {
        isMovingRef.current = true;
        lastAnimationState.current = 'walk';
        
        // Play walk animation - ensure animations are loaded
        if (animationsLoaded && crossfadeTo && model) {
          try {
            crossfadeTo('walk', 0.2);
          } catch (err) {
            console.warn(`[WalkingNPC ${id}] Failed to play walk animation:`, err);
          }
        }
      }
    } else {
      // Update animation state - always check and update animation
      if (lastAnimationState.current !== 'idle') {
        isMovingRef.current = false;
        lastAnimationState.current = 'idle';
        
        // Play idle animation - ensure animations are loaded
        if (animationsLoaded && crossfadeTo && model) {
          try {
            crossfadeTo('idle', 0.2);
          } catch (err) {
            console.warn(`[WalkingNPC ${id}] Failed to play idle animation:`, err);
          }
        }
      }
    }
    
    // Ensure NPC stays on terrain - use delta-based smoothing
    const terrainHeight = getTerrainHeight(groupRef.current.position.x, groupRef.current.position.z);
    const targetY = terrainHeight + 0.0; // Ground level - 0.0 offset
    const currentY = groupRef.current.position.y;
    
    // Use delta-based lerp for smooth, frame-rate independent interpolation
    const clampedDelta = Math.min(delta, 0.05); // Cap delta at 50ms to prevent frame spikes
    const lerpFactor = Math.min(1.0, clampedDelta * 12); // Faster lerp for better responsiveness
    const smoothedY = THREE.MathUtils.lerp(currentY, targetY, lerpFactor);
    
    // Clamp to prevent going under ground - always stay on top
    const finalY = Math.max(smoothedY, targetY);
    groupRef.current.position.y = finalY;
  });

  // Create path points for visualization (close the loop)
  // NOTE: ALL useMemo hooks MUST be before any early returns to satisfy React's rules of hooks
  const pathPoints = useMemo(() => {
    if (!showPath || waypoints.length < 2) return [];
    const points = waypoints.map(wp => new THREE.Vector3(wp[0], wp[1] + 0.3, wp[2]));
    // Close the loop
    points.push(points[0].clone());
    return points;
  }, [waypoints, showPath]);

  // Line of sight wedge visualization - a cone/wedge on the ground in front of NPC
  // MUST be before early return
  const lineOfSightWedge = useMemo(() => {
    if (!isFighter || !groupRef.current) return [];

    const pos = groupRef.current.position;
    const rot = groupRef.current.rotation.y;
    const range = combatRange;
    const halfAngle = Math.PI / 6; // 30 degree cone (60 degrees total)

    // Calculate wedge points on the ground
    const groundY = pos.y + 0.1; // Slightly above ground
    const leftAngle = rot + halfAngle;
    const rightAngle = rot - halfAngle;

    const origin = new THREE.Vector3(pos.x, groundY, pos.z);
    const leftPoint = new THREE.Vector3(
      pos.x + Math.sin(leftAngle) * range,
      groundY,
      pos.z + Math.cos(leftAngle) * range
    );
    const rightPoint = new THREE.Vector3(
      pos.x + Math.sin(rightAngle) * range,
      groundY,
      pos.z + Math.cos(rightAngle) * range
    );

    // Create wedge outline: origin -> left -> right -> origin
    return [origin, leftPoint, rightPoint, origin];
  }, [isFighter, combatRange, groupRef.current?.position.x, groupRef.current?.position.z, groupRef.current?.rotation.y]);

  if (!modelLoaded || !model) {
    return null;
  }

  return (
    <>
      {/* Path visualization */}
      {showPath && pathPoints.length > 0 && (
        <Line
          points={pathPoints}
          color={name.includes('Fighter') ? '#ef4444' : '#3b82f6'}
          lineWidth={3}
          dashed={true}
          dashSize={0.5}
          gapSize={0.3}
        />
      )}

      {/* Line of sight wedge on ground */}
      {isFighter && lineOfSightWedge.length === 4 && (
        <Line
          points={lineOfSightWedge}
          color={inCombat ? '#ef4444' : '#fbbf24'}
          lineWidth={inCombat ? 4 : 2}
          transparent
          opacity={inCombat ? 1 : 0.7}
        />
      )}

      <group
        ref={groupRef}
        onClick={onClick}
        onPointerOver={() => {
          // Optional: highlight on hover
        }}
      >
        <primitive object={model} />

        {/* NPC Name Label */}
        <QuestLabel
          position={[0, 2.5, 0]}
          text={name}
          color={name.includes('Fighter') ? '#ef4444' : '#4ade80'}
          fontSize={0.35}
          offset={0}
        />

        {/* Combat status label */}
        {isFighter && inCombat && (
          <QuestLabel
            position={[0, 3, 0]}
            text={lastCombatRole.current === 'attack' ? '⚔️ ATTACK' : '🛡️ BLOCK'}
            color={lastCombatRole.current === 'attack' ? '#ef4444' : '#3b82f6'}
            fontSize={0.25}
            offset={0}
          />
        )}

        {/* Sword swoosh VFX - orange glow trail during attack */}
        {showSwordTrail && (
          <Sparkles
            position={[0.5, 1.2, 0.3]}
            count={20}
            scale={1.5}
            size={3}
            speed={2}
            color="#ff6600"
            opacity={0.8}
          />
        )}
      </group>

      {/* Impact sparks VFX - shown at shield position when blocking */}
      {showImpactSparks && groupRef.current && (
        <Sparkles
          position={[
            impactPosition.current.x,
            impactPosition.current.y,
            impactPosition.current.z
          ]}
          count={30}
          scale={1}
          size={4}
          speed={3}
          color="#ffcc00"
          opacity={1}
        />
      )}
    </>
  );
}
