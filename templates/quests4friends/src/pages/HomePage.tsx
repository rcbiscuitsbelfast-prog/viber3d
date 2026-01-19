import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import { ScrollToTop } from '../components/ScrollToTop';

export function HomePage() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className={`min-h-screen transition-colors ${
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
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-20">
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="text-8xl mb-6">🎮</div>
          
          <h1 className={`text-4xl sm:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6`}>
            Quests4Friends
          </h1>
          
          <p className={`text-lg sm:text-2xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-8 max-w-2xl mx-auto`}>
            Turn your messages into playable adventures.
            <br />
            Not a text. Not a game. A playable message.
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/builder"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-xl"
            >
              Create a Quest
            </Link>
            
            <Link
              to="/tile-builder"
              className="bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-emerald-700 hover:to-cyan-700 transition-all transform hover:scale-105 shadow-xl"
            >
              🧱 Tile Builder
            </Link>
            
            <Link
              to="/world-canvas-builder"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 shadow-xl"
            >
              🗺️ World Canvas Builder
            </Link>
            
            <Link
              to="/play/demo-quest"
              className={`${theme === 'dark' ? 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 border-white/30' : 'bg-black/10 backdrop-blur-sm text-gray-900 hover:bg-black/20 border-gray-900/30'} font-bold py-4 px-10 rounded-lg text-xl transition-all border-2`}
            >
              Try Demo
            </Link>

            <Link
              to="/minimal-demo"
              className="bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-green-700 hover:to-teal-700 transition-all transform hover:scale-105 shadow-xl"
            >
              Animation Demo
            </Link>

            <a
              href="/toonshooter/"
              className="bg-gradient-to-r from-red-600 to-orange-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-red-700 hover:to-orange-700 transition-all transform hover:scale-105 shadow-xl"
              target="_self"
            >
              🎮 Toon Shooter
            </a>

            <a
              href="http://localhost:3000"
              className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white font-bold py-4 px-10 rounded-lg text-xl hover:from-amber-700 hover:to-yellow-700 transition-all transform hover:scale-105 shadow-xl"
              target="_blank"
              rel="noopener noreferrer"
            >
              🏰 Clear the Dungeon
            </a>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 sm:gap-8 mt-12 sm:mt-20">
          <FeatureCard
            icon="⚡"
            title="Fast & Easy"
            description="Create a quest in under 5 minutes. No game design skills required."
          />
          <FeatureCard
            icon="🎨"
            title="Customizable"
            description="Choose your world, add NPCs, place collectibles, and craft your story."
          />
          <FeatureCard
            icon="📱"
            title="Share Anywhere"
            description="One link. Works on any device. No downloads needed."
          />
        </div>

        {/* How It Works */}
        <div className="mt-16 sm:mt-32">
          <h2 className={`text-3xl sm:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} text-center mb-8 sm:mb-12`}>
            How It Works
          </h2>
          
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <Step number="1" title="Choose Template" description="Pick Forest, Meadow, or Town" />
            <Step number="2" title="Build Quest" description="Add NPCs, enemies, and tasks" />
            <Step number="3" title="Add Reward" description="Your message, photo, or surprise" />
            <Step number="4" title="Share Link" description="Send to anyone, anywhere" />
          </div>
        </div>

        {/* CTA Section */}
        <div className={`mt-16 sm:mt-32 text-center ${theme === 'dark' ? 'bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-500/30' : 'bg-gradient-to-r from-purple-100/50 to-blue-100/50 border-purple-400/30'} rounded-2xl p-8 sm:p-12 border-2`}>
          <h2 className={`text-3xl sm:text-4xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
            Ready to create magic?
          </h2>
          <p className={`text-lg sm:text-xl ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-8`}>
            Start building your first quest today. Free forever.
          </p>
          <Link
            to="/builder"
            className="inline-block bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold py-4 px-12 rounded-lg text-xl hover:from-yellow-600 hover:to-orange-600 transition-all transform hover:scale-105 shadow-xl"
          >
            Get Started →
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className={`border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'} py-8 mt-12 sm:mt-20`}>
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
            © 2026 Quests4Friends. Made with ❤️ for meaningful connections.
          </p>
        </div>
      </footer>

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
