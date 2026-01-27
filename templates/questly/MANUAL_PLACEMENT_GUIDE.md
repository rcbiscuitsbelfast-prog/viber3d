# Manual Asset Placement & Mesh Export - Implementation Guide

Based on proven patterns from `templates/quests4friends/src/pages/MinimalDemoPage.tsx` and collision system.

## Phase 1: Manual Placement Mode

### 1.1 Add State Management (TestWorld.tsx)

```typescript
// Add after existing state
const [manualMode, setManualMode] = useState(false);
const [eraseMode, setEraseMode] = useState(false);
const [eraseBrushSize, setEraseBrushSize] = useState(2);
const [selectedAssetType, setSelectedAssetType] = useState<'tree' | 'rock' | 'grass' | 'bush' | null>(null);
const [manualAssets, setManualAssets] = useState<Array<{
  id: string;
  type: 'tree' | 'rock' | 'grass' | 'bush';
  position: [number, number, number];
  rotation: number;
  scale: number;
  variant?: number;
  treeType?: 'pine' | 'broad' | 'bushy';
}>>([]);
```

### 1.2 Create GroundClickHandler Component

Copy pattern from `MinimalDemoPage.tsx` lines 1603-1850:

```typescript
function GroundClickHandler({ 
  selectedAssetType,
  eraseMode,
  eraseBrushSize,
  manualAssets,
  getTerrainHeight,
  onPlaceAsset,
  onEraseAsset
}: {
  selectedAssetType: string | null;
  eraseMode: boolean;
  eraseBrushSize: number;
  manualAssets: Array<{ id: string; position: [number, number, number] }>;
  getTerrainHeight: (x: number, z: number) => number;
  onPlaceAsset: (data: { position: [number, number, number]; rotation: number; scale: number }) => void;
  onEraseAsset: (id: string) => void;
}) {
  const { camera, raycaster, pointer } = useThree();
  const groundPlane = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    const handleMouseUp = (event: MouseEvent) => {
      if (!groundPlane.current) return;

      // Raycast to get world position
      raycaster.setFromCamera(
        { x: (event.clientX / window.innerWidth) * 2 - 1, y: -(event.clientY / window.innerHeight) * 2 + 1 },
        camera
      );

      const worldPos = new THREE.Vector3();
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      raycaster.ray.intersectPlane(plane, worldPos);

      if (!worldPos || Math.abs(worldPos.x) > 100 || Math.abs(worldPos.z) > 100) return;

      if (eraseMode) {
        // Erase assets within brush radius
        const assetsToErase: string[] = [];
        for (const asset of manualAssets) {
          const distance = Math.sqrt(
            Math.pow(asset.position[0] - worldPos.x, 2) +
            Math.pow(asset.position[2] - worldPos.z, 2)
          );
          if (distance < eraseBrushSize) {
            assetsToErase.push(asset.id);
          }
        }
        assetsToErase.forEach(id => onEraseAsset(id));
      } else if (selectedAssetType) {
        // Place asset at clicked position
        const terrainHeight = getTerrainHeight(worldPos.x, worldPos.z);
        onPlaceAsset({
          position: [worldPos.x, terrainHeight, worldPos.z],
          rotation: Math.random() * Math.PI * 2,
          scale: 0.8 + Math.random() * 0.4
        });
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [selectedAssetType, eraseMode, eraseBrushSize, manualAssets, camera, raycaster, getTerrainHeight, onPlaceAsset, onEraseAsset]);

  return (
    <mesh
      ref={groundPlane}
      position={[0, 0, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      visible={false}
    >
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}
```

### 1.3 Add UI Controls

```tsx
{/* Manual Placement Section */}
<div className="pt-4 border-t border-slate-700 space-y-2">
  <h4 className="text-xs font-semibold text-purple-400">✏️ Manual Placement</h4>
  
  <button
    onClick={() => setManualMode(!manualMode)}
    className={`w-full font-bold py-2 px-4 rounded transition-colors ${
      manualMode ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-600 hover:bg-slate-700'
    } text-white`}
  >
    {manualMode ? '✓ Manual Mode ON' : 'Manual Mode OFF'}
  </button>
  
  {manualMode && (
    <>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => { setSelectedAssetType('tree'); setEraseMode(false); }}
          className={`py-2 px-3 rounded text-xs ${selectedAssetType === 'tree' ? 'bg-green-600' : 'bg-slate-700'}`}
        >
          🌲 Tree
        </button>
        <button
          onClick={() => { setSelectedAssetType('rock'); setEraseMode(false); }}
          className={`py-2 px-3 rounded text-xs ${selectedAssetType === 'rock' ? 'bg-slate-500' : 'bg-slate-700'}`}
        >
          🪨 Rock
        </button>
        <button
          onClick={() => { setSelectedAssetType('grass'); setEraseMode(false); }}
          className={`py-2 px-3 rounded text-xs ${selectedAssetType === 'grass' ? 'bg-lime-600' : 'bg-slate-700'}`}
        >
          🌿 Grass
        </button>
        <button
          onClick={() => { setSelectedAssetType('bush'); setEraseMode(false); }}
          className={`py-2 px-3 rounded text-xs ${selectedAssetType === 'bush' ? 'bg-emerald-600' : 'bg-slate-700'}`}
        >
          🌳 Bush
        </button>
      </div>
      
      <button
        onClick={() => { setEraseMode(!eraseMode); setSelectedAssetType(null); }}
        className={`w-full py-2 px-4 rounded text-xs ${eraseMode ? 'bg-red-600' : 'bg-slate-700'}`}
      >
        {eraseMode ? '✓ Eraser ON' : 'Eraser OFF'}
      </button>
      
      {eraseMode && (
        <div>
          <label className="text-xs text-slate-400 block mb-1">
            Brush Size: <span className="text-white">{eraseBrushSize}</span>
          </label>
          <input
            type="range"
            min="1"
            max="10"
            step="0.5"
            value={eraseBrushSize}
            onChange={(e) => setEraseBrushSize(Number(e.target.value))}
            className="w-full"
          />
        </div>
      )}
      
      <div className="text-xs text-slate-400 pt-2">
        Manual Assets: {manualAssets.length}
      </div>
    </>
  )}
</div>
```

### 1.4 Integrate into Canvas

```tsx
<Canvas>
  <Suspense fallback={null}>
    {/* ...existing terrain and assets... */}
    
    {/* Manual placed assets */}
    {manualMode && manualAssets.map((asset) => {
      if (asset.type === 'tree') {
        return <PineTree key={asset.id} position={asset.position} rotation={asset.rotation} scale={asset.scale} />;
      } else if (asset.type === 'rock') {
        return <Rock key={asset.id} position={asset.position} rotation={asset.rotation} scale={asset.scale} variant={asset.variant || 0} />;
      }
      // Add grass and bush rendering...
    })}
    
    {/* Ground click handler */}
    {manualMode && (
      <GroundClickHandler
        selectedAssetType={selectedAssetType}
        eraseMode={eraseMode}
        eraseBrushSize={eraseBrushSize}
        manualAssets={manualAssets}
        getTerrainHeight={getTerrainHeight}
        onPlaceAsset={(data) => {
          const id = `manual-${Date.now()}-${Math.random()}`;
          let asset: any = {
            id,
            type: selectedAssetType!,
            position: data.position,
            rotation: data.rotation,
            scale: data.scale
          };
          
          if (selectedAssetType === 'tree') {
            asset.treeType = ['pine', 'broad', 'bushy'][Math.floor(Math.random() * 3)];
          } else if (selectedAssetType === 'rock') {
            asset.variant = Math.floor(Math.random() * 18);
          }
          
          setManualAssets(prev => [...prev, asset]);
        }}
        onEraseAsset={(id) => {
          setManualAssets(prev => prev.filter(a => a.id !== id));
        }}
      />
    )}
  </Suspense>
</Canvas>
```

## Phase 2: Mesh Export with Collisions

### 2.1 Use IslandExporter.ts (already created)

The file `src/systems/IslandExporter.ts` has been created with:
- Geometry merging for all assets
- Separate visual and collision meshes
- GLB export functionality

### 2.2 Add Export Button

```tsx
<button
  onClick={handleExportMesh}
  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-4 rounded"
  disabled={isExporting}
>
  {isExporting ? '⏳ Exporting...' : '📦 Export as Mesh'}
</button>
```

### 2.3 Implement handleExportMesh

```typescript
const [isExporting, setIsExporting] = useState(false);

const handleExportMesh = async () => {
  setIsExporting(true);
  
  try {
    // Get terrain geometry from LowPolyTerrain component
    // This requires extracting the terrain mesh - see Phase 2.4
    
    // Prepare asset data
    const trees = [...generateTreePositions(), ...manualAssets.filter(a => a.type === 'tree')];
    const rocks = [...generateRockPositions(), ...manualAssets.filter(a => a.type === 'rock')];
    const grass = [...generateGrassPositions(), ...manualAssets.filter(a => a.type === 'grass')];
    const bushes = [...generateBushPositions(), ...manualAssets.filter(a => a.type === 'bush')];
    
    // Convert to PlacedAsset format
    const placedTrees = trees.map(t => ({
      id: t.id || `tree-${Math.random()}`,
      type: 'tree',
      modelPath: getTreeModelPath(t.treeType),
      position: t.pos,
      rotation: t.rotation,
      scale: t.scale
    }));
    
    // Similar for rocks, grass, bushes...
    
    const { visualBlob, collisionBlob, stats } = await exportIsland({
      terrain: terrainGeometry,
      trees: placedTrees,
      grass: placedGrass,
      rocks: placedRocks,
      bushes: placedBushes
    });
    
    // Download files
    downloadBlob(visualBlob, `island-visual-${Date.now()}.glb`);
    downloadBlob(collisionBlob, `island-collision-${Date.now()}.glb`);
    
    alert(`Export Complete!\nTotal Vertices: ${stats.totalVertices}\nTrees: ${stats.treesCount}\nRocks: ${stats.rocksCount}`);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Export failed. Check console for details.');
  } finally {
    setIsExporting(false);
  }
};
```

### 2.4 Extract Terrain Geometry

Modify `LowPolyTerrain` to expose geometry via ref:

```typescript
const terrainRef = useRef<THREE.Mesh>(null);

// In parent component:
const [terrainGeometry, setTerrainGeometry] = useState<THREE.BufferGeometry | null>(null);

<LowPolyTerrain
  ref={terrainRef}
  onGeometryReady={(geometry) => setTerrainGeometry(geometry)}
  {/* ...other props */}
/>
```

## Phase 3: Loading Exported Meshes

### 3.1 Create LoadableMesh Component

```typescript
function LoadableMesh({ url, collisionUrl }: { url: string; collisionUrl: string }) {
  const { scene } = useGLTF(url);
  const { scene: collisionScene } = useGLTF(collisionUrl);
  
  // Add physics to collision mesh
  useEffect(() => {
    if (collisionScene) {
      // Extract geometry and create Cannon.js or Rapier physics body
      // See quests4friends KennyDemoPage for physics integration
    }
  }, [collisionScene]);
  
  return <primitive object={scene.clone()} />;
}
```

## Key References from quests4friends

1. **Manual Placement**: `MinimalDemoPage.tsx` (lines 1603-1850)
2. **Collision Merging**: `systems/collision/CollisionMerger.ts`
3. **GLB Export**: `systems/editor/TileExporter.ts` (lines 118-206)
4. **Asset Loading with Physics**: `KennyDemoPage.tsx` (collision mesh loading)

## Testing Workflow

1. Generate procedural island with sliders
2. Switch to Manual Mode
3. Add/erase trees and rocks
4. Click "Export as Mesh"
5. Download `island-visual.glb` and `island-collision.glb`
6. Load in new scene with physics
7. Walk on terrain, collide with trees/rocks

## Performance Notes

- Mesh merging reduces draw calls from 10,000+ to 1
- Collision mesh is simplified (no grass/bushes)
- Export may take 10-30 seconds for large islands
- Recommended: <5000 trees, <1000 rocks for smooth export

## Next Steps

1. Implement Phase 1 for manual placement
2. Test placement/erase functionality
3. Implement Phase 2 for mesh export
4. Create separate demo page for loading exported meshes
5. Add physics integration (Rapier or Cannon.js)
