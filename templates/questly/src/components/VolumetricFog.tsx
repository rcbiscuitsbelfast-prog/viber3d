// Volumetric Fog Component (Donut-shaped cloud ring)
// SAVED FOR FUTURE USE - Was working well at normal speed
// To re-enable: Import this component and uncomment the usage in TestWorld.tsx

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// NOTE: This component was saved from TestWorld.tsx
// It was working well at normal speed but had issues with bubbleSpeed = 0
// The AnimatedBubble component has been fixed to properly stop when bubbleSpeed === 0

// Animated Bubble Component
function AnimatedBubble({ 
  baseAngle, 
  radius, 
  baseY, 
  scale, 
  speed, 
  verticalSpeed, 
  cloudTexture, 
  fogColor, 
  opacity,
  bubbleSpeed
}: { 
  baseAngle: number; 
  radius: number; 
  baseY: number; 
  scale: number; 
  speed: number; 
  verticalSpeed: number; 
  cloudTexture: THREE.Texture; 
  fogColor: string; 
  opacity: number;
  bubbleSpeed: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const angleRef = useRef(baseAngle);
  const yPosRef = useRef(baseY);
  const verticalPhaseRef = useRef(0); // Phase accumulator for smooth vertical oscillation
  
  // Constrain radius to stay within donut bounds (165 to 240 units from center)
  const minRadius = 165;
  const maxRadius = 240;
  const clampedRadius = Math.max(minRadius, Math.min(maxRadius, radius));
  
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // When bubbleSpeed is 0, stop all movement
    if (bubbleSpeed === 0) {
      return; // Early return - no movement at all
    }
    
    // Clamp delta to reasonable values (prevent huge spikes)
    const clampedDelta = Math.min(Math.max(delta, 0), 0.1);
    
    // Update angle for orbital motion - very slow rotation, affected by bubbleSpeed
    const angleDelta = speed * clampedDelta * bubbleSpeed;
    angleRef.current += angleDelta;
    
    // Update vertical position with very slow vertical drift - use delta-based accumulation
    verticalPhaseRef.current += clampedDelta * 0.01 * bubbleSpeed; // Very slow phase accumulation
    yPosRef.current = baseY + verticalSpeed * Math.sin(verticalPhaseRef.current) * 0.5;
    
    // Calculate position in circular orbit around the donut
    const x = Math.cos(angleRef.current) * clampedRadius;
    const z = Math.sin(angleRef.current) * clampedRadius;
    const y = yPosRef.current;
    
    // Set position
    meshRef.current.position.set(x, y, z);
  });
  
  return (
    <mesh ref={meshRef} renderOrder={1000}>
      <sphereGeometry args={[scale, 16, 16]} />
      <meshBasicMaterial
        map={cloudTexture}
        color={fogColor}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// Volumetric Fog Component (Donut-shaped cloud ring)
export function VolumetricFog({ timeOfDay, fogHeight, bubbleScale, bubbleDensity, bubbleSpeed }: { timeOfDay: number; fogHeight: number; bubbleScale: number; bubbleDensity: number; bubbleSpeed: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Create noisy cloud texture
  const cloudTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    
    // Create base cloud texture with noise
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 512, 512);
    
    // Add multiple noise layers for cloud effect
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 120 + 60;
      const opacity = Math.random() * 0.4;
      
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 512, 512);
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(6, 3);
    return texture;
  }, []);
  
  // Very slow rotation animation for rolling fog effect - use delta time
  useFrame((state, delta) => {
    if (groupRef.current) {
      // When bubbleSpeed is 0, stop all rotation
      if (bubbleSpeed === 0) {
        return; // Early return - no rotation at all
      }
      
      // Clamp delta to reasonable values
      const clampedDelta = Math.min(Math.max(delta, 0), 0.1);
      const rotationDelta = clampedDelta * 0.001 * bubbleSpeed;
      
      groupRef.current.rotation.y += rotationDelta;
    }
  });
  
  // Smooth fog color transition from day to night
  const getFogColor = (time: number) => {
    // Day: light blue-grey, Night: medium grey
    // Smooth transition during sunrise/sunset
    if (time >= 0.25 && time <= 0.75) {
      // Day time
      if (time < 0.35) {
        // Sunrise transition
        const t = (time - 0.25) / 0.1;
        return `rgb(${Math.floor(58 + (229-58)*t)}, ${Math.floor(69 + (240-69)*t)}, ${Math.floor(80 + (247-80)*t)})`;
      } else if (time > 0.65) {
        // Sunset transition
        const t = (time - 0.65) / 0.1;
        return `rgb(${Math.floor(229 - (229-58)*t)}, ${Math.floor(240 - (240-69)*t)}, ${Math.floor(247 - (247-80)*t)})`;
      }
      return '#e5f0f7'; // Full day
    }
    return '#3a4550'; // Night
  };
  const fogColor = getFogColor(timeOfDay);
  
  return (
    <group ref={groupRef}>
      {/* Flattened main torus - squeezed donut sitting on water */}
      <mesh position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.08]}>
        <torusGeometry args={[190, 25, 24, 48]} />
        <meshBasicMaterial
          map={cloudTexture}
          color={fogColor}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Flattened outer torus for thicker edge */}
      <mesh position={[0, fogHeight, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.08]}>
        <torusGeometry args={[220, 20, 20, 40]} />
        <meshBasicMaterial
          map={cloudTexture}
          color={fogColor}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      
      {/* Dense bubbly spheres on ocean surface - inner layer - reduced count for performance */}
      {Array.from({ length: Math.floor(20 * bubbleDensity) }).map((_, i) => {
        const totalCount = Math.floor(20 * bubbleDensity);
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = 170 + (Math.sin(i * 2.5) * 25);
        const baseY = fogHeight + (Math.random() * 6);
        const scale = (20 + Math.random() * 25) * bubbleScale;
        
        return (
          <AnimatedBubble
            key={`inner-${i}`}
            baseAngle={baseAngle}
            radius={radiusVariation}
            baseY={baseY}
            scale={scale}
            speed={0.0001 + Math.random() * 0.00005}
            verticalSpeed={0.05}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.5}
            bubbleSpeed={bubbleSpeed}
          />
        );
      })}
      
      {/* Very dense bubbly spheres on ocean surface - outer layer - reduced count for performance */}
      {Array.from({ length: Math.floor(40 * bubbleDensity) }).map((_, i) => {
        const totalCount = Math.floor(40 * bubbleDensity);
        const baseAngle = (i / totalCount) * Math.PI * 2;
        const radiusVariation = 210 + (Math.sin(i * 1.8) * 35) + Math.random() * 20;
        const baseY = fogHeight + (Math.random() * 8);
        const scale = (25 + Math.random() * 40) * bubbleScale;
        
        return (
          <AnimatedBubble
            key={`outer-${i}`}
            baseAngle={baseAngle}
            radius={radiusVariation}
            baseY={baseY}
            scale={scale}
            speed={0.00008 + Math.random() * 0.00004}
            verticalSpeed={0.05}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.6}
            bubbleSpeed={bubbleSpeed}
          />
        );
      })}
      
      {/* Extra small bubbles for detail - reduced count for performance */}
      {Array.from({ length: Math.floor(20 * bubbleDensity) }).map((_, i) => {
        const baseAngle = Math.random() * Math.PI * 2;
        const radius = 180 + Math.random() * 60;
        const baseY = fogHeight + (Math.random() * 5);
        const scale = (12 + Math.random() * 18) * bubbleScale;
        
        return (
          <AnimatedBubble
            key={`detail-${i}`}
            baseAngle={baseAngle}
            radius={radius}
            baseY={baseY}
            scale={scale}
            speed={0.00012 + Math.random() * 0.00008}
            verticalSpeed={0.05}
            cloudTexture={cloudTexture}
            fogColor={fogColor}
            opacity={0.5}
            bubbleSpeed={bubbleSpeed}
          />
        );
      })}
    </group>
  );
}
