# Animation Failure Log

**Purpose:** Track failed approaches to prevent repeating the same mistakes.

---

## Failed Approaches

### ❌ Attempt 1: Loading Animations from Character Model
**Date:** 2024-12-19  
**What we tried:**
- Loaded `Rogue.glb` and tried to get `gltf.animations`
- Result: Empty array - character models don't contain animations
**Why it failed:** Animations are in SEPARATE files, not in character models
**Don't repeat:** Never assume animations are in character models

### ❌ Attempt 2: Using useCharacterAnimation Hook (2024-12-19)
**Date:** 2024-12-19  
**What we tried:**
- Used `useCharacterAnimation` hook
- Loaded animations via `AnimationSetLoader`
- Added `AnimationUpdater` component
- Used `gltf.scene.clone()` for model cloning
**Result:** Character stuck in T-pose, not animated, camera moves but character doesn't follow
**Issues found:**
- Simple `clone()` doesn't preserve skeleton binding properly
- Model needs proper GLTF cloning with skeleton rebinding (like clear_the_dungeon's `GLTFUtils.cloneGltf`)

### ✅ Attempt 3: Proper GLTF Cloning (2024-12-19)
**Date:** 2024-12-19  
**What we tried:**
- Added `cloneGltf()` function from clear_the_dungeon that properly rebinds skeleton
- Using proper skeleton binding for SkinnedMesh
- Fixed camera to follow character (character moves, camera follows)
- Better debugging logs
**Status:** Testing...

---

## Key Learnings

1. **Animations are in separate files** - confirmed
2. **Character models have NO animations** - confirmed
3. **AnimationSetLoader exists and should work** - but may have skeleton binding issues
4. **Model cloning may be required** - clear_the_dungeon clones models before applying animations

---

## Current Status (2024-12-19)

- Character loads but stuck in T-pose
- Animations not playing despite using correct system
- Camera moves but character doesn't follow
- Need to debug: skeleton binding, animation application, mixer updates
