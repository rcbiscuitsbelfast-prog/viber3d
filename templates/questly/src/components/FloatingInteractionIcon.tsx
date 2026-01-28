import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingInteractionIconProps {
  position: [number, number, number];
  icon: string;
  label?: string;
  onClick?: () => void;
  color?: string;
}

export default function FloatingInteractionIcon({
  position,
  icon,
  label,
  onClick,
  color = '#3b82f6'
}: FloatingInteractionIconProps) {
  const groupRef = useRef<THREE.Group>(null);
  const floatOffset = useRef(0);
  const { camera } = useThree();

  // Floating animation and billboard effect
  useFrame((_, delta) => {
    if (groupRef.current) {
      floatOffset.current += delta * 2;
      groupRef.current.position.y = position[1] + Math.sin(floatOffset.current) * 0.3 + 2.5;
      
      // Billboard effect - always face camera
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Icon Background Circle */}
      <mesh position={[0, 0, 0]} onClick={onClick}>
        <circleGeometry args={[0.8, 32]} />
        <meshBasicMaterial color={color} opacity={0.9} transparent />
      </mesh>
      
      {/* Icon Text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={1}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-bold.woff"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {icon}
      </Text>
      
      {/* Label below icon */}
      {label && (
        <Text
          position={[0, -1.2, 0]}
          fontSize={0.4}
          color="white"
          anchorX="center"
          anchorY="middle"
          font="/fonts/inter-regular.woff"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
      
      {/* Clickable area indicator (pulsing ring) */}
      <mesh position={[0, 0, -0.01]}>
        <ringGeometry args={[0.8, 1.0, 32]} />
        <meshBasicMaterial 
          color={color} 
          opacity={0.3} 
          transparent 
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
