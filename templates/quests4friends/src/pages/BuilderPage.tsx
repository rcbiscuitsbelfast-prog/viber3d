import { useEffect } from 'react';
import { useBuilderStore } from '../store/builderStore';
import { BuilderHeader } from '../components/builder/BuilderHeader';
import { AssetPalette } from '../components/builder/AssetPalette';
import { BuilderCanvas } from '../components/builder/BuilderCanvas';
import { EntityPropertiesPanel } from '../components/builder/EntityPropertiesPanel';
import { TasksPanel } from '../components/builder/TasksPanel';
import { PreviewMode } from '../components/builder/PreviewMode';
import { AssetDefinition } from '../types/builder.types';
import * as THREE from 'three';

export function BuilderPage() {
  const { currentQuest, viewMode, createNewQuest, saveQuest } = useBuilderStore();
  const { addEntity } = useBuilderStore();

  useEffect(() => {
    // Initialize with a new quest if none exists
    if (!currentQuest) {
      createNewQuest();
    }
  }, [currentQuest, createNewQuest]);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentQuest) {
        saveQuest();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentQuest, saveQuest]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Save: Ctrl+S
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveQuest();
      }

      // Undo: Ctrl+Z
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        useBuilderStore.getState().undo();
      }

      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        useBuilderStore.getState().redo();
      }

      // Delete: Delete key
      if (e.key === 'Delete') {
        const selectedEntityId = useBuilderStore.getState().selectedEntityId;
        if (selectedEntityId) {
          e.preventDefault();
          if (confirm('Delete selected entity?')) {
            useBuilderStore.getState().deleteEntity(selectedEntityId);
          }
        }
      }

      // Preview: P key
      if (e.key === 'p' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const currentMode = useBuilderStore.getState().viewMode;
        useBuilderStore.getState().setViewMode(currentMode === 'preview' ? 'edit' : 'preview');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saveQuest]);

  const handleAssetDragStart = () => {
    // Asset drag started
  };

  const handleCanvasDrop = (position: THREE.Vector3, asset: AssetDefinition) => {
    // Create base entity
    const baseEntity = {
      type: asset.type,
      assetId: asset.assetId,
      position,
      rotation: new THREE.Vector3(0, 0, 0),
      scale: new THREE.Vector3(1, 1, 1),
    };

    // Add type-specific data and call addEntity with complete object
    if (asset.type === 'npc') {
      addEntity({
        ...baseEntity,
        npcData: {
          name: asset.name,
          dialog: ['Hello! How can I help you?'],
          interactionRadius: 2,
        },
      });
    } else if (asset.type === 'enemy' || asset.type === 'boss') {
      addEntity({
        ...baseEntity,
        enemyData: {
          name: asset.name,
          hp: asset.defaultStats?.hp || 50,
          maxHp: asset.defaultStats?.maxHp || 50,
          attackPattern: asset.defaultStats?.attackPattern || 'tap',
          attackDamage: asset.defaultStats?.attackDamage || 10,
          attackSpeed: asset.defaultStats?.attackSpeed || 1,
          isBoss: asset.type === 'boss',
        },
      });
    } else if (asset.type === 'collectible') {
      addEntity({
        ...baseEntity,
        collectibleData: {
          name: asset.name,
          collected: false,
          autoCollect: true,
          collectionRadius: 1,
        },
      });
    } else {
      addEntity(baseEntity);
    }
  };

  if (!currentQuest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl font-semibold">Initializing Quest Builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gray-200">
      {/* Preview Mode Overlay */}
      {viewMode === 'preview' && <PreviewMode />}

      {/* Header */}
      <BuilderHeader />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Asset Palette */}
        <AssetPalette onAssetDragStart={handleAssetDragStart} />

        {/* Center - Canvas */}
        <BuilderCanvas onDrop={handleCanvasDrop} />

        {/* Right Sidebar - Properties */}
        <EntityPropertiesPanel />
      </div>

      {/* Bottom Panel - Tasks */}
      <TasksPanel />
    </div>
  );
}
