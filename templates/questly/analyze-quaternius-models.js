/**
 * Script to analyze Quaternius glTF models and extract animation information
 */

import fs from 'fs';
import path from 'path';

const QUATERNIUS_MODELS_DIR = './public/models/quaternius';
const OUTPUT_FILE = './quaternius-analysis.json';

const models = [
    'Cleric.gltf',
    'Monk.gltf', 
    'Ranger.gltf',
    'Rogue.gltf',
    'Warrior.gltf',
    'Wizard.gltf'
];

async function analyzeQuaterniusModels() {
    const analysis = {
        timestamp: new Date().toISOString(),
        models: {},
        summary: {
            totalModels: 0,
            modelsWithAnimations: 0,
            totalAnimations: 0,
            commonAnimations: []
        }
    };

    console.log('🔍 Analyzing Quaternius Models...\n');

    for (const modelFile of models) {
        const modelPath = path.join(QUATERNIUS_MODELS_DIR, modelFile);
        const modelName = path.basename(modelFile, '.gltf');
        
        console.log(`📄 Analyzing: ${modelName}`);
        
        try {
            if (!fs.existsSync(modelPath)) {
                console.log(`❌ File not found: ${modelPath}`);
                continue;
            }

            const gltfData = JSON.parse(fs.readFileSync(modelPath, 'utf8'));
            
            const modelAnalysis = {
                file: modelFile,
                hasAnimations: false,
                animationCount: 0,
                animations: [],
                meshes: gltfData.meshes ? gltfData.meshes.length : 0,
                nodes: gltfData.nodes ? gltfData.nodes.length : 0,
                scenes: gltfData.scenes ? gltfData.scenes.length : 0,
                materials: gltfData.materials ? gltfData.materials.length : 0,
                textures: gltfData.textures ? gltfData.textures.length : 0,
                hasRig: false,
                boneCount: 0
            };

            // Check for animations
            if (gltfData.animations && gltfData.animations.length > 0) {
                modelAnalysis.hasAnimations = true;
                modelAnalysis.animationCount = gltfData.animations.length;
                
                gltfData.animations.forEach((anim, index) => {
                    const animName = anim.name || `Animation_${index}`;
                    modelAnalysis.animations.push({
                        name: animName,
                        channels: anim.channels ? anim.channels.length : 0,
                        samplers: anim.samplers ? anim.samplers.length : 0
                    });
                });
                
                analysis.summary.modelsWithAnimations++;
                analysis.summary.totalAnimations += modelAnalysis.animationCount;
            }

            // Check for skeletal structure (bones/joints)
            if (gltfData.nodes) {
                const boneNodes = gltfData.nodes.filter(node => 
                    node.name && (
                        node.name.toLowerCase().includes('bone') ||
                        node.name.toLowerCase().includes('joint') ||
                        node.name.toLowerCase().includes('armature') ||
                        node.children
                    )
                );
                modelAnalysis.boneCount = boneNodes.length;
                modelAnalysis.hasRig = boneNodes.length > 0;
            }

            // Check for skins (skeletal animation data)
            if (gltfData.skins) {
                modelAnalysis.hasRig = true;
                modelAnalysis.skinCount = gltfData.skins.length;
            }

            analysis.models[modelName] = modelAnalysis;
            analysis.summary.totalModels++;
            
            console.log(`  ✅ Animations: ${modelAnalysis.animationCount}`);
            console.log(`  ✅ Has Rig: ${modelAnalysis.hasRig}`);
            console.log(`  ✅ Meshes: ${modelAnalysis.meshes}`);
            if (modelAnalysis.animations.length > 0) {
                console.log(`  📋 Animation names:`);
                modelAnalysis.animations.forEach(anim => {
                    console.log(`     - ${anim.name}`);
                });
            }
            console.log('');
            
        } catch (error) {
            console.error(`❌ Error analyzing ${modelFile}:`, error.message);
            analysis.models[modelName] = {
                file: modelFile,
                error: error.message,
                hasAnimations: false,
                animationCount: 0,
                animations: []
            };
        }
    }

    // Find common animations across models
    if (analysis.summary.modelsWithAnimations > 0) {
        const allAnimations = Object.values(analysis.models)
            .filter(model => model.animations)
            .flatMap(model => model.animations.map(anim => anim.name));
        
        const animationCounts = {};
        allAnimations.forEach(name => {
            animationCounts[name] = (animationCounts[name] || 0) + 1;
        });
        
        analysis.summary.commonAnimations = Object.entries(animationCounts)
            .filter(([name, count]) => count > 1)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }

    // Write analysis to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(analysis, null, 2));
    
    console.log('📊 Analysis Summary:');
    console.log(`   Models analyzed: ${analysis.summary.totalModels}`);
    console.log(`   Models with animations: ${analysis.summary.modelsWithAnimations}`);
    console.log(`   Total animations found: ${analysis.summary.totalAnimations}`);
    
    if (analysis.summary.commonAnimations.length > 0) {
        console.log('   Common animations:');
        analysis.summary.commonAnimations.forEach(({ name, count }) => {
            console.log(`     - ${name} (${count} models)`);
        });
    }
    
    console.log(`\n💾 Detailed analysis saved to: ${OUTPUT_FILE}`);
    
    return analysis;
}

// Run the analysis
analyzeQuaterniusModels().catch(console.error);