import { Suspense } from 'react';
import { Plane } from '@react-three/drei';
import { WaterCoastlineShader, WaterCoastlineProps } from './WaterCoastlineShader';

export type ShorelineBlendPlaneProps = WaterCoastlineProps & {
  size?: number;
  shorelineBlend?: number;
  position?: [number, number, number];
};

/**
 * Plane with stronger foam band for shoreline blending.
 */
export function ShorelineBlendPlane({
  size = 220,
  shorelineBlend = 3.0,
  position = [0, 0, 0],
  ...shaderProps
}: ShorelineBlendPlaneProps) {
  return (
    <Suspense fallback={null}>
      <Plane args={[size, size, 1, 1]} position={position} rotation={[-Math.PI / 2, 0, 0]}>
        <WaterCoastlineShader shorelineBlend={shorelineBlend} foamIntensity={shaderProps.foamIntensity ?? 1.0} {...shaderProps} />
      </Plane>
    </Suspense>
  );
}
