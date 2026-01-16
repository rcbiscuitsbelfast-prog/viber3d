import { useEffect, useState } from 'react';
import { Entity } from '../../types/quest.types';
import { NPCEntity } from './entities/NPCEntity';
import { EnemyEntity } from './entities/EnemyEntity';
import { CollectibleEntity } from './entities/CollectibleEntity';
import * as THREE from 'three';
import { assetRegistry } from '../../systems/assets/AssetRegistry';

interface QuestEntitiesProps {
  entities: Entity[];
}

export function QuestEntities({ entities }: QuestEntitiesProps) {
  return (
    <group>
      {entities.map((entity) => {
        switch (entity.type) {
          case 'npc':
            return <NPCEntity key={entity.id} entity={entity} />;
          
          case 'enemy':
          case 'boss':
            return <EnemyEntity key={entity.id} entity={entity} />;
          
          case 'collectible':
            return <CollectibleEntity key={entity.id} entity={entity} />;
          
          case 'object':
            return <ObjectEntity key={entity.id} entity={entity} />;
          
          default:
            return null;
        }
      })}
    </group>
  );
}

// Simple object entity (non-interactive decoration)
function ObjectEntity({ entity }: { entity: Entity }) {
  const [model, setModel] = useState<THREE.Group | null>(null);

  useEffect(() => {
    assetRegistry.loadModel(entity.assetId)
      .then((loaded: any) => setModel(loaded as THREE.Group))
      .catch(console.error);
  }, [entity.assetId]);

  if (!model) return null;

  return (
    <primitive
      object={model}
      position={entity.position.toArray()}
      rotation={entity.rotation.toArray()}
      scale={entity.scale.toArray()}
      castShadow
      receiveShadow
    />
  );
}
