const fs = require('fs');
const path = require('path');

// Try to load the GLB and inspect animations using three.js
const THREE = require('three');
const { GLTFLoader } = require('three/examples/jsm/loaders/GLTFLoader.js');

const loader = new GLTFLoader();

// Test paths
const testFiles = [
  '/public/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/Rig_Medium_General.glb',
  '/public/Assets/KayKit_Adventurers_2.0_FREE/KayKit_Adventurers_2.0_FREE/Animations/gltf/Rig_Medium/Rig_Medium_MovementBasic.glb',
];

testFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  console.log(`\nInspecting: ${file}`);
  
  loader.load(filePath, (gltf) => {
    console.log(`Found ${gltf.animations.length} animations:`);
    gltf.animations.forEach(anim => {
      console.log(`  - ${anim.name} (duration: ${anim.duration}s)`);
    });
  }, undefined, (error) => {
    console.error(`Failed to load ${file}:`, error);
  });
});
