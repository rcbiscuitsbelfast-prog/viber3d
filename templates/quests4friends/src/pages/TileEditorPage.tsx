import { useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useNavigate } from 'react-router-dom';
import { AssetPlacement, TileDraft, TilePosition } from '../types/editor.types';
import { AssetPalette } from '../components/editor/AssetPalette';
import { TileGrid } from '../components/editor/TileGrid';
import { EditorControls } from '../components/editor/EditorControls';
import { TileExporter } from '../systems/editor/TileExporter';
import { ASSET_PALETTE } from '../systems/editor/AssetPalette';

/**
 * Tile Editor Page - Manual asset placement on 10x10 unit tiles
 * 
 * Features:
 * - 10x10 unit tile grid for manual asset placement
 * - Asset palette for selecting placeable objects
 * - Real-time 3D preview
 * - Save/load/export functionality
 * - Keyboard controls for asset manipulation
 */

export function TileEditorPage() {
  const navigate = useNavigate();
  
  // Tile state
  const [tileName, setTileName] = useState('untitled_tile');
  const [assets, setAssets] = useState<AssetPlacement[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hoverPosition, setHoverPosition] = useState<TilePosition | null>(null);

  // Generate unique ID for asset placements
  const generateId = () => `asset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create new tile draft
  const createTileDraft = useCallback((): TileDraft => {
    return {
      id: TileExporter.generateTileId(),
      name: tileName.trim() || 'untitled_tile',
      assets,
      createdAt: new Date(),
      updatedAt: new Date(),
      size: 10,
      baseTexture: 'grass'
    };
  }, [tileName, assets]);

  // Handle asset selection from palette
  const handleAssetSelect = useCallback((assetId: string) => {
    // In tile editor, selecting an asset from palette immediately places it
    if (!hoverPosition) return;
    
    const newAsset: AssetPlacement = {
      id: generateId(),
      assetId,
      position: hoverPosition.localPosition,
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    };
    
    setAssets(prev => [...prev, newAsset]);
    setSelectedAssetId(newAsset.id);
    setIsDirty(true);
  }, [hoverPosition]);

  // Grid interaction handlers
  const handleGridClick = useCallback((position: TilePosition) => {
    // Place asset if one is selected from palette
    // Note: Actual placement is handled in handleAssetSelect when asset is chosen from palette
    console.log('Grid clicked at:', position);
  }, []);

  const handleGridHover = useCallback((position: TilePosition | null) => {
    setHoverPosition(position);
  }, []);

  // Save operations
  const handleSave = useCallback(() => {
    if (!tileName.trim()) {
      alert('Please enter a tile name before saving.');
      return;
    }

    const tileDraft = createTileDraft();
    
    // Validate tile
    const validation = TileExporter.validateTileDraft(tileDraft);
    if (!validation.valid) {
      alert(`Validation failed:\n${validation.errors.join('\n')}`);
      return;
    }

    setIsLoading(true);
    try {
      TileExporter.saveToLocal(tileDraft);
      setIsDirty(false);
      alert(`Tile "${tileName}" saved successfully!`);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Failed to save tile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [tileName, createTileDraft]);

  const handleExportJSON = useCallback(() => {
    const tileDraft = createTileDraft();
    try {
      TileExporter.downloadAsJSON(tileDraft);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export tile. Please try again.');
    }
  }, [createTileDraft]);

  const handleExportGLB = useCallback(async () => {
    const tileDraft = createTileDraft();
    try {
      setIsLoading(true);
      await TileExporter.downloadAsGLB(tileDraft, ASSET_PALETTE);
    } catch (error) {
      console.error('GLB export failed:', error);
      alert('Failed to export GLB. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [createTileDraft]);

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
    setAssets([]);
    setSelectedAssetId(null);
    setIsDirty(false);
  }, []);

  const handleNew = useCallback(() => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to create a new tile?')) {
      return;
    }
    
    setTileName('untitled_tile');
    setAssets([]);
    setSelectedAssetId(null);
    setIsDirty(false);
  }, [isDirty]);

  const handleLoad = useCallback((tileId: string) => {
    try {
      const loadedTile = TileExporter.loadFromLocal(tileId);
      if (loadedTile) {
        setTileName(loadedTile.name);
        setAssets(loadedTile.assets);
        setSelectedAssetId(null);
        setIsDirty(false);
      }
    } catch (error) {
      console.error('Load failed:', error);
      alert('Failed to load tile. Please try again.');
    }
  }, []);

  const handleDuplicate = useCallback(() => {
    const newName = prompt('Enter name for duplicate:', `${tileName}_copy`);
    if (newName) {
      setTileName(newName);
      setIsDirty(true);
    }
  }, [tileName]);

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Left Panel - Asset Palette */}
      <div className="w-80 flex flex-col">
        <AssetPalette
          onSelectAsset={handleAssetSelect}
          selectedAssetId={selectedAssetId}
        />
      </div>

      {/* Center Panel - 3D Canvas */}
      <div className="flex-1 relative">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gray-800 bg-opacity-90 p-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={tileName}
              onChange={(e) => {
                setTileName(e.target.value);
                setIsDirty(true);
              }}
              placeholder="Tile name"
              className="px-3 py-1 bg-gray-700 rounded text-white placeholder-gray-400"
            />
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
              onClick={() => navigate('/world-builder')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 rounded text-sm transition-colors"
            >
              World Builder
            </button>
          </div>
        </div>

        {/* 3D Canvas */}
        <Canvas shadows camera={{ position: [15, 15, 15], fov: 50 }}>
          {/* Lighting */}
          <ambientLight intensity={0.6} />
          <directionalLight 
            position={[10, 10, 5]} 
            intensity={1.0}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
          />

          {/* Camera Controls */}
          <PerspectiveCamera makeDefault position={[15, 15, 15]} fov={50} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            target={[5, 0, 5]} // Focus on tile center
          />

          {/* Tile Grid */}
          <TileGrid
            size={10}
            showGridLines={true}
            gridColor="#444444"
            gridOpacity={0.5}
            onGridClick={handleGridClick}
            onGridHover={handleGridHover}
            isInteractive={true}
          />

          {/* Asset Placement Handler - simplified for now */}
          {/* <AssetPlacementHandler /> */}

          {/* Hover Position Indicator */}
          {hoverPosition && (
            <mesh position={hoverPosition.localPosition}>
              <sphereGeometry args={[0.1]} />
              <meshBasicMaterial color="#00ff00" transparent opacity={0.8} />
            </mesh>
          )}
        </Canvas>

        {/* Instructions */}
        <div className="absolute bottom-4 left-4 bg-gray-800 bg-opacity-90 p-3 rounded text-sm">
          <h4 className="font-semibold mb-2">Tile Editor</h4>
          <ul className="space-y-1 text-gray-300">
            <li>• Select asset from left panel</li>
            <li>• Click grid to place asset</li>
            <li>• Click asset to select</li>
            <li>• R = rotate, +/- = scale, Delete = remove</li>
            <li>• Drag selected asset to move</li>
          </ul>
        </div>
      </div>

      {/* Right Panel - Editor Controls */}
      <div className="w-64">
        <EditorControls
          tileDraft={createTileDraft()}
          onSave={handleSave}
          onExportJSON={handleExportJSON}
          onExportGLB={handleExportGLB}
          onImport={handleImport}
          onClear={handleClear}
          onNew={handleNew}
          onLoad={handleLoad}
          onDuplicate={handleDuplicate}
          editorType="tile"
          isLoading={isLoading}
          isDirty={isDirty}
        />
      </div>
    </div>
  );
}

export default TileEditorPage;