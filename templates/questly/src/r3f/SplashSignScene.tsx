// Splash Sign Scene - Fixed sign and text (doesn't rotate with island)
// Rendered in its own scene with fixed camera

import { Suspense } from 'react';
import AnimatedCharacter from './AnimatedCharacter';
import { Font3DText } from './Font3DText';
import { resolveAssetPath } from '@/lib/paths';

// Simple group wrapper - no fade animations
function FadeGroup({ 
  opacity, 
  position = [0, 0, 0],
  children 
}: { 
  opacity: number; 
  position?: [number, number, number];
  children: React.ReactNode;
}) {
  return (
    <group position={position} visible={opacity > 0}>
      {children}
    </group>
  );
}

interface SplashSignSceneProps {
  scale?: number;
  signPos?: [number, number, number];
  textPos?: [number, number, number];
  textSize?: number;
  bevelSize?: number;
  lightIntensity?: number;
  dragRotation?: [number, number, number];
}

export function SplashSignScene({ 
  scale = 3,
  signPos = [0.01, 0.21, 0.41],
  textPos = [0.01, 0.62, 1.24],
  textSize = 0.32,
  bevelSize = 0.014,
  lightIntensity = 2.0,
  dragRotation = [0, 0, 0],
}: SplashSignSceneProps) {
  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={1.2 + lightIntensity} />
      <directionalLight position={[5, 8, 6]} intensity={1.4 + lightIntensity} castShadow />
      <pointLight position={[10, 10, 10]} intensity={1.8 + lightIntensity} />
      <spotLight position={[0, 10, 0]} angle={0.3} penumbra={1} intensity={1} />

      {/* Sign and Text */}
      <Suspense fallback={null}>
        <group scale={scale} rotation={dragRotation}>
          {/* Ornate Wooden Sign */}
          <group position={signPos}>
            <AnimatedCharacter
              characterPath={resolveAssetPath('/Assets/button/ornate+wooden+sign+3d+model.glb')}
              assetId="ornate_wooden_sign"
              characterId="splash-ornate-sign"
              scale={1}
              position={[0, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              autoScale={false}
            />
          </group>

          {/* 3D Text - Questerly */}
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
            fontUrl={resolveAssetPath('/fonts/gentilis_regular.typeface.json')}
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
