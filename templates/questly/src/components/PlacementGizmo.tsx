/**
 * PlacementGizmo - Visual gizmo for manipulating entities (position, rotation, scale)
 * Phase 4.3 - Asset Placement System
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GizmoHelper, GizmoViewport, OrbitControls } from '@react-three/drei';

interface PlacementGizmoProps {
  entity: THREE.Object3D | null;
  onPositionChange?: (position: THREE.Vector3) => void;
  onRotationChange?: (rotation: number) => void;
  onScaleChange?: (scale: number) => void;
  visible?: boolean;
}

export function PlacementGizmo({
  entity,
  onPositionChange,
  onRotationChange,
  onScaleChange,
  visible = true,
}: PlacementGizmoProps) {
  const gizmoRef = useRef<THREE.Group>(null);

  // Update gizmo position to match entity
  useFrame(() => {
    if (gizmoRef.current && entity && visible) {
      gizmoRef.current.position.copy(entity.position);
      gizmoRef.current.visible = true;
    } else if (gizmoRef.current) {
      gizmoRef.current.visible = false;
    }
  });

  if (!entity || !visible) return null;

  return (
    <group ref={gizmoRef}>
      {/* Position arrows */}
      <arrowHelper
        args={[new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2, 0xff0000]}
      />
      <arrowHelper
        args={[new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 2, 0x00ff00]}
      />
      <arrowHelper
        args={[new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2, 0x0000ff]}
      />
      
      {/* Rotation ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.5, 1.6, 32]} />
        <meshBasicMaterial color={0xffff00} side={THREE.DoubleSide} transparent opacity={0.3} />
      </mesh>
    </group>
  );
}
