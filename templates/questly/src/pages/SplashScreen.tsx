import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import R3FCanvas from '@/r3f/R3FCanvas';
import SignCanvas from '@/r3f/SignCanvas';
import { r3f } from '@/lib/tunnel';
import { SplashIslandScene } from '@/r3f/SplashIslandScene';

// Three.js Splash Scene Component - Island Background (Rotating)
function SplashScene() {
  return (
    <r3f.In>
      <SplashIslandScene enableControls={true} />
    </r3f.In>
  );
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const [showCanvas, setShowCanvas] = useState(true);

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {/* Island Canvas - rotating background (z-10) */}
      {showCanvas && <R3FCanvas />}
      <SplashScene />

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
    </>
  );
}
