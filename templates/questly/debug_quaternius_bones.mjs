import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import * as THREE from 'three';
import { readdir } from 'fs/promises';
import path from 'path';

console.log('🔍 Investigating Quaternius FBX Models Bone Structure...\n');

const loader = new FBXLoader();
const modelsPath = './public/models/quaternius_humanoid';

try {
  const files = await readdir(modelsPath);
  const fbxFiles = files.filter(file => file.endsWith('.fbx'));
  
  console.log(`Found ${fbxFiles.length} FBX files:`, fbxFiles);
  
  for (const file of fbxFiles.slice(0, 2)) { // Test first 2 models
    console.log(`\n=== ANALYZING: ${file} ===`);
    
    try {
      const model = loader.parse(await import('fs').then(fs => fs.promises.readFile(path.join(modelsPath, file))));
      
      // Find skeleton
      let skeleton = null;
      model.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
          skeleton = child.skeleton;
        }
      });
      
      if (skeleton) {
        console.log(`✅ Found skeleton with ${skeleton.bones.length} bones`);
        console.log('\n📋 All bone names:');
        skeleton.bones.forEach((bone, index) => {
          console.log(`  ${index}: ${bone.name}`);
        });
        
        // Check for common bone patterns
        const hips = skeleton.bones.find(bone => bone.name.toLowerCase().includes('hip'));
        const spine = skeleton.bones.find(bone => bone.name.toLowerCase().includes('spine'));
        const leftArm = skeleton.bones.find(bone => bone.name.toLowerCase().includes('leftarm') || bone.name.toLowerCase().includes('arm_l'));
        const rightArm = skeleton.bones.find(bone => bone.name.toLowerCase().includes('rightarm') || bone.name.toLowerCase().includes('arm_r'));
        
        console.log('\n🎯 Key bones found:');
        console.log(`  Hips: ${hips?.name || 'NOT FOUND'}`);
        console.log(`  Spine: ${spine?.name || 'NOT FOUND'}`);
        console.log(`  Left Arm: ${leftArm?.name || 'NOT FOUND'}`);
        console.log(`  Right Arm: ${rightArm?.name || 'NOT FOUND'}`);
        
      } else {
        console.log('❌ No skeleton found in model');
      }
      
      // Check for animations
      if (model.animations && model.animations.length > 0) {
        console.log(`\n🎭 Found ${model.animations.length} animations in model:`);
        model.animations.forEach((anim, index) => {
          console.log(`  ${index}: ${anim.name} (${anim.duration}s, ${anim.tracks.length} tracks)`);
        });
      } else {
        console.log('\n❌ No animations found in model');
      }
      
    } catch (error) {
      console.error(`❌ Error loading ${file}:`, error.message);
    }
  }
  
} catch (error) {
  console.error('❌ Error reading models directory:', error.message);
}