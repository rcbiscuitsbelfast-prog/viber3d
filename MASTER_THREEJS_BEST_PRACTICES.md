# Master Three.js Best Practices & Patterns Guide

**Version:** 1.0  
**Last Updated:** January 2025  
**Repositories Covered:** threejs-skills, react-three-next, viber3d

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Quick Start Guides](#quick-start-guides)
3. [Repository Profiles](#repository-profiles)
4. [Best Practices by Category](#best-practices-by-category)
5. [Common Patterns Library](#common-patterns-library)
6. [Working Examples Index](#working-examples-index)
7. [Dependencies & Version Matrix](#dependencies--version-matrix)
8. [Gotchas & Solutions](#gotchas--solutions)
9. [Migration Path](#migration-path)
10. [AI Code Generation Rules](#ai-code-generation-rules)

---

## Executive Summary

This document consolidates best practices from three complementary Three.js repositories:

### 🎓 **threejs-skills** (Skills Reference)
- **Purpose:** Markdown-based skill library covering 10 core Three.js topics
- **Best For:** Learning fundamentals, API reference, quick examples
- **Coverage:** Fundamentals, geometry, materials, lighting, textures, animation, loaders, shaders, postprocessing, interaction
- **Format:** Structured skill files with Quick Start, Core Concepts, Common Patterns, Performance Tips

### 🚀 **react-three-next** (Full-Stack Framework)
- **Purpose:** Next.js 14 + React Three Fiber starter with SSR support
- **Best For:** Production web apps, SEO-friendly 3D sites, server-side rendering
- **Key Features:** 
  - Canvas portaling via tunnel-rat
  - Seamless page navigation without canvas reload
  - DOM/3D synchronization
  - Vite integration with Next.js 14

### 🎮 **viber3d** (Game Starter)
- **Purpose:** Modern game development framework with ECS architecture
- **Best For:** Games, interactive experiences, physics-based apps
- **Key Features:**
  - React 19 + React Three Fiber
  - ECS architecture via Koota
  - Physics via React Three Rapier
  - State management via Zustand
  - Complete game architecture reference

### Use Case Decision Tree

```
Need to learn Three.js basics? 
  → threejs-skills

Building a website with 3D content?
  → react-three-next

Creating a game or interactive experience?
  → viber3d
```

---

## Quick Start Guides

### 🎓 threejs-skills (Assumed Structure)

```bash
# Clone and explore
git clone https://github.com/nickrttn/threejs-skills.git
cd threejs-skills

# Structure (assumed):
# ├── fundamentals.md
# ├── geometry.md
# ├── materials.md
# ├── lighting.md
# ├── textures.md
# ├── animation.md
# ├── loaders.md
# ├── shaders.md
# ├── postprocessing.md
# └── interaction.md

# Each file contains:
# - Quick Start examples
# - Core Concepts
# - Common Patterns
# - Performance Tips
# - See Also references
```

**Expected Topics:**
- **Fundamentals:** Scene, Camera, Renderer, Basic Setup
- **Geometry:** BufferGeometry, Custom geometry, Primitives
- **Materials:** MeshStandardMaterial, MeshPhysicalMaterial, Shader materials
- **Lighting:** Ambient, Directional, Point, Spot lights
- **Textures:** Loading, UV mapping, Compression
- **Animation:** AnimationMixer, Keyframes, Morph targets
- **Loaders:** GLTFLoader, TextureLoader, Asset management
- **Shaders:** GLSL basics, Custom shaders, Uniforms
- **Postprocessing:** EffectComposer, Passes, Custom effects
- **Interaction:** Raycasting, Mouse/touch events, Controls

### 🚀 react-three-next

```bash
# Clone and install (assumed)
git clone https://github.com/[owner]/react-three-next.git
cd react-three-next
npm install

# Run development server
npm run dev
# Open http://localhost:3000

# Build for production
npm run build
npm run start
```

**Key Features to Explore:**
- Canvas portaling with tunnel-rat (`<View>` component)
- Page navigation without canvas re-mount
- DOM components vs Canvas components
- Server-side rendering compatibility
- Next.js 14 + Vite integration

### 🎮 viber3d

```bash
# Create new project
npx viber3d@latest init my-game
cd my-game

# Install dependencies (if not auto-installed)
npm install

# Run development server
npm run dev
# Open http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

**Time to First Render:** < 5 minutes

**Initial Structure:**
```
my-game/
├── src/
│   ├── actions.ts          # ECS actions (spawn, modify)
│   ├── frameloop.ts        # Game loop
│   ├── world.ts            # ECS world setup
│   ├── app.tsx             # Main App component
│   ├── main.tsx            # Entry point
│   ├── startup.tsx         # Initialization logic
│   ├── components/         # React components
│   ├── systems/            # ECS systems
│   ├── traits/             # ECS traits (components)
│   └── utils/              # Utility functions
├── public/                 # Static assets
├── .cursor/rules/          # AI coding rules
└── package.json
```

---

## Repository Profiles

### 🎓 threejs-skills - Detailed Profile

**Purpose:** Comprehensive Three.js skill library for learning and reference

**Structure (Expected):**
- 10 markdown files, one per major Three.js topic
- Each file follows consistent structure:
  - **Quick Start:** Minimal working example
  - **Core Concepts:** Key APIs and patterns
  - **Common Patterns:** Copy-paste solutions
  - **Performance Tips:** Optimization strategies
  - **See Also:** Cross-references

**Target Audience:**
- Beginners learning Three.js
- Developers seeking API reference
- Teams standardizing Three.js usage

**Best Practices Extracted:**
- API accuracy with Three.js r160+
- Structured learning path
- Performance-first mindset
- Pattern-based teaching

**Integration Points:**
- Reference when building with react-three-next or viber3d
- Validate API usage against skill files
- Use patterns in production code

### 🚀 react-three-next - Detailed Profile

**Purpose:** Production-ready Next.js framework for 3D web applications

**Tech Stack:**
- Next.js 14.0.4
- React Three Fiber (latest)
- Drei utilities
- Vite for fast HMR
- Tailwind CSS
- tunnel-rat for canvas portaling

**Key Innovations:**

#### 1. Canvas Portaling Pattern
```jsx
// DOM component in Next.js page
import { View } from '@/components/canvas/View'

export default function Page() {
  return (
    <div>
      <h1>My 3D Page</h1>
      <View className="h-96">
        <MyScene />
      </View>
    </div>
  )
}
```

**How it works:**
- Single `<Canvas>` in root layout
- `<View>` components create portals to canvas
- Navigate between pages without re-mounting canvas
- Maintains WebGL context across navigation

#### 2. Component Separation
```
src/
├── components/
│   ├── canvas/         # 3D components (run inside <Canvas>)
│   │   ├── View.tsx
│   │   ├── MyScene.tsx
│   │   └── Model.tsx
│   └── dom/            # HTML components (regular React)
│       ├── Layout.tsx
│       └── Nav.tsx
```

#### 3. SSR Compatibility
- Dynamic imports for 3D components
- No-SSR wrapper for client-only rendering
- Hydration-safe patterns

**Best Practices Extracted:**
- Persistent canvas pattern
- DOM/Canvas separation
- SSR-compatible 3D rendering
- Performance through context preservation

**Use Cases:**
- Marketing sites with 3D elements
- Product configurators
- Portfolio sites
- Any multi-page app with 3D content

### 🎮 viber3d - Detailed Profile

**Purpose:** Complete game development framework with modern architecture

**Tech Stack:**
- **React:** 18.3.1 (19 compatible)
- **Three.js:** 0.173.0
- **React Three Fiber:** 8.17.12
- **Drei:** 9.120.8
- **Koota (ECS):** 0.1.12
- **Rapier (Physics):** 1.5.0
- **Zustand (State):** 5.0.2
- **TypeScript:** 5.7.3
- **Vite:** 6.2.0
- **Tailwind:** 4.0.9

**Architecture Overview:**

#### ECS Pattern (Koota)
```
Entity = Unique ID
Trait = Pure data (component)
System = Logic that processes traits
Actions = Centralized entity manipulation
```

**Example Flow:**
```typescript
// 1. Define trait (data)
const Position = trait({ x: 0, y: 0, z: 0 })

// 2. Create world
const world = createWorld()

// 3. Spawn entity via action
const player = world.spawn(Position({ x: 10 }))

// 4. System processes entities
function moveSystem(world: World) {
  world.query(Position).updateEach(([pos]) => {
    pos.x += 1
  })
}

// 5. Render component reads ECS data
function PlayerView({ entity }) {
  const pos = entity.get(Position)
  return <mesh position={[pos.x, pos.y, pos.z]} />
}
```

#### Directory Structure
```
src/
├── actions.ts              # Spawn/modify entities
├── frameloop.ts            # Game loop (useFrame)
├── world.ts                # ECS world creation
├── traits/                 # Data definitions
│   ├── time.ts
│   ├── transform.ts
│   ├── is-player.ts
│   └── ref.ts
├── systems/                # Game logic
│   ├── update-time.ts
│   ├── sync-view.ts
│   └── move-entities.ts
├── components/             # React rendering
│   ├── camera-renderer.tsx
│   └── player-renderer.tsx
└── utils/                  # Helper functions
    ├── spatial-hash.ts
    └── sort-entities-by-distance.ts
```

**Best Practices Extracted:**
- ECS architecture for games
- Separation of data/logic/rendering
- Performance through data-oriented design
- Physics integration patterns
- State management with Zustand
- TypeScript throughout
- AI-assisted development with Cursor rules

**Advanced Features:**
- Spatial hashing for collision detection
- Physics simulation with Rapier
- Animation system with GLTFLoader
- Postprocessing effects
- Debug UI with Leva
- Performance monitoring

---

## Best Practices by Category

### 1. Scene & Renderer Setup

#### Vanilla Three.js Pattern (threejs-skills)

```javascript
import * as THREE from 'three'

// Scene setup
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
)
const renderer = new THREE.WebGLRenderer({ antialias: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// Animation loop
function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
```

#### React Three Fiber Pattern (react-three-next, viber3d)

```jsx
import { Canvas } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'

export function App() {
  return (
    <Canvas
      shadows // Enable shadows
      gl={{ antialias: true, alpha: false }} // WebGL settings
      camera={{ position: [0, 5, 10], fov: 75 }} // Default camera
    >
      {/* Scene content */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow />
      
      <MyScene />
      
      <OrbitControls />
    </Canvas>
  )
}
```

**Best Practices:**
- ✅ Set `pixelRatio` max to 2 (diminishing returns beyond)
- ✅ Disable `alpha` if no transparency needed (performance)
- ✅ Use `shadows` prop only if needed
- ✅ Set camera `near`/`far` planes appropriately (reduce z-fighting)
- ✅ Handle responsive resize properly

### 2. Asset Loading & Animation Systems

#### Basic GLTF Loading (threejs-skills)

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

const loader = new GLTFLoader()

loader.load(
  '/models/character.glb',
  (gltf) => {
    scene.add(gltf.scene)
    
    // Animation
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(gltf.scene)
      const action = mixer.clipAction(gltf.animations[0])
      action.play()
      
      // In animation loop:
      // mixer.update(deltaTime)
    }
  },
  (progress) => {
    console.log((progress.loaded / progress.total * 100) + '% loaded')
  },
  (error) => {
    console.error('Error loading model:', error)
  }
)
```

#### React Three Fiber Loading with useGLTF (viber3d)

```jsx
import { useGLTF } from '@react-three/drei'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

function Character() {
  const { scene, animations } = useGLTF('/models/character.glb')
  const mixerRef = useRef<THREE.AnimationMixer>()
  
  useEffect(() => {
    if (animations.length > 0) {
      mixerRef.current = new THREE.AnimationMixer(scene)
      const action = mixerRef.current.clipAction(animations[0])
      action.play()
    }
    
    return () => {
      mixerRef.current?.stopAllAction()
    }
  }, [scene, animations])
  
  useFrame((state, delta) => {
    mixerRef.current?.update(delta)
  })
  
  return <primitive object={scene} />
}

// Preload for better UX
useGLTF.preload('/models/character.glb')
```

#### Advanced: Separate Animation Files (viber3d pattern)

Many workflows export animations separately. Here's how to handle that:

```typescript
// AnimationSetLoader.ts
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import * as THREE from 'three'

export async function loadAnimationSet(paths: string[]): Promise<THREE.AnimationClip[]> {
  const loader = new GLTFLoader()
  const clips: THREE.AnimationClip[] = []
  
  for (const path of paths) {
    const gltf = await loader.loadAsync(path)
    if (gltf.animations.length > 0) {
      clips.push(...gltf.animations)
    }
  }
  
  return clips
}

// AnimationManager.ts
export class AnimationManager {
  private mixer: THREE.AnimationMixer
  private actions: Map<string, THREE.AnimationAction> = new Map()
  private current: string | null = null
  
  constructor(target: THREE.Object3D, clips: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(target)
    
    clips.forEach(clip => {
      const action = this.mixer.clipAction(clip)
      this.actions.set(clip.name, action)
    })
  }
  
  play(name: string, fadeTime: number = 0.2) {
    const action = this.actions.get(name)
    if (!action) return
    
    if (this.current && this.current !== name) {
      const prev = this.actions.get(this.current)
      prev?.fadeOut(fadeTime)
    }
    
    action.reset().fadeIn(fadeTime).play()
    this.current = name
  }
  
  update(delta: number) {
    this.mixer.update(delta)
  }
}

// Usage
const animations = await loadAnimationSet([
  '/animations/idle.glb',
  '/animations/walk.glb',
  '/animations/run.glb',
])

const manager = new AnimationManager(characterModel, animations)
manager.play('idle')

// In game loop
manager.update(deltaTime)
```

**Best Practices:**
- ✅ Use `useGLTF` in R3F for automatic disposal
- ✅ Preload critical assets
- ✅ Handle loading states with Suspense
- ✅ Dispose mixers on unmount
- ✅ Use `fadeIn`/`fadeOut` for smooth transitions
- ✅ Cache animations globally if reused
- ✅ Consider Draco compression for large models
- ⚠️ Watch for animation name conflicts across files
- ⚠️ Ensure animation targets match model hierarchy

### 3. Component Architecture

#### Pattern 1: Canvas vs DOM Separation (react-three-next)

```typescript
// components/dom/Layout.tsx (regular React)
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <nav>...</nav>
      <main>{children}</main>
    </div>
  )
}

// components/canvas/Scene.tsx (runs inside <Canvas>)
export function Scene() {
  return (
    <>
      <ambientLight intensity={0.5} />
      <mesh>
        <boxGeometry />
        <meshStandardMaterial color="hotpink" />
      </mesh>
    </>
  )
}

// app/page.tsx (Next.js page)
import { View } from '@/components/canvas/View'
import { Scene } from '@/components/canvas/Scene'

export default function Page() {
  return (
    <div>
      <h1>My Page</h1>
      <View className="h-96">
        <Scene />
      </View>
    </div>
  )
}
```

#### Pattern 2: ECS Component Integration (viber3d)

```typescript
// traits/transform.ts
import { trait } from 'koota'
import * as THREE from 'three'

export const Transform = trait(() => ({
  position: new THREE.Vector3(),
  rotation: new THREE.Euler(),
  scale: new THREE.Vector3(1, 1, 1),
}))

// traits/ref.ts
export const Ref = trait(() => ({
  value: null as THREE.Object3D | null
}))

// components/player-renderer.tsx
import { useWorld } from 'koota/react'
import { IsPlayer, Transform, Ref } from '../traits'
import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export function PlayerRenderer() {
  const world = useWorld()
  const meshRef = useRef<THREE.Mesh>(null)
  
  // Get player entity
  const player = world.query(IsPlayer).first
  
  useEffect(() => {
    if (meshRef.current && player) {
      // Store ref in ECS
      player.set(Ref, { value: meshRef.current })
    }
  }, [player])
  
  // Sync mesh to ECS position
  useFrame(() => {
    if (!player || !meshRef.current) return
    
    const transform = player.get(Transform)
    if (transform) {
      meshRef.current.position.copy(transform.position)
      meshRef.current.rotation.copy(transform.rotation)
    }
  })
  
  if (!player) return null
  
  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  )
}
```

**Best Practices:**
- ✅ Keep components presentational (no game logic)
- ✅ Read ECS data in components, modify in systems
- ✅ Use `useFrame` only for syncing ECS to Three.js
- ✅ Store Three.js refs in ECS if systems need them
- ✅ Separate DOM and Canvas components clearly
- ❌ Don't put game logic in React state
- ❌ Don't mutate ECS traits directly in components

### 4. State Management (Zustand in viber3d)

#### Global UI State Pattern

```typescript
// store/uiStore.ts
import { create } from 'zustand'

interface UIState {
  score: number
  isPaused: boolean
  showMenu: boolean
  addScore: (amount: number) => void
  togglePause: () => void
  toggleMenu: () => void
}

export const useUIStore = create<UIState>((set) => ({
  score: 0,
  isPaused: false,
  showMenu: false,
  
  addScore: (amount) => set((state) => ({ 
    score: state.score + amount 
  })),
  
  togglePause: () => set((state) => ({ 
    isPaused: !state.isPaused 
  })),
  
  toggleMenu: () => set((state) => ({ 
    showMenu: !state.showMenu 
  })),
}))

// Usage in component
function HUD() {
  const score = useUIStore((state) => state.score)
  const isPaused = useUIStore((state) => state.isPaused)
  
  return (
    <div className="fixed top-4 left-4">
      <div>Score: {score}</div>
      {isPaused && <div>PAUSED</div>}
    </div>
  )
}

// Usage in system
function scoreSystem(world: World) {
  const entities = world.query(Enemy, IsDead)
  
  entities.forEach(() => {
    useUIStore.getState().addScore(10)
  })
}
```

#### ECS + Zustand Integration Pattern

```typescript
// store/gameStore.ts
import { create } from 'zustand'
import type { World } from 'koota'

interface GameStore {
  world: World | null
  isRunning: boolean
  setWorld: (world: World) => void
  start: () => void
  stop: () => void
}

export const useGameStore = create<GameStore>((set) => ({
  world: null,
  isRunning: false,
  
  setWorld: (world) => set({ world }),
  
  start: () => set({ isRunning: true }),
  
  stop: () => set({ isRunning: false }),
}))
```

**Best Practices:**
- ✅ Use Zustand for UI/app state
- ✅ Use ECS (Koota) for game entity state
- ✅ Keep stores small and focused
- ✅ Use selectors to prevent unnecessary re-renders
- ✅ Access Zustand from systems via `getState()`
- ❌ Don't store entity data in Zustand
- ❌ Don't query ECS in render loops

### 5. Physics Integration (React Three Rapier)

#### Basic Physics Setup (viber3d)

```typescript
// app.tsx
import { Physics } from '@react-three/rapier'

export function App() {
  return (
    <Canvas>
      <Physics gravity={[0, -9.81, 0]} debug>
        <GameScene />
      </Physics>
    </Canvas>
  )
}

// components/PhysicsBox.tsx
import { RigidBody } from '@react-three/rapier'

export function PhysicsBox() {
  return (
    <RigidBody type="dynamic" colliders="cuboid">
      <mesh>
        <boxGeometry />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  )
}

// components/Ground.tsx
export function Ground() {
  return (
    <RigidBody type="fixed" colliders="cuboid">
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="gray" />
      </mesh>
    </RigidBody>
  )
}
```

#### Advanced: ECS + Physics Integration

```typescript
// traits/rigidbody.ts
import { trait } from 'koota'
import type { RigidBody } from '@react-three/rapier'

export const RigidBodyRef = trait(() => ({
  body: null as RigidBody | null
}))

export const PhysicsVelocity = trait({ x: 0, y: 0, z: 0 })

// systems/apply-velocity.ts
import type { World } from 'koota'
import { RigidBodyRef, PhysicsVelocity } from '../traits'

export function applyVelocitySystem(world: World) {
  world.query(RigidBodyRef, PhysicsVelocity).updateEach(([ref, vel]) => {
    if (ref.body) {
      ref.body.setLinvel({ x: vel.x, y: vel.y, z: vel.z }, true)
    }
  })
}

// components/PhysicsPlayer.tsx
import { RigidBody } from '@react-three/rapier'
import { useWorld } from 'koota/react'
import { IsPlayer, RigidBodyRef } from '../traits'

export function PhysicsPlayer() {
  const world = useWorld()
  const player = world.query(IsPlayer).first
  
  return (
    <RigidBody
      ref={(body) => {
        if (body && player) {
          player.set(RigidBodyRef, { body })
        }
      }}
      type="dynamic"
      colliders="ball"
    >
      <mesh>
        <sphereGeometry />
        <meshStandardMaterial color="blue" />
      </mesh>
    </RigidBody>
  )
}
```

**Best Practices:**
- ✅ Use `debug` prop during development
- ✅ Store RigidBody refs in ECS for system access
- ✅ Use appropriate collider types (ball, cuboid, trimesh)
- ✅ Set `type="fixed"` for static geometry
- ✅ Apply forces via `applyImpulse` for realistic physics
- ⚠️ Trimesh colliders are expensive (use for terrain only)
- ❌ Don't manually set positions every frame (breaks physics)
- ❌ Don't use physics for everything (spatial hash for simple checks)

### 6. Canvas Portaling & DOM Synchronization (react-three-next)

#### Tunnel-rat Pattern

```typescript
// lib/tunnel.ts
import tunnel from 'tunnel-rat'

export const { In, Out } = tunnel()

// app/layout.tsx
import { Canvas } from '@react-three/fiber'
import { Out } from '@/lib/tunnel'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        
        {/* Single persistent canvas */}
        <Canvas
          className="fixed top-0 left-0 w-full h-full pointer-events-none"
          eventSource={document.getElementById('root')}
        >
          <Out />
        </Canvas>
      </body>
    </html>
  )
}

// components/canvas/View.tsx
import { In } from '@/lib/tunnel'
import { useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'

export function View({ children, className }) {
  const ref = useRef<HTMLDivElement>(null)
  const { camera, size } = useThree()
  
  useEffect(() => {
    if (!ref.current) return
    
    // Set up view tracking
    const bounds = ref.current.getBoundingClientRect()
    // Position camera/viewport for this view
  }, [])
  
  return (
    <>
      <div ref={ref} className={className} />
      <In>{children}</In>
    </>
  )
}

// Usage in page
export default function Page() {
  return (
    <div>
      <section>
        <h1>Hero Section</h1>
        <View className="h-screen">
          <HeroScene />
        </View>
      </section>
      
      <section>
        <h1>Product Showcase</h1>
        <View className="h-96">
          <ProductScene />
        </View>
      </section>
    </div>
  )
}
```

**Best Practices:**
- ✅ Single Canvas in root layout
- ✅ Use `<View>` components to portal content
- ✅ Set `pointer-events-none` on canvas, enable on views
- ✅ Track view bounds for camera/viewport setup
- ✅ Navigate without unmounting canvas (preserves WebGL context)
- ⚠️ Requires careful event handling setup
- ❌ Don't create multiple Canvas instances

### 7. Performance Optimization

#### General Three.js Performance (threejs-skills)

```javascript
// 1. Geometry Instancing
const geometry = new THREE.BoxGeometry(1, 1, 1)
const material = new THREE.MeshStandardMaterial({ color: 'red' })

for (let i = 0; i < 1000; i++) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.x = Math.random() * 100
  scene.add(mesh)
}
// ✅ Shares geometry & material = low memory

// 2. InstancedMesh for many copies
const count = 10000
const instancedMesh = new THREE.InstancedMesh(geometry, material, count)

const matrix = new THREE.Matrix4()
for (let i = 0; i < count; i++) {
  matrix.setPosition(
    Math.random() * 100,
    Math.random() * 100,
    Math.random() * 100
  )
  instancedMesh.setMatrixAt(i, matrix)
}
instancedMesh.instanceMatrix.needsUpdate = true
scene.add(instancedMesh)

// 3. Frustum Culling (automatic, but verify bounds)
mesh.geometry.computeBoundingBox()

// 4. LOD (Level of Detail)
const lod = new THREE.LOD()
lod.addLevel(highDetailMesh, 0)
lod.addLevel(mediumDetailMesh, 50)
lod.addLevel(lowDetailMesh, 100)
scene.add(lod)

// 5. Dispose unused resources
geometry.dispose()
material.dispose()
texture.dispose()
```

#### R3F Performance Patterns (viber3d)

```jsx
// 1. Drei helpers
import { useTexture, useGLTF } from '@react-three/drei'

// Automatically disposes on unmount
const texture = useTexture('/texture.jpg')
const { scene } = useGLTF('/model.glb')

// 2. Drei <Instances> for many copies
import { Instances, Instance } from '@react-three/drei'

function Trees() {
  return (
    <Instances limit={1000}>
      <boxGeometry />
      <meshStandardMaterial />
      
      {Array.from({ length: 1000 }).map((_, i) => (
        <Instance
          key={i}
          position={[Math.random() * 100, 0, Math.random() * 100]}
        />
      ))}
    </Instances>
  )
}

// 3. useMemo for expensive calculations
const positions = useMemo(() => {
  const pos = []
  for (let i = 0; i < 10000; i++) {
    pos.push(Math.random() * 100, Math.random() * 100, Math.random() * 100)
  }
  return new Float32Array(pos)
}, [])

// 4. Drei <Detailed> for LOD
import { Detailed } from '@react-three/drei'

function LODModel() {
  return (
    <Detailed distances={[0, 50, 100]}>
      <HighDetail />
      <MediumDetail />
      <LowDetail />
    </Detailed>
  )
}
```

#### ECS Performance (viber3d)

```typescript
// 1. Efficient queries (select only needed traits)
world.query(Transform, Velocity).select(Transform).updateEach(([transform]) => {
  // Only access Transform data
})

// 2. Spatial hashing for collision detection
import { SpatialHash } from './utils/spatial-hash'

const spatialHash = new SpatialHash(10) // cell size 10

// In system
function collisionSystem(world: World) {
  spatialHash.clear()
  
  // Insert all entities
  world.query(Transform, Collider).updateEach(([transform, collider], entity) => {
    spatialHash.insert(entity.id(), transform.position)
  })
  
  // Check nearby entities only
  world.query(Transform, Collider).updateEach(([transform], entity) => {
    const nearby = spatialHash.query(transform.position, 5)
    // Check collisions only with nearby entities
  })
}

// 3. Tag traits for filtering (zero memory)
const IsEnemy = trait() // tag trait

// Fast filtering
world.query(Transform, IsEnemy).updateEach(([transform]) => {
  // Only enemies
})
```

**Performance Checklist:**
- ✅ Use InstancedMesh for >100 identical objects
- ✅ Share geometries and materials
- ✅ Dispose resources on unmount
- ✅ Use LOD for distant objects
- ✅ Implement frustum culling
- ✅ Spatial hashing for collision detection
- ✅ Limit shadow-casting lights
- ✅ Use texture compression (Draco, KTX2)
- ✅ Profile with Chrome DevTools
- ✅ Monitor FPS with Stats.js or Drei's `<Stats />`

### 8. TypeScript & Type Safety

#### Three.js Types

```typescript
import * as THREE from 'three'

// Typed refs
const meshRef = useRef<THREE.Mesh>(null)
const groupRef = useRef<THREE.Group>(null)

// Typed events
function handleClick(event: THREE.Event) {
  console.log(event.point) // THREE.Vector3
  console.log(event.object) // THREE.Object3D
}

// Material types
const material: THREE.MeshStandardMaterial = new THREE.MeshStandardMaterial()

// Geometry types
const geometry: THREE.BufferGeometry = new THREE.BoxGeometry()
```

#### Koota ECS Types (viber3d)

```typescript
import { trait, type World, type Entity } from 'koota'

// Trait type inference
const Health = trait({ amount: 100, max: 100 })
type HealthData = ReturnType<typeof Health> // { amount: number, max: number }

// System typing
export function healthSystem(world: World): void {
  world.query(Health).updateEach(([health], entity: Entity) => {
    // health is properly typed
    health.amount = Math.min(health.amount, health.max)
  })
}

// Action typing
export const actions = createActions((world: World) => ({
  spawnEnemy: (position: THREE.Vector3): Entity => {
    return world.spawn(
      Transform({ position }),
      Health({ amount: 50, max: 50 })
    )
  },
}))

// Using typed actions
import { useActions } from 'koota/react'

function SpawnButton() {
  const { spawnEnemy } = useActions(actions)
  
  return (
    <button onClick={() => spawnEnemy(new THREE.Vector3(0, 0, 0))}>
      Spawn
    </button>
  )
}
```

#### R3F Types

```typescript
import type { ThreeEvent } from '@react-three/fiber'
import type { Mesh } from 'three'

function InteractiveMesh() {
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    console.log(e.point) // Vector3
    console.log(e.object) // Object3D
    e.stopPropagation()
  }
  
  return (
    <mesh onPointerDown={handlePointerDown}>
      <boxGeometry />
      <meshStandardMaterial />
    </mesh>
  )
}
```

**Best Practices:**
- ✅ Type all refs with Three.js types
- ✅ Use trait type inference
- ✅ Type system parameters and returns
- ✅ Type event handlers
- ✅ Use `strict: true` in tsconfig.json
- ✅ Type component props
- ❌ Don't use `any` (use `unknown` if needed)

### 9. Testing & Validation

#### Unit Testing Patterns

```typescript
// systems/health.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createWorld } from 'koota'
import { Health } from '../traits'
import { healthSystem } from './health'

describe('healthSystem', () => {
  let world
  
  beforeEach(() => {
    world = createWorld()
  })
  
  it('clamps health to max', () => {
    const entity = world.spawn(Health({ amount: 150, max: 100 }))
    
    healthSystem(world)
    
    const health = entity.get(Health)
    expect(health.amount).toBe(100)
  })
  
  it('removes entity at zero health', () => {
    const entity = world.spawn(Health({ amount: 0, max: 100 }))
    
    healthSystem(world)
    
    expect(entity.isAlive()).toBe(false)
  })
})
```

#### Visual Testing Pattern

```jsx
// Storybook or manual test
export function TestScene() {
  return (
    <Canvas>
      <ambientLight />
      <Box position={[0, 0, 0]} />
      <Stats /> {/* FPS monitor */}
    </Canvas>
  )
}
```

**Testing Strategy:**
- ✅ Unit test systems (pure functions)
- ✅ Unit test actions
- ✅ Integration test with test world
- ✅ Visual regression testing for scenes
- ✅ Performance benchmarks
- ❌ Don't test Three.js internals
- ❌ Don't test React internals

---

## Common Patterns Library

### Pattern 1: Basic Scene Setup

```jsx
// Vanilla Three.js
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
document.body.appendChild(renderer.domElement)

camera.position.z = 5

function animate() {
  requestAnimationFrame(animate)
  renderer.render(scene, camera)
}
animate()
```

```jsx
// React Three Fiber
import { Canvas } from '@react-three/fiber'

function App() {
  return (
    <Canvas camera={{ position: [0, 0, 5], fov: 75 }}>
      <MyScene />
    </Canvas>
  )
}
```

### Pattern 2: Loading and Displaying Models

```jsx
import { useGLTF } from '@react-three/drei'
import { Suspense } from 'react'

function Model() {
  const { scene } = useGLTF('/model.glb')
  return <primitive object={scene} />
}

function App() {
  return (
    <Canvas>
      <Suspense fallback={<LoadingSpinner />}>
        <Model />
      </Suspense>
    </Canvas>
  )
}

// Preload
useGLTF.preload('/model.glb')
```

### Pattern 3: Camera Controls

```jsx
import { OrbitControls, FirstPersonControls } from '@react-three/drei'

// Orbit controls (examine object)
function Scene() {
  return (
    <>
      <OrbitControls 
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={50}
      />
      <mesh>...</mesh>
    </>
  )
}

// First person controls (game-style)
function GameScene() {
  return (
    <>
      <FirstPersonControls 
        movementSpeed={5}
        lookSpeed={0.1}
      />
      <mesh>...</mesh>
    </>
  )
}
```

### Pattern 4: Responsive Canvas

```jsx
// Automatically handled in R3F
<Canvas>
  <mesh>...</mesh>
</Canvas>

// Manual vanilla Three.js
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})
```

### Pattern 5: Canvas Portaling with View

```jsx
// root layout
<Canvas className="fixed inset-0 pointer-events-none">
  <Out />
</Canvas>

// page
<View className="h-screen">
  <MyScene />
</View>
```

### Pattern 6: Performance Monitoring

```jsx
// React Three Fiber
import { Stats } from '@react-three/drei'

<Canvas>
  <Stats />
  <Scene />
</Canvas>

// Vanilla Three.js
import Stats from 'stats.js'

const stats = new Stats()
document.body.appendChild(stats.dom)

function animate() {
  stats.begin()
  renderer.render(scene, camera)
  stats.end()
  requestAnimationFrame(animate)
}
```

### Pattern 7: Error Handling and Fallbacks

```jsx
// Loading fallback
import { Suspense } from 'react'

<Suspense fallback={<Loader />}>
  <Model />
</Suspense>

// Error boundary
import { ErrorBoundary } from 'react-error-boundary'

<ErrorBoundary fallback={<ErrorFallback />}>
  <Canvas>
    <Scene />
  </Canvas>
</ErrorBoundary>

// Manual fallback in component
function Model() {
  try {
    const { scene } = useGLTF('/model.glb')
    return <primitive object={scene} />
  } catch (error) {
    console.error('Model failed to load', error)
    return <FallbackBox />
  }
}
```

### Pattern 8: Animation System Integration

```typescript
// AnimationController.ts
import * as THREE from 'three'

export class AnimationController {
  private mixer: THREE.AnimationMixer
  private actions: Map<string, THREE.AnimationAction> = new Map()
  private current: string | null = null
  
  constructor(model: THREE.Object3D, animations: THREE.AnimationClip[]) {
    this.mixer = new THREE.AnimationMixer(model)
    
    animations.forEach(clip => {
      const action = this.mixer.clipAction(clip)
      this.actions.set(clip.name, action)
    })
  }
  
  play(name: string, loop = true, fadeTime = 0.2) {
    const action = this.actions.get(name)
    if (!action) return
    
    action.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce
    action.clampWhenFinished = !loop
    
    if (this.current && this.current !== name) {
      const prev = this.actions.get(this.current)
      prev?.fadeOut(fadeTime)
    }
    
    action.reset().fadeIn(fadeTime).play()
    this.current = name
  }
  
  stop() {
    this.actions.forEach(action => action.stop())
    this.current = null
  }
  
  update(delta: number) {
    this.mixer.update(delta)
  }
  
  dispose() {
    this.mixer.stopAllAction()
    this.actions.clear()
  }
}

// Usage in R3F component
function AnimatedCharacter() {
  const { scene, animations } = useGLTF('/character.glb')
  const controllerRef = useRef<AnimationController>()
  
  useEffect(() => {
    controllerRef.current = new AnimationController(scene, animations)
    controllerRef.current.play('idle')
    
    return () => {
      controllerRef.current?.dispose()
    }
  }, [scene, animations])
  
  useFrame((state, delta) => {
    controllerRef.current?.update(delta)
  })
  
  return <primitive object={scene} />
}
```

### Pattern 9: ECS Spawn Function

```typescript
// actions.ts
import { createActions } from 'koota'
import { Transform, Health, IsEnemy, Model } from './traits'
import * as THREE from 'three'

export const actions = createActions((world) => ({
  spawnEnemy: (position: THREE.Vector3) => {
    return world.spawn(
      Transform({ position: position.clone() }),
      Health({ amount: 50, max: 50 }),
      IsEnemy(),
      Model({ path: '/models/enemy.glb' })
    )
  },
  
  damageEntity: (entity: Entity, amount: number) => {
    if (!entity.has(Health)) return
    
    entity.set(Health, (prev) => ({
      ...prev,
      amount: Math.max(0, prev.amount - amount)
    }))
    
    // Remove if dead
    if (entity.get(Health).amount <= 0) {
      entity.destroy()
    }
  },
}))
```

### Pattern 10: Custom Shader Material

```jsx
// Custom shader material in R3F
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import * as THREE from 'three'

const CustomMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.2, 0.0, 0.1),
  },
  // vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    
    void main() {
      gl_FragColor = vec4(color * vUv.x * sin(time), 1.0);
    }
  `
)

extend({ CustomMaterial })

function Mesh() {
  const materialRef = useRef()
  
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.time = state.clock.elapsedTime
    }
  })
  
  return (
    <mesh>
      <planeGeometry args={[1, 1]} />
      <customMaterial ref={materialRef} />
    </mesh>
  )
}
```

### Pattern 11: Postprocessing Effects

```jsx
import { EffectComposer, Bloom, ChromaticAberration } from '@react-three/postprocessing'

function Scene() {
  return (
    <Canvas>
      <mesh>...</mesh>
      
      <EffectComposer>
        <Bloom 
          intensity={1.5}
          luminanceThreshold={0.9}
          luminanceSmoothing={0.9}
        />
        <ChromaticAberration offset={[0.002, 0.002]} />
      </EffectComposer>
    </Canvas>
  )
}
```

### Pattern 12: Raycasting for Interaction

```jsx
// Automatic in R3F
function InteractiveMesh() {
  const [hovered, setHovered] = useState(false)
  
  return (
    <mesh
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      onClick={(e) => console.log('Clicked!', e.point)}
    >
      <boxGeometry />
      <meshStandardMaterial color={hovered ? 'hotpink' : 'white'} />
    </mesh>
  )
}

// Manual vanilla Three.js
const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
  
  raycaster.setFromCamera(mouse, camera)
  
  const intersects = raycaster.intersectObjects(scene.children)
  if (intersects.length > 0) {
    console.log('Hit:', intersects[0].object)
  }
})
```

### Pattern 13: Debug UI with Leva

```jsx
import { useControls } from 'leva'

function Scene() {
  const { position, color, scale } = useControls({
    position: { value: [0, 0, 0], step: 0.1 },
    color: '#ff0000',
    scale: { value: 1, min: 0.1, max: 5, step: 0.1 },
  })
  
  return (
    <mesh position={position} scale={scale}>
      <boxGeometry />
      <meshStandardMaterial color={color} />
    </mesh>
  )
}
```

### Pattern 14: Multiple Scenes/Cameras

```jsx
import { createPortal, useThree } from '@react-three/fiber'
import { useFBO } from '@react-three/drei'

function MultiScene() {
  const { gl, scene, camera } = useThree()
  const renderTarget = useFBO()
  
  const virtualScene = useMemo(() => new THREE.Scene(), [])
  const virtualCamera = useMemo(() => new THREE.PerspectiveCamera(), [])
  
  useFrame(() => {
    // Render to texture
    gl.setRenderTarget(renderTarget)
    gl.render(virtualScene, virtualCamera)
    gl.setRenderTarget(null)
  })
  
  return (
    <>
      {/* Main scene */}
      <mesh>
        <boxGeometry />
        <meshStandardMaterial map={renderTarget.texture} />
      </mesh>
      
      {/* Virtual scene (rendered to texture) */}
      {createPortal(
        <>
          <mesh>
            <sphereGeometry />
            <meshNormalMaterial />
          </mesh>
        </>,
        virtualScene
      )}
    </>
  )
}
```

### Pattern 15: Spatial Audio

```jsx
import { PositionalAudio } from '@react-three/drei'

function AudioSource({ url }) {
  return (
    <mesh position={[5, 0, 0]}>
      <sphereGeometry args={[0.5]} />
      <meshStandardMaterial />
      <PositionalAudio url={url} distance={10} loop />
    </mesh>
  )
}
```

### Pattern 16: World Grid with Streaming (viber3d pattern)

```typescript
// TileDefinition
interface TileDefinition {
  id: string
  objects: TileObjectConfig[]
}

interface TileObjectConfig {
  type: 'model' | 'primitive'
  modelPath?: string
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: [number, number, number] | number
}

// WorldComposer - loads tiles in 3x3 grid around player
class WorldComposer {
  private activeTiles: Map<string, TileInstance> = new Map()
  private tileSize = 50
  
  update(playerPosition: THREE.Vector3) {
    const gridX = Math.floor(playerPosition.x / this.tileSize)
    const gridZ = Math.floor(playerPosition.z / this.tileSize)
    
    // Load 3x3 around player
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const tileKey = `${gridX + x},${gridZ + z}`
        
        if (!this.activeTiles.has(tileKey)) {
          this.loadTile(gridX + x, gridZ + z)
        }
      }
    }
    
    // Unload distant tiles
    this.activeTiles.forEach((tile, key) => {
      const [tx, tz] = key.split(',').map(Number)
      if (Math.abs(tx - gridX) > 1 || Math.abs(tz - gridZ) > 1) {
        this.unloadTile(key)
      }
    })
  }
  
  private loadTile(gridX: number, gridZ: number) {
    const tileKey = `${gridX},${gridZ}`
    const definition = this.selectTileDefinition(gridX, gridZ)
    
    const tile = this.instantiateTile(definition, gridX, gridZ)
    this.activeTiles.set(tileKey, tile)
  }
  
  private unloadTile(tileKey: string) {
    const tile = this.activeTiles.get(tileKey)
    if (tile) {
      tile.dispose()
      this.activeTiles.delete(tileKey)
    }
  }
}
```

### Pattern 17: Firebase Integration (viber3d quests4friends)

```typescript
// firebase.ts
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)

// authService.ts
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'

export const signUp = async (email: string, password: string) => {
  return await createUserWithEmailAndPassword(auth, email, password)
}

export const signIn = async (email: string, password: string) => {
  return await signInWithEmailAndPassword(auth, email, password)
}

// questService.ts
import { collection, addDoc, getDoc, doc } from 'firebase/firestore'
import { db } from './firebase'

export const saveQuest = async (questData: QuestData) => {
  const docRef = await addDoc(collection(db, 'quests'), questData)
  return docRef.id
}

export const loadQuest = async (questId: string) => {
  const docRef = doc(db, 'quests', questId)
  const docSnap = await getDoc(docRef)
  return docSnap.exists() ? docSnap.data() : null
}
```

### Pattern 18: AI-Friendly Component Structure

```typescript
// Good: Single responsibility, clear data flow
// components/Enemy.tsx
interface EnemyProps {
  entity: Entity
}

export function Enemy({ entity }: EnemyProps) {
  const transform = entity.get(Transform)
  const health = entity.get(Health)
  
  if (!transform || !health) return null
  
  return (
    <group position={transform.position.toArray()}>
      <EnemyModel />
      <HealthBar current={health.amount} max={health.max} />
    </group>
  )
}

// Better: Composable, testable
// components/EnemyModel.tsx
export function EnemyModel() {
  const { scene } = useGLTF('/models/enemy.glb')
  return <primitive object={scene} />
}

// components/HealthBar.tsx
interface HealthBarProps {
  current: number
  max: number
}

export function HealthBar({ current, max }: HealthBarProps) {
  const percentage = (current / max) * 100
  
  return (
    <Billboard>
      <mesh position={[0, 2, 0]}>
        <planeGeometry args={[1, 0.1]} />
        <meshBasicMaterial color="red" />
      </mesh>
    </Billboard>
  )
}
```

### Pattern 19: Keyboard Input System

```typescript
// traits/input.ts
export const Input = trait({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
})

// systems/poll-input.ts
export function pollInputSystem(world: World) {
  const input = world.get(Input)
  if (!input) return
  
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    space: false,
  }
  
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'w') keys.w = true
    if (e.key === 'a') keys.a = true
    if (e.key === 's') keys.s = true
    if (e.key === 'd') keys.d = true
    if (e.key === ' ') keys.space = true
  }
  
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'w') keys.w = false
    if (e.key === 'a') keys.a = false
    if (e.key === 's') keys.s = false
    if (e.key === 'd') keys.d = false
    if (e.key === ' ') keys.space = false
  }
  
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
  
  // Update input trait
  world.set(Input, {
    forward: keys.w,
    backward: keys.s,
    left: keys.a,
    right: keys.d,
    jump: keys.space,
  })
}

// systems/apply-input.ts
export function applyInputSystem(world: World) {
  const input = world.get(Input)
  if (!input) return
  
  world.query(IsPlayer, Velocity).updateEach(([player, velocity]) => {
    const direction = new THREE.Vector3()
    
    if (input.forward) direction.z -= 1
    if (input.backward) direction.z += 1
    if (input.left) direction.x -= 1
    if (input.right) direction.x += 1
    
    direction.normalize().multiplyScalar(5)
    
    velocity.x = direction.x
    velocity.z = direction.z
  })
}
```

### Pattern 20: Mobile Touch Controls

```jsx
// MobileJoystick.tsx
import { useEffect, useRef } from 'react'
import { useUIStore } from '../store/uiStore'

export function MobileJoystick() {
  const containerRef = useRef<HTMLDivElement>(null)
  const setInput = useUIStore((state) => state.setInput)
  
  useEffect(() => {
    if (!containerRef.current) return
    
    let touching = false
    let startX = 0
    let startY = 0
    
    const handleTouchStart = (e: TouchEvent) => {
      touching = true
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }
    
    const handleTouchMove = (e: TouchEvent) => {
      if (!touching) return
      
      const dx = e.touches[0].clientX - startX
      const dy = e.touches[0].clientY - startY
      
      const angle = Math.atan2(dy, dx)
      const distance = Math.min(Math.hypot(dx, dy), 50) / 50
      
      setInput({
        x: Math.cos(angle) * distance,
        y: -Math.sin(angle) * distance,
      })
    }
    
    const handleTouchEnd = () => {
      touching = false
      setInput({ x: 0, y: 0 })
    }
    
    const el = containerRef.current
    el.addEventListener('touchstart', handleTouchStart)
    el.addEventListener('touchmove', handleTouchMove)
    el.addEventListener('touchend', handleTouchEnd)
    
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [setInput])
  
  return (
    <div
      ref={containerRef}
      className="fixed bottom-8 left-8 w-32 h-32 bg-gray-800 rounded-full opacity-50"
    />
  )
}
```

---

## Working Examples Index

### threejs-skills Examples (Expected)

Based on repository description, expect examples in these files:

1. **fundamentals.md**
   - Basic scene setup
   - Renderer configuration
   - Camera types and usage
   - Animation loop

2. **geometry.md**
   - BufferGeometry creation
   - Custom geometry
   - Primitive shapes
   - Geometry manipulation

3. **materials.md**
   - MeshStandardMaterial
   - MeshPhysicalMaterial
   - Material properties
   - Texture mapping

4. **lighting.md**
   - AmbientLight
   - DirectionalLight
   - PointLight, SpotLight
   - Shadow configuration

5. **textures.md**
   - TextureLoader usage
   - UV mapping
   - Texture compression
   - Environment maps

6. **animation.md**
   - AnimationMixer
   - Keyframe animations
   - Morph targets
   - Skeletal animation

7. **loaders.md**
   - GLTFLoader
   - FBXLoader
   - TextureLoader
   - Asset management

8. **shaders.md**
   - ShaderMaterial basics
   - GLSL syntax
   - Uniforms and attributes
   - Custom shaders

9. **postprocessing.md**
   - EffectComposer
   - Render passes
   - Bloom effect
   - Custom passes

10. **interaction.md**
    - Raycasting
    - Mouse events
    - Touch events
    - OrbitControls

### react-three-next Examples (Expected)

1. **Canvas Portaling**
   - View component usage
   - Page navigation
   - Multiple 3D views on one page

2. **SSR Compatibility**
   - Dynamic imports
   - No-SSR wrapper
   - Hydration patterns

3. **Component Structure**
   - DOM components
   - Canvas components
   - Layout patterns

### viber3d Examples (Confirmed)

1. **Starter Template** (`templates/starter/`)
   - Basic ECS setup
   - Player controller
   - Camera follow system
   - Input handling

2. **Quests4Friends Template** (`templates/quests4friends/`)
   - Full game architecture
   - Quest system
   - NPC interactions
   - World tile streaming
   - Firebase integration
   - Animation system

3. **Documentation Examples** (`docs/viber3d-docs/`)
   - ECS patterns
   - Trait definitions
   - System implementations
   - Component rendering
   - Actions usage

**Live Demo:** [viber3d-spacewars.kevinkern.dev](https://viber3d-spacewars.kevinkern.dev/)

---

## Dependencies & Version Matrix

### Three.js Core (All Repos)

| Package | Version | Notes |
|---------|---------|-------|
| three | 0.173.0 | Core library |
| @types/three | 0.173.0 | TypeScript definitions |

### React Three Ecosystem

| Package | viber3d | react-three-next | Notes |
|---------|---------|------------------|-------|
| @react-three/fiber | 8.17.12 | Latest | React renderer for Three.js |
| @react-three/drei | 9.120.8 | Latest | Helper components |
| @react-three/rapier | 1.5.0 | N/A | Physics (viber3d only) |
| @react-three/postprocessing | 2.16.6 | Latest | Effects |

### React & Build Tools

| Package | viber3d | react-three-next |
|---------|---------|------------------|
| react | 18.3.1 | 18.2.0 |
| react-dom | 18.3.1 | 18.2.0 |
| next | N/A | 14.0.4 |
| vite | 6.2.0 | 5.x |
| typescript | 5.7.3 | 5.x |

### Game/App Architecture (viber3d)

| Package | Version | Purpose |
|---------|---------|---------|
| koota | 0.1.12 | ECS library |
| zustand | 5.0.2 | State management |
| leva | 0.10.0 | Debug UI |
| tunnel-rat | N/A (react-three-next) | Canvas portaling |

### Styling

| Package | Version | Notes |
|---------|---------|-------|
| tailwindcss | 4.0.9 (viber3d), 3.x (r-t-n) | Utility CSS |
| @tailwindcss/vite | 4.0.9 | Vite plugin |

### Compatibility Matrix

```
✅ Compatible
⚠️ Requires configuration
❌ Not compatible

Three.js r173 + R3F 8.17 + React 18: ✅
Three.js r173 + R3F 8.17 + React 19: ✅ (viber3d tested)
Next.js 14 + R3F + Vite: ⚠️ (requires custom setup)
Koota 0.1.12 + R3F 8.17: ✅
Rapier 1.5 + R3F 8.17: ✅
```

### Version Pin Recommendations

For production stability, pin these exact versions:

```json
{
  "dependencies": {
    "three": "0.173.0",
    "@react-three/fiber": "8.17.12",
    "@react-three/drei": "9.120.8",
    "react": "18.3.1",
    "react-dom": "18.3.1",
    "koota": "0.1.12",
    "zustand": "5.0.2"
  }
}
```

### Breaking Changes to Watch

- **Three.js r160+**: GLTFLoader import path changed to `three/addons`
- **React 19**: Some minor breaking changes in concurrent features
- **Vite 6**: Changed plugin API
- **Koota**: Pre-1.0, API may change

---

## Gotchas & Solutions

### 1. GLTFLoader Import Path

**Problem:**
```typescript
// ❌ Old (pre-r160)
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// Error: Module not found
```

**Solution:**
```typescript
// ✅ New (r160+)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
```

### 2. Infinite Re-renders with ECS

**Problem:**
```typescript
// ❌ Creates new object every render
const selectedEntity = useSelectedEntity((state) => ({
  entity: state.entity,
  data: state.data
}))
```

**Solution:**
```typescript
// ✅ Use stable selectors
const entity = useSelectedEntity((state) => state.entity)
const data = useSelectedEntity((state) => state.data)

// Or simplify selector
const entity = world.query(IsPlayer).first
```

### 3. Physics Not Working

**Problem:** RigidBodies don't react to forces

**Solution:**
```jsx
// ❌ Wrong: Fixed bodies don't move
<RigidBody type="fixed">
  <Player />
</RigidBody>

// ✅ Correct: Use dynamic for moving objects
<RigidBody type="dynamic">
  <Player />
</RigidBody>
```

### 4. Animation Not Playing

**Problem:** Model loads but doesn't animate

**Solution:**
```typescript
// Check for animations
const { scene, animations } = useGLTF('/model.glb')
console.log('Animations found:', animations.length)

// Ensure mixer updates
useFrame((state, delta) => {
  mixer.update(delta) // Don't forget delta!
})

// Check animation names
animations.forEach(clip => console.log(clip.name))
```

### 5. Canvas Not Responding to Events

**Problem:** Click events don't fire

**Solution:**
```jsx
// ❌ Wrong: Canvas has pointer-events-none
<Canvas className="pointer-events-none">

// ✅ Correct: Remove or enable events
<Canvas>
  <mesh onClick={(e) => console.log('Clicked!')}>
```

### 6. SSR Errors with Three.js

**Problem:** `window is not defined` in Next.js

**Solution:**
```jsx
// Use dynamic import with ssr: false
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <div>Loading...</div>
})
```

### 7. Memory Leaks

**Problem:** Memory usage increases over time

**Solution:**
```typescript
// Always dispose Three.js resources
useEffect(() => {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial()
  
  return () => {
    geometry.dispose()
    material.dispose()
    texture?.dispose()
  }
}, [])

// Use useGLTF for automatic disposal
const { scene } = useGLTF('/model.glb') // Auto-disposed on unmount
```

### 8. Shadows Not Appearing

**Problem:** Objects don't cast shadows

**Solution:**
```jsx
// Enable shadows on Canvas
<Canvas shadows>

// Enable on light
<directionalLight castShadow position={[10, 10, 5]} />

// Enable on mesh
<mesh castShadow receiveShadow>
  <boxGeometry />
  <meshStandardMaterial />
</mesh>
```

### 9. Performance Drops

**Problem:** FPS drops with many objects

**Solution:**
```jsx
// Use InstancedMesh or Drei <Instances>
import { Instances, Instance } from '@react-three/drei'

<Instances limit={1000}>
  <boxGeometry />
  <meshStandardMaterial />
  {objects.map((obj, i) => (
    <Instance key={i} position={obj.position} />
  ))}
</Instances>

// Or implement spatial hashing for collision detection
```

### 10. TypeScript Errors with Traits

**Problem:** Trait type inference issues

**Solution:**
```typescript
// ❌ Implicit any
const health = entity.get(Health)
health.amount = 100 // Type error

// ✅ Type is inferred
const health = entity.get(Health)
if (health) {
  health.amount = 100 // OK
}

// ✅ Or use non-null assertion if you're sure
const health = entity.get(Health)!
health.amount = 100
```

### 11. Canvas Portaling Not Working

**Problem:** View component doesn't render

**Solution:**
```jsx
// Ensure Canvas is in root layout
// app/layout.tsx
<Canvas>
  <Out /> {/* tunnel-rat output */}
</Canvas>

// Ensure In/Out are from same tunnel
import { In, Out } from '@/lib/tunnel'

// Don't create multiple tunnels
```

### 12. useFrame Running Too Fast/Slow

**Problem:** Movement speed inconsistent

**Solution:**
```typescript
// ❌ Wrong: Frame-dependent
useFrame(() => {
  position.x += 1 // Depends on framerate
})

// ✅ Correct: Delta-time based
useFrame((state, delta) => {
  position.x += speed * delta // Framerate-independent
})
```

### 13. Firebase Environment Variables Not Found

**Problem:** `import.meta.env.VITE_FIREBASE_API_KEY is undefined`

**Solution:**
```bash
# Create .env.local file
VITE_FIREBASE_API_KEY=your_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_domain
# ... etc

# Restart dev server after creating .env file
npm run dev
```

### 14. Model Position/Rotation Incorrect

**Problem:** Loaded model is rotated or positioned wrong

**Solution:**
```jsx
// Option 1: Wrap in group and transform
<group rotation={[0, Math.PI, 0]} position={[0, -1, 0]}>
  <primitive object={scene} />
</group>

// Option 2: Fix in Blender before export
// - Apply all transforms
// - Set correct up axis (Y-up for Three.js)
// - Export with correct settings
```

### 15. Camera Not Following Player

**Problem:** Camera stays static

**Solution:**
```typescript
// Ensure camera system runs after movement
export function cameraFollowSystem(world: World) {
  const camera = world.query(IsCamera).first
  const player = world.query(IsPlayer).first
  
  if (!camera || !player) return
  
  const cameraTransform = camera.get(Transform)
  const playerTransform = player.get(Transform)
  
  if (!cameraTransform || !playerTransform) return
  
  // Smooth follow
  cameraTransform.position.lerp(
    playerTransform.position.clone().add(new THREE.Vector3(0, 5, 10)),
    0.1
  )
  
  // Look at player
  const cameraRef = camera.get(Ref)
  if (cameraRef?.value) {
    cameraRef.value.lookAt(playerTransform.position)
  }
}

// Run in correct order in frameloop
updatePlayerPosition(world)
cameraFollowSystem(world) // After player moves
syncView(world)
```

---

## Migration Path

### Phase 1: Vanilla Three.js → React Three Fiber

**When:** You're building a React app and want declarative 3D

**Steps:**

1. **Install Dependencies**
   ```bash
   npm install three @react-three/fiber @react-three/drei
   npm install -D @types/three
   ```

2. **Convert Scene Setup**
   ```javascript
   // Before (vanilla)
   const scene = new THREE.Scene()
   const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight)
   const renderer = new THREE.WebGLRenderer()
   renderer.setSize(window.innerWidth, window.innerHeight)
   document.body.appendChild(renderer.domElement)
   
   // After (R3F)
   import { Canvas } from '@react-three/fiber'
   
   function App() {
     return <Canvas camera={{ fov: 75 }}><Scene /></Canvas>
   }
   ```

3. **Convert Meshes**
   ```javascript
   // Before
   const geometry = new THREE.BoxGeometry()
   const material = new THREE.MeshStandardMaterial({ color: 'red' })
   const mesh = new THREE.Mesh(geometry, material)
   scene.add(mesh)
   
   // After
   <mesh>
     <boxGeometry />
     <meshStandardMaterial color="red" />
   </mesh>
   ```

4. **Convert Animation Loop**
   ```javascript
   // Before
   function animate() {
     requestAnimationFrame(animate)
     cube.rotation.x += 0.01
     renderer.render(scene, camera)
   }
   
   // After
   import { useFrame } from '@react-three/fiber'
   
   function RotatingCube() {
     const ref = useRef()
     useFrame(() => {
       ref.current.rotation.x += 0.01
     })
     return <mesh ref={ref}>...</mesh>
   }
   ```

5. **Use Drei Helpers**
   ```jsx
   import { OrbitControls, Environment, ContactShadows } from '@react-three/drei'
   
   <Canvas>
     <OrbitControls />
     <Environment preset="sunset" />
     <ContactShadows />
     <Scene />
   </Canvas>
   ```

**Benefits:**
- Declarative, React-like API
- Automatic cleanup
- Better component composition
- Easier state management

### Phase 2: R3F → react-three-next (Multi-Page Apps)

**When:** You need server-side rendering, SEO, multi-page navigation

**Steps:**

1. **Install react-three-next**
   ```bash
   git clone [react-three-next-repo]
   npm install
   ```

2. **Understand Canvas Portaling**
   - Single Canvas in root layout
   - View components create portals
   - Navigate without re-mounting canvas

3. **Separate DOM and Canvas Components**
   ```
   src/
   ├── components/
   │   ├── canvas/  # 3D components
   │   └── dom/     # HTML components
   ```

4. **Use View Component**
   ```jsx
   // app/page.tsx
   import { View } from '@/components/canvas/View'
   import { MyScene } from '@/components/canvas/MyScene'
   
   export default function Page() {
     return (
       <div>
         <h1>My Page</h1>
         <View className="h-96">
           <MyScene />
         </View>
       </div>
     )
   }
   ```

5. **Handle SSR**
   ```jsx
   // Dynamic import with ssr: false
   const Scene = dynamic(() => import('@/components/canvas/Scene'), {
     ssr: false
   })
   ```

**Benefits:**
- SEO-friendly 3D sites
- Multi-page apps without canvas re-mount
- Persistent WebGL context
- Better UX on navigation

### Phase 3: R3F → viber3d (Game Development)

**When:** Building games or complex interactive experiences

**Steps:**

1. **Create viber3d Project**
   ```bash
   npx viber3d@latest init my-game
   cd my-game
   npm install
   ```

2. **Understand ECS Architecture**
   - Entities = unique IDs
   - Traits = pure data
   - Systems = logic
   - Actions = entity manipulation

3. **Define Traits (Data)**
   ```typescript
   // src/traits/health.ts
   import { trait } from 'koota'
   
   export const Health = trait({ amount: 100, max: 100 })
   ```

4. **Create Systems (Logic)**
   ```typescript
   // src/systems/damage.ts
   export function damageSystem(world: World) {
     world.query(Health, IsDamaged).updateEach(([health, damaged]) => {
       health.amount -= damaged.amount
       if (health.amount <= 0) {
         // Entity dies
       }
     })
   }
   ```

5. **Create Actions (Spawning)**
   ```typescript
   // src/actions.ts
   export const actions = createActions((world) => ({
     spawnEnemy: (position) => {
       return world.spawn(
         Transform({ position }),
         Health({ amount: 50 }),
         IsEnemy()
       )
     }
   }))
   ```

6. **Add to Frameloop**
   ```typescript
   // src/frameloop.ts
   export function GameLoop() {
     const world = useWorld()
     
     useFrame((state, delta) => {
       updateTime(world, delta)
       inputSystem(world)
       movementSystem(world)
       damageSystem(world)
       syncView(world)
     })
     
     return null
   }
   ```

7. **Integrate Physics (Optional)**
   ```bash
   # Already included in viber3d
   npm install @react-three/rapier
   ```
   
   ```jsx
   // app.tsx
   import { Physics } from '@react-three/rapier'
   
   <Canvas>
     <Physics>
       <GameLoop />
       <Scene />
     </Physics>
   </Canvas>
   ```

8. **Add State Management**
   ```typescript
   // src/store/gameStore.ts
   import { create } from 'zustand'
   
   export const useGameStore = create((set) => ({
     score: 0,
     addScore: (amount) => set((s) => ({ score: s.score + amount }))
   }))
   ```

**Benefits:**
- Scalable game architecture
- Performance through data-oriented design
- Built-in physics support
- State management included
- AI coding rules for faster development

### Full Migration Path Summary

```
Vanilla Three.js
      ↓
      ↓ (Need React integration)
      ↓
React Three Fiber
      ↓
      ├─→ (Need multi-page app) → react-three-next
      │
      └─→ (Need game architecture) → viber3d
```

### Hybrid Approach

You can also combine approaches:

- **Use viber3d ECS** in react-three-next for complex game logic
- **Use react-three-next portaling** in viber3d for multi-view UIs
- **Reference threejs-skills** for vanilla Three.js knowledge at any stage

---

## AI Code Generation Rules

### General Guidelines for All AI Tools

1. **Always specify Three.js version** (r173)
2. **Use TypeScript** for type safety
3. **Follow ECS patterns** when using viber3d
4. **Separate concerns** (data/logic/rendering)
5. **Include disposal** in cleanup
6. **Use delta time** for frame-independent movement
7. **Implement error boundaries** for 3D components

### Cursor AI (viber3d Integrated)

viber3d includes pre-configured `.cursor/rules` directory:

**Files:**
- `.cursor/rules/trait-rules.md` - ECS trait patterns
- `.cursor/rules/system-rules.md` - System implementation
- `.cursor/rules/component-rules.md` - R3F component patterns
- `.cursor/rules/viber3d-rules.md` - General architecture

**Usage:**
```
Prompt: "Create a health system that damages entities over time"

Cursor will:
1. Check existing trait files
2. Create Health trait if needed
3. Implement damageSystem following patterns
4. Add system to frameloop
5. Use proper TypeScript types
```

**Custom Instructions:**
```markdown
# viber3d Development Rules

- Use Koota ECS for game logic
- Keep components presentational
- Systems are pure functions
- Actions centralize entity manipulation
- Follow trait → system → component flow
- Always dispose Three.js resources
- Use Zustand for UI state only
```

### GitHub Copilot

Create `.github/copilot-instructions.md`:

```markdown
# Three.js & React Three Fiber Instructions

## General Rules
- Use Three.js r173 or higher
- Import from 'three/addons' not 'three/examples'
- Always include TypeScript types
- Dispose geometry, materials, textures on cleanup

## React Three Fiber
- Use useFrame for animations
- Use useGLTF for model loading
- Use Drei helpers when appropriate
- Keep components pure (no game logic)

## ECS (viber3d)
- Define traits first
- Systems process entities
- Actions spawn/modify entities
- Sync ECS to Three.js in components

## Code Style
- Functional components
- Hooks for side effects
- Arrow functions preferred
- Clear variable names
```

### Windsurf

Create `.windsurfrules`:

```markdown
# Three.js Development

Use Three.js r173+, React Three Fiber 8.17+, TypeScript

## Patterns
- ECS: traits → systems → components
- R3F: declarative 3D with <Canvas>
- Cleanup: dispose() in useEffect return
- Animation: useFrame with delta time
- Loading: useGLTF with Suspense

## Avoid
- Direct Three.js manipulation in React state
- Forgetting to dispose resources
- Frame-dependent movement (use delta)
- Multiple Canvas instances (use portaling)
```

### Cline

Add to Custom Instructions:

```
When working with Three.js projects:

1. Check if using vanilla Three.js, R3F, or viber3d ECS
2. For viber3d: follow ECS patterns (traits → systems → actions → components)
3. Always use TypeScript with proper types
4. Include cleanup/disposal logic
5. Use delta time for animations
6. Reference threejs-skills patterns for vanilla implementations
7. Use Drei helpers to simplify common tasks
8. Implement error boundaries around 3D content
9. Test on multiple devices (desktop, mobile)
10. Profile performance with Stats component
```

### Prompt Templates

#### Create New Entity Type

```
Create a new [entity type] in viber3d with:
- Traits: [list traits]
- Systems: [list behavior]
- Spawning action
- Rendering component
- Follow existing project patterns
```

Example:
```
Create a new Collectible entity in viber3d with:
- Traits: Transform, Collider, IsCollectible, CollectValue (100 points)
- Systems: Rotate collectible, Check player collision, Award points on collect
- Spawning action in actions.ts
- Rendering component with glowing effect
- Follow existing project patterns
```

#### Add Feature to Existing System

```
Add [feature] to [system] in viber3d:
- Modify traits: [changes]
- Update system logic: [behavior]
- Maintain existing patterns
- Add TypeScript types
```

#### Convert Vanilla to R3F

```
Convert this vanilla Three.js code to React Three Fiber:

[paste vanilla code]

Requirements:
- Use declarative JSX
- Use useFrame for animations
- Use Drei helpers where appropriate
- Include proper cleanup
```

#### Optimize Performance

```
Optimize this Three.js scene for better performance:

[describe current scene]

Current FPS: [number]
Target FPS: [number]

Consider:
- Instancing for repeated objects
- LOD for distant objects
- Texture compression
- Spatial hashing for collisions
```

### Best Practices for AI Pair Programming

1. **Provide Context**
   - Mention which repo/pattern you're using
   - Include relevant existing code
   - Specify Three.js/R3F versions

2. **Be Specific**
   - "Add damage system following viber3d ECS patterns"
   - Not "Add damage"

3. **Reference Examples**
   - "Similar to how PlayerController works"
   - "Follow the pattern in enemySystem.ts"

4. **Request Tests**
   - "Include unit tests for this system"
   - "Add visual test component"

5. **Ask for Explanations**
   - "Explain why you chose this pattern"
   - "What are the performance implications?"

6. **Iterate**
   - Start simple
   - Add complexity incrementally
   - Test at each step

---

## Appendix A: Quick Reference

### Three.js r173 Key APIs

```javascript
// Scene
const scene = new THREE.Scene()

// Camera
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })

// Geometries
new THREE.BoxGeometry(w, h, d)
new THREE.SphereGeometry(radius, widthSegments, heightSegments)
new THREE.PlaneGeometry(width, height)

// Materials
new THREE.MeshStandardMaterial({ color, metalness, roughness })
new THREE.MeshPhysicalMaterial({ /* advanced PBR */ })
new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms })

// Lights
new THREE.AmbientLight(color, intensity)
new THREE.DirectionalLight(color, intensity)
new THREE.PointLight(color, intensity, distance)

// Loaders
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
new THREE.TextureLoader()
```

### R3F Key Components

```jsx
<Canvas>           // Scene + renderer
<mesh>             // THREE.Mesh
<boxGeometry>      // THREE.BoxGeometry
<meshStandardMaterial> // Materials
<ambientLight>     // Lights
<OrbitControls>    // Camera controls (Drei)
<Environment>      // HDR environment (Drei)
<ContactShadows>   // Ground shadows (Drei)
<Stats>            // FPS monitor (Drei)
<Suspense>         // Loading state
```

### Koota ECS Key APIs

```typescript
// World
const world = createWorld()

// Traits
const Health = trait({ amount: 100 })
const Position = trait(() => new THREE.Vector3())
const IsEnemy = trait() // tag

// Spawn
const entity = world.spawn(Health(), Position(), IsEnemy())

// Query
world.query(Health, Position).updateEach(([health, pos]) => {
  // Process
})

// Actions
const actions = createActions((world) => ({
  spawnEnemy: () => world.spawn(IsEnemy(), Health())
}))

// React hooks
const world = useWorld()
const { spawnEnemy } = useActions(actions)
```

### Zustand Key APIs

```typescript
// Create store
const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 }))
}))

// Use in component
const count = useStore((s) => s.count)
const increment = useStore((s) => s.increment)

// Use outside React
useStore.getState().increment()
```

---

## Appendix B: Performance Benchmarks

### Target Performance Metrics

| Metric | Target | Good | Acceptable |
|--------|--------|------|------------|
| FPS (Desktop) | 60 | 45-60 | 30-45 |
| FPS (Mobile) | 60 | 30-60 | 20-30 |
| Load Time | <2s | <3s | <5s |
| Draw Calls | <100 | <200 | <500 |
| Triangles | <100k | <500k | <1M |
| Memory | <200MB | <500MB | <1GB |

### Optimization Impact

| Optimization | FPS Impact | Difficulty |
|--------------|------------|------------|
| InstancedMesh | +50% | Easy |
| Texture compression | +10% | Medium |
| LOD | +30% | Medium |
| Frustum culling | +20% | Easy (auto) |
| Spatial hashing | +40% | Hard |
| Occlusion culling | +60% | Hard |

---

## Appendix C: Resource Links

### Official Documentation

- [Three.js Docs](https://threejs.org/docs/)
- [R3F Docs](https://docs.pmnd.rs/react-three-fiber)
- [Drei Docs](https://github.com/pmndrs/drei)
- [Koota Docs](https://github.com/krispya/koota)
- [Rapier Physics](https://rapier.rs/)
- [Zustand Docs](https://docs.pmnd.rs/zustand)

### Learning Resources

- [Three.js Journey](https://threejs-journey.com/)
- [React Three Fiber Journey](https://journey.pmnd.rs/)
- [Discover Three.js](https://discoverthreejs.com/)

### Tools

- [Three.js Editor](https://threejs.org/editor/)
- [glTF Viewer](https://gltf-viewer.donmccurdy.com/)
- [Draco Compression](https://github.com/google/draco)
- [KTX2 Basis Texture](https://github.com/KhronosGroup/KTX-Software)

### Community

- [Three.js Discourse](https://discourse.threejs.org/)
- [Poimandres Discord](https://discord.gg/poimandres)
- [r/threejs](https://reddit.com/r/threejs)

---

## Document Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01 | Initial comprehensive audit |

---

**End of Master Document**

For questions, issues, or contributions to this guide, please file an issue in the respective repository or contact the maintainers.
