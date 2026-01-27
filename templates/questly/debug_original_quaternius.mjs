import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { readdir } from 'fs/promises';
import path from 'path';

console.log('🔍 Investigating Original Quaternius GLTF Models...\n');

const loader = new GLTFLoader();
const modelsPath = './public/models/quaternius';

try {
  const files = await readdir(modelsPath);
  const gltfFiles = files.filter(file => file.endsWith('.gltf'));
  
  console.log(`Found ${gltfFiles.length} GLTF files:`, gltfFiles);
  
  for (const file of gltfFiles.slice(0, 2)) { // Test first 2 models
    console.log(`\n=== ANALYZING: ${file} ===`);
    
    try {
      const gltf = await new Promise((resolve, reject) => {
        loader.load(`./public/models/quaternius/${file}`, resolve, undefined, reject);
      });
      
      const scene = gltf.scene;
      
      // Find skeleton
      let skeleton = null;
      let skinnedMesh = null;
      scene.traverse((child) => {
        if (child.isSkinnedMesh && child.skeleton) {
          skeleton = child.skeleton;
          skinnedMesh = child;
        }
      });
      
      if (skeleton) {
        console.log(`✅ Found skeleton with ${skeleton.bones.length} bones`);
        console.log('\n📋 First 20 bone names:');
        skeleton.bones.slice(0, 20).forEach((bone, index) => {
          console.log(`  ${index}: ${bone.name}`);
        });
        
        if (skeleton.bones.length > 20) {
          console.log(`  ... and ${skeleton.bones.length - 20} more bones`);
        }
        
        // Check for common bone patterns
        const hips = skeleton.bones.find(bone => 
          bone.name.toLowerCase().includes('hip') || 
          bone.name.toLowerCase().includes('pelvis') ||
          bone.name.toLowerCase().includes('root')
        );
        const spine = skeleton.bones.find(bone => bone.name.toLowerCase().includes('spine'));
        const leftArm = skeleton.bones.find(bone => 
          bone.name.toLowerCase().includes('leftarm') || 
          bone.name.toLowerCase().includes('arm_l') ||
          bone.name.toLowerCase().includes('left') && bone.name.toLowerCase().includes('arm')
        );
        const rightArm = skeleton.bones.find(bone => 
          bone.name.toLowerCase().includes('rightarm') || 
          bone.name.toLowerCase().includes('arm_r') ||
          bone.name.toLowerCase().includes('right') && bone.name.toLowerCase().includes('arm')
        );
        
        console.log('\n🎯 Key bones found:');
        console.log(`  Hips/Root: ${hips?.name || 'NOT FOUND'}`);
        console.log(`  Spine: ${spine?.name || 'NOT FOUND'}`);
        console.log(`  Left Arm: ${leftArm?.name || 'NOT FOUND'}`);
        console.log(`  Right Arm: ${rightArm?.name || 'NOT FOUND'}`);
        
        // Check bone name patterns
        const boneNames = skeleton.bones.map(b => b.name);
        const hasMixamorig = boneNames.some(name => name.startsWith('mixamorig'));
        const hasUnderscore = boneNames.some(name => name.includes('_'));
        const hasDot = boneNames.some(name => name.includes('.'));
        
        console.log('\n🔤 Bone naming patterns:');
        console.log(`  Has 'mixamorig' prefix: ${hasMixamorig}`);
        console.log(`  Uses underscores: ${hasUnderscore}`);
        console.log(`  Uses dots: ${hasDot}`);
        
      } else {
        console.log('❌ No skeleton found in model');
      }
      
      // Check for animations
      if (gltf.animations && gltf.animations.length > 0) {
        console.log(`\n🎭 Found ${gltf.animations.length} animations in model:`);
        gltf.animations.forEach((anim, index) => {
          console.log(`  ${index}: ${anim.name} (${anim.duration}s, ${anim.tracks.length} tracks)`);
          if (anim.tracks.length > 0) {
            console.log(`    Sample track: ${anim.tracks[0].name}`);
          }
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