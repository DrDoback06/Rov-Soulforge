import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { collection, doc, setDoc } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import { useFirebase } from '@/lib/firebase-context';
import questsData from '@/../../scripts/test-quests.json';

/**
 * QuestSeeder - Development tool to seed test quest data
 * Only visible on web platform for testing
 */
export function QuestSeeder() {
  const { db } = useFirebase();
  const [seeding, setSeeding] = useState(false);
  const [status, setStatus] = useState<string>('');

  if (Platform.OS !== 'web') {
    return null;
  }

  async function seedQuests() {
    setSeeding(true);
    setStatus('Starting quest seeding...');

    try {
      const expiresDate = new Date();
      expiresDate.setDate(expiresDate.getDate() + 7); // 7 days from now

      for (let i = 0; i < questsData.length; i++) {
        const quest = questsData[i];
        const questRef = doc(collection(db, 'activeQuests'));

        const questDoc = {
          id: questRef.id,
          title: quest.title,
          description: quest.description,
          location: {
            latitude: quest.location.latitude,
            longitude: quest.location.longitude,
            geohash: geohashForLocation([quest.location.latitude, quest.location.longitude])
          },
          rarity: quest.rarity,
          rewards: quest.rewards,
          requirements: quest.requirements,
          expires: expiresDate
        };

        await setDoc(questRef, questDoc);
        setStatus(`Created ${i + 1}/${questsData.length}: ${quest.title}`);
      }

      setStatus(`✅ Successfully seeded ${questsData.length} quests! Refresh the map to see them.`);
    } catch (error) {
      console.error('Seeding error:', error);
      setStatus(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSeeding(false);
    }
  }

  async function clearQuests() {
    setStatus('Note: Clear function requires admin SDK. Use Firebase Console to delete activeQuests collection.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🌱 Quest Seeder (Dev Tool)</Text>
      <Text style={styles.description}>
        Seeds {questsData.length} test quests to Firebase
      </Text>

      <View style={styles.buttons}>
        <Pressable
          style={[styles.button, styles.seedButton, seeding && styles.buttonDisabled]}
          onPress={seedQuests}
          disabled={seeding}
        >
          <Text style={styles.buttonText}>
            {seeding ? 'Seeding...' : 'Seed Quests'}
          </Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.clearButton]}
          onPress={clearQuests}
        >
          <Text style={styles.buttonText}>Clear Info</Text>
        </Pressable>
      </View>

      {status && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 1000
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  description: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 16
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  seedButton: {
    backgroundColor: '#4CAF50'
  },
  clearButton: {
    backgroundColor: '#666'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  statusBox: {
    backgroundColor: '#0f0f1e',
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50'
  },
  statusText: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: 'monospace'
  }
});
