# Quests4Friends Template - Complete Reference

**React Three Fiber + R3F Next Integration Template**  
**Status:** ✅ Production-Ready  
**Last Updated:** January 2025

---

## 📋 Overview

This template demonstrates the integration of:
- **React Three Fiber** (R3F) for 3D rendering
- **react-three-next** architecture (canvas portaling with tunnel-rat)
- **Kenny Blocks** system for world building
- **Responsive design** across all pages
- **Multiple rendering approaches** (traditional R3F + tunnel-rat portaling)

---

## 🗂️ Project Structure

```
templates/quests4friends/
├── src/
│   ├── app/
│   │   ├── App.tsx                  # Main routing
│   │   └── ThemeContext.tsx         # Dark/light theme
│   │
│   ├── pages/
│   │   ├── HomePage.tsx             # 3-column landing page
│   │   ├── KennyBlocksPage.tsx      # Block world builder
│   │   ├── KennyDemoPage.tsx        # Saved world player
│   │   ├── TestAssetPage.tsx        # Asset testing/debugging
│   │   ├── R3FDemoPage.tsx          # R3F Next demo (main)
│   │   └── R3FBlobPage.tsx          # R3F Next demo (fullscreen blob)
│   │
│   ├── components/
│   │   ├── r3f/
│   │   │   ├── Three.tsx            # tunnel-rat input wrapper
│   │   │   ├── Scene.tsx            # Main canvas (r3f.Out portal)
│   │   │   ├── View.tsx             # View component with OrbitControls
│   │   │   ├── Examples.tsx         # Blob & Logo 3D components
│   │   │   └── R3FLayout.tsx        # Layout with fixed canvas
│   │   │
│   │   └── [other components]
│   │
│   ├── helpers/
│   │   └── global.ts                # tunnel-rat instance export
│   │
│   ├── index.html
│   └── main.ts
│
├── public/
│   └── [static assets]
│
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## 🎯 Key Features

### 1. Canvas Portaling Architecture (react-three-next)

**How It Works:**
- Single `<Canvas>` in root layout (fixed overlay)
- `<View>` components create portals to canvas
- Navigate between pages without canvas re-mount
- Preserves WebGL context across navigation

**Implementation:**

```typescript
// helpers/global.ts
import tunnel from 'tunnel-rat'
export const r3f = tunnel()

// components/r3f/Scene.tsx - Main Canvas
export function Scene() {
  return (
    <Canvas>
      <r3f.Out /> {/* Portals render here */}
      <Preload all />
    </Canvas>
  )
}

// components/r3f/View.tsx - Portal Entry Point
export function View({ children }) {
  return (
    <>
      <div className="view-container" />
      <r3f.In>{children}</r3f.In>
    </>
  )
}

// Usage in pages
<View className="h-screen">
  <MyScene />
</View>
```

---

### 2. Kenny Blocks System

**Purpose:** Visual world builder with blocks and assets

**Key Files:**
- `KennyBlocksPage.tsx` - Editor with grid-based placement
- `KennyDemoPage.tsx` - Player/viewer for saved worlds

**Architecture:**
- Blocks → Single collision mesh (`quest_collisions_blocks`)
- Assets → Individual GLBs (`asset_glb_<id>`)
- RenderOrder separation (assets: 10, blocks: 0)
- Backward compatible with legacy exports

**Storage:** localStorage (JSON + GLB binary)

---

### 3. Responsive Design System

**Breakpoints (Tailwind):**
- `sm:` - 640px (mobile landscape)
- `md:` - 768px (tablet)
- `lg:` - 1024px (desktop)

**Implementation:**
```tsx
// HomePage.tsx - 3-column responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <Column1 />
  <Column2 />
  <Column3 />
</div>

// Mobile-specific adjustments
const isMobile = window.innerWidth < 768
const cameraDistance = isMobile ? 10 : 15
```

---

### 4. Multiple 3D Rendering Approaches

**Traditional R3F (Kenny Blocks/Demo):**
```tsx
// Direct Canvas usage
<Canvas camera={{ position: [0, 5, 10] }}>
  <OrbitControls />
  <Scene />
</Canvas>
```

**tunnel-rat Portaling (R3F Demo/Blob):**
```tsx
// Layout with fixed canvas
<R3FLayout>
  <Content />
</R3FLayout>

// Pages with View components
<View className="h-96">
  <Logo />
</View>
```

---

## 🔧 Configuration

### Vite Configuration (vite.config.js)

```javascript
export default {
  server: {
    port: 5179,
    host: true
  },
  build: {
    target: 'esnext',
    minify: 'terser'
  }
}
```

### Dependencies

**Core:**
```json
{
  "react": "^18.3.1",
  "react-dom": "^18.3.1",
  "react-router-dom": "^6.x",
  "three": "^0.x",
  "@react-three/fiber": "^8.x",
  "@react-three/drei": "^9.x",
  "tunnel-rat": "^0.1.2"
}
```

**Build Tools:**
```json
{
  "vite": "^6.2.1",
  "typescript": "^5.x",
  "tailwindcss": "^4.x"
}
```

---

## 🎨 Styling System

### Tailwind CSS 4.x

**Theme Configuration:**
- Dark/light mode support
- Responsive utilities
- Custom color palette
- Animation classes

**Usage:**
```tsx
// Responsive layout
<div className="container mx-auto px-4 py-6 sm:py-8 md:py-12">
  
// Dark mode aware
<div className="bg-white dark:bg-gray-900 text-black dark:text-white">

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

---

## 🚀 Running the Template

### Development

```bash
cd templates/quests4friends
pnpm install
pnpm dev
# Open http://localhost:5179
```

### Production Build

```bash
pnpm build
pnpm preview
```

---

## 📄 Page Descriptions

### HomePage.tsx
**Purpose:** Landing page with 3-column layout

**Features:**
- Original Quests4Friends features column
- Kenny Block Builder column
- React Three Next integration column
- Responsive grid (1 → 2 → 3 columns)
- Theme toggle

**Layout:**
```tsx
<div className="h-screen overflow-y-auto">
  <ThemeToggle />
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <OriginalFeatures />
    <KennyBlockBuilder />
    <ReactThreeNext />
  </div>
</div>
```

---

### KennyBlocksPage.tsx
**Purpose:** Visual world builder

**Features:**
- Grid-based block/asset placement
- Multiple asset categories (props, trees, rocks, etc.)
- Asset rotation & positioning
- Export to localStorage
- Responsive UI panels

**Key Systems:**
- Block placement grid
- Asset picker palette
- Camera controls
- Export/save functionality

---

### KennyDemoPage.tsx
**Purpose:** Play/view saved worlds

**Features:**
- Load worlds from localStorage
- Third-person character controller
- Collision detection
- Asset rendering with correct layering
- Camera follow system

**Key Systems:**
- GLB loading (blocks + individual assets)
- Character animation (AnimationMixer)
- Input handling (WASD movement)
- Camera smoothing

---

### TestAssetPage.tsx
**Purpose:** Debug individual assets

**Features:**
- Isolated asset rendering
- Camera control sliders (zoom, rotation, pitch)
- OrbitControls
- Centered viewport

**Use Case:** Testing asset appearance before adding to world

---

### R3FDemoPage.tsx
**Purpose:** Showcase react-three-next architecture

**Features:**
- Interactive 3D logo with animation
- View component demonstration
- Feature cards grid
- Responsive layout

**Key Pattern:** DOM + 3D integration with View portals

---

### R3FBlobPage.tsx
**Purpose:** Fullscreen interactive demo

**Features:**
- Distorted blob with mouse interaction
- Click to return navigation
- Fullscreen View
- Hover effects (useCursor)

**Demo:** MeshDistortMaterial with useFrame animation

---

## 🏗️ Architecture Patterns

### 1. Import Path Structure

```typescript
// Relative imports (component to component)
import { Example } from '../components/Example'

// Absolute would need tsconfig paths (not configured)
// import { Example } from '@/components/Example'

// tunnel-rat import from helpers
import { r3f } from '../../helpers/global'
```

### 2. Component Organization

```
Presentational (src/pages/)
    ↓ uses
Container (src/components/)
    ↓ uses
Primitives (src/components/r3f/)
    ↓ uses
Helpers (src/helpers/)
```

### 3. State Management

**Local State:** useState for UI
**Theme:** Context API (ThemeContext)
**3D State:** React Three Fiber hooks (useFrame, useThree)
**Storage:** localStorage for saved worlds

---

## 🔍 Key Implementations

### tunnel-rat Setup

```typescript
// 1. Create tunnel
// helpers/global.ts
import tunnel from 'tunnel-rat'
export const r3f = tunnel()

// 2. Canvas with output
// components/r3f/Scene.tsx
<Canvas>
  <r3f.Out />
</Canvas>

// 3. Input wrapper
// components/r3f/Three.tsx
export const Three = ({ children }) => <r3f.In>{children}</r3f.In>

// 4. Use in pages
<Three>
  <mesh>...</mesh>
</Three>
```

---

### Responsive Camera Controls

```typescript
// Detect mobile
const [isMobile, setIsMobile] = useState(window.innerWidth < 768)

// Adjust camera
const cameraDistance = isMobile ? 10 : 15
camera.position.set(0, cameraDistance * 0.7, cameraDistance)

// Listen for resize
useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768)
  window.addEventListener('resize', handleResize)
  return () => window.removeEventListener('resize', handleResize)
}, [])
```

---

### Kenny Blocks Export/Load

**Export (KennyBlocksPage.tsx):**
```typescript
// Blocks → single mesh
const blockMesh = mergeBufferGeometries(blockGeometries)
localStorage.setItem('quest_collisions_blocks', blockMeshJSON)

// Assets → individual GLBs
placedAssets.forEach(asset => {
  const glb = exportGLB(asset)
  localStorage.setItem(`asset_glb_${asset.id}`, glb)
})
```

**Load (KennyDemoPage.tsx):**
```typescript
// Load blocks
const blocksData = localStorage.getItem('quest_collisions_blocks')
const blockMesh = parseJSON(blocksData)

// Load each asset
placedAssets.forEach(assetData => {
  const glbData = localStorage.getItem(`asset_glb_${assetData.id}`)
  const assetMesh = parseGLB(glbData)
  assetMesh.traverse(child => {
    if (child.isMesh) child.renderOrder = 10 // Above blocks
  })
})
```

---

## 🐛 Common Issues & Solutions

### 1. tunnel-rat Import Error
**Problem:** `Cannot find module '../../helpers/global'`  
**Solution:** Verify relative path depth from component location

### 2. Assets Rendering Inside Blocks
**Problem:** Visual z-fighting  
**Solution:** Set `renderOrder = 10` on assets, `0` on blocks

### 3. Canvas Not Responding to Events
**Problem:** Click events don't fire  
**Solution:** Remove `pointer-events-none` from Canvas, or set on specific elements

### 4. Blob Navigation Goes to Wrong Page
**Problem:** Route prop incorrect  
**Solution:** Ensure `<Blob route="/r3f-demo" />` not `"/"`

### 5. Mobile Layout Overflow
**Problem:** Content doesn't fit screen  
**Solution:** Use `h-screen overflow-y-auto` on container, not nested scroll containers

---

## ✅ Testing Checklist

### Visual Tests
- [ ] HomePage displays 3 columns on desktop
- [ ] HomePage displays 2 columns on tablet
- [ ] HomePage displays 1 column on mobile
- [ ] Kenny Blocks editor is responsive
- [ ] R3F demos render correctly
- [ ] Blob page is fullscreen
- [ ] Theme toggle works

### Functional Tests
- [ ] Block placement works
- [ ] Asset placement works
- [ ] Export saves to localStorage
- [ ] Load retrieves from localStorage
- [ ] Assets render above blocks
- [ ] Navigation between pages works
- [ ] Blob click navigates correctly
- [ ] Camera controls respond

### Performance Tests
- [ ] FPS stable (60 on desktop, 30+ mobile)
- [ ] No memory leaks on navigation
- [ ] Assets load without lag
- [ ] Responsive to window resize

---

## 📊 Performance Metrics

**Target:**
- Desktop: 60 FPS
- Mobile: 30+ FPS
- Load time: <3s
- Bundle size: <2MB (excluding assets)

**Optimizations:**
- Lazy loading for routes
- Asset compression recommended
- Use instancing for repeated geometry
- Implement LOD for distant objects

---

## 🔗 Dependencies Reference

### tunnel-rat (0.1.2)
**Purpose:** Canvas portaling for react-three-next architecture  
**Docs:** https://github.com/pmndrs/tunnel-rat

### @react-three/fiber (8.17+)
**Purpose:** React renderer for Three.js  
**Docs:** https://docs.pmnd.rs/react-three-fiber

### @react-three/drei (9.120+)
**Purpose:** Helper components for R3F  
**Docs:** https://github.com/pmndrs/drei

### Three.js (0.173+)
**Purpose:** 3D graphics library  
**Docs:** https://threejs.org/docs/

---

## 🎯 Use This Template For

✅ **Good Fit:**
- Multi-page 3D web apps
- Interactive 3D portfolios
- Product configurators
- 3D content showcase sites
- Educational 3D experiences

❌ **Not Ideal For:**
- Complex games (use full viber3d ECS template)
- Simple single-page 3D demos (overkill)
- Non-3D applications

---

## 🚀 Extending the Template

### Add New Page with 3D Content

```bash
# 1. Create page component
touch src/pages/MyNewPage.tsx

# 2. Add route in App.tsx
<Route path="/my-new-page" element={<MyNewPage />} />

# 3. Use View component for 3D
import { View } from '../components/r3f/View'

export function MyNewPage() {
  return (
    <View className="h-screen">
      <MyScene />
    </View>
  )
}
```

### Add New 3D Component

```bash
# 1. Create in r3f directory
touch src/components/r3f/MyComponent.tsx

# 2. Use in View
import { MyComponent } from '../components/r3f/MyComponent'

<View>
  <MyComponent />
</View>
```

---

## 📚 Related Documentation

- **[THREEJS_GAME_DEVELOPMENT_GUIDE.md](../../THREEJS_GAME_DEVELOPMENT_GUIDE.md)** - For game development
- **[MASTER_THREEJS_BEST_PRACTICES.md](../../MASTER_THREEJS_BEST_PRACTICES.md)** - For ecosystem patterns
- **[DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md)** - Complete navigation

---

## 🤝 Contributing

### Adding Features
1. Follow existing patterns
2. Maintain responsive design
3. Test on mobile and desktop
4. Update this documentation

### Reporting Issues
- Include page/component name
- Describe expected vs actual behavior
- Include browser/device info

---

## ✨ Credits

**Architecture Patterns:**
- react-three-next (tunnel-rat portaling)
- viber3d (responsive design patterns)
- Kenny Assets (3D models)

**Built With:**
- React 18
- React Three Fiber 8
- Three.js 0.173
- Vite 6
- Tailwind 4
- tunnel-rat 0.1

---

**Last Updated:** January 2025  
**Status:** ✅ Production-Ready Template  
**Version:** 1.0

**Questions?** See [DOCUMENTATION_INDEX.md](../../DOCUMENTATION_INDEX.md) for complete documentation navigation.
