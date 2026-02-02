// Splash Sign Scene - Fixed sign and text (doesn't rotate with island)
// Rendered in its own scene with fixed camera
// Uses geometry-based positioning for deterministic alignment

import { Suspense, useState, useMemo } from 'react';
import { Vector3 } from 'three';
import { CenteredSign } from './CenteredSign';
import { Font3DText } from './Font3DText';
import { resolveAssetPath } from '@/lib/paths';

interface SplashSignSceneProps {
  scale?: number;
  lightIntensity?: number;
  dragRotation?: [number, number, number];
  signOffsetY?: number; // Moves sign up/down without moving text
  textOffsetZ?: number; // Moves text forward/back on Z-axis
}

export function SplashSignScene({ 
  scale = 3,
  lightIntensity = 2.0,
  dragRotation = [0, 0, 0],
  signOffsetY = 0,
  textOffsetZ = 0,
}: SplashSignSceneProps) {
  const [signBounds, setSignBounds] = useState<{
    min: Vector3;
    max: Vector3;
    center: Vector3;
    size: Vector3;
  } | null>(null);

  // Compute positions based on sign geometry
  const positions = useMemo(() => {
    if (!signBounds) {
      // Default fallback positions while bounds are calculating
      return {
        signPos: [0, 0, 0] as [number, number, number],
        textPos: [0, 0.3, -0.18] as [number, number, number],
      };
    }

    // Center the sign at origin on X and Z, keep original Y
    const signPos: [number, number, number] = [
      -signBounds.center.x,
      -signBounds.center.y + signOffsetY,
      -signBounds.center.z,
    ];

    // Text at fixed position (not relative to sign)
    const textPos: [number, number, number] = [0, 0.3, -0.18 + textOffsetZ];

    return { signPos, textPos };
  }, [signBounds, signOffsetY, textOffsetZ]);

  const textSize = 0.11;
  const bevelSize = 0.003;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.2 + lightIntensity} />
      <directionalLight position={[5, 8, 6]} intensity={1.4 + lightIntensity} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.8 + lightIntensity} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />

      {/* Sign and Text - geometry-based positioning */}
      <Suspense fallback={null}>
        <group scale={scale} rotation={dragRotation}>
          {/* Centered Sign with normalized pivot */}
          <group position={positions.signPos}>
            <CenteredSign onBoundsCalculated={setSignBounds} />
          </group>

          {/* 3D Text - Questerly - positioned above sign */}
          {signBounds && (
            <Font3DText
              text="Questerly"
              position={positions.textPos}
              color="#FFD700"
              size={textSize}
              height={0.420}
              bevelEnabled={true}
              bevelSize={bevelSize}
              bevelThickness={0.050}
              bevelSegments={3}
              curveSegments={3}
              fontUrl={resolveAssetPath('/fonts/gentilis_regular.typeface.json')}
              materialType="standard"
              edgeColor="#B8860B"
              outlineEnabled={false}
              rotation={[0, 0, 0]}
            />
          )}
        </group>
      </Suspense>
    </>
  );
}
