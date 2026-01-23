# MinimalDemo Animation Solution - How and Why It Works

**Date:** 2024-12-19  
**Status:** ✅ WORKING

## Problem

Character was stuck in T-pose, not animated, and camera didn't follow character movement.

## Root Cause

1. **Animations are NOT in character models** - They're in separate GLB files
2. **Model cloning must preserve skeleton binding** - Simple `clone()` doesn't rebind skeletons
3. **Camera follow logic** - Needed proper position tracking

## Solution

### 1. Proper GLTF Cloning with Skeleton Binding

**Why:** Character models use SkinnedMesh with bone animations. When cloning, the skeleton bones must be properly rebound to the cloned mesh, or animations won't work.

**How:** Use `cloneGltf()` function from `clear_the_dungeon`:

```typescript
function cloneGltf(gltf: GLTF): GLTF {
  // Clone scene
  const clone = {
    animations: gltf.animations,
    scene: gltf.scene.clone(true),
  } as GLTF;

  // Find all SkinnedMeshes in original
  const skinnedMeshes: Record<string, THREE.SkinnedMesh> = {};
  gltf.scene.traverse((node) => {
    if (node instanceof THREE.SkinnedMesh) skinnedMeshes[node.name] = node;
  });

  // Find all bones and meshes in cloned scene
  const cloneBones: Record<string, THREE.Bone> = {};
  const cloneSkinnedMeshes: Record<string, THREE.SkinnedMesh> = {};
  
  clone.scene.traverse((node) => {
    if (node instanceof THREE.Bone) cloneBones[node.name] = node;
    if (node instanceof THREE.SkinnedMesh) cloneSkinnedMeshes[node.name] = node;
  });

  // Rebind skeleton for each SkinnedMesh
  for (const name in skinnedMeshes) {
    const skinnedMesh = skinnedMeshes[name];
    const skeleton = skinnedMesh.skeleton;
    const cloneSkinnedMesh = cloneSkinnedMeshes[name];

    // Reorder cloned bones to match original skeleton order
    const orderedCloneBones: THREE.Bone[] = [];
    for (let i = 0; i < skeleton.bones.length; ++i) {
      const cloneBone = cloneBones[skeleton.bones[i].name];
      orderedCloneBones.push(cloneBone);
    }

    // Bind new skeleton with correct bone inverses
    cloneSkinnedMesh.bind(
      new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
      cloneSkinnedMesh.matrixWorld
    );
  }

  return clone;
}
```

**Key Points:**
- Must preserve bone order from original skeleton
- Must use same `boneInverses` from original skeleton
- Must bind skeleton to cloned mesh using `matrixWorld`

### 2. Separate Animation Loading

**Why:** Character models (`Rogue.glb`) contain only the 3D mesh and skeleton. Animations are in separate files like `Rig_Medium_General.glb` and `Rig_Medium_MovementBasic.glb`.

**How:** Use `useCharacterAnimation` hook which:
1. Loads character model (no animations)
2. Uses `AnimationSetLoader` to load animations from separate files
3. Maps animations via `kaykit-animations.json`:
   - `char_rogue` → `humanoid_basic` animation set
   - `humanoid_basic` uses files: `Rig_Medium_General.glb`, `Rig_Medium_MovementBasic.glb`

```typescript
const { crossfadeTo, isLoaded, hasAnimation } = useCharacterAnimation({
  characterId: 'minimal-demo-player',
  assetId: 'char_rogue', // Maps to humanoid_basic in kaykit-animations.json
  model: model,
  defaultAnimation: 'idle',
});
```

### 3. Animation Manager Updates

**Why:** THREE.js AnimationMixer must be updated every frame to progress animations.

**How:** `AnimationUpdater` component calls `animationManager.update(delta)` every frame:

```typescript
function AnimationUpdater() {
  useFrame((_state, delta) => {
    animationManager.update(delta);
  });
  return null;
}
```

**Must be inside Canvas** component to access `useFrame` hook.

### 4. Camera Follow Logic

**Why:** For isometric camera, character should move in world space, and camera follows.

**How:** Update camera position based on character's world position:

```typescript
useFrame((_state, dt) => {
  const charPosition = groupRef.current.position;
  
  // Isometric camera (45-degree angle)
  const angle = Math.PI * 0.25;
  const distance = 8;
  const height = 5;

  camera.position.x = charPosition.x + Math.sin(angle) * distance;
  camera.position.y = charPosition.y + height;
  camera.position.z = charPosition.z + Math.cos(angle) * distance;
  camera.lookAt(charPosition.x, charPosition.y + 0.5, charPosition.z);
});
```

## Architecture Flow

```
1. Load Character Model (Rogue.glb)
   ↓
2. Clone with skeleton binding (cloneGltf)
   ↓
3. Add to scene
   ↓
4. useCharacterAnimation hook:
   a. Loads animations from separate files (AnimationSetLoader)
   b. Registers with AnimationManager
   c. Plays default 'idle' animation
   ↓
5. AnimationUpdater updates mixers every frame
   ↓
6. Animations play correctly ✅
```

## Key Files

- `src/pages/MinimalDemoPage.tsx` - Main component
- `src/hooks/useCharacterAnimation.ts` - Animation hook
- `src/systems/animation/AnimationSetLoader.ts` - Loads animations from separate files
- `src/systems/animation/AnimationManager.ts` - Manages mixers
- `src/data/kaykit-animations.json` - Animation mappings

## Why This Works vs Previous Attempts

| Attempt | Issue |
|---------|-------|
| Loading from character model | Character models have NO animations |
| Simple `clone()` | Doesn't rebind skeleton - animations can't bind to bones |
| **Proper `cloneGltf()`** | ✅ Correctly rebinds skeleton - animations work |

## Testing Checklist

- ✅ Character loads without T-pose
- ✅ Idle animation plays automatically
- ✅ Walk/run animations transition smoothly
- ✅ Camera follows character movement
- ✅ Character moves with WASD/arrow keys
- ✅ Animations update every frame

## Additional Features (2024-12-19 Update)

### Camera Settings with Persistent Storage

Camera pitch and zoom can be adjusted via UI controls, and settings are automatically saved to `localStorage`:

```typescript
// Settings stored in localStorage as 'minimal-demo-camera-settings'
interface CameraSettings {
  pitch: number;  // Camera pitch angle (0 to PI/2)
  zoom: number;   // Camera distance from character (3 to 20)
}
```

Settings persist across page reloads and are used as defaults.

### Camera-Relative Movement

Movement is now **camera-relative** instead of world-relative:
- Forward (W) moves in the camera's forward direction
- Backward (S) moves away from camera
- Left/Right (A/D) strafe relative to camera

**Implementation:**
```typescript
// Get camera's forward and right vectors (projected to XZ plane)
const cameraForward = /* camera's forward direction on XZ plane */;
const cameraRight = /* camera's right direction */;

// Transform input direction to camera space
velocity = cameraForward * -inputZ + cameraRight * inputX;
```

### Larger World

- Ground plane: 200x200 units (was 50x50)
- Grid: 200x200 with 100 divisions
- World bounds: ±100 units (was ±20)
- Trees: Procedurally placed across the larger world

### NPCs with Different Models and Weapons

NPCs walk around using patrol behavior:
- **Knight NPCs**: Use `char_knight` model with `humanoid_enhanced` animations
  - Equipped with swords (1-handed and 2-handed)
- **Mage NPCs**: Use `char_mage` model with `humanoid_enhanced` animations
  - Equipped with staff (some without weapons)

**Weapon Attachment:**
- Weapons attached to `handslotr` or `handr` bones
- Positioned and rotated correctly
- Visible during all animations

**NPC Behavior:**
- Patrol in random directions within radius
- Change direction every 5 seconds
- Use walk animation while patrolling
- Face direction of movement
