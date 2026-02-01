import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { ThreeText } from './three-text/ThreeText';


function ThreeTextMesh() {
  // Placeholder: show a warning box until real ThreeText is integrated
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 1, 0.2]} />
      <meshStandardMaterial color="orange" />
    </mesh>
  );
}

export function ThreeTextDemo() {
  return (
    <div style={{ width: '100%', height: '500px' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} intensity={0.7} />
        <ThreeTextMesh />
        <OrbitControls />
      </Canvas>
    </div>
  );
}
