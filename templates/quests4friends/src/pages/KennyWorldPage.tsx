// Kenny World Page - Build worlds using saved Kenny block creations
// This is similar to KennyBlocksPage but uses saved block groups as placeable assets

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as LZString from 'lz-string';

// IndexedDB helpers (shared pattern)
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

export function KennyWorld() {
  const navigate = useNavigate();
  const [savedBlocks, setSavedBlocks] = useState<string[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [placedAssets, setPlacedAssets] = useState<Array<{
    id: string;
    blockName: string;
    position: [number, number, number];
    rotation: number;
    scale: number;
  }>>([]);
  const [eraseMode, setEraseMode] = useState(false);
  const eraseBrushSize = 2;
  const [zoomDistance, setZoomDistance] = useState(20);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [worldName, setWorldName] = useState('');

  // Load saved Kenny blocks from metadata (works when GLB lives in IndexedDB)
  useEffect(() => {
    const blocks = Object.keys(localStorage)
      .filter(key => key.startsWith('kenny_blocks_') && !key.startsWith('kenny_blocks_glb_'))
      .map(key => key.replace('kenny_blocks_', ''));
    console.log('Found saved block groups:', blocks);
    setSavedBlocks(blocks);
  }, []);

  const makeId = () => `asset-${Date.now()}-${Math.random()}`;

  const handlePlaceAsset = useCallback((data: { position: [number, number, number]; rotation: number; scale: number }) => {
    if (!selectedBlock) return;
    setPlacedAssets(prev => [...prev, {
      id: makeId(),
      blockName: selectedBlock,
      ...data,
    }]);
  }, [selectedBlock]);

  const handleEraseAsset = useCallback((id: string) => {
    setPlacedAssets(prev => prev.filter(asset => asset.id !== id));
  }, []);

  const handleSave = () => {
    setShowSaveDialog(true);
  };

  const handleSaveConfirm = () => {
    if (!worldName.trim()) {
      alert('Please enter a world name');
      return;
    }

    const worldData = {
      assets: placedAssets,
      createdAt: new Date().toISOString(),
      version: '1.0',
    };

    try {
      localStorage.setItem(`kenny_world_${worldName.trim()}`, JSON.stringify(worldData));
      setShowSaveDialog(false);
      setWorldName('');
      alert(`World "${worldName.trim()}" saved successfully!`);
    } catch (e) {
      console.error('Error saving world:', e);
      alert('Error saving world');
    }
  };

  const handleLoad = () => {
    const worlds = Object.keys(localStorage)
      .filter(key => key.startsWith('kenny_world_'))
      .map(key => key.replace('kenny_world_', ''));
    
    if (worlds.length === 0) {
      alert('No saved worlds found');
      return;
    }

    const worldToLoad = prompt(`Enter world name to load:\n${worlds.join(', ')}`);
    if (!worldToLoad) return;

    const worldData = localStorage.getItem(`kenny_world_${worldToLoad}`);
    if (worldData) {
      try {
        const parsed = JSON.parse(worldData);
        setPlacedAssets(parsed.assets || []);
        alert(`World "${worldToLoad}" loaded!`);
      } catch (error) {
        console.error('Error loading world:', error);
        alert('Error loading world');
      }
    }
  };

  const handleNew = () => {
    if (confirm('Create new world? This will clear all placed assets.')) {
      setPlacedAssets([]);
      setSelectedBlock(null);
      setEraseMode(false);
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
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        ← Back
      </button>

      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.75)',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '15px',
        display: 'flex',
        gap: '10px',
      }}>
        <button onClick={handleNew} style={buttonStyle}>New</button>
        <button onClick={handleSave} style={buttonStyle}>Save</button>
        <button onClick={handleLoad} style={buttonStyle}>Load</button>
        <button 
          onClick={() => { setEraseMode(!eraseMode); setSelectedBlock(null); }}
          style={{ ...buttonStyle, background: eraseMode ? '#e74c3c' : '#555' }}
        >
          {eraseMode ? '✓ Erase' : 'Erase'}
        </button>
      </div>

      {/* Saved Blocks Panel */}
      <div style={{
        position: 'absolute',
        top: '90px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.85)',
        border: '1px solid #555',
        borderRadius: '8px',
        padding: '15px',
        maxWidth: '300px',
        maxHeight: '70vh',
        overflow: 'auto',
      }}>
        <h3 style={{ color: 'white', marginBottom: '10px', fontSize: '18px' }}>Saved Blocks</h3>
        {savedBlocks.length === 0 && (
          <p style={{ color: '#888', fontSize: '14px' }}>No saved blocks yet. Create some in Kenny Blocks!</p>
        )}
        {savedBlocks.map(blockName => (
          <button
            key={blockName}
            onClick={() => { setSelectedBlock(blockName); setEraseMode(false); }}
            style={{
              ...blockButtonStyle,
              background: selectedBlock === blockName ? '#3498db' : '#555',
            }}
          >
            {blockName}
          </button>
        ))}
      </div>

      {/* Zoom Control */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        right: '20px',
        zIndex: 10,
        background: 'rgba(0,0,0,0.75)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
      }}>
        <label style={{ fontSize: '14px' }}>Zoom: {zoomDistance.toFixed(1)}m</label>
        <input
          type="range"
          min="10"
          max="50"
          step="1"
          value={zoomDistance}
          onChange={(e) => setZoomDistance(Number(e.target.value))}
          style={{ width: '150px', marginLeft: '10px' }}
        />
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 20,
          background: '#222',
          border: '2px solid #555',
          borderRadius: '10px',
          padding: '30px',
          minWidth: '400px',
        }}>
          <h3 style={{ color: 'white', marginBottom: '20px' }}>Save World</h3>
          <input
            type="text"
            value={worldName}
            onChange={(e) => setWorldName(e.target.value)}
            placeholder="Enter world name..."
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '20px',
              borderRadius: '5px',
              border: '1px solid #555',
              background: '#333',
              color: 'white',
              fontSize: '16px',
            }}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleSaveConfirm} style={{ ...buttonStyle, flex: 1 }}>Save</button>
            <button onClick={() => setShowSaveDialog(false)} style={{ ...buttonStyle, flex: 1, background: '#666' }}>Cancel</button>
          </div>
        </div>
      )}

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 20, 20]} />
        <OrbitControls 
          target={[0, 0, 0]}
          minDistance={10}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
        
        <SimpleGround />
        
        <group>
          {placedAssets.map(asset => (
            <PlacedBlockGroup
              key={asset.id}
              blockName={asset.blockName}
              position={asset.position}
              rotation={asset.rotation}
              scale={asset.scale}
            />
          ))}
        </group>

        <ClickHandler
          selectedBlock={selectedBlock}
          eraseMode={eraseMode}
          eraseBrushSize={eraseBrushSize}
          placedAssets={placedAssets}
          onPlaceAsset={handlePlaceAsset}
          onEraseAsset={handleEraseAsset}
        />
      </Canvas>
    </div>
  );
}

// Simple ground plane
function SimpleGround() {
  return (
    <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[100, 100]} />
      <meshStandardMaterial color="#3d6b2d" />
    </mesh>
  );
}

// Placed block group component
function PlacedBlockGroup({ blockName, position, rotation, scale }: {
  blockName: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [mesh, setMesh] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const load = async () => {
      console.log(`Attempting to load block group: ${blockName}`);
      const glbData = await getGlbFromDb(`kenny_blocks_glb_${blockName}`);
      if (!glbData) {
        console.error(`No GLB data found for block: ${blockName}`);
        console.log('Available localStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('kenny_blocks')));
        return;
      }

      try {
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
            console.log(`Loaded block group: ${blockName}`);
            setMesh(gltf.scene);
          },
          (error) => console.error('Error loading block group:', error)
        );
      } catch (error) {
        console.error(`Error parsing GLB for ${blockName}:`, error);
      }
    };

    load();
  }, [blockName]);

  if (!mesh) {
    return (
      <group ref={groupRef} position={position} rotation={[0, rotation, 0]} scale={scale}>
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color="#888" />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} position={position} rotation={[0, rotation, 0]} scale={scale}>
      <primitive object={mesh.clone()} />
    </group>
  );
}

// Click handler for placement
function ClickHandler({ selectedBlock, eraseMode, eraseBrushSize, placedAssets, onPlaceAsset, onEraseAsset }: {
  selectedBlock: string | null;
  eraseMode: boolean;
  eraseBrushSize: number;
  placedAssets: Array<{ id: string; position: [number, number, number] }>;
  onPlaceAsset: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onEraseAsset: (id: string) => void;
}) {
  const { camera, raycaster, pointer } = useThree();
  const groundPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button !== 0) return;

      raycaster.setFromCamera(pointer, camera);
      const worldPos = new THREE.Vector3();
      raycaster.ray.intersectPlane(groundPlane.current, worldPos);

      if (!worldPos || Math.abs(worldPos.x) > 50 || Math.abs(worldPos.z) > 50) return;

      if (eraseMode) {
        const toErase: string[] = [];
        placedAssets.forEach(asset => {
          const dx = asset.position[0] - worldPos.x;
          const dz = asset.position[2] - worldPos.z;
          if (Math.sqrt(dx * dx + dz * dz) < eraseBrushSize) {
            toErase.push(asset.id);
          }
        });
        toErase.forEach(onEraseAsset);
      } else if (selectedBlock) {
        onPlaceAsset({
          position: [worldPos.x, 0, worldPos.z],
          rotation: 0,
          scale: 1.0,
        });
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [selectedBlock, eraseMode, eraseBrushSize, placedAssets, camera, raycaster, pointer, onPlaceAsset, onEraseAsset]);

  return null;
}

const buttonStyle: React.CSSProperties = {
  padding: '8px 16px',
  background: '#555',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: 'bold',
};

const blockButtonStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  marginBottom: '8px',
  background: '#555',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px',
  textAlign: 'left',
};
