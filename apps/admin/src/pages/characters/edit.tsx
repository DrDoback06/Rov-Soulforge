/**
 * Character Editor Page
 *
 * Edit existing characters - Diablo II Hero Editor style.
 * Modify stats, inventory, skills, equipped items, gold, XP.
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';
import type { Character } from '@rov/types';

export default function CharacterEditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [characterData, setCharacterData] = useState<Partial<Character> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSearch = async () => {
    // TODO: Search Firebase for character
    console.log('Searching for:', searchTerm);
    // Mock data for now
    const mockCharacter: Character = {
      id: 'char_123',
      uid: 'user_456',
      classId: 'warrior',
      alignment: 'good',
      counters: {
        hp: 100,
        mana: 50,
        xp: 1500,
        renown: 250,
      },
      stats: {
        atk: 25,
        def: 15,
        spd: 10,
        maxHp: 100,
        maxMana: 50,
      },
      level: 5,
      lives: 3,
      inventory: [],
      equipped: {},
      skills: ['slash', 'block'],
      gold: 500,
    };
    setSelectedCharacter(mockCharacter);
    setCharacterData(mockCharacter);
  };

  const handleSave = async () => {
    if (!characterData) return;

    setSaving(true);
    setSaveStatus('idle');

    try {
      // TODO: Save to Firebase
      console.log('Saving character:', characterData);
      await new Promise(resolve => setTimeout(resolve, 500));

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save character:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const updateField = <K extends keyof Character>(field: K, value: Character[K]) => {
    if (!characterData) return;
    setCharacterData({ ...characterData, [field]: value });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Character Editor - Admin Panel</title>
      </Head>

      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white">Character Editor</h1>
          <p className="text-gray-400 mt-1">
            Edit character stats, inventory, and progression
          </p>
        </div>

        {/* Search */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Find Character</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
              placeholder="Search by Character ID, User ID, or Username"
            />
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-primary hover:bg-blue-600 text-white rounded-lg font-semibold transition"
            >
              🔍 Search
            </button>
          </div>
        </div>

        {/* Character Editor */}
        {characterData && (
          <>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-white">{characterData.classId || 'Character'}</h2>
                <p className="text-gray-400 text-sm">ID: {characterData.id}</p>
              </div>
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
                {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Saved!' : 'Save Changes'}
              </button>
            </div>

            {/* Basic Info */}
            <div className="bg-accent rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Basic Info</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Class
                  </label>
                  <select
                    value={characterData.classId || ''}
                    onChange={(e) => updateField('classId', e.target.value)}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  >
                    <option value="warrior">Warrior</option>
                    <option value="mage">Mage</option>
                    <option value="ranger">Ranger</option>
                    <option value="cleric">Cleric</option>
                    <option value="rogue">Rogue</option>
                    <option value="paladin">Paladin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Alignment
                  </label>
                  <select
                    value={characterData.alignment || 'neutral'}
                    onChange={(e) => updateField('alignment', e.target.value as any)}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  >
                    <option value="good">Good</option>
                    <option value="neutral">Neutral</option>
                    <option value="evil">Evil</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Level
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={characterData.level || 1}
                    onChange={(e) => updateField('level', parseInt(e.target.value))}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-accent rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Combat Stats</h3>
              <div className="grid grid-cols-5 gap-4">
                {['atk', 'def', 'spd', 'maxHp', 'maxMana'].map((stat) => (
                  <div key={stat}>
                    <label className="block text-sm font-medium text-gray-300 mb-2 uppercase">
                      {stat}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={(characterData.stats as any)?.[stat] || 0}
                      onChange={(e) =>
                        updateField('stats', {
                          ...characterData.stats,
                          [stat]: parseInt(e.target.value) || 0,
                        } as any)
                      }
                      className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Counters (Current Values) */}
            <div className="bg-accent rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Current Values</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current HP
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.counters?.hp || 0}
                    onChange={(e) =>
                      updateField('counters', {
                        ...characterData.counters,
                        hp: parseInt(e.target.value) || 0,
                      } as any)
                    }
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Current Mana
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.counters?.mana || 0}
                    onChange={(e) =>
                      updateField('counters', {
                        ...characterData.counters,
                        mana: parseInt(e.target.value) || 0,
                      } as any)
                    }
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    XP
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.counters?.xp || 0}
                    onChange={(e) =>
                      updateField('counters', {
                        ...characterData.counters,
                        xp: parseInt(e.target.value) || 0,
                      } as any)
                    }
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Renown
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.counters?.renown || 0}
                    onChange={(e) =>
                      updateField('counters', {
                        ...characterData.counters,
                        renown: parseInt(e.target.value) || 0,
                      } as any)
                    }
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Resources */}
            <div className="bg-accent rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Resources</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    💰 Gold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.gold || 0}
                    onChange={(e) => updateField('gold', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    ❤️ Lives
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={characterData.lives || 0}
                    onChange={(e) => updateField('lives', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-2 bg-darker border border-gray-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-accent rounded-lg p-6">
              <h3 className="text-lg font-bold text-white mb-4">Skills</h3>
              <div className="bg-darker p-4 rounded-lg">
                <p className="text-gray-400 text-sm">
                  Skills: {(characterData.skills || []).join(', ') || 'None'}
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  (Skill editor coming soon)
                </p>
              </div>
            </div>

            {/* Warning */}
            <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
              <p className="text-yellow-400 font-semibold">⚠️ Warning</p>
              <p className="text-yellow-300 text-sm mt-1">
                Changes sync immediately to Firebase. The player will see updated stats
                in real-time on their mobile device.
              </p>
            </div>
          </>
        )}

        {!characterData && (
          <div className="bg-accent rounded-lg p-12 text-center">
            <p className="text-gray-500 text-lg">
              Search for a character to begin editing
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
