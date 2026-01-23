'use client';

import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';
import { r3f } from '../../helpers/global';
import * as THREE from 'three';

export default function Scene({ ...props }) {
  return (
    <Canvas
      {...props}
      onCreated={(state) => (state.gl.toneMapping = THREE.AgXToneMapping)}
      gl={{
        antialias: true,
        outputColorSpace: 'srgb',
        toneMapping: THREE.NoToneMapping,
      }}
    >
      <r3f.Out />
      <Preload all />
    </Canvas>
  );
}