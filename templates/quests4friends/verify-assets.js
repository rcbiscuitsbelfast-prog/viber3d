#!/usr/bin/env node

/**
 * Asset Verification Script
 * Checks if all referenced asset files actually exist
 */

const fs = require('fs');
const path = require('path');

const assetsPath = path.join(__dirname, 'public/Assets');

// Expected assets from assets.json files
const expectedFiles = [
  // Characters (GLB)
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Barbarian.glb',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Knight.glb',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Mage.glb',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Ranger.glb',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue.glb',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Characters/gltf/Rogue_Hooded.glb',

  // Weapons (GLTF - need to verify these exist)
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/dagger.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_1handed.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/sword_2handed.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/bow.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/bow_withString.gltf',

  // Items (GLTF - need to verify these exist)
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/mug_empty.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/mug_full.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/spellbook_closed.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/spellbook_open.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/smokebomb.gltf',

  // Shields (GLTF - need to verify these exist)
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/shield_badge.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/shield_round.gltf',
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf/shield_square.gltf',

  // Forest - Trees
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_1_A_Color1.gltf',
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_2_A_Color1.gltf',
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Tree_3_A_Color1.gltf',

  // Forest - Rocks
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_1_A_Color1.gltf',
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf/Rock_2_A_Color1.gltf',
];

console.log('🔍 Verifying Asset Files...\n');

let missingFiles = [];
let foundFiles = [];

expectedFiles.forEach(relativePath => {
  const fullPath = path.join(assetsPath, relativePath);
  const exists = fs.existsSync(fullPath);

  if (exists) {
    const stats = fs.statSync(fullPath);
    foundFiles.push({
      path: relativePath,
      size: (stats.size / 1024).toFixed(2) + ' KB'
    });
    console.log('✅', relativePath, `(${(stats.size / 1024).toFixed(2)} KB)`);
  } else {
    missingFiles.push(relativePath);
    console.log('❌', relativePath, '(MISSING)');
  }
});

console.log('\n' + '='.repeat(60));
console.log(`\n📊 Summary:`);
console.log(`   Total expected: ${expectedFiles.length}`);
console.log(`   ✅ Found: ${foundFiles.length}`);
console.log(`   ❌ Missing: ${missingFiles.length}`);

if (missingFiles.length > 0) {
  console.log(`\n⚠️  Missing Files:\n`);
  missingFiles.forEach(file => {
    console.log(`   - ${file}`);
  });
  console.log(`\n⚠️  Some assets will fall back to placeholder geometry!`);
} else {
  console.log(`\n✅ All asset files found!`);
}

// Check if Assets/gltf directory exists for adventurers
const adventurersGltfPath = path.join(
  assetsPath,
  '/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Assets/gltf'
);
console.log('\n' + '='.repeat(60));
console.log('\n📂 Adventurers Assets/gltf Directory:');

if (fs.existsSync(adventurersGltfPath)) {
  const files = fs.readdirSync(adventurersGltfPath);
  console.log(`✅ Directory exists`);
  console.log(`   Contains ${files.length} files:`);
  files.slice(0, 10).forEach(file => {
    const fullPath = path.join(adventurersGltfPath, file);
    const stats = fs.statSync(fullPath);
    console.log(`   - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
  });
  if (files.length > 10) {
    console.log(`   ... and ${files.length - 10} more`);
  }
} else {
  console.log(`❌ Directory does NOT exist`);
  console.log(`   This will cause weapon/shield/item loading to fail!`);
}

// Check Forest assets directory
const forestGltfPath = path.join(
  assetsPath,
  '/KayKit_Forest_Nature_Pack_1.0_FREE/KayKit_Forest_Nature_Pack_1.0_FREE/Assets/gltf'
);
console.log('\n📂 Forest Assets/gltf Directory:');

if (fs.existsSync(forestGltfPath)) {
  const files = fs.readdirSync(forestGltfPath);
  console.log(`✅ Directory exists`);
  console.log(`   Contains ${files.length} files`);
  console.log(`   Sample files:`);
  files.slice(0, 5).forEach(file => {
    console.log(`   - ${file}`);
  });
} else {
  console.log(`❌ Directory does NOT exist`);
}

console.log('\n' + '='.repeat(60));
console.log('\n✨ Verification complete!\n');
