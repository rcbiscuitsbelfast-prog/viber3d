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
**Source:** Three.js Repository (examples/models/gltf/)  
**License:** MIT  
**Purpose:** Animation source library  
**Models Used:** 3 primary (Xbot, Soldier, RobotExpressive)  
**Viber3D Integration:** Active animation source  
**Last Updated:** January 24, 2026