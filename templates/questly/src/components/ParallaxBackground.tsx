import { ReactNode } from 'react';

interface ParallaxBackgroundProps {
  children: ReactNode;
}

export default function ParallaxBackground({ children }: ParallaxBackgroundProps) {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Gradient background */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-200 to-green-200"
        style={{ backgroundAttachment: 'fixed' }}
      />

      {/* Decorative floating elements */}
      <div className="absolute top-20 left-[10%] opacity-20 pointer-events-none">
        <div className="w-32 h-16 bg-white rounded-full blur-xl" />
      </div>
      <div className="absolute top-40 right-[15%] opacity-25 pointer-events-none">
        <div className="w-48 h-24 bg-white rounded-full blur-xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full min-h-screen flex flex-col">
        {children}
      </div>
    </div>
  );
}
