// Simple GLB animation name extractor
// This script reads GLB files and attempts to extract animation names

const fs = require('fs');
const path = require('path');

// Path to the KayKit GLB files  
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

function extractAnimationNamesFromGLB(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    
    // GLB has a JSON chunk that contains animation names
    // Look for the JSON chunk and extract animation names
    const content = buffer.toString('utf8', 0, Math.min(buffer.length, 100000)); // First 100KB should contain JSON
    
    // Find animation references in the JSON
    const animationMatches = [];
    
    // Pattern to find "name" properties that might be animations
    const namePattern = /"name"\s*:\s*"([^"]+)"/g;
    let match;
    
    while ((match = namePattern.exec(content)) !== null) {
      const name = match[1];
      // Filter out obviously non-animation names
      if (!name.includes('_') && !name.includes('.') && !name.includes('/') && 
          name.length > 2 && name.length < 50) {
        animationMatches.push(name);
      }
    }
    
    // Also look for animation-specific patterns
    const animPatterns = [
      /"animations"\s*:\s*\[[^\]]*"name"\s*:\s*"([^"]+)"/g,
      /Action\.|Take\s+\d+|Animation|Anim|action\./gi
    ];
    
    for (const pattern of animPatterns) {
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          animationMatches.push(match[1]);
        }
      }
    }
    
    // Remove duplicates and return
    return [...new Set(animationMatches)];
    
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function analyzeAllFiles() {
  const results = {};
  
  console.log('🔍 Analyzing GLB files for animation clip names...\n');
  
  for (const filename of glbFiles) {
    const fullPath = path.join(glbPath, filename);
    
    console.log(`📁 Processing: ${filename}`);
    
    if (fs.existsSync(fullPath)) {
      const animationNames = extractAnimationNamesFromGLB(fullPath);
      results[filename] = animationNames;
      
      if (animationNames && animationNames.length > 0) {
        console.log(`   Found ${animationNames.length} potential animation names:`);
        animationNames.forEach(name => console.log(`   - ${name}`));
      } else {
        console.log(`   No animation names extracted (may need different parsing approach)`);
      }
    } else {
      console.log(`   ❌ File not found`);
      results[filename] = null;
    }
    console.log('');
  }
  
  // Write results to JSON file
  const outputPath = path.join(__dirname, 'animation-audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  
  console.log('📊 Analysis complete! Results saved to:', outputPath);
  
  return results;
}

// Run the analysis
analyzeAllFiles().catch(console.error);