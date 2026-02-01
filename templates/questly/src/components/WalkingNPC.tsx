// Walking NPC Component with Pathfinding and Combat
// NPCs that walk along waypoints and can engage in turn-based combat

import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Line, Sparkles, Html } from '@react-three/drei';
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
    combatTargetId?: string; // ID of the fighter this one targets
    takeDamage?: (damage: number) => void; // Callback to deal damage to this fighter
    attackDamage: number; // Damage this fighter deals
    lastDamageDealt: number; // Timestamp of last damage dealt (prevent spam)
  }>(),
  // Track active combat pairs (combatKey -> { active, lastSwapTime })
  activeCombats: new Map<string, { active: boolean; lastSwapTime: number }>(),
  swapInterval: 1500, // ms between attack/block swaps

  // Generate a consistent key for a combat pair
  getCombatKey(id1: string, id2: string): string {
    return [id1, id2].sort().join('-vs-');
  },

  register(id: string, position: THREE.Vector3, combatTargetId?: string, takeDamage?: (damage: number) => void, attackDamage: number = 15) {
    this.fighters.set(id, {
      position,
      state: 'approaching',
      isAttacker: id < (combatTargetId || ''), // Alphabetically first starts as attacker
      lastActionTime: 0,
      combatTargetId,
      takeDamage,
      attackDamage,
      lastDamageDealt: 0,
    });
  },

  unregister(id: string) {
    const fighter = this.fighters.get(id);
    if (fighter?.combatTargetId) {
      const combatKey = this.getCombatKey(id, fighter.combatTargetId);
      this.activeCombats.delete(combatKey);
    }
    this.fighters.delete(id);
  },

  updatePosition(id: string, position: THREE.Vector3) {
    const fighter = this.fighters.get(id);
    if (fighter) {
      fighter.position.copy(position);
    }
  },

  // Deal damage from attacker to their target
  dealDamage(attackerId: string): boolean {
    const attacker = this.fighters.get(attackerId);
    if (!attacker || !attacker.combatTargetId) return false;

    const target = this.fighters.get(attacker.combatTargetId);
    if (!target || !target.takeDamage) return false;

    // Prevent damage spam - only deal damage once per attack cycle
    const now = Date.now();
    if (now - attacker.lastDamageDealt < this.swapInterval * 0.8) return false;

    attacker.lastDamageDealt = now;
    target.takeDamage(attacker.attackDamage);
    console.log(`[Combat] ${attackerId} dealt ${attacker.attackDamage} damage to ${attacker.combatTargetId}`);
    return true;
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

    // Find the target fighter by combatTargetId
    const targetId = fighter.combatTargetId;
    if (!targetId) {
      // Fallback: find any other fighter (legacy behavior)
      for (const [otherId, otherFighter] of this.fighters) {
        if (otherId !== id) {
          const distance = fighter.position.distanceTo(otherFighter.position);
          return {
            inLineOfSight: distance < combatRange,
            atFightingDistance: distance < fightingDistance,
            distance,
            targetPosition: otherFighter.position.clone()
          };
        }
      }
      return { inLineOfSight: false, atFightingDistance: false, distance: Infinity, targetPosition: null };
    }

    const targetFighter = this.fighters.get(targetId);
    if (!targetFighter) {
      return { inLineOfSight: false, atFightingDistance: false, distance: Infinity, targetPosition: null };
    }

    const distance = fighter.position.distanceTo(targetFighter.position);
    const inLineOfSight = distance < combatRange;
    const atFightingDistance = distance < fightingDistance;

    // Track combat pair activation
    const combatKey = this.getCombatKey(id, targetId);
    let combat = this.activeCombats.get(combatKey);

    if (atFightingDistance && (!combat || !combat.active)) {
      combat = { active: true, lastSwapTime: Date.now() };
      this.activeCombats.set(combatKey, combat);
      console.log(`[Combat] ${id} and ${targetId} ENGAGED! Distance: ${distance.toFixed(2)}`);
    }

    return {
      inLineOfSight,
      atFightingDistance,
      distance,
      targetPosition: targetFighter.position.clone()
    };
  },

  getCombatRole(id: string): 'attack' | 'block' | null {
    const fighter = this.fighters.get(id);
    if (!fighter || !fighter.combatTargetId) return null;

    const combatKey = this.getCombatKey(id, fighter.combatTargetId);
    const combat = this.activeCombats.get(combatKey);
    if (!combat || !combat.active) return null;

    // Check if it's time to swap roles
    const now = Date.now();
    if (now - combat.lastSwapTime > this.swapInterval) {
      // Swap roles for this combat pair
      fighter.isAttacker = !fighter.isAttacker;
      const targetFighter = this.fighters.get(fighter.combatTargetId);
      if (targetFighter) {
        targetFighter.isAttacker = !targetFighter.isAttacker;
      }
      combat.lastSwapTime = now;
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
  combatTargetId?: string; // ID of the fighter this NPC will fight against
  combatRange?: number; // Line of sight detection range (default 8)
  fightingDistance?: number; // Distance to stop and fight (default 2)
  weaponPath?: string; // Path to weapon model
  shieldPath?: string; // Path to shield model
  modelScale?: number; // Scale factor for the model (default 1)
  // Animation name overrides (for different character types)
  animAttack?: string; // Attack animation name (default 'attackMelee')
  animBlock?: string; // Block animation name (default 'blockHit')
  animWalk?: string; // Walk animation name (default 'walk')
  animIdle?: string; // Idle animation name (default 'idle')
  animDeath?: string; // Death animation name (default 'death')
  // Health and combat stats
  maxHp?: number; // Maximum health points (default 100)
  currentHp?: number; // Current health points (default equals maxHp)
  invincible?: boolean; // If true, cannot take damage (unlimited health)
  showHealthBar?: boolean; // Show floating health bar above NPC
  showHitbox?: boolean; // Show debug hitbox wireframe
  attackDamage?: number; // Damage dealt per attack (default 15)
  onDamage?: (id: string, damage: number, newHp: number) => void; // Called when NPC takes damage
  onDeath?: (id: string) => void; // Called when NPC dies (hp <= 0)
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
  combatTargetId,
  combatRange = 8,
  fightingDistance = 2.5,
  weaponPath,
  shieldPath,
  modelScale = 1,
  animAttack = 'attackMelee',
  animBlock = 'blockHit',
  animWalk = 'walk',
  animIdle = 'idle',
  animDeath = 'death',
  maxHp = 100,
  currentHp: initialHp,
  invincible = false,
  showHealthBar = false,
  showHitbox = false,
  attackDamage = 15,
  onDamage,
  onDeath,
  onPositionUpdate,
}: WalkingNPCProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);
  type AnimationState = 'idle' | 'walk' | 'attack' | 'block' | 'death';
  const lastAnimationState = useRef<AnimationState>('idle');
  const lastHeightUpdate = useRef(0);
  const hasInitializedPosition = useRef(false);

  // Health state
  // Always use maxHp if currentHp is not provided
  const [hp, setHp] = useState<number>(typeof initialHp === 'number' ? initialHp : maxHp);
  const [isDead, setIsDead] = useState<boolean>(false);

  // Combat state
  const [inCombat, setInCombat] = useState<boolean>(false);
  const [combatTargetPosition, setCombatTargetPosition] = useState<THREE.Vector3 | null>(null);
  const combatPositionRef = useRef(new THREE.Vector3());
  const lastCombatRole = useRef<'attack' | 'block' | null>(null);

  // Combat VFX state
  const [showSwordTrail, setShowSwordTrail] = useState(false);
  const [showImpactSparks, setShowImpactSparks] = useState(false);
  const impactPosition = useRef(new THREE.Vector3());
  const lastAttackTime = useRef(0);


  // Animation mapping for special NPCs
  const isBlob = characterModelPath?.includes('GreenSpikyBlob');
  const isKaykitSkeleton = characterModelPath?.includes('KayKit_Skeletons_1.1_FREE') || (id === 'blob1' && characterModelPath?.includes('Skeleton'));
  // Animation clip names for KayKit Skeleton (from KayKit docs/standard)
  const skeletonAnim = {
    idle: 'Idle',
    walk: 'Walk',
    attack: 'Attack',
    block: 'Hit',
    death: 'Death',
  };
  // Blob fallback (legacy)
  const blobAnim = {
    idle: 'Idle',
    walk: 'Walk',
    attack: 'Bite_Front',
    block: 'HitRecieve',
  };

  // Track current block state (re-evaluated each attack cycle)
  const blockingRef = useRef(false);

  // Damage handling function (exposed via ref for external calls)
  const takeDamage = (damage: number) => {
    if (invincible || isDead) return;
    
    // If blocking, reduce damage by 50%
    const actualDamage = blockingRef.current ? Math.floor(damage * 0.5) : damage;
    const newHp = Math.max(0, hp - actualDamage);
    
    console.log(`[WalkingNPC ${id}] Taking ${actualDamage} damage (blocked: ${blockingRef.current}), HP: ${hp} -> ${newHp}`);
    
    setHp(newHp);
    onDamage?.(id, actualDamage, newHp);
    if (newHp <= 0 && !isDead) {
      setIsDead(true);
      onDeath?.(id);
      console.log(`[WalkingNPC ${id}] DIED!`);
    }
  };

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
    if (isKaykitSkeleton) return 'skeleton_warrior';
    if (characterModelPath?.includes('Mage')) return 'char_mage';
    if (characterModelPath?.includes('Ranger')) return 'char_ranger';
    if (characterModelPath?.includes('Barbarian')) return 'char_barbarian';
    if (characterModelPath?.includes('Rogue')) return 'char_rogue';
    return 'char_knight'; // Default
  };

  const { crossfadeTo, isLoaded: animationsLoaded, hasAnimation } = useCharacterAnimation({
    characterId: `npc-${id}`,
    assetId: getAssetId(),
    model: model,
    defaultAnimation: isKaykitSkeleton ? skeletonAnim.idle : isBlob ? blobAnim.idle : 'idle',
  });

  const crossfadeFirstAvailable = (names: string[], duration: number): boolean => {
    if (!animationsLoaded || !crossfadeTo) return false;
    for (const name of names) {
      if (name && hasAnimation(name)) {
        crossfadeTo(name, duration);
        return true;
      }
    }
    return false;
  };

  // Ensure animations start playing when they become available
  useEffect(() => {
    if (animationsLoaded && crossfadeTo && model) {
      // Force start with idle animation when animations load - don't check state
      try {
        crossfadeFirstAvailable(
          isKaykitSkeleton
            ? [skeletonAnim.idle, 'idle', 'Idle', animIdle]
            : isBlob
              ? [blobAnim.idle, 'idle', 'Idle', animIdle]
              : [animIdle, 'idle', 'Idle'],
          0.2
        );
        lastAnimationState.current = 'idle'; // Set state to match
      } catch (err) {
        console.warn(`[WalkingNPC ${id}] Failed to initialize idle animation:`, err);
      }
    }
  }, [animationsLoaded, crossfadeTo, model, id, isBlob, isKaykitSkeleton]);

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
        combatCoordinator.register(id, groupRef.current.position, combatTargetId, takeDamage, attackDamage);
        console.log(`[WalkingNPC ${id}] Registered as fighter at position (${startPos[0]}, ${finalY}, ${startPos[2]}), target: ${combatTargetId || 'any'}, damage: ${attackDamage}`);
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

        // If dead, play death animation once and stop combat
        if (isDead && lastAnimationState.current !== 'death') {
          lastAnimationState.current = 'death';
          if (isKaykitSkeleton) {
            const played = crossfadeFirstAvailable([skeletonAnim.death, 'death', 'Death', animDeath], 0.3);
            if (!played) console.warn(`[WalkingNPC ${id}] Skeleton death animation not found`);
          } else if (isBlob) {
            const played = crossfadeFirstAvailable([blobAnim.block, blobAnim.idle, 'death', 'Death'], 0.3);
            if (!played) console.warn(`[WalkingNPC ${id}] Blob death animation not found`);
          }
          setInCombat(false);
          return;
        }

        // Play attack or block animation based on role
        if (!isDead && combatRole === 'attack' && lastCombatRole.current !== 'attack') {
          lastCombatRole.current = 'attack';
          lastAnimationState.current = 'attack';
          lastAttackTime.current = Date.now();

          // Deal damage to target
          combatCoordinator.dealDamage(id);

          // Show sword trail VFX during attack
          setShowSwordTrail(true);
          setTimeout(() => setShowSwordTrail(false), 600); // Trail duration

          if (animationsLoaded && crossfadeTo) {
            if (isKaykitSkeleton) {
              const played = crossfadeFirstAvailable(
                [skeletonAnim.attack, 'attack', 'Attack', animAttack, 'attackMelee', 'Melee_2H_Attack_Chop'],
                0.15
              );
              if (!played) console.warn(`[WalkingNPC ${id}] Skeleton attack animation not found`);
            } else if (isBlob) {
              const played = crossfadeFirstAvailable([blobAnim.attack, 'attack', 'Attack', animAttack], 0.15);
              if (!played) console.warn(`[WalkingNPC ${id}] Blob attack animation not found`);
            } else {
              const attackAnims = [animAttack, 'attackMelee', 'Bite_Front', 'Attack', 'attack'];
              let played = false;
              for (const anim of attackAnims) {
                if (crossfadeFirstAvailable([anim], 0.15)) {
                  played = true;
                  break;
                }
              }
              if (!played) console.warn(`[WalkingNPC ${id}] No attack animation found`);
            }
          }
        } else if (!isDead && combatRole === 'block' && lastCombatRole.current !== 'block') {
          // Re-evaluate block chance on each block cycle (15% for skeleton, 30% for others)
          const blockChance = isKaykitSkeleton ? 0.15 : 0.3;
          const shouldBlockNow = Math.random() < blockChance;
          blockingRef.current = shouldBlockNow;
          
          lastCombatRole.current = 'block';
          lastAnimationState.current = 'block';
          
          console.log(`[WalkingNPC ${id}] Block cycle - will block: ${shouldBlockNow}`);

          // Only show sparks if actually blocking
          if (shouldBlockNow) {
            // Show impact sparks VFX when blocking (delayed to sync with incoming attack)
            impactPosition.current.copy(currentPos);
            impactPosition.current.y += 1.2; // Shield height
            setTimeout(() => {
              setShowImpactSparks(true);
              setTimeout(() => setShowImpactSparks(false), 400); // Sparks duration
            }, 300); // Delay to sync with attack animation hitting
          }

          if (animationsLoaded && crossfadeTo) {
            if (isKaykitSkeleton) {
              const played = crossfadeFirstAvailable(
                [skeletonAnim.block, 'blockHit', 'block', 'Hit', 'hit', animBlock],
                0.15
              );
              if (!played) console.warn(`[WalkingNPC ${id}] Skeleton block animation not found`);
            } else if (isBlob) {
              const played = crossfadeFirstAvailable([blobAnim.block, 'block', 'HitRecieve', 'Hit', animBlock], 0.15);
              if (!played) console.warn(`[WalkingNPC ${id}] Blob block animation not found`);
            } else {
              const blockAnims = [animBlock, 'blockHit', 'block', 'HitRecieve', 'Hit', 'Idle'];
              let played = false;
              for (const anim of blockAnims) {
                if (crossfadeFirstAvailable([anim], 0.15)) {
                  played = true;
                  break;
                }
              }
              if (!played) console.warn(`[WalkingNPC ${id}] No block animation found`);
            }
          }
        } else if (!isDead && combatRole === 'attack' && lastCombatRole.current === 'block') {
          // Transitioning from block to attack - reset blocking state
          blockingRef.current = false;
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
            if (isKaykitSkeleton) {
              const played = crossfadeFirstAvailable([skeletonAnim.walk, 'walk', 'Walk', animWalk], 0.2);
              if (!played) console.warn(`[WalkingNPC ${id}] Skeleton walk animation not found`);
            } else if (isBlob) {
              const played = crossfadeFirstAvailable([blobAnim.walk, 'walk', 'Walk', animWalk], 0.2);
              if (!played) console.warn(`[WalkingNPC ${id}] Blob walk animation not found`);
            } else {
              const walkAnims = [animWalk, 'walk', 'Walk', 'walking'];
              let played = false;
              for (const anim of walkAnims) {
                if (crossfadeFirstAvailable([anim], 0.2)) {
                  played = true;
                  break;
                }
              }
              if (!played) console.warn(`[WalkingNPC ${id}] No walk animation found`);
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
          if (isKaykitSkeleton) {
            const played = crossfadeFirstAvailable([skeletonAnim.idle, 'idle', 'Idle', animIdle], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Skeleton idle animation not found`);
          } else if (isBlob) {
            const played = crossfadeFirstAvailable([blobAnim.idle, 'idle', 'Idle', animIdle], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Blob idle animation not found`);
          } else {
            crossfadeFirstAvailable([animIdle, 'idle', 'Idle'], 0.2);
          }
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
    // If dead, don't move (stay at death position)
    if (isDead) return;

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
          if (isKaykitSkeleton) {
            const played = crossfadeFirstAvailable([skeletonAnim.walk, 'walk', 'Walk', animWalk], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Skeleton walk animation not found`);
          } else if (isBlob) {
            const played = crossfadeFirstAvailable([blobAnim.walk, 'walk', 'Walk', animWalk], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Blob walk animation not found`);
          } else {
            const played = crossfadeFirstAvailable([animWalk, 'walk', 'Walk', 'walking'], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Failed to play walk animation`);
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
          if (isKaykitSkeleton) {
            const played = crossfadeFirstAvailable([skeletonAnim.idle, 'idle', 'Idle', animIdle], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Skeleton idle animation not found`);
          } else if (isBlob) {
            const played = crossfadeFirstAvailable([blobAnim.idle, 'idle', 'Idle', animIdle], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Blob idle animation not found`);
          } else {
            const played = crossfadeFirstAvailable([animIdle, 'idle', 'Idle'], 0.2);
            if (!played) console.warn(`[WalkingNPC ${id}] Failed to play idle animation`);
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

        {/* Health bar - floating above NPC */}
        {showHealthBar && !isDead && (
          <Html
            position={[0, 2.8, 0]}
            center
            distanceFactor={10}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
            }}>
              {/* HP text */}
              <div style={{
                color: invincible ? '#ffd700' : '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
                textShadow: '1px 1px 2px black',
              }}>
                {invincible ? '∞' : `${hp}/${maxHp}`}
              </div>
              {/* Health bar background */}
              <div style={{
                width: '60px',
                height: '8px',
                backgroundColor: '#333333',
                borderRadius: '4px',
                border: '1px solid #666666',
                overflow: 'hidden',
              }}>
                {/* Health bar fill */}
                <div style={{
                  width: invincible ? '100%' : `${(hp / maxHp) * 100}%`,
                  height: '100%',
                  backgroundColor: invincible ? '#ffd700' : hp > maxHp * 0.5 ? '#22c55e' : hp > maxHp * 0.25 ? '#f59e0b' : '#ef4444',
                  transition: 'width 0.3s ease, background-color 0.3s ease',
                }} />
              </div>
            </div>
          </Html>
        )}

        {/* Debug hitbox visualization */}
        {showHitbox && (
          <mesh position={[0, 0.9, 0]}>
            <boxGeometry args={[1.0, 1.8, 1.0]} />
            <meshBasicMaterial
              color={isDead ? '#666666' : inCombat ? '#ff0000' : '#00ff00'}
              wireframe
              transparent
              opacity={0.8}
            />
          </mesh>
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
