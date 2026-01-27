// Physics World System using Cannon-ES
// Provides physics simulation for terrain, character, and objects

import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as CANNON from 'cannon-es';
import * as THREE from 'three';

interface PhysicsWorldConfig {
  gravity?: [number, number, number];
  enableCharacterPhysics?: boolean;
}

export function usePhysicsWorld(config: PhysicsWorldConfig = {}) {
  const worldRef = useRef<CANNON.World | null>(null);
  const bodiesRef = useRef<Map<string, CANNON.Body>>(new Map());

  useEffect(() => {
    // Initialize physics world
    const world = new CANNON.World({
      gravity: new CANNON.Vec3(
        config.gravity?.[0] ?? 0,
        config.gravity?.[1] ?? -9.82,
        config.gravity?.[2] ?? 0
      ),
    });

    // Use more accurate solver for better stability
    world.solver.iterations = 10;
    world.solver.tolerance = 0.1;

    // Use SAP (Sweep and Prune) broadphase for better performance
    world.broadphase = new CANNON.SAPBroadphase(world);

    worldRef.current = world;

    return () => {
      // Cleanup: remove all bodies
      world.bodies.forEach((body) => {
        world.removeBody(body);
      });
      worldRef.current = null;
    };
  }, []);

  // Update physics simulation
  useFrame((_state, delta) => {
    if (worldRef.current) {
      // Step physics simulation
      worldRef.current.step(1 / 60, delta, 3);
    }
  });

  // Add terrain body from heightmap
  const addTerrainBody = (
    terrainMesh: THREE.Mesh,
    heightData: Float32Array,
    size: number,
    resolution: number
  ) => {
    if (!worldRef.current || !terrainMesh) return null;

    // Create heightfield shape from heightmap data
    const shape = new CANNON.Heightfield(
      Array.from({ length: resolution }, (_, i) =>
        Array.from({ length: resolution }, (_, j) => {
          const idx = i * resolution + j;
          return heightData[idx] || 0;
        })
      ),
      {
        elementSize: size / resolution,
      }
    );

    const body = new CANNON.Body({ mass: 0 }); // Static body
    body.addShape(shape);
    
    // Position body to match terrain mesh
    const terrainPos = terrainMesh.position;
    const terrainRot = terrainMesh.rotation;
    body.position.set(terrainPos.x, terrainPos.y, terrainPos.z);
    body.quaternion.setFromEuler(terrainRot.x, terrainRot.y, terrainRot.z);

    worldRef.current.addBody(body);
    bodiesRef.current.set('terrain', body);

    return body;
  };

  // Add character physics body
  const addCharacterBody = (
    position: [number, number, number],
    radius: number = 0.5,
    height: number = 1.8
  ) => {
    if (!worldRef.current) return null;

    const shape = new CANNON.Cylinder(radius, radius, height, 8);
    const body = new CANNON.Body({ mass: 1 });
    body.addShape(shape);
    body.position.set(position[0], position[1], position[2]);
    body.fixedRotation = true; // Prevent character from tipping over
    body.material = new CANNON.Material('character');
    body.material.friction = 0.1;
    body.material.restitution = 0;

    worldRef.current.addBody(body);
    bodiesRef.current.set('character', body);

    return body;
  };

  // Add static object body (for trees, rocks, etc.)
  const addStaticBody = (
    id: string,
    position: [number, number, number],
    shape: CANNON.Shape,
    rotation?: [number, number, number]
  ) => {
    if (!worldRef.current) return null;

    const body = new CANNON.Body({ mass: 0 }); // Static
    body.addShape(shape);
    body.position.set(position[0], position[1], position[2]);
    if (rotation) {
      body.quaternion.setFromEuler(rotation[0], rotation[1], rotation[2]);
    }

    worldRef.current.addBody(body);
    bodiesRef.current.set(id, body);

    return body;
  };

  // Remove body
  const removeBody = (id: string) => {
    const body = bodiesRef.current.get(id);
    if (body && worldRef.current) {
      worldRef.current.removeBody(body);
      bodiesRef.current.delete(id);
    }
  };

  // Get body by ID
  const getBody = (id: string) => {
    return bodiesRef.current.get(id) || null;
  };

  return {
    world: worldRef.current,
    addTerrainBody,
    addCharacterBody,
    addStaticBody,
    removeBody,
    getBody,
  };
}
