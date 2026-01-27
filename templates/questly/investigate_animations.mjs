// Investigation script to analyze animation compatibility
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

console.log('\n4. CHECKING KAYKIT VS MIXAMO COMPATIBILITY:');
console.log('KayKit characters use custom bone structure:');
console.log('  - Custom bones: hips, handslotl, handslot_r, etc.');
console.log('  - Works with KayKit animation system');

console.log('\nMixamo animations expect standard humanoid bones:');
console.log('  - Standard bones: Hips, Spine, LeftArm, RightArm, etc.');
console.log('  - Works with standard humanoid rigs');

console.log('\n5. PROBLEM DIAGNOSIS:');
console.log('❌ ISSUE: Quaternius models likely have standard humanoid bones');
console.log('❌ ISSUE: But mixamo animations (Fox, Xbot, etc.) may have different bone names');
console.log('❌ ISSUE: Bone name mismatch = animations don\'t work');

console.log('\n6. SOLUTION OPTIONS:');
console.log('✅ Option 1: Use KayKit characters with KayKit animations (already working)');
console.log('⚠️  Option 2: Find animations that match Quaternius bone structure');
console.log('⚠️  Option 3: Use Humanoid Rig Versions of Quaternius if available');
console.log('🔧 Option 4: Retarget animations to match bone names');