// Separate canvas for sign and text only - overlays on top with fixed camera
// Uses deterministic geometry-based positioning with unified scale computation
import { Canvas } from '@react-three/fiber';
import { SplashSignScene } from './SplashSignScene';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface SignCanvasProps {
  textOffsetZ?: number;
  signOffsetY?: number;
  textOffsetY?: number;
}

export default function SignCanvas({ textOffsetZ: propTextOffsetZ, signOffsetY: propSignOffsetY, textOffsetY: propTextOffsetY }: SignCanvasProps = {}) {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  const [dragRotation, setDragRotation] = useState<[number, number, number]>([0, 0, 0]);
  const dragRotationRef = useRef<[number, number, number]>([0, 0, 0]);
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const dragBase = useRef<[number, number, number]>([0, 0, 0]);
  
  // Debug mode for tuning (enabled via URL param ?debug=true)
  const [debugMode, setDebugMode] = useState(false);
  const [debugScale, setDebugScale] = useState(3.0);
  const [signOffsetY, setSignOffsetY] = useState(propSignOffsetY ?? 0.300);
  const [textOffsetY, setTextOffsetY] = useState(propTextOffsetY ?? 0.0);
  const [textOffsetZ, setTextOffsetZ] = useState(propTextOffsetZ ?? 0.030);
  
  // Update values when props change
  useEffect(() => {
    if (propTextOffsetZ !== undefined) {
      setTextOffsetZ(propTextOffsetZ);
    }
  }, [propTextOffsetZ]);
  
  useEffect(() => {
    if (propSignOffsetY !== undefined) {
      setSignOffsetY(propSignOffsetY);
    }
  }, [propSignOffsetY]);
  
  useEffect(() => {
    if (propTextOffsetY !== undefined) {
      setTextOffsetY(propTextOffsetY);
    }
  }, [propTextOffsetY]);

  useEffect(() => {
    // Check for debug mode in URL
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDebug = params.get('debug') === 'true';
      setDebugMode(isDebug);
      
      // Load debug values from localStorage only if in debug mode
      if (isDebug) {
        const storedScale = window.localStorage.getItem('questly:debugScale');
        if (storedScale) setDebugScale(Number(storedScale));
      }
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    // Set initial viewport immediately
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save debug values to localStorage when they change
  useEffect(() => {
    if (debugMode && typeof window !== 'undefined') {
      window.localStorage.setItem('questly:debugScale', String(debugScale));
    }
  }, [debugMode, debugScale]);

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

  // Unified scale computation based on viewport aspect ratio
  const config = useMemo(() => {
    const aspectRatio = viewport.width / viewport.height;
    
    // Base scale: 3.0 for landscape (aspect > 1.2)
    // Scale down smoothly for portrait/narrow viewports
    let computedScale: number;
    if (aspectRatio > 1.2) {
      // Landscape mode
      computedScale = 3.0;
    } else if (aspectRatio > 0.8) {
      // Transitional (square-ish)
      computedScale = 2.5;
    } else {
      // Portrait mode - scale down more for very tall viewports
      computedScale = Math.max(1.5, 2.0 - (0.8 - aspectRatio) * 0.8);
    }

    // Use debug scale if in debug mode
    const finalScale = debugMode ? debugScale : computedScale;

    return {
      scale: finalScale,
      signOffsetY,
      textOffsetY,
      textOffsetZ,
      cameraPos: [0, 0, 3.5] as [number, number, number],
      cameraFov: 50,
      aspectRatio,
    };
  }, [viewport.width, viewport.height, debugMode, debugScale, signOffsetY, textOffsetY, textOffsetZ]);

  return (
    <>
      <motion.div 
        className="fixed inset-0 pointer-events-none" 
        style={{ zIndex: 15 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 1 }}
      >
        <Canvas
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
            signOffsetY={config.signOffsetY}
            textOffsetY={config.textOffsetY}
            textOffsetZ={config.textOffsetZ}
            lightIntensity={2.0}
            dragRotation={dragRotation}
          />
        </Canvas>
      </motion.div>
      
      {/* Debug Controls - Only shown when ?debug=true */}
      {debugMode && (
        <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg pointer-events-auto z-40 text-xs max-w-xs border-2 border-yellow-500">
          <h3 className="font-bold mb-3 text-sm text-yellow-400">🐛 Debug Mode</h3>
          
          <div className="space-y-3">
            <div>
              <label className="block mb-1 font-medium">Scale Override: {debugScale.toFixed(2)}</label>
              <input 
                type="range" 
                min="1.0" 
                max="5.0" 
                step="0.1" 
                value={debugScale} 
                onChange={(e) => setDebugScale(Number(e.target.value))} 
                className="w-full" 
              />
              <div className="text-[10px] text-gray-400 mt-1">
                Auto: {config.aspectRatio > 1.2 ? '3.0 (landscape)' : config.aspectRatio > 0.8 ? '2.5 (square)' : '~2.0 (portrait)'}
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                className="px-2 py-1 rounded bg-white/10 hover:bg-white/20 text-[10px]"
                onClick={() => {
                  setDebugScale(3.0);
                }}
              >
                Reset to defaults
              </button>
            </div>
            
            <div className="border-t border-white/20 pt-2 mt-2 font-mono text-[10px] bg-black/50 p-2 rounded">
              <div className="text-yellow-400 mb-1">Current Values:</div>
              <div>Scale: {debugScale.toFixed(2)}</div>
              <div>Sign Offset: {signOffsetY.toFixed(3)}</div>
              <div>Aspect: {config.aspectRatio.toFixed(2)}</div>
              <div className="text-[9px] text-gray-400 mt-1">Saved to localStorage</div>
            </div>

            <div className="border-t border-yellow-500/30 pt-2 text-[10px] text-yellow-300">
              <div className="font-bold mb-1">Geometry-based positioning:</div>
              <div className="text-gray-300">✓ Sign pivot normalized</div>
              <div className="text-gray-300">✓ Text anchored to sign bounds</div>
              <div className="text-gray-300">✓ Unified scale computation</div>
            </div>
          </div>
          
          <style>{`
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 20px;
              height: 20px;
              background: #EAB308;
              border-radius: 50%;
              cursor: pointer;
              border: 2px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
            input[type="range"]::-moz-range-thumb {
              width: 20px;
              height: 20px;
              background: #EAB308;
              border-radius: 50%;
              cursor: pointer;
              border: 2px solid #fff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            }
          `}</style>
        </div>
      )}
    </>
  );
}
