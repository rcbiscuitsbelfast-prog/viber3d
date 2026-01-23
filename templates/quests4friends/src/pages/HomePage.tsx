import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { ScrollToTop } from '../components/ScrollToTop';

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  // One-time hard reset: delete all existing saved tiles/worlds so you can rebuild clean.
  useEffect(() => {
    const flagKey = 'q4f_hard_reset_v1_done';
    if (localStorage.getItem(flagKey) === 'true') return;

    const keys = Object.keys(localStorage);
    for (const k of keys) {
      if (
        k.startsWith('tile_') ||
        k.startsWith('tile_glb_') ||
        k.startsWith('world_') ||
        k.startsWith('world_glb_')
      ) {
        localStorage.removeItem(k);
      }
    }
    localStorage.setItem(flagKey, 'true');
    // eslint-disable-next-line no-console
    console.log('[HardReset] Cleared saved tiles/worlds from localStorage');
  }, []);

  return (
    <div className={`h-screen overflow-y-auto transition-colors ${
      theme === 'dark' 
        ? 'bg-gradient-to-b from-blue-900 via-purple-900 to-black' 
        : 'bg-gradient-to-b from-blue-100 via-purple-100 to-gray-50'
    }`}>
      {/* Theme Toggle */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={toggleTheme}
          className={`p-3 rounded-full shadow-lg transition-all ${
            theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-yellow-300'
              : 'bg-white hover:bg-gray-100 text-gray-900'
          }`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      {/* Hero Section */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-8">
          {/* Logo */}
          <div className="text-6xl sm:text-8xl mb-4">🎮</div>
          
          <h1 className={`text-3xl sm:text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-4`}>
            Quests4Friends
          </h1>
          
          <p className={`text-base sm:text-xl md:text-2xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-4 max-w-2xl mx-auto`}>
            Turn your messages into playable adventures.
            <br />
            Not a text. Not a game. A playable message.
          </p>
          
          {/* Three Column Layout - Remove scrolling box, use normal flow */}
          <div className="px-2 py-2">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
              {/* Left Column - Original Features */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-blue-300' : 'text-blue-600'} mb-1`}>
                  📦 Original Features
                </h3>

                <Link
                  to="/splash"
                  className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-amber-700 hover:to-amber-800 transition-all transform hover:scale-105 shadow-xl"
                >
                  🎬 TinyQuests Flow
                </Link>
                
                <Link
                  to="/builder"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  Create a Quest
                </Link>
                
                <Link
                  to="/tile-creation"
                  className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-emerald-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  🧱 Tile Creation
                </Link>
                
                <Link
                  to="/world-from-tiles"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  🌎 World From Tiles
                </Link>
                
                <Link
                  to="/play/demo-quest"
                  className={`${theme === 'dark' ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/30' : 'bg-black/10 backdrop-blur-sm text-gray-900 hover:bg-black/20 border-gray-900/30'} font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg transition-all border-2`}
                >
                  Try Demo
                </Link>

                <Link
                  to="/minimal-demo"
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  Animation Demo
                </Link>
              </div>

              {/* Right Column - Kenny Block Builder */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'} mb-1`}>
                  🎨 Kenny Block Builder
                </h3>
                
                <Link
                  to="/kenny-blocks"
                  className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-orange-700 hover:to-red-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  🧩 Kenny Blocks
                </Link>
                
                <Link
                  to="/kenny-demo"
                  className="bg-gradient-to-r from-red-600 to-pink-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-red-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  🎮 Kenny Demo
                </Link>
                
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} p-3 sm:p-4 rounded-lg text-left`}>
                  <h4 className={`text-sm sm:text-base md:text-lg font-bold mb-2 ${theme === 'dark' ? 'text-orange-300' : 'text-orange-600'}`}>
                    🛠️ Features:
                  </h4>
                  <ul className={`space-y-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>✓ Unlimited building area</li>
                    <li>✓ Camera rotation controls</li>
                    <li>✓ Exact mesh collision shapes</li>
                    <li>✓ Adjustable grid size</li>
                    <li>✓ Elevation controls (+/-)</li>
                    <li>✓ Save/load block groups</li>
                    <li>✓ Play saved worlds in demo</li>
                  </ul>
                </div>
              </div>

              {/* Third Column - React Three Next */}
              <div className="flex flex-col gap-2 sm:gap-3">
                <h3 className={`text-lg sm:text-xl md:text-2xl font-bold ${theme === 'dark' ? 'text-green-300' : 'text-green-600'} mb-1`}>
                  🚀 React Three Next
                </h3>
                
                <Link
                  to="/r3f-demo"
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  🎨 R3F Demo
                </Link>
                
                <Link
                  to="/r3f-blob"
                  className="bg-gradient-to-r from-teal-600 to-blue-600 text-white font-bold py-2 sm:py-3 px-6 sm:px-8 rounded-lg text-sm sm:text-lg hover:from-teal-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-xl"
                >
                  💧 Interactive Blob
                </Link>
                
                <div className={`${theme === 'dark' ? 'bg-white/5' : 'bg-black/5'} p-3 sm:p-4 rounded-lg text-left`}>
                  <h4 className={`text-sm sm:text-base md:text-lg font-bold mb-2 ${theme === 'dark' ? 'text-green-300' : 'text-green-600'}`}>
                    ⚡ Features:
                  </h4>
                  <ul className={`space-y-1 text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <li>✓ Next.js + R3F integration</li>
                    <li>✓ View component system</li>
                    <li>✓ No canvas unmounting</li>
                    <li>✓ GLSL shader support</li>
                    <li>✓ Multiple 3D views</li>
                    <li>✓ Optimized performance</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'} py-4 mt-4 text-center`}>
          <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2026 Quests4Friends. Made with ❤️
          </p>
        </div>
      </div>

      <ScrollToTop />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  const { theme } = useTheme();
  return (
    <div className={`${theme === 'dark' ? 'bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10' : 'bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-white'} rounded-xl p-6 sm:p-8 border transition-all`}>
      <div className="text-4xl sm:text-5xl mb-4">{icon}</div>
      <h3 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-3`}>{title}</h3>
      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  const { theme } = useTheme();
  return (
    <div className="text-center">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-2xl sm:text-3xl w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className={`text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>{title}</h3>
      <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>{description}</p>
    </div>
  );
}
