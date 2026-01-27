// Investigation script to analyze animation compatibility
const fs = require('fs');
const path = require('path');

console.log('=== ANIMATION COMPATIBILITY INVESTIGATION ===\n');

// Check what animation files we have
console.log('1. AVAILABLE ANIMATION FILES:');
const animationsDir = 'public/Assets/mixamo-animations';
try {
  const animFiles = fs.readdirSync(animationsDir);
  console.log(`Found ${animFiles.length} animation files:`);
  animFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
  console.log('ERROR: Cannot access mixamo-animations folder:', error.message);
}

console.log('\n2. QUATERNIUS MODEL FILES:');
const modelsDir = 'public/models/quaternius';
try {
  const modelFiles = fs.readdirSync(modelsDir);
  console.log(`Found ${modelFiles.length} Quaternius models:`);
  modelFiles.forEach(file => console.log(`  - ${file}`));
} catch (error) {
  console.log('ERROR: Cannot access quaternius models folder:', error.message);
}

console.log('\n3. ORIGINAL QUATERNIUS ASSET ANALYSIS:');
const quaterniusAssetDir = '../../Assets/RPG Characters - Nov 2020';
try {
  console.log('Checking original Quaternius folder structure...');
  
  // Check main directory
  const mainFiles = fs.readdirSync(path.join(__dirname, quaterniusAssetDir));
  console.log('Main directories:', mainFiles);
  
  // Check glTF folder
  const gltfDir = path.join(__dirname, quaterniusAssetDir, 'glTF');
  if (fs.existsSync(gltfDir)) {
    const gltfFiles = fs.readdirSync(gltfDir);
    console.log('glTF files:', gltfFiles);
  }
  
  // Check for humanoid rig versions
  const humanoidDir = path.join(__dirname, quaterniusAssetDir, 'Humanoid Rig Versions');
  if (fs.existsSync(humanoidDir)) {
    const humanoidSubdirs = fs.readdirSync(humanoidDir);
    console.log('Humanoid Rig Versions:', humanoidSubdirs);
    
    // Check FBX humanoid versions
    const humanoidFbxDir = path.join(humanoidDir, 'FBX');
    if (fs.existsSync(humanoidFbxDir)) {
      const humanoidFbxFiles = fs.readdirSync(humanoidFbxDir);
      console.log('Humanoid FBX files:', humanoidFbxFiles);
    }
  }
  
} catch (error) {
  console.log('ERROR accessing original Quaternius assets:', error.message);
}

console.log('\n4. RECOMMENDATIONS:');
console.log('Based on investigation:');
console.log('- Quaternius models are likely static character meshes');
console.log('- No embedded animations found in original pack');
console.log('- Mixamo animations require compatible bone structure');
console.log('- Need to verify bone naming compatibility');

console.log('\nNEXT STEPS:');
console.log('1. Check if Quaternius models have standard humanoid bones');
console.log('2. Test individual mixamo animations with simple models first');  
console.log('3. Consider using KayKit animations that are already working');
console.log('4. Check if Humanoid Rig Versions are more compatible');