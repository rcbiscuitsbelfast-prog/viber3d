import { useState, useEffect } from 'react';
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
  innerBubbleSpeed,
  onLoaded
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
  onLoaded: () => void;
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
        onLoaded={onLoaded}
      />
    </r3f.In>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showCanvas, setShowCanvas] = useState(true);
  
  // Loading states
  const [islandLoaded, setIslandLoaded] = useState(false);
  const [islandVisible, setIslandVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);
  
  // Island fog controls
  const [fogHeight, setFogHeight] = useState(5.0);
  const [bubbleScale, setBubbleScale] = useState(1.0);
  const [bubbleDensity, setBubbleDensity] = useState(1.0);
  const [bubbleSpeed, setBubbleSpeed] = useState(0.2);
  const [innerFogRadius, setInnerFogRadius] = useState(37.5);
  const [innerFogHeight, setInnerFogHeight] = useState(0.0);
  const [innerBubbleScale, setInnerBubbleScale] = useState(0.70);
  const [innerBubbleDensity, setInnerBubbleDensity] = useState(2.3);
  const [innerBubbleSpeed, setInnerBubbleSpeed] = useState(0.15);

  // When island loads, show island and button
  useEffect(() => {
    if (islandLoaded) {
      setIslandVisible(true);
      setTimeout(() => setButtonVisible(true), 300);
    }
  }, [islandLoaded]);

  const handleIslandLoaded = () => {
    setIslandLoaded(true);
  };

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {/* Island Canvas - rotating background (z-10) */}
      {showCanvas && <R3FCanvas />}
      {/* Island Canvas - rotating background (z-10) */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: islandVisible ? 1 : 0 }}
        transition={{ duration: 0.8 }}
      >
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
          onLoaded={handleIslandLoaded}
        />
      </motion.div>

      {/* Sign Canvas - fixed foreground (z-15) overlays on top */}
      <motion.div
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <SignCanvas />
      </motion.div>
      
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
              opacity: buttonVisible ? 1 : 0,
              scale: buttonVisible ? [1, 1.05, 1] : 0.95,
              filter: buttonVisible ? [
                'drop-shadow(0 0 8px rgba(255,215,0,0.6))',
                'drop-shadow(0 0 16px rgba(255,215,0,0.95))',
                'drop-shadow(0 0 8px rgba(255,215,0,0.6))'
              ] : 'drop-shadow(0 0 0px rgba(255,215,0,0))'
            }}
            transition={{
              opacity: { duration: 0.6 },
              scale: { duration: 1.4, repeat: buttonVisible ? Infinity : 0, repeatType: 'reverse', ease: 'easeInOut' },
              filter: { duration: 1.4, repeat: buttonVisible ? Infinity : 0, repeatType: 'reverse', ease: 'easeInOut' }
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
    </>
  );
}
