import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import R3FCanvas from '@/r3f/R3FCanvas';
import SignCanvas from '@/r3f/SignCanvas';
import { r3f } from '@/lib/tunnel';
import { SplashIslandScene } from '@/r3f/SplashIslandScene';
import { globalAudioManager } from '@/systems/audio';

// LocalStorage keys for fade duration
const FADE_DURATION_KEY = 'splash_fade_duration';
const SIGN_FOG_DURATION_KEY = 'splash_sign_fog_duration';
const DEFAULT_FADE_DURATION = 1.7;
const DEFAULT_SIGN_FOG_DURATION = 0.8; // Sign fog clears earlier

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
  islandScale,
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
  islandScale: number;
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
        islandScale={islandScale}
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
  
  // Fade duration with localStorage persistence
  const [fadeDuration] = useState(() => {
    const saved = localStorage.getItem(FADE_DURATION_KEY);
    return saved ? parseFloat(saved) : DEFAULT_FADE_DURATION;
  });

  // Sign fog duration (separate, earlier than island fade)
  const [signFogDuration] = useState(() => {
    const saved = localStorage.getItem(SIGN_FOG_DURATION_KEY);
    return saved ? parseFloat(saved) : DEFAULT_SIGN_FOG_DURATION;
  });
  const [signVisible, setSignVisible] = useState(false);
  
  const [blurAmount, setBlurAmount] = useState(20); // Starting blur amount in pixels
  const [signBlurAmount, setSignBlurAmount] = useState(15); // Sign-specific blur
  
  // Island fog controls (fixed values, no sliders)
  const fogHeight = 5.0;
  const bubbleScale = 1.0;
  const bubbleDensity = 1.0;
  const bubbleSpeed = 0.2;
  const innerFogRadius = 37.5;
  const innerFogHeight = 0.0;
  const innerBubbleScale = 0.70;
  const innerBubbleDensity = 2.3;
  const innerBubbleSpeed = 0.15;
  
  // Island zoom and sign/text position controls (fixed values, no sliders)
  const islandScale = 1.0;
  const signOffsetY = 0.260;
  const textOffsetY = -0.310;
  const textOffsetZ = 0.066;

  // When island loads, wait a moment then show island with smooth fade
  useEffect(() => {
    if (islandLoaded) {
      // Show sign first (earlier fog clearing)
      setTimeout(() => {
        setSignVisible(true);
      }, 100);

      // Delay island fade start, then show button after fade completes
      const islandFadeDelayMs = Math.max(300, fadeDuration * 1000);
      const islandFadeDurationMs = fadeDuration * 1000;

      setTimeout(() => {
        setIslandVisible(true);
        const buttonDelay = islandFadeDurationMs;
        setTimeout(() => setButtonVisible(true), buttonDelay);
      }, islandFadeDelayMs);
    }
  }, [fadeDuration, islandLoaded]);

  // Animate blur reduction as island fades in
  useEffect(() => {
    if (islandVisible) {
      // Gradually reduce blur as fade progresses
      const startTime = Date.now();
      const duration = fadeDuration * 1000;
      
      const animateBlur = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease out the blur reduction
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        setBlurAmount(20 * (1 - easeProgress));
        
        if (progress < 1) {
          requestAnimationFrame(animateBlur);
        }
      };
      
      requestAnimationFrame(animateBlur);
    }
  }, [islandVisible, fadeDuration]);

  // Animate sign blur reduction (earlier and faster)
  useEffect(() => {
    if (signVisible) {
      const startTime = Date.now();
      const duration = signFogDuration * 1000;
      
      const animateSignBlur = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeProgress = 1 - Math.pow(1 - progress, 2);
        setSignBlurAmount(15 * (1 - easeProgress));
        
        if (progress < 1) {
          requestAnimationFrame(animateSignBlur);
        }
      };
      
      requestAnimationFrame(animateSignBlur);
    }
  }, [signVisible, signFogDuration]);

  const handleIslandLoaded = () => {
    setIslandLoaded(true);
  };

  // Play splash screen music on component mount
  useEffect(() => {
    globalAudioManager.playMusic('track_1');
  }, []);

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {/* Island Canvas - rotating background (z-10) with real fade on the canvas */}
      {showCanvas && (
        <motion.div
          className="fixed inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: islandVisible ? 1 : 0 }}
          transition={{ duration: fadeDuration, ease: 'easeInOut' }}
          style={{ filter: `blur(${Math.max(0, blurAmount - 4)}px)` }}
        >
          <R3FCanvas className="w-full h-full" />
        </motion.div>
      )}
      {/* Island Canvas - fog overlay and portal scene */}
      <div className="relative">
        {/* White overlay with blur that fades out smoothly - dispersing fog effect */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: islandVisible ? 0 : 1 }}
          transition={{ duration: fadeDuration, ease: "easeInOut" }}
          className="absolute inset-0 bg-white z-10 pointer-events-none"
          style={{ 
            backdropFilter: `blur(${blurAmount}px)`,
            WebkitBackdropFilter: `blur(${blurAmount}px)`,
          }}
        />
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
          islandScale={islandScale}
          onLoaded={handleIslandLoaded}
        />
      </div>

      {/* Sign Canvas - fixed foreground (z-15) overlays on top with separate fog */}
      <div className="relative">
        {/* Sign-specific fog layer that clears earlier */}
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: signVisible ? 0 : 1 }}
          transition={{ duration: signFogDuration, ease: "easeOut" }}
          className="absolute inset-0 bg-white/80 z-16 pointer-events-none"
          style={{ 
            backdropFilter: `blur(${signBlurAmount}px)`,
            WebkitBackdropFilter: `blur(${signBlurAmount}px)`,
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: signVisible ? 1 : 0 }}
          transition={{ duration: signFogDuration * 0.8, ease: "easeOut" }}
        >
          <SignCanvas textOffsetZ={textOffsetZ} signOffsetY={signOffsetY} textOffsetY={textOffsetY} />
        </motion.div>
      </div>
      
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
