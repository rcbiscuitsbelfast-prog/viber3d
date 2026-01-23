# The Definitive Three.js Game Development Guide

**Single Source of Truth for Building 3D Games with Three.js**  
**Consolidated Knowledge from: threejs-skills, react-three-next, viber3d**

> 🤖 **AI-Optimized Architecture:** This repository is designed for AI-assisted development. Following these patterns improves code generation quality with Cursor, Copilot, and other AI tools.

> ⚠️ **Version Notice:** This guide reflects the state of the ecosystem as of January 2025. Version numbers are specific to ensure compatibility, but architectural patterns remain stable across updates. Check individual package changelogs when upgrading.

---

## 🚀 Quick Reference Card

**Need something fast? Jump here:**

| I need to... | Go to | Time |
|---------------|--------|------|
| Create player character | [Pattern 1](#pattern-1-complete-player-character) | 15 min |
| Add enemy AI | [Pattern 2](#pattern-2-enemy-ai) | 10 min |
| Implement weapons | [Pattern 3](#pattern-3-weapon-system) | 15 min |
| Add collectibles | [Pattern 4](#pattern-4-collectible-items) | 5 min |
| Fix physics | [System 8](#8-physics-integration-system) | 5 min |
| Animate models | [System 9](#9-animation-system) | 10 min |
| Optimize performance | [Performance](#performance--optimization) | 20 min |
| Debug issue | [Troubleshooting](#troubleshooting) | 5 min |
| Deploy game | [Production Checklist](#production-checklist) | 30 min |

**⚡ 5-minute fixes** - Performance drop, animation not playing, memory leaks, black screen  
**🔧 15-minute features** - New enemy type, weapon upgrade, collectible, UI element  
**🎮 1-hour systems** - Complete AI behavior, weapon system, level progression

---

## 📖 How to Use This Guide

**Choose your entry point based on your goal:**

### 🧠 New to Three.js or Game Development?
→ Read in order: [Introduction](#introduction) → [Technology Stack](#technology-stack) → [Architecture Blueprint](#architecture-blueprint) → [Getting Started](#getting-started)

**Time investment:** 2-3 hours to understand foundations

### 🎮 Building a Game Right Now?
→ Jump to: [Getting Started](#getting-started) → [Complete Code Examples](#complete-code-examples) → Reference [Core Systems](#core-systems) as needed

**Time to first playable:** 2-4 hours

### 🌐 Coming from Web Development?
→ Focus on: [Architecture Blueprint](#architecture-blueprint) (ECS concepts) → [Game Development Patterns](#game-development-patterns) → [Core Systems](#core-systems)

**Learning curve:** ECS is different from React patterns, budget 4-6 hours

### 🔧 Debugging or Optimizing?
→ Use: [Troubleshooting](#troubleshooting) → [Performance & Optimization](#performance--optimization)

**Reference as needed**

### 🤖 Configuring AI Tools?
→ See: [Advanced Topics](#advanced-topics) > AI Integration (scroll to end)

**Setup time:** 15-30 minutes

### 🚀 Ready for Production?
→ Follow: [Production Checklist](#production-checklist)

**Polish phase:** 1-2 weeks typical

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Architecture Blueprint](#architecture-blueprint)
4. [Getting Started](#getting-started)
5. [Core Systems](#core-systems)
6. [Game Development Patterns](#game-development-patterns)
7. [Complete Code Examples](#complete-code-examples)
8. [Performance & Optimization](#performance--optimization)
9. [Production Checklist](#production-checklist)
10. [Troubleshooting](#troubleshooting)
11. [Advanced Topics](#advanced-topics)

---

## Introduction

### What This Guide Covers

This is the **only guide you need** to build production-ready 3D games with Three.js. It combines:

- **Technical fundamentals** from threejs-skills (observed patterns for learning)
- **Framework integration** from react-three-next (recommended for web apps)
- **Game architecture** from viber3d (**canonical standard** for games)

### Who This Is For

**Perfect for:**
- Senior frontend/graphics engineers building 3D products
- Small teams shipping production games
- Developers using AI-assisted workflows
- Long-lived projects requiring maintainability

**Not ideal for:**
- Absolute beginners (consider Three.js fundamentals first)
- "Quick prototype" projects (vanilla Three.js may be faster)
- Projects with no TypeScript (this guide assumes TS)

### What You'll Build

By following this guide, you'll be able to build:
- First-person/third-person games
- Physics-based games
- Multiplayer games (with additional backend)
- Mobile-friendly 3D games
- VR/AR experiences

---

## Technology Stack

### Core Stack (Non-Negotiable)

```json
{
  "three": "0.173.0",
  "@react-three/fiber": "8.17.12",
  "@react-three/drei": "9.120.8",
  "react": "18.3.1",
  "react-dom": "18.3.1",
  "typescript": "5.7.3",
  "vite": "6.2.0"
}
```

### Game Architecture (Recommended)

```json
{
  "koota": "0.1.12",           // ECS (Entity Component System)
  "zustand": "5.0.2",          // State management
  "@react-three/rapier": "1.5.0",  // Physics engine
  "leva": "0.10.0"             // Debug UI
}
```

> 💡 **Pattern Type:** ⭐ **Canonical Standard** (proven production game architecture)

### Why This Stack?

| Technology | Purpose | Benefit |
|------------|---------|---------|
| **Three.js** | 3D rendering | Industry standard, huge ecosystem |
| **React Three Fiber** | Declarative 3D | Component-based, easier than vanilla |
| **Koota ECS** | Game architecture | Scalable, performant, maintainable |
| **Rapier** | Physics | Fast WASM physics, great R3F integration |
| **Zustand** | UI/App state | Simple, no boilerplate, TypeScript-first |
| **TypeScript** | Type safety | Catch bugs early, better IDE support |
| **Vite** | Build tool | Fast HMR, optimized production builds |

### ⚠️ When to Use Alternative Approaches

This stack (ECS + R3F + TypeScript) is **optimized for production games**, but consider alternatives if:

#### Use Vanilla Three.js Instead When:
- Building a **quick prototype** (<2 days, experimental)
- Learning **Three.js fundamentals** (no React/ECS overhead)
- Maximum **performance** needed (direct WebGL control)
- **No TypeScript** required
- Building a **minimal demo** (<100 lines of code)

#### Use Simple React + R3F Instead When:
- **Quick interactive scene** (portfolio, landing page)
- **No game logic** needed (just 3D visualization)
- **Small project** (1-2 pages, simple interactions)
- **Learning R3F basics** (before adding ECS complexity)

#### Use React-Three-Next Instead When:
- **Multi-page website** with 3D on multiple pages
- **SEO-critical** content (product pages, marketing sites)
- **Next.js features** needed (SSR, API routes, image optimization)
- **Server-side rendering** required

#### Use Different Game Engine When:
- **Desktop/mobile native** game (Unity, Unreal, Godot)
- **Existing team expertise** (if team already knows another engine)
- **Platform-specific features** (native APIs, platform integrations)
- **Massive multiplayer** (>100 players, requires different architecture)

**Decision Framework:**
```markdown
1. Is this a production game? → Use this stack
2. Is this a website with 3D? → Consider react-three-next
3. Is this a prototype/learning project? → Vanilla Three.js or simple R3F
4. What are team skills? → Match to existing expertise
```

For framework comparisons, see: **[MASTER_THREEJS_BEST_PRACTICES.md](./MASTER_THREEJS_BEST_PRACTICES.md)** > "Repository Profiles"

---

## Architecture Blueprint

### The Three-Layer Architecture

```
┌─────────────────────────────────────────┐
│            RENDERING LAYER              │
│  (React Components - Visual Only)       │
│  - Read ECS data                        │
│  - Render Three.js objects              │
│  - No game logic here                   │
└─────────────────────────────────────────┘
                    ↑
                    │ (reads)
                    │
┌─────────────────────────────────────────┐
│          GAME LOGIC LAYER               │
│    (ECS Systems - Pure Functions)       │
│  - Process entities                     │
│  - Update traits                        │
│  - Game rules                           │
└─────────────────────────────────────────┘
                    ↑
                    │ (queries)
                    │
┌─────────────────────────────────────────┐
│            DATA LAYER                   │
│      (ECS Traits - Pure Data)           │
│  - Position, Health, Velocity           │
│  - No logic, just data                  │
└─────────────────────────────────────────┘
```

### Why ECS for Games?

**Traditional OOP Approach (❌ Don't Use):**
```typescript
class Enemy {
  position: Vector3
  health: number
  mesh: THREE.Mesh
  
  update() {
    // Logic mixed with data
    // Hard to test, hard to extend
  }
  
  render() {
    // Rendering mixed with logic
  }
}
```

**ECS Approach (✅ Use This):**
```typescript
// Data (Traits)
const Position = trait({ x: 0, y: 0, z: 0 })
const Health = trait({ amount: 100, max: 100 })

// Logic (Systems)
function damageSystem(world: World) {
  world.query(Health, IsDamaged).updateEach(([health]) => {
    health.amount -= 10
  })
}

// Rendering (Components)
function EnemyView({ entity }: { entity: Entity }) {
  const pos = entity.get(Position)
  return <mesh position={[pos.x, pos.y, pos.z]} />
}
```

**Benefits:**
- ✅ Separation of concerns
- ✅ Easy to test systems
- ✅ Reusable traits across entities
- ✅ Performance through data-oriented design
- ✅ Easy to add/remove features

> 💡 **Pattern Type:** ⭐ **Canonical Standard** (use ECS for all game logic)

---

## Getting Started

### Step 1: Create Your Game Project

```bash
# Use viber3d CLI (fastest)
npx viber3d@latest init my-game
cd my-game
npm install
npm run dev
```

**Project Structure Created:**
```
my-game/
├── src/
│   ├── actions.ts          # Entity spawning/manipulation
│   ├── frameloop.ts        # Game loop
│   ├── world.ts            # ECS world setup
│   ├── app.tsx             # Main App component
│   ├── main.tsx            # Entry point
│   ├── startup.tsx         # Initialization
│   ├── components/         # React components
│   ├── systems/            # Game logic
│   ├── traits/             # Data definitions
│   └── utils/              # Helper functions
├── public/                 # Static assets
│   └── models/             # 3D models (.glb)
├── .cursor/rules/          # AI coding rules
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### Step 2: Understand the Starter Code

**world.ts** - The ECS World
```typescript
import { createWorld } from 'koota'
import { Time, SpatialHashMap } from './traits'

// Create world with global traits
export const world = createWorld(Time, SpatialHashMap)
```

**app.tsx** - The Main Component
```typescript
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { GameLoop } from './frameloop'
import { Startup } from './startup'

export function App() {
  return (
    <Canvas shadows camera={{ position: [0, 5, 10], fov: 75 }}>
      <Startup />
      <GameLoop />
      
      <Physics gravity={[0, -9.81, 0]}>
        {/* Game objects here */}
      </Physics>
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} castShadow />
    </Canvas>
  )
}
```

**frameloop.ts** - The Game Loop
```typescript
import { useFrame } from '@react-three/fiber'
import { useWorld } from 'koota/react'
import { updateTime } from './systems/update-time'
import { inputSystem } from './systems/input'
import { movementSystem } from './systems/movement'
import { syncView } from './systems/sync-view'

export function GameLoop() {
  const world = useWorld()
  
  useFrame((state, delta) => {
    // Update in order
    updateTime(world, delta)
    inputSystem(world)
    movementSystem(world)
    syncView(world)
  })
  
  return null
}
```

### Step 3: Run Your First Game

```bash
npm run dev
# Open http://localhost:5173
```

You should see a basic 3D scene. Now let's build a real game!

---

## Core Systems

### 1. Entity Management System

**Define Your Entities as Traits:**

```typescript
// src/traits/entity-types.ts
import { trait } from 'koota'

// Tag traits (no data, just markers)
export const IsPlayer = trait()
export const IsEnemy = trait()
export const IsBullet = trait()
export const IsCollectible = trait()
export const IsDead = trait()

// Data traits
export const Health = trait({ 
  amount: 100, 
  max: 100 
})

export const Damage = trait({ 
  amount: 10 
})

export const Score = trait({ 
  value: 0 
})
```

**Spawn Entities with Actions:**

```typescript
// src/actions.ts
import { createActions } from 'koota'
import * as THREE from 'three'
import { IsPlayer, IsEnemy, IsBullet, Transform, Health, Velocity } from './traits'

export const actions = createActions((world) => ({
  spawnPlayer: (position: THREE.Vector3) => {
    return world.spawn(
      IsPlayer(),
      Transform({ position: position.clone() }),
      Health({ amount: 100, max: 100 }),
      Velocity({ x: 0, y: 0, z: 0 })
    )
  },
  
  spawnEnemy: (position: THREE.Vector3) => {
    return world.spawn(
      IsEnemy(),
      Transform({ position: position.clone() }),
      Health({ amount: 50, max: 50 }),
      Velocity({ x: 0, y: 0, z: 0 })
    )
  },
  
  spawnBullet: (position: THREE.Vector3, direction: THREE.Vector3) => {
    return world.spawn(
      IsBullet(),
      Transform({ position: position.clone() }),
      Velocity({ 
        x: direction.x * 20, 
        y: direction.y * 20, 
        z: direction.z * 20 
      }),
      Damage({ amount: 25 })
    )
  },
  
  destroyEntity: (entity: Entity) => {
    entity.destroy()
  }
}))
```

### 2. Movement System

```typescript
// src/systems/movement.ts
import type { World } from 'koota'
import { Transform, Velocity } from '../traits'

export function movementSystem(world: World) {
  const time = world.get(Time)
  if (!time) return
  
  // Update all entities with position and velocity
  world.query(Transform, Velocity).updateEach(([transform, velocity]) => {
    transform.position.x += velocity.x * time.delta
    transform.position.y += velocity.y * time.delta
    transform.position.z += velocity.z * time.delta
  })
}
```

### 3. Combat System

```typescript
// src/systems/combat.ts
import type { World } from 'koota'
import { Transform, Health, Damage, IsBullet, IsEnemy, IsDead } from '../traits'
import { actions } from '../actions'

export function combatSystem(world: World) {
  const bullets = world.query(IsBullet, Transform, Damage)
  const enemies = world.query(IsEnemy, Transform, Health, Not(IsDead))
  
  bullets.forEach((bulletEntity) => {
    const bulletTransform = bulletEntity.get(Transform)
    const bulletDamage = bulletEntity.get(Damage)
    
    enemies.forEach((enemyEntity) => {
      const enemyTransform = enemyEntity.get(Transform)
      const enemyHealth = enemyEntity.get(Health)
      
      // Simple distance check (use spatial hash for production)
      const distance = bulletTransform.position.distanceTo(enemyTransform.position)
      
      if (distance < 1) {
        // Apply damage
        enemyHealth.amount -= bulletDamage.amount
        
        // Destroy bullet
        actions.destroyEntity(bulletEntity)
        
        // Check if enemy died
        if (enemyHealth.amount <= 0) {
          enemyEntity.add(IsDead())
          // Could award score here
        }
      }
    })
  })
}
```

### 4. Input System

```typescript
// src/traits/input.ts
export const Input = trait({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  shoot: false,
  mouseX: 0,
  mouseY: 0
})

// src/systems/input.ts
let keysPressed = new Set<string>()

export function setupInputListeners() {
  window.addEventListener('keydown', (e) => {
    keysPressed.add(e.key.toLowerCase())
  })
  
  window.addEventListener('keyup', (e) => {
    keysPressed.delete(e.key.toLowerCase())
  })
  
  window.addEventListener('mousemove', (e) => {
    // Store mouse position for aiming
  })
  
  window.addEventListener('click', () => {
    keysPressed.add('shoot')
    setTimeout(() => keysPressed.delete('shoot'), 100)
  })
}

export function inputSystem(world: World) {
  const input = world.get(Input)
  if (!input) return
  
  input.forward = keysPressed.has('w')
  input.backward = keysPressed.has('s')
  input.left = keysPressed.has('a')
  input.right = keysPressed.has('d')
  input.jump = keysPressed.has(' ')
  input.shoot = keysPressed.has('shoot')
}
```

### 5. Player Controller System

```typescript
// src/systems/player-controller.ts
import type { World } from 'koota'
import { IsPlayer, Transform, Velocity, Input } from '../traits'
import * as THREE from 'three'

export function playerControllerSystem(world: World) {
  const input = world.get(Input)
  if (!input) return
  
  const player = world.query(IsPlayer, Transform, Velocity).first
  if (!player) return
  
  const [transform, velocity] = player.get(Transform, Velocity)
  
  // Calculate movement direction
  const direction = new THREE.Vector3()
  
  if (input.forward) direction.z -= 1
  if (input.backward) direction.z += 1
  if (input.left) direction.x -= 1
  if (input.right) direction.x += 1
  
  // Normalize and apply speed
  if (direction.length() > 0) {
    direction.normalize()
    const speed = 5
    velocity.x = direction.x * speed
    velocity.z = direction.z * speed
  } else {
    // Decelerate
    velocity.x *= 0.8
    velocity.z *= 0.8
  }
  
  // Shooting
  if (input.shoot) {
    const bulletDirection = new THREE.Vector3(0, 0, -1)
    actions.spawnBullet(
      transform.position.clone().add(new THREE.Vector3(0, 0.5, 0)),
      bulletDirection
    )
  }
}
```

### 6. Camera System

```typescript
// src/traits/camera.ts
export const IsCamera = trait()
export const CameraFollow = trait(() => ({
  target: null as Entity | null,
  offset: new THREE.Vector3(0, 5, 10),
  smoothing: 0.1
}))

// src/systems/camera.ts
export function cameraSystem(world: World) {
  const camera = world.query(IsCamera, Transform, CameraFollow).first
  if (!camera) return
  
  const [cameraTransform, follow] = camera.get(Transform, CameraFollow)
  
  if (follow.target) {
    const targetTransform = follow.target.get(Transform)
    if (targetTransform) {
      // Smooth follow
      const targetPos = targetTransform.position.clone().add(follow.offset)
      cameraTransform.position.lerp(targetPos, follow.smoothing)
      
      // Look at target
      const cameraRef = camera.get(Ref)
      if (cameraRef?.value) {
        cameraRef.value.lookAt(targetTransform.position)
      }
    }
  }
}
```

### 7. Spawning System (Enemy Waves)

```typescript
// src/systems/spawner.ts
import type { World } from 'koota'
import * as THREE from 'three'

const SpawnerState = trait({
  timeSinceLastSpawn: 0,
  spawnInterval: 2, // seconds
  maxEnemies: 10
})

export function spawnerSystem(world: World) {
  const time = world.get(Time)
  const spawner = world.get(SpawnerState)
  if (!time || !spawner) return
  
  spawner.timeSinceLastSpawn += time.delta
  
  // Count existing enemies
  const enemyCount = world.query(IsEnemy, Not(IsDead)).length
  
  // Spawn if needed
  if (spawner.timeSinceLastSpawn >= spawner.spawnInterval && enemyCount < spawner.maxEnemies) {
    const spawnPos = new THREE.Vector3(
      (Math.random() - 0.5) * 20,
      0,
      -15
    )
    
    actions.spawnEnemy(spawnPos)
    spawner.timeSinceLastSpawn = 0
  }
}
```

### 8. Physics Integration System

```typescript
// src/traits/physics.ts
import type { RigidBody } from '@react-three/rapier'

export const RigidBodyRef = trait(() => ({
  body: null as RigidBody | null
}))

// src/systems/physics.ts
export function applyForceSystem(world: World) {
  const player = world.query(IsPlayer, RigidBodyRef, Velocity).first
  if (!player) return
  
  const [bodyRef, velocity] = player.get(RigidBodyRef, Velocity)
  
  if (bodyRef.body) {
    bodyRef.body.setLinvel({
      x: velocity.x,
      y: bodyRef.body.linvel().y, // Preserve y (gravity)
      z: velocity.z
    }, true)
  }
}
```

### 9. Animation System

**Pattern Type:** ⭐ **Canonical Standard** (use this approach)

```typescript
// src/traits/animation.ts
export const AnimationState = trait(() => ({
  mixer: null as THREE.AnimationMixer | null,
  actions: new Map<string, THREE.AnimationAction>(),
  current: null as string | null
}))

// src/systems/animation.ts
export function animationSystem(world: World) {
  const time = world.get(Time)
  if (!time) return
  
  world.query(AnimationState).updateEach(([anim]) => {
    if (anim.mixer) {
      anim.mixer.update(time.delta)
    }
  })
}

// Helper to play animation
export function playAnimation(entity: Entity, name: string, fadeTime = 0.2) {
  const anim = entity.get(AnimationState)
  if (!anim) return
  
  const action = anim.actions.get(name)
  if (!action) return
  
  // Fade out current
  if (anim.current && anim.current !== name) {
    const current = anim.actions.get(anim.current)
    current?.fadeOut(fadeTime)
  }
  
  // Fade in new
  action.reset().fadeIn(fadeTime).play()
  anim.current = name
}
```

> ⚠️ **Real-World Caveats:**
> - Animation names may differ between exports (check `animations[0].name` in console)
> - Multiple GLB files may have conflicting animation names (prefix them)
> - Some models have animations targeting different skeletons (verify in Blender)
> - Always test with mismatched/broken assets to handle gracefully
> - Consider fallback to T-pose if animation not found

### 10. Cleanup System

```typescript
// src/systems/cleanup.ts
export function cleanupSystem(world: World) {
  // Remove dead entities
  world.query(IsDead).forEach((entity) => {
    entity.destroy()
  })
  
  // Remove entities out of bounds
  world.query(Transform).forEach((entity) => {
    const transform = entity.get(Transform)
    if (Math.abs(transform.position.x) > 100 || 
        Math.abs(transform.position.z) > 100 ||
        transform.position.y < -10) {
      entity.destroy()
    }
  })
}
```

---

## Game Development Patterns

> **Pattern Labels:**
> - ⭐ **Canonical Standard** = Recommended production approach
> - 🔧 **Recommended Pattern** = Good default choice
> - 🧪 **Optional / Advanced** = For specific use cases
> - 📊 **Observed Pattern** = Common in the wild, not prescriptive

### Pattern 1: Complete Player Character

**Pattern Type:** ⭐ **Canonical Standard**

```typescript
// src/components/Player.tsx
import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useWorld } from 'koota/react'
import { IsPlayer, Transform, RigidBodyRef, AnimationState } from '../traits'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export function Player() {
  const world = useWorld()
  const player = world.query(IsPlayer).first
  
  const { scene, animations } = useGLTF('/models/character.glb')
  const mixerRef = useRef<THREE.AnimationMixer>()
  
  // Setup animations
  useEffect(() => {
    if (!player || animations.length === 0) return
    
    const mixer = new THREE.AnimationMixer(scene)
    const actions = new Map<string, THREE.AnimationAction>()
    
    animations.forEach((clip) => {
      const action = mixer.clipAction(clip)
      actions.set(clip.name, action)
    })
    
    player.set(AnimationState, {
      mixer,
      actions,
      current: null
    })
    
    // Play idle animation
    actions.get('idle')?.play()
    
    return () => {
      mixer.stopAllAction()
    }
  }, [player, scene, animations])
  
  if (!player) return null
  
  return (
    <RigidBody
      ref={(body) => {
        if (body && player) {
          player.set(RigidBodyRef, { body })
        }
      }}
      type="dynamic"
      colliders="capsule"
      lockRotations
      mass={1}
    >
      <primitive object={scene} scale={0.5} />
    </RigidBody>
  )
}
```

> ⚠️ **Real-World Caveats:**
> - Model may not have `idle` animation (check names: `animations.map(a => a.name)`)
> - Capsule collider assumes upright character (use `ball` for rolling characters)
> - `lockRotations` prevents tipping over but may need tuning for slopes
> - `useGLTF` caches by default—clear cache if model updated during dev
> - Test with missing model file to ensure fallback mesh renders

### Pattern 2: Enemy AI

**Pattern Type:** 🔧 **Recommended Pattern**

```typescript
// src/traits/ai.ts
export const AIState = trait({
  state: 'idle' as 'idle' | 'chase' | 'attack',
  targetEntity: null as Entity | null,
  attackRange: 2,
  chaseRange: 10,
  attackCooldown: 1,
  timeSinceAttack: 0
})

// src/systems/ai.ts
export function enemyAISystem(world: World) {
  const time = world.get(Time)
  const player = world.query(IsPlayer, Transform).first
  if (!time || !player) return
  
  const playerTransform = player.get(Transform)
  
  world.query(IsEnemy, Transform, AIState, Not(IsDead)).updateEach(([transform, ai]) => {
    const distance = transform.position.distanceTo(playerTransform.position)
    
    // State machine
    switch (ai.state) {
      case 'idle':
        if (distance < ai.chaseRange) {
          ai.state = 'chase'
          ai.targetEntity = player
        }
        break
        
      case 'chase':
        if (distance > ai.chaseRange) {
          ai.state = 'idle'
          ai.targetEntity = null
        } else if (distance < ai.attackRange) {
          ai.state = 'attack'
        } else {
          // Move towards player
          const direction = new THREE.Vector3()
            .subVectors(playerTransform.position, transform.position)
            .normalize()
          
          const velocity = ai.targetEntity.get(Velocity)
          if (velocity) {
            velocity.x = direction.x * 2
            velocity.z = direction.z * 2
          }
        }
        break
        
      case 'attack':
        if (distance > ai.attackRange) {
          ai.state = 'chase'
        } else {
          // Attack logic
          ai.timeSinceAttack += time.delta
          if (ai.timeSinceAttack >= ai.attackCooldown) {
            // Deal damage to player
            const playerHealth = player.get(Health)
            if (playerHealth) {
              playerHealth.amount -= 10
            }
            ai.timeSinceAttack = 0
          }
        }
        break
    }
  })
}
```

### Pattern 3: Weapon System

```typescript
// src/traits/weapon.ts
export const Weapon = trait({
  type: 'pistol' as 'pistol' | 'shotgun' | 'rifle',
  damage: 25,
  fireRate: 0.5, // seconds between shots
  timeSinceLastShot: 0,
  ammo: 30,
  maxAmmo: 30
})

// src/systems/weapon.ts
export function weaponSystem(world: World) {
  const time = world.get(Time)
  const input = world.get(Input)
  if (!time || !input) return
  
  const player = world.query(IsPlayer, Transform, Weapon).first
  if (!player) return
  
  const [transform, weapon] = player.get(Transform, Weapon)
  
  weapon.timeSinceLastShot += time.delta
  
  if (input.shoot && weapon.timeSinceLastShot >= weapon.fireRate && weapon.ammo > 0) {
    // Fire weapon
    const direction = new THREE.Vector3(0, 0, -1)
    // Apply camera rotation here for proper aiming
    
    if (weapon.type === 'shotgun') {
      // Spread pattern
      for (let i = 0; i < 5; i++) {
        const spread = new THREE.Vector3(
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
          -1
        ).normalize()
        actions.spawnBullet(transform.position.clone(), spread)
      }
    } else {
      actions.spawnBullet(transform.position.clone(), direction)
    }
    
    weapon.ammo--
    weapon.timeSinceLastShot = 0
  }
}
```

### Pattern 4: Collectible Items

```typescript
// src/traits/collectible.ts
export const Collectible = trait({
  type: 'health' as 'health' | 'ammo' | 'coin',
  value: 25,
  rotationSpeed: 2
})

// src/systems/collectible.ts
export function collectibleSystem(world: World) {
  const time = world.get(Time)
  const player = world.query(IsPlayer, Transform).first
  if (!time || !player) return
  
  const playerTransform = player.get(Transform)
  
  world.query(IsCollectible, Transform, Collectible).updateEach(([transform, collectible]) => {
    // Rotate collectible
    transform.rotation.y += collectible.rotationSpeed * time.delta
    
    // Check if player is close
    const distance = transform.position.distanceTo(playerTransform.position)
    if (distance < 1.5) {
      // Collect item
      switch (collectible.type) {
        case 'health':
          const health = player.get(Health)
          if (health) {
            health.amount = Math.min(health.amount + collectible.value, health.max)
          }
          break
        case 'ammo':
          const weapon = player.get(Weapon)
          if (weapon) {
            weapon.ammo = Math.min(weapon.ammo + collectible.value, weapon.maxAmmo)
          }
          break
        case 'coin':
          const score = player.get(Score)
          if (score) {
            score.value += collectible.value
          }
          break
      }
      
      // Destroy collectible
      const entity = world.query(Transform).find(e => e.get(Transform) === transform)
      if (entity) entity.destroy()
    }
  })
}
```

### Pattern 5: Particle Effects

```typescript
// src/components/ParticleExplosion.tsx
import { useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface ParticleExplosionProps {
  position: THREE.Vector3
  onComplete: () => void
}

export function ParticleExplosion({ position, onComplete }: ParticleExplosionProps) {
  const groupRef = useRef<THREE.Group>(null)
  const particles = useRef<Array<{
    mesh: THREE.Mesh
    velocity: THREE.Vector3
    life: number
  }>>([])
  
  useEffect(() => {
    if (!groupRef.current) return
    
    // Create particles
    const geometry = new THREE.SphereGeometry(0.1)
    const material = new THREE.MeshBasicMaterial({ color: 'orange' })
    
    for (let i = 0; i < 20; i++) {
      const mesh = new THREE.Mesh(geometry, material)
      mesh.position.copy(position)
      groupRef.current.add(mesh)
      
      particles.current.push({
        mesh,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 5,
          Math.random() * 5,
          (Math.random() - 0.5) * 5
        ),
        life: 1
      })
    }
    
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [position])
  
  useFrame((state, delta) => {
    let allDead = true
    
    particles.current.forEach((particle) => {
      if (particle.life > 0) {
        allDead = false
        
        // Update position
        particle.mesh.position.add(
          particle.velocity.clone().multiplyScalar(delta)
        )
        
        // Apply gravity
        particle.velocity.y -= 9.81 * delta
        
        // Fade out
        particle.life -= delta
        particle.mesh.material.opacity = particle.life
      }
    })
    
    if (allDead) {
      onComplete()
    }
  })
  
  return <group ref={groupRef} />
}
```

### Pattern 6: UI Overlay (HUD)

```typescript
// src/components/HUD.tsx
import { useWorld } from 'koota/react'
import { IsPlayer, Health, Weapon, Score } from '../traits'
import { useFrame } from '@react-three/fiber'
import { useState } from 'react'

export function HUD() {
  const world = useWorld()
  const [health, setHealth] = useState(100)
  const [ammo, setAmmo] = useState(30)
  const [score, setScore] = useState(0)
  
  useFrame(() => {
    const player = world.query(IsPlayer).first
    if (!player) return
    
    const playerHealth = player.get(Health)
    const playerWeapon = player.get(Weapon)
    const playerScore = player.get(Score)
    
    if (playerHealth) setHealth(playerHealth.amount)
    if (playerWeapon) setAmmo(playerWeapon.ammo)
    if (playerScore) setScore(playerScore.value)
  })
  
  return (
    <div className="fixed inset-0 pointer-events-none">
      {/* Health bar */}
      <div className="absolute bottom-8 left-8 w-64">
        <div className="text-white mb-2">Health: {health}</div>
        <div className="w-full h-4 bg-gray-800 rounded">
          <div 
            className="h-full bg-red-500 rounded transition-all"
            style={{ width: `${health}%` }}
          />
        </div>
      </div>
      
      {/* Ammo counter */}
      <div className="absolute bottom-8 right-8 text-white text-2xl">
        <div>Ammo: {ammo}</div>
      </div>
      
      {/* Score */}
      <div className="absolute top-8 right-8 text-white text-3xl font-bold">
        Score: {score}
      </div>
    </div>
  )
}
```

### Pattern 7: State Management Integration

```typescript
// src/store/gameStore.ts
import { create } from 'zustand'

interface GameState {
  gameState: 'menu' | 'playing' | 'paused' | 'gameover'
  highScore: number
  level: number
  
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  gameOver: (score: number) => void
  nextLevel: () => void
}

export const useGameStore = create<GameState>((set) => ({
  gameState: 'menu',
  highScore: 0,
  level: 1,
  
  startGame: () => set({ gameState: 'playing', level: 1 }),
  pauseGame: () => set({ gameState: 'paused' }),
  resumeGame: () => set({ gameState: 'playing' }),
  
  gameOver: (score) => set((state) => ({
    gameState: 'gameover',
    highScore: Math.max(state.highScore, score)
  })),
  
  nextLevel: () => set((state) => ({
    level: state.level + 1
  }))
}))

// Use in system
export function gameStateSystem(world: World) {
  const gameState = useGameStore.getState().gameState
  
  if (gameState !== 'playing') {
    return // Don't update game logic when paused
  }
  
  // Check for game over condition
  const player = world.query(IsPlayer, Health).first
  if (player) {
    const health = player.get(Health)
    if (health.amount <= 0) {
      const score = player.get(Score)
      useGameStore.getState().gameOver(score?.value || 0)
    }
  }
}
```

### Pattern 8: Save/Load System

```typescript
// src/systems/save-load.ts
interface SaveData {
  playerPosition: [number, number, number]
  playerHealth: number
  score: number
  level: number
}

export function saveGame(world: World) {
  const player = world.query(IsPlayer).first
  if (!player) return
  
  const transform = player.get(Transform)
  const health = player.get(Health)
  const score = player.get(Score)
  const level = useGameStore.getState().level
  
  const saveData: SaveData = {
    playerPosition: transform.position.toArray() as [number, number, number],
    playerHealth: health.amount,
    score: score.value,
    level
  }
  
  localStorage.setItem('game_save', JSON.stringify(saveData))
}

export function loadGame(world: World) {
  const saveStr = localStorage.getItem('game_save')
  if (!saveStr) return false
  
  try {
    const saveData: SaveData = JSON.parse(saveStr)
    
    // Spawn player at saved position
    const player = actions.spawnPlayer(
      new THREE.Vector3(...saveData.playerPosition)
    )
    
    // Restore health
    player.set(Health, { amount: saveData.playerHealth, max: 100 })
    
    // Restore score
    player.set(Score, { value: saveData.score })
    
    // Restore level
    useGameStore.setState({ level: saveData.level })
    
    return true
  } catch (e) {
    console.error('Failed to load save:', e)
    return false
  }
}
```

### Pattern 9: Spatial Audio

```typescript
// src/components/AudioManager.tsx
import { PositionalAudio } from '@react-three/drei'
import { useRef, useEffect } from 'react'
import { useWorld } from 'koota/react'
import { Transform, AudioEmitter } from '../traits'

export function AudioManager() {
  const world = useWorld()
  
  return (
    <>
      {world.query(AudioEmitter, Transform).map((entity, i) => {
        const transform = entity.get(Transform)
        const audio = entity.get(AudioEmitter)
        
        return (
          <group key={i} position={transform.position.toArray()}>
            <PositionalAudio
              url={audio.soundPath}
              distance={audio.maxDistance}
              loop={audio.loop}
              autoplay
            />
          </group>
        )
      })}
    </>
  )
}
```

### Pattern 10: Procedural World Generation

```typescript
// src/systems/world-generator.ts
import * as THREE from 'three'

export class WorldGenerator {
  private seed: number
  private tileSize = 50
  private activeTiles = new Map<string, Entity>()
  
  constructor(seed: number) {
    this.seed = seed
  }
  
  update(playerPosition: THREE.Vector3, world: World) {
    const playerTileX = Math.floor(playerPosition.x / this.tileSize)
    const playerTileZ = Math.floor(playerPosition.z / this.tileSize)
    
    // Load tiles in 3x3 grid around player
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const tileX = playerTileX + x
        const tileZ = playerTileZ + z
        const tileKey = `${tileX},${tileZ}`
        
        if (!this.activeTiles.has(tileKey)) {
          this.generateTile(tileX, tileZ, world)
        }
      }
    }
    
    // Unload distant tiles
    this.activeTiles.forEach((entity, key) => {
      const [tileX, tileZ] = key.split(',').map(Number)
      if (Math.abs(tileX - playerTileX) > 1 || Math.abs(tileZ - playerTileZ) > 1) {
        entity.destroy()
        this.activeTiles.delete(key)
      }
    })
  }
  
  private generateTile(tileX: number, tileZ: number, world: World) {
    const tileKey = `${tileX},${tileZ}`
    
    // Seeded random
    const random = this.seededRandom(tileX, tileZ)
    
    // Generate terrain
    const basePosition = new THREE.Vector3(
      tileX * this.tileSize,
      0,
      tileZ * this.tileSize
    )
    
    // Spawn props based on tile type
    const tileType = random() > 0.5 ? 'forest' : 'plain'
    
    if (tileType === 'forest') {
      // Spawn trees
      for (let i = 0; i < 5; i++) {
        const offset = new THREE.Vector3(
          random() * this.tileSize,
          0,
          random() * this.tileSize
        )
        
        // Spawn tree entity
        // actions.spawnTree(basePosition.clone().add(offset))
      }
    }
    
    // Spawn enemies
    if (random() > 0.7) {
      const offset = new THREE.Vector3(
        random() * this.tileSize,
        0,
        random() * this.tileSize
      )
      actions.spawnEnemy(basePosition.clone().add(offset))
    }
  }
  
  private seededRandom(x: number, z: number) {
    let seed = this.seed + x * 73856093 ^ z * 19349663
    return () => {
      seed = (seed * 9301 + 49297) % 233280
      return seed / 233280
    }
  }
}
```

---

## Complete Code Examples

### Example 1: Top-Down Shooter (Complete Game)

**Game Concept:** Player controls a character, shoots enemies, collects power-ups, survive waves.

```typescript
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from './app'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// src/app.tsx
import { Canvas } from '@react-three/fiber'
import { WorldProvider } from 'koota/react'
import { world } from './world'
import { GameLoop } from './frameloop'
import { Startup } from './startup'
import { Player } from './components/Player'
import { Enemies } from './components/Enemies'
import { Bullets } from './components/Bullets'
import { Collectibles } from './components/Collectibles'
import { HUD } from './components/HUD'
import { MainMenu } from './components/MainMenu'
import { useGameStore } from './store/gameStore'

export function App() {
  const gameState = useGameStore((s) => s.gameState)
  
  if (gameState === 'menu') {
    return <MainMenu />
  }
  
  return (
    <WorldProvider world={world}>
      <Canvas shadows camera={{ position: [0, 20, 20], fov: 50 }}>
        <Startup />
        <GameLoop />
        
        <color attach="background" args={['#1a1a2e']} />
        <fog attach="fog" args={['#1a1a2e', 10, 50]} />
        
        <ambientLight intensity={0.3} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        {/* Ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#16213e" />
        </mesh>
        
        <Player />
        <Enemies />
        <Bullets />
        <Collectibles />
      </Canvas>
      
      <HUD />
    </WorldProvider>
  )
}

// src/frameloop.ts
import { useFrame } from '@react-three/fiber'
import { useWorld } from 'koota/react'
import { updateTime } from './systems/update-time'
import { inputSystem } from './systems/input'
import { playerControllerSystem } from './systems/player-controller'
import { movementSystem } from './systems/movement'
import { combatSystem } from './systems/combat'
import { enemyAISystem } from './systems/ai'
import { spawnerSystem } from './systems/spawner'
import { collectibleSystem } from './systems/collectible'
import { weaponSystem } from './systems/weapon'
import { cleanupSystem } from './systems/cleanup'
import { gameStateSystem } from './systems/game-state'

export function GameLoop() {
  const world = useWorld()
  
  useFrame((state, delta) => {
    updateTime(world, delta)
    gameStateSystem(world)
    inputSystem(world)
    playerControllerSystem(world)
    weaponSystem(world)
    movementSystem(world)
    enemyAISystem(world)
    combatSystem(world)
    collectibleSystem(world)
    spawnerSystem(world)
    cleanupSystem(world)
  })
  
  return null
}

// src/startup.tsx
import { useEffect } from 'react'
import { useWorld, useActions } from 'koota/react'
import { actions } from './actions'
import * as THREE from 'three'
import { setupInputListeners } from './systems/input'

export function Startup() {
  const world = useWorld()
  const { spawnPlayer } = useActions(actions)
  
  useEffect(() => {
    setupInputListeners()
    
    // Spawn player
    const player = spawnPlayer(new THREE.Vector3(0, 0, 0))
    
    // Setup camera to follow player
    // ... camera setup code
    
    console.log('Game initialized')
  }, [])
  
  return null
}
```

### Example 2: First-Person Shooter

```typescript
// Key differences for FPS:

// 1. First-person camera
export function FirstPersonCamera() {
  const world = useWorld()
  const { camera } = useThree()
  
  useFrame(() => {
    const player = world.query(IsPlayer, Transform).first
    if (!player) return
    
    const transform = player.get(Transform)
    
    // Camera at player's eye level
    camera.position.copy(transform.position)
    camera.position.y += 1.6 // Eye height
    
    // Apply mouse rotation to camera
    const input = world.get(Input)
    if (input) {
      camera.rotation.y = input.mouseX
      camera.rotation.x = input.mouseY
    }
  })
  
  return null
}

// 2. Pointer lock controls
export function setupPointerLock() {
  const canvas = document.querySelector('canvas')
  
  canvas?.addEventListener('click', () => {
    canvas.requestPointerLock()
  })
  
  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
      const input = world.get(Input)
      if (input) {
        input.mouseX -= e.movementX * 0.002
        input.mouseY -= e.movementY * 0.002
        input.mouseY = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, input.mouseY))
      }
    }
  })
}
```

### Example 3: Racing Game

```typescript
// src/traits/vehicle.ts
export const Vehicle = trait({
  speed: 0,
  maxSpeed: 50,
  acceleration: 10,
  turnSpeed: 2,
  drifting: false
})

// src/systems/vehicle.ts
export function vehicleSystem(world: World) {
  const time = world.get(Time)
  const input = world.get(Input)
  if (!time || !input) return
  
  world.query(IsPlayer, Transform, Vehicle).updateEach(([transform, vehicle]) => {
    // Acceleration
    if (input.forward) {
      vehicle.speed = Math.min(
        vehicle.speed + vehicle.acceleration * time.delta,
        vehicle.maxSpeed
      )
    } else if (input.backward) {
      vehicle.speed = Math.max(
        vehicle.speed - vehicle.acceleration * time.delta * 0.5,
        -vehicle.maxSpeed * 0.5
      )
    } else {
      // Friction
      vehicle.speed *= 0.98
    }
    
    // Turning
    if (vehicle.speed !== 0) {
      if (input.left) {
        transform.rotation.y += vehicle.turnSpeed * time.delta * Math.sign(vehicle.speed)
      }
      if (input.right) {
        transform.rotation.y -= vehicle.turnSpeed * time.delta * Math.sign(vehicle.speed)
      }
    }
    
    // Move forward in facing direction
    const direction = new THREE.Vector3(0, 0, -1)
    direction.applyEuler(new THREE.Euler(0, transform.rotation.y, 0))
    
    transform.position.addScaledVector(direction, vehicle.speed * time.delta)
  })
}
```

---

## Performance & Optimization

> **Note:** This section covers game-specific optimizations. For comprehensive performance guidance including texture compression, LOD systems, and profiling tools, see: **[MASTER_THREEJS_BEST_PRACTICES.md](./MASTER_THREEJS_BEST_PRACTICES.md)** > "Performance Optimization"

### 1. Spatial Hashing for Collision Detection

**Pattern Type:** ⭐ **Canonical Standard** (critical for 100+ entities)

**Problem:** Checking every entity against every other entity is O(n²).

**Solution:** Spatial hash grid divides world into cells.

```typescript
// src/utils/spatial-hash.ts
export class SpatialHash {
  private cellSize: number
  private grid: Map<string, Set<number>>
  
  constructor(cellSize: number = 10) {
    this.cellSize = cellSize
    this.grid = new Map()
  }
  
  clear() {
    this.grid.clear()
  }
  
  insert(id: number, position: THREE.Vector3) {
    const key = this.getKey(position)
    if (!this.grid.has(key)) {
      this.grid.set(key, new Set())
    }
    this.grid.get(key)!.add(id)
  }
  
  query(position: THREE.Vector3, radius: number): number[] {
    const results: Set<number> = new Set()
    const cellRadius = Math.ceil(radius / this.cellSize)
    
    const centerCell = this.getCellCoords(position)
    
    for (let x = -cellRadius; x <= cellRadius; x++) {
      for (let z = -cellRadius; z <= cellRadius; z++) {
        const key = `${centerCell.x + x},${centerCell.z + z}`
        const cell = this.grid.get(key)
        if (cell) {
          cell.forEach(id => results.add(id))
        }
      }
    }
    
    return Array.from(results)
  }
  
  private getCellCoords(position: THREE.Vector3) {
    return {
      x: Math.floor(position.x / this.cellSize),
      z: Math.floor(position.z / this.cellSize)
    }
  }
  
  private getKey(position: THREE.Vector3): string {
    const coords = this.getCellCoords(position)
    return `${coords.x},${coords.z}`
  }
}

// Usage in combat system
export function combatSystem(world: World) {
  const spatialHash = world.get(SpatialHashMap)
  if (!spatialHash) return
  
  spatialHash.clear()
  
  // Insert all entities
  world.query(Transform).forEach((entity) => {
    const transform = entity.get(Transform)
    spatialHash.insert(entity.id(), transform.position)
  })
  
  // Check collisions only with nearby entities
  world.query(IsBullet, Transform).forEach((bullet) => {
    const bulletTransform = bullet.get(Transform)
    const nearby = spatialHash.query(bulletTransform.position, 5)
    
    nearby.forEach((id) => {
      const entity = world.entity(id)
      if (entity.has(IsEnemy)) {
        // Check collision
      }
    })
  })
}
```

### 2. Object Pooling

**Pattern Type:** 🔧 **Recommended Pattern** (for frequently spawned entities like bullets, particles)

```typescript
// src/utils/object-pool.ts
export class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  
  constructor(factory: () => T, reset: (obj: T) => void, initialSize = 10) {
    this.factory = factory
    this.reset = reset
    
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory())
    }
  }
  
  get(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }
  
  release(obj: T) {
    this.reset(obj)
    this.pool.push(obj)
  }
}

// Usage for bullets
const bulletPool = new ObjectPool(
  () => world.spawn(IsBullet(), Transform(), Velocity()),
  (entity) => {
    entity.set(Transform, { position: new THREE.Vector3() })
    entity.set(Velocity, { x: 0, y: 0, z: 0 })
  },
  50
)

// In weapon system
const bullet = bulletPool.get()
bullet.set(Transform, { position: playerPos.clone() })
bullet.set(Velocity, { x: dir.x * 20, y: dir.y * 20, z: dir.z * 20 })
```

### 3. Instanced Rendering

**Pattern Type:** ⭐ **Canonical Standard** (for 50+ identical objects)

```typescript
// src/components/Bullets.tsx
import { Instances, Instance } from '@react-three/drei'
import { useWorld } from 'koota/react'
import { IsBullet, Transform } from '../traits'
import { useFrame } from '@react-three/fiber'
import { useState } from 'react'

export function Bullets() {
  const world = useWorld()
  const [bullets, setBullets] = useState<Entity[]>([])
  
  useFrame(() => {
    setBullets([...world.query(IsBullet)])
  })
  
  return (
    <Instances limit={1000}>
      <sphereGeometry args={[0.1, 8, 8]} />
      <meshStandardMaterial color="yellow" emissive="yellow" emissiveIntensity={2} />
      
      {bullets.map((entity, i) => {
        const transform = entity.get(Transform)
        return (
          <Instance 
            key={i} 
            position={[transform.position.x, transform.position.y, transform.position.z]}
          />
        )
      })}
    </Instances>
  )
}
```

### 4. LOD (Level of Detail)

```typescript
import { Detailed } from '@react-three/drei'

export function Enemy({ entity }: { entity: Entity }) {
  return (
    <Detailed distances={[0, 10, 20]}>
      {/* High detail (< 10 units) */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial />
      </mesh>
      
      {/* Medium detail (10-20 units) */}
      <mesh>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial />
      </mesh>
      
      {/* Low detail (> 20 units) */}
      <mesh>
        <sphereGeometry args={[1, 8, 8]} />
        <meshStandardMaterial />
      </mesh>
    </Detailed>
  )
}
```

### 5. Texture Compression

```bash
# Install tools
npm install -D @gltf-transform/cli

# Compress models
npx gltf-transform optimize input.glb output.glb \
  --compress draco \
  --texture-compress webp
```

### Performance Checklist

- ✅ Use spatial hashing for collision detection (not O(n²) checks)
- ✅ Implement object pooling for frequently spawned entities
- ✅ Use instanced rendering for identical objects (>50 count)
- ✅ Enable LOD for distant objects
- ✅ Compress textures (WebP, KTX2)
- ✅ Compress models (Draco)
- ✅ Limit shadow-casting lights to 1-2
- ✅ Use lower poly models for enemies/props
- ✅ Frustum culling (automatic in Three.js)
- ✅ Batch static geometry
- ✅ Profile with Chrome DevTools
- ✅ Target 60 FPS on desktop, 30 FPS on mobile
- ✅ Keep draw calls < 100 (check with Stats)
- ✅ Keep triangle count < 500k visible
- ✅ Dispose unused resources

---

## Production Checklist

### Before Launch

#### Code Quality
- [ ] All TypeScript errors fixed
- [ ] ESLint warnings addressed
- [ ] Console.log statements removed
- [ ] Error boundaries implemented
- [ ] Loading states for assets
- [ ] Fallback meshes for failed loads

#### Performance
- [ ] Tested on target hardware
- [ ] 60 FPS on desktop maintained
- [ ] 30+ FPS on mobile maintained
- [ ] Memory usage < 500MB
- [ ] Build size < 5MB (excluding assets)
- [ ] Assets compressed (Draco, WebP)
- [ ] Lazy loading for non-critical assets

#### User Experience
- [ ] Mobile controls implemented
- [ ] Touch controls tested
- [ ] Keyboard controls documented
- [ ] Gamepad support (if applicable)
- [ ] Audio settings (mute/volume)
- [ ] Graphics settings (quality presets)
- [ ] Save/load functionality
- [ ] Tutorial/instructions
- [ ] Pause menu

#### Polish
- [ ] Sound effects
- [ ] Background music
- [ ] Particle effects
- [ ] UI transitions
- [ ] Game over screen
- [ ] Victory screen
- [ ] High score tracking
- [ ] Analytics integration

#### Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari
- [ ] Tested on iOS
- [ ] Tested on Android
- [ ] Tested on tablet
- [ ] Different screen sizes tested
- [ ] WebGL context loss handled

#### Deployment
- [ ] Environment variables configured
- [ ] Build process tested
- [ ] Production build optimized
- [ ] CDN configured for assets
- [ ] Caching headers set
- [ ] Analytics configured
- [ ] Error tracking (Sentry)
- [ ] README updated

### Build Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three': ['three'],
          'react': ['react', 'react-dom'],
          'r3f': ['@react-three/fiber', '@react-three/drei']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  
  server: {
    port: 5173,
    host: true // Allow network access
  }
})
```

### Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy to Vercel
npm i -g vercel
vercel

# Deploy to Netlify
npm i -g netlify-cli
netlify deploy --prod

# Deploy to GitHub Pages
npm run build
npx gh-pages -d dist
```

---

## Troubleshooting

> **Note:** This section covers the 10 most common game-specific issues. For additional troubleshooting including SSR errors, canvas portaling issues, and framework-specific problems, see: **[MASTER_THREEJS_BEST_PRACTICES.md](./MASTER_THREEJS_BEST_PRACTICES.md)** > "Gotchas & Solutions"

### Common Issues & Solutions

#### 1. "Module not found: three/examples/jsm"

**Problem:** Using old import path

**Solution:**
```typescript
// ❌ Old
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

// ✅ New (r160+)
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
```

#### 2. Game Runs at 10 FPS

**Diagnosis Steps:**
1. Open Chrome DevTools > Performance
2. Record 5 seconds of gameplay
3. Look for red bars (long frames)

**Common Causes:**
- Too many entities (>1000)
- No spatial hashing (O(n²) collision checks)
- No instancing for repeated objects
- Too many lights (>3)
- Too many draw calls (>500)

**Solutions:**
- Implement spatial hashing
- Use instanced rendering
- Reduce polygon count
- Batch static geometry

#### 3. Physics Objects Fall Through Floor

**Problem:** Physics update too slow or collider mismatch

**Solution:**
```tsx
// Ensure ground has collider
<RigidBody type="fixed" colliders="cuboid">
  <mesh>
    <boxGeometry args={[100, 1, 100]} />
    <meshStandardMaterial />
  </mesh>
</RigidBody>

// Ensure player has correct collider
<RigidBody type="dynamic" colliders="capsule">
  <Player />
</RigidBody>

// Set physics timestep
<Physics gravity={[0, -9.81, 0]} timeStep={1/60}>
```

#### 4. Animations Not Playing

**Checklist:**
```typescript
// 1. Check animations exist
const { scene, animations } = useGLTF('/model.glb')
console.log('Animations:', animations) // Should have length > 0

// 2. Create mixer
const mixer = new THREE.AnimationMixer(scene)

// 3. Create and play action
const action = mixer.clipAction(animations[0])
action.play()

// 4. Update mixer in game loop
useFrame((state, delta) => {
  mixer.update(delta) // ← Don't forget this!
})
```

#### 5. Memory Leak

**Symptoms:** Game slows down over time, memory usage increases

**Common Causes:**
- Not disposing geometries/materials
- Not cleaning up event listeners
- Not destroying entities

**Solution:**
```typescript
// Dispose in useEffect cleanup
useEffect(() => {
  const geometry = new THREE.BoxGeometry()
  const material = new THREE.MeshStandardMaterial()
  
  return () => {
    geometry.dispose()
    material.dispose()
  }
}, [])

// Use useGLTF for automatic disposal
const { scene } = useGLTF('/model.glb') // Auto-disposed

// Destroy entities
entity.destroy()
```

#### 6. TypeScript Errors with ECS

**Problem:** Type inference issues

**Solution:**
```typescript
// ✅ Always check if trait exists
const health = entity.get(Health)
if (health) {
  health.amount -= 10 // OK
}

// ✅ Or use non-null assertion if you're sure
const health = entity.get(Health)!
health.amount -= 10

// ✅ Type actions properly
export const actions = createActions((world: World) => ({
  spawnEnemy: (pos: THREE.Vector3): Entity => {
    return world.spawn(IsEnemy(), Transform({ position: pos }))
  }
}))
```

#### 7. Input Not Working

**Checklist:**
1. Input listeners set up in startup
2. Input trait added to world
3. Input system running in game loop
4. Canvas has focus (click canvas first)

```typescript
// Debug input
console.log('Keys pressed:', keysPressed)
console.log('Input trait:', world.get(Input))
```

#### 8. Black Screen (Nothing Renders)

**Checklist:**
1. Check browser console for errors
2. Verify Camera is in scene
3. Verify lights exist
4. Check if assets failed to load
5. Verify Canvas is rendered

```typescript
// Minimal working scene
<Canvas>
  <ambientLight />
  <mesh>
    <boxGeometry />
    <meshStandardMaterial />
  </mesh>
</Canvas>
```

#### 9. Models Not Loading

**Diagnosis:**
```typescript
// Add error handling
const { scene } = useGLTF('/models/character.glb', undefined, (error) => {
  console.error('Failed to load model:', error)
})

// Check network tab for 404
// Check file path is correct
// Check model is valid GLB/GLTF
```

**Common Issues:**
- Wrong file path (case-sensitive!)
- Model not in `/public` directory
- CORS issues (use local dev server)
- Corrupted model file

#### 10. Build Works Locally But Not in Production

**Common Causes:**
- Environment variables not set
- Assets not copied to build directory
- BASE_URL not configured
- HTTPS required for some features

**Solution:**
```typescript
// vite.config.ts
export default defineConfig({
  base: './', // For relative paths
  
  publicDir: 'public', // Ensure assets are copied
  
  build: {
    assetsDir: 'assets'
  }
})

// Use environment variables
const API_URL = import.meta.env.VITE_API_URL
```

---

## Advanced Topics

### Multiplayer (Networked Games)

For multiplayer, you'll need a backend. Here's the pattern:

```typescript
// Use a library like Colyseus or Socket.io
import { Room, Client } from 'colyseus.js'

// Client-side prediction + server reconciliation
export function multiplayerSystem(world: World) {
  const player = world.query(IsPlayer).first
  if (!player) return
  
  // Send input to server (not position)
  const input = world.get(Input)
  room.send('input', {
    forward: input.forward,
    left: input.left,
    // ...
  })
  
  // Receive other players' positions
  room.onMessage('players', (players) => {
    players.forEach((playerData) => {
      // Update or spawn network player
    })
  })
}
```

### VR/XR Support

```typescript
import { VRButton, ARButton, XR, Controllers, Hands } from '@react-three/xr'

export function VRGame() {
  return (
    <>
      <VRButton />
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <GameScene />
        </XR>
      </Canvas>
    </>
  )
}
```

### Mobile Optimization

```typescript
// Detect mobile
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

// Adjust quality
<Canvas
  gl={{
    antialias: !isMobile,
    powerPreference: isMobile ? 'low-power' : 'high-performance',
    pixelRatio: isMobile ? 1 : Math.min(window.devicePixelRatio, 2)
  }}
  shadows={!isMobile}
>
```

### AI-Assisted Development Integration

**Pattern Type:** ⭐ **Canonical Standard** (highly recommended for team velocity)

This architecture is designed for AI-assisted development. Following these patterns dramatically improves code generation quality.

#### Quick Setup for AI Tools

**Cursor AI (Pre-configured in viber3d):**
```bash
# .cursor/rules/ directory included in starter
# Rules automatically loaded by Cursor
# Covers: traits, systems, components, viber3d architecture
```

**GitHub Copilot:**
Create `.github/copilot-instructions.md`:
```markdown
# Project: Three.js Game (ECS Architecture)

- Use Koota ECS: traits (data), systems (logic), components (rendering)
- React Three Fiber for 3D rendering
- TypeScript required
- Import GLTFLoader from 'three/addons/loaders/GLTFLoader.js'
- Always dispose geometries/materials in cleanup
- Use delta time in animations (not frame-dependent)
- Physics: React Three Rapier with RigidBody components
- State: Zustand for UI, ECS for game entities
```

**Windsurf:**
Create `.windsurfrules`:
```markdown
# Three.js + ECS Game Architecture

Stack: Three.js r173, R3F 8.17, Koota ECS, TypeScript

## Patterns
- Define traits first (data only)
- Systems process entities (logic)
- Components render (read ECS data)
- Actions spawn/modify entities
- Use delta time for animations
- Dispose resources in useEffect cleanup

## Avoid
- Game logic in React state
- Direct trait mutation in components
- Frame-dependent animations
```

**Cline:**
Custom Instructions:
```
When working with this codebase:
1. Follow ECS: traits → systems → actions → components
2. Use TypeScript with proper types
3. Import GLTFLoader from three/addons (not examples/jsm)
4. Include disposal in cleanup functions
5. Use delta time for movement/animations
6. Check trait existence before access
7. Store RigidBody refs in ECS for physics
8. Reference existing patterns before creating new ones
```

#### AI Prompt Templates

**Create New Entity Type:**
```
Create a [EntityName] entity with:
- Traits: [list data fields]
- Systems: [list behaviors]
- Spawn action in actions.ts
- Rendering component
- Follow existing patterns in src/traits and src/systems
```

**Add System:**
```
Add a [systemName] system that:
- Queries entities with [trait list]
- Updates [what changes]
- Runs [when in game loop]
- Follows pattern from src/systems/movement.ts
```

**Debug Issue:**
```
Debug this issue: [describe problem]
Current code: [paste code]
Expected: [what should happen]
Actual: [what's happening]

Check:
- Trait existence
- System order in frameloop
- Delta time usage
- Disposal in cleanup
```

#### Best Practices for AI Pair Programming

1. **Be Specific:** "Add damage system following viber3d ECS patterns" not "Add damage"
2. **Reference Examples:** "Like the movement system but for combat"
3. **Include Context:** Mention if it's a new feature or refactoring existing code
4. **Request Tests:** "Include console logs to verify this works"
5. **Ask Why:** "Explain why you chose this pattern over alternatives"
6. **Iterate:** Start simple, add complexity incrementally

> ⚠️ **Real-World Caveat:**
> AI tools work best when you:
> - Have consistent patterns (this architecture provides them)
> - Use TypeScript (types guide generation)
> - Follow conventions (naming, structure)
> - Review generated code (AI can miss edge cases)
> - Test thoroughly (especially physics and animations)

For complete AI setup including prompts, tool configuration, and team workflows, see: **[MASTER_THREEJS_BEST_PRACTICES.md](./MASTER_THREEJS_BEST_PRACTICES.md)** > "AI Code Generation Rules"

---

## Resources & Next Steps

### Essential Links

- **Three.js Docs:** https://threejs.org/docs/
- **React Three Fiber:** https://docs.pmnd.rs/react-three-fiber
- **Drei Helpers:** https://github.com/pmndrs/drei
- **Koota ECS:** https://github.com/krispya/koota
- **Rapier Physics:** https://rapier.rs/
- **Zustand:** https://docs.pmnd.rs/zustand

### Learning Path

1. **Week 1:** Complete viber3d starter template, understand ECS
2. **Week 2:** Build basic top-down shooter (this guide)
3. **Week 3:** Add advanced features (AI, weapons, power-ups)
4. **Week 4:** Optimize performance, polish, deploy

### Community

- Discord: https://discord.gg/poimandres
- Reddit: r/threejs
- Twitter: @pmndrs

---

## Conclusion

You now have everything you need to build production-ready 3D games with Three.js:

✅ **Modern architecture** (ECS, React, TypeScript)  
✅ **Complete examples** (shooter, racer, etc.)  
✅ **Performance patterns** (spatial hashing, pooling, instancing)  
✅ **Production checklist** (deployment, optimization, polish)  
✅ **Troubleshooting guide** (common issues solved)

**Start building. Ship games. Have fun!** 🎮

---

*This guide combines knowledge from threejs-skills, react-three-next, and viber3d. For updates, visit the respective repositories.*

**Version:** 1.0  
**Last Updated:** January 2025
