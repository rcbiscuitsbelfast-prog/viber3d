# KayKit Character Animations 1.1

## Overview
Comprehensive animation library for KayKit characters featuring 57+ professional animations across 8 categories. This is the primary animation system used in the Viber3D project.

## Animation Categories

### Medium Rig Animations
**Location:** `Animations/gltf/Rig_Medium/`

| File | Category | Animation Count | Description |
|------|----------|----------------|-------------|
| `Rig_Medium_MovementBasic.glb` | Movement | 8 | Walk, run, idle, jump |
| `Rig_Medium_MovementAdvanced.glb` | Advanced Movement | 6 | Climb, swim, sneak, parkour |
| `Rig_Medium_CombatMelee.glb` | Melee Combat | 12 | Sword attacks, blocks, combos |
| `Rig_Medium_CombatRanged.glb` | Ranged Combat | 8 | Bow, crossbow, throw, aim |
| `Rig_Medium_General.glb` | General Actions | 10 | Interact, pickup, use items |
| `Rig_Medium_Simulation.glb` | Life Simulation | 7 | Sit, sleep, eat, drink |
| `Rig_Medium_Special.glb` | Special Actions | 4 | Magic cast, celebrate, dance |
| `Rig_Medium_Tools.glb` | Tool Usage | 2 | Mining, crafting, building |

### Large Rig Animations  
**Location:** `Animations/gltf/Rig_Large/`
- Same animation set optimized for larger character models
- Compatible with heavy armor or bulky character designs

### Mannequin Character
**Location:** `Mannequin Character/`
- Reference character model for testing animations
- Neutral design for previewing all animation sets
- Includes base textures and materials

## Technical Specifications

### Animation Details
- **Total Animations:** 57+ unique clips
- **Format:** glTF 2.0 (.glb binary)
- **Frame Rate:** 30 FPS
- **Bone Structure:** KayKit custom naming convention
- **Root Motion:** Filtered for in-place animations
- **Loop Settings:** Configured per animation type

### Bone Structure
```
Root Hierarchy:
├── hips
├── spine
├── chest  
├── neck
├── head
├── upperarmr/l → lowerarmr/l → handr/l
├── upperlegr/l → lowerlegr/l → footr/l
└── handslot/handslotr/l (weapon attachment points)
```

### Animation Mapping
Each GLB file contains multiple animation clips:
- Clips use descriptive names (e.g., "Idle_Neutral", "Walk_Forward")
- Root motion is baked into position tracks
- All animations are optimized for seamless looping

## Integration Status
- ✅ **Fully Compatible:** KayKit Adventurers characters
- ✅ **Animation Database:** Mapped in `kaykit-animations.json`
- ✅ **Viber3D Support:** Primary animation system
- ⚠️ **Quaternius Models:** Bone structure incompatible

## Usage Examples

### Loading Animation Set
```javascript
// Load all KayKit animations
const animations = await animationSetLoader.loadAnimationSet('humanoid_enhanced');

// Play specific animation
animationManager.playAnimation(characterId, 'idle', { loop: true });
```

### Animation Categories
```javascript
// Movement
playAnimation('walk', { loop: true });
playAnimation('run', { loop: true });
playAnimation('jump', { loop: false });

// Combat
playAnimation('attack_sword', { loop: false });
playAnimation('defend_block', { loop: true });
playAnimation('dodge_right', { loop: false });
```

## File Structure
```
KayKit_Character_Animations_1.1/
├── Animations/
│   └── gltf/
│       ├── Rig_Medium/          # Primary animation files
│       │   ├── Rig_Medium_MovementBasic.glb    (2.1 MB)
│       │   ├── Rig_Medium_CombatMelee.glb      (3.2 MB) 
│       │   └── [...6 more files...]
│       └── Rig_Large/           # Large character variants
├── Mannequin Character/         # Reference model
├── License.txt                  # Usage rights
└── [Social Links]
```

## Performance Notes
- Animation files are optimized for web delivery
- GLB format includes compression for faster loading
- Clips share bone data to minimize memory usage
- Root motion filtering reduces jitter in locomotion

## Known Issues
- Custom bone names incompatible with standard Mixamo rigs
- Requires specific character models with matching bone structure
- Animation clips need exact name mapping for proper playback

## Asset Manifest
```json
{
  "animation_files": 8,
  "total_animations": 57,
  "formats": ["GLB"],
  "rig_types": ["Medium", "Large"],
  "file_size": "~20 MB total",
  "license": "Free for commercial use"
}
```

---
**Source:** KayKit (Kay Lousberg)  
**Version:** 1.1  
**License:** Free for commercial and personal use  
**Integration:** Primary animation system for Viber3D  
**Last Updated:** January 17, 2026