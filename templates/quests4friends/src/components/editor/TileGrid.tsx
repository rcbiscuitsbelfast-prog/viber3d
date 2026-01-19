import { TilePosition } from '../../types/editor.types';

/**
 * Visual grid component for tile editing (10x10 units)
 * Shows grid lines and handles mouse interactions for asset placement
 */

interface TileGridProps {
  size?: number;
  showGridLines?: boolean;
  gridColor?: string;
  gridOpacity?: number;
  onGridClick?: (position: TilePosition) => void;
  onGridHover?: (position: TilePosition | null) => void;
  isInteractive?: boolean;
}

export function TileGrid({ 
  size = 10, 
  showGridLines = true,
  gridColor = '#444444',
  gridOpacity = 0.3,
  onGridClick,
  isInteractive = true
}: TileGridProps) {
  // For now, just return a simple ground plane
  // This avoids complex TypeScript issues with Three.js
  return (
    <mesh 
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={(event: any) => {
        if (!isInteractive || !onGridClick) return;
        event.stopPropagation();
        // Simple click handler - convert to tile coordinates
        const point = event.point;
        const x = Math.floor(point.x + size / 2);
        const z = Math.floor(point.z + size / 2);
        if (x >= 0 && x < size && z >= 0 && z < size) {
          onGridClick({
            tileX: 0,
            tileY: 0,
            localPosition: [point.x + size / 2, 0, point.z + size / 2]
          });
        }
      }}
    >
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial 
        color="#4a7c59" 
        transparent 
        opacity={0.8}
      />
      
      {/* Simple grid lines */}
      {showGridLines && (
        <group>
          {/* Vertical lines */}
          {Array.from({ length: size + 1 }, (_, i) => (
            <line key={`v-${i}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    i - size / 2, 0, -size / 2,
                    i - size / 2, 0, size / 2
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color={gridColor} 
                transparent 
                opacity={gridOpacity}
              />
            </line>
          ))}
          
          {/* Horizontal lines */}
          {Array.from({ length: size + 1 }, (_, i) => (
            <line key={`h-${i}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([
                    -size / 2, 0, i - size / 2,
                    size / 2, 0, i - size / 2
                  ])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial 
                color={gridColor} 
                transparent 
                opacity={gridOpacity}
              />
            </line>
          ))}
        </group>
      )}
    </mesh>
  );
}

export default TileGrid;