import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { animationManager } from '../systems/animation/AnimationManager';

// ==================== GLTF Utils (from clear_the_dungeon) ====================
// This properly clones models with skeleton binding

function cloneGltf(gltf: GLTF): GLTF {
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
  } as GLTF;

  const skinnedMeshes: Record<string, THREE.SkinnedMesh> = {};

  gltf.scene.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) skinnedMeshes[node.name] = node;
  });

  const cloneBones: Record<string, THREE.Bone> = {};
  const cloneSkinnedMeshes: Record<string, THREE.SkinnedMesh> = {};

  clone.scene.traverse((node) => {
    if (node instanceof THREE.Bone) cloneBones[node.name] = node;
    if (node instanceof THREE.SkinnedMesh) cloneSkinnedMeshes[node.name] = node;
  });

  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    const orderedCloneBones: THREE.Bone[] = [];

    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    cloneSkinnedMesh.bind(new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses), cloneSkinnedMesh.matrixWorld);
  }

  return clone;
}

// ==================== Animation Updater ====================

function AnimationUpdater() {
  useFrame((_state, delta) => {
    animationManager.update(delta);
  });
  return null;
}

// ==================== Character Component ====================

interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface CameraSettings {
  pitch: number; // Camera pitch angle in radians (0 to PI/2)
  zoom: number; // Camera distance from character
}

function CharacterModel({ input, cameraSettings }: { input: CharacterInput; cameraSettings: CameraSettings }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef<'idle' | 'walk' | 'run'>('idle');
  const { camera } = useThree();

  // Load character model (NO ANIMATIONS - animations are in separate files)
  useEffect(() => {
    if (!groupRef.current) return;

    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        console.log('[CharacterModel] Loading Rogue.glb (character model only, no animations)...');
        
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
            (data) => {
              console.log('[CharacterModel] Character model loaded (animations will load separately)');
              resolve(data);
            },
            undefined,
            (err) => {
              console.error('[CharacterModel] Load error:', err);
              reject(err);
            }
          );
        });

        // Use proper cloning with skeleton binding (like clear_the_dungeon)
        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        
        // Clear and add model
        groupRef.current!.clear();
        groupRef.current!.add(characterScene);
        characterScene.scale.setScalar(1.5);

        // Ensure model is visible and positioned correctly
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;
        characterScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        // Set model for animation hook - use the scene directly
        setModel(characterScene);
        console.log('[CharacterModel] ✓ Character model ready, animations loading...');
      } catch (error) {
        console.error('[CharacterModel] ❌ Failed to load character:', error);
      }
    };

    loadCharacter();
  }, []);

  // Use the existing animation hook - it loads animations from SEPARATE files
  const { crossfadeTo, isLoaded: animationsLoaded, hasAnimation } = useCharacterAnimation({
    characterId: 'minimal-demo-player',
    assetId: 'char_rogue', // Maps to humanoid_basic animation set in kaykit-animations.json
    model: model,
    defaultAnimation: 'idle',
  });

  // Determine movement direction and update animations
  useEffect(() => {
    if (!animationsLoaded || !model) {
      console.log('[CharacterModel] Waiting for animations or model...', { animationsLoaded, hasModel: !!model });
      return;
    }

    let newDirection: typeof directionRef.current = 'idle';

    if (input.forward) {
      newDirection = hasAnimation('run') ? 'run' : 'walk';
    } else if (input.backward || input.left || input.right) {
      newDirection = 'walk'; // Use walk for any movement
    }

    // Only update if direction changed
    if (newDirection !== directionRef.current) {
      directionRef.current = newDirection;
      console.log(`[CharacterModel] Changing animation to: ${newDirection}`);
      
      if (hasAnimation(newDirection)) {
        crossfadeTo(newDirection, 0.2);
      } else if (hasAnimation('walk')) {
        crossfadeTo('walk', 0.2);
      } else if (hasAnimation('idle')) {
        crossfadeTo('idle', 0.2);
      } else {
        console.warn('[CharacterModel] No animations available!');
      }
    }
  }, [input, animationsLoaded, model, crossfadeTo, hasAnimation]);

  // Update movement and camera (isometric)
  useFrame((_state, dt) => {
    if (!groupRef.current) return;

    // Camera-relative movement: transform input based on camera orientation
    const moveSpeed = 5;
    const inputDir = new THREE.Vector3();
    
    if (input.forward) inputDir.z = -1;
    else if (input.backward) inputDir.z = 1;

    if (input.left) inputDir.x = -1;
    else if (input.right) inputDir.x = 1;

    if (inputDir.length() > 0) {
      inputDir.normalize();
      
      // Get camera's forward and right vectors (projected onto XZ plane)
      const cameraForward = new THREE.Vector3();
      camera.getWorldDirection(cameraForward);
      cameraForward.y = 0; // Project to XZ plane
      cameraForward.normalize();

      const cameraRight = new THREE.Vector3();
      cameraRight.crossVectors(cameraForward, new THREE.Vector3(0, 1, 0));
      cameraRight.normalize();

      // Transform input direction to camera-relative direction
      velocityRef.current
        .copy(cameraForward.multiplyScalar(-inputDir.z))
        .add(cameraRight.multiplyScalar(inputDir.x))
        .multiplyScalar(moveSpeed);
    } else {
      velocityRef.current.set(0, 0, 0);
    }

    // Apply movement to GROUP (character moves in world)
    groupRef.current.position.add(velocityRef.current.clone().multiplyScalar(dt));

    // Clamp position (increased world size)
    const worldSize = 100; // Increased from 20
    groupRef.current.position.x = Math.max(-worldSize, Math.min(worldSize, groupRef.current.position.x));
    groupRef.current.position.z = Math.max(-worldSize, Math.min(worldSize, groupRef.current.position.z));

    // Isometric camera FOLLOWS character with adjustable pitch and zoom
    const angle = Math.PI * 0.25; // Base angle
    const distance = cameraSettings.zoom; // Use setting
    const height = Math.sin(cameraSettings.pitch) * distance; // Pitch affects height
    const horizontalDistance = Math.cos(cameraSettings.pitch) * distance; // Horizontal distance
    
    const charPosition = groupRef.current.position;

    camera.position.x = charPosition.x + Math.sin(angle) * horizontalDistance;
    camera.position.y = charPosition.y + height;
    camera.position.z = charPosition.z + Math.cos(angle) * horizontalDistance;
    camera.lookAt(
      charPosition.x,
      charPosition.y + 0.5,
      charPosition.z
    );

    // Face direction of movement
    if (velocityRef.current.length() > 0.1) {
      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1
      );
    }
  });

  return <group ref={groupRef} position={[0, 0, 0]} />;
}

// ==================== Tree Component ====================

function Tree({ position }: { position: [number, number, number] }) {
  const treeRef = useRef<THREE.Group>(null);
  const [treeScene, setTreeScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/Assets/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_A_Color1.gltf',
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setTreeScene(cloned);
      },
      undefined,
      (error) => console.warn('Failed to load tree:', error)
    );
  }, []);

  if (!treeScene) return null;

  return (
    <group ref={treeRef} position={position}>
      <primitive object={treeScene} />
    </group>
  );
}

// ==================== Environment ====================

function Environment() {
  // Larger world - generate more trees (stable placement)
  const trees: [number, number, number][] = useMemo(() => {
    const result: [number, number, number][] = [];
    const spacing = 15;
    const worldRadius = 100;
    // Use seeded random-like pattern (x * 37 + z * 23) mod 10 for consistent placement
    for (let x = -worldRadius; x <= worldRadius; x += spacing) {
      for (let z = -worldRadius; z <= worldRadius; z += spacing) {
        const hash = ((x * 37 + z * 23) % 10);
        if (hash > 3 && (x !== 0 || z !== 0)) {
          result.push([x, 0, z]);
        }
      }
    }
    return result;
  }, []);

  return (
    <>
      {/* Grass ground - larger world */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#3d6b2d" />
      </mesh>

      {/* Grid helper (subtle) - larger grid */}
      <gridHelper args={[200, 100, 0x666666, 0x444444]} position={[0, 0.01, 0]} />

      {/* Trees scattered around */}
      {trees.map((pos, i) => (
        <Tree key={i} position={pos} />
      ))}
    </>
  );
}

// ==================== NPC Component ====================

interface NPCData {
  id: string;
  assetId: string;
  weaponPath?: string;
  position: [number, number, number];
  waypoints: [number, number, number][]; // Path to follow
}

function WalkingNPC({ npcData }: { npcData: NPCData }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const currentWaypointIndex = useRef(0);
  const isMovingRef = useRef(false);

  // Load NPC model
  useEffect(() => {
    if (!groupRef.current) return;

    const loadNPC = async () => {
      try {
        const loader = new GLTFLoader();
        const charPath = npcData.assetId === 'char_knight' 
          ? '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb'
          : '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb';

        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(charPath, resolve, undefined, reject);
        });

        const clonedGltf = cloneGltf(gltf);
        const npcScene = clonedGltf.scene;
        
        groupRef.current!.clear();
        groupRef.current!.add(npcScene);
        npcScene.scale.setScalar(1.5);
        npcScene.position.set(0, 0, 0);
        npcScene.visible = true;

        npcScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setModel(npcScene);

        // Load weapon if specified
        if (npcData.weaponPath) {
          const weaponGltf = await new Promise<GLTF>((resolve, reject) => {
            loader.load(npcData.weaponPath!, resolve, undefined, reject);
          });

          const weapon = weaponGltf.scene.clone();
          
          // Find hand bone
          let handBone: THREE.Bone | null = null;
          npcScene.traverse((node) => {
            if (node instanceof THREE.Bone && (node.name === 'handslotr' || node.name === 'handr')) {
              handBone = node;
            }
          });

          if (handBone) {
            weapon.scale.setScalar(0.8);
            weapon.position.set(0.1, 0, 0);
            weapon.rotation.set(0, 0, Math.PI / 4);
            (handBone as THREE.Object3D).add(weapon);
          }
        }
      } catch (error) {
        console.error(`[NPC ${npcData.id}] Failed to load:`, error);
      }
    };

    loadNPC();
  }, [npcData]);

  // Use animation hook
  const { crossfadeTo, isLoaded } = useCharacterAnimation({
    characterId: `npc-${npcData.id}`,
    assetId: npcData.assetId,
    model: model,
    defaultAnimation: 'idle', // Start with idle, will switch to walk when moving
  });

  // Ensure walk animation is playing when moving
  useEffect(() => {
    if (isLoaded && model && npcData.waypoints.length > 0) {
      // Start walking immediately if NPC has waypoints
      crossfadeTo('walk', 0.2);
      isMovingRef.current = true;
    }
  }, [isLoaded, model, crossfadeTo, npcData.waypoints.length]);

  // Waypoint following behavior
  useFrame((_state, dt) => {
    if (!groupRef.current || !isLoaded || npcData.waypoints.length === 0) return;

    const currentPos = groupRef.current.position;
    const currentWaypoint = new THREE.Vector3(...npcData.waypoints[currentWaypointIndex.current]);
    
    // Check if reached current waypoint
    const distanceToWaypoint = currentPos.distanceTo(currentWaypoint);
    
    if (distanceToWaypoint < 2) {
      // Move to next waypoint (loop around)
      currentWaypointIndex.current = (currentWaypointIndex.current + 1) % npcData.waypoints.length;
    }

    const targetWaypoint = new THREE.Vector3(...npcData.waypoints[currentWaypointIndex.current]);
    
    // Smooth movement direction
    const direction = new THREE.Vector3()
      .subVectors(targetWaypoint, currentPos)
      .normalize();

    // Only move if we have a valid direction
    if (direction.length() > 0.01) {
      const moveSpeed = 2;
      groupRef.current.position.add(direction.multiplyScalar(moveSpeed * dt));

      // Smooth rotation using lerp (prevent abrupt turns that cause T-pose)
      const targetRotation = Math.atan2(direction.x, direction.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        targetRotation,
        0.1 // Smooth rotation
      );

      // Ensure walk animation stays active
      if (!isMovingRef.current) {
        crossfadeTo('walk', 0.2);
        isMovingRef.current = true;
      }
    } else {
      // Stop and idle if no valid direction
      if (isMovingRef.current) {
        crossfadeTo('idle', 0.2);
        isMovingRef.current = false;
      }
    }
  });

  return <group ref={groupRef} position={npcData.position} />;
}

// ==================== Main Component ====================

// Load/save camera settings from localStorage
function useCameraSettings() {
  const [settings, setSettings] = useState<CameraSettings>(() => {
    const stored = localStorage.getItem('minimal-demo-camera-settings');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch {
        // Fallback to defaults
      }
    }
    return { pitch: Math.PI / 6, zoom: 8 }; // Default: 30 degrees pitch, distance 8
  });

  const updateSettings = (updates: Partial<CameraSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    localStorage.setItem('minimal-demo-camera-settings', JSON.stringify(newSettings));
  };

  return [settings, updateSettings] as const;
}

export function MinimalDemo() {
  const navigate = useNavigate();
  const [input, setInput] = useState<CharacterInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const [cameraSettings, updateCameraSettings] = useCameraSettings();
  const [showSettings, setShowSettings] = useState(false);

  // NPCs data with waypoint paths
  const npcs: NPCData[] = [
    {
      id: 'knight1',
      assetId: 'char_knight',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_1handed.gltf',
      position: [20, 0, 20],
      waypoints: [
        [20, 0, 20],
        [30, 0, 20],
        [30, 0, 30],
        [20, 0, 30],
        [20, 0, 20], // Loop back
      ],
    },
    {
      id: 'knight2',
      assetId: 'char_knight',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_2handed.gltf',
      position: [-20, 0, 20],
      waypoints: [
        [-20, 0, 20],
        [-30, 0, 20],
        [-30, 0, 10],
        [-20, 0, 10],
        [-20, 0, 20],
      ],
    },
    {
      id: 'mage1',
      assetId: 'char_mage',
      weaponPath: '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/staff.gltf',
      position: [20, 0, -20],
      waypoints: [
        [20, 0, -20],
        [10, 0, -20],
        [10, 0, -30],
        [20, 0, -30],
        [20, 0, -20],
      ],
    },
    {
      id: 'mage2',
      assetId: 'char_mage',
      position: [-20, 0, -20],
      waypoints: [
        [-20, 0, -20],
        [-30, 0, -20],
        [-30, 0, -30],
        [-20, 0, -30],
        [-20, 0, -20],
      ],
    },
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput((prev) => {
        switch (key) {
          case 'w':
          case 'arrowup':
            return { ...prev, forward: true, backward: false };
          case 's':
          case 'arrowdown':
            return { ...prev, backward: true, forward: false };
          case 'a':
          case 'arrowleft':
            return { ...prev, left: true, right: false };
          case 'd':
          case 'arrowright':
            return { ...prev, right: true, left: false };
          case ' ':
            return { ...prev, jump: true };
          default:
            return prev;
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput((prev) => {
        switch (key) {
          case 'w':
          case 'arrowup':
            return { ...prev, forward: false };
          case 's':
          case 'arrowdown':
            return { ...prev, backward: false };
          case 'a':
          case 'arrowleft':
            return { ...prev, left: false };
          case 'd':
          case 'arrowright':
            return { ...prev, right: false };
          case ' ':
            return { ...prev, jump: false };
          default:
            return prev;
        }
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <button
        onClick={() => navigate('/')}
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          padding: '10px 20px',
          background: '#333',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        ← Back
      </button>

      <div
        style={{
          position: 'absolute',
          top: '80px',
          left: '20px',
          color: 'white',
          zIndex: 10,
          background: 'rgba(0,0,0,0.7)',
          padding: '15px',
          borderRadius: '5px',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}
      >
        <h2 style={{ margin: '0 0 10px 0' }}>Animation Demo</h2>
        <p style={{ margin: '5px 0' }}>Use WASD or Arrow Keys to move</p>
        <p style={{ margin: '5px 0' }}>
          Forward: {input.forward ? '✓' : '✗'} | Back: {input.backward ? '✓' : '✗'}
        </p>
        <p style={{ margin: '5px 0' }}>
          Left: {input.left ? '✓' : '✗'} | Right: {input.right ? '✓' : '✗'}
        </p>
        <button
          onClick={() => setShowSettings(!showSettings)}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            background: '#555',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '11px',
          }}
        >
          {showSettings ? '▼' : '▶'} Camera Settings
        </button>
        {showSettings && (
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #555' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Pitch: {(cameraSettings.pitch * 180 / Math.PI).toFixed(0)}°
              </label>
              <input
                type="range"
                min="0"
                max={Math.PI / 2}
                step={0.01}
                value={cameraSettings.pitch}
                onChange={(e) => updateCameraSettings({ pitch: parseFloat(e.target.value) })}
                style={{ width: '150px' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '11px' }}>
                Zoom: {cameraSettings.zoom.toFixed(1)}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="0.5"
                value={cameraSettings.zoom}
                onChange={(e) => updateCameraSettings({ zoom: parseFloat(e.target.value) })}
                style={{ width: '150px' }}
              />
            </div>
            <p style={{ margin: '5px 0', fontSize: '10px', color: '#aaa' }}>
              Settings saved automatically
            </p>
          </div>
        )}
        <p style={{ margin: '10px 0 0 0', fontSize: '11px', color: '#aaa' }}>
          NPCs walking around with weapons
        </p>
      </div>

      <Canvas shadows camera={{ position: [5, 5, 5], near: 0.1, far: 1000 }}>
        <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />

        <ambientLight intensity={0.8} />
        <directionalLight
          position={[15, 20, 10]}
          intensity={1.0}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-left={-30}
          shadow-camera-right={30}
          shadow-camera-top={30}
          shadow-camera-bottom={-30}
        />

        {/* AnimationUpdater - MUST be inside Canvas to update mixers */}
        <AnimationUpdater />

        <Environment />
        <CharacterModel input={input} cameraSettings={cameraSettings} />
        {npcs.map(npc => (
          <WalkingNPC key={npc.id} npcData={npc} />
        ))}
      </Canvas>
    </div>
  );
}
