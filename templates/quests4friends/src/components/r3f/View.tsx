'use client';

import { forwardRef, Suspense, useImperativeHandle, useRef } from 'react';
import { OrbitControls, PerspectiveCamera, View as ViewImpl } from '@react-three/drei';
import { Three } from './Three';

export const Common = ({ color }: { color?: string }) => (
  <Suspense fallback={null}>
    {color && <color attach='background' args={[color]} />}
    <ambientLight intensity={0.5} />
    <pointLight position={[20, 30, 10]} intensity={3} decay={0.2} />
    <pointLight position={[-10, -10, -10]} color='blue' decay={0.2} />
    <PerspectiveCamera makeDefault fov={40} position={[0, 0, 6]} />
  </Suspense>
);

interface ViewProps extends React.HTMLAttributes<HTMLDivElement> {
  orbit?: boolean;
  children?: React.ReactNode;
}

const View = forwardRef<HTMLDivElement, ViewProps>(({ children, orbit, ...props }, ref) => {
  const localRef = useRef<HTMLDivElement>(null);
  useImperativeHandle(ref, () => localRef.current!);

  return (
    <>
      <div ref={localRef} {...props} />
      <Three>
        <ViewImpl track={localRef}>
          {children}
          {orbit && <OrbitControls />}
        </ViewImpl>
      </Three>
    </>
  );
});

View.displayName = 'View';

export { View };