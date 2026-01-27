import * as THREE from 'three';

// Animation compatibility checker
export function checkAnimationBoneCompatibility(skeleton: THREE.Skeleton, animation: THREE.AnimationClip): {
  compatible: boolean;
  matchingBones: number;
  totalBones: number;
  missingBones: string[];
  score: number;
} {
  const boneNames = skeleton.bones.map(bone => bone.name);
  const animationBones = new Set<string>();
  
  // Extract bone names from animation tracks
  animation.tracks.forEach(track => {
    const boneName = track.name.split('.')[0]; // Remove .position/.quaternion/.scale
    animationBones.add(boneName);
  });
  
  const animationBoneList = Array.from(animationBones);
  const matchingBones = animationBoneList.filter(animBone => 
    boneNames.some(skelBone => 
      skelBone === animBone || 
      skelBone.toLowerCase() === animBone.toLowerCase() ||
      normalizeStringBoneName(skelBone) === normalizeStringBoneName(animBone)
    )
  );
  
  const missingBones = animationBoneList.filter(animBone => 
    !boneNames.some(skelBone => 
      skelBone === animBone || 
      skelBone.toLowerCase() === animBone.toLowerCase() ||
      normalizeStringBoneName(skelBone) === normalizeStringBoneName(animBone)
    )
  );
  
  const score = matchingBones.length / Math.max(animationBoneList.length, 1);
  const compatible = score > 0.3; // At least 30% bone match required
  
  return {
    compatible,
    matchingBones: matchingBones.length,
    totalBones: animationBoneList.length,
    missingBones,
    score
  };
}

// Normalize bone names for better matching
function normalizeStringBoneName(boneName: string): string {
  return boneName
    .toLowerCase()
    .replace(/mixamorig/g, '')
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .replace(/\./g, '_')
    .replace(/\s+/g, '_');
}

// Create bone mapping between different naming conventions
export function createBoneMapping(sourceSkeleton: THREE.Skeleton, targetSkeleton: THREE.Skeleton): Map<string, string> {
  const mapping = new Map<string, string>();
  const sourceBones = sourceSkeleton.bones.map(bone => bone.name);
  const targetBones = targetSkeleton.bones.map(bone => bone.name);
  
  // Common bone mappings
  const commonMappings = [
    { pattern: /hips?/i, targets: ['Hips', 'hips', 'pelvis', 'Pelvis', 'root', 'Root'] },
    { pattern: /spine/i, targets: ['Spine', 'spine', 'spine1', 'Spine1'] },
    { pattern: /spine1/i, targets: ['Spine1', 'spine1', 'spine2', 'Spine2'] },
    { pattern: /spine2/i, targets: ['Spine2', 'spine2', 'chest', 'Chest'] },
    { pattern: /neck/i, targets: ['Neck', 'neck'] },
    { pattern: /head/i, targets: ['Head', 'head'] },
    { pattern: /left.*shoulder/i, targets: ['LeftShoulder', 'left_shoulder', 'shoulder_l'] },
    { pattern: /right.*shoulder/i, targets: ['RightShoulder', 'right_shoulder', 'shoulder_r'] },
    { pattern: /left.*arm/i, targets: ['LeftArm', 'left_arm', 'arm_l'] },
    { pattern: /right.*arm/i, targets: ['RightArm', 'right_arm', 'arm_r'] },
  ];
  
  // Try to match bones using common patterns
  for (const sourceBone of sourceBones) {
    const normalizedSource = normalizeStringBoneName(sourceBone);
    
    // Direct match first
    const directMatch = targetBones.find(target => 
      normalizeStringBoneName(target) === normalizedSource
    );
    
    if (directMatch) {
      mapping.set(sourceBone, directMatch);
      continue;
    }
    
    // Pattern matching
    for (const { pattern, targets } of commonMappings) {
      if (pattern.test(sourceBone)) {
        const matchedTarget = targets.find(target => 
          targetBones.some(bone => 
            normalizeStringBoneName(bone) === normalizeStringBoneName(target)
          )
        );
        
        if (matchedTarget) {
          const actualTarget = targetBones.find(bone => 
            normalizeStringBoneName(bone) === normalizeStringBoneName(matchedTarget)
          );
          if (actualTarget) {
            mapping.set(sourceBone, actualTarget);
            break;
          }
        }
      }
    }
  }
  
  return mapping;
}

// Apply bone mapping to animation
export function remapAnimation(animation: THREE.AnimationClip, boneMapping: Map<string, string>): THREE.AnimationClip {
  const remappedTracks = animation.tracks.map(track => {
    const [boneName, property] = track.name.split('.');
    const mappedBone = boneMapping.get(boneName);
    
    if (mappedBone) {
      const newTrack = track.clone();
      newTrack.name = `${mappedBone}.${property}`;
      return newTrack;
    }
    
    return track;
  });
  
  return new THREE.AnimationClip(animation.name, animation.duration, remappedTracks);
}

console.log('✅ Animation compatibility utilities loaded');