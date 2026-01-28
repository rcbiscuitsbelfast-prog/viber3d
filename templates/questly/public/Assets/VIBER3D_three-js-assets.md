# Three.js Animation Assets

## Overview
Three.js repository containing animation models used by Viber3D. Primary source for Mixamo-compatible character animations with standard humanoid bone structure.

## Purpose in Viber3D
- **Animation Sources:** Primary repository for GLB models with animations
- **Reference Implementation:** Three.js animation system examples
- **Asset Library:** High-quality 3D models for testing and development

## Key Animation Models Used

### Primary Characters (Used in Viber3D)
| Model | Location | Animations | Description | Status |
|-------|----------|------------|-------------|---------|
| **Xbot.glb** | `examples/models/gltf/` | 7 (Idle, Walk, Run, Dance, Death, Sitting, Standing) | Humanoid character | ✅ Active |
| **Soldier.glb** | `examples/models/gltf/` | 3 (Idle, Walk, Run) | Military character | ✅ Active |
| **RobotExpressive.glb** | `examples/models/gltf/RobotExpressive/` | 14+ expressions | Animated robot with facial expressions | ✅ Active |

## Animation Assets in examples/models/gltf/

### Character Models (Humanoid Compatible)
- **Xbot.glb** - Male character, 7 animations, standard humanoid rig
- **Soldier.glb** - Military character, 3 basic animations  
- **RobotExpressive.glb** - Robotic character with extensive facial animations

### Additional Animated Models
- **Flamingo.glb** - Flying bird animation
- **Horse.glb** - Quadruped animal animation  
- **Parrot.glb** - Flying bird animation
- **Stork.glb** - Bird animation

## Integration Status in Viber3D

### Currently Integrated
- ✅ **Xbot.glb** - Copied to `public/Assets/mixamo-animations/`
- ✅ **Soldier.glb** - Copied to `public/Assets/mixamo-animations/`  
- ✅ **RobotExpressive.glb** - Copied to `public/Assets/mixamo-animations/`
- ✅ **Animation Database** - All animations mapped in kaykit-animations.json

### Animation Mapping
```javascript
// From kaykit-animations.json - mixamo_enhanced system
{
  "Xbot.glb": ["Idle", "Walk", "Run", "Dance", "Death", "Sitting", "Standing"],
  "Soldier.glb": ["Idle", "Walk", "Run"],
  "RobotExpressive.glb": ["Idle", "Walking", "Running", "Dance", "Death", "Sitting", "Standing"]
}
```

## Technical Details

### Model Specifications
- **Format:** GLB (Binary glTF)
- **Version:** glTF 2.0
- **Bone Structure:** Standard humanoid rig (Hips, Spine, LeftArm, RightArm, etc.)
- **Animation System:** Embedded skeletal animations
- **Textures:** Embedded or separate image files

## Usage in Viber3D Animation Pipeline
1. **Model Selection:** Choose compatible animated GLB files
2. **Asset Copy:** Copy to `public/Assets/mixamo-animations/`
3. **Database Update:** Add animation clips to kaykit-animations.json
4. **Integration:** Reference in character selection system
5. **Testing:** Verify animation playback with Quaternius characters

---

## Building Asset Packs

### KayKit Medieval Hexagon Pack
**Location:** `Assets/KayKit_Medieval_Hexagon_Pack_1.0_FREE/`  
**Status:** ✅ Fully Integrated  
**Format:** GLTF  
**Assets:** 7 castle/fortification pieces
- Castle (building_castle_blue.gltf)
- Tower A (building_tower_A_blue.gltf)
- Tower B (building_tower_B_blue.gltf)
- Tower Base (building_tower_base_blue.gltf)
- Wall Straight (wall_straight.gltf)
- Wall Corner (wall_corner_A_outside.gltf)
- Wall Gate (wall_straight_gate.gltf)

**Usage:** Castle Builder - Primary building pack

### Free Medieval Houses 3D Low-Poly Pack
**Location:** `Assets/free-medieval-houses-3d-low-poly-pack/`  
**Status:** ⚠️ Indexed, Requires FBX to GLTF Conversion  
**Format:** FBX (needs conversion for web use)  
**Assets:** 20 house models
- House_01_full.fbx through House_20_full.fbx
- Located in: `fbx/House_Full_ordinar/`

**Note:** FBX files need to be converted to GLTF/GLB format for use in Three.js web applications. Currently indexed but not usable until conversion.

**Usage:** Castle Builder - Secondary building pack (pending conversion)

---
**Source:** Three.js Repository (examples/models/gltf/)  
**License:** MIT  
**Purpose:** Animation source library  
**Models Used:** 3 primary (Xbot, Soldier, RobotExpressive)  
**Viber3D Integration:** Active animation source  
**Last Updated:** January 24, 2026