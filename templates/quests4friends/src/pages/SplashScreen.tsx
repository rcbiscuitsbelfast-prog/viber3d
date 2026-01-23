/**
 * Splash screen. Replit UI–inspired; video + Start button.
 * Flow: video plays → Start → /menu (or quest link when opened via quest URL).
 * See MASTER_PLAN.md.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomButton } from '../components/ui/medieval';

export function SplashScreen() {
  const navigate = useNavigate();
  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowButton(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-black text-white">
      <div className="relative flex h-1/2 items-center justify-center bg-black px-4 pt-8">
        <div className="relative aspect-video w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-black shadow-[0_25px_60px_-30px_rgba(0,0,0,0.65)]">
          <video
            className="h-full w-full object-cover"
            src="/replit-ui/grok1.mp4"
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black" />
        </div>
      </div>

      <div className="relative flex h-1/2 items-end justify-center overflow-hidden bg-gradient-to-b from-black to-black px-4 pb-12">
        <div
          className={`relative z-10 transition-all duration-700 ease-out ${
            showButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
          }`}
        >
          <CustomButton onClick={() => navigate('/menu')} size="large">
            <span>Start Adventure</span>
            <span aria-hidden>▶</span>
          </CustomButton>
        </div>
      </div>
    </div>
  );
}
