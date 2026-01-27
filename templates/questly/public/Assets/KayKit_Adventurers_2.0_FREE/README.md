# KayKit Adventurers 2.0 FREE

## Overview
Fantasy adventure character pack by KayKit featuring 5 fully rigged and textured characters with a medieval fantasy theme.

## Package Contents

### Characters (6 models)
**Location:** `KayKit_Adventurers_2.0_FREE/Characters/gltf/`

| Character | File | Texture | Description |
|-----------|------|---------|-------------|
| Barbarian | `Barbarian.glb` | `barbarian_texture.png` | Fierce warrior with tribal aesthetics |
| Knight | `Knight.glb` | `knight_texture.png` | Armored medieval warrior |
| Mage | `Mage.glb` | `mage_texture.png` | Spell-casting wizard character |
| Ranger | `Ranger.glb` | `ranger_texture.png` | Nature-themed scout/archer |
| Rogue | `Rogue.glb` | `rogue_texture.png` | Stealthy assassin character |
| Rogue (Hooded) | `Rogue_Hooded.glb` | `rogue_texture.png` | Alternate hooded version |

### Animations (2 GLB files)
**Location:** `KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/`

| File | Purpose | Content |
|------|---------|---------|
| `Rig_Medium_General.glb` | General animations | Idle, interact, gestures |
| `Rig_Medium_MovementBasic.glb` | Movement animations | Walk, run, basic locomotion |

### Additional Assets
- **FBX Models:** Available in `Characters/fbx/` directory
- **Sample Scenes:** Pre-configured scenes in `Samples/` directory  
- **Textures:** Additional texture assets in `Textures/` directory
- **License:** MIT-style license in `License.txt`

## Technical Specifications
- **Format:** glTF 2.0 (.glb binary)
- **Rig Type:** Medium humanoid rig
- **Texture Resolution:** 1024x1024 PNG
- **Bone Structure:** KayKit custom bone naming
- **Animation Count:** 10+ basic animations

## Integration Notes
- Compatible with Three.js and React Three Fiber
- Requires KayKit animation system for full functionality
- Characters use custom bone structure (not standard Mixamo)
- Textures are embedded in GLB files

## Asset Manifest
```json
{
  "characters": 6,
  "animations": 2,
  "textures": 5,
  "total_files": 13,
  "formats": ["GLB", "PNG"],
  "license": "Free for commercial use"
}
```

## Usage
1. Load character GLB files using GLTFLoader
2. Apply animations from Rig_Medium animation files
3. Use KayKit animation system for proper bone mapping
4. Textures are automatically applied from GLB

---
**Source:** KayKit (Kay Lousberg)  
**License:** Free for commercial and personal use  
**Last Updated:** January 16, 2026