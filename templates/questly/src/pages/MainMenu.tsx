import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Hammer, Play, MessageSquare, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect } from 'react';
import ParallaxBackground from '@/components/ParallaxBackground';
import CustomButton from '@/components/CustomButton';
import AssetCreditsFooter from '@/components/AssetCreditsFooter';
import { globalAudioManager } from '@/systems/audio';

export default function MainMenu() {
  const navigate = useNavigate();
  const [showComingSoonCarousel, setShowComingSoonCarousel] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Play main menu music on component mount
  useEffect(() => {
    globalAudioManager.playMusic('track_5');
  }, []);

  const comingSoonFeatures = [
    {
      title: 'Talking Animations for Players and NPCs',
      description: 'Bring your characters to life with voice-synced mouth animations and expressive gestures during conversations.',
      image: 'https://via.placeholder.com/400x200/8B5CF6/FFFFFF?text=Talking+Animations',
    },
    {
      title: 'More Asset Variety',
      description: 'Expanded library of characters, environments, props, and effects to make your game worlds more diverse and immersive.',
      image: 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=More+Assets',
    },
    {
      title: 'Own Your Own World',
      description: 'World never deletes, endless play with a few limitations. Your creations persist forever with unlimited potential.',
      image: 'https://via.placeholder.com/400x200/F59E0B/FFFFFF?text=Own+Your+World',
    },
  ];

  const handleCarouselPrev = () => {
    setCarouselIndex((prev) => (prev - 1 + comingSoonFeatures.length) % comingSoonFeatures.length);
  };

  const handleCarouselNext = () => {
    setCarouselIndex((prev) => (prev + 1) % comingSoonFeatures.length);
  };

  const handleBuild = () => {
    navigate('/quest-type', { state: { mode: 'build' } });
  };

  const handlePlay = () => {
    navigate('/quest-type', { state: { mode: 'play' } });
  };

  const handleHaveYourSay = () => {
    navigate('/have-your-say');
  };

  const menuItems = [
    { label: "Build", icon: Hammer, onClick: handleBuild, color: "bg-emerald-600" },
    { label: "Play", icon: Play, onClick: handlePlay, color: "bg-blue-600" },
    { label: "Have Your Say", icon: MessageSquare, onClick: handleHaveYourSay, color: "bg-purple-600" },
  ];

  return (
    <ParallaxBackground>
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full pt-20 min-h-screen">
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
              <motion.div
                key={idx}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 + 0.3 }}
                className="w-full max-w-md"
              >
                <CustomButton
                  size="large"
                  onClick={item.onClick}
                  className="flex items-center justify-center gap-3 w-full"
                  data-help-id={item.label.toLowerCase().replace(/\s+/g, '-')}
                >
                  <item.icon className="w-6 h-6" />
                  <span>{item.label}</span>
                </CustomButton>
              </motion.div>
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
          <button 
            onClick={() => setShowComingSoonCarousel(true)}
            className="parchment-box opacity-90 relative overflow-hidden w-full text-left hover:scale-105 transition-transform cursor-pointer" 
            data-help-id="coming-soon"
          >
            <div className="absolute top-0 right-0 bg-primary text-white text-xs px-3 py-1 rounded-bl-lg font-bold">
              PREVIEW
            </div>
            <h3 className="font-serif font-bold text-lg mb-2 text-primary flex items-center gap-2">
              <Lock className="w-5 h-5" /> Coming Soon
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              {comingSoonFeatures[carouselIndex].title}
            </p>
            <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary/50 w-3/4 rounded-full" />
            </div>
          </button>
        </motion.div>

        {/* Footer */}
        <AssetCreditsFooter />
      </div>

      {/* Coming Soon Carousel Popup */}
      {showComingSoonCarousel && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70"
          style={{ pointerEvents: 'auto' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowComingSoonCarousel(false);
            }
          }}
        >
          <div 
            className="bg-white rounded-xl shadow-2xl p-8 max-w-2xl mx-4 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setShowComingSoonCarousel(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Title */}
            <h2 className="text-2xl font-bold text-slate-900 mb-6 text-center pr-8">Coming Soon Features</h2>

            {/* Carousel */}
            <div className="flex items-center gap-4">
              {/* Left arrow */}
              <button
                onClick={handleCarouselPrev}
                className="flex-shrink-0 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-700"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              {/* Feature card */}
              <div className="flex-1 min-h-[300px] flex flex-col items-center justify-center text-center">
                {/* Image */}
                <img 
                  src={comingSoonFeatures[carouselIndex].image} 
                  alt={comingSoonFeatures[carouselIndex].title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <h3 className="text-xl font-semibold text-slate-900 mb-4">
                  {comingSoonFeatures[carouselIndex].title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {comingSoonFeatures[carouselIndex].description}
                </p>
              </div>

              {/* Right arrow */}
              <button
                onClick={handleCarouselNext}
                className="flex-shrink-0 p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition text-slate-700"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Indicator dots */}
            <div className="flex justify-center gap-2 mt-6">
              {comingSoonFeatures.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCarouselIndex(idx)}
                  className={`w-2 h-2 rounded-full transition ${idx === carouselIndex ? 'bg-slate-900' : 'bg-slate-300'}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </ParallaxBackground>
  );
}
