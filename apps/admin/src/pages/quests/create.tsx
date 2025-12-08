/**
 * Quest Creator Page
 *
 * Comprehensive quest creation interface inspired by Diablo II Hero Editor.
 * Create quests with all objective types, rewards, and restrictions.
 */

import { useState } from 'react';
import Head from 'next/head';
import { DashboardLayout } from '@/components/DashboardLayout';
import { QuestForm } from '@/components/quests/QuestForm';
import { ObjectiveBuilder } from '@/components/quests/ObjectiveBuilder';
import { RewardBuilder } from '@/components/quests/RewardBuilder';
import type { Quest, QuestObjective, QuestRewards } from '@rov/types';

export default function QuestCreatePage() {
  const [questData, setQuestData] = useState<Partial<Quest>>({
    name: '',
    description: '',
    lore: '',
    level: 1,
    rarity: 'common',
    objectives: [],
    rewards: {
      xp: 0,
      gold: 0,
      renown: 0,
      items: [],
    },
    restrictions: {
      minLevel: 1,
      maxLevel: undefined,
      classes: [],
      alignments: [],
    },
  });

  const [objectives, setObjectives] = useState<QuestObjective[]>([]);
  const [rewards, setRewards] = useState<QuestRewards>({
    xp: 0,
    gold: 0,
    renown: 0,
    items: [],
  });

  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');

    try {
      const quest: Quest = {
        ...questData,
        id: generateQuestId(),
        objectives,
        rewards,
        status: 'active',
        createdAt: new Date().toISOString(),
      } as Quest;

      // Save to Firebase
      await saveQuestToFirebase(quest);

      setSaveStatus('success');
      console.log('✅ Quest saved to Firebase:', quest.id);

      // Reset form after 2 seconds
      setTimeout(() => {
        setSaveStatus('idle');
        resetForm();
      }, 2000);
    } catch (error) {
      console.error('Failed to save quest:', error);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSpawn = () => {
    // Test spawn quest at admin's current location
    console.log('🧪 Test spawning quest...');
  };

  const resetForm = () => {
    setQuestData({
      name: '',
      description: '',
      lore: '',
      level: 1,
      rarity: 'common',
      objectives: [],
      rewards: { xp: 0, gold: 0, renown: 0, items: [] },
      restrictions: { minLevel: 1, classes: [], alignments: [] },
    });
    setObjectives([]);
    setRewards({ xp: 0, gold: 0, renown: 0, items: [] });
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Create Quest - Admin Panel</title>
      </Head>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white">Quest Creator</h1>
            <p className="text-gray-400 mt-1">
              Create quests that appear instantly in the mobile app
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={resetForm}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
            >
              Clear Form
            </button>
            <button
              onClick={handleTestSpawn}
              className="px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition"
            >
              🧪 Test Spawn
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
              {saving ? 'Saving...' : saveStatus === 'success' ? '✅ Saved!' : 'Save Quest'}
            </button>
          </div>
        </div>

        {/* Quest Basic Info */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quest Details</h2>
          <QuestForm
            questData={questData}
            onChange={setQuestData}
          />
        </div>

        {/* Objectives Builder */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Objectives ({objectives.length})
          </h2>
          <ObjectiveBuilder
            objectives={objectives}
            onChange={setObjectives}
          />
        </div>

        {/* Rewards Builder */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Rewards</h2>
          <RewardBuilder
            rewards={rewards}
            onChange={setRewards}
          />
        </div>

        {/* Preview */}
        <div className="bg-accent rounded-lg p-6">
          <h2 className="text-xl font-bold text-white mb-4">Quest Preview</h2>
          <pre className="bg-darker p-4 rounded-lg text-gray-300 text-sm overflow-x-auto">
            {JSON.stringify({ ...questData, objectives, rewards }, null, 2)}
          </pre>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Utility functions
function generateQuestId(): string {
  return `quest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

async function saveQuestToFirebase(quest: Quest): Promise<void> {
  // TODO: Implement Firebase save
  // const db = getFirestore();
  // await addDoc(collection(db, 'activeQuests'), quest);
  console.log('Saving quest to Firebase:', quest);
}
