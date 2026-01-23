import { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Layers, User, Settings, Save, Play, Plus } from 'lucide-react';
import { useAuthStore } from '@/lib/auth';
import CustomButton from '@/components/CustomButton';
import AnimatedCharacter from '@/r3f/AnimatedCharacter';

// Character Preview Box Component following MASTER_THREEJS_BEST_PRACTICES
function CharacterPreview() {
  const [availableAnimations, setAvailableAnimations] = useState<string[]>([]);
  const [currentAnimation, setCurrentAnimation] = useState<string>('');
  const [isLoaded, setIsLoaded] = useState(false);

  const handleAnimationsLoaded = (animations: string[]) => {
    setAvailableAnimations(animations);
    if (animations.length > 0 && !currentAnimation) {
      setCurrentAnimation(animations[0]);
    }
    setIsLoaded(true);
  };

  return (
    <div className="w-full h-full relative">
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 3], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          {/* Lighting setup following best practices */}
          <ambientLight intensity={0.5} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={1}
            castShadow
            shadow-mapSize={[1024, 1024]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.5} />

          {/* Character with all animations */}
          <AnimatedCharacter
            modelPath="/models/character_animated.glb"
            animationName={currentAnimation}
            position={[0, 0, 0]}
            scale={1}
            rotation={[0, 0, 0]}
            onAnimationsLoaded={handleAnimationsLoaded}
          />

          {/* Environment and Shadows */}
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.4}
            scale={10}
            blur={2}
            far={4}
          />
          <Environment preset="sunset" />

          {/* Camera Controls */}
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={2}
            maxDistance={5}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
          />
        </Suspense>
      </Canvas>

      {/* Animation Selector */}
      {isLoaded && availableAnimations.length > 0 && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-slate-700">
          <p className="text-xs text-slate-400 mb-2 font-bold">ANIMATION</p>
          <select
            value={currentAnimation}
            onChange={(e) => setCurrentAnimation(e.target.value)}
            className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {availableAnimations.map((anim) => (
              <option key={anim} value={anim}>
                {anim}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Loading State */}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm pointer-events-none">
          <div className="text-white font-bold text-lg animate-pulse">Loading Character...</div>
        </div>
      )}
    </div>
  );
}

export default function UserDashboard() {
  const user = useAuthStore((state) => state.user);

  const builderSections = [
    { id: 'world', title: 'World Builder', icon: Layers, color: 'bg-green-600' },
    { id: 'characters', title: 'Characters', icon: User, color: 'bg-blue-600' },
    { id: 'settings', title: 'Quest Settings', icon: Settings, color: 'bg-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold font-serif mb-2">
            Welcome back, {user?.displayName || 'Builder'}!
          </h1>
          <p className="text-slate-400">Continue building your adventure</p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Character Preview - Animated Sage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Your Character</h2>
              <CustomButton size="small">
                <User className="w-4 h-4" />
                Customize
              </CustomButton>
            </div>
            
            {/* 3D Character Box */}
            <div className="aspect-video bg-slate-900 rounded-lg border-2 border-slate-700 overflow-hidden">
              <CharacterPreview />
            </div>

            <div className="mt-4 flex gap-3">
              <div className="parchment-box flex-1 p-4">
                <p className="text-sm text-slate-600 font-bold">Character</p>
                <p className="text-lg font-serif text-primary">Sage</p>
              </div>
              <div className="parchment-box flex-1 p-4">
                <p className="text-sm text-slate-600 font-bold">Class</p>
                <p className="text-lg font-serif text-primary">Wizard</p>
              </div>
              <div className="parchment-box flex-1 p-4">
                <p className="text-sm text-slate-600 font-bold">Level</p>
                <p className="text-lg font-serif text-primary">12</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="space-y-4"
          >
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <CustomButton size="small" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Quest
                  </span>
                </CustomButton>
                <CustomButton size="small" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Load Project
                  </span>
                </CustomButton>
                <CustomButton size="small" className="w-full justify-between bg-green-600 hover:bg-green-700">
                  <span className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Test Quest
                  </span>
                </CustomButton>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <h2 className="text-xl font-bold mb-4">Your Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Quests Created</span>
                  <span className="font-bold">3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Plays</span>
                  <span className="font-bold">127</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg. Rating</span>
                  <span className="font-bold">4.8 ⭐</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Builder Tools Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <h2 className="text-2xl font-bold mb-4">Builder Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {builderSections.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="bg-slate-800 rounded-xl border border-slate-700 p-6 cursor-pointer hover:scale-105 transition-transform"
              >
                <div className="flex items-center gap-4">
                  <div className={`${section.color} p-4 rounded-lg`}>
                    <section.icon className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{section.title}</h3>
                    <p className="text-sm text-slate-400">Customize your game</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
