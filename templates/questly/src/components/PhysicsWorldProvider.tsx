// Physics World Provider - Initializes Cannon-ES physics world
// Can be used to add terrain and character physics bodies

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePhysicsWorld } from '../systems/physics/PhysicsWorld';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

interface PhysicsWorldProviderProps {
  children: React.ReactNode;
  terrainMeshRef?: React.RefObject<THREE.Mesh>;
  enablePhysics?: boolean;
}

export function PhysicsWorldProvider({ 
  children, 
  terrainMeshRef,
  enablePhysics = false 
}: PhysicsWorldProviderProps) {
  const physics = usePhysicsWorld({ gravity: [0, -9.82, 0] });
  const terrainBodyRef = useRef<CANNON.Body | null>(null);

  // Initialize terrain physics body when terrain mesh is ready
  useEffect(() => {
    if (!enablePhysics || !terrainMeshRef?.current || !physics.world) return;

    const terrainMesh = terrainMeshRef.current;
    const geometry = terrainMesh.geometry as THREE.BufferGeometry;
    
    // Get height data from geometry if available
    const positionAttribute = geometry.getAttribute('position');
    if (positionAttribute && positionAttribute.count > 0) {
      // Extract height data for heightfield
      const positions = positionAttribute.array as Float32Array;
      const resolution = Math.sqrt(positionAttribute.count);
      
      // Create height data array
      const heightData = new Float32Array(resolution * resolution);
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const idx = i * resolution + j;
          const posIdx = idx * 3 + 1; // Y component
          heightData[idx] = positions[posIdx] || 0;
        }
      }

      // Add terrain body
      const terrainBody = physics.addTerrainBody(
        terrainMesh,
        heightData,
        200, // terrain size
        resolution
      );
      
      terrainBodyRef.current = terrainBody;
    }
  }, [enablePhysics, terrainMeshRef, physics]);

  return <>{children}</>;
}
