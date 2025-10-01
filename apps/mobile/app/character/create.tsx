import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { createCharacter } from '@/hooks/useCharacter';
import type { ClassId, Alignment } from '@rov/types';

/**
 * Character Creation Screen
 * First-time character setup for new players
 */
export default function CreateCharacterScreen() {
  const [selectedClass, setSelectedClass] = useState<ClassId | null>(null);
  const [selectedAlignment, setSelectedAlignment] = useState<Alignment>('Neutral');
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const { db } = useFirebase();

  const classes: Array<{
    id: ClassId;
    name: string;
    description: string;
    icon: string;
    stats: string;
  }> = [
    {
      id: 'Warrior',
      name: 'Warrior',
      description: 'Masters of melee combat with high HP and armor',
      icon: '⚔️',
      stats: 'HP: ★★★★★ | ATK: ★★★★☆ | SPD: ★★☆☆☆',
    },
    {
      id: 'Mage',
      name: 'Mage',
      description: 'Wielders of arcane power with devastating spells',
      icon: '🔮',
      stats: 'HP: ★★☆☆☆ | ATK: ★★★★☆ | SPD: ★★★☆☆',
    },
    {
      id: 'Rogue',
      name: 'Rogue',
      description: 'Swift strikers who excel at critical hits',
      icon: '🗡️',
      stats: 'HP: ★★★☆☆ | ATK: ★★★☆☆ | SPD: ★★★★★',
    },
    {
      id: 'Paladin',
      name: 'Paladin',
      description: 'Holy warriors who protect and heal allies',
      icon: '🛡️',
      stats: 'HP: ★★★★★ | ATK: ★★★★☆ | SPD: ★★☆☆☆',
    },
    {
      id: 'Ranger',
      name: 'Ranger',
      description: 'Masters of ranged combat and nature magic',
      icon: '🏹',
      stats: 'HP: ★★★★☆ | ATK: ★★★☆☆ | SPD: ★★★★☆',
    },
    {
      id: 'Necromancer',
      name: 'Necromancer',
      description: 'Dark mages who command the undead',
      icon: '💀',
      stats: 'HP: ★★★☆☆ | ATK: ★★★☆☆ | SPD: ★★★☆☆',
    },
    {
      id: 'Bard',
      name: 'Bard',
      description: 'Support specialists who buff allies',
      icon: '🎵',
      stats: 'HP: ★★★★☆ | ATK: ★★☆☆☆ | SPD: ★★★★☆',
    },
    {
      id: 'Druid',
      name: 'Druid',
      description: 'Shapeshifters who harness nature\'s power',
      icon: '🌿',
      stats: 'HP: ★★★★☆ | ATK: ★★★☆☆ | SPD: ★★★☆☆',
    },
  ];

  const alignments: Array<{ id: Alignment; name: string; description: string }> = [
    { id: 'Holy', name: 'Holy', description: 'Channel divine light to smite evil' },
    { id: 'Chaos', name: 'Chaos', description: 'Embrace unpredictable chaotic power' },
    { id: 'Arcane', name: 'Arcane', description: 'Master pure magical energy' },
    { id: 'Neutral', name: 'Neutral', description: 'Balance all forces equally' },
  ];

  const handleCreateCharacter = async () => {
    if (!selectedClass) {
      Alert.alert('Select a Class', 'Please choose your character class');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a character');
      return;
    }

    setLoading(true);

    try {
      console.log('Creating character...', { uid: user.uid, class: selectedClass, alignment: selectedAlignment });
      await createCharacter(user.uid, selectedClass, selectedAlignment, db);
      console.log('Character created successfully!');
      Alert.alert('Success!', `Your ${selectedClass} has been created. Begin your adventure!`);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Character creation error:', error);
      Alert.alert('Error Creating Character',
        `Failed to create character.\n\nError: ${error.message || error.toString()}\n\nThis is likely a Firebase permissions issue. Check the browser console (F12) for details.`
      );
    } finally {
      setLoading(false);
    }
  };

  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.replace('/auth/login');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Your Hero</Text>
          <Text style={styles.subtitle}>Choose your path in the Realm of Valor</Text>
          <Pressable onPress={handleSignOut} style={styles.signOutButton}>
            <Text style={styles.signOutText}>← Sign Out</Text>
          </Pressable>
        </View>

        {/* Class Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Class</Text>
          <View style={styles.classGrid}>
            {classes.map((classOption) => (
              <Pressable
                key={classOption.id}
                style={[
                  styles.classCard,
                  selectedClass === classOption.id && styles.classCardSelected,
                ]}
                onPress={() => setSelectedClass(classOption.id)}
              >
                <Text style={styles.classIcon}>{classOption.icon}</Text>
                <Text style={styles.className}>{classOption.name}</Text>
                <Text style={styles.classDescription}>{classOption.description}</Text>
                <Text style={styles.classStats}>{classOption.stats}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Alignment Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Your Alignment</Text>
          <View style={styles.alignmentContainer}>
            {alignments.map((alignment) => (
              <Pressable
                key={alignment.id}
                style={[
                  styles.alignmentCard,
                  selectedAlignment === alignment.id && styles.alignmentCardSelected,
                ]}
                onPress={() => setSelectedAlignment(alignment.id)}
              >
                <Text style={styles.alignmentName}>{alignment.name}</Text>
                <Text style={styles.alignmentDescription}>{alignment.description}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Create Button */}
        <Pressable
          style={[styles.createButton, !selectedClass && styles.createButtonDisabled]}
          onPress={handleCreateCharacter}
          disabled={!selectedClass || loading}
        >
          <LinearGradient
            colors={selectedClass ? ['#4488ff', '#2244cc'] : ['#5e5e6e', '#4a4a5e']}
            style={styles.createButtonGradient}
          >
            <Text style={styles.createButtonText}>
              {loading ? 'Creating...' : 'Begin Adventure'}
            </Text>
          </LinearGradient>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    textAlign: 'center',
  },
  signOutButton: {
    marginTop: 16,
    padding: 8,
  },
  signOutText: {
    color: '#4488ff',
    fontSize: 14,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },
  classGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  classCard: {
    width: '48%',
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4a4a5e',
  },
  classCardSelected: {
    borderColor: '#4488ff',
    backgroundColor: '#2a3a5e',
  },
  classIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  classDescription: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    marginBottom: 8,
  },
  classStats: {
    fontSize: 10,
    color: '#ffd700',
    textAlign: 'center',
  },
  alignmentContainer: {
    gap: 12,
  },
  alignmentCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4a4a5e',
  },
  alignmentCardSelected: {
    borderColor: '#4488ff',
    backgroundColor: '#2a3a5e',
  },
  alignmentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  alignmentDescription: {
    fontSize: 14,
    color: '#8e8e93',
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
