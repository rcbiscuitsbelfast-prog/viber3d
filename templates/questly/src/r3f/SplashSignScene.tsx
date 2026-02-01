// Splash Sign Scene - Fixed sign and text (doesn't rotate with island)
// Rendered in its own scene with fixed camera

import { Suspense } from 'react';
import { Clouds, Cloud } from '@react-three/drei';
import AnimatedCharacter from './AnimatedCharacter';
import { Font3DText } from './Font3DText';

interface SplashSignSceneProps {
  scale?: number;
  signPos?: [number, number, number];
  textPos?: [number, number, number];
  textSize?: number;
  bevelSize?: number;
  lightIntensity?: number;
  cloudsEnabled?: boolean;
  cloudsY?: number;
  cloudsZ?: number;
  cloudsScale?: number;
  cloudsOpacity?: number;
  cloudsSpeed?: number;
}

export function SplashSignScene({ 
  scale = 3,
  signPos = [0.01, 0.21, 0.41],
  textPos = [0.01, 0.62, 1.24],
  textSize = 0.32,
  bevelSize = 0.014,
  lightIntensity = 2.0,
  cloudsEnabled = false,
  cloudsY = 1.2,
  cloudsZ = -12,
  cloudsScale = 5.0,
  cloudsOpacity = 0.6,
  cloudsSpeed = 0.2
}: SplashSignSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.2 + lightIntensity} />
      <directionalLight position={[5, 8, 6]} intensity={1.4 + lightIntensity} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.8 + lightIntensity} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />

      {/* Clouds - horizontal band across the screen at sign/title height */}
      {cloudsEnabled && (
        <Clouds limit={9}>
          <Cloud position={[-14, cloudsY, cloudsZ]} speed={cloudsSpeed} opacity={cloudsOpacity} scale={cloudsScale * 1.35} />
          <Cloud position={[-10, cloudsY, cloudsZ + 0.4]} speed={cloudsSpeed * 0.98} opacity={cloudsOpacity} scale={cloudsScale * 1.2} />
          <Cloud position={[-6, cloudsY, cloudsZ + 0.7]} speed={cloudsSpeed * 0.96} opacity={cloudsOpacity} scale={cloudsScale * 1.05} />
          <Cloud position={[-2, cloudsY, cloudsZ + 1]} speed={cloudsSpeed * 0.94} opacity={cloudsOpacity} scale={cloudsScale * 0.9} />
          <Cloud position={[2, cloudsY, cloudsZ + 1]} speed={cloudsSpeed * 0.94} opacity={cloudsOpacity} scale={cloudsScale * 0.9} />
          <Cloud position={[6, cloudsY, cloudsZ + 0.7]} speed={cloudsSpeed * 0.96} opacity={cloudsOpacity} scale={cloudsScale * 1.05} />
          <Cloud position={[10, cloudsY, cloudsZ + 0.4]} speed={cloudsSpeed * 0.98} opacity={cloudsOpacity} scale={cloudsScale * 1.2} />
          <Cloud position={[14, cloudsY, cloudsZ]} speed={cloudsSpeed} opacity={cloudsOpacity} scale={cloudsScale * 1.35} />
        </Clouds>
      )}

      {/* Sign and Text */}
      <Suspense fallback={null}>
        <group scale={scale} position={[0, 0, 0]}>
          {/* Ornate Wooden Sign - loads FIRST to appear FIRST */}
          <group scale={1} position={signPos}>
            <AnimatedCharacter
              characterPath="/Assets/button/ornate+wooden+sign+3d+model.glb"
              assetId="ornate_wooden_sign"
              characterId="splash-ornate-sign"
              scale={1}
              position={[0, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              autoScale={false}
            />
          </group>

          {/* 3D Text - Questerly - Gold color, no texture - loads SECOND to appear SECOND */}
          <Font3DText
            text="Questerly"
            position={textPos}
            color="#FFD700"
            size={textSize}
            height={0.420}
            bevelEnabled={true}
            bevelSize={bevelSize}
            bevelThickness={0.050}
            bevelSegments={3}
            curveSegments={3}
            fontUrl="/fonts/gentilis_regular.typeface.json"
            materialType="standard"
            edgeColor="#B8860B"
            outlineEnabled={false}
            rotation={[0, 0, 0]}
          />
        </group>
      </Suspense>
    </>
  );
}
