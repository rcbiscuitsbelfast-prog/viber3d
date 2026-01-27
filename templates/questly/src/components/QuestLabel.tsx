// Quest Label Component using troika-three-text
// Renders 3D text labels for quest markers, NPCs, and interactive objects

import { useRef, useEffect, useState } from 'react';
import { Text } from 'troika-three-text';
import * as THREE from 'three';
import { useFrame, extend } from '@react-three/fiber';

// Extend R3F with troika-three-text
extend({ Text });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      text: any;
    }
  }
}

interface QuestLabelProps {
  position: [number, number, number];
  text: string;
  color?: string;
  fontSize?: number;
  billboard?: boolean; // Face camera always
  offset?: number; // Height offset above position
}

export function QuestLabel({
  position,
  text,
  color = '#ffffff',
  fontSize = 0.5,
  billboard = true,
  offset = 2,
}: QuestLabelProps) {
  const textRef = useRef<Text>(null);
  const groupRef = useRef<THREE.Group>(null);

  // Sync text mesh after updates
  useEffect(() => {
    if (textRef.current) {
      textRef.current.sync();
    }
  }, [text, color, fontSize]);

  // Billboard effect - face camera
  useFrame(({ camera }) => {
    if (billboard && groupRef.current) {
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={[position[0], position[1] + offset, position[2]]}>
      <text
        ref={textRef}
        text={text}
        fontSize={fontSize}
        color={color}
        anchorX="center"
        anchorY="middle"
        maxWidth={10}
        outlineWidth={0.02}
        outlineColor="#000000"
        outlineOpacity={0.8}
        depthOffset={-1}
        renderOrder={1000}
      />
      {/* Background plane for better readability */}
      <mesh position={[0, 0, -0.01]}>
        <planeGeometry args={[text.length * fontSize * 0.6, fontSize * 1.2]} />
        <meshBasicMaterial color="#000000" opacity={0.5} transparent />
      </mesh>
    </group>
  );
}

// Quest Marker Component - Visual indicator with label
export function QuestMarker({
  position,
  label,
  type = 'quest', // 'quest' | 'npc' | 'item' | 'location'
  color = '#ffd700',
  onClick,
  onHover,
}: {
  position: [number, number, number];
  label: string;
  type?: 'quest' | 'npc' | 'item' | 'location';
  color?: string;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
}) {
  const iconMap = {
    quest: '!',
    npc: '👤',
    item: '📦',
    location: '📍',
  };

  const groupRef = useRef<THREE.Group>(null);
  const pulseRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const timeRef = useRef(0);

  // Floating and pulsing animation
  useFrame((_state, delta) => {
    timeRef.current += delta;
    if (groupRef.current) {
      // Floating animation
      groupRef.current.position.y = position[1] + 1.5 + Math.sin(timeRef.current * 2) * 0.2;
      
      // Pulsing effect
      if (pulseRef.current) {
        const scale = hovered ? 1.5 : 1.0 + Math.sin(timeRef.current * 3) * 0.2;
        pulseRef.current.scale.setScalar(scale);
        const material = pulseRef.current.material as THREE.MeshStandardMaterial;
        material.opacity = hovered ? 0.6 : 0.3;
      }
    }
  });

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handlePointerOver = () => {
    setHovered(true);
    if (onHover) onHover(true);
  };

  const handlePointerOut = () => {
    setHovered(false);
    if (onHover) onHover(false);
  };

  return (
    <group 
      ref={groupRef} 
      position={position}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Floating icon */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial 
          color={hovered ? '#ffff00' : color} 
          emissive={hovered ? '#ffff00' : color} 
          emissiveIntensity={hovered ? 1.0 : 0.5} 
        />
      </mesh>
      
      {/* Pulsing effect */}
      <mesh ref={pulseRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={color} transparent opacity={0.3} />
      </mesh>
      
      {/* Label */}
      <QuestLabel
        position={[0, 0, 0]}
        text={`${iconMap[type]} ${label}`}
        color={hovered ? '#ffff00' : color}
        fontSize={hovered ? 0.5 : 0.4}
        offset={0.5}
      />
    </group>
  );
}
