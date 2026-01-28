import React, { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

interface ModularCastleProps {
  position: [number, number, number];
  rotation?: number;
  scale?: number;
}

// Castle component using KayKit Medieval Hexagon Pack castle assets
export default function ModularCastle({ 
  position, 
  rotation = 0,
  scale = 1 
}: ModularCastleProps) {
  const basePath = '/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/';
  const bluePath = '/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/blue/';
  
  // Load actual castle assets from KayKit Medieval Hexagon Pack
  const castleMain = useGLTF(`${bluePath}building_castle_blue.gltf`);
  const towerA = useGLTF(`${bluePath}building_tower_A_blue.gltf`);
  const towerB = useGLTF(`${bluePath}building_tower_B_blue.gltf`);
  const towerBase = useGLTF(`${bluePath}building_tower_base_blue.gltf`);
  
  // Castle walls from neutral set
  const wallStraight = useGLTF(`${basePath}wall_straight.gltf`);
  const wallCornerA = useGLTF(`${basePath}wall_corner_A_outside.gltf`);
  const wallCornerB = useGLTF(`${basePath}wall_corner_B_outside.gltf`);
  const wallGate = useGLTF(`${basePath}wall_straight_gate.gltf`);
  const wallCornerGate = useGLTF(`${basePath}wall_corner_A_gate.gltf`);
  
  // Clone functions to avoid mutating original models
  const clone = (scene: THREE.Object3D) => {
    return scene.clone();
  };

  // Castle dimensions (hexagonal units)
  const hexUnit = 3 * scale; // Hexagonal spacing
  
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main Castle Building - Central Keep */}
      <primitive 
        object={clone(castleMain.scene)} 
        position={[0, 0, 0]}
        scale={scale * 1.2}
      />

      {/* Castle Walls - Hexagonal perimeter */}
      <group position={[0, 0, 0]}>
        {/* Front walls */}
        <primitive 
          object={clone(wallCornerA.scene)} 
          position={[-hexUnit * 2, 0, -hexUnit * 2]}
          rotation={[0, Math.PI / 3, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[-hexUnit, 0, -hexUnit * 2.5]}
          rotation={[0, 0, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallGate.scene)} 
          position={[0, 0, -hexUnit * 2.5]}
          rotation={[0, 0, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[hexUnit, 0, -hexUnit * 2.5]}
          rotation={[0, 0, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallCornerA.scene)} 
          position={[hexUnit * 2, 0, -hexUnit * 2]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={scale}
        />
        
        {/* Side walls */}
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[-hexUnit * 2.5, 0, -hexUnit]}
          rotation={[0, Math.PI / 2, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[-hexUnit * 2.5, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[-hexUnit * 2.5, 0, hexUnit]}
          rotation={[0, Math.PI / 2, 0]}
          scale={scale}
        />
        
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[hexUnit * 2.5, 0, -hexUnit]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[hexUnit * 2.5, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[hexUnit * 2.5, 0, hexUnit]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={scale}
        />
        
        {/* Back walls */}
        <primitive 
          object={clone(wallCornerA.scene)} 
          position={[-hexUnit * 2, 0, hexUnit * 2]}
          rotation={[0, -Math.PI / 3, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[-hexUnit, 0, hexUnit * 2.5]}
          rotation={[0, Math.PI, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[0, 0, hexUnit * 2.5]}
          rotation={[0, Math.PI, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallStraight.scene)} 
          position={[hexUnit, 0, hexUnit * 2.5]}
          rotation={[0, Math.PI, 0]}
          scale={scale}
        />
        <primitive 
          object={clone(wallCornerA.scene)} 
          position={[hexUnit * 2, 0, hexUnit * 2]}
          rotation={[0, Math.PI / 3, 0]}
          scale={scale}
        />
      </group>

      {/* Corner Defense Towers */}
      <group position={[0, 0, 0]}>
        {/* Front-left tower */}
        <primitive 
          object={clone(towerA.scene)} 
          position={[-hexUnit * 2.5, 0, -hexUnit * 2.5]}
          scale={scale * 1.1}
        />
        
        {/* Front-right tower */}
        <primitive 
          object={clone(towerB.scene)} 
          position={[hexUnit * 2.5, 0, -hexUnit * 2.5]}
          scale={scale * 1.1}
        />
        
        {/* Back-left tower */}
        <primitive 
          object={clone(towerA.scene)} 
          position={[-hexUnit * 2.5, 0, hexUnit * 2.5]}
          scale={scale * 1.1}
        />
        
        {/* Back-right tower */}
        <primitive 
          object={clone(towerB.scene)} 
          position={[hexUnit * 2.5, 0, hexUnit * 2.5]}
          scale={scale * 1.1}
        />
      </group>

      {/* Additional tower bases for fortification */}
      <group position={[0, 0, 0]}>
        <primitive 
          object={clone(towerBase.scene)} 
          position={[0, 0, -hexUnit * 3]}
          scale={scale * 0.9}
        />
        <primitive 
          object={clone(towerBase.scene)} 
          position={[-hexUnit * 3, 0, 0]}
          rotation={[0, Math.PI / 2, 0]}
          scale={scale * 0.9}
        />
        <primitive 
          object={clone(towerBase.scene)} 
          position={[hexUnit * 3, 0, 0]}
          rotation={[0, -Math.PI / 2, 0]}
          scale={scale * 0.9}
        />
      </group>
    </group>
  );
}

// Preload all castle models from KayKit Medieval Hexagon Pack
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/blue/building_castle_blue.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/blue/building_tower_A_blue.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/blue/building_tower_B_blue.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/blue/building_tower_base_blue.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/wall_straight.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/wall_corner_A_outside.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/wall_corner_B_outside.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/wall_straight_gate.gltf');
useGLTF.preload('/Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/Assets/gltf/buildings/neutral/wall_corner_A_gate.gltf');
