// Animation mismatch analysis
// Compares current JSON mappings with actual GLB animation names

const fs = require('fs');
const path = require('path');

// Load the actual animation names
const actualAnimationsPath = path.join(__dirname, 'real-animation-names.json');
const actualAnimations = JSON.parse(fs.readFileSync(actualAnimationsPath, 'utf8'));

// Load current JSON mappings
const currentMappingPath = path.join(__dirname, 'src/data/kaykit-animations.json');
const currentMapping = JSON.parse(fs.readFileSync(currentMappingPath, 'utf8'));

// Get the humanoid_enhanced animation set
const currentAnimSet = currentMapping.animationSets.humanoid_enhanced;

console.log('🔍 ANIMATION MAPPING AUDIT REPORT');
console.log('='.repeat(80));
console.log('Comparing current JSON mappings with actual GLB animation names\n');

// Create file mapping
const fileMapping = {
  'movementBasic': 'Rig_Medium_MovementBasic.glb',
  'movementAdvanced': 'Rig_Medium_MovementAdvanced.glb',
  'general': 'Rig_Medium_General.glb',
  'combatMelee': 'Rig_Medium_CombatMelee.glb',
  'combatRanged': 'Rig_Medium_CombatRanged.glb',
  'simulation': 'Rig_Medium_Simulation.glb',
  'special': 'Rig_Medium_Special.glb',
  'tools': 'Rig_Medium_Tools.glb'
};

const issues = [];
const corrections = {};

console.log('🚨 ISSUES FOUND:\n');

// Check each animation in the current mapping
for (const [animName, animConfig] of Object.entries(currentAnimSet.animations)) {
  const fileKey = animConfig.file;
  const claimedClipName = animConfig.clipName;
  const glbFilename = fileMapping[fileKey];
  
  if (!glbFilename) {
    console.log(`❌ Unknown file key: ${fileKey} for animation: ${animName}`);
    issues.push(`Unknown file key: ${fileKey}`);
    continue;
  }
  
  const actualClipsInFile = actualAnimations[glbFilename];
  
  if (!actualClipsInFile) {
    console.log(`❌ No data for file: ${glbFilename}`);
    issues.push(`No data for file: ${glbFilename}`);
    continue;
  }
  
  // Check if the claimed clip name exists in the actual file
  if (!actualClipsInFile.includes(claimedClipName)) {
    console.log(`❌ MISMATCH: Animation "${animName}"`);
    console.log(`   Current mapping: file="${fileKey}" clipName="${claimedClipName}"`);
    console.log(`   Available clips in ${glbFilename}:`);
    actualClipsInFile.forEach(clip => console.log(`     - "${clip}"`));
    console.log('');
    
    issues.push({
      animation: animName,
      file: glbFilename,
      claimedClip: claimedClipName,
      availableClips: actualClipsInFile
    });
  } else {
    console.log(`✅ OK: ${animName} -> "${claimedClipName}" exists in ${glbFilename}`);
  }
}

console.log('\n' + '='.repeat(80));
console.log('📋 SUMMARY');
console.log('='.repeat(80));
console.log(`Total animations checked: ${Object.keys(currentAnimSet.animations).length}`);
console.log(`Issues found: ${issues.filter(i => typeof i === 'object').length}`);

console.log('\n🔧 SUGGESTED CORRECTIONS:\n');

// Suggest corrections for mismatched animations
const suggestionsByFile = {};

for (const issue of issues.filter(i => typeof i === 'object')) {
  const { animation, file, claimedClip, availableClips } = issue;
  
  if (!suggestionsByFile[file]) {
    suggestionsByFile[file] = [];
  }
  
  // Try to find best match
  let bestMatch = null;
  const lowerClaimed = claimedClip.toLowerCase();
  
  // Look for exact matches (ignoring case)
  for (const clip of availableClips) {
    if (clip.toLowerCase() === lowerClaimed) {
      bestMatch = clip;
      break;
    }
  }
  
  // Look for partial matches
  if (!bestMatch) {
    for (const clip of availableClips) {
      const lowerClip = clip.toLowerCase();
      if (lowerClip.includes(lowerClaimed) || lowerClaimed.includes(lowerClip)) {
        bestMatch = clip;
        break;
      }
    }
  }
  
  // Look for semantic matches
  if (!bestMatch) {
    const semanticMap = {
      'idle': ['Idle_A', 'Idle_B'],
      'walking': ['Walking_A', 'Walking_B', 'Walking_C'],
      'running': ['Running_A', 'Running_B'],
      'sprinting': ['Running_A', 'Running_B'],
      'jump': ['Jump_Start', 'Jump_Full_Long', 'Jump_Full_Short'],
      'death': ['Death_A', 'Death_B'],
      'hit_react': ['Hit_A', 'Hit_B'],
      'sword_slash': ['Melee_1H_Attack_Slice_Horizontal', 'Melee_1H_Attack_Slice_Diagonal'],
      'sword_heavy_attack': ['Melee_2H_Attack_Chop'],
      'sword_stab': ['Melee_1H_Attack_Stab', 'Melee_2H_Attack_Stab'],
      'block_start': ['Melee_Block'],
      'block_hold': ['Melee_Blocking'],
      'block_break': ['Melee_Block_Hit'],
      'cast_spell': ['Ranged_Magic_Spellcasting'],
      'draw_bow': ['Ranged_Bow_Draw'],
      'shoot_arrow': ['Ranged_Bow_Release']
    };
    
    const key = lowerClaimed.replace(/[_\s]/g, '');
    if (semanticMap[key]) {
      for (const candidate of semanticMap[key]) {
        if (availableClips.includes(candidate)) {
          bestMatch = candidate;
          break;
        }
      }
    }
  }
  
  console.log(`🔧 ${animation}:`);
  console.log(`   Current: "${claimedClip}" (NOT FOUND)`);
  if (bestMatch) {
    console.log(`   Suggested: "${bestMatch}"`);
  } else {
    console.log(`   Suggested: [MANUAL SELECTION NEEDED]`);
    console.log(`   Available options:`);
    availableClips.slice(0, 5).forEach(clip => console.log(`     - "${clip}"`));
  }
  console.log('');
  
  suggestionsByFile[file].push({
    animation,
    current: claimedClip,
    suggested: bestMatch,
    available: availableClips
  });
}

// Save detailed analysis
const analysisOutput = {
  summary: {
    totalAnimations: Object.keys(currentAnimSet.animations).length,
    issuesFound: issues.filter(i => typeof i === 'object').length,
    timestamp: new Date().toISOString()
  },
  issues: issues.filter(i => typeof i === 'object'),
  suggestionsByFile,
  actualAnimations
};

fs.writeFileSync('animation-mapping-analysis.json', JSON.stringify(analysisOutput, null, 2));

console.log('📄 Detailed analysis saved to: animation-mapping-analysis.json');
console.log('\nNext steps:');
console.log('1. Review the suggested corrections above');
console.log('2. Update the kaykit-animations.json file with correct clip names');
console.log('3. Test the animations in the application');
