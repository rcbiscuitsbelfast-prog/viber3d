import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { create3DText } from './create3DText';
import { resolveAssetPath } from '@/lib/paths';



export function Font3DText(props: {
  text: string;
  position?: [number, number, number];
  color?: string;
  height?: number;
  bevelSize?: number;
  bevelThickness?: number;
  bevelSegments?: number;
  bevelOffset?: number;
  curveSegments?: number;
  size?: number;
  bevelEnabled?: boolean;
  rotation?: [number, number, number];
  fontUrl?: string;
  textureUrl?: string;
  bumpMapUrl?: string;
  roughnessMapUrl?: string;
  textureRepeat?: [number, number];
  materialType?: 'standard' | 'toon';
  gradientMapUrl?: string;
  edgeColor?: string;
  outlineEnabled?: boolean;
  outlineColor?: string;
  outlineThickness?: number;
  outlineOffset?: number;
  [key: string]: any;
}) {
  const {
    text,
    position = [0, 0, 0],
    color = '#FFD700',
    height = 0.1,
    bevelSize = 0.02,
    bevelThickness = 0.03,
    bevelSegments = 5,
    bevelOffset = 0,
    curveSegments = 12,
    size = 1.2,
    bevelEnabled = false,
    rotation = [0, 0, 0],
    fontUrl = resolveAssetPath('/fonts/gentilis_regular.typeface.json'),
    textureUrl,
    bumpMapUrl,
    roughnessMapUrl,
    textureRepeat = [1, 1],
    materialType = 'standard',
    gradientMapUrl,
    edgeColor,
    outlineEnabled = false,
    outlineColor = '#111111',
    outlineThickness = 0.035,
    outlineOffset = 0.02,
    ...rest
  } = props;
  const meshRef = useRef<THREE.Mesh>(null);
  const [mesh, setMesh] = useState<THREE.Mesh | null>(null);
  const [outlineMesh, setOutlineMesh] = useState<THREE.Mesh | null>(null);

  useEffect(() => {
    let mounted = true;
    // Debug: log all geometry params
    console.log('[Font3DText] params:', {
      text,
      size,
      height,
      curveSegments,
      bevelEnabled,
      bevelThickness,
      bevelSize,
      bevelSegments,
      bevelOffset,
      fontUrl
    });
    const loadTexture = (url?: string) => {
      if (!url) return Promise.resolve(null);
      const loader = new THREE.TextureLoader();
      return new Promise<THREE.Texture>((resolve, reject) => {
        loader.load(url, resolve, undefined, reject);
      });
    };

    const loadMaterial = async () => {
      const [map, bumpMap, roughnessMap, gradientMap] = await Promise.all([
        loadTexture(textureUrl),
        loadTexture(bumpMapUrl),
        loadTexture(roughnessMapUrl),
        loadTexture(gradientMapUrl)
      ]);

      const textures = [map, bumpMap, roughnessMap].filter(Boolean) as THREE.Texture[];
      textures.forEach((tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(textureRepeat[0], textureRepeat[1]);
        tex.needsUpdate = true;
      });

      if (gradientMap) {
        gradientMap.minFilter = THREE.NearestFilter;
        gradientMap.magFilter = THREE.NearestFilter;
      }

      let frontMaterial: THREE.Material;
      if (materialType === 'toon') {
        frontMaterial = new THREE.MeshToonMaterial({
          color,
          map: map || undefined,
          gradientMap: gradientMap || undefined
        });
      } else {
        frontMaterial = new THREE.MeshStandardMaterial({
          color,
          metalness: 0.2,
          roughness: 0.9,
          map: map || undefined,
          bumpMap: bumpMap || undefined,
          bumpScale: bumpMap ? 0.06 : 0,
          roughnessMap: roughnessMap || undefined
        });
      }

      // If edgeColor is specified, create a material array
      if (edgeColor) {
        const edgeMaterial = materialType === 'toon' 
          ? new THREE.MeshToonMaterial({ color: edgeColor, gradientMap: gradientMap || undefined })
          : new THREE.MeshBasicMaterial({ color: edgeColor });
        return [frontMaterial, edgeMaterial];
      }

      return frontMaterial;
    };

    loadMaterial().then((material) =>
      create3DText({
        text,
        fontUrl,
        size,
        height,
        curveSegments,
        bevelEnabled,
        bevelThickness,
        bevelSize,
        bevelSegments,
        bevelOffset,
        material
      })
    ).then((createdMesh) => {
      if (mounted) {
        // Log bounding box after mesh creation
        createdMesh.geometry.computeBoundingBox();
        if (createdMesh.geometry.boundingBox) {
          const sizeVec = new THREE.Vector3();
          createdMesh.geometry.boundingBox.getSize(sizeVec);
          console.log('[Font3DText] mesh bounding box size:', sizeVec, 'height param:', height);
          // --- Normalize Z scale so bounding box Z matches height param ---
          if (sizeVec.z !== 0 && Math.abs(sizeVec.z - height) > 1e-6) {
            const scaleZ = height / sizeVec.z;
            createdMesh.scale.set(1, 1, scaleZ);
            // Recompute bounding box after scaling for debug
            const scaledBox = new THREE.Box3().setFromObject(createdMesh);
            const scaledSize = new THREE.Vector3();
            scaledBox.getSize(scaledSize);
            console.log('[Font3DText] normalized bounding box size:', scaledSize, 'target height:', height);
          }
        }
        setMesh(createdMesh);

        if (outlineEnabled) {
          const outlineMat = new THREE.MeshBasicMaterial({
            color: outlineColor,
            side: THREE.BackSide
          });
          const outline = new THREE.Mesh(createdMesh.geometry, outlineMat);
          outline.position.set(0, 0, 0);
          outline.rotation.copy(createdMesh.rotation);
          outline.scale.copy(createdMesh.scale).multiplyScalar(1 + outlineThickness);
          setOutlineMesh(outline);
        } else {
          setOutlineMesh(null);
        }
      }
    });
    return () => { mounted = false; };
  }, [text, color, size, height, curveSegments, bevelEnabled, bevelThickness, bevelSize, bevelSegments, bevelOffset, fontUrl, textureUrl, bumpMapUrl, roughnessMapUrl, textureRepeat, materialType, gradientMapUrl, edgeColor, outlineEnabled, outlineColor, outlineThickness, outlineOffset]);

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
    }
  }, [rotation]);

  if (!mesh) return null;
  return (
    <group position={position} {...rest}>
      {outlineMesh && <primitive object={outlineMesh} />}
      <primitive object={mesh} ref={meshRef} />
    </group>
  );
}