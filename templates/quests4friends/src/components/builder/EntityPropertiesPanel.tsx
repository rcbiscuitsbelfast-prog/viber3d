import { useSelectedEntity } from '../../store/builderStore';
import { useBuilderStore } from '../../store/builderStore';

export function EntityPropertiesPanel() {
  const selectedEntity = useSelectedEntity();
  // Use individual selectors to avoid object recreation
  const updateEntity = useBuilderStore((state) => state.updateEntity);
  const deleteEntity = useBuilderStore((state) => state.deleteEntity);
  const duplicateEntity = useBuilderStore((state) => state.duplicateEntity);

  if (!selectedEntity) {
    return (
      <aside className="w-80 bg-gray-100 border-l border-gray-300 p-4">
        <div className="text-center text-gray-500 mt-8">
          <p className="text-sm">No entity selected</p>
          <p className="text-xs mt-2">Click an entity on the canvas to edit its properties</p>
        </div>
      </aside>
    );
  }

  const handlePositionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newPosition = selectedEntity.position.clone();
    newPosition[axis] = value;
    updateEntity(selectedEntity.id, {
      position: newPosition,
    });
  };

  const handleRotationChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newRotation = selectedEntity.rotation.clone();
    newRotation[axis] = value;
    updateEntity(selectedEntity.id, {
      rotation: newRotation,
    });
  };

  const handleScaleChange = (axis: 'x' | 'y' | 'z', value: number) => {
    const newScale = selectedEntity.scale.clone();
    newScale[axis] = value;
    updateEntity(selectedEntity.id, {
      scale: newScale,
    });
  };

  const handleNPCDataChange = (field: string, value: string | number | string[]) => {
    const updatedNPCData = {
      name: selectedEntity.npcData?.name,
      dialog: selectedEntity.npcData?.dialog || [],
      ...selectedEntity.npcData,
      [field]: value,
    };
    updateEntity(selectedEntity.id, {
      npcData: updatedNPCData,
    });
  };

  const handleEnemyDataChange = (field: string, value: string | number | boolean) => {
    const updatedEnemyData = {
      hp: selectedEntity.enemyData?.hp || 50,
      maxHp: selectedEntity.enemyData?.maxHp || 50,
      attackPattern: selectedEntity.enemyData?.attackPattern || 'tap' as const,
      attackDamage: selectedEntity.enemyData?.attackDamage || 10,
      attackSpeed: selectedEntity.enemyData?.attackSpeed || 1,
      ...selectedEntity.enemyData,
      [field]: value,
    };
    updateEntity(selectedEntity.id, {
      enemyData: updatedEnemyData,
    });
  };

  const handleCollectibleDataChange = (field: string, value: string | number | boolean) => {
    updateEntity(selectedEntity.id, {
      collectibleData: {
        ...selectedEntity.collectibleData,
        [field]: value,
      },
    });
  };

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this entity?')) {
      deleteEntity(selectedEntity.id);
    }
  };

  const handleDuplicate = () => {
    duplicateEntity(selectedEntity.id);
  };

  return (
    <aside className="w-80 bg-gray-100 border-l border-gray-300 flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-300 sticky top-0 z-10">
        <h2 className="text-lg font-bold text-gray-800 mb-2">Entity Properties</h2>
        <p className="text-xs text-gray-600">Type: {selectedEntity.type}</p>
        
        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleDuplicate}
            className="flex-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
          >
            📋 Duplicate
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Basic Transform */}
        <section className="bg-white rounded-lg p-3 shadow">
          <h3 className="font-semibold text-gray-800 mb-3 text-sm">Transform</h3>
          
          {/* Position */}
          <div className="space-y-2 mb-3">
            <label className="text-xs font-medium text-gray-700">Position</label>
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-4">{axis.toUpperCase()}</span>
                <input
                  type="number"
                  value={selectedEntity.position[axis].toFixed(2)}
                  onChange={(e) => handlePositionChange(axis, parseFloat(e.target.value) || 0)}
                  step="0.1"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            ))}
          </div>

          {/* Rotation */}
          <div className="space-y-2 mb-3">
            <label className="text-xs font-medium text-gray-700">Rotation (degrees)</label>
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-4">{axis.toUpperCase()}</span>
                <input
                  type="number"
                  value={(selectedEntity.rotation[axis] * (180 / Math.PI)).toFixed(1)}
                  onChange={(e) => handleRotationChange(axis, (parseFloat(e.target.value) || 0) * (Math.PI / 180))}
                  step="1"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            ))}
          </div>

          {/* Scale */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700">Scale</label>
            {(['x', 'y', 'z'] as const).map((axis) => (
              <div key={axis} className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-600 w-4">{axis.toUpperCase()}</span>
                <input
                  type="number"
                  value={selectedEntity.scale[axis].toFixed(2)}
                  onChange={(e) => handleScaleChange(axis, parseFloat(e.target.value) || 1)}
                  step="0.1"
                  min="0.1"
                  className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            ))}
          </div>
        </section>

        {/* NPC Data */}
        {(selectedEntity.type === 'npc') && (
          <section className="bg-white rounded-lg p-3 shadow">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">NPC Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={selectedEntity.npcData?.name || ''}
                  onChange={(e) => handleNPCDataChange('name', e.target.value)}
                  placeholder="NPC Name"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Dialogue</label>
                <textarea
                  value={selectedEntity.npcData?.dialog?.[0] || ''}
                  onChange={(e) => handleNPCDataChange('dialog', [e.target.value])}
                  placeholder="Enter NPC dialogue..."
                  rows={4}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Interaction Radius</label>
                <input
                  type="number"
                  value={selectedEntity.npcData?.interactionRadius || 2}
                  onChange={(e) => handleNPCDataChange('interactionRadius', parseFloat(e.target.value) || 2)}
                  step="0.5"
                  min="0.5"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>
            </div>
          </section>
        )}

        {/* Enemy Data */}
        {(selectedEntity.type === 'enemy' || selectedEntity.type === 'boss') && (
          <section className="bg-white rounded-lg p-3 shadow">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Enemy Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={selectedEntity.enemyData?.name || ''}
                  onChange={(e) => handleEnemyDataChange('name', e.target.value)}
                  placeholder="Enemy Name"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">HP: {selectedEntity.enemyData?.hp || 50}</label>
                <input
                  type="range"
                  value={selectedEntity.enemyData?.hp || 50}
                  onChange={(e) => {
                    const hp = parseInt(e.target.value);
                    handleEnemyDataChange('hp', hp);
                    handleEnemyDataChange('maxHp', hp);
                  }}
                  min="10"
                  max="500"
                  step="10"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Attack Damage: {selectedEntity.enemyData?.attackDamage || 10}</label>
                <input
                  type="range"
                  value={selectedEntity.enemyData?.attackDamage || 10}
                  onChange={(e) => handleEnemyDataChange('attackDamage', parseInt(e.target.value))}
                  min="5"
                  max="50"
                  step="5"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Attack Speed: {(selectedEntity.enemyData?.attackSpeed || 1).toFixed(1)}</label>
                <input
                  type="range"
                  value={selectedEntity.enemyData?.attackSpeed || 1}
                  onChange={(e) => handleEnemyDataChange('attackSpeed', parseFloat(e.target.value))}
                  min="0.5"
                  max="2"
                  step="0.1"
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Attack Pattern</label>
                <select
                  value={selectedEntity.enemyData?.attackPattern || 'tap'}
                  onChange={(e) => handleEnemyDataChange('attackPattern', e.target.value)}
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="tap">Tap</option>
                  <option value="timing">Timing</option>
                  <option value="dodge">Dodge</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEntity.enemyData?.isBoss || false}
                  onChange={(e) => handleEnemyDataChange('isBoss', e.target.checked)}
                  className="rounded"
                />
                <label className="text-xs font-medium text-gray-700">Is Boss</label>
              </div>
            </div>
          </section>
        )}

        {/* Collectible Data */}
        {selectedEntity.type === 'collectible' && (
          <section className="bg-white rounded-lg p-3 shadow">
            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Collectible Settings</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Name</label>
                <input
                  type="text"
                  value={selectedEntity.collectibleData?.name || ''}
                  onChange={(e) => handleCollectibleDataChange('name', e.target.value)}
                  placeholder="Collectible Name"
                  className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedEntity.collectibleData?.autoCollect || false}
                  onChange={(e) => handleCollectibleDataChange('autoCollect', e.target.checked)}
                  className="rounded"
                />
                <label className="text-xs font-medium text-gray-700">Auto-collect</label>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-700 block mb-1">Collection Radius: {selectedEntity.collectibleData?.collectionRadius || 1}</label>
                <input
                  type="range"
                  value={selectedEntity.collectibleData?.collectionRadius || 1}
                  onChange={(e) => handleCollectibleDataChange('collectionRadius', parseFloat(e.target.value))}
                  min="0.5"
                  max="5"
                  step="0.5"
                  className="w-full"
                />
              </div>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
}
