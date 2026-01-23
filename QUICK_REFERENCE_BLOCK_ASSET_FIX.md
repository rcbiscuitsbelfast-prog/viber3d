# Quick Reference: Block/Asset Spawning Fix

## Problem → Solution → Result

### The Issue
Assets (trees, rocks) were **spawning INSIDE blocks** instead of on top because everything was merged into one mesh.

### The Fix
- ✅ Separated block and asset exports
- ✅ Blocks → Single collision mesh (quest_collisions_blocks)
- ✅ Assets → Individual GLBs (asset_glb_<id>)
- ✅ Applied renderOrder for proper z-ordering

### The Result
🎮 **Assets now render ABOVE blocks with correct positioning**

---

## Technical Summary

### Two Files Changed

#### 1. KennyBlocksPage.tsx (handleNext function)
```typescript
// Before: Merged blocks + assets
const merged = mergeGeometries([...blockGeos, ...assetGeos]);

// After: Separate them
const blockCollision = mergeGeometries(blockGeos);        // quest_collisions_blocks
assetPromises.forEach(asset => exportAsIndividualGLB());  // asset_glb_<id>
```

#### 2. KennyDemoPage.tsx (PlacedAssetInstance)
```typescript
// Before: Assets had no z-order control
scene.add(assetMesh);

// After: Assets render above blocks
assetMesh.traverse(child => {
  if (child.isMesh) child.renderOrder = 10;  // > blocks (0)
});
```

---

## Storage Structure

```
Before:
  quest_collisions_merged  ← Everything merged (❌ Broken)

After:
  quest_collisions_blocks  ← Blocks only (✅ Physics)
  asset_glb_tree_001       ← Tree (✅ Visual)
  asset_glb_rock_002       ← Rock (✅ Visual)
  asset_glb_plant_003      ← Plant (✅ Visual)
```

---

## RenderOrder Hierarchy

```
renderOrder = 0   → Blocks (collision mesh)
renderOrder = 10  → Assets (trees, rocks, etc)  ← ABOVE blocks
renderOrder = 20  → Dynamic (player, NPCs)
```

---

## Testing Quick Checklist

```
✓ Export: Generates quest_collisions_blocks + individual assets
✓ Load:   Loads collision mesh and individual assets
✓ Render: Assets appear ABOVE blocks (not inside)
✓ Legacy: Old quest_collisions_merged still works
```

---

## Console Messages to Look For

**Export:**
```
[handleNext] Extracted X block geometries (collision only)
[handleNext] Exported asset Y (AssetName)
[handleNext] Block collision mesh saved to: quest_collisions_blocks
```

**Load:**
```
[KennyDemo] Loading collision mesh from: quest_collisions_blocks (NEW: blocks only)
[PlacedAssetInstance] Loaded AssetName successfully with renderOrder=10
```

---

## One-Line Summary

**Changed:** All blocks+assets merged → Blocks+assets separate with proper z-order  
**Impact:** Assets now appear correctly above blocks, not inside them  
**Status:** ✅ Complete and backward compatible

---

## Files to Know

1. **KennyBlocksPage.tsx** (lines 1362-1547) - Export logic
2. **KennyDemoPage.tsx** (lines 542-695) - Asset loading
3. **KennyDemoPage.tsx** (lines 790-866) - Collision loading
4. **AUDIT_OF_CURSOR_AUDIT.md** - Full analysis
5. **IMPLEMENTATION_SUMMARY_BLOCK_ASSET_FIX.md** - Technical deep-dive

---

**Last Updated:** January 22, 2026  
**Status:** Production Ready ✅
