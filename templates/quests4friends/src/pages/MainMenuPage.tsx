/**
 * Main menu. Replit UI–inspired; Create / Play / Credits, Coming Soon.
 * See MASTER_PLAN.md – TinyQuests layout.
 */

import { CustomButton, ParallaxBackground } from '../components/ui/medieval';

export function MainMenuPage() {
  return (
    <ParallaxBackground>
      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full pt-20">
        <div className="w-full text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold font-serif text-amber-100 mb-2 leading-tight">
            Turn your messages into playable adventures.
          </h1>
          <p className="text-lg md:text-xl text-amber-200/80">
            Not a text. Not a game. A playable message.
          </p>
        </div>

        <div className="w-full space-y-4">
          <div className="mb-8 text-center bg-[#F3EFE0]/95 p-4 rounded-xl shadow-lg border-2 border-[#D4C4A8] rotate-1">
            <h2 className="text-2xl font-serif font-bold text-amber-900">Adventure Awaits!</h2>
            <p className="text-amber-800/80">Choose your path</p>
          </div>

          <div className="space-y-4 flex flex-col items-center">
            <CustomButton to="/builder" size="large" className="w-full max-w-sm">
              Create New Quest
            </CustomButton>
            <CustomButton to="/" size="large" className="w-full max-w-sm">
              Play Quests
            </CustomButton>
            <CustomButton to="/coming-soon" size="large" className="w-full max-w-sm">
              Credits
            </CustomButton>
          </div>
        </div>

        <div className="mt-12 w-full">
          <div className="bg-[#F3EFE0]/90 rounded-xl p-4 border-2 border-[#D4C4A8] relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-amber-700 text-white text-xs px-2 py-1 rounded-bl-lg font-bold">
              PREVIEW
            </div>
            <h3 className="font-serif font-bold text-lg mb-2 text-amber-900 flex items-center gap-2">
              <span aria-hidden>🔒</span> Coming Soon
            </h3>
            <p className="text-sm text-amber-800/80 mb-3">
              Daily challenges and multiplayer raids are being forged by our goblins.
            </p>
            <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
              <div className="h-full bg-amber-600/50 w-2/3 rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </ParallaxBackground>
  );
}
