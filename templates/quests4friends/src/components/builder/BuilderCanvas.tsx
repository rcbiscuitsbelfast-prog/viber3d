import { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import { useBuilderStore } from '../../store/builderStore';
import * as THREE from 'three';
import { EntityPreview } from './EntityPreview';
import { AssetDefinition } from '../../types/builder.types';

interface BuilderCanvasProps {
  onDrop: (position: THREE.Vector3, asset: AssetDefinition) => void;
}

export function BuilderCanvas({ onDrop }: BuilderCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [canvasError, setCanvasError] = useState<string | null>(null);
  
  const {
    currentQuest,
    selectedEntityId,
    showGrid,
    snapToGrid,
    gridSize,
    selectEntity,
  } = useBuilderStore();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);

    try {
      const assetData = JSON.parse(e.dataTransfer.getData('application/json'));
      
      if (!canvasRef.current) return;

      // Calculate drop position in 3D space
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      // Simple ground plane calculation (y=0)
      // In a more complex setup, use raycasting
      const worldX = x * 10;
      const worldZ = y * 10;
      
      const position = new THREE.Vector3(worldX, 0, worldZ);

      // Snap to grid if enabled
      if (snapToGrid) {
        position.x = Math.round(position.x / gridSize) * gridSize;
        position.z = Math.round(position.z / gridSize) * gridSize;
      }

      onDrop(position, assetData);
    } catch (error) {
      console.error('Failed to parse dropped asset:', error);
    }
  };

  const handleCanvasClick = () => {
    // Deselect entity when clicking on empty canvas
    selectEntity(null);
  };

  if (!currentQuest) {
    return (
      <div className="flex-1 bg-gray-200 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <p className="text-xl font-semibold mb-2">No Quest Loaded</p>
          <p className="text-sm">Create a new quest to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={canvasRef}
      className={`flex-1 relative ${isDraggingOver ? 'ring-4 ring-purple-400' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Canvas
        camera={{ position: [15, 15, 15], fov: 50 }}
        shadows
        onClick={handleCanvasClick}
        onError={(error) => {
          console.error('Canvas error:', error);
          setCanvasError('WebGL rendering error occurred');
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
      >
        {/* Lighting */}
        <ambientLight
          color={currentQuest.environment.ambientLight.color}
          intensity={currentQuest.environment.ambientLight.intensity}
        />
        {currentQuest.environment.directionalLight && (
          <directionalLight
            color={currentQuest.environment.directionalLight.color}
            intensity={currentQuest.environment.directionalLight.intensity}
            position={[
              currentQuest.environment.directionalLight.position.x,
              currentQuest.environment.directionalLight.position.y,
              currentQuest.environment.directionalLight.position.z,
            ]}
            castShadow
          />
        )}

        {/* Grid */}
        {showGrid && (
          <Grid
            args={[100, 100]}
            cellSize={gridSize}
            cellColor="#888888"
            sectionSize={gridSize * 5}
            sectionColor="#666666"
            fadeDistance={50}
            fadeStrength={1}
            infiniteGrid
          />
        )}

        {/* Ground Plane */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#4a5568" opacity={0.5} transparent />
        </mesh>

        {/* Entities */}
        {currentQuest.entities.map((entity) => (
          <EntityPreview
            key={entity.id}
            entity={entity}
            isSelected={entity.id === selectedEntityId}
            onSelect={() => selectEntity(entity.id)}
          />
        ))}

        {/* Spawn Point Marker */}
        <mesh
          position={[
            currentQuest.environment.spawnPoint.x,
            currentQuest.environment.spawnPoint.y,
            currentQuest.environment.spawnPoint.z,
          ]}
        >
          <cylinderGeometry args={[0.5, 0.5, 0.1, 16]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>

        {/* Camera Controls */}
        <OrbitControls
          makeDefault
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2.1}
        />
      </Canvas>

      {/* Drag Indicator Overlay */}
      {isDraggingOver && (
        <div className="absolute inset-0 bg-purple-500 bg-opacity-10 pointer-events-none flex items-center justify-center">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4">
            <p className="text-lg font-semibold text-purple-600">
              Drop here to add asset
            </p>
          </div>
        </div>
      )}

      {/* Canvas Error Overlay */}
      {canvasError && (
        <div className="absolute inset-0 bg-red-500 bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-white text-center p-6">
            <p className="text-xl font-bold mb-2">3D Canvas Error</p>
            <p className="text-sm mb-4">{canvasError}</p>
            <button
              onClick={() => setCanvasError(null)}
              className="px-4 py-2 bg-white text-red-600 rounded font-semibold"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-70 text-white text-xs px-3 py-2 rounded pointer-events-none">
        <p>🖱️ Left: Rotate | Middle: Pan | Scroll: Zoom</p>
        <p>💡 Click entity to select | Click canvas to deselect</p>
      </div>

      {/* Grid Toggle */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <button
          onClick={() => useBuilderStore.getState().toggleGrid()}
          className={`px-3 py-2 rounded shadow-lg font-medium transition-colors ${
            showGrid
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {showGrid ? '◼️ Grid: ON' : '◻️ Grid: OFF'}
        </button>
        <button
          onClick={() => useBuilderStore.getState().toggleSnapToGrid()}
          className={`px-3 py-2 rounded shadow-lg font-medium transition-colors ${
            snapToGrid
              ? 'bg-purple-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          {snapToGrid ? '🧲 Snap: ON' : '🧲 Snap: OFF'}
        </button>
      </div>
    </div>
  );
}
