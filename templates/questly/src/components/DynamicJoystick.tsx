import { useState, useRef } from 'react';

interface DynamicJoystickProps {
  onMove: (dx: number, dy: number) => void;
  onRelease: () => void;
  visible: boolean; // Desktop = false, Mobile = true
}

export default function DynamicJoystick({ onMove, onRelease, visible }: DynamicJoystickProps) {
  const [active, setActive] = useState(false);
  const [basePosition, setBasePosition] = useState<{x: number, y: number} | null>(null);
  const [stickPosition, setStickPosition] = useState({x: 0, y: 0});
  const maxDistance = 50; // Max stick offset from base

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!visible) return;
    const touch = e.touches[0];
    // Only activate on left half of screen
    if (touch.clientX < window.innerWidth / 2) {
      e.preventDefault();
      setActive(true);
      setBasePosition({x: touch.clientX, y: touch.clientY});
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!active || !basePosition) return;
    e.preventDefault();
    const touch = e.touches[0];

    let deltaX = touch.clientX - basePosition.x;
    let deltaY = touch.clientY - basePosition.y;

    // Clamp to circle
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      deltaX = Math.cos(angle) * maxDistance;
      deltaY = Math.sin(angle) * maxDistance;
    }

    setStickPosition({x: deltaX, y: deltaY});

    // Normalize to -1 to 1 and call callback
    onMove(deltaX / maxDistance, deltaY / maxDistance);
  };

  const handleTouchEnd = () => {
    setActive(false);
    setBasePosition(null);
    setStickPosition({x: 0, y: 0});
    onRelease();
  };

  if (!visible) return null;

  return (
    <>
      {/* Full-screen touch area for left side */}
      <div
        className="fixed inset-0 touch-none pointer-events-auto z-40"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{width: '50%'}} // Left half only
      />

      {/* Visual joystick base and stick */}
      {active && basePosition && (
        <div
          className="fixed pointer-events-none z-50"
          style={{
            left: basePosition.x,
            top: basePosition.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* Base circle */}
          <div className="w-24 h-24 rounded-full bg-slate-800/60 border-2 border-slate-600" />

          {/* Stick */}
          <div
            className="absolute w-12 h-12 rounded-full bg-blue-500 border-2 border-blue-400"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${stickPosition.x}px), calc(-50% + ${stickPosition.y}px))`
            }}
          />
        </div>
      )}
    </>
  );
}
