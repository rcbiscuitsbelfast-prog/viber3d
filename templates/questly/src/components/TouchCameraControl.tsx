import { useRef } from 'react';

interface TouchCameraControlProps {
  onRotate: (deltaX: number, deltaY: number) => void;
  visible: boolean;
}

export default function TouchCameraControl({ onRotate, visible }: TouchCameraControlProps) {
  const lastTouch = useRef<{x: number, y: number} | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!visible) return;
    const touch = e.touches[0];
    // Only activate on right half of screen
    if (touch.clientX >= window.innerWidth / 2) {
      lastTouch.current = {x: touch.clientX, y: touch.clientY};
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!lastTouch.current) return;
    e.preventDefault();
    const touch = e.touches[0];

    const deltaX = touch.clientX - lastTouch.current.x;
    const deltaY = touch.clientY - lastTouch.current.y;

    onRotate(deltaX, deltaY);

    lastTouch.current = {x: touch.clientX, y: touch.clientY};
  };

  const handleTouchEnd = () => {
    lastTouch.current = null;
  };

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 touch-none pointer-events-auto z-40"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{left: '50%'}} // Right half only
    />
  );
}
