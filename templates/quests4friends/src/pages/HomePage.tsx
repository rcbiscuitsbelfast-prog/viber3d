import { Link } from 'react-router-dom';

export function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-black">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          {/* Logo */}
          <div className="text-8xl mb-6">🎮</div>
          
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-6">
            Quests4Friends
          </h1>
          
          <p className="text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
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
              to="/play/demo-quest"
              className="bg-white/10 backdrop-blur-sm text-white font-bold py-4 px-10 rounded-lg text-xl hover:bg-white/20 transition-all border-2 border-white/30"
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
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-20">
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
        <div className="mt-32">
          <h2 className="text-4xl font-bold text-white text-center mb-12">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            <Step number="1" title="Choose Template" description="Pick Forest, Meadow, or Town" />
            <Step number="2" title="Build Quest" description="Add NPCs, enemies, and tasks" />
            <Step number="3" title="Add Reward" description="Your message, photo, or surprise" />
            <Step number="4" title="Share Link" description="Send to anyone, anywhere" />
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 text-center bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl p-12 border-2 border-purple-500/30">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to create magic?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
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
      <footer className="border-t border-white/10 py-8 mt-20">
        <div className="container mx-auto px-6 text-center text-gray-400">
          <p>© 2026 Quests4Friends. Made with ❤️ for meaningful connections.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 hover:bg-white/10 transition-all">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-3xl w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        {number}
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-gray-400">{description}</p>
    </div>
  );
}
