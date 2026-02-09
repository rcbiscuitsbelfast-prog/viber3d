# KayKit Character Customizer - Implementation Plan

## 📋 Overview

A browser-based system for customizing KayKit character models with real-time texture recoloring. Users select a character, modify colors via an interactive color wheel, name the variant, and save as a reusable preset.

**Status:** Implementation Plan  
**Target Template:** Questly  
**Complexity:** High  
**Estimated Hours:** 12-15

---

## 🎯 Goals

1. **Load & Clone Models** - Instantiate fresh KayKit character instances
2. **Texture Analysis** - Extract unique flat colors from character textures
3. **Interactive Recoloring** - Real-time color replacement via color wheel UI
4. **Save Variants** - Export textures and metadata for persistent storage
5. **Load Presets** - Reload saved character variants on demand

---

## 🏗️ Architecture Overview

```
kaykit-customizer/
├── core/
│   ├── TextureExtractor.ts        # Canvas-based texture analysis
│   ├── ColorReplacement.ts        # Pixel-level color swapping
│   ├── ModelCloner.ts             # GLB cloning & rigging preservation
│   └── types.ts                   # Shared type definitions
├── ui/
│   ├── ColorPickerWheel.tsx       # Interactive color wheel component
│   ├── ColorPaletteBoard.tsx      # Clickable color blocks UI
│   └── CharacterCustomizer.tsx    # Main orchestrator component
├── storage/
│   ├── CharacterPresets.ts        # Save/load logic
│   ├── schema.json                # JSON schema definition
│   └── indexeddb-store.ts         # Browser storage layer
└── hooks/
    ├── useCustomizableCharacter.ts
    └── useTextureRecoloring.ts
```

---

## 📊 Data Flow

```
User Click "Customize Rogue"
    ↓
[Model Cloner] → Load Rogue.glb & clone the scene
    ↓
[Texture Extractor] → Scan texture → Extract unique colors
    ↓
[UI Renderer] → Draw color palette board
    ↓
User Clicks Color Block
    ↓
[Color Picker Wheel] → Opens interactive color wheel
    ↓
User Drags on Wheel
    ↓
[Color Replacement] → Update canvas → Push to WebGL texture
    ↓
[Live Preview] → Model updates in real-time
    ↓
User Names Character & Clicks Save
    ↓
[Character Presets] → Export PNG + JSON metadata to Browser Storage
```

---

## 🔧 Core Modules

### 1. **TextureExtractor.ts**
Extract unique colors from a model's texture atlas.

**Input:**
- `texture: THREE.Texture` - Model's base color map
- `samplingMethod: 'smart' | 'grid' | 'all'` - How to scan the texture

**Output:**
```typescript
{
  colors: Array<{
    hex: string;
    rgb: [number, number, number];
    pixelCount: number;
    indexInPalette: number;
  }>;
  canvasData: ImageData;
  textureWidth: number;
  textureHeight: number;
}
```

**Algorithm:**
1. Create off-screen canvas at texture dimensions
2. Render texture to canvas via WebGL
3. Read pixel data from canvas
4. Use 3D color clustering to find unique colors
5. Filter noise (colors appearing < 10 pixels) if desired
6. Return sorted by frequency

---

### 2. **ColorReplacement.ts**
Replace one color with another on canvas, then update WebGL texture.

**Input:**
```typescript
{
  canvas: HTMLCanvasElement;
  originalColor: [number, number, number];
  newColor: [number, number, number];
  tolerance: number; // e.g., 15 for fuzzy matching
}
```

**Output:**
```typescript
{
  updatedCanvas: HTMLCanvasElement;
  pixelsModified: number;
}
```

**Algorithm:**
1. Get canvas context & pixel data
2. Iterate all pixels, compare RGB values
3. If within tolerance range, replace with new color
4. Update pixel data back to canvas
5. Return canvas reference

**WebGL Texture Update:**
```typescript
const texture = new THREE.CanvasTexture(updatedCanvas);
texture.magFilter = THREE.NearestFilter;
material.map = texture;
material.needsUpdate = true;
```

---

### 3. **ModelCloner.ts**
Create a fresh, isolated instance of a KayKit character model.

**Input:**
```typescript
{
  gltf: GLTF;
  preserveRigging: boolean; // Keep bone structure intact
}
```

**Output:**
```typescript
{
  scene: THREE.Group;
  materials: THREE.Material[];
  originalTextures: Map<string, THREE.Texture>;
  skeleton: THREE.Skeleton | null;
}
```

**Key Points:**
- Clone entire GLTF scene to avoid mutation
- Clone materials to allow independent texture swaps
- Clone textures to prevent shared references
- Preserve bone structures for animation compatibility
- Return map of original textures for reference

---

### 4. **CharacterPresets.ts**
Save & load customized character variants.

**Storage Mechanism:**
- **IndexedDB** for texture PNGs (blobs)
- **LocalStorage** or **IndexedDB** for metadata JSON

**Save Flow:**
```typescript
async saveCharacterVariant(
  canvasTexture: HTMLCanvasElement,
  metadata: {
    name: string;
    baseModel: 'rogue' | 'knight' | ...;
    colorSwaps: Array<{
      original: [r, g, b];
      replacement: [r, g, b];
    }>;
    createdAt: string;
    tags: string[];
  }
): Promise<string> // Returns variant ID
```

**Disk Format:**
```json
{
  "id": "variant-uuid-12345",
  "name": "Crimson Shadow",
  "baseModel": "rogue",
  "baseModelPath": "/Assets/KayKit_Adventurers_2.0_FREE/.../Rogue.glb",
  "textureUrl": "blob:http://localhost:3000/...",
  "textureDataUrl": "data:image/png;base64,...",
  "colorSwaps": [
    {
      "original": [255, 200, 100],
      "replacement": [200, 50, 50]
    }
  ],
  "version": "1.0",
  "createdAt": "2026-02-06T12:34:56Z",
  "tags": ["custom", "red-theme"]
}
```

---

### 5. **useCustomizableCharacter.ts** Hook
React hook managing the full customization workflow.

```typescript
const {
  model,                    // THREE.Group - the loaded character
  materials,               // Material array
  colorPalette,            // Extracted colors from texture
  selectedColorIndex,      // Current color being customized
  selectColor,             // (index) => void
  replaceColor,            // (originalRGB, newRGB) => void
  loadVariant,             // (variantId) => Promise<void>
  saveVariant,             // (name, tags) => Promise<string>
  isLoading,
  error,
} = useCustomizableCharacter({
  characterPath: '/Assets/KayKit.../Rogue.glb',
  onColorSwap: (original, replacement) => {},
});
```

---

## 🎨 UI Components

### ColorPickerWheel.tsx
**Purpose:** Interactive HSL/Hue color selector

**Props:**
```typescript
{
  onColorChange: (rgb: [r, g, b]) => void;
  initialColor?: [r, g, b];
  size?: number; // 300px default
  showHexInput?: boolean;
}
```

**Rendering:**
- Canvas-based color wheel (HSL model)
- Clickable radius for saturation
- Rotatable hue ring
- Center circle for lightness
- Optional hex input field overlay

---

### ColorPaletteBoard.tsx
**Purpose:** Display extracted unique colors as clickable blocks

**Props:**
```typescript
{
  colors: Array<{
    hex: string;
    rgb: [r, g, b];
    pixelCount: number;
  }>;
  onColorClick: (colorIndex: number) => void;
  selectedColorIndex?: number;
  maxColorsDisplayed?: number; // 12 default
}
```

**Features:**
- Grid layout (4 columns)
- Hover effects showing pixel count
- Selection highlight/border
- Scroll if > max colors

---

### CharacterCustomizer.tsx
**Purpose:** Main orchestrator component combining all features

**Props:**
```typescript
{
  characterPath: string;
  characterName: string;
  onSave?: (variantId: string, name: string) => void;
  onCancel?: () => void;
  canvasWidth?: number; // 800 default
  canvasHeight?: number; // 600 default
}
```

**Layout:**
```
┌─────────────────────────────────────┐
│ ← Back | Character Customizer       │
├──────────────────┬──────────────────┤
│                  │  Extracted       │
│  3D Model        │  Colors          │
│  Preview         │  [Color Board]   │
│ (R3F Canvas)     │                  │
│                  │  [Color Wheel]   │
│                  │  (opens on click)│
├──────────────────┴──────────────────┤
│ Variant Name: [____________]        │
│                                     │
│ [Cancel]  [Save Variant]            │
└─────────────────────────────────────┘
```

---

## 💾 JSON Schema for Saved Characters

```typescript
interface SavedCharacterVariant {
  id: string;                          // UUID
  name: string;                        // "Crimson Shadow"
  baseModel: CharacterType;            // "rogue" | "knight" | ...
  baseModelPath: string;               // URL to original GLB
  textureDataUrl: string;              // Base64 PNG for quick load
  colorSwaps: ColorSwap[];
  metadata: {
    version: string;                  // "1.0"
    createdAt: ISO8601;
    modifiedAt: ISO8601;
    author?: string;
    description?: string;
    tags: string[];
  };
}

interface ColorSwap {
  original: RGB;                       // [255, 200, 100]
  replacement: RGB;                   // [200, 50, 50]
  label?: string;                     // "Cloak", "Boots"
}
```

---

## 🔌 Integration Steps

### Step 1: Add to Dashboard
```tsx
// pages/Dashboard.tsx
import CharacterCustomizer from '../components/CharacterCustomizer';

export default function Dashboard() {
  return (
    <div>
      <h1>Character Customizer</h1>
      <button onClick={() => setCustomizingCharacter('rogue')}>
        Customize Rogue
      </button>
      
      {customizingCharacter && (
        <CharacterCustomizer
          characterPath={CHARACTER_OPTIONS[customizingCharacter].modelPath}
          characterName={CHARACTER_OPTIONS[customizingCharacter].name}
          onSave={(variantId, name) => {
            console.log(`Saved: ${name} (${variantId})`);
            closeCustomizer();
          }}
          onCancel={() => closeCustomizer()}
        />
      )}
    </div>
  );
}
```

### Step 2: Add R3F Canvas to Customizer
```tsx
// Inside CharacterCustomizer.tsx
<Canvas camera={{ position: [0, 1, 2.5], fov: 50 }}>
  <ambientLight intensity={0.6} />
  <directionalLight position={[5, 5, 5]} />
  <AnimatedCharacter ref={modelRef} characterPath={characterPath} />
  <OrbitControls />
</Canvas>
```

### Step 3: Hook Up Texture Updates
```tsx
// Inside useCustomizableCharacter hook
const replaceColor = async (originalRGB, newRGB) => {
  const result = ColorReplacement.replace(
    currentCanvas,
    originalRGB,
    newRGB,
    tolerance
  );
  
  const newTexture = new THREE.CanvasTexture(result.updatedCanvas);
  materials.forEach(m => {
    if (m.map) m.map = newTexture;
    m.needsUpdate = true;
  });
  
  currentCanvas = result.updatedCanvas;
};
```

---

## 📦 Browser Storage Strategy

### IndexedDB Schema
```javascript
const db = await openDB('viber3d-customizer');

// Store 1: Character Variants
{
  name: 'character_variants',
  keyPath: 'id',
  indexes: [
    { name: 'baseModel', keyPath: 'baseModel' },
    { name: 'createdAt', keyPath: 'metadata.createdAt' },
    { name: 'tags', keyPath: 'metadata.tags', multiEntry: true }
  ]
}

// Store 2: Texture Blobs
{
  name: 'texture_files',
  keyPath: 'id',
  indexes: [
    { name: 'variantId', keyPath: 'variantId' }
  ]
}
```

---

## ⚡ Performance Considerations

### Texture Extraction
- **Time:** ~50-200ms for 2048×2048 texture
- **Memory:** ~40MB peak (4 copies of texture in memory during processing)
- **Optimization:** Use web workers for extraction if > 500KB texture

### Color Replacement
- **Time:** ~10-50ms per replacement
- **Memory:** Updates in-place on canvas
- **Optimization:** Batch multiple replacements, use typed arrays for pixel data

### Model Cloning
- **Time:** ~20-100ms depending on geometry complexity
- **Memory:** ~2-10MB per cloned model (skeleton + geometries)
- **Optimization:** Pool models if creating many variants

### Storing Variants
- **Size:** ~2-5MB per variant (texture PNG + JSON metadata)
- **Limit:** IndexedDB typically ~50MB per domain, can increase via quota API
- **Fallback:** LocalStorage for JSON metadata (~5MB), blobs via IndexedDB

---

## 🧪 Testing Checklist

- [ ] Load Rogue model successfully
- [ ] Extract 8-12 unique colors from texture
- [ ] Color board renders without blocking UI
- [ ] Color wheel responds smoothly to dragging
- [ ] Color replacement updates model in real-time
- [ ] Save variant creates IndexedDB entries
- [ ] Load variant restores texture and colors
- [ ] Name input validates (3-50 chars required)
- [ ] Cancel button reverts all changes
- [ ] Multiple variants can be saved without collision
- [ ] Mobile touch support for color wheel
- [ ] Memory cleanup on component unmount

---

## 🚀 Future Enhancements

1. **Multi-Color Selection** - Select multiple color blocks simultaneously
2. **Pattern Editor** - Draw custom patterns/details on texture
3. **Animation Preview** - Play character animations while customizing
4. **Export Options** - Download variant as GLB or JSON
5. **Cloud Sync** - Save variants to Firebase for multi-device access
6. **Comparison View** - Side-by-side original vs customized
7. **Randomize** - Generate random color themes
8. **Color Harmony** - Apply automatic color schemes (complementary, triadic, etc.)
9. **Templates** - Pre-built color theme sets
10. **Sharing** - Share variant URLs with others

---

## 📚 Dependencies

- **three.js** (already in project)
- **zustand** (optional, for state management)
- **Native Canvas API** (no external libs needed for texture manipulation)
- **IndexedDB API** (native browser storage)

---

## 📝 File Structure Overview

```
templates/questly/src/
├── components/
│   ├── CharacterCustomizer.tsx          ← Main UI orchestrator
│   ├── ColorPickerWheel.tsx             ← Color wheel component
│   ├── ColorPaletteBoard.tsx            ← Color palette display
│   └── CustomizerPreview.tsx            ← R3F model preview container
├── modules/
│   └── character-customizer/
│       ├── core/
│       │   ├── TextureExtractor.ts
│       │   ├── ColorReplacement.ts
│       │   ├── ModelCloner.ts
│       │   └── types.ts
│       ├── storage/
│       │   ├── CharacterPresets.ts
│       │   ├── indexeddb-store.ts
│       │   └── schema.ts
│       └── utils/
│           ├── colorUtils.ts
│           └── geometryUtils.ts
└── hooks/
    ├── useCustomizableCharacter.ts
    └── useTextureRecoloring.ts
```

---

## 🎓 Key Learnings

1. **Texture Coordinates** - Understand UV mapping for accurate pixel replacement
2. **Material Cloning** - Always clone materials when modifying shared resources
3. **Canvas Context** - Use `getImageData()` and `putImageData()` for pixel access
4. **Texture Filtering** - Set `magFilter: THREE.NearestFilter` to avoid interpolation blur
5. **Memory Management** - Dispose THREE.js resources on unmount
6. **Color Space** - RGB vs HSL conversions for intuitive color picking

---

**Next Steps:**
1. Review this plan with team
2. Start with TextureExtractor.ts
3. Build ColorReplacement.ts
4. Create React hooks
5. Build UI components
6. Add storage layer
7. Integrate into Dashboard
8. QA & performance testing
