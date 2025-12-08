/**
 * QuestForm Component
 *
 * Form for basic quest details (name, description, level, rarity, restrictions)
 */

import type { Quest } from '@rov/types';

interface QuestFormProps {
  questData: Partial<Quest>;
  onChange: (data: Partial<Quest>) => void;
}

export function QuestForm({ questData, onChange }: QuestFormProps) {
  const updateField = <K extends keyof Quest>(field: K, value: Quest[K]) => {
    onChange({ ...questData, [field]: value });
  };

  return (
    <div className="space-y-4">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Quest Name *
        </label>
        <input
          type="text"
          value={questData.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          placeholder="The Goblin Menace"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Description *
        </label>
        <textarea
          value={questData.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary h-24"
          placeholder="A band of goblins has been terrorizing the local village..."
        />
      </div>

      {/* Lore (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Lore (optional)
        </label>
        <textarea
          value={questData.lore || ''}
          onChange={(e) => updateField('lore', e.target.value)}
          className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary h-20"
          placeholder="Long ago, the goblins were peaceful creatures..."
        />
      </div>

      {/* Level and Rarity */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Quest Level *
          </label>
          <input
            type="number"
            min="1"
            max="100"
            value={questData.level || 1}
            onChange={(e) => updateField('level', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rarity *
          </label>
          <select
            value={questData.rarity || 'common'}
            onChange={(e) => updateField('rarity', e.target.value as any)}
            className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
          >
            <option value="common">Common</option>
            <option value="uncommon">Uncommon</option>
            <option value="rare">Rare</option>
            <option value="epic">Epic</option>
            <option value="legendary">Legendary</option>
          </select>
        </div>
      </div>

      {/* Restrictions */}
      <div className="border-t border-gray-700 pt-4 mt-4">
        <h3 className="text-lg font-semibold text-white mb-3">Restrictions</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Minimum Level
            </label>
            <input
              type="number"
              min="1"
              value={questData.restrictions?.minLevel || 1}
              onChange={(e) => updateField('restrictions', {
                ...questData.restrictions,
                minLevel: parseInt(e.target.value)
              })}
              className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Maximum Level (optional)
            </label>
            <input
              type="number"
              min="1"
              value={questData.restrictions?.maxLevel || ''}
              onChange={(e) => updateField('restrictions', {
                ...questData.restrictions,
                maxLevel: e.target.value ? parseInt(e.target.value) : undefined
              })}
              className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white focus:outline-none focus:border-primary"
              placeholder="No limit"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Allowed Classes (optional)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['warrior', 'mage', 'ranger', 'cleric', 'rogue', 'paladin'].map((cls) => (
              <label key={cls} className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={questData.restrictions?.classes?.includes(cls) || false}
                  onChange={(e) => {
                    const classes = questData.restrictions?.classes || [];
                    updateField('restrictions', {
                      ...questData.restrictions,
                      classes: e.target.checked
                        ? [...classes, cls]
                        : classes.filter(c => c !== cls)
                    });
                  }}
                  className="rounded"
                />
                <span className="capitalize">{cls}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Required Alignment (optional)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['good', 'neutral', 'evil'].map((alignment) => (
              <label key={alignment} className="flex items-center gap-2 text-gray-300">
                <input
                  type="checkbox"
                  checked={questData.restrictions?.alignments?.includes(alignment as any) || false}
                  onChange={(e) => {
                    const alignments = questData.restrictions?.alignments || [];
                    updateField('restrictions', {
                      ...questData.restrictions,
                      alignments: e.target.checked
                        ? [...alignments, alignment as any]
                        : alignments.filter(a => a !== alignment)
                    });
                  }}
                  className="rounded"
                />
                <span className="capitalize">{alignment}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
