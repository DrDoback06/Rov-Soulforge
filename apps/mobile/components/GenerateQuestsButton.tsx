import { useState } from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import { generateDynamicQuests, generateWorldEvent } from '@/utils/questGenerator';
import { generateQuestsAtPOIs } from '@/utils/questGeneratorPOI';

interface GenerateQuestsButtonProps {
  latitude: number;
  longitude: number;
  placeName?: string;
  onQuestsGenerated?: () => void;
}

/**
 * Generate Quests Button
 *
 * Shows on first map load to generate initial quests for the area
 * Creates:
 * - 5 local static quests (global, all players see)
 * - 10 dynamic quests (personal, time-limited)
 * - 1 world event (global, time-limited)
 */
export function GenerateQuestsButton({
  latitude,
  longitude,
  placeName = 'this area',
  onQuestsGenerated
}: GenerateQuestsButtonProps) {
  const { db } = useFirebase();
  const [generating, setGenerating] = useState(false);

  const handleGenerateQuests = async () => {
    if (!latitude || !longitude) {
      Alert.alert('Error', 'Invalid location coordinates');
      return;
    }

    setGenerating(true);

    try {
      console.log(`🎲 Generating quests for ${placeName} (${latitude}, ${longitude})...`);

      const context = { latitude, longitude, placeName };

      // Generate quests at REAL POI locations (parks, landmarks, etc.)
      const localQuests = await generateQuestsAtPOIs(latitude, longitude, 10);

      // Save to staticQuests collection
      for (const quest of localQuests) {
        await setDoc(doc(db, 'staticQuests', quest.id), quest);
      }

      // Generate 10 dynamic quests (personal, per-player)
      const dynamicQuests = generateDynamicQuests(context, 10);
      for (const quest of dynamicQuests) {
        // Save to dynamicQuests collection
        await setDoc(doc(db, 'dynamicQuests', quest.id), quest);
      }

      // Generate 1 world event (global)
      const worldEvent = generateWorldEvent();
      await setDoc(doc(db, 'worldEvents', worldEvent.id), worldEvent);

      console.log(`✅ Generated:
        - ${localQuests.length} local quests
        - ${dynamicQuests.length} dynamic quests
        - 1 world event
      `);

      Alert.alert(
        '✨ Quests Generated!',
        `Created ${localQuests.length} local quests, ${dynamicQuests.length} dynamic quests, and 1 world event for ${placeName}!`,
        [{ text: 'OK', onPress: onQuestsGenerated }]
      );

    } catch (error) {
      console.error('❌ Failed to generate quests:', error);
      Alert.alert('Error', 'Failed to generate quests. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Pressable
      style={styles.button}
      onPress={handleGenerateQuests}
      disabled={generating}
    >
      {generating ? (
        <>
          <ActivityIndicator size="small" color="#ffffff" />
          <Text style={styles.buttonText}>Generating...</Text>
        </>
      ) : (
        <>
          <Text style={styles.icon}>✨</Text>
          <Text style={styles.buttonText}>Generate Quests</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    top: 80,
    right: 16,
    backgroundColor: '#6b46c1',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#8b5cf6'
  },
  icon: {
    fontSize: 20
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700'
  }
});
