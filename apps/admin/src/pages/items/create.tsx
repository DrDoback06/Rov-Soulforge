/**
 * Item Creator Page
 *
 * Create items, weapons, armor, cards with effects and stats.
 * Diablo II Hero Editor style interface.
 */

import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';

interface ItemData {
  id: string;
  name: string;
  description: string;
  type: 'weapon' | 'armor' | 'accessory' | 'consumable' | 'card' | 'material';
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  level: number;
  stats: {
    atk?: number;
    def?: number;
    hp?: number;
    mana?: number;
    spd?: number;
  };
  effects: Array<{
    type: string;
    value: number;
    duration?: number;
  }>;
  stackable: boolean;
  maxStack: number;
  sellValue: number;
}

export default function ItemCreatePage() {
  const [itemData, setItemData] = useState<ItemData>({
    id: '',
    name: '',
    description: '',
    type: 'weapon',
    rarity: 'common',
    level: 1,
    stats: {},
    effects: [],
    stackable: false,
    maxStack: 1,
    sellValue: 0,
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      // Generate ID if not provided
      const id = itemData.id || `${itemData.type}_${Date.now()}`;
      const item = { ...itemData, id };

      // TODO: Save to Firebase
      console.log('Saving item:', item);
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to save item:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setItemData({
      id: '',
      name: '',
      description: '',
      type: 'weapon',
      rarity: 'common',
      level: 1,
      stats: {},
      effects: [],
      stackable: false,
      maxStack: 1,
      sellValue: 0,
    });
  };

  const updateField = <K extends keyof ItemData>(field: K, value: ItemData[K]) => {
    setItemData({ ...itemData, [field]: value });
  };

  const addEffect = () => {
    setItemData({
      ...itemData,
      effects: [...itemData.effects, { type: 'damage', value: 0 }],
    });
  };

  const removeEffect = (index: number) => {
    setItemData({
      ...itemData,
      effects: itemData.effects.filter((_, i) => i !== index),
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Create Item - Admin Panel</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Item Creator</h1>
            <p className="text-gray-400 mt-1">
              Create items that sync instantly to mobile app
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
              {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Saved!' : 'Save Item'}
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
                  Item ID (auto-generated if empty)
                </label>
                <input
                  type="text"
                  value={itemData.id}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="sword_steel_01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={itemData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="Steel Sword"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={itemData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white h-20"
                placeholder="A well-crafted steel sword..."
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={itemData.type}
                  onChange={(e) => updateField('type', e.target.value as any)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                >
                  <option value="weapon">⚔️ Weapon</option>
                  <option value="armor">🛡️ Armor</option>
                  <option value="accessory">💍 Accessory</option>
                  <option value="consumable">🧪 Consumable</option>
                  <option value="card">🎴 Card</option>
                  <option value="material">📦 Material</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
                <select
                  value={itemData.rarity}
                  onChange={(e) => updateField('rarity', e.target.value as any)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                >
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="rare">Rare</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <input
                  type="number"
                  min="1"
                  value={itemData.level}
                  onChange={(e) => updateField('level', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sell Value
                </label>
                <input
                  type="number"
                  min="0"
                  value={itemData.sellValue}
                  onChange={(e) => updateField('sellValue', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={itemData.stackable}
                  onChange={(e) => updateField('stackable', e.target.checked)}
                  className="rounded"
                />
                Stackable
              </label>
              {itemData.stackable && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Stack
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={itemData.maxStack}
                    onChange={(e) => updateField('maxStack', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Stats</h2>
          <div className="grid grid-cols-5 gap-4">
            {['atk', 'def', 'hp', 'mana', 'spd'].map((stat) => (
              <div key={stat}>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase">
                  {stat}
                </label>
                <input
                  type="number"
                  min="0"
                  value={(itemData.stats as any)[stat] || ''}
                  onChange={(e) =>
                    updateField('stats', {
                      ...itemData.stats,
                      [stat]: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Effects */}
        <div className="bg-accent rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Effects</h2>
            <button
              onClick={addEffect}
              className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition"
            >
              + Add Effect
            </button>
          </div>

          {itemData.effects.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No effects. Add effects to make item more powerful.
            </div>
          ) : (
            <div className="space-y-3">
              {itemData.effects.map((effect, index) => (
                <div key={index} className="flex gap-3 items-center bg-darker p-3 rounded-lg">
                  <select
                    value={effect.type}
                    onChange={(e) => {
                      const updated = [...itemData.effects];
                      updated[index].type = e.target.value;
                      updateField('effects', updated);
                    }}
                    className="px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  >
                    <option value="damage">Damage</option>
                    <option value="heal">Heal</option>
                    <option value="buff">Buff</option>
                    <option value="debuff">Debuff</option>
                    <option value="poison">Poison</option>
                    <option value="burn">Burn</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Value"
                    value={effect.value}
                    onChange={(e) => {
                      const updated = [...itemData.effects];
                      updated[index].value = parseInt(e.target.value) || 0;
                      updateField('effects', updated);
                    }}
                    className="w-24 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <input
                    type="number"
                    placeholder="Duration (optional)"
                    value={effect.duration || ''}
                    onChange={(e) => {
                      const updated = [...itemData.effects];
                      updated[index].duration = e.target.value
                        ? parseInt(e.target.value)
                        : undefined;
                      updateField('effects', updated);
                    }}
                    className="w-32 px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                  />
                  <button
                    onClick={() => removeEffect(index)}
                    className="ml-auto text-red-500 hover:text-red-400"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
          <pre className="bg-darker p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
            {JSON.stringify(itemData, null, 2)}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
