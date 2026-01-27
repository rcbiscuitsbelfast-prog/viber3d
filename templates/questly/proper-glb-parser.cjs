// Improved GLB animation extractor
// Properly parses the GLTF JSON structure to find animations

const fs = require('fs');
const path = require('path');

const glbPath = path.resolve(__dirname, '../../Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium');

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

function extractGLTFJSON(filePath) {
  const buffer = fs.readFileSync(filePath);
  
  // GLB structure:
  // Header (12 bytes): magic, version, length
  // Chunk 0 (JSON): length (4), type (4), data
  // Chunk 1 (Binary): length (4), type (4), data
  
  let offset = 12; // Skip header
  
  // Read first chunk (JSON)
  const jsonLength = buffer.readUInt32LE(offset);
  offset += 4;
  
  const jsonType = buffer.toString('ascii', offset, offset + 4);
  offset += 4;
  
  if (jsonType !== 'JSON') {
    throw new Error('First chunk is not JSON');
  }
  
  const jsonData = buffer.toString('utf8', offset, offset + jsonLength);
  return JSON.parse(jsonData);
}

function extractAnimationNames(filePath) {
  try {
    const gltf = extractGLTFJSON(filePath);
    
    // Extract animations from the GLTF structure
    const animations = gltf.animations || [];
    const animationNames = animations.map(anim => anim.name || 'Unnamed');
    
    return animationNames;
    
  } catch (error) {
    console.error(`Error processing ${path.basename(filePath)}:`, error.message);
    return null;
  }
}

async function analyzeAllFiles() {
  const results = {};
  
  console.log('🎬 Extracting REAL animation names from GLB files...\n');
  
  for (const filename of glbFiles) {
    const fullPath = path.join(glbPath, filename);
    
    console.log(`📁 Processing: ${filename}`);
    
    if (fs.existsSync(fullPath)) {
      const animationNames = extractAnimationNames(fullPath);
      results[filename] = animationNames;
      
      if (animationNames && animationNames.length > 0) {
        console.log(`   ✅ Found ${animationNames.length} animations:`);
        animationNames.forEach(name => console.log(`   - "${name}"`));
      } else if (animationNames && animationNames.length === 0) {
        console.log(`   ⚠️  No animations found in this file`);
      } else {
        console.log(`   ❌ Failed to parse file`);
      }
    } else {
      console.log(`   ❌ File not found`);
      results[filename] = null;
    }
    console.log('');
  }
  
  // Write results 
  const outputPath = path.join(__dirname, 'real-animation-names.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('='.repeat(60));
  console.log('📊 COMPLETE ANALYSIS RESULTS');
  console.log('='.repeat(60));
  
  for (const [filename, animations] of Object.entries(results)) {
    if (animations) {
      console.log(`\n🎬 ${filename}:`);
      if (animations.length > 0) {
        animations.forEach(name => console.log(`    - "${name}"`));
      } else {
        console.log(`    (No animations)`);
      }
    }
  }
  
  console.log(`\n📄 Full results saved to: ${outputPath}`);
  
  return results;
}

// Run the analysis
analyzeAllFiles().catch(console.error);