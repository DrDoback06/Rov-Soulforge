import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform, ScrollView } from 'react-native';
import { collection, doc, setDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import { useFirebase } from '@/lib/firebase-context';
import epicQuestsData from '@/../../scripts/epic-landmark-quests.json';

/**
 * 🧪 TEST SYSTEM - Epic Quest Seeder Component
 *
 * ⚠️ REMOVE IN PRODUCTION - This is a development/testing tool
 *
 * Seeds epic landmark quests to Firebase for testing purposes.
 * Only available on web platform.
 */

interface EpicQuestSeederProps {
  onQuestsSeeded?: () => void;
}

export function EpicQuestSeeder({ onQuestsSeeded }: EpicQuestSeederProps) {
  const { db } = useFirebase();
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [details, setDetails] = useState<string[]>([]);

  if (Platform.OS !== 'web') return null;

  async function seedEpicQuests() {
    setSeeding(true);
    setStatus('🚀 Starting epic quest seeding...');
    setDetails([]);
    const newDetails: string[] = [];

    try {
      for (let i = 0; i < epicQuestsData.length; i++) {
        const quest = epicQuestsData[i];

        // Create quest document
        const questDoc = {
          id: quest.id,
          type: quest.type,
          difficulty: quest.difficulty,
          status: 'available',

          title: quest.title,
          description: quest.description,
          lore: quest.lore,

          location: {
            latitude: quest.location.latitude,
            longitude: quest.location.longitude,
            geohash: geohashForLocation([quest.location.latitude, quest.location.longitude]),
            name: quest.location.name,
            type: quest.location.type
          },

          objectives: quest.objectives,
          rewards: quest.rewards,
          requiredLevel: quest.requiredLevel,
          recommendedLevel: quest.recommendedLevel,

          chainInfo: quest.chainInfo || null,

          spawnedAt: new Date(),
          expiresAt: null, // Landmark quests never expire
          duration: quest.duration || null,

          maxPlayers: quest.maxPlayers || 1,
          currentPlayers: [],

          isLegendary: quest.isLegendary,
          isBoss: quest.isBoss,
          isSeasonal: quest.isSeasonal || false,

          icon: quest.icon,
          color: quest.color,
          pulseEffect: quest.pulseEffect || false,

          tags: quest.tags,
          createdBy: 'admin',
          completionCount: 0
        };

        // Save to static quests collection for permanent quests
        const questRef = doc(db, 'staticQuests', quest.id);
        await setDoc(questRef, questDoc);

        const detail = `✅ Created: ${quest.title} (${quest.difficulty})`;
        newDetails.push(detail);
        setDetails([...newDetails]);
        setStatus(`Seeding ${i + 1}/${epicQuestsData.length}...`);
      }

      setStatus(`🎉 Successfully seeded ${epicQuestsData.length} epic quests!`);
      newDetails.push('');
      newDetails.push('🗺️ Quest Types:');
      newDetails.push(`  • ${epicQuestsData.filter(q => q.isLegendary).length} Legendary Quests`);
      newDetails.push(`  • ${epicQuestsData.filter(q => q.isBoss).length} Boss Battles`);
      newDetails.push(`  • ${epicQuestsData.filter(q => q.chainInfo).length} Quest Chain Parts`);
      newDetails.push(`  • ${epicQuestsData.filter(q => q.maxPlayers && q.maxPlayers > 1).length} Social Quests`);
      setDetails([...newDetails]);

      // Trigger callback to reload quests on map
      if (onQuestsSeeded) {
        onQuestsSeeded();
      }

    } catch (error) {
      const errorMsg = `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      setStatus(errorMsg);
      newDetails.push(errorMsg);
      setDetails([...newDetails]);
    } finally {
      setSeeding(false);
    }
  }

  async function clearQuests() {
    if (!confirm('Are you sure you want to clear all epic quests?')) return;

    setSeeding(true);
    setStatus('🗑️ Clearing quests...');
    setDetails([]);

    try {
      // This would require getting all docs and deleting them
      // For now, just show a message
      setStatus('⚠️ Manual deletion required via Firebase Console');
      setDetails(['Go to Firebase Console > Firestore > staticQuests collection']);
    } catch (error) {
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>⚔️ Epic Quest Seeder</Text>
        <Text style={styles.subtitle}>Deploy legendary quests to the realm</Text>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          style={[styles.button, styles.seedButton, seeding && styles.buttonDisabled]}
          onPress={seedEpicQuests}
          disabled={seeding}
        >
          <Text style={styles.buttonText}>
            {seeding ? '⏳ Seeding...' : '🚀 Seed Epic Quests'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.clearButton, seeding && styles.buttonDisabled]}
          onPress={clearQuests}
          disabled={seeding}
        >
          <Text style={styles.buttonText}>🗑️ Clear</Text>
        </Pressable>
      </View>

      {status && (
        <View style={styles.statusContainer}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}

      {details.length > 0 && (
        <ScrollView style={styles.detailsContainer} showsVerticalScrollIndicator={false}>
          {details.map((detail, index) => (
            <Text key={index} style={styles.detailText}>{detail}</Text>
          ))}
        </ScrollView>
      )}

      <View style={styles.infoBox}>
        <Text style={styles.infoText}>
          📊 {epicQuestsData.length} epic quests available
        </Text>
        <Text style={styles.infoSubtext}>
          Including legendary boss battles, quest chains, and social adventures
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderRadius: 16,
    padding: 20,
    width: 380,
    maxHeight: '80vh',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#FFD700',
    zIndex: 1000
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    paddingBottom: 12
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#CCCCCC',
    fontStyle: 'italic'
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  seedButton: {
    backgroundColor: '#4CAF50'
  },
  clearButton: {
    backgroundColor: '#F44336',
    flex: 0.4
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14
  },
  statusContainer: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)'
  },
  statusText: {
    color: '#4CAF50',
    fontSize: 13,
    fontWeight: '500'
  },
  detailsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    maxHeight: 300
  },
  detailText: {
    color: '#CCCCCC',
    fontSize: 11,
    marginBottom: 4,
    fontFamily: 'monospace'
  },
  infoBox: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(33, 150, 243, 0.3)'
  },
  infoText: {
    color: '#42A5F5',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4
  },
  infoSubtext: {
    color: '#90CAF9',
    fontSize: 11
  }
});
