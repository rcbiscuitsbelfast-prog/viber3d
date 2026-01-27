# Questly - Three.js Libraries Status

## ✅ **ALREADY INSTALLED & IN USE**

### 1. **three-mesh-bvh** ✅ INSTALLED & ACTIVE
- **Version**: `^0.6.0` (questly), `^0.8.0` (root)
- **Status**: ✅ **ACTIVELY USED** in `TestWorld.tsx`
- **Usage**: 
  ```typescript
  import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
  ```
- **Purpose**: BVH-accelerated raycasting for terrain (100× faster)
- **Location**: `templates/questly/src/pages/TestWorld.tsx:16`

### 2. **cannon-es** ✅ INSTALLED & IMPORTED
- **Version**: `^0.20.0`
- **Status**: ✅ **IMPORTED** but not fully utilized yet
- **Usage**: 
  ```typescript
  import * as CANNON from 'cannon-es';
  ```
- **Purpose**: Lightweight physics engine for character controllers, collisions
- **Location**: `templates/questly/src/pages/TestWorld.tsx:13`
- **Note**: Currently imported but physics world not initialized

---

## ✅ **AVAILABLE VIA DEPENDENCIES** (via @react-three/drei)

### 3. **troika-three-text** ✅ AVAILABLE
- **Version**: `^0.52.3` (via drei dependencies)
- **Status**: ✅ Available but not installed directly
- **Purpose**: Best text rendering for 3D labels, NPC names, quest markers
- **Action**: Can use via drei or install directly

### 4. **three-stdlib** ✅ AVAILABLE
- **Version**: `^2.35.14` (via drei dependencies)
- **Status**: ✅ Available but not installed directly
- **Purpose**: Tons of helpers (controls, loaders, materials, utilities)
- **Action**: Can use via drei or install directly

### 5. **glsl-noise** ✅ AVAILABLE
- **Version**: `0.0.0` (in lock file)
- **Status**: ✅ Available
- **Purpose**: Shader utilities for water, fog, clouds
- **Action**: Already available, can use in shaders

---

## ❌ **NOT INSTALLED** (Need to Add)

### 6. **simplex-noise** / **fast-simplex-noise** ❌ MISSING
- **Status**: ❌ Not installed
- **Purpose**: Procedural terrain generation (heightmaps, biomes, coastlines)
- **Priority**: 🔴 **HIGH** - Essential for procedural terrain
- **Action**: Install `simplex-noise` or `fast-simplex-noise`

### 7. **@react-three/rapier** ❌ MISSING
- **Status**: ❌ Not installed (mentioned in docs but not in questly)
- **Purpose**: Modern Rust-powered physics (alternative to Cannon-ES)
- **Priority**: 🟡 **MEDIUM** - Alternative to Cannon-ES
- **Action**: Install if want to switch from Cannon-ES

### 8. **three-pathfinding** ❌ MISSING
- **Status**: ❌ Not installed
- **Purpose**: Navmesh generation + AI pathfinding for NPCs
- **Priority**: 🟡 **MEDIUM** - For NPC movement
- **Action**: Install `three-pathfinding`

### 9. **three-instanced-mesh** / **instancing helpers** ❌ MISSING
- **Status**: ❌ Not installed
- **Purpose**: Efficient rendering of forests, rocks, grass (1 draw call for thousands)
- **Priority**: 🔴 **HIGH** - Critical for performance with many objects
- **Action**: Install or use Three.js built-in instancing

### 10. **three-quadtree** ❌ MISSING
- **Status**: ❌ Not installed
- **Purpose**: Spatial partitioning for fast collision checks
- **Priority**: 🟢 **LOW** - Nice to have, BVH might be enough
- **Action**: Install if needed for spatial queries

---

## 📊 **SUMMARY**

### ✅ **Ready to Use** (3)
1. ✅ three-mesh-bvh (ACTIVE)
2. ✅ cannon-es (IMPORTED, needs setup)
3. ✅ glsl-noise (AVAILABLE)

### ✅ **Available via Drei** (2)
4. ✅ troika-three-text
5. ✅ three-stdlib

### ❌ **Need to Install** (5)
6. ❌ simplex-noise (HIGH PRIORITY)
7. ❌ @react-three/rapier (OPTIONAL - alternative to Cannon)
8. ❌ three-pathfinding (MEDIUM PRIORITY)
9. ❌ three-instanced-mesh (HIGH PRIORITY)
10. ❌ three-quadtree (LOW PRIORITY)

---

## 🎯 **RECOMMENDED NEXT STEPS**

### **Phase 1: Must-Have Libraries**
```bash
cd templates/questly
pnpm add simplex-noise
pnpm add three-instanced-mesh  # or use Three.js built-in InstancedMesh
```

### **Phase 2: Enhanced Features**
```bash
pnpm add three-pathfinding  # For NPC AI
pnpm add troika-three-text  # For 3D labels (or use via drei)
```

### **Phase 3: Optional Upgrades**
```bash
pnpm add @react-three/rapier  # If want to switch from Cannon-ES
pnpm add three-quadtree  # If need spatial partitioning
```

---

## 🔧 **CURRENT USAGE IN CODEBASE**

### **TestWorld.tsx** (Current Implementation)
- ✅ Uses `three-mesh-bvh` for terrain raycasting
- ✅ Imports `cannon-es` but doesn't initialize physics world
- ❌ No procedural terrain generation (manual heightmap)
- ❌ No instancing for trees/rocks (individual meshes)
- ❌ No noise functions for terrain

### **What's Working**
- BVH-accelerated raycasting ✅
- Terrain collision detection ✅
- Character movement ✅

### **What's Missing**
- Procedural terrain generation ❌
- Instanced rendering for performance ❌
- Physics world initialization ❌
- Noise-based terrain ❌

---

## 📝 **NOTES**

1. **Cannon-ES**: Already imported but physics world not created. Can initialize when needed.

2. **three-mesh-bvh**: Already patched and working. This is the #1 performance upgrade.

3. **Instancing**: Three.js has built-in `InstancedMesh` - may not need separate library.

4. **Noise**: `simplex-noise` is essential for procedural terrain. Currently terrain is manual.

5. **Rapier vs Cannon**: Cannon-ES is already imported. Rapier is optional alternative.

---

**Last Updated**: Phase 3 Planning
**Status**: Ready to install missing libraries and enhance systems
