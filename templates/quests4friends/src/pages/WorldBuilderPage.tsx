import React, { useState, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { WorldDraft, GridPosition } from '../types/editor.types';
import { WorldGrid } from '../components/editor/WorldGrid';
import { EditorControls } from '../components/editor/EditorControls';
import { WorldExporter } from '../systems/editor/WorldExporter';

/**
 * World Builder Page - Compose worlds by placing tiles on a grid
 * 
 * Features:
 * - NxN grid for placing tiles (10x10, 15x15, 20x20)
 * - Tile palette showing available saved tiles
 * - Real-time composition view
 * - Save/load/export functionality
 * - Grid snapping and placement controls
 */

interface TileTemplate {
  id: string;
  name: string;
  preview?: string;
}

export function WorldBuilderPage() {
  const navigate = useNavigate();
  
  // World state
  const [worldName, setWorldName] = useState('untitled_world');
  const [gridSize, setGridSize] = useState(15); // Default 15x15
  const [tiles, setTiles] = useState<(string | null)[][]>([]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [hoverPosition, setHoverPosition] = useState<GridPosition | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Available tile templates (mock data for now)
  const availableTiles: TileTemplate[] = [
    { id: 'tile_forest_01', name: 'Forest Corner' },
    { id: 'tile_meadow_01', name: 'Meadow Clearing' },
    { id: 'tile_rocks_01', name: 'Rocky Outcrop' },
    { id: 'tile_flowers_01', name: 'Flower Field' },
    { id: 'tile_water_01', name: 'Water Pond' }
  ];

  // Initialize tiles grid
  React.useEffect(() => {
    const newTiles = Array(gridSize).fill(null).map(() => Array(gridSize).fill(null));
    setTiles(newTiles);
  }, [gridSize]);

  // Create world draft
  const createWorldDraft = useCallback((): WorldDraft => {
    return {
      id: WorldExporter.generateWorldId ? WorldExporter.generateWorldId() : `world_${Date.now()}`,
      name: worldName.trim() || 'untitled_world',
      gridSize,
      tiles: tiles.map(row => [...row]), // Deep copy
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        tileSize: 10,
        description: ''
      }
    };
  }, [worldName, gridSize, tiles]);

  // Handle tile placement
  const handleTilePlace = useCallback((position: GridPosition) => {
    if (!selectedTileId) return;
    
    setTiles(prev => {
      const newTiles = prev.map(row => [...row]);
      newTiles[position.y][position.x] = selectedTileId;
      return newTiles;
    });
    
    setIsDirty(true);
  }, [selectedTileId]);

  // Handle tile removal
  const handleTileRemove = useCallback((position: GridPosition) => {
    setTiles(prev => {
      const newTiles = prev.map(row => [...row]);
      newTiles[position.y][position.x] = null;
      return newTiles;
    });
    
    setIsDirty(true);
  }, []);

  // Grid interaction handlers
  const handleGridClick = useCallback((position: GridPosition) => {
    // If clicking on existing tile, remove it
    if (tiles[position.y]?.[position.x]) {
      handleTileRemove(position);
    } else if (selectedTileId) {
      // Otherwise place selected tile
      handleTilePlace(position);
    }
  }, [tiles, selectedTileId, handleTilePlace, handleTileRemove]);

  const handleGridHover = useCallback((position: GridPosition | null) => {
    setHoverPosition(position);
  }, []);

  // Save operations
  const handleSave = useCallback(() => {
    if (!worldName.trim()) {
      alert('Please enter a world name before saving.');
      return;
    }

    const worldDraft = createWorldDraft();
    
    // Validate world
    const validation = WorldExporter.validateWorldDraft(worldDraft);
    if (!validation.valid) {
      alert(`Validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsLoading(true);
    try {
      WorldExporter.saveToLocal(worldDraft);
      setIsDirty(false);
      alert(`World "${worldName}" saved successfully!`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save world. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [worldName, createWorldDraft]);

  const handleExportJSON = useCallback(() => {
    const worldDraft = createWorldDraft();
    try {
      WorldExporter.downloadAsJSON(worldDraft);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export world. Please try again.');
    }
  }, [createWorldDraft]);

  const handleImport = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        // TODO: Implement import logic
        console.log('Import data:', data);
        alert('Import functionality coming soon!');
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import file. Please check the file format.');
      }
    };
    reader.readAsText(file);
  }, []);

  const handleClear = useCallback(() => {
    setTiles(Array(gridSize).fill(null).map(() => Array(gridSize).fill(null)));
    setSelectedTileId(null);
    setIsDirty(false);
  }, [gridSize]);

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to create a new world?')) {
      return;
    }
    
    setWorldName('untitled_world');
    setGridSize(15);
    setTiles(Array(15).fill(null).map(() => Array(15).fill(null)));
    setSelectedTileId(null);
    setIsDirty(false);
  }, [isDirty]);

  const handleLoad = useCallback((worldId: string) => {
    try {
      const loadedWorld = WorldExporter.loadFromLocal(worldId);
      if (loadedWorld) {
        setWorldName(loadedWorld.name);
        setGridSize(loadedWorld.gridSize);
        setTiles(loadedWorld.tiles);
        setSelectedTileId(null);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load world. Please try again.');
    }
  }, []);

  const handleDuplicate = useCallback(() => {
    const newName = prompt('Enter name for duplicate:', `${worldName}_copy`);
    if (newName) {
      setWorldName(newName);
      setIsDirty(true);
    }
  }, [worldName]);

  // Generate tile colors for visualization
  const tileColors = useMemo(() => {
    const colors = new Map<string, string>();
    const colorPalette = [
      '#4a7c59', '#8b4513', '#696969', '#1e90ff', '#daa520',
      '#228b22', '#cd853f', '#2f4f4f', '#4682b4', '#f4a460'
    ];
    
    availableTiles.forEach((tile, index) => {
      colors.set(tile.id, colorPalette[index % colorPalette.length]);
    });
    
    return colors;
  }, [availableTiles]);

  // Calculate world statistics
  const worldStats = useMemo(() => {
    let placedCount = 0;
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (tiles[y]?.[x]) placedCount++;
      }
    }
    
    const totalTiles = gridSize * gridSize;
    const fillPercentage = (placedCount / totalTiles) * 100;
    
    return {
      placedCount,
      totalTiles,
      fillPercentage: Math.round(fillPercentage * 100) / 100
    };
  }, [tiles, gridSize]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Panel - Tile Palette */}
      <div className="w-80 flex flex-col">
        <div className="bg-gray-800 p-3 border-b border-gray-600">
          <h3 className="text-lg font-semibold mb-2">Tile Palette</h3>
          <p className="text-sm text-gray-400">Select a tile to place on the grid</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {availableTiles.map((tile) => (
            <button
              key={tile.id}
              onClick={() => setSelectedTileId(tile.id)}
              className={`w-full p-3 text-left rounded border transition-colors ${
                selectedTileId === tile.id
                  ? 'border-blue-500 bg-blue-600 bg-opacity-20'
                  : 'border-gray-600 bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div 
                  className="w-6 h-6 rounded"
                  style={{ backgroundColor: tileColors.get(tile.id) || '#444444' }}
                />
                <div>
                  <div className="font-medium">{tile.name}</div>
                  <div className="text-xs text-gray-400">{tile.id}</div>
                </div>
              </div>
            </button>
          ))}
          
          {availableTiles.length === 0 && (
            <div className="text-gray-500 text-center py-8">
              <p>No saved tiles found</p>
              <p className="text-sm">Create tiles in the Tile Editor first</p>
            </div>
          )}
        </div>
        
        {selectedTileId && (
          <div className="p-3 border-t border-gray-600 bg-gray-750">
            <div className="text-sm">
              <span className="text-gray-400">Selected: </span>
              <span className="text-blue-400 font-medium">
                {availableTiles.find(t => t.id === selectedTileId)?.name || selectedTileId}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Click on the grid to place this tile
            </div>
          </div>
        )}
      </div>

      {/* Center Panel - 3D Canvas */}
      <div className="flex-1 relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 bg-opacity-90 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={worldName}
              onChange={(e) => {
                setWorldName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="World name"
              className="px-3 py-1 bg-gray-700 rounded text-white placeholder-gray-400"
            />
            
            <select
              value={gridSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setGridSize(newSize);
                setIsDirty(true);
              }}
              className="px-3 py-1 bg-gray-700 rounded text-white"
            >
              <option value={10}>10x10</option>
              <option value={15}>15x15</option>
              <option value={20}>20x20</option>
            </select>
            
            {isDirty && <span className="text-yellow-400 text-sm">• Unsaved changes</span>}
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate('/')}
              className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => navigate('/tile-editor')}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 rounded text-sm transition-colors"
            >
              Tile Editor
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas shadows camera={{ position: [50, 50, 50], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[25, 25, 12]} 
            intensity={1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-100}
            shadow-camera-right={100}
            shadow-camera-top={100}
            shadow-camera-bottom={-100}
          />

          {/* Camera Controls */}
          <PerspectiveCamera makeDefault position={[50, 50, 50]} fov={50} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={20}
            maxDistance={200}
            target={[0, 0, 0]} // Focus on world center
          />

          {/* World Grid */}
          <WorldGrid
            size={gridSize}
            tileSize={10}
            showGridLines={true}
            gridColor="#666666"
            gridOpacity={0.4}
            onGridClick={handleGridClick}
            onGridHover={handleGridHover}
            isInteractive={true}
            placedTiles={tiles}
            tileColors={tileColors}
          />

          {/* Hover Position Indicator */}
          {hoverPosition && (
            <mesh
              position={[
                (hoverPosition.x * 10) - (gridSize * 10 / 2) + 5,
                0.01,
                (hoverPosition.y * 10) - (gridSize * 10 / 2) + 5
              ]}
            >
              <planeGeometry args={[10, 10]} />
              <meshBasicMaterial 
                color="#00ff00" 
                transparent 
                opacity={0.3}
                side={2}
              />
            </mesh>
          )}
        </Canvas>

        {/* Instructions & Stats */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-3 rounded text-sm">
          <h4 className="font-semibold mb-2">World Builder</h4>
          <ul className="space-y-1 text-gray-300 mb-3">
            <li>• Select tile from left panel</li>
            <li>• Click grid to place tile</li>
            <li>• Click placed tile to remove</li>
            <li>• Scroll to zoom, drag to rotate view</li>
          </ul>
          
          <div className="text-xs text-gray-400">
            <div>Placed: {worldStats.placedCount}/{worldStats.totalTiles} tiles</div>
            <div>Fill: {worldStats.fillPercentage}%</div>
          </div>
        </div>
      </div>

      {/* Right Panel - Editor Controls */}
      <div className="w-64">
        <EditorControls
          worldDraft={createWorldDraft()}
          onSave={handleSave}
          onExportJSON={handleExportJSON}
          onImport={handleImport}
          onClear={handleClear}
          onNew={handleNew}
          onLoad={handleLoad}
          onDuplicate={handleDuplicate}
          editorType="world"
          isLoading={isLoading}
          isDirty={isDirty}
        />
      </div>
    </div>
  );
}

export default WorldBuilderPage;