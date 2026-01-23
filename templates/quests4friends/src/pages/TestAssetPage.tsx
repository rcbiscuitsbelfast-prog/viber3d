import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import React, { useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

function TestAsset() {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/Assets/kenney_platformer-kit/Models/GLB format/tree.glb',
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(1.0);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.depthTest = false;
            child.material.depthWrite = false;
          }
        });
        setScene(cloned);
      },
      undefined,
      (error) => console.error('Failed to load tree:', error)
    );
  }, []);

  useEffect(() => {
    if (scene && groupRef.current) {
      // groupRef.current.renderOrder = 10;
    }
  }, [scene]);

  return (
    <group ref={groupRef} position={[0, 2, 0]}>
      {scene && <primitive object={scene} />}
    </group>
  );
}

function TestBlock() {
  const groupRef = useRef<THREE.Group>(null);
  const [scene, setScene] = useState<THREE.Group | null>(null);

  useEffect(() => {
    const loader = new GLTFLoader();
    loader.load(
      '/Assets/kenney_platformer-kit/Models/GLB format/block_corner.glb',
      (gltf) => {
        const cloned = gltf.scene.clone();
        cloned.scale.setScalar(1.0);
        cloned.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            child.material.depthTest = true;
            child.material.depthWrite = true;
          }
        });
        setScene(cloned);
      },
      undefined,
      (error) => console.error('Failed to load block:', error)
    );
  }, []);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {scene && <primitive object={scene} />}
    </group>
  );
}

export function TestAssetPage() {
  const [zoomDistance, setZoomDistance] = useState(8);
  const [cameraRotation, setCameraRotation] = useState(Math.PI / 4);
  const [cameraPitch, setCameraPitch] = useState(0.6);
  const controlsRef = useRef<any>(null);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Camera Controls */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          background: 'rgba(0,0,0,0.85)',
          border: '1px solid #555',
          borderRadius: '8px',
          padding: '15px',
          color: 'white',
          width: '200px',
        }}
      >
        <h3 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>🎥 Camera Controls</h3>
        
        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Zoom: {zoomDistance.toFixed(1)}
          </label>
          <input
            type="range"
            min="3"
            max="20"
            step="0.5"
            value={zoomDistance}
            onChange={(e) => setZoomDistance(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Rotation: {(cameraRotation * 180 / Math.PI).toFixed(0)}°
          </label>
          <input
            type="range"
            min="0"
            max={Math.PI * 2}
            step="0.1"
            value={cameraRotation}
            onChange={(e) => setCameraRotation(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '10px' }}>
          <label style={{ fontSize: '12px', display: 'block', marginBottom: '5px' }}>
            Pitch: {cameraPitch.toFixed(2)}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.5"
            step="0.05"
            value={cameraPitch}
            onChange={(e) => setCameraPitch(parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <button
          onClick={() => {
            setZoomDistance(8);
            setCameraRotation(Math.PI / 4);
            setCameraPitch(0.6);
          }}
          style={{
            width: '100%',
            padding: '8px',
            background: '#3498db',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: 'bold',
          }}
        >
          Reset Camera
        </button>
      </div>

      <Canvas 
        shadows
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{
          antialias: true,
          outputColorSpace: 'srgb',
          toneMapping: THREE.NoToneMapping,
        }}
      >
        <OrbitControls 
          ref={controlsRef}
          enableDamping
          dampingFactor={0.05}
          target={[0, 0, 0]}
        />
        
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 20, 10]} intensity={1.2} castShadow />
        
        <TestBlock />
        <TestAsset />
      </Canvas>
    </div>
  );
}