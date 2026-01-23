import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import { motion, useAnimation } from 'framer-motion';
import R3FCanvas from '@/r3f/R3FCanvas';
import { r3f } from '@/lib/tunnel';
import * as THREE from 'three';
import CustomButton from '@/components/CustomButton';

// Three.js Splash Scene Component
function SplashScene() {
  const meshRef = useRef<THREE.Mesh>(null);

  return (
    <r3f.In>
      <color attach="background" args={['#0a0a0a']} />
      
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={1}
        intensity={1}
        castShadow
      />

      {/* Animated Logo - Rotating Golden Cube */}
      <mesh
        ref={meshRef}
        position={[0, 1, 0]}
        rotation={[0, 0, 0]}
        castShadow
      >
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial
          color="#FFD700"
          metalness={0.8}
          roughness={0.2}
          emissive="#FF8C00"
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>

      {/* Animate the cube */}
      <AnimatedCube meshRef={meshRef} />
    </r3f.In>
  );
}

function AnimatedCube({ meshRef }: { meshRef: React.RefObject<THREE.Mesh> }) {
  useEffect(() => {
    if (!meshRef.current) return;

    let animationId: number;
    const animate = () => {
      if (meshRef.current) {
        meshRef.current.rotation.x += 0.005;
        meshRef.current.rotation.y += 0.01;
        meshRef.current.position.y = 1 + Math.sin(Date.now() * 0.001) * 0.3;
      }
      animationId = requestAnimationFrame(animate);
    };
    animate();

    return () => cancelAnimationFrame(animationId);
  }, [meshRef]);

  return null;
}

export default function SplashScreen() {
  const navigate = useNavigate();
  const contentControls = useAnimation();
  const [showCanvas, setShowCanvas] = useState(true);

  useEffect(() => {
    const sequence = async () => {
      await new Promise((r) => setTimeout(r, 500));
      await contentControls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 1, ease: [0.25, 0.1, 0.25, 1] },
      });
    };

    sequence();
  }, [contentControls]);

  const handleStart = () => {
    setShowCanvas(false);
    navigate('/menu');
  };

  return (
    <>
      {showCanvas && <R3FCanvas />}
      <SplashScene />
      
      <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-black via-gray-900 to-black text-white px-4">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="text-center mb-8"
        >
          <h1 className="text-7xl md:text-8xl font-bold font-serif text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-500 mb-4">
            QUESTLY
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 font-display">
            Build Your Adventure
          </p>
        </motion.div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={contentControls}
          className="relative z-10"
        >
          <CustomButton onClick={handleStart} size="large">
            Start Building <Play className="h-6 w-6" />
          </CustomButton>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 text-center text-sm text-gray-400 font-display"
        >
          Powered by Three.js & React Three Fiber
        </motion.p>
      </div>
    </>
  );
}
