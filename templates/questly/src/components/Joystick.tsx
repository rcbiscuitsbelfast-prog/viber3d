import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface JoystickProps {
  onMove: (dx: number, dy: number) => void;
  size?: number;
}

export default function Joystick({ onMove, size = 120 }: JoystickProps) {
  const [dragging, setDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const baseRef = useRef<HTMLDivElement>(null);
  const maxDistance = size / 2 - 24; // Maximum distance from center (accounting for stick size)

  const handleStart = (clientX: number, clientY: number) => {
    setDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!dragging) return;
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setDragging(false);
    setPosition({ x: 0, y: 0 });
    onMove(0, 0); // Reset movement
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;

    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let deltaX = clientX - centerX;
    let deltaY = clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Clamp to max distance
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }

    setPosition({ x: deltaX, y: deltaY });

    // Normalize to -1 to 1 range
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;

    onMove(normalizedX, normalizedY);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    e.preventDefault();
    handleEnd();
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleStart(e.clientX, e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging]);

  return (
    <div className="fixed bottom-24 left-8 z-50 select-none">
      <div
        ref={baseRef}
        className="relative rounded-full bg-slate-800/60 border-2 border-slate-600 backdrop-blur-sm shadow-lg"
        style={{ width: size, height: size }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-slate-500/50 transform -translate-x-1/2 -translate-y-1/2" />

        {/* Joystick stick */}
        <motion.div
          className="absolute top-1/2 left-1/2 w-12 h-12 rounded-full bg-blue-500 shadow-lg border-2 border-blue-400"
          style={{
            x: position.x - 24, // Center the stick (24 = half of 48px)
            y: position.y - 24,
          }}
          animate={{
            scale: dragging ? 1.1 : 1,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />

        {/* Directional indicators */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Up */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-slate-600/30 rounded-full" />
          {/* Down */}
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-4 bg-slate-600/30 rounded-full" />
          {/* Left */}
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 h-1 w-4 bg-slate-600/30 rounded-full" />
          {/* Right */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 h-1 w-4 bg-slate-600/30 rounded-full" />
        </div>
      </div>

      {/* Label */}
      <div className="text-center mt-2 text-xs text-slate-400 font-medium">
        Move
      </div>
    </div>
  );
}
