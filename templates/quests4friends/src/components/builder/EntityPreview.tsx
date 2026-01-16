import { useRef } from 'react';
import { Entity } from '../../types/quest.types';
import { ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';

interface EntityPreviewProps {
  entity: Entity;
  isSelected: boolean;
  onSelect: () => void;
}

export function EntityPreview({ entity, isSelected, onSelect }: EntityPreviewProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // Determine color and geometry based on entity type
  const getEntityAppearance = () => {
    switch (entity.type) {
      case 'npc':
        return {
          color: '#4299e1',
          geometry: <capsuleGeometry args={[0.4, 1.2, 8, 16]} />,
        };
      case 'enemy':
        return {
          color: '#f56565',
          geometry: <capsuleGeometry args={[0.4, 1.2, 8, 16]} />,
        };
      case 'boss':
        return {
          color: '#742a2a',
          geometry: <capsuleGeometry args={[0.6, 1.8, 8, 16]} />,
        };
      case 'collectible':
        return {
          color: '#ffd700',
          geometry: <sphereGeometry args={[0.3, 16, 16]} />,
        };
      case 'object':
        return {
          color: '#8b4513',
          geometry: <boxGeometry args={[1, 1, 1]} />,
        };
      default:
        return {
          color: '#718096',
          geometry: <boxGeometry args={[1, 1, 1]} />,
        };
    }
  };

  const { color, geometry } = getEntityAppearance();

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onSelect();
  };

  return (
    <group
      position={[entity.position.x, entity.position.y, entity.position.z]}
      rotation={[entity.rotation.x, entity.rotation.y, entity.rotation.z]}
      scale={[entity.scale.x, entity.scale.y, entity.scale.z]}
    >
      {/* Main Mesh */}
      <mesh
        ref={meshRef}
        onClick={handleClick}
        castShadow
        receiveShadow
      >
        {geometry}
        <meshStandardMaterial
          color={color}
          emissive={isSelected ? color : '#000000'}
          emissiveIntensity={isSelected ? 0.3 : 0}
        />
      </mesh>

      {/* Selection Indicator */}
      {isSelected && (
        <>
          {/* Glow Ring */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
            <ringGeometry args={[0.8, 1, 32]} />
            <meshBasicMaterial color="#a855f7" transparent opacity={0.5} side={THREE.DoubleSide} />
          </mesh>
          
          {/* Vertical Lines */}
          <lineSegments>
            <edgesGeometry attach="geometry" args={[new THREE.BoxGeometry(2, 3, 2)]} />
            <lineBasicMaterial color="#a855f7" linewidth={2} />
          </lineSegments>
        </>
      )}

      {/* Entity Label */}
      <mesh position={[0, 2, 0]}>
        <planeGeometry args={[2, 0.4]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Type Indicator Icon */}
      <sprite position={[0, 2.5, 0]} scale={[0.5, 0.5, 0.5]}>
        <spriteMaterial
          color={isSelected ? '#ffffff' : '#cccccc'}
          transparent
          opacity={0.9}
        />
      </sprite>
    </group>
  );
}
