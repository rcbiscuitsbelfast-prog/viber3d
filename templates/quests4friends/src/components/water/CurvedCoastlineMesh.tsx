import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { WaterCoastlineShader, WaterCoastlineProps } from './WaterCoastlineShader';

export type CurvedCoastlineMeshProps = WaterCoastlineProps & {
  innerRadius?: number;
  outerRadius?: number;
  segments?: number;
  position?: [number, number, number];
};

/**
 * A thin ring mesh to approximate a curved coastline (e.g., bays or round islands).
 */
export function CurvedCoastlineMesh({
  innerRadius = 40,
  outerRadius = 120,
  segments = 128,
  position = [0, 0, 0],
  ...shaderProps
}: CurvedCoastlineMeshProps) {
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, outerRadius, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, innerRadius, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    const geo = new THREE.ShapeGeometry(shape, segments);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, [innerRadius, outerRadius, segments]);

  return (
    <Suspense fallback={null}>
      <mesh geometry={geometry} position={position} receiveShadow>
        <WaterCoastlineShader {...shaderProps} />
      </mesh>
    </Suspense>
  );
}
