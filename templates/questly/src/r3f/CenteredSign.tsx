// CenteredSign - Normalizes sign model pivot and provides bounding box info
import { useRef, useEffect, useState } from 'react';
import { Group, Box3, Vector3 } from 'three';
import { useGLTF } from '@react-three/drei';
import { resolveAssetPath } from '@/lib/paths';

interface CenteredSignProps {
  onBoundsCalculated?: (bounds: { min: Vector3; max: Vector3; center: Vector3; size: Vector3 }) => void;
}

export function CenteredSign({ onBoundsCalculated }: CenteredSignProps) {
  const groupRef = useRef<Group>(null);
  const [boundsCalculated, setBoundsCalculated] = useState(false);
  
  // Load the sign model
  const { scene } = useGLTF(resolveAssetPath('/Assets/button/ornate+wooden+sign+3d+model.glb'));

  useEffect(() => {
    if (!groupRef.current || boundsCalculated) return;

    // Calculate bounding box of the sign model
    const box = new Box3().setFromObject(groupRef.current);
    const center = new Vector3();
    const size = new Vector3();
    box.getCenter(center);
    box.getSize(size);

    // Notify parent of bounds
    if (onBoundsCalculated) {
      onBoundsCalculated({
        min: box.min.clone(),
        max: box.max.clone(),
        center: center.clone(),
        size: size.clone(),
      });
    }

    setBoundsCalculated(true);
  }, [boundsCalculated, onBoundsCalculated]);

  return (
    <group ref={groupRef}>
      <primitive 
        object={scene.clone()} 
        rotation={[0, Math.PI / 2, 0]}
      />
    </group>
  );
}

// Preload the model
useGLTF.preload(resolveAssetPath('/Assets/button/ornate+wooden+sign+3d+model.glb'));
