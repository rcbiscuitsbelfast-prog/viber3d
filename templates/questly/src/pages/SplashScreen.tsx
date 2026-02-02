import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import R3FCanvas from '@/r3f/R3FCanvas';
import SignCanvas from '@/r3f/SignCanvas';
import { r3f } from '@/lib/tunnel';
import { SplashIslandScene } from '@/r3f/SplashIslandScene';

// Three.js Splash Scene Component - Island Background (Rotating)
function SplashScene({
  fogHeight,
  bubbleScale,
  bubbleDensity,
  bubbleSpeed,
  innerFogRadius,
  innerFogHeight,
  innerBubbleScale,
  innerBubbleDensity,
  innerBubbleSpeed
}: {
  fogHeight: number; 
  bubbleScale: number; 
  bubbleDensity: number; 
  bubbleSpeed: number;
  innerFogRadius: number;
  innerFogHeight: number;
  innerBubbleScale: number;
  innerBubbleDensity: number;
  innerBubbleSpeed: number;
}) {
  return (
    <r3f.In>
      <SplashIslandScene 
        enableControls={true}
        fogEnabled={true}
        fogHeight={fogHeight}
        bubbleScale={bubbleScale}
        bubbleDensity={bubbleDensity}
        bubbleSpeed={bubbleSpeed}
        innerFogRadius={innerFogRadius}
        innerFogHeight={innerFogHeight}
        innerBubbleScale={innerBubbleScale}
        innerBubbleDensity={innerBubbleDensity}
        innerBubbleSpeed={innerBubbleSpeed}
      />
    </r3f.In>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showCanvas, setShowCanvas] = useState(true);
  
  // Island fog controls
  const [fogHeight, setFogHeight] = useState(5.0);
  const [bubbleScale, setBubbleScale] = useState(1.0);
  const [bubbleDensity, setBubbleDensity] = useState(1.0);
  const [bubbleSpeed, setBubbleSpeed] = useState(0.2);
  const [innerFogRadius, setInnerFogRadius] = useState(37.5);
  const [innerFogHeight, setInnerFogHeight] = useState(0.0);
  const [innerBubbleScale, setInnerBubbleScale] = useState(0.8);
  const [innerBubbleDensity, setInnerBubbleDensity] = useState(2.3);
  const [innerBubbleSpeed, setInnerBubbleSpeed] = useState(0.15);

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {/* Island Canvas - rotating background (z-10) */}
      {showCanvas && <R3FCanvas />}
      <SplashScene 
        fogHeight={fogHeight}
        bubbleScale={bubbleScale}
        bubbleDensity={bubbleDensity}
        bubbleSpeed={bubbleSpeed}
        innerFogRadius={innerFogRadius}
        innerFogHeight={innerFogHeight}
        innerBubbleScale={innerBubbleScale}
        innerBubbleDensity={innerBubbleDensity}
        innerBubbleSpeed={innerBubbleSpeed}
      />

      {/* Sign Canvas - fixed foreground (z-15) overlays on top */}
      <SignCanvas />
      
      {/* UI Content on Top */}
      <div className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden text-white px-4 z-20 pointer-events-auto">
        {/* Start Button */}
        <div
          className="absolute inset-x-0 z-10 flex justify-center"
          style={{ bottom: 'clamp(4.5rem, 12vw, 16rem)' }}
        >
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
            className="font-display text-base sm:text-lg md:text-xl text-[#FFD700] drop-shadow-[0_0_12px_rgba(255,215,0,0.8)] tracking-wide"
          >
            Start Building
          </motion.button>
        </div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-4 sm:bottom-6 md:bottom-8 lg:bottom-10 text-center text-[11px] sm:text-xs text-gray-400 font-display z-10 pointer-events-none"
        >
          Powered by Three.js & React Three Fiber
        </motion.p>
      </div>

      {/* Island Fog Debug Sliders */}
      <div className="fixed top-4 left-4 bg-black/80 text-white p-4 rounded-lg pointer-events-auto z-50 max-h-[90vh] overflow-y-auto text-xs">
        <h3 className="font-bold mb-3 text-sm">Island Fog</h3>
        
        <div className="space-y-2">
          <div>
            <label className="block">Fog Height: {fogHeight.toFixed(2)}</label>
            <input type="range" min="0" max="15" step="0.1" value={fogHeight} onChange={(e) => setFogHeight(Number(e.target.value))} className="w-full" />
          </div>
          
          <div>
            <label className="block">Bubble Scale: {bubbleScale.toFixed(2)}</label>
            <input type="range" min="0.5" max="2.5" step="0.1" value={bubbleScale} onChange={(e) => setBubbleScale(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block">Bubble Density: {bubbleDensity.toFixed(2)}</label>
            <input type="range" min="0.5" max="3.0" step="0.1" value={bubbleDensity} onChange={(e) => setBubbleDensity(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block">Bubble Speed: {bubbleSpeed.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.05" value={bubbleSpeed} onChange={(e) => setBubbleSpeed(Number(e.target.value))} className="w-full" />
          </div>

          <div className="border-t border-white/20 pt-2 mt-2">
            <label className="block">Inner Fog Radius: {innerFogRadius.toFixed(1)}</label>
            <input type="range" min="5" max="50" step="0.5" value={innerFogRadius} onChange={(e) => setInnerFogRadius(Number(e.target.value))} className="w-full" />
          </div>

          <div className="border-t border-white/20 pt-2 mt-2">
            <label className="block">Inner Fog Height: {innerFogHeight.toFixed(2)}</label>
            <input type="range" min="0" max="15" step="0.1" value={innerFogHeight} onChange={(e) => setInnerFogHeight(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block">Inner Bubble Scale: {innerBubbleScale.toFixed(2)}</label>
            <input type="range" min="0.5" max="2.5" step="0.1" value={innerBubbleScale} onChange={(e) => setInnerBubbleScale(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block">Inner Bubble Density: {innerBubbleDensity.toFixed(2)}</label>
            <input type="range" min="0.5" max="3.0" step="0.1" value={innerBubbleDensity} onChange={(e) => setInnerBubbleDensity(Number(e.target.value))} className="w-full" />
          </div>

          <div>
            <label className="block">Inner Bubble Speed: {innerBubbleSpeed.toFixed(2)}</label>
            <input type="range" min="0" max="1" step="0.05" value={innerBubbleSpeed} onChange={(e) => setInnerBubbleSpeed(Number(e.target.value))} className="w-full" />
          </div>
        </div>
      </div>
    </>
  );
}
