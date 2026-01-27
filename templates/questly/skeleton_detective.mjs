import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { readdir } from 'fs/promises';
import { readFile } from 'fs/promises';
import path from 'path';

console.log('🕵️ SKELETON DETECTIVE - Complete Model Analysis\n');

const loader = new GLTFLoader();

// Function to analyze a GLTF file
async function analyzeModel(filePath, name) {
  try {
    console.log(`\n=== ANALYZING: ${name} ===`);
    
    const gltfData = await readFile(filePath);
    const gltf = await new Promise((resolve, reject) => {
      loader.parse(gltfData.buffer, '', resolve, reject);
    });
    
    const scene = gltf.scene;
    
    // Find skeleton and skinned meshes
    let skeleton = null;
    let skinnedMesh = null;
    const meshes = [];
    
    scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child.name || 'unnamed_mesh');
      }
      if (child.isSkinnedMesh && child.skeleton) {
        skeleton = child.skeleton;
        skinnedMesh = child;
      }
    });
    
    console.log(`📦 Meshes found: ${meshes.length} - ${meshes.join(', ')}`);
    
    if (skeleton) {
      console.log(`🦴 Skeleton: ${skeleton.bones.length} bones`);
      
      // Analyze bone naming patterns
      const boneNames = skeleton.bones.map(b => b.name);
      const patterns = {
        mixamorig: boneNames.filter(n => n.startsWith('mixamorig')),
        underscore: boneNames.filter(n => n.includes('_')),
        camelCase: boneNames.filter(n => /[a-z][A-Z]/.test(n)),
        numbered: boneNames.filter(n => /\d/.test(n)),
      };
      
      console.log('🔤 Bone naming patterns:');
      console.log(`  - mixamorig prefix: ${patterns.mixamorig.length} bones`);
      console.log(`  - underscores: ${patterns.underscore.length} bones`);
      console.log(`  - camelCase: ${patterns.camelCase.length} bones`);
      console.log(`  - with numbers: ${patterns.numbered.length} bones`);
      
      // Find key bones for humanoid structure
      const keyBones = {
        root: boneNames.find(n => /^(mixamorig)?hips?$/i.test(n)) || 
              boneNames.find(n => /^(mixamorig)?root$/i.test(n)) ||
              boneNames.find(n => /^(mixamorig)?pelvis$/i.test(n)),
        spine: boneNames.find(n => /^(mixamorig)?spine$/i.test(n)),
        head: boneNames.find(n => /^(mixamorig)?head$/i.test(n)),
        leftArm: boneNames.find(n => /^(mixamorig)?left.*arm$/i.test(n)),
        rightArm: boneNames.find(n => /^(mixamorig)?right.*arm$/i.test(n)),
      };
      
      console.log('🎯 Key humanoid bones:');
      Object.entries(keyBones).forEach(([key, bone]) => {
        console.log(`  - ${key}: ${bone || '❌ NOT FOUND'}`);
      });
      
      // Show first 10 bone names for reference
      console.log('📋 First 10 bones:', boneNames.slice(0, 10));
      
    } else {
      console.log('❌ No skeleton found');
    }
    
    // Check animations in model
    if (gltf.animations?.length > 0) {
      console.log(`🎭 Built-in animations: ${gltf.animations.length}`);
      gltf.animations.forEach((anim, i) => {
        console.log(`  ${i}: ${anim.name} (${anim.duration.toFixed(2)}s, ${anim.tracks.length} tracks)`);
      });
    } else {
      console.log('❌ No built-in animations');
    }
    
    return {
      name,
      hasSkeleton: !!skeleton,
      boneCount: skeleton?.bones.length || 0,
      boneNames: skeleton?.bones.map(b => b.name) || [],
      keyBones,
      builtInAnimations: gltf.animations?.length || 0,
      animationNames: gltf.animations?.map(a => a.name) || []
    };
    
  } catch (error) {
    console.error(`❌ Error analyzing ${name}:`, error.message);
    return { name, error: error.message };
  }
}

// Function to analyze animation files
async function analyzeAnimation(filePath, name) {
  try {
    console.log(`\n=== ANIMATION: ${name} ===`);
    
    const gltfData = await readFile(filePath);
    const gltf = await new Promise((resolve, reject) => {
      loader.parse(gltfData.buffer, '', resolve, reject);
    });
    
    if (gltf.animations?.length > 0) {
      console.log(`🎭 Contains ${gltf.animations.length} animations:`);
      gltf.animations.forEach((anim, i) => {
        const trackBones = new Set();
        anim.tracks.forEach(track => {
          const boneName = track.name.split('.')[0];
          trackBones.add(boneName);
        });
        console.log(`  ${i}: ${anim.name} (${anim.duration.toFixed(2)}s, ${trackBones.size} bones)`);
        
        // Show first few bone names from tracks
        const boneList = Array.from(trackBones).slice(0, 5);
        console.log(`    Sample bones: ${boneList.join(', ')}`);
      });
    } else {
      console.log('❌ No animations found');
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing animation ${name}:`, error.message);
  }
}

// Main analysis
async function runAnalysis() {
  try {
    console.log('🎯 STEP 1: Analyzing Character Models\n');
    
    // Analyze all available character models
    const modelDirs = [
      { path: './public/models', pattern: '*.glb', label: 'Main Models' },
      { path: './public/models/quaternius', pattern: '*.gltf', label: 'Quaternius GLTF' },
    ];
    
    const modelResults = [];
    
    for (const dir of modelDirs) {
      try {
        const files = await readdir(dir.path);
        const matchingFiles = files.filter(f => {
          if (dir.pattern === '*.glb') return f.endsWith('.glb');
          if (dir.pattern === '*.gltf') return f.endsWith('.gltf');
          return false;
        });
        
        console.log(`\n📁 ${dir.label} (${matchingFiles.length} files):`);
        
        for (const file of matchingFiles) {
          const fullPath = path.join(dir.path, file);
          const result = await analyzeModel(fullPath, `${dir.label}/${file}`);
          modelResults.push(result);
        }
      } catch (error) {
        console.log(`❌ Could not read directory ${dir.path}: ${error.message}`);
      }
    }
    
    console.log('\n🎯 STEP 2: Analyzing Animation Files\n');
    
    // Analyze animation files
    const animationDirs = [
      './public/Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium'
    ];
    
    for (const animDir of animationDirs) {
      try {
        const files = await readdir(animDir);
        const glbFiles = files.filter(f => f.endsWith('.glb')).slice(0, 3); // Analyze first 3
        
        console.log(`\n📁 Animation Files (analyzing first 3 of ${files.filter(f => f.endsWith('.glb')).length}):`);
        
        for (const file of glbFiles) {
          const fullPath = path.join(animDir, file);
          await analyzeAnimation(fullPath, file);
        }
      } catch (error) {
        console.log(`❌ Could not read animation directory: ${error.message}`);
      }
    }
    
    console.log('\n🎯 STEP 3: Compatibility Analysis\n');
    
    // Group models by bone structure similarity
    const workingModels = modelResults.filter(m => m.hasSkeleton && !m.error);
    
    console.log('📊 SKELETON COMPATIBILITY GROUPS:');
    
    const groups = {};
    workingModels.forEach(model => {
      const key = `${model.boneCount}_bones`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(model);
    });
    
    Object.entries(groups).forEach(([key, models]) => {
      console.log(`\n🔗 ${key.toUpperCase()}:`);
      models.forEach(model => {
        const hasAnimations = model.builtInAnimations > 0 ? `✅ ${model.builtInAnimations} anims` : '❌ no anims';
        console.log(`  - ${model.name} (${hasAnimations})`);
      });
    });
    
    console.log('\n🏆 RECOMMENDATIONS:');
    console.log('1. Models with built-in animations should work immediately');
    console.log('2. Models with same bone count might share animations');
    console.log('3. Check bone naming patterns for compatibility');
    
  } catch (error) {
    console.error('Fatal analysis error:', error);
  }
}

runAnalysis();