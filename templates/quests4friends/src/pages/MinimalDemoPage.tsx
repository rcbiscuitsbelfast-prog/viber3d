import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import { useEffect, useState, useRef, createContext, useContext } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Create context for zoom control
const ZoomContext = createContext({ zoomDistance: 8, setZoomDistance: (d: number) => {} });

const keyState: Record<string, boolean> = {
  'w': false,
  'a': false,
  's': false,
  'd': false,
  'arrowup': false,
  'arrowdown': false,
  'arrowleft': false,
  'arrowright': false,
  ' ': false,
};

// Character player component
function PlayerCharacter() {
  const groupRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Object3D | null>(null);
  const placeholderRef = useRef<THREE.Mesh>(null);
  const [mixer, setMixer] = useState<THREE.AnimationMixer | null>(null);
  const [animationClips, setAnimationClips] = useState<Record<string, THREE.AnimationClip>>({});
  const [currentAction, setCurrentAction] = useState<THREE.AnimationAction | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const velocityRef = useRef(new THREE.Vector3());
  const directionRef = useRef(new THREE.Vector3());
  const targetRotationRef = useRef(0);
  const currentRotationRef = useRef(0);
  const verticalVelocityRef = useRef(0);
  const isJumpingRef = useRef(false);

  const { camera } = useThree();

  // Load character
  useEffect(() => {
    const loadCharacter = async () => {
      try {
        console.log('[PlayerCharacter] Loading model...');
        const loader = new GLTFLoader();
        
        // Load character model
        const characterGltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
            resolve,
            undefined,
            reject
          );
        });

        // Load animation files
        const movementGltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb',
            resolve,
            undefined,
            reject
          );
        });

        const generalGltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            '/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/Rig_Medium_General.glb',
            resolve,
            undefined,
            reject
          );
        });

        // Add scene elements
        if (groupRef.current) {
          // Add the model to the group
          const model = characterGltf.scene;
          model.castShadow = true;
          model.receiveShadow = true;
          model.traverse((child: any) => {
            child.castShadow = true;
            child.receiveShadow = true;
          });
          groupRef.current.add(model);
          modelRef.current = model;

          // Hide placeholder mesh now that model is loaded
          if (placeholderRef.current) {
            placeholderRef.current.visible = false;
          }

          // Create mixer on the character
          const newMixer = new THREE.AnimationMixer(model);
          setMixer(newMixer);

          // Collect all animation clips from both sources
          const clips: Record<string, THREE.AnimationClip> = {};
          
          // Add movement animations
          movementGltf.animations.forEach((clip: THREE.AnimationClip) => {
            clips[clip.name] = clip;
          });

          // Add general animations
          generalGltf.animations.forEach((clip: THREE.AnimationClip) => {
            clips[clip.name] = clip;
          });
          
          console.log('[PlayerCharacter] All animations found:', Object.keys(clips));
          setAnimationClips(clips);

          // Find and play idle animation
          let idleAction: THREE.AnimationAction | null = null;
          for (const [name, clip] of Object.entries(clips)) {
            if (name.toLowerCase().includes('idle')) {
              console.log('[PlayerCharacter] Playing idle:', name);
              idleAction = newMixer.clipAction(clip);
              idleAction.loop = THREE.LoopRepeat;
              idleAction.play();
              setCurrentAction(idleAction);
              break;
            }
          }
          
          if (!idleAction) {
            console.warn('[PlayerCharacter] No idle animation found, trying first available animation');
            const firstClip = Object.values(clips)[0];
            if (firstClip) {
              console.log('[PlayerCharacter] Playing fallback animation:', firstClip.name);
              idleAction = newMixer.clipAction(firstClip);
              idleAction.loop = THREE.LoopRepeat;
              idleAction.play();
              setCurrentAction(idleAction);
            }
          }
        }
      } catch (err) {
        console.error('[PlayerCharacter] Failed to load:', err);
      }
    };

    loadCharacter();
  }, []);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyState) {
        keyState[key] = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in keyState) {
        keyState[key] = false;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Animation loop
  useFrame((state, delta) => {
    if (!groupRef.current || !mixer) return;

    // Update mixer
    mixer.update(delta);

    // Handle movement input
    directionRef.current.set(0, 0, 0);
    let isInputMoving = false;

    if (keyState['w']) {
      directionRef.current.z -= 1;
      isInputMoving = true;
    }
    if (keyState['s']) {
      directionRef.current.z += 1;
      isInputMoving = true;
    }
    if (keyState['a']) {
      directionRef.current.x -= 1;
      isInputMoving = true;
    }
    if (keyState['d']) {
      directionRef.current.x += 1;
      isInputMoving = true;
    }

    // Arrow keys
    if (keyState['arrowup']) {
      directionRef.current.z -= 1;
      isInputMoving = true;
    }
    if (keyState['arrowdown']) {
      directionRef.current.z += 1;
      isInputMoving = true;
    }
    if (keyState['arrowleft']) {
      directionRef.current.x -= 1;
      isInputMoving = true;
    }
    if (keyState['arrowright']) {
      directionRef.current.x += 1;
      isInputMoving = true;
    }

    // Handle jump
    if (keyState[' '] && !isJumpingRef.current && groupRef.current.position.y < 0.1) {
      verticalVelocityRef.current = 15;
      isJumpingRef.current = true;
    }

    if (directionRef.current.length() > 0) {
      directionRef.current.normalize();
      
      // Calculate target rotation to face movement direction
      targetRotationRef.current = Math.atan2(directionRef.current.x, directionRef.current.z);

      // Move character
      const speed = 8;
      velocityRef.current.copy(directionRef.current).multiplyScalar(speed);
      groupRef.current.position.add(velocityRef.current.clone().multiplyScalar(delta));
    }

    // Smooth rotation towards target
    let rotationDiff = targetRotationRef.current - currentRotationRef.current;
    
    // Normalize angle difference to -PI to PI
    while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
    while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
    
    const rotationSpeed = 8;
    if (Math.abs(rotationDiff) > 0.05) {
      currentRotationRef.current += rotationDiff * rotationSpeed * delta;
      groupRef.current.rotation.y = currentRotationRef.current;
    }

    // Handle gravity and jumping
    const gravity = 30;
    verticalVelocityRef.current -= gravity * delta;
    groupRef.current.position.y += verticalVelocityRef.current * delta;

    // Ground collision
    if (groupRef.current.position.y < 0) {
      groupRef.current.position.y = 0;
      verticalVelocityRef.current = 0;
      isJumpingRef.current = false;
    }

    // Handle animation switching - only switch between idle and walk/run, not on direction change
    const shouldBeMoving = isInputMoving;
    if (shouldBeMoving !== isMoving) {
      setIsMoving(shouldBeMoving);

      if (shouldBeMoving && animationClips && mixer) {
        // Find a walk/run animation
        let moveAnimation = null;
        for (const [name, clip] of Object.entries(animationClips)) {
          if (name.toLowerCase().includes('walk')) {
            moveAnimation = clip;
            break;
          }
        }
        
        // If no walk, try run or move
        if (!moveAnimation) {
          for (const [name, clip] of Object.entries(animationClips)) {
            if (name.toLowerCase().includes('run') || name.toLowerCase().includes('move')) {
              moveAnimation = clip;
              break;
            }
          }
        }

        if (moveAnimation) {
          const newAction = mixer.clipAction(moveAnimation);
          newAction.loop = THREE.LoopRepeat;
          if (currentAction) {
            currentAction.fadeOut(0.3);
          }
          newAction.reset();
          newAction.fadeIn(0.3);
          newAction.play();
          setCurrentAction(newAction);
        }
      } else if (!shouldBeMoving && animationClips && mixer) {
        // Find an idle animation
        let idleAnimation = null;
        for (const [name, clip] of Object.entries(animationClips)) {
          if (name.toLowerCase().includes('idle')) {
            idleAnimation = clip;
            break;
          }
        }

        if (idleAnimation) {
          const newAction = mixer.clipAction(idleAnimation);
          newAction.loop = THREE.LoopRepeat;
          if (currentAction) {
            currentAction.fadeOut(0.3);
          }
          newAction.reset();
          newAction.fadeIn(0.3);
          newAction.play();
          setCurrentAction(newAction);
        }
      }
    }

    // Update camera to follow player from isometric angle
    const { zoomDistance } = useContext(ZoomContext);
    const distance = zoomDistance;
    const height = zoomDistance * 0.75;
    const angle = Math.PI * 0.25; // 45 degree isometric angle
    
    camera.position.x = groupRef.current.position.x + Math.sin(angle) * distance;
    camera.position.y = groupRef.current.position.y + height;
    camera.position.z = groupRef.current.position.z + Math.cos(angle) * distance;
    camera.lookAt(groupRef.current.position.x, groupRef.current.position.y + 0.5, groupRef.current.position.z);
  });
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Placeholder if model hasn't loaded */}
      <mesh ref={placeholderRef} castShadow receiveShadow>
        <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
        <meshStandardMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
    </group>
  );
}

// Ground component with grid
function Ground() {
  return (
    <group>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#00aa00" />
      </mesh>
      
      {/* Grid helper */}
      <gridHelper args={[200, 40, '#ffffff', '#cccccc']} position={[0, 0.01, 0]} />
    </group>
  );
}

// UI overlay
function UI() {
  const { zoomDistance, setZoomDistance } = useContext(ZoomContext);

  const handleZoomIn = () => {
    setZoomDistance(Math.max(zoomDistance - 1, 3));
  };

  const handleZoomOut = () => {
    setZoomDistance(Math.min(zoomDistance + 1, 15));
  };

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      color: '#000',
      backgroundColor: 'rgba(255,255,255,0.95)',
      padding: '20px',
      borderRadius: '8px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 10
    }}>
      <h2 style={{ margin: '0 0 10px 0' }}>Character Demo</h2>
      <p style={{ margin: '5px 0' }}>Use WASD or Arrow Keys to move</p>
      <p style={{ margin: '5px 0' }}>Press Spacebar to jump</p>
      <p style={{ fontSize: '12px', color: '#666', margin: '5px 0' }}>Isometric view - character will walk and face the direction you're moving</p>
      
      <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={handleZoomIn}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔍 Zoom In
        </button>
        <button 
          onClick={handleZoomOut}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🔍 Zoom Out
        </button>
      </div>
    </div>
  );
}

export function MinimalDemo() {
  const [zoomDistance, setZoomDistance] = useState(8);

  return (
    <ZoomContext.Provider value={{ zoomDistance, setZoomDistance }}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <Canvas shadows camera={{ position: [5, 5, 5], near: 0.1, far: 1000 }}>
          <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
          
          <ambientLight intensity={0.8} />
          <directionalLight 
            position={[20, 30, 20]} 
            intensity={1.5}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-50}
            shadow-camera-right={50}
            shadow-camera-top={50}
            shadow-camera-bottom={-50}
          />
          
          <Ground />
          <PlayerCharacter />
        </Canvas>
        <UI />
      </div>
    </ZoomContext.Provider>
  );
}
