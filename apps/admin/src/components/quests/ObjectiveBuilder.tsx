/**
 * ObjectiveBuilder Component
 *
 * Build quest objectives with all supported types:
 * - Battle (defeat enemies)
 * - Location (visit a place)
 * - Fitness (walk/run distance)
 * - Collection (collect items)
 * - Geocache (find hidden cache)
 */

import { useState } from 'react';
import type { QuestObjective } from '@rov/types';

interface ObjectiveBuilderProps {
  objectives: QuestObjective[];
  onChange: (objectives: QuestObjective[]) => void;
}

type ObjectiveType = 'battle' | 'location' | 'fitness' | 'collection' | 'geocache' | 'distance';

export function ObjectiveBuilder({ objectives, onChange }: ObjectiveBuilderProps) {
  const [selectedType, setSelectedType] = useState<ObjectiveType>('battle');

  const addObjective = (type: ObjectiveType) => {
    const newObjective: Partial<QuestObjective> = {
      id: `obj_${Date.now()}`,
      type: type as any,
      description: '',
      required: true,
    };

    // Add type-specific defaults
    switch (type) {
      case 'battle':
        Object.assign(newObjective, {
          enemyType: 'goblin',
          count: 5,
          minLevel: 1,
        });
        break;
      case 'location':
        Object.assign(newObjective, {
          latitude: 0,
          longitude: 0,
          radius: 50,
        });
        break;
      case 'fitness':
        Object.assign(newObjective, {
          activity: 'walking',
          distance: 1000,
        });
        break;
      case 'collection':
        Object.assign(newObjective, {
          itemId: '',
          count: 10,
        });
        break;
      case 'geocache':
        Object.assign(newObjective, {
          cacheId: '',
          location: { lat: 0, lng: 0 },
          hint: '',
        });
        break;
      case 'distance':
        Object.assign(newObjective, {
          distance: 500,
        });
        break;
    }

    onChange([...objectives, newObjective as QuestObjective]);
  };

  const removeObjective = (index: number) => {
    onChange(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, updates: Partial<QuestObjective>) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Add Objective Controls */}
      <div className="flex gap-3">
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as ObjectiveType)}
          className="px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
        >
          <option value="battle">⚔️ Battle Objective</option>
          <option value="location">📍 Location Objective</option>
          <option value="fitness">🏃 Fitness Objective</option>
          <option value="collection">📦 Collection Objective</option>
          <option value="geocache">🗺️ Geocache Objective</option>
          <option value="distance">📏 Distance Objective</option>
        </select>
        <button
          onClick={() => addObjective(selectedType)}
          className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
        >
          + Add Objective
        </button>
      </div>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No objectives yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective, index) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              index={index}
              onUpdate={(updates) => updateObjective(index, updates)}
              onRemove={() => removeObjective(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ObjectiveCard({
  objective,
  index,
  onUpdate,
  onRemove,
}: {
  objective: QuestObjective;
  index: number;
  onUpdate: (updates: Partial<QuestObjective>) => void;
  onRemove: () => void;
}) {
  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      battle: '⚔️',
      location: '📍',
      fitness: '🏃',
      collection: '📦',
      geocache: '🗺️',
      distance: '📏',
    };
    return icons[type] || '📌';
  };

  return (
    <div className="bg-darker border border-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getTypeIcon(objective.type)}</span>
          <h4 className="font-semibold text-white capitalize">
            Objective {index + 1}: {objective.type}
          </h4>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-400 transition"
        >
          ✕ Remove
        </button>
      </div>

      {/* Common Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <input
            type="text"
            value={objective.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
            placeholder="Defeat 5 goblins"
          />
        </div>

        {/* Type-Specific Fields */}
        {objective.type === 'battle' && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Enemy Type</label>
                <input
                  type="text"
                  value={(objective as any).enemyType || ''}
                  onChange={(e) => onUpdate({ enemyType: e.target.value } as any)}
                  className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Count</label>
                <input
                  type="number"
                  min="1"
                  value={(objective as any).count || 1}
                  onChange={(e) => onUpdate({ count: parseInt(e.target.value) } as any)}
                  className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Min Level</label>
                <input
                  type="number"
                  min="1"
                  value={(objective as any).minLevel || 1}
                  onChange={(e) => onUpdate({ minLevel: parseInt(e.target.value) } as any)}
                  className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
                />
              </div>
            </div>
          </>
        )}

        {objective.type === 'location' && (
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={(objective as any).latitude || 0}
                onChange={(e) => onUpdate({ latitude: parseFloat(e.target.value) } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={(objective as any).longitude || 0}
                onChange={(e) => onUpdate({ longitude: parseFloat(e.target.value) } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Radius (m)</label>
              <input
                type="number"
                min="1"
                value={(objective as any).radius || 50}
                onChange={(e) => onUpdate({ radius: parseInt(e.target.value) } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        )}

        {objective.type === 'fitness' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Activity</label>
              <select
                value={(objective as any).activity || 'walking'}
                onChange={(e) => onUpdate({ activity: e.target.value } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              >
                <option value="walking">Walking</option>
                <option value="running">Running</option>
                <option value="cycling">Cycling</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Distance (meters)</label>
              <input
                type="number"
                min="1"
                value={(objective as any).distance || 1000}
                onChange={(e) => onUpdate({ distance: parseInt(e.target.value) } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        )}

        {objective.type === 'collection' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Item ID</label>
              <input
                type="text"
                value={(objective as any).itemId || ''}
                onChange={(e) => onUpdate({ itemId: e.target.value } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Count</label>
              <input
                type="number"
                min="1"
                value={(objective as any).count || 10}
                onChange={(e) => onUpdate({ count: parseInt(e.target.value) } as any)}
                className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
              />
            </div>
          </div>
        )}

        {objective.type === 'distance' && (
          <div>
            <label className="block text-sm text-gray-400 mb-1">Distance (meters)</label>
            <input
              type="number"
              min="1"
              value={(objective as any).distance || 500}
              onChange={(e) => onUpdate({ distance: parseInt(e.target.value) } as any)}
              className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
}
