import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, ActivityIndicator } from 'react-native';
import { collection, doc, setDoc, getDocs, query } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import type { EnhancedQuest } from '@rov/types';

/**
 * 🧪 TEST SYSTEM - Northampton Quest Seeder
 *
 * Seeds static landmark quests and dynamic quests for Northampton, UK
 *
 * ⚠️ This is a TEST feature for development purposes
 * Will be replaced with automatic quest loading in production
 */
export function NorthamptonQuestSeeder({ onQuestsSeeded }: { onQuestsSeeded?: () => void }) {
  const { db } = useFirebase();
  const [loading, setLoading] = useState(false);

  async function seedNorthamptonQuests() {
    setLoading(true);

    try {
      const staticQuestsRef = collection(db, 'staticQuests');
      const dynamicQuestsRef = collection(db, 'dynamicQuests');

      // Northampton coordinates
      const NORTHAMPTON_CENTER = { lat: 52.2405, lng: -0.9027 };

      // ==================== STATIC LANDMARK QUESTS ====================

      const staticQuests: EnhancedQuest[] = [
        {
          id: 'northampton-guildhall',
          title: 'The Guildhall\'s Ancient Secret',
          type: 'landmark',
          description: 'The Guildhall holds secrets from centuries past. Investigate this magnificent Gothic Revival building and uncover what lies beneath.',
          location: {
            latitude: 52.2392,
            longitude: -0.8975,
            name: 'Guildhall',
            address: 'St Giles Square, Northampton NN1 1DE'
          },
          objectives: [
            'Visit the Guildhall',
            'Take a photo of the Gothic architecture',
            'Discover the hidden chamber'
          ],
          rewards: {
            xp: 500,
            gold: 250,
            items: ['Ancient Seal', 'Guild Token'],
            renown: 50
          },
          difficulty: 'medium',
          estimatedDuration: 30,
          lore: 'Built in 1864, the Guildhall stands as a testament to Northampton\'s rich history. Legends speak of a hidden chamber beneath the great hall, where ancient artifacts of power were once stored.',
          requiredLevel: 1,
          category: 'exploration',
          tags: ['history', 'architecture', 'mystery'],
          npcDialogue: {
            intro: '"Greetings, traveler! The Guildhall has stood for over 150 years, but few know of the secrets it holds. Will you help me uncover its mysteries?"',
            completion: '"Well done! The ancient seal you found is invaluable. The Guild will remember your service."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: 'northampton-castle',
          title: 'Echoes of Northampton Castle',
          type: 'landmark',
          description: 'Once a mighty fortress, now only ruins remain. Explore the site where kings once walked and battles were fought.',
          location: {
            latitude: 52.2383,
            longitude: -0.8969,
            name: 'Northampton Castle Remains',
            address: 'Castle Station, Northampton'
          },
          objectives: [
            'Locate the castle ruins',
            'Find 3 historical markers',
            'Defeat the Phantom Guardian (AR battle)'
          ],
          rewards: {
            xp: 750,
            gold: 400,
            items: ['Knight\'s Crest', 'Royal Banner Fragment', 'Ancient Sword'],
            renown: 75
          },
          difficulty: 'hard',
          estimatedDuration: 45,
          lore: 'Northampton Castle was a royal castle built under Simon de Senlis, the first Earl of Northampton. It played crucial roles in English history, hosting Parliament in 1164 and witnessing the trial of Thomas Becket.',
          requiredLevel: 5,
          category: 'combat',
          tags: ['history', 'battle', 'royalty'],
          npcDialogue: {
            intro: '"The castle may be gone, but its spirits remain. Steel yourself, for the Phantom Guardian protects these ruins from those unworthy of their secrets."',
            completion: '"You have proven yourself a true warrior! The ancient blade you\'ve earned has seen countless battles. Wield it with honor."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: 'northampton-market-square',
          title: 'Tales of the Market Square',
          type: 'landmark',
          description: 'The bustling Market Square has been the heart of Northampton for over 900 years. Listen to the stories of merchants past and present.',
          location: {
            latitude: 52.2383,
            longitude: -0.8989,
            name: 'Market Square',
            address: 'Market Square, Northampton NN1 2DL'
          },
          objectives: [
            'Visit Market Square',
            'Speak with 3 local merchants',
            'Collect stories from townsfolk',
            'Purchase an item from the ancient stalls'
          ],
          rewards: {
            xp: 300,
            gold: 150,
            items: ['Merchant\'s Token', 'Lucky Coin'],
            renown: 30
          },
          difficulty: 'easy',
          estimatedDuration: 20,
          lore: 'Market Square has been the commercial heart of Northampton since 1189. It has witnessed everything from medieval trade fairs to modern shopping festivals.',
          requiredLevel: 1,
          category: 'exploration',
          tags: ['social', 'commerce', 'culture'],
          npcDialogue: {
            intro: '"Welcome to Market Square! These cobblestones have stories to tell if you know how to listen. Chat with the merchants and learn the secrets of successful trade!"',
            completion: '"You\'re a natural storyteller! The merchants have taken a liking to you. Here\'s a token of our appreciation."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: 'northampton-all-saints-church',
          title: 'The Light of All Saints',
          type: 'landmark',
          description: 'All Saints\' Church, with its iconic circular design, holds divine mysteries within its walls. Seek the blessing of the ancient sanctuary.',
          location: {
            latitude: 52.2380,
            longitude: -0.8996,
            name: 'All Saints Church',
            address: 'George Row, Northampton NN1 1DF'
          },
          objectives: [
            'Enter All Saints\' Church',
            'Light 3 candles for the fallen',
            'Pray at the altar',
            'Receive the Priest\'s blessing'
          ],
          rewards: {
            xp: 600,
            gold: 200,
            items: ['Holy Water', 'Blessed Amulet', 'Prayer Book'],
            renown: 60
          },
          difficulty: 'medium',
          estimatedDuration: 35,
          lore: 'Rebuilt after the Great Fire of 1675, All Saints\' Church is one of the largest churches in England and is renowned for its unique circular nave and towering Baroque style.',
          requiredLevel: 3,
          category: 'spiritual',
          tags: ['religion', 'blessing', 'peace'],
          npcDialogue: {
            intro: '"Peace be with you, traveler. This sacred place has offered sanctuary for centuries. Will you honor those who came before and receive our blessing?"',
            completion: '"Your devotion is admirable. May this blessed amulet protect you on your journey. Go with grace."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: 'northampton-derngate',
          title: 'The Performer\'s Challenge',
          type: 'landmark',
          description: 'Royal & Derngate Theatre awaits your performance. Can you master the art of entertainment and win the crowd?',
          location: {
            latitude: 52.2374,
            longitude: -0.8981,
            name: 'Royal & Derngate',
            address: '19-21 Guildhall Rd, Northampton NN1 1DP'
          },
          objectives: [
            'Visit Royal & Derngate',
            'Complete the Performance mini-game',
            'Earn audience approval (70%+)',
            'Collect autograph from the lead actor'
          ],
          rewards: {
            xp: 400,
            gold: 300,
            items: ['Actor\'s Mask', 'Stage Prop', 'Applause Token'],
            renown: 45
          },
          difficulty: 'medium',
          estimatedDuration: 40,
          lore: 'Royal & Derngate is one of the UK\'s leading producing theatres. It has hosted countless legendary performances and continues to be a cultural beacon in Northampton.',
          requiredLevel: 2,
          category: 'social',
          tags: ['performance', 'entertainment', 'culture'],
          npcDialogue: {
            intro: '"Ah, a new face! The stage calls for fresh talent. Show us your skills and perhaps you\'ll earn a place among the greats!"',
            completion: '"Bravo! The audience loved you! You\'re a natural performer. Take this mask as a token of your success."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: 'northampton-racecourse',
          title: 'Race Against Time',
          type: 'landmark',
          description: 'Northampton Racecourse challenges you to a fitness race. Can you beat the clock and claim victory?',
          location: {
            latitude: 52.2223,
            longitude: -0.8762,
            name: 'Northampton Racecourse',
            address: 'Kettering Rd, Northampton NN1 4HB'
          },
          objectives: [
            'Run 2 miles around the racecourse',
            'Complete in under 20 minutes',
            'Maintain heart rate above 140 BPM',
            'Cross the finish line'
          ],
          rewards: {
            xp: 800,
            gold: 350,
            items: ['Runner\'s Medal', 'Stamina Potion', 'Speed Boots'],
            renown: 80
          },
          difficulty: 'hard',
          estimatedDuration: 30,
          lore: 'Northampton Racecourse has been hosting horse racing since 1904. Now it\'s your turn to feel the thrill of competition!',
          requiredLevel: 4,
          category: 'fitness',
          tags: ['running', 'cardio', 'competition'],
          fitnessRequirements: {
            steps: 3000,
            distance: 3.2, // km
            minHeartRate: 140,
            timeLimit: 1200 // seconds
          },
          npcDialogue: {
            intro: '"Think you\'ve got what it takes? The racecourse has seen champions and challengers alike. Show me your speed!"',
            completion: '"Incredible! You\'ve got the heart of a champion. These speed boots will serve you well on future adventures."'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // ==================== DYNAMIC QUESTS ====================

      const dynamicQuests: any[] = [
        {
          id: `dynamic-treasure-hunt-${Date.now()}`,
          title: 'Northampton Treasure Hunt',
          type: 'dynamic',
          description: 'A mysterious treasure has been hidden somewhere in Northampton. Follow the clues and claim your reward before time runs out!',
          location: {
            latitude: NORTHAMPTON_CENTER.lat,
            longitude: NORTHAMPTON_CENTER.lng,
            name: 'Northampton Town Center',
            radius: 1000 // 1km radius
          },
          objectives: [
            'Find Clue 1 near the fountain',
            'Decode the cryptic message',
            'Locate the treasure chest',
            'Claim your reward'
          ],
          rewards: {
            xp: 500,
            gold: 400,
            items: ['Mystery Box', 'Treasure Map Fragment'],
            renown: 50
          },
          difficulty: 'medium',
          estimatedDuration: 60,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
          category: 'exploration',
          tags: ['treasure', 'puzzle', 'timed'],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },

        {
          id: `dynamic-monster-outbreak-${Date.now()}`,
          title: 'Shadow Beast Outbreak',
          type: 'dynamic',
          description: 'Shadow Beasts have appeared in Northampton! Defeat 5 of them before they escape into the darkness.',
          location: {
            latitude: NORTHAMPTON_CENTER.lat,
            longitude: NORTHAMPTON_CENTER.lng,
            name: 'Northampton Town Center',
            radius: 1500
          },
          objectives: [
            'Locate Shadow Beast spawn points',
            'Defeat 5 Shadow Beasts',
            'Collect Shadow Essence',
            'Report back to the Guild'
          ],
          rewards: {
            xp: 1000,
            gold: 600,
            items: ['Shadow Essence', 'Dark Crystal', 'Beast Claw'],
            renown: 100
          },
          difficulty: 'hard',
          estimatedDuration: 90,
          expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours
          category: 'combat',
          tags: ['battle', 'urgent', 'timed'],
          requiredLevel: 5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      // Seed static quests
      console.log(`🗺️ [Northampton Seeder] Seeding ${staticQuests.length} static quests...`);
      for (const quest of staticQuests) {
        await setDoc(doc(staticQuestsRef, quest.id), quest);
      }

      // Seed dynamic quests
      console.log(`⏱️ [Northampton Seeder] Seeding ${dynamicQuests.length} dynamic quests...`);
      for (const quest of dynamicQuests) {
        await setDoc(doc(dynamicQuestsRef, quest.id), quest);
      }

      Alert.alert(
        '🧪 Northampton Quests Seeded!',
        `Successfully seeded:\n\n✅ ${staticQuests.length} static landmark quests\n✅ ${dynamicQuests.length} dynamic timed quests\n\n⚠️ TEST SYSTEM - Will be replaced with auto-loading in production.`,
        [{ text: 'OK' }]
      );

      console.log('✅ [Northampton Seeder] All quests seeded successfully');

      if (onQuestsSeeded) {
        onQuestsSeeded();
      }
    } catch (error: any) {
      console.error('❌ [Northampton Seeder] Error seeding quests:', error);
      Alert.alert('Error', `Failed to seed quests: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={seedNorthamptonQuests}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <>
            <Text style={styles.buttonIcon}>🗺️</Text>
            <Text style={styles.buttonText}>Seed Northampton Quests</Text>
          </>
        )}
      </Pressable>
      <Text style={styles.subtext}>🧪 TEST ONLY: Seeds 6 static + 2 dynamic quests</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: 'center'
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#9b59b6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  buttonDisabled: {
    opacity: 0.6
  },
  buttonIcon: {
    fontSize: 18
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600'
  },
  subtext: {
    marginTop: 4,
    fontSize: 10,
    color: '#8e8e93',
    fontStyle: 'italic'
  }
});
