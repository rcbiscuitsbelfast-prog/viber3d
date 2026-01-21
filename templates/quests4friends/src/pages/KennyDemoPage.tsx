// Kenny Demo Page - Play Kenny worlds with character controller
// Similar to MinimalDemo but loads Kenny worlds

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTF, GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import * as LZString from 'lz-string';
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
import { animationManager } from '../systems/animation/AnimationManager';

// IndexedDB helpers (shared pattern with KennyBlocksPage)
const DB_NAME = 'kenny-blocks-db';
const STORE_NAME = 'glb';

function openGlbDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('indexedDB open failed'));
  });
}

async function storeGlbInDb(key: string, data: string) {
  try {
    const db = await openGlbDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(data, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('indexedDB write failed'));
    });
  } catch (err) {
    console.warn('IDB store failed, falling back to localStorage', err);
    localStorage.setItem(key, data);
  }
}

async function getGlbFromDb(key: string): Promise<string | null> {
  try {
    const db = await openGlbDB();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const req = tx.objectStore(STORE_NAME).get(key);
      req.onsuccess = () => resolve((req.result as string) || null);
      req.onerror = () => reject(req.error || new Error('indexedDB read failed'));
    });
  } catch (err) {
    console.warn('IDB read failed, falling back to localStorage', err);
    return localStorage.getItem(key);
  }
}

interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

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

    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );
  }

  return clone;
}

// Animation updater component
function AnimationUpdater() {
  useFrame((_, delta) => {
    animationManager.update(delta);
  });
  return null;
}

// Character controller
function CharacterModel({ input, worldMesh }: { input: CharacterInput; worldMesh: THREE.Group | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const [model, setModel] = useState<THREE.Object3D | null>(null);
  const velocityRef = useRef(new THREE.Vector3());
  const verticalVelocityRef = useRef(0);
  const isGroundedRef = useRef(true);
  const directionRef = useRef<'idle' | 'walk' | 'run'>('idle');
  const raycaster = useRef(new THREE.Raycaster());
  const { camera } = useThree();

  useEffect(() => {
    if (!groupRef.current) return;

    const loadCharacter = async () => {
      try {
        const loader = new GLTFLoader();
        const gltf = await new Promise<GLTF>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
            resolve,
            undefined,
            reject
          );
        });

        const clonedGltf = cloneGltf(gltf);
        const characterScene = clonedGltf.scene;
        
        groupRef.current!.clear();
        groupRef.current!.add(characterScene);
        characterScene.scale.setScalar(0.15); // Shrink player to 1/10th size
        characterScene.position.set(0, 0, 0);
        characterScene.visible = true;
        characterScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        setModel(characterScene);
      } catch (error) {
        console.error('[CharacterModel] Failed to load character:', error);
      }
    };

    loadCharacter();
  }, []);

  const { crossfadeTo, isLoaded: animationsLoaded, hasAnimation } = useCharacterAnimation({
    characterId: 'kenny-demo-player',
    assetId: 'char_rogue',
    model: model,
    defaultAnimation: 'idle',
  });

  useEffect(() => {
    if (!animationsLoaded || !model) return;

    let newDirection: typeof directionRef.current = 'idle';

    if (input.forward) {
      newDirection = hasAnimation('run') ? 'run' : 'walk';
    } else if (input.backward || input.left || input.right) {
      newDirection = 'walk';
    }

    if (newDirection !== directionRef.current) {
      directionRef.current = newDirection;
      if (hasAnimation(newDirection)) {
        crossfadeTo(newDirection, 0.2);
      }
    }
  }, [input, animationsLoaded, model, crossfadeTo, hasAnimation]);

  useFrame((_state, dt) => {
    if (!groupRef.current) return;

    const moveSpeed = 2; // Reduced from 5 for slower, more controlled movement
    const moveDir = new THREE.Vector3();
    const SQRT2_INV = 0.7071067811865476;
    
    if (input.forward) {
      moveDir.x -= moveSpeed * SQRT2_INV;
      moveDir.z -= moveSpeed * SQRT2_INV;
    } else if (input.backward) {
      moveDir.x += moveSpeed * SQRT2_INV;
      moveDir.z += moveSpeed * SQRT2_INV;
    }

    if (input.left) {
      moveDir.x -= moveSpeed * SQRT2_INV;
      moveDir.z += moveSpeed * SQRT2_INV;
    } else if (input.right) {
      moveDir.x += moveSpeed * SQRT2_INV;
      moveDir.z -= moveSpeed * SQRT2_INV;
    }

    velocityRef.current.copy(moveDir);

    // Jump physics
    const JUMP_FORCE = 8.0;
    const GRAVITY = -25.0;
    
    if (input.jump && isGroundedRef.current) {
      verticalVelocityRef.current = JUMP_FORCE;
      isGroundedRef.current = false;
    }
    
    verticalVelocityRef.current += GRAVITY * dt;

    const movementDelta = moveDir.clone().multiplyScalar(dt);
    const newPosition = groupRef.current.position.clone().add(movementDelta);
    
    newPosition.y = groupRef.current.position.y + (verticalVelocityRef.current * dt);
    
    // Raycast downward to find ground height from loaded world mesh
    let groundY = -100; // Fall infinitely if no collision
    
    if (worldMesh) {
      raycaster.current.set(
        new THREE.Vector3(newPosition.x, newPosition.y + 5, newPosition.z),
        new THREE.Vector3(0, -1, 0)
      );
      
      const meshes: THREE.Mesh[] = [];
      worldMesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          meshes.push(child);
        }
      });
      
      const intersects = raycaster.current.intersectObjects(meshes, false);
      if (intersects.length > 0) {
        groundY = intersects[0].point.y;
      }
    }
    
    const targetY = groundY + 0.5; // Character height offset
    
    if (newPosition.y <= targetY) {
      newPosition.y = targetY;
      verticalVelocityRef.current = 0;
      isGroundedRef.current = true;
    }
    
    groupRef.current.position.copy(newPosition);

    // Camera follow (isometric) - scaled for tiny player (0.1x scale)
    const angle = Math.PI * 0.25;
    const distance = 1.5; // Scaled down from 15 to match 0.1x player scale
    const pitch = Math.PI / 4;
    const height = Math.sin(pitch) * distance;
    const horizontalDistance = Math.cos(pitch) * distance;
    
    const charPosition = groupRef.current.position;
    camera.position.x = charPosition.x + Math.sin(angle) * horizontalDistance;
    camera.position.y = charPosition.y + height;
    camera.position.z = charPosition.z + Math.cos(angle) * horizontalDistance;
    camera.lookAt(charPosition.x, charPosition.y + 0.5, charPosition.z);

    // Rotate character
    if (velocityRef.current.lengthSq() > 0.01) {
      const targetRotation = Math.atan2(velocityRef.current.x, velocityRef.current.z);
      let currentRotation = groupRef.current.rotation.y;
      let angleDiff = targetRotation - currentRotation;
      
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      groupRef.current.rotation.y += angleDiff * 0.15;
    }
  });

  return <group ref={groupRef} position={[0, 0, 0]} />;
}

// Loaded world mesh
function LoadedWorldMesh({ mesh }: { mesh: THREE.Group | null }) {
  if (!mesh) return null;
  mesh.position.y = -4.5;
  return <primitive object={mesh} />;
}

// Render placed assets from save data
function PlacedAssetsRenderer({ assetsData }: { assetsData: any[] }) {
  return (
    <>
      {assetsData && assetsData.map((assetData) => (
        <PlacedAssetInstance key={assetData.id} assetData={assetData} />
      ))}
    </>
  );
}

// Individual asset instance
function PlacedAssetInstance({ assetData }: { assetData: any }) {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      assetData.assetPath,
      (gltf) => {
        const cloned = gltf.scene.clone();
        const finalScale = assetData.scale * (assetData.defaultScale || 1.0);
        cloned.scale.setScalar(finalScale);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        setScene(cloned);
      },
      undefined,
      (error) => {
        console.error(`Failed to load asset ${assetData.assetName}:`, error);
      }
    );
  }, [assetData.assetPath, assetData.defaultScale, assetData.scale]);

  if (!scene) return null;

  // Apply same Y-offset as world mesh (-4.5) so assets align with blocks
  const adjustedPosition: [number, number, number] = [
    assetData.position[0],
    assetData.position[1] - 4.5,
    assetData.position[2],
  ];

  return (
    <group 
      ref={groupRef} 
      position={adjustedPosition}
      rotation={[0, assetData.rotation, 0]}
    >
      <primitive object={scene} />
    </group>
  );
}

export function KennyDemo() {
  const navigate = useNavigate();
  const [input, setInput] = useState<CharacterInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  const [loadedWorldMesh, setLoadedWorldMesh] = useState<THREE.Group | null>(null);
  const [savedWorlds, setSavedWorlds] = useState<string[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string | null>(null);
  const [showWorldSelection, setShowWorldSelection] = useState(true);
  const [characterSpawned, setCharacterSpawned] = useState(false);
  const [placedAssets, setPlacedAssets] = useState<any[]>([]);

  const seedSampleWorld = useCallback(() => {
    const name = 'sample-world';
    const already = localStorage.getItem(`kenny_blocks_glb_${name}`);
    if (already) {
      alert('Sample world already exists. You can load it from the list.');
      return;
    }

    const scene = new THREE.Scene();

    const ground = new THREE.Mesh(
      new THREE.BoxGeometry(20, 1, 20),
      new THREE.MeshStandardMaterial({ color: 0x4a9eff })
    );
    ground.position.y = -0.5;
    scene.add(ground);

    const block1 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 2, 2),
      new THREE.MeshStandardMaterial({ color: 0x27ae60 })
    );
    block1.position.set(0, 1, 0);
    scene.add(block1);

    const block2 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 3, 2),
      new THREE.MeshStandardMaterial({ color: 0xe67e22 })
    );
    block2.position.set(4, 1.5, -3);
    scene.add(block2);

    const block3 = new THREE.Mesh(
      new THREE.BoxGeometry(2, 4, 2),
      new THREE.MeshStandardMaterial({ color: 0xe74c3c })
    );
    block3.position.set(-4, 2, 3);
    scene.add(block3);

    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (result) => {
        const output = result as ArrayBuffer;
        const blob = new Blob([output], { type: 'model/gltf-binary' });
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const compressed = LZString.compressToBase64(base64);
          storeGlbInDb(`kenny_blocks_glb_${name}`, compressed).then(() => {
            localStorage.setItem(`kenny_blocks_glb_${name}`, 'idb');
            // Auto-load the sample world
            handleLoadWorld(name);
          });
          setSavedWorlds(prev => Array.from(new Set([...prev, name])));
        };
        reader.onerror = () => alert('Failed to encode sample world');
        reader.readAsDataURL(blob);
      },
      () => alert('Failed to export sample world'),
      { binary: true }
    );
  }, []);

  useEffect(() => {
    // Load saved block groups from Kenny Blocks
    const worlds = Object.keys(localStorage)
      .filter(key => key.startsWith('kenny_blocks_') && !key.startsWith('kenny_blocks_glb_'))
      .map(key => key.replace('kenny_blocks_', ''));
    console.log('Found saved block groups:', worlds);
    setSavedWorlds(worlds);
  }, []);

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

  const handleLoadWorld = async (worldName: string) => {
    console.log(`Loading block group: ${worldName}`);
    const glbData = await getGlbFromDb(`kenny_blocks_glb_${worldName}`);
    if (!glbData) {
      alert(`Block group "${worldName}" not found`);
      return;
    }

    try {
      // Decompress (if compressed) and convert base64 to ArrayBuffer
      const decompressed = LZString.decompressFromBase64(glbData) || glbData;
      const base64 = decompressed.includes(',') ? decompressed.split(',')[1] : decompressed;
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const loader = new GLTFLoader();
      loader.parse(
        bytes.buffer,
        '',
        (gltf) => {
          console.log('Loaded block group:', worldName);
          setLoadedWorldMesh(gltf.scene);
          setSelectedWorld(worldName);
          setShowWorldSelection(false);
          setCharacterSpawned(true);
          
          // Load placed assets from save data
          const assetData = localStorage.getItem('placed_assets_data');
          if (assetData) {
            try {
              const assets = JSON.parse(assetData);
              setPlacedAssets(assets);
              console.log('[KennyDemo] Loaded placed assets:', assets);
            } catch (e) {
              console.warn('[KennyDemo] Failed to parse asset data:', e);
            }
          } else {
            console.log('[KennyDemo] No asset data found');
            setPlacedAssets([]);
          }
        },
        (error) => {
          console.error('Error loading block group:', error);
          alert('Error loading block group');
        }
      );
    } catch (error) {
      console.error('Error parsing block group:', error);
      alert('Error parsing block group');
    }
  };

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
        }}
      >
        ← Back
      </button>

      {/* World Selection Modal - Shows on page load */}
      {showWorldSelection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.9)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#222',
            padding: '30px',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
            border: '2px solid #3498db',
          }}>
            <h2 style={{ color: 'white', marginBottom: '10px', textAlign: 'center' }}>🌍 Select a World to Explore</h2>
            <p style={{ color: '#aaa', marginBottom: '20px', textAlign: 'center', fontSize: '14px' }}>
              Choose a world to load before your character spawns
            </p>
            
            <button
              onClick={seedSampleWorld}
              style={{
                width: '100%',
                padding: '12px',
                marginBottom: '15px',
                background: '#27ae60',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '16px',
              }}
            >
              🎲 Generate Sample World
            </button>
            
            {savedWorlds.length === 0 ? (
              <div style={{
                padding: '20px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '8px',
                textAlign: 'center',
              }}>
                <p style={{ color: '#888', fontSize: '14px', marginBottom: '10px' }}>
                  No saved worlds found.
                </p>
                <p style={{ color: '#666', fontSize: '12px' }}>
                  Generate a sample world or create one in Kenny Blocks Builder!
                </p>
              </div>
            ) : (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {savedWorlds.map(world => (
                  <button
                    key={world}
                    onClick={() => handleLoadWorld(world)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      marginBottom: '8px',
                      background: '#555',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '15px',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#3498db'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#555'}
                  >
                    📦 {world}
                  </button>
                ))}
              </div>
            )}
            
            <button
              onClick={() => navigate('/')}
              style={{
                width: '100%',
                padding: '10px',
                marginTop: '15px',
                background: '#e74c3c',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              ← Back to Home
            </button>
          </div>
        </div>
      )}

      {/* World Info - Only show after world loaded */}
      {!showWorldSelection && selectedWorld && (
        <div style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.75)',
          padding: '15px',
          borderRadius: '8px',
        }}>
          <div style={{ color: 'white', fontSize: '14px' }}>
            <strong>Current World:</strong> {selectedWorld}
          </div>
        </div>
      )}

      {/* Controls Info */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.75)',
        padding: '15px',
        borderRadius: '8px',
        color: 'white',
        fontSize: '14px',
      }}>
        <div><strong>Controls:</strong></div>
        <div>WASD / Arrows - Move</div>
        <div>Space - Jump</div>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[1, 1, 1]} /> {/* Scaled for 0.1x player size */}
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        
        <group rotation={[0, Math.PI / 4, 0]}>
          {loadedWorldMesh && <LoadedWorldMesh mesh={loadedWorldMesh} />}
          {placedAssets && placedAssets.length > 0 && <PlacedAssetsRenderer assetsData={placedAssets} />}
        </group>
        
        {characterSpawned && <CharacterModel input={input} worldMesh={loadedWorldMesh} />}
        <AnimationUpdater />
      </Canvas>
    </div>
  );
}
