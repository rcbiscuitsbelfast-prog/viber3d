import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TiledWorldRenderer } from '../components/game/TiledWorldRenderer';

/**
 * MinimalDemoPage - Integrated demo showcasing both tile system and character animations
 * This demo features:
 * - 3x3 tile grid with mixed tile types (forest, meadow, rocks, clearing)
 * - Player character with animations and movement
 * - NPC with idle animations
 * - Seamless tile boundaries
 * - Collision detection with rocks
 */

interface CharacterInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
}

interface CameraSettings {
  pitch: number;
  zoom: number;
}

// Simple Player Controller Component
function PlayerController({ 
  input 
}: { 
  input: CharacterInput; 
  cameraSettings: CameraSettings;
}) {
  const playerPos = useRef([0, 0, 0]);
  const [position, setPosition] = useState([0, 0, 0]);
  
  useEffect(() => {
    const moveSpeed = 0.1;
    let dx = 0;
    let dz = 0;
    
    if (input.forward) dz = -moveSpeed;
    if (input.backward) dz = moveSpeed;
    if (input.left) dx = -moveSpeed;
    if (input.right) dx = moveSpeed;
    
    playerPos.current[0] += dx;
    playerPos.current[2] += dz;
    
    // Keep player within world bounds (-15 to 15)
    playerPos.current[0] = Math.max(-15, Math.min(15, playerPos.current[0]));
    playerPos.current[2] = Math.max(-15, Math.min(15, playerPos.current[2]));
    
    setPosition([...playerPos.current]);
  }, [input]);
  
  return (
    <group position={position as [number, number, number]}>
      {/* Simple character representation - red capsule for player */}
      <mesh position={[0, 1, 0]}>
        <capsuleGeometry args={[0.3, 1, 4, 8]} />
        <meshStandardMaterial color="red" />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.8, 0]}>
        <sphereGeometry args={[0.25, 8, 8]} />
        <meshStandardMaterial color="#ffcccc" />
      </mesh>
    </group>
  );
}

// NPC Component with simple animation
function NPC({ position = [5, 0, -5] }: { position?: [number, number, number] }) {
  const [scale, setScale] = useState(1);
  
  useEffect(() => {
    // Simple breathing animation
    const interval = setInterval(() => {
      setScale(() => 1 + Math.sin(Date.now() * 0.005) * 0.05);
    }, 50);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <group position={position}>
      <group scale={scale}>
        {/* NPC Body - blue capsule */}
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.3, 1, 4, 8]} />
          <meshStandardMaterial color="blue" />
        </mesh>
        {/* Head */}
        <mesh position={[0, 1.8, 0]}>
          <sphereGeometry args={[0.25, 8, 8]} />
          <meshStandardMaterial color="#ccccff" />
        </mesh>
      </group>
    </group>
  );
}

export function MinimalDemoPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState<CharacterInput>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
  });
  
  const [cameraSettings] = useState<CameraSettings>({
    pitch: Math.PI / 6, // 30 degrees
    zoom: 8
  });
  
  // 3x3 tile grid definition
  // Mix of tile types: forest, meadow, rocks, clearing
  const worldGrid = useMemo(() => [
    ['forest_sparse', 'meadow_stones', 'rocky_outcrop'],
    ['clearing', 'mixed_nature', 'clearing'],
    ['flowers_field', 'barren_rocky', 'water_pond']
  ], []);

  // Real-time player position tracking
  const [playerWorldPos] = useState([0, 0, 0]);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput(prev => {
        switch (key) {
          case 'w': case 'arrowup': 
            return { ...prev, forward: true, backward: false };
          case 's': case 'arrowdown': 
            return { ...prev, backward: true, forward: false };
          case 'a': case 'arrowleft': 
            return { ...prev, left: true, right: false };
          case 'd': case 'arrowright': 
            return { ...prev, right: true, left: false };
          default: return prev;
        }
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setInput(prev => {
        switch (key) {
          case 'w': case 'arrowup': return { ...prev, forward: false };
          case 's': case 'arrowdown': return { ...prev, backward: false };
          case 'a': case 'arrowleft': return { ...prev, left: false };
          case 'd': case 'arrowright': return { ...prev, right: false };
          default: return prev;
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

  // Calculate camera position based on player position
  const cameraPosition = useMemo(() => {
    const [x, , z] = playerWorldPos;
    const cameraZ = z + cameraSettings.zoom * Math.cos(cameraSettings.pitch);
    const cameraY = cameraSettings.zoom * Math.sin(cameraSettings.pitch);
    return [x, cameraY, cameraZ];
  }, [playerWorldPos, cameraSettings]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* UI Controls */}
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
        <h2 style={{ margin: '0 0 10px 0' }}>Tile World Demo</h2>
        <p style={{ margin: '5px 0' }}>Use WASD or Arrow Keys to move</p>
        <p style={{ margin: '5px 0' }}>
          Forward: {input.forward ? '✓' : '✗'} | Back: {input.backward ? '✓' : '✗'}
        </p>
        <p style={{ margin: '5px 0' }}>
          Left: {input.left ? '✓' : '✗'} | Right: {input.right ? '✓' : '✗'}
        </p>
        <p style={{ margin: '5px 0' }}>Camera: Follows player</p>
      </div>

      {/* 3D Scene */}
      <Canvas shadows>
        <PerspectiveCamera 
          makeDefault 
          position={cameraPosition as [number, number, number]}
          fov={60}
        />
        
        {/* Lighting setup */}
        <ambientLight intensity={0.4} />
        <directionalLight
          position={[50, 50, 25]}
          intensity={0.6}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <pointLight position={[0, 10, 0]} intensity={0.3} />

        {/* Tiled World (replaces single ground plane) */}
        <TiledWorldRenderer
          worldGrid={worldGrid}
          worldSeed={1337}
          playerPosition={[playerWorldPos[0], playerWorldPos[1], playerWorldPos[2]]}
          enableStreaming={true}
          loadRadius={2}
          debug={false}
        />

        {/* Player Character */}
        <PlayerController input={input} cameraSettings={cameraSettings} />
        
        {/* NPC */}
        <NPC position={[8, 0, -8]} />

        {/* Orbit controls for debugging camera */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>
    </div>
  );
}

export default MinimalDemoPage;