// BACKUP OF WORKING SPLASH SCREEN - 2026-02-01
// This file contains the working splash screen with:
// - Sky background with animated clouds
// - 3D sign and Questerly text with brick texture
// - Pulsing "Start Building" button
// - Control sliders for fine-tuning
// 
// To restore: copy this file content back to SplashScreen.tsx

import { Suspense, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import R3FCanvas from '@/r3f/R3FCanvas';
import { r3f } from '@/lib/tunnel';
import { Font3DText } from '@/r3f/Font3DText';
import AnimatedCharacter from '@/r3f/AnimatedCharacter';
import * as THREE from 'three';

// Three.js Splash Scene Component
function SplashScene({
  signScale,
  signPosition,
  textPosition,
  textSize,
  lightIntensity,
  textLightStrength,
  bevelSize,
}: {
  signScale: number;
  signPosition: [number, number, number];
  textPosition: [number, number, number];
  textSize: number;
  lightIntensity: number;
  textLightStrength: number;
  bevelSize: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const textLightRef = useRef<THREE.PointLight>(null);
  const revealRef = useRef(0);

  useEffect(() => {
    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const delta = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      revealRef.current = Math.min(1, revealRef.current + delta * 0.7);
      const t = revealRef.current;
      const eased = t * t * (3 - 2 * t);
      if (groupRef.current) {
        groupRef.current.scale.setScalar(eased);
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  useEffect(() => {
    let rafId = 0;
    const tick = (now: number) => {
      if (textLightRef.current) {
        const time = now * 0.001;
        const radius = 0.6;
        textLightRef.current.position.set(
          textPosition[0] + Math.cos(time) * radius,
          textPosition[1] + 0.3 + Math.sin(time * 1.3) * 0.2,
          textPosition[2] + 0.6
        );
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [textPosition]);

  return (
    <r3f.In>
      {/* Background is transparent - sky shows through */}
      
      {/* Lighting */}
      <ambientLight intensity={1.2 + lightIntensity} />
      <directionalLight position={[5, 8, 6]} intensity={1.4 + lightIntensity} />
      <pointLight position={[10, 10, 10]} intensity={1.8 + lightIntensity} />
      <pointLight
        ref={textLightRef}
        intensity={textLightStrength}
        distance={2}
        decay={2}
        color="#ffdca8"
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />

      <Suspense fallback={null}>
        <group ref={groupRef} scale={0}>
          {/* Ornate Wooden Sign */}
          <group scale={signScale}>
            <AnimatedCharacter
              characterPath="/Assets/button/ornate+wooden+sign+3d+model.glb"
              assetId="ornate_wooden_sign"
              characterId="splash-ornate-sign"
              scale={1}
              position={signPosition}
              rotation={[0, Math.PI / 2, 0]}
              autoScale={false}
            />
          </group>

          {/* 3D Text - Questerly */}
          <Font3DText
            text="Questerly"
            position={textPosition}
            color="#9a9a9a"
            size={textSize}
            height={0.420}
            bevelEnabled={true}
            bevelSize={bevelSize}
            bevelThickness={0.050}
            bevelSegments={3}
            curveSegments={3}
            fontUrl="/Assets/three.js/examples/fonts/helvetiker_regular.typeface.json"
            textureUrl="/Assets/textures/images.jpg"
            textureRepeat={[1.8, 1.8]}
            materialType="toon"
            gradientMapUrl="/Assets/three.js/examples/textures/gradientMaps/threeTone.jpg"
            edgeColor="#1a1a1a"
            outlineEnabled={false}
            rotation={[0, 0, 0]}
          />
        </group>
      </Suspense>
    </r3f.In>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showCanvas, setShowCanvas] = useState(true);
  const [signScale, setSignScale] = useState(3.0);
  const [signPosition, setSignPosition] = useState<[number, number, number]>([0.01, 0.21, 0.41]);
  const [textPosition, setTextPosition] = useState<[number, number, number]>([0.01, 0.62, 1.24]);
  const [textSize, setTextSize] = useState(0.32);
  const [lightIntensity, setLightIntensity] = useState(2.0);
  const [textLightStrength, setTextLightStrength] = useState(3.0);
  const [bevelSize, setBevelSize] = useState(0.014);

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {/* Animated Sky Background */}
      <div className="fixed inset-0 pointer-events-none z-0" style={{
        background: 'linear-gradient(180deg, #87CEEB 0%, #E0F6FF 100%)',
      }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\"\u003E%3Cdefs%3E%3Cfilter id=\"noise\"\u003E%3CfeTurbulence type=\"fractalNoise\" baseFrequency=\"0.02\" numOctaves=\"3\" seed=\"2\" /%3E%3C/filter%3E%3C/defs%3E%3Crect width=\"100%\" height=\"100%\" fill=\"white\" opacity=\"0.7\" filter=\"url(%23noise)\" /%3E%3C/svg%3E")',
          backgroundSize: '200% 200%',
          animation: 'cloudDrift 20s linear infinite',
          opacity: 0.6
        }} />
      </div>
      
      <style>{`
        @keyframes cloudDrift {
          0% { background-position: 0 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      
      {/* 3D Canvas with sign and text */}
      {showCanvas && <R3FCanvas />}
      <SplashScene
        signScale={signScale}
        signPosition={signPosition}
        textPosition={textPosition}
        textSize={textSize}
        lightIntensity={lightIntensity}
        textLightStrength={textLightStrength}
        bevelSize={bevelSize}
      />
      
      {/* UI Content on Top */}
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden text-white px-4 z-20 pointer-events-auto">
        {/* Start Prompt */}
        <motion.button
          type="button"
          onClick={handleStart}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{
            opacity: 1,
            scale: [1, 1.05, 1],
            filter: [
              'drop-shadow(0 0 8px rgba(255,215,0,0.6))',
              'drop-shadow(0 0 16px rgba(255,215,0,0.95))',
              'drop-shadow(0 0 8px rgba(255,215,0,0.6))'
            ]
          }}
          transition={{
            opacity: { delay: 1.2, duration: 0.6 },
            scale: { duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' },
            filter: { duration: 1.4, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }
          }}
          className="relative z-10 font-display text-lg md:text-xl text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)] tracking-wide"
        >
          Start Building
        </motion.button>

        {/* Splash Controls */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-black/60 backdrop-blur border border-slate-700 rounded-xl p-4 text-xs text-slate-200 z-30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block mb-1">Sign Scale: {signScale.toFixed(3)}</label>
              <input
                type="range"
                min="0"
                max="3"
                step="0.005"
                value={signScale}
                onChange={(e) => setSignScale(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Position X: {signPosition[0].toFixed(2)}</label>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.01"
                value={signPosition[0]}
                onChange={(e) => setSignPosition([Number(e.target.value), signPosition[1], signPosition[2]])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Position Y: {signPosition[1].toFixed(2)}</label>
              <input
                type="range"
                min="-1"
                max="3"
                step="0.01"
                value={signPosition[1]}
                onChange={(e) => setSignPosition([signPosition[0], Number(e.target.value), signPosition[2]])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Position Z: {signPosition[2].toFixed(2)}</label>
              <input
                type="range"
                min="-10"
                max="2"
                step="0.01"
                value={signPosition[2]}
                onChange={(e) => setSignPosition([signPosition[0], signPosition[1], Number(e.target.value)])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Text X: {textPosition[0].toFixed(2)}</label>
              <input
                type="range"
                min="-3"
                max="3"
                step="0.01"
                value={textPosition[0]}
                onChange={(e) => setTextPosition([Number(e.target.value), textPosition[1], textPosition[2]])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Text Y: {textPosition[1].toFixed(2)}</label>
              <input
                type="range"
                min="-1"
                max="4"
                step="0.01"
                value={textPosition[1]}
                onChange={(e) => setTextPosition([textPosition[0], Number(e.target.value), textPosition[2]])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Text Z: {textPosition[2].toFixed(2)}</label>
              <input
                type="range"
                min="-6"
                max="6"
                step="0.01"
                value={textPosition[2]}
                onChange={(e) => setTextPosition([textPosition[0], textPosition[1], Number(e.target.value)])}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Lighting: {lightIntensity.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.01"
                value={lightIntensity}
                onChange={(e) => setLightIntensity(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Font Light: {textLightStrength.toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="8"
                step="0.05"
                value={textLightStrength}
                onChange={(e) => setTextLightStrength(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Text Size: {textSize.toFixed(2)}</label>
              <input
                type="range"
                min="0.2"
                max="1.2"
                step="0.01"
                value={textSize}
                onChange={(e) => setTextSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block mb-1">Bevel Size: {bevelSize.toFixed(3)}</label>
              <input
                type="range"
                min="0.001"
                max="0.08"
                step="0.001"
                value={bevelSize}
                onChange={(e) => setBevelSize(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-24 text-center text-sm text-gray-400 font-display z-10 pointer-events-none"
        >
          Powered by Three.js & React Three Fiber
        </motion.p>
      </div>
    </>
  );
}
