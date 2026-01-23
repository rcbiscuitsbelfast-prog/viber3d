import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Plus, Compass, Trophy, BookOpen, Lock } from 'lucide-react';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';

export default function MainMenu() {
  const menuItems = [
    { label: "Create New Game", icon: Plus, href: "/quest-type", color: "bg-emerald-600" },
    { label: "Browse Games", icon: Compass, href: "/browse", color: "bg-amber-600" },
    { label: "Tutorials", icon: BookOpen, href: "/tutorials", color: "bg-blue-600" },
    { label: "Showcase", icon: Trophy, href: "/showcase", color: "bg-purple-600" },
  ];

  return (
    <ParallaxBackground>
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full pt-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold font-serif text-primary mb-3 leading-tight">
            Build Games Visually
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground font-display">
            Drag, drop, and create amazing 3D experiences
          </p>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-full space-y-4"
        >
          {/* Title Badge */}
          <div className="mb-8 text-center bg-muted p-5 rounded-xl shadow-lg border-2 border-primary/30 rotate-1">
            <h2 className="text-2xl font-serif font-bold text-primary">Game Builder</h2>
            <p className="text-muted-foreground font-display">Choose your path</p>
          </div>

          {/* Menu Buttons */}
          <div className="space-y-4 flex flex-col items-center">
            {menuItems.map((item, idx) => (
              <Link key={idx} to={item.href} className="w-full flex justify-center">
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.1 + 0.3 }}
                  className="cursor-pointer w-full max-w-md"
                >
                  <CustomButton size="large" className="flex items-center justify-center gap-3">
                    <item.icon className="w-6 h-6" />
                    <span>{item.label}</span>
                  </CustomButton>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Coming Soon Panel */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 w-full"
        >
          <div className="parchment-box opacity-90 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-bold">
              PREVIEW
            </div>
            <h3 className="font-serif font-bold text-lg mb-2 text-primary flex items-center gap-2">
              <Lock className="w-5 h-5" /> Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Multiplayer collaboration and asset marketplace are in development.
            </p>
            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 w-3/4 rounded-full" />
            </div>
          </div>
        </motion.div>
      </div>
    </ParallaxBackground>
  );
}
