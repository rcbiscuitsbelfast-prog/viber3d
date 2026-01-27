/**
 * SelectionBox - Visual box for multi-select
 * Phase 4.3 - Asset Placement System
 */

import { useMemo } from 'react';
import * as THREE from 'three';

interface SelectionBoxProps {
  start: THREE.Vector2;
  end: THREE.Vector2;
  visible: boolean;
}

export function SelectionBox({ start, end, visible }: SelectionBoxProps) {
  const geometry = useMemo(() => {
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // Convert screen coordinates to normalized device coordinates
    const ndcX = (centerX / window.innerWidth) * 2 - 1;
    const ndcY = -(centerY / window.innerHeight) * 2 + 1;
    const ndcWidth = (width / window.innerWidth) * 2;
    const ndcHeight = (height / window.innerHeight) * 2;

    return new THREE.PlaneGeometry(ndcWidth, ndcHeight);
  }, [start, end]);

  if (!visible) return null;

  return (
    <mesh geometry={geometry} position={[0, 0, 0]}>
      <meshBasicMaterial
        color={0x00aaff}
        transparent
        opacity={0.2}
        side={THREE.DoubleSide}
      />
      <lineSegments>
        <edgesGeometry args={[geometry]} />
        <lineBasicMaterial color={0x00aaff} />
      </lineSegments>
    </mesh>
  );
}
