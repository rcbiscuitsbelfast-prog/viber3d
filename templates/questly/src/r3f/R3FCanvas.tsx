import { useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { r3f } from '@/lib/tunnel';

export default function R3FCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={canvasRef} className="fixed inset-0 -z-10">
      <Canvas
        shadows
        camera={{ position: [0, 0, 5], fov: 50 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        <r3f.Out />
      </Canvas>
    </div>
  );
}
