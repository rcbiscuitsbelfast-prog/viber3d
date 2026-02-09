import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Canvas } from '@react-three/fiber';
import { r3f } from '@/lib/tunnel';

interface R3FCanvasProps {
  className?: string;
  style?: CSSProperties;
}

export default function R3FCanvas({ className = 'fixed inset-0 -z-10', style }: R3FCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const contextCleanupRef = useRef<null | (() => void)>(null);
  const [contextLost, setContextLost] = useState(false);

  // Ensure event listeners are removed when the component unmounts
  useEffect(() => () => contextCleanupRef.current?.(), []);

  return (
    <div ref={canvasRef} className={className} style={style}>
      <Canvas
        shadows
        dpr={[1, 1.25]}
        camera={{ position: [0, 8, 18], fov: 50, far: 1500 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          preserveDrawingBuffer: false,
        }}
        onCreated={({ gl }) => {
          // Clean up any previous listeners before attaching new ones
          contextCleanupRef.current?.();

          const canvas = gl.domElement;
          const handleContextLost = (event: Event) => {
            event.preventDefault();
            setContextLost(true);
            console.warn('[R3FCanvas] WebGL context lost; attempting to recover');
          };
          const handleContextRestored = () => {
            setContextLost(false);
            gl.resetState();
            console.log('[R3FCanvas] WebGL context restored');
          };

          canvas.addEventListener('webglcontextlost', handleContextLost, false);
          canvas.addEventListener('webglcontextrestored', handleContextRestored, false);

          contextCleanupRef.current = () => {
            canvas.removeEventListener('webglcontextlost', handleContextLost, false);
            canvas.removeEventListener('webglcontextrestored', handleContextRestored, false);
          };
        }}
      >
        <r3f.Out />
      </Canvas>

      {contextLost && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white text-sm">
          Restoring graphics...
        </div>
      )}
    </div>
  );
}
