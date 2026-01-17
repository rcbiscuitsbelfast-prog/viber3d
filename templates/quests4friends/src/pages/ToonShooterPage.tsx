import { useEffect, useRef } from 'react';

export function ToonShooterPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Load the toonshooter game via iframe
    if (iframeRef.current) {
      iframeRef.current.src = '/toonshooter/index.html';
    }
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100vh',
        margin: 0,
        padding: 0,
        border: 'none',
        overflow: 'hidden',
      }}
    >
      <iframe
        ref={iframeRef}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          margin: 0,
          padding: 0,
        }}
        title="Toon Shooter"
      />
    </div>
  );
}
