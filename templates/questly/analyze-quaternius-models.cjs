/**
 * Quaternius Model Animation Analyzer - CommonJS version
 */

const fs = require('fs');
const path = require('path');

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
            commonAnimations: [],
            animationType: 'unknown'
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

            const gltfContent = fs.readFileSync(modelPath, 'utf8');
            const gltfData = JSON.parse(gltfContent);
            
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
                boneCount: 0,
                skinCount: 0
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
                        samplers: anim.samplers ? anim.samplers.length : 0,
                        duration: calculateAnimationDuration(anim)
                    });
                });
                
                analysis.summary.modelsWithAnimations++;
                analysis.summary.totalAnimations += modelAnalysis.animationCount;
            }

            // Check for skeletal structure (bones/joints)
            if (gltfData.nodes) {
                const potentialBones = gltfData.nodes.filter(node => 
                    node.name && (
                        node.name.toLowerCase().includes('bone') ||
                        node.name.toLowerCase().includes('joint') ||
                        node.name.toLowerCase().includes('armature') ||
                        (node.children && node.children.length > 0)
                    )
                );
                modelAnalysis.boneCount = potentialBones.length;
                modelAnalysis.hasRig = potentialBones.length > 0;
            }

            // Check for skins (skeletal animation data)
            if (gltfData.skins) {
                modelAnalysis.hasRig = true;
                modelAnalysis.skinCount = gltfData.skins.length;
            }

            analysis.models[modelName] = modelAnalysis;
            analysis.summary.totalModels++;
            
            console.log(`  ✅ Animations: ${modelAnalysis.animationCount}`);
            console.log(`  ✅ Has Rig: ${modelAnalysis.hasRig} (Bones: ${modelAnalysis.boneCount}, Skins: ${modelAnalysis.skinCount})`);
            console.log(`  ✅ Meshes: ${modelAnalysis.meshes}, Nodes: ${modelAnalysis.nodes}`);
            
            if (modelAnalysis.animations.length > 0) {
                console.log(`  📋 Animation names:`);
                modelAnalysis.animations.forEach(anim => {
                    console.log(`     - ${anim.name} (${anim.channels} channels, ${anim.samplers} samplers)`);
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

    // Determine animation type based on findings
    if (analysis.summary.modelsWithAnimations === 0) {
        analysis.summary.animationType = 'static_models';
        analysis.summary.description = 'Static models - no embedded animations found';
    } else if (analysis.summary.modelsWithAnimations === analysis.summary.totalModels) {
        analysis.summary.animationType = 'embedded_single_animation';
        analysis.summary.description = 'Each model has embedded animation data';
    } else {
        analysis.summary.animationType = 'mixed';
        analysis.summary.description = 'Some models have animations, others are static';
    }

    // Find common animations across models
    if (analysis.summary.modelsWithAnimations > 0) {
        const allAnimations = Object.values(analysis.models)
            .filter(model => model.animations && model.animations.length > 0)
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
    console.log(`   Animation Type: ${analysis.summary.animationType}`);
    console.log(`   Description: ${analysis.summary.description}`);
    
    if (analysis.summary.commonAnimations.length > 0) {
        console.log('   Common animations:');
        analysis.summary.commonAnimations.forEach(({ name, count }) => {
            console.log(`     - ${name} (${count} models)`);
        });
    } else {
        console.log('   No common animations found across models');
    }
    
    console.log(`\n💾 Detailed analysis saved to: ${OUTPUT_FILE}`);
    
    return analysis;
}

function calculateAnimationDuration(animation) {
    if (!animation.samplers) return 0;
    
    let maxTime = 0;
    animation.samplers.forEach(sampler => {
        // This would require reading accessor data to get actual duration
        // For now, just return a placeholder
        maxTime = Math.max(maxTime, 1); // Default 1 second
    });
    
    return maxTime;
}

// Run the analysis
analyzeQuaterniusModels()
    .then(() => {
        console.log('✅ Analysis completed successfully!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Analysis failed:', error);
        process.exit(1);
    });