import { Suspense } from 'react';
import { Plane } from '@react-three/drei';
import { WaterCoastlineShader, WaterCoastlineProps } from './WaterCoastlineShader';

export type BackgroundWaterProps = WaterCoastlineProps & {
  size?: number;
  distance?: number;
};

/**
 * Large, low-contrast background water for skyboxes/backdrops.
 */
export function BackgroundWater({
  size = 2000,
  distance = -50,
  ...shaderProps
}: BackgroundWaterProps) {
  return (
    <Suspense fallback={null}>
      <Plane args={[size, size, 1, 1]} position={[0, distance, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <WaterCoastlineShader backgroundMode {...shaderProps} foamIntensity={shaderProps.foamIntensity ?? 0.25} waveHeight={shaderProps.waveHeight ?? 0.05} />
      </Plane>
    </Suspense>
  );
}
