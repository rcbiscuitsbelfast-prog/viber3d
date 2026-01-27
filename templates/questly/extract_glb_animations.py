#!/usr/bin/env python3
"""
GLB Animation Name Extractor
Extracts animation clip names from KayKit GLB files
"""

import os
import json
import struct
import re
from pathlib import Path

def read_glb_header(file_path):
    """Read GLB header to understand file structure"""
    with open(file_path, 'rb') as f:
        # GLB header: magic (4 bytes), version (4 bytes), length (4 bytes)
        magic = f.read(4)
        if magic != b'glTF':
            raise ValueError(f"Not a valid GLB file: {file_path}")
        
        version = struct.unpack('<I', f.read(4))[0]
        length = struct.unpack('<I', f.read(4))[0]
        
        return version, length

def extract_json_chunk(file_path):
    """Extract the JSON chunk from a GLB file"""
    with open(file_path, 'rb') as f:
        # Skip GLB header (12 bytes)
        f.seek(12)
        
        # Read chunk header: length (4 bytes), type (4 bytes)
        chunk_length = struct.unpack('<I', f.read(4))[0]
        chunk_type = f.read(4)
        
        if chunk_type == b'JSON':
            # Read the JSON data
            json_data = f.read(chunk_length).decode('utf-8')
            return json_data
        else:
            return None

def extract_animation_names_from_glb(file_path):
    """Extract animation names from a GLB file"""
    try:
        json_data = extract_json_chunk(file_path)
        if not json_data:
            return []
        
        # Parse the JSON
        gltf_data = json.loads(json_data)
        
        # Extract animation names
        animations = gltf_data.get('animations', [])
        animation_names = []
        
        for anim in animations:
            name = anim.get('name', 'Unnamed')
            animation_names.append(name)
        
        return animation_names
        
    except Exception as e:
        print(f"Error processing {file_path}: {e}")
        return []

def main():
    # Path to the KayKit GLB files
    glb_path = Path(__file__).parent / "../../Assets/KayKit_Character_Animations_1.1/Animations/gltf/Rig_Medium"
    
    glb_files = [
        'Rig_Medium_MovementBasic.glb',
        'Rig_Medium_MovementAdvanced.glb',
        'Rig_Medium_General.glb', 
        'Rig_Medium_CombatMelee.glb',
        'Rig_Medium_CombatRanged.glb',
        'Rig_Medium_Simulation.glb',
        'Rig_Medium_Special.glb',
        'Rig_Medium_Tools.glb'
    ]
    
    results = {}
    
    print("🔍 Analyzing GLB files for animation clip names...\n")
    
    for filename in glb_files:
        full_path = glb_path / filename
        
        print(f"📁 Processing: {filename}")
        
        if full_path.exists():
            animation_names = extract_animation_names_from_glb(full_path)
            results[filename] = animation_names
            
            if animation_names:
                print(f"   Found {len(animation_names)} animations:")
                for name in animation_names:
                    print(f"   - {name}")
            else:
                print("   No animations found")
        else:
            print("   ❌ File not found")
            results[filename] = None
        
        print("")
    
    # Write results to JSON file
    output_path = Path(__file__).parent / 'animation-audit-results.json'
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"📊 Analysis complete! Results saved to: {output_path}")
    
    # Summary
    print("\n=== SUMMARY ===")
    for filename, animations in results.items():
        if animations:
            print(f"\n{filename}:")
            for name in animations:
                print(f"  - {name}")

if __name__ == "__main__":
    main()