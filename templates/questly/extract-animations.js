// Animation clip name extractor for GLB files
// Uses three.js GLTFLoader to parse GLB files and extract animation names

const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');
const fs = require('fs');
const path = require('path');

const __dirname = path.dirname(__filename);

// Path to the KayKit GLB files
const glbPath = path.join(__dirname, '../../Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium');

// List of GLB files to analyze
const glbFiles = [
  'Rig_Medium_MovementBasic.glb',
  'Rig_Medium_MovementAdvanced.glb',
  'Rig_Medium_General.glb',
  'Rig_Medium_CombatMelee.glb',
  'Rig_Medium_CombatRanged.glb',
  'Rig_Medium_Simulation.glb',
  'Rig_Medium_Special.glb',
  'Rig_Medium_Tools.glb'
];

async function extractAnimationNames(filePath) {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    
    // Read the GLB file as buffer
    const buffer = fs.readFileSync(filePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    
    loader.parse(arrayBuffer, '', (gltf) => {
      const animations = gltf.animations || [];
      const animationNames = animations.map(anim => anim.name || 'Unnamed');
      resolve(animationNames);
    }, (error) => {
      reject(error);
    });
  });
}

async function analyzeAllFiles() {
  const results = {};
  
  console.log('🔍 Analyzing GLB files for animation clip names...\n');
  
  for (const filename of glbFiles) {
    const fullPath = path.join(glbPath, filename);
    
    try {
      if (fs.existsSync(fullPath)) {
        console.log(`📁 Processing: ${filename}`);
        const animationNames = await extractAnimationNames(fullPath);
        results[filename] = animationNames;
        
        console.log(`   Found ${animationNames.length} animations:`);
        animationNames.forEach(name => console.log(`   - ${name}`));
        console.log('');
      } else {
        console.log(`❌ File not found: ${filename}`);
        results[filename] = null;
      }
    } catch (error) {
      console.log(`❌ Error processing ${filename}:`, error.message);
      results[filename] = null;
    }
  }
  
  // Write results to JSON file for analysis
  const outputPath = path.join(__dirname, 'animation-audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('📊 Analysis complete! Results saved to:', outputPath);
  console.log('\n=== SUMMARY ===');
  
  for (const [filename, animations] of Object.entries(results)) {
    if (animations) {
      console.log(`\n${filename}:`);
      animations.forEach(name => console.log(`  - ${name}`));
    }
  }
  
  return results;
}

// Run the analysis
analyzeAllFiles().catch(console.error);