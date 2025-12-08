/**
 * NPC Creator Page
 *
 * Create NPCs with dialogue, quests, shops, and spawn locations.
 */

import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';

interface NPCData {
  id: string;
  name: string;
  description: string;
  type: 'quest_giver' | 'merchant' | 'trainer' | 'lore' | 'generic';
  level: number;
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  dialogue: Array<{
    trigger: 'greeting' | 'quest' | 'shop' | 'farewell';
    text: string;
  }>;
  quests: string[]; // Quest IDs
  shopInventory?: string[]; // Item IDs
  services?: string[]; // 'repair', 'training', 'alchemy', etc.
}

export default function NPCCreatePage() {
  const [npcData, setNPCData] = useState<NPCData>({
    id: '',
    name: '',
    description: '',
    type: 'generic',
    level: 1,
    location: {
      lat: 0,
      lng: 0,
      radius: 10,
    },
    dialogue: [],
    quests: [],
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const id = npcData.id || `npc_${Date.now()}`;
      const npc = { ...npcData, id };

      // TODO: Save to Firebase
      console.log('Saving NPC:', npc);
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveStatus('success');
      setTimeout(() => {
        setSaveStatus('idle');
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to save NPC:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setNPCData({
      id: '',
      name: '',
      description: '',
      type: 'generic',
      level: 1,
      location: { lat: 0, lng: 0, radius: 10 },
      dialogue: [],
      quests: [],
    });
  };

  const updateField = <K extends keyof NPCData>(field: K, value: NPCData[K]) => {
    setNPCData({ ...npcData, [field]: value });
  };

  const addDialogue = () => {
    setNPCData({
      ...npcData,
      dialogue: [...npcData.dialogue, { trigger: 'greeting', text: '' }],
    });
  };

  const removeDialogue = (index: number) => {
    setNPCData({
      ...npcData,
      dialogue: npcData.dialogue.filter((_, i) => i !== index),
    });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Create NPC - Admin Panel</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">NPC Creator</h1>
            <p className="text-gray-400 mt-1">
              Create NPCs with quests, shops, and dialogue
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
              {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Saved!' : 'Save NPC'}
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
                  NPC ID
                </label>
                <input
                  type="text"
                  value={npcData.id}
                  onChange={(e) => updateField('id', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="npc_merchant_01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  NPC Name *
                </label>
                <input
                  type="text"
                  value={npcData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  placeholder="Merchant Aldric"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={npcData.description}
                onChange={(e) => updateField('description', e.target.value)}
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white h-20"
                placeholder="A friendly merchant who sells rare items..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={npcData.type}
                  onChange={(e) => updateField('type', e.target.value as any)}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                >
                  <option value="quest_giver">📜 Quest Giver</option>
                  <option value="merchant">🛒 Merchant</option>
                  <option value="trainer">🎓 Trainer</option>
                  <option value="lore">📖 Lore Master</option>
                  <option value="generic">👤 Generic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                <input
                  type="number"
                  min="1"
                  value={npcData.level}
                  onChange={(e) => updateField('level', parseInt(e.target.value))}
                  className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Spawn Location</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Latitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={npcData.location.lat}
                onChange={(e) =>
                  updateField('location', {
                    ...npcData.location,
                    lat: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Longitude
              </label>
              <input
                type="number"
                step="0.000001"
                value={npcData.location.lng}
                onChange={(e) =>
                  updateField('location', {
                    ...npcData.location,
                    lng: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Interaction Radius (m)
              </label>
              <input
                type="number"
                min="1"
                value={npcData.location.radius}
                onChange={(e) =>
                  updateField('location', {
                    ...npcData.location,
                    radius: parseInt(e.target.value) || 10,
                  })
                }
                className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              />
            </div>
          </div>
        </div>

        {/* Dialogue */}
        <div className="bg-accent rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Dialogue</h2>
            <button
              onClick={addDialogue}
              className="px-4 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg transition"
            >
              + Add Dialogue
            </button>
          </div>

          {npcData.dialogue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No dialogue yet. Add dialogue options.
            </div>
          ) : (
            <div className="space-y-3">
              {npcData.dialogue.map((dialog, index) => (
                <div key={index} className="bg-darker p-4 rounded-lg">
                  <div className="flex gap-3 mb-3">
                    <select
                      value={dialog.trigger}
                      onChange={(e) => {
                        const updated = [...npcData.dialogue];
                        updated[index].trigger = e.target.value as any;
                        updateField('dialogue', updated);
                      }}
                      className="px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                    >
                      <option value="greeting">👋 Greeting</option>
                      <option value="quest">📜 Quest</option>
                      <option value="shop">🛒 Shop</option>
                      <option value="farewell">👋 Farewell</option>
                    </select>
                    <button
                      onClick={() => removeDialogue(index)}
                      className="ml-auto text-red-500 hover:text-red-400"
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <textarea
                    value={dialog.text}
                    onChange={(e) => {
                      const updated = [...npcData.dialogue];
                      updated[index].text = e.target.value;
                      updateField('dialogue', updated);
                    }}
                    className="w-full px-3 py-2 bg-accent border border-gray-600 rounded text-white"
                    placeholder="Enter dialogue text..."
                    rows={2}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quests (for Quest Givers) */}
        {npcData.type === 'quest_giver' && (
          <div className="bg-accent rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Quests</h2>
            <p className="text-gray-400 text-sm mb-3">
              Quest IDs that this NPC can give to players
            </p>
            <div className="bg-darker p-4 rounded-lg">
              <p className="text-gray-500 text-sm">
                (Quest assignment interface coming soon)
              </p>
            </div>
          </div>
        )}

        {/* Shop Inventory (for Merchants) */}
        {npcData.type === 'merchant' && (
          <div className="bg-accent rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Shop Inventory</h2>
            <p className="text-gray-400 text-sm mb-3">
              Item IDs that this merchant sells
            </p>
            <div className="bg-darker p-4 rounded-lg">
              <p className="text-gray-500 text-sm">
                (Shop inventory interface coming soon)
              </p>
            </div>
          </div>
        )}

        {/* Preview */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Preview</h2>
          <pre className="bg-darker p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
            {JSON.stringify(npcData, null, 2)}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}
