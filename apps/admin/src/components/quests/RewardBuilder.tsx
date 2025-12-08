/**
 * RewardBuilder Component
 *
 * Build quest rewards: XP, gold, renown, items
 */

import { useState } from 'react';
import type { QuestRewards } from '@rov/types';

interface RewardBuilderProps {
  rewards: QuestRewards;
  onChange: (rewards: QuestRewards) => void;
}

export function RewardBuilder({ rewards, onChange }: RewardBuilderProps) {
  const [itemInput, setItemInput] = useState('');

  const updateField = <K extends keyof QuestRewards>(
    field: K,
    value: QuestRewards[K]
  ) => {
    onChange({ ...rewards, [field]: value });
  };

  const addItem = () => {
    if (!itemInput.trim()) return;
    const items = rewards.items || [];
    onChange({ ...rewards, items: [...items, itemInput.trim()] });
    setItemInput('');
  };

  const removeItem = (index: number) => {
    const items = rewards.items || [];
    onChange({ ...rewards, items: items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Currency Rewards */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ✨ XP Reward
          </label>
          <input
            type="number"
            min="0"
            value={rewards.xp || 0}
            onChange={(e) => updateField('xp', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            💰 Gold Reward
          </label>
          <input
            type="number"
            min="0"
            value={rewards.gold || 0}
            onChange={(e) => updateField('gold', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            ⭐ Renown Reward
          </label>
          <input
            type="number"
            min="0"
            value={rewards.renown || 0}
            onChange={(e) => updateField('renown', parseInt(e.target.value) || 0)}
            className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {/* Item Rewards */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🎁 Item Rewards
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={itemInput}
            onChange={(e) => setItemInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            className="flex-1 px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            placeholder="Enter item ID (e.g., sword_steel_01)"
          />
          <button
            onClick={addItem}
            className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
          >
            Add Item
          </button>
        </div>

        {/* Items List */}
        {(rewards.items || []).length > 0 && (
          <div className="space-y-2">
            {(rewards.items || []).map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-darker px-4 py-3 rounded-lg"
              >
                <span className="text-white font-mono">{item}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:text-red-400 transition"
                >
                  ✕ Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {(rewards.items || []).length === 0 && (
          <div className="text-center py-4 text-gray-500 text-sm">
            No item rewards. Add item IDs to reward players.
          </div>
        )}
      </div>

      {/* Reward Summary */}
      <div className="bg-darker border border-gray-700 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-gray-400 mb-2">Reward Summary</h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">XP:</span>
            <span className="text-white font-semibold">{rewards.xp || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Gold:</span>
            <span className="text-yellow-400 font-semibold">{rewards.gold || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Renown:</span>
            <span className="text-purple-400 font-semibold">{rewards.renown || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Items:</span>
            <span className="text-blue-400 font-semibold">
              {(rewards.items || []).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
