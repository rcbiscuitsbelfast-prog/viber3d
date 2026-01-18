# Repository Audit & Phased Implementation Plan

**Date:** 2024-12-19  
**Purpose:** Complete audit of viber3d repository, cleanup of unhelpful files, and establishment of AI agent rules for Quests4Friends development.

---

## Executive Summary

The repository contains a working animation system (`AnimationSetLoader`, `AnimationManager`) that loads animations from **separate GLB files**, but `MinimalDemoPage.tsx` is trying to load animations from character models instead. This is the root cause of animation issues.

**Critical Finding:** Animations are NOT embedded in character models. They are in separate files:
- `/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/`
- `/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/`

---

## Phase 0: Complete Asset Inventory

### Animation Files (VERIFIED)

**KayKit Character Animations 1.1 (Rig_Medium):**
- ✅ `Rig_Medium_General.glb` - Idle, Hit, Death, Wave, Interact
- ✅ `Rig_Medium_MovementBasic.glb` - Walking, Running, Jump
- ✅ `Rig_Medium_MovementAdvanced.glb` - Strafing, Sprinting, Turn
- ✅ `Rig_Medium_CombatMelee.glb` - Attack, Block, Combat Idle
- ✅ `Rig_Medium_CombatRanged.glb` - Cast, Reload
- ✅ `Rig_Medium_Tools.glb` - Pickup, Use Item
- ✅ `Rig_Medium_Simulation.glb` - Crouch, Heavy Hit
- ✅ `Rig_Medium_Special.glb` - Cheer, Bow

**KayKit Adventurers 2.0 FREE (Rig_Medium):**
- ✅ `Rig_Medium_General.glb` - Basic animations
- ✅ `Rig_Medium_MovementBasic.glb` - Basic movement

**Configuration:**
- ✅ `src/data/kaykit-animations.json` - Complete mapping of all animations
- ✅ `src/systems/animation/AnimationSetLoader.ts` - Loads animations from separate files
- ✅ `src/systems/animation/AnimationLoader.ts` - Low-level animation loading
- ✅ `src/systems/animation/AnimationManager.ts` - Mixer management

### Character Models (NO ANIMATIONS)
- ✅ `Rogue.glb` - Character model only, NO animations embedded
- ✅ `Rogue_Hooded.glb` - Character model only, NO animations embedded
- ✅ `Knight.glb`, `Mage.glb`, `Barbarian.glb`, `Ranger.glb` - All models only

### Helper Games (KEEP - MIT Licensed)
- ✅ `clear_the_dungeon/` - Reference implementation using KayKit assets
- ✅ `toonshooter-game/` - Reference implementation

### Test Files (KEEP - Original Claude Suggestions)
- ✅ `Test Files/` - Original implementation suggestions from Claude, useful reference

---

## Phase 1: Delete Unhelpful Files & Folders

### Files to DELETE:

1. **Backup Files:**
   - ❌ `templates/quests4friends/src/pages/MinimalDemoPage.tsx.bak`

2. **Empty Folders:**
   - ❌ `templates/quests4friends/src/data/archived-demos/` (empty)

3. **Overlapping Documentation (Consolidate then delete):**
   - Review and consolidate these, then delete duplicates:
   - `templates/quests4friends/CRITICAL_FIXES_SUMMARY.md`
   - `templates/quests4friends/TASK_COMPLETE_SUMMARY.md`
   - `templates/quests4friends/AUDIT_SUMMARY.md`
   - `templates/quests4friends/AUDIT_REPORT.md`
   - `templates/quests4friends/ANIMATION_CHANGELOG.md`
   - `templates/quests4friends/ANIMATION_IMPLEMENTATION.md`
   - `templates/quests4friends/IMPLEMENTATION_COMPLETE.md`
   - Keep: `ANIMATION_GUIDE.md` (most complete), `README.md`, `TODO_NEXT.md`

### Files to KEEP (Reference):

1. **Helper Games:**
   - ✅ `clear_the_dungeon/` - Shows correct animation loading approach
   - ✅ `toonshooter-game/` - Additional reference

2. **Test Files:**
   - ✅ `Test Files/` - Original Claude suggestions, useful reference

3. **Documentation:**
   - ✅ `Context/` folder - **SOURCE OF TRUTH** - Main objectives and design docs
   - ✅ `templates/quests4friends/ANIMATION_GUIDE.md` - Comprehensive animation guide
   - ✅ `templates/quests4friends/README.md` - Project README
   - ✅ `templates/quests4friends/src/systems/animation/README.md` - System docs

---

## Phase 2: Fix MinimalDemoPage to Use Existing Animation System

**Current Problem:** `MinimalDemoPage.tsx` is trying to load animations from `Rogue.glb`, but animations are in separate files.

**Solution:** Use the existing `AnimationSetLoader` and `useCharacterAnimation` hook.

### Changes Required:

1. **Replace manual animation loading with AnimationSetLoader:**
   ```typescript
   // WRONG (current):
   const gltf = await loader.load('/Assets/.../Rogue.glb');
   // Tries to get animations from character model (none exist)

   // CORRECT:
   import { animationSetLoader } from '../systems/animation/AnimationSetLoader';
   const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
   ```

2. **Use existing animation hook:**
   ```typescript
   // Use the existing hook instead of manual state machine
   import { useCharacterAnimation } from '../hooks/useCharacterAnimation';
   ```

3. **Fix movement directions:**
   - Forward should be negative Z (already fixed in latest version)

---

## Phase 3: Create AI Agent Rules Document

Create `AI_AGENT_RULES.md` with strict guidelines for all AI agents working on this project.

---

## Phase 4: Verify All Assets Are Catalogued

Create complete asset manifest:
- All character models
- All animation files
- All environment assets (trees, props, etc.)
- All weapon/item models

---

## Phase 5: Ensure Animation System Works End-to-End

1. Test `MinimalDemoPage` with proper animation system
2. Verify all animation files load correctly
3. Test animation transitions
4. Verify character movement animations work

---

## Detailed File-by-File Audit

### Root Directory

| File/Folder | Status | Action | Notes |
|------------|--------|--------|-------|
| `Assets/` | ✅ KEEP | - | Source assets, keep all |
| `clear_the_dungeon/` | ✅ KEEP | - | Helper reference game (MIT) |
| `toonshooter-game/` | ✅ KEEP | - | Helper reference game |
| `Context/` | ✅ KEEP | - | **SOURCE OF TRUTH** - Main objectives |
| `Test Files/` | ✅ KEEP | - | Original Claude suggestions |
| `docs/` | ⚠️ REVIEW | Audit contents | May overlap with Context/ |
| `templates/quests4friends/` | ✅ KEEP | Clean up | Main project |

### templates/quests4friends/

#### Pages

| File | Status | Action | Notes |
|------|--------|--------|-------|
| `MinimalDemoPage.tsx` | ❌ FIX | Rewrite to use AnimationSetLoader | Currently broken - tries to load animations from model |
| `MinimalDemoPage.tsx.bak` | ❌ DELETE | Delete immediately | Backup file |
| `QuestPlayerPage.tsx` | ✅ KEEP | - | Main game page |
| `BuilderPage.tsx` | ✅ KEEP | - | Quest builder |
| `HomePage.tsx` | ✅ KEEP | - | Landing page |
| `LoginPage.tsx` | ✅ KEEP | - | Auth |
| `AccountPage.tsx` | ✅ KEEP | - | User account |
| `ToonShooterPage.tsx` | ✅ KEEP | - | Helper game page |

#### Systems (All KEEP)

| Folder | Status | Notes |
|--------|--------|-------|
| `src/systems/animation/` | ✅ KEEP | **USE THIS** - Working animation system |
| `src/systems/assets/` | ✅ KEEP | Asset registry |
| `src/systems/camera/` | ✅ KEEP | Camera management |

#### Data

| File | Status | Action | Notes |
|------|--------|--------|-------|
| `src/data/kaykit-animations.json` | ✅ KEEP | - | **Complete animation mapping** |
| `src/data/archived-demos/` | ❌ DELETE | Delete folder | Empty |

#### Documentation (Root)

| File | Status | Action | Notes |
|------|--------|--------|-------|
| `ANIMATION_GUIDE.md` | ✅ KEEP | - | Most comprehensive guide |
| `ANIMATION_CHANGELOG.md` | ⚠️ CONSOLIDATE | Review & merge | May overlap |
| `ANIMATION_IMPLEMENTATION.md` | ⚠️ CONSOLIDATE | Review & merge | May overlap |
| `AUDIT_REPORT.md` | ⚠️ CONSOLIDATE | Review & merge | Old audit |
| `AUDIT_SUMMARY.md` | ⚠️ CONSOLIDATE | Review & merge | Old audit |
| `CRITICAL_FIXES_SUMMARY.md` | ⚠️ CONSOLIDATE | Review & merge | May be outdated |
| `TASK_COMPLETE_SUMMARY.md` | ⚠️ CONSOLIDATE | Review & merge | May be outdated |
| `IMPLEMENTATION_COMPLETE.md` | ⚠️ CONSOLIDATE | Review & merge | May be outdated |
| `TODO_NEXT.md` | ✅ KEEP | Update | Current tasks |
| `README.md` | ✅ KEEP | - | Project README |

---

## Critical Rules for AI Agents

### 1. Animation Loading - NEVER ASSUME

**❌ WRONG:**
```typescript
// Don't assume animations are in character models
const gltf = await loader.load('/path/to/Character.glb');
const animations = gltf.animations; // THIS IS EMPTY!
```

**✅ CORRECT:**
```typescript
// Animations are in SEPARATE files - use AnimationSetLoader
import { animationSetLoader } from '../systems/animation/AnimationSetLoader';
const animations = await animationSetLoader.loadCharacterAnimations('char_rogue');
```

### 2. Always Check Existing Systems First

Before creating new code:
1. ✅ Check `src/systems/animation/` - Animation system already exists
2. ✅ Check `src/data/kaykit-animations.json` - Animation mapping exists
3. ✅ Check `ANIMATION_GUIDE.md` - Documentation exists
4. ❌ Don't create duplicate systems

### 3. Use Existing Hooks

```typescript
// ✅ Use existing hook:
import { useCharacterAnimation } from '../hooks/useCharacterAnimation';

// ❌ Don't create manual state machines unless necessary
```

### 4. Reference Helper Games

- `clear_the_dungeon/` - Shows correct animation loading
- `toonshooter-game/` - Additional patterns

### 5. Check Context Folder

Before major changes, refer to:
- `Context/Quests4friends – Technical Design Document (gdd-aligned).docx`
- `Context/Quests4friends – High-level Game Design Document (updated).docx`
- `Context/Quests4friends – Asset Integration & Runtime Spec (claude Helper Doc).docx`

### 6. Asset Paths

Animations are at:
```
/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium/
/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/
```

Characters are at:
```
/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/
```

**These are DIFFERENT paths!**

---

## Implementation Priority

1. **URGENT:** Fix `MinimalDemoPage.tsx` to use `AnimationSetLoader`
2. **HIGH:** Delete backup files and empty folders
3. **MEDIUM:** Consolidate documentation
4. **LOW:** Create comprehensive asset manifest

---

## Success Criteria

✅ `MinimalDemoPage` loads character with animations correctly  
✅ Idle animation plays (no T-pose)  
✅ Movement animations transition smoothly  
✅ All animation files are catalogued  
✅ AI agent rules document created  
✅ No duplicate/unhelpful files remain  
✅ All AI agents follow the rules

---

## Next Steps

1. Execute Phase 1 (delete files)
2. Execute Phase 2 (fix MinimalDemoPage)
3. Create AI_AGENT_RULES.md
4. Test everything end-to-end
5. Update this document with results
