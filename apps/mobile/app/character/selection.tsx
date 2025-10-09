import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFirebase } from '@/lib/firebase-context';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

interface Character {
  id: string;
  name: string;
  classId: string;
  level: number;
  gold: number;
  counters: {
    hp: number;
    mana: number;
    xp: number;
  };
  stats: {
    maxHp: number;
    maxMana: number;
  };
  lastPlayed?: string;
}

export default function CharacterSelectionScreen() {
  const { db, user } = useFirebase();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCharId, setSelectedCharId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  async function loadCharacters() {
    if (!user) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, 'characters'),
        where('uid', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const chars: Character[] = [];

      snapshot.forEach(doc => {
        chars.push({ id: doc.id, ...doc.data() } as Character);
      });

      // Sort by last played
      chars.sort((a, b) => {
        const dateA = a.lastPlayed ? new Date(a.lastPlayed).getTime() : 0;
        const dateB = b.lastPlayed ? new Date(b.lastPlayed).getTime() : 0;
        return dateB - dateA;
      });

      setCharacters(chars);

      // Auto-select first character
      if (chars.length > 0 && !selectedCharId) {
        setSelectedCharId(chars[0].id);
      }
    } catch (error) {
      console.error('Failed to load characters:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateCharacter() {
    router.push('/character/create');
  }

  function handleSelectCharacter() {
    if (!selectedCharId) return;

    // Store selected character ID in localStorage for web
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedCharacterId', selectedCharId);
    }

    // Navigate to main app
    router.replace('/(tabs)');
  }

  function handleDeleteCharacter(charId: string) {
    const character = characters.find(c => c.id === charId);
    if (!character) return;

    // First confirmation
    Alert.alert(
      '⚠️ Delete Character?',
      `Are you sure you want to delete "${character.classId}"?\n\nLevel ${character.level} • ${character.gold} Gold`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteStep2(charId, character)
        }
      ]
    );
  }

  function confirmDeleteStep2(charId: string, character: Character) {
    // Second confirmation - make them type DELETE
    Alert.alert(
      '⚠️ FINAL WARNING',
      `This action CANNOT be undone!\n\nYou will lose:\n• Level ${character.level} character\n• ${character.gold} Gold\n• All items and equipment\n• All quest progress\n\nAre you ABSOLUTELY sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'YES, DELETE',
          style: 'destructive',
          onPress: () => executeDelete(charId)
        }
      ]
    );
  }

  async function executeDelete(charId: string) {
    try {
      await deleteDoc(doc(db, 'characters', charId));

      // If this was the selected character, clear selection
      if (selectedCharId === charId) {
        setSelectedCharId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('selectedCharacterId');
        }
      }

      // Reload characters
      await loadCharacters();

      Alert.alert('Character Deleted', 'Your character has been permanently deleted.');
    } catch (error) {
      console.error('Failed to delete character:', error);
      Alert.alert('Error', 'Failed to delete character. Please try again.');
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffd700" />
          <Text style={styles.loadingText}>Loading characters...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Character</Text>
        <Text style={styles.subtitle}>Choose your hero to enter the realm</Text>
      </View>

      {/* Character List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {characters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            selected={selectedCharId === char.id}
            onSelect={() => setSelectedCharId(char.id)}
            onDelete={() => handleDeleteCharacter(char.id)}
          />
        ))}

        {/* Create New Character Card */}
        <Pressable style={styles.createCard} onPress={handleCreateCharacter}>
          <View style={styles.createCardInner}>
            <Text style={styles.createIcon}>➕</Text>
            <Text style={styles.createText}>Create New Character</Text>
            <Text style={styles.createSubtext}>Begin your adventure</Text>
          </View>
        </Pressable>

        {characters.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>⚔️</Text>
            <Text style={styles.emptyText}>No characters yet</Text>
            <Text style={styles.emptySubtext}>Create your first hero to begin!</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Actions */}
      {selectedCharId && (
        <View style={styles.bottomBar}>
          <Pressable
            style={styles.selectButton}
            onPress={handleSelectCharacter}
          >
            <LinearGradient
              colors={['#ffd700', '#ffaa00']}
              style={styles.selectButtonGradient}
            >
              <Text style={styles.selectButtonText}>Enter Realm</Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
}

function CharacterCard({
  character,
  selected,
  onSelect,
  onDelete
}: {
  character: Character;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const classIcons: Record<string, string> = {
    warrior: '⚔️',
    mage: '🔮',
    ranger: '🏹',
    rogue: '🗡️'
  };

  const hpPercent = (character.counters.hp / character.stats.maxHp) * 100;
  const manaPercent = (character.counters.mana / character.stats.maxMana) * 100;

  return (
    <Pressable
      style={[styles.characterCard, selected && styles.characterCardSelected]}
      onPress={onSelect}
    >
      <LinearGradient
        colors={selected ? ['rgba(255, 215, 0, 0.2)', 'rgba(255, 170, 0, 0.1)'] : ['#2a2a3e', '#1a1a2e']}
        style={styles.characterCardGradient}
      >
        {/* Class Icon */}
        <View style={styles.characterIcon}>
          <Text style={styles.characterIconText}>
            {classIcons[character.classId] || '⚔️'}
          </Text>
        </View>

        {/* Character Info */}
        <View style={styles.characterInfo}>
          <Text style={styles.characterName}>{character.classId}</Text>
          <Text style={styles.characterClass}>
            Level {character.level}
          </Text>

          {/* HP Bar */}
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>HP</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, styles.hpBar, { width: `${hpPercent}%` }]} />
            </View>
            <Text style={styles.statValue}>{character.counters.hp}/{character.stats.maxHp}</Text>
          </View>

          {/* Mana Bar */}
          <View style={styles.statBar}>
            <Text style={styles.statLabel}>MP</Text>
            <View style={styles.barContainer}>
              <View style={[styles.barFill, styles.manaBar, { width: `${manaPercent}%` }]} />
            </View>
            <Text style={styles.statValue}>{character.counters.mana}/{character.stats.maxMana}</Text>
          </View>

          {/* Gold */}
          <View style={styles.goldRow}>
            <Text style={styles.goldIcon}>💰</Text>
            <Text style={styles.goldText}>{character.gold} Gold</Text>
          </View>
        </View>

        {/* Selected Indicator */}
        {selected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIcon}>✓</Text>
          </View>
        )}

        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={onDelete}
          activeOpacity={0.7}
        >
          <Text style={styles.deleteButtonText}>🗑️</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8,
    textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
  },
  subtitle: {
    fontSize: 16,
    color: '#e6d5b8',
    fontStyle: 'italic'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100
  },
  characterCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden'
  },
  characterCardSelected: {
    borderWidth: 3,
    borderColor: '#ffd700',
    shadowColor: '#ffd700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12
  },
  characterCardGradient: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  characterIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16
  },
  characterIconText: {
    fontSize: 48
  },
  characterInfo: {
    flex: 1,
    gap: 8
  },
  characterName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  characterClass: {
    fontSize: 14,
    color: '#8e8e93',
    textTransform: 'capitalize'
  },
  statBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    width: 24
  },
  barContainer: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 6,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 6
  },
  hpBar: {
    backgroundColor: '#e74c3c'
  },
  manaBar: {
    backgroundColor: '#3498db'
  },
  statValue: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
    width: 60,
    textAlign: 'right'
  },
  goldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  goldIcon: {
    fontSize: 16
  },
  goldText: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600'
  },
  selectedIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffd700',
    justifyContent: 'center',
    alignItems: 'center'
  },
  selectedIcon: {
    fontSize: 20,
    color: '#1a1a2e',
    fontWeight: 'bold'
  },
  createCard: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden'
  },
  createCardInner: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    borderStyle: 'dashed',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  createIcon: {
    fontSize: 48,
    marginBottom: 12,
    color: '#ffd700'
  },
  createText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 4
  },
  createSubtext: {
    fontSize: 14,
    color: '#e6d5b8',
    fontStyle: 'italic'
  },
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 20,
    color: '#8e8e93',
    fontWeight: '600',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#5e5e6e',
    fontStyle: 'italic'
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: 'rgba(15, 15, 30, 0.95)',
    borderTopWidth: 2,
    borderTopColor: '#ffd700'
  },
  selectButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  selectButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  selectButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a2e',
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  deleteButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#c0392b',
    zIndex: 10,
    elevation: 10
  },
  deleteButtonText: {
    fontSize: 18
  }
});
