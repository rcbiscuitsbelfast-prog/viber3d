import fs from 'fs';
import path from 'path';

// Function to extract animation names from a glTF file
function extractAnimationNames(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const gltf = JSON.parse(content);
        
        if (gltf.animations) {
            return gltf.animations.map(anim => anim.name || 'Unnamed').filter(name => name !== 'Unnamed');
        }
        return [];
    } catch (error) {
        console.error(`Error reading ${filePath}:`, error.message);
        return [];
    }
}

// Directory containing Quaternius models
const modelsDir = './public/models/quaternius';
const characters = ['Cleric', 'Monk', 'Ranger', 'Rogue', 'Warrior', 'Wizard'];

const quaterniusAnimations = {};

characters.forEach(character => {
    const filePath = path.join(modelsDir, `${character}.gltf`);
    console.log(`\nAnalyzing ${character}...`);
    
    const animations = extractAnimationNames(filePath);
    quaterniusAnimations[character.toLowerCase()] = animations;
    
    console.log(`Found ${animations.length} animations:`);
    animations.forEach(anim => console.log(`  - ${anim}`));
});

// Save the results to a JSON file
const outputPath = './quaternius-animations.json';
fs.writeFileSync(outputPath, JSON.stringify(quaterniusAnimations, null, 2));

console.log(`\nAnimation mapping saved to: ${outputPath}`);
console.log('\nSummary:');
characters.forEach(character => {
    const anims = quaterniusAnimations[character.toLowerCase()];
    console.log(`${character}: ${anims.length} animations`);
});