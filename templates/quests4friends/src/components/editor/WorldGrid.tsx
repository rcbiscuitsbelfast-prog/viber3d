import React, { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { GridPosition } from '../../types/editor.types';

/**
 * Visual grid component for world building (NxN tiles)
 * Shows grid cells for placing tiles and handles mouse interactions
 */

interface WorldGridProps {
  size: number;
  tileSize?: number;
  showGridLines?: boolean;
  gridColor?: string;
  gridOpacity?: number;
  onGridClick?: (position: GridPosition) => void;
  onGridHover?: (position: GridPosition | null) => void;
  isInteractive?: boolean;
  placedTiles?: (string | null)[][];
  tileColors?: Map<string, string>;
}

export function WorldGrid({ 
  size,
  tileSize = 10,
  showGridLines = true,
  gridColor = '#666666',
  gridOpacity = 0.4,
  onGridClick,
  onGridHover,
  isInteractive = true,
  placedTiles = [],
  tileColors = new Map()
}: WorldGridProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const hoverRef = useRef<THREE.Mesh>(null);
  const [hoverPosition, setHoverPosition] = useState<GridPosition | null>(null);

  // Calculate total world size
  const worldSize = size * tileSize;
  const halfWorldSize = worldSize / 2;

  // Create grid lines geometry
  const gridGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions: number[] = [];
    
    // Create grid lines for each tile boundary
    for (let i = 0; i <= size; i++) {
      const pos = (i * tileSize) - halfWorldSize;
      
      // Vertical lines (x-axis)
      positions.push(pos, 0, -halfWorldSize);
      positions.push(pos, 0, halfWorldSize);
      
      // Horizontal lines (z-axis)
      positions.push(-halfWorldSize, 0, pos);
      positions.push(halfWorldSize, 0, pos);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geometry;
  }, [size, tileSize, halfWorldSize]);

  // Create hover indicator geometry
  const hoverGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [tileSize]);

  // Create tile placement visualization
  const tilePlacements = useMemo(() => {
    const placements: React.ReactNode[] = [];
    
    if (placedTiles && placedTiles.length > 0) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const tileId = placedTiles[y]?.[x];
          if (tileId) {
            const color = tileColors.get(tileId) || '#444444';
            const positionX = (x * tileSize) - halfWorldSize + (tileSize / 2);
            const positionZ = (y * tileSize) - halfWorldSize + (tileSize / 2);
            
            placements.push(
              <mesh
                key={`tile-${x}-${y}`}
                position={[positionX, -0.01, positionZ]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <planeGeometry args={[tileSize, tileSize]} />
                <meshBasicMaterial 
                  color={color} 
                  transparent 
                  opacity={0.6}
                  side={THREE.DoubleSide}
                />
              </mesh>
            );
          }
        }
      }
    }
    
    return placements;
  }, [placedTiles, size, tileSize, halfWorldSize, tileColors]);

  // Handle mouse interactions
  const handlePointerMove = (event: any) => {
    if (!isInteractive || !onGridHover) return;
    
    const point = event.point;
    
    // Convert world coordinates to grid coordinates
    const gridX = Math.floor((point.x + halfWorldSize) / tileSize);
    const gridZ = Math.floor((point.z + halfWorldSize) / tileSize);
    
    // Clamp to grid bounds
    if (gridX >= 0 && gridX < size && gridZ >= 0 && gridZ < size) {
      const gridPos: GridPosition = { x: gridX, y: gridZ };
      setHoverPosition(gridPos);
      onGridHover(gridPos);
      
      // Update hover indicator position
      if (hoverRef.current) {
        const hoverX = (gridX * tileSize) - halfWorldSize + (tileSize / 2);
        const hoverZ = (gridZ * tileSize) - halfWorldSize + (tileSize / 2);
        hoverRef.current.position.set(hoverX, 0.01, hoverZ);
      }
    } else {
      setHoverPosition(null);
      onGridHover(null);
    }
  };

  const handlePointerLeave = () => {
    if (!isInteractive || !onGridHover) return;
    setHoverPosition(null);
    onGridHover(null);
  };

  const handlePointerDown = (event: any) => {
    if (!isInteractive || !onGridClick) return;
    
    event.stopPropagation();
    
    if (hoverPosition) {
      onGridClick(hoverPosition);
    }
  };

  useFrame(() => {
    // Animate hover indicator if needed
  });

  return (
    <group>
      {/* Tile placements */}
      <group>
        {tilePlacements}
      </group>
      
      {/* Grid lines */}
      {showGridLines && (
        <lineSegments
          geometry={gridGeometry}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onPointerDown={handlePointerDown}
        >
          <lineBasicMaterial 
            color={gridColor} 
            transparent 
            opacity={gridOpacity}
            linewidth={1}
          />
        </lineSegments>
      )}
      
      {/* Hover indicator */}
      <mesh
        ref={hoverRef}
        geometry={hoverGeometry}
        visible={hoverPosition !== null}
      >
        <meshBasicMaterial 
          color="#00ff00" 
          transparent 
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Ground plane for raycasting */}
      <mesh
        ref={meshRef}
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerDown={handlePointerDown}
        visible={false}
      >
        <planeGeometry args={[worldSize, worldSize]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
    </group>
  );
}

export default WorldGrid;