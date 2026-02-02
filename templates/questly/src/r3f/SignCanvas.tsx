// Separate canvas for sign and text only - overlays on top with fixed camera
import { Canvas } from '@react-three/fiber';
import { SplashSignScene } from './SplashSignScene';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export default function SignCanvas() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [dragRotation, setDragRotation] = useState<[number, number, number]>([0, 0, 0]);
  const dragRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragBase = useRef<[number, number, number]>([0, 0, 0]);
  
  // Portrait scale adjustment
  const [portraitScale, setPortraitScale] = useState(2.2);


  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    // Set initial viewport immediately
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      dragStart.current = { x: event.clientX, y: event.clientY };
      dragBase.current = dragRotationRef.current;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!dragStart.current) return;
      const dx = event.clientX - dragStart.current.x;
      const dy = event.clientY - dragStart.current.y;
      const width = window.innerWidth || 1;
      const height = window.innerHeight || 1;

      const rotX = (-dy / height) * 0.35;
      const rotY = (dx / width) * 0.45;
      const rotZ = (dx / width) * 0.25;

      const nextRotation: [number, number, number] = [
        dragBase.current[0] + rotX,
        dragBase.current[1] + rotY,
        dragBase.current[2] + rotZ,
      ];
      dragRotationRef.current = nextRotation;
      setDragRotation(nextRotation);
    };

    const handlePointerUp = () => {
      dragStart.current = null;
      dragRotationRef.current = [0, 0, 0];
      setDragRotation([0, 0, 0]);
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerUp, { passive: true });

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const config = useMemo(() => {
    const isPortrait = viewport.height > viewport.width;
    const isSmall = viewport.width < 768;
    
    // Use portrait mode if: actual portrait orientation OR small width
    const usePortraitMode = isPortrait || isSmall;
    
    if (usePortraitMode) {
      // PORTRAIT/MOBILE VERSION - Using landscape proven values, scaled down for mobile
      return {
        mode: 'portrait',
        scale: portraitScale,
        signPos: [0.01, 0.21, -0.02] as [number, number, number],
        textPos: [0.0, 0.3, -0.18] as [number, number, number],
        textSize: 0.10,
        bevelSize: 0.003,
        cameraPos: [0, 0, 3.5] as [number, number, number],
        cameraFov: 50,
      };
    } else {
      // LANDSCAPE VERSION - Optimized for wide screens
      return {
        mode: 'landscape',
        scale: 3.0,
        signPos: [0.01, 0.21, -0.02] as [number, number, number],
        textPos: [0.0, 0.3, -0.18] as [number, number, number],
        textSize: 0.11,
        bevelSize: 0.003,
        cameraPos: [0, 0, 3.5] as [number, number, number],
        cameraFov: 50,
      };
    }
  }, [
    viewport.width,
    viewport.height,
    portraitScale,
  ]);

  return (
    <>
      <motion.div 
        className="fixed inset-0 pointer-events-none" 
        style={{ zIndex: 15 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        {config.mode === 'portrait' && (
          <Canvas
            key="portrait"
            camera={{ position: config.cameraPos, fov: config.cameraFov, near: 0.1, far: 1000 }}
            gl={{
              antialias: true,
              alpha: true,
              transparent: true,
              powerPreference: 'high-performance',
            }}
            style={{ background: 'transparent' }}
          >
            <SplashSignScene 
              scale={config.scale}
              signPos={config.signPos}
              textPos={config.textPos}
              textSize={config.textSize}
              bevelSize={config.bevelSize}
              lightIntensity={2.0}
              dragRotation={dragRotation}
            />
          </Canvas>
        )}
        {config.mode === 'landscape' && (
          <Canvas
            key="landscape"
            camera={{ position: config.cameraPos, fov: config.cameraFov, near: 0.1, far: 1000 }}
            gl={{
              antialias: true,
              alpha: true,
              transparent: true,
              powerPreference: 'high-performance',
            }}
            style={{ background: 'transparent' }}
          >
            <SplashSignScene 
              scale={config.scale}
              signPos={config.signPos}
              textPos={config.textPos}
              textSize={config.textSize}
              bevelSize={config.bevelSize}
              lightIntensity={2.0}
              dragRotation={dragRotation}
            />
          </Canvas>
        )}
      </motion.div>
      
      {/* Portrait Scale Slider - Mobile Friendly */}
      {config.mode === 'portrait' && (
        <div className="fixed bottom-0 left-0 right-0 bg-black/90 backdrop-blur-sm border-t border-white/20 p-4 pointer-events-auto z-50 safe-area-inset-bottom">
          <div className="max-w-md mx-auto">
            <label className="block text-white text-sm font-medium mb-2 text-center">
              Sign Scale: {portraitScale.toFixed(2)}
            </label>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={portraitScale}
              onChange={(e) => setPortraitScale(Number(e.target.value))}
              className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer touch-none"
              style={{
                WebkitAppearance: 'none',
                appearance: 'none',
                background: 'linear-gradient(to right, #FFD700 0%, #FFD700 ' + ((portraitScale - 1.0) / 3.0 * 100) + '%, #4B5563 ' + ((portraitScale - 1.0) / 3.0 * 100) + '%, #4B5563 100%)',
              }}
            />
            <style>{`
              input[type="range"]::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 24px;
                height: 24px;
                background: #FFD700;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
              input[type="range"]::-moz-range-thumb {
                width: 24px;
                height: 24px;
                background: #FFD700;
                border-radius: 50%;
                cursor: pointer;
                border: 2px solid #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              }
            `}</style>
          </div>
        </div>
      )}
    </>
  );
}
