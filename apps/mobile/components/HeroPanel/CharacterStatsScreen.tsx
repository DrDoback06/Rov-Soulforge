import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Character } from '@rov/types';

interface CharacterStatsScreenProps {
  character: Character | null;
  loading?: boolean;
}

/**
 * Character Stats Screen
 * 
 * Displays comprehensive character statistics:
 * - Core stats (HP, Mana, Level, XP)
 * - Attributes (Strength, Dexterity, Intelligence, Vitality)
 * - Combat stats (Armor, Damage, Crit Chance)
 * - Misc stats (Magic Find, Gold)
 * 
 * Styled like a Diablo II character sheet
 */
export function CharacterStatsScreen({ character, loading }: CharacterStatsScreenProps) {
  if (loading || !character) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading character...</Text>
      </View>
    );
  }

  // Calculate derived stats
  const maxHp = character.stats.maxHp || 100;
  const maxMana = character.stats.maxMana || 50;
  const hpPercent = (character.counters.hp / maxHp) * 100;
  const manaPercent = (character.counters.mana / maxMana) * 100;
  const xpForNextLevel = character.level * 1000; // Simple formula
  const xpPercent = (character.counters.xp / xpForNextLevel) * 100;

  // Core attributes (TODO: Add these to Character type)
  const strength = character.stats.atk || 10;
  const dexterity = character.stats.spd || 10;
  const intelligence = 10; // TODO: Add to type
  const vitality = character.stats.def || 10;

  // Combat stats
  const armor = character.stats.def * 2;
  const damage = character.stats.atk * 3;
  const critChance = Math.min(5 + (dexterity * 0.5), 50); // Max 50%
  const magicFind = 0; // TODO: Add to type

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={['#2a1810', '#1a1a2e']}
        style={styles.header}
      >
        <Text style={styles.characterName}>{character.classId || 'Adventurer'}</Text>
        <Text style={styles.characterLevel}>Level {character.level}</Text>
      </LinearGradient>

      {/* Core Counters */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Core Stats</Text>
        
        {/* HP */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Health</Text>
          <View style={styles.statBarContainer}>
            <LinearGradient
              colors={['#8b0000', '#ff0000']}
              style={[styles.statBar, { width: `${hpPercent}%` }]}
            />
            <Text style={styles.statValue}>
              {character.counters.hp} / {maxHp}
            </Text>
          </View>
        </View>

        {/* Mana */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Mana</Text>
          <View style={styles.statBarContainer}>
            <LinearGradient
              colors={['#00008b', '#0000ff']}
              style={[styles.statBar, { width: `${manaPercent}%` }]}
            />
            <Text style={styles.statValue}>
              {character.counters.mana} / {maxMana}
            </Text>
          </View>
        </View>

        {/* XP */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Experience</Text>
          <View style={styles.statBarContainer}>
            <LinearGradient
              colors={['#4a5f00', '#9acd32']}
              style={[styles.statBar, { width: `${xpPercent}%` }]}
            />
            <Text style={styles.statValue}>
              {character.counters.xp} / {xpForNextLevel}
            </Text>
          </View>
        </View>

        {/* Renown */}
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Renown</Text>
          <Text style={styles.statValueSimple}>{character.counters.renown}</Text>
        </View>
      </View>

      {/* Attributes */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attributes</Text>
        
        <View style={styles.attributeGrid}>
          <View style={styles.attributeBox}>
            <Text style={styles.attributeLabel}>Strength</Text>
            <Text style={styles.attributeValue}>{strength}</Text>
            <Text style={styles.attributeEffect}>+{strength * 3} Damage</Text>
          </View>

          <View style={styles.attributeBox}>
            <Text style={styles.attributeLabel}>Dexterity</Text>
            <Text style={styles.attributeValue}>{dexterity}</Text>
            <Text style={styles.attributeEffect}>+{(dexterity * 0.5).toFixed(1)}% Crit</Text>
          </View>

          <View style={styles.attributeBox}>
            <Text style={styles.attributeLabel}>Intelligence</Text>
            <Text style={styles.attributeValue}>{intelligence}</Text>
            <Text style={styles.attributeEffect}>+{intelligence * 5} Mana</Text>
          </View>

          <View style={styles.attributeBox}>
            <Text style={styles.attributeLabel}>Vitality</Text>
            <Text style={styles.attributeValue}>{vitality}</Text>
            <Text style={styles.attributeEffect}>+{vitality * 10} HP</Text>
          </View>
        </View>
      </View>

      {/* Combat Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Combat</Text>
        
        <View style={styles.combatGrid}>
          <View style={styles.combatStat}>
            <Text style={styles.combatLabel}>Armor</Text>
            <Text style={styles.combatValue}>{armor}</Text>
          </View>

          <View style={styles.combatStat}>
            <Text style={styles.combatLabel}>Damage</Text>
            <Text style={styles.combatValue}>{damage}</Text>
          </View>

          <View style={styles.combatStat}>
            <Text style={styles.combatLabel}>Crit Chance</Text>
            <Text style={styles.combatValue}>{critChance.toFixed(1)}%</Text>
          </View>

          <View style={styles.combatStat}>
            <Text style={styles.combatLabel}>Magic Find</Text>
            <Text style={styles.combatValue}>{magicFind}%</Text>
          </View>
        </View>
      </View>

      {/* Misc Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Resources</Text>
        
        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Gold</Text>
          <Text style={styles.goldValue}>💰 {character.gold}</Text>
        </View>

        <View style={styles.statRow}>
          <Text style={styles.statLabel}>Lives</Text>
          <Text style={styles.statValueSimple}>❤️ {character.lives}</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f'
  },
  content: {
    padding: 16
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40
  },
  header: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center'
  },
  characterName: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  characterLevel: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 4
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 8
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
    width: 100
  },
  statBarContainer: {
    flex: 1,
    height: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    position: 'relative'
  },
  statBar: {
    height: '100%',
    borderRadius: 4
  },
  statValue: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24
  },
  statValueSimple: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  goldValue: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold'
  },
  attributeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  attributeBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e'
  },
  attributeLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  attributeValue: {
    color: '#ffd700',
    fontSize: 32,
    fontWeight: 'bold'
  },
  attributeEffect: {
    color: '#4a9eff',
    fontSize: 11,
    marginTop: 4
  },
  combatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  combatStat: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#2a1810',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a2820'
  },
  combatLabel: {
    color: '#aaa',
    fontSize: 12,
    textTransform: 'uppercase',
    marginBottom: 4
  },
  combatValue: {
    color: '#ff4444',
    fontSize: 24,
    fontWeight: 'bold'
  }
});

