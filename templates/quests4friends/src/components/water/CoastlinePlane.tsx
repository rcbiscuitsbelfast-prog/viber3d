import React, { Suspense } from 'react';
import { Plane } from '@react-three/drei';
import { WaterCoastlineShader, WaterCoastlineProps } from './WaterCoastlineShader';

export type CoastlinePlaneProps = WaterCoastlineProps & {
  size?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
};

/**
 * Flat coastline demo: drop this in your scene to render an island-like water plane.
 */
export function CoastlinePlane({
  size = 200,
  position = [0, 0, 0],
  rotation = [-Math.PI / 2, 0, 0],
  ...shaderProps
}: CoastlinePlaneProps) {
  return (
    <Suspense fallback={null}>
      <Plane args={[size, size, 1, 1]} position={position} rotation={rotation} receiveShadow>
        <WaterCoastlineShader {...shaderProps} />
      </Plane>
    </Suspense>
  );
}
