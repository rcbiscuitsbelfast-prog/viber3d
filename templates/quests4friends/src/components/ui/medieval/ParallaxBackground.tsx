/**
 * Parallax-style background. Replit UI–inspired; uses /replit-ui/ background.
 * See MASTER_PLAN.md – medieval fantasy, nature-infused.
 */

import type { ReactNode } from 'react';

interface ParallaxBackgroundProps {
  children: ReactNode;
}

export function ParallaxBackground({ children }: ParallaxBackgroundProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none z-0"
        style={{
          backgroundImage: 'url(/replit-ui/background.png)',
          backgroundAttachment: 'fixed',
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none z-[1]" />
      <div className="relative z-10 w-full min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
