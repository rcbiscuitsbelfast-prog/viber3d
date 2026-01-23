/**
 * Coming Soon placeholder. Accessible from Main Menu, Quest Type, etc.
 * See MASTER_PLAN.md.
 */

import { Link } from 'react-router-dom';
import { ParallaxBackground } from '../components/ui/medieval';

export function ComingSoonPage() {
  return (
    <ParallaxBackground>
      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto">
        <h1 className="text-3xl font-serif font-bold text-amber-100 mb-4">Coming Soon</h1>
        <p className="text-amber-200/80 text-center mb-8">
          Zombies, Pirates, Shoot ’Em Up, Sci-Fi, Mystery, Cyberpunk, Cartoon Chaos — more modes
          are on the way.
        </p>
        <Link
          to="/menu"
          className="px-6 py-3 rounded-lg bg-amber-700/80 text-white font-bold hover:bg-amber-600 transition-colors"
        >
          ← Back to Menu
        </Link>
      </div>
    </ParallaxBackground>
  );
}
