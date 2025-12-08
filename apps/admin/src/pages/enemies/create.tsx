/**
 * Enemy Creator Page
 *
 * Create enemies with stats, AI behavior, loot tables, and spawn rules.
 * Enemies can be used in quests and random encounters.
 */

import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';

interface EnemyData {
  id: string;
  name: string;
  description: string;
  type: 'melee' | 'ranged' | 'magic' | 'boss' | 'elite';
  level: number;
  stats: {
    hp: number;
    atk: number;
    def: number;
    spd: number;
    mana?: number;
  };
  abilities: string[];
  aiProfile: {
    aggression: number; // 0-100
    intelligence: number; // 0-100
    preferredRange: 'close' | 'medium' | 'far';
    tactics: string[];
  };
  lootTable: Array<{
    itemId: string;
    dropChance: number; // 0-100
    minQuantity: number;
    maxQuantity: number;
  }>;
  spawnRules: {
    minPlayerLevel: number;
    maxPlayerLevel?: number;
    spawnChance: number; // 0-100
    groupSize: { min: number; max: number };
  };
}

export default function EnemyCreatePage() {
  const [enemyData, setEnemyData] = useState<EnemyData>({
    id: '',
    name: '',
    description: '',
    type: 'melee',
    level: 1,
    stats: {
      hp: 50,
      atk: 10,
      def: 5,
      spd: 5,
    },
    abilities: [],
    aiProfile: {
      aggression: 50,
      intelligence: 50,
      preferredRange: 'close',
      tactics: [],
    },
    lootTable: [],
    spawnRules: {
      minPlayerLevel: 1,
      spawnChance: 100,
      groupSize: { min: 1, max: 1 },
    },
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const id = enemyData.id || `enemy_${Date.now()}`;
      const enemy = { ...enemyData, id };

      // TODO: Save to Firebase
      console.log('Saving enemy:', enemy);
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to save enemy:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEnemyData({
      id: '',
      name: '',
      description: '',
      type: 'melee',
      level: 1,
      stats: { hp: 50, atk: 10, def: 5, spd: 5 },
      abilities: [],
      aiProfile: {
        aggression: 50,
        intelligence: 50,
        preferredRange: 'close',
        tactics: [],
      },
      lootTable: [],
      spawnRules: {
        minPlayerLevel: 1,
        spawnChance: 100,
        groupSize: { min: 1, max: 1 },
      },
    });
  };

  const updateField = <K extends keyof EnemyData>(field: K, value: EnemyData[K]) => {
    setEnemyData({ ...enemyData, [field]: value });
  };

  const addLootItem = () => {
    setEnemyData({
      ...enemyData,
      lootTable: [
        ...enemyData.lootTable,
        { itemId: '', dropChance: 50, minQuantity: 1, maxQuantity: 1 },
      ],
    });
  };

  const removeLootItem = (index: number) => {
    setEnemyData({
      ...enemyData,
      lootTable: enemyData.lootTable.filter((_, i) => i !== index),
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Create Enemy - Admin Panel</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Enemy Creator</h1>
            <p className="text-gray-400 mt-1">
              Create enemies for battles and encounters
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Clear
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className={`px-6 py-2 rounded-lg font-semibold transition ${
                saveStatus === 'success'
                  ? 'bg-green-600 text-white'
                  : saveStatus === 'error'
                  ? 'bg-red-600 text-white'
                  : 'bg-primary hover:bg-blue-600 text-white'
              }`}
            >
              {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Saved!' : 'Save Enemy'}
            </button>
          </div>
        </div>

        {/* Basic Info */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Basic Information</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enemy ID
                </label>
                <input
                  type="text"
                  value={enemyData.id}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="goblin_warrior_01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Enemy Name *
                </label>
                <input
                  type="text"
                  value={enemyData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="Goblin Warrior"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={enemyData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white h-20"
                placeholder="A fierce goblin warrior armed with a rusty blade..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={enemyData.type}
                  onChange={(e) => updateField('type', e.target.value as any)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                >
                  <option value="melee">⚔️ Melee</option>
                  <option value="ranged">🏹 Ranged</option>
                  <option value="magic">✨ Magic</option>
                  <option value="elite">⭐ Elite</option>
                  <option value="boss">👑 Boss</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <input
                  type="number"
                  min="1"
                  value={enemyData.level}
                  onChange={(e) => updateField('level', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Combat Stats</h2>
          <div className="grid grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">HP</label>
              <input
                type="number"
                min="1"
                value={enemyData.stats.hp}
                onChange={(e) =>
                  updateField('stats', {
                    ...enemyData.stats,
                    hp: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">ATK</label>
              <input
                type="number"
                min="0"
                value={enemyData.stats.atk}
                onChange={(e) =>
                  updateField('stats', {
                    ...enemyData.stats,
                    atk: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">DEF</label>
              <input
                type="number"
                min="0"
                value={enemyData.stats.def}
                onChange={(e) =>
                  updateField('stats', {
                    ...enemyData.stats,
                    def: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">SPD</label>
              <input
                type="number"
                min="0"
                value={enemyData.stats.spd}
                onChange={(e) =>
                  updateField('stats', {
                    ...enemyData.stats,
                    spd: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                MANA (optional)
              </label>
              <input
                type="number"
                min="0"
                value={enemyData.stats.mana || ''}
                onChange={(e) =>
                  updateField('stats', {
                    ...enemyData.stats,
                    mana: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        {/* AI Behavior */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">AI Behavior</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Aggression (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enemyData.aiProfile.aggression}
                  onChange={(e) =>
                    updateField('aiProfile', {
                      ...enemyData.aiProfile,
                      aggression: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-white">{enemyData.aiProfile.aggression}%</span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Intelligence (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={enemyData.aiProfile.intelligence}
                  onChange={(e) =>
                    updateField('aiProfile', {
                      ...enemyData.aiProfile,
                      intelligence: parseInt(e.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-white">{enemyData.aiProfile.intelligence}%</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Preferred Range
              </label>
              <select
                value={enemyData.aiProfile.preferredRange}
                onChange={(e) =>
                  updateField('aiProfile', {
                    ...enemyData.aiProfile,
                    preferredRange: e.target.value as any,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              >
                <option value="close">Close (Melee)</option>
                <option value="medium">Medium</option>
                <option value="far">Far (Ranged)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loot Table */}
        <div className="bg-accent rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Loot Table</h2>
            <button
              onClick={addLootItem}
              className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition"
            >
              + Add Loot
            </button>
          </div>

          {enemyData.lootTable.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No loot configured. Add items that drop when defeated.
            </div>
          ) : (
            <div className="space-y-3">
              {enemyData.lootTable.map((loot, index) => (
                <div key={index} className="flex gap-3 items-center bg-darker p-3 rounded-lg">
                  <input
                    type="text"
                    placeholder="Item ID"
                    value={loot.itemId}
                    onChange={(e) => {
                      const updated = [...enemyData.lootTable];
                      updated[index].itemId = e.target.value;
                      updateField('lootTable', updated);
                    }}
                    className="flex-1 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Drop %"
                    min="0"
                    max="100"
                    value={loot.dropChance}
                    onChange={(e) => {
                      const updated = [...enemyData.lootTable];
                      updated[index].dropChance = parseInt(e.target.value) || 0;
                      updateField('lootTable', updated);
                    }}
                    className="w-20 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Min"
                    min="1"
                    value={loot.minQuantity}
                    onChange={(e) => {
                      const updated = [...enemyData.lootTable];
                      updated[index].minQuantity = parseInt(e.target.value) || 1;
                      updateField('lootTable', updated);
                    }}
                    className="w-16 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    min="1"
                    value={loot.maxQuantity}
                    onChange={(e) => {
                      const updated = [...enemyData.lootTable];
                      updated[index].maxQuantity = parseInt(e.target.value) || 1;
                      updateField('lootTable', updated);
                    }}
                    className="w-16 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <button
                    onClick={() => removeLootItem(index)}
                    className="text-red-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Spawn Rules */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Spawn Rules</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Min Player Level
              </label>
              <input
                type="number"
                min="1"
                value={enemyData.spawnRules.minPlayerLevel}
                onChange={(e) =>
                  updateField('spawnRules', {
                    ...enemyData.spawnRules,
                    minPlayerLevel: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Max Player Level (optional)
              </label>
              <input
                type="number"
                min="1"
                value={enemyData.spawnRules.maxPlayerLevel || ''}
                onChange={(e) =>
                  updateField('spawnRules', {
                    ...enemyData.spawnRules,
                    maxPlayerLevel: e.target.value ? parseInt(e.target.value) : undefined,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                placeholder="No limit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Spawn Chance (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={enemyData.spawnRules.spawnChance}
                onChange={(e) =>
                  updateField('spawnRules', {
                    ...enemyData.spawnRules,
                    spawnChance: parseInt(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Min Group Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={enemyData.spawnRules.groupSize.min}
                  onChange={(e) =>
                    updateField('spawnRules', {
                      ...enemyData.spawnRules,
                      groupSize: {
                        ...enemyData.spawnRules.groupSize,
                        min: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Max Group Size
                </label>
                <input
                  type="number"
                  min="1"
                  value={enemyData.spawnRules.groupSize.max}
                  onChange={(e) =>
                    updateField('spawnRules', {
                      ...enemyData.spawnRules,
                      groupSize: {
                        ...enemyData.spawnRules.groupSize,
                        max: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
          <pre className="bg-darker p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
            {JSON.stringify(enemyData, null, 2)}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
