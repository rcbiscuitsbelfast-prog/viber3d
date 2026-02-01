// Separate canvas for sign and text only - overlays on top with fixed camera
import { Canvas } from '@react-three/fiber';
import { SplashSignScene } from './SplashSignScene';
import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';

export default function SignCanvas() {
  const [viewport, setViewport] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  });

  // Portrait mode adjustable values
  const [portraitScale, setPortraitScale] = useState(2.2);
  const [portraitSignX, setPortraitSignX] = useState(0.0);
  const [portraitSignY, setPortraitSignY] = useState(0.35);
  const [portraitSignZ, setPortraitSignZ] = useState(-0.02);
  const [portraitTextX, setPortraitTextX] = useState(0.0);
  const [portraitTextY, setPortraitTextY] = useState(0.44);
  const [portraitTextZ, setPortraitTextZ] = useState(-0.18);
  const [portraitTextSize, setPortraitTextSize] = useState(0.09);
  const [portraitCameraZ, setPortraitCameraZ] = useState(4.2);
  const [portraitCameraFov, setPortraitCameraFov] = useState(60);

  useEffect(() => {
    const handleResize = () => {
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    // Set initial viewport immediately
    setViewport({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const config = useMemo(() => {
    const isPortrait = viewport.height > viewport.width;
    const isSmall = viewport.width < 768;
    
    // Use portrait mode if: actual portrait orientation OR small width
    const usePortraitMode = isPortrait || isSmall;
    
    if (usePortraitMode) {
      // PORTRAIT/MOBILE VERSION - Adjustable via sliders
      return {
        mode: 'portrait',
        scale: portraitScale,
        signPos: [portraitSignX, portraitSignY, portraitSignZ] as [number, number, number],
        textPos: [portraitTextX, portraitTextY, portraitTextZ] as [number, number, number],
        textSize: portraitTextSize,
        bevelSize: 0.003,
        cameraPos: [0, 0, portraitCameraZ] as [number, number, number],
        cameraFov: portraitCameraFov,
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
  }, [viewport.width, viewport.height, portraitScale, portraitSignX, portraitSignY, portraitSignZ, portraitTextX, portraitTextY, portraitTextZ, portraitTextSize, portraitCameraZ, portraitCameraFov]);

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
          key={config.mode}
          camera={{ position: config.cameraPos, fov: config.cameraFov, near: 0.1, far: 1000 }}
          gl={{
            antialias: true,
            alpha: true,
            transparent: true,
            powerPreference: 'high-performance',
          }}
          style={{ background: 'transparent' }}
        >
          {/* Actual sign scene with adjustable props */}
          <SplashSignScene 
            scale={config.scale}
            signPos={config.signPos}
            textPos={config.textPos}
            textSize={config.textSize}
            bevelSize={config.bevelSize}
            lightIntensity={2.0}
          />
        </Canvas>
      </motion.div>

      {/* Debug sliders - only show in portrait mode */}
      {config.mode === 'portrait' && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg pointer-events-auto z-50 max-h-[90vh] overflow-y-auto text-xs">
          <h3 className="font-bold mb-3 text-sm">Portrait Mode Debug</h3>
          
          <div className="space-y-2">
            <div>
              <label className="block">Scale: {portraitScale.toFixed(2)}</label>
              <input type="range" min="1" max="4" step="0.1" value={portraitScale} onChange={(e) => setPortraitScale(Number(e.target.value))} className="w-full" />
            </div>
            
            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="font-semibold mb-1">Sign Position</div>
              <div>
                <label className="block">X: {portraitSignX.toFixed(3)}</label>
                <input type="range" min="-0.5" max="0.5" step="0.01" value={portraitSignX} onChange={(e) => setPortraitSignX(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block">Y: {portraitSignY.toFixed(3)}</label>
                <input type="range" min="-0.5" max="1" step="0.01" value={portraitSignY} onChange={(e) => setPortraitSignY(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block">Z: {portraitSignZ.toFixed(3)}</label>
                <input type="range" min="-1" max="1" step="0.01" value={portraitSignZ} onChange={(e) => setPortraitSignZ(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="font-semibold mb-1">Text Position</div>
              <div>
                <label className="block">X: {portraitTextX.toFixed(3)}</label>
                <input type="range" min="-0.5" max="0.5" step="0.01" value={portraitTextX} onChange={(e) => setPortraitTextX(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block">Y: {portraitTextY.toFixed(3)}</label>
                <input type="range" min="-0.5" max="1" step="0.01" value={portraitTextY} onChange={(e) => setPortraitTextY(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block">Z: {portraitTextZ.toFixed(3)}</label>
                <input type="range" min="-1" max="1" step="0.01" value={portraitTextZ} onChange={(e) => setPortraitTextZ(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="border-t border-white/20 pt-2 mt-2">
              <div>
                <label className="block">Text Size: {portraitTextSize.toFixed(3)}</label>
                <input type="range" min="0.05" max="0.2" step="0.005" value={portraitTextSize} onChange={(e) => setPortraitTextSize(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="border-t border-white/20 pt-2 mt-2">
              <div className="font-semibold mb-1">Camera</div>
              <div>
                <label className="block">Z: {portraitCameraZ.toFixed(2)}</label>
                <input type="range" min="2" max="8" step="0.1" value={portraitCameraZ} onChange={(e) => setPortraitCameraZ(Number(e.target.value))} className="w-full" />
              </div>
              <div>
                <label className="block">FOV: {portraitCameraFov.toFixed(0)}</label>
                <input type="range" min="30" max="90" step="1" value={portraitCameraFov} onChange={(e) => setPortraitCameraFov(Number(e.target.value))} className="w-full" />
              </div>
            </div>

            <div className="border-t border-white/20 pt-2 mt-2">
              <button 
                onClick={() => {
                  console.log(`Portrait Config:
scale: ${portraitScale},
signPos: [${portraitSignX}, ${portraitSignY}, ${portraitSignZ}],
textPos: [${portraitTextX}, ${portraitTextY}, ${portraitTextZ}],
textSize: ${portraitTextSize},
cameraZ: ${portraitCameraZ},
cameraFov: ${portraitCameraFov}`);
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded"
              >
                Log Values to Console
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
