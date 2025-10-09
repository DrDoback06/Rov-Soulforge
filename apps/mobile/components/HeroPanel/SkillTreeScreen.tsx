import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Character } from '@rov/types';

interface SkillTreeScreenProps {
  character: Character | null;
  loading?: boolean;
}

interface Skill {
  id: string;
  name: string;
  level: number;
  maxLevel: number;
  description: string;
  cost: number; // Skill points required
  unlocked: boolean;
  icon: string;
}

/**
 * Skill Tree Screen
 * 
 * Features:
 * - Two linear base skill trees (class-specific + type boosts)
 * - Free-form grid for adding/upgrading skills
 * - Dynamic scalable skill levels (like Diablo II)
 * - Skill point allocation system
 */
export function SkillTreeScreen({ character, loading }: SkillTreeScreenProps) {
  if (loading || !character) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading skills...</Text>
      </View>
    );
  }

  // Calculate available skill points
  const skillPoints = Math.floor(character.level * 2) - character.skills.length;

  // Mock skills (TODO: Load from character.skills and skill definitions)
  const classSkills: Skill[] = [
    {
      id: 'fireball',
      name: 'Fireball',
      level: 3,
      maxLevel: 20,
      description: 'Hurl a ball of fire dealing 50 + (10 x level) damage',
      cost: 1,
      unlocked: true,
      icon: '🔥'
    },
    {
      id: 'frost_armor',
      name: 'Frost Armor',
      level: 1,
      maxLevel: 10,
      description: 'Increases armor by 20 x level for 60 seconds',
      cost: 1,
      unlocked: true,
      icon: '❄️'
    },
    {
      id: 'teleport',
      name: 'Teleport',
      level: 0,
      maxLevel: 1,
      description: 'Instantly teleport to target location',
      cost: 1,
      unlocked: false,
      icon: '⚡'
    }
  ];

  const passiveSkills: Skill[] = [
    {
      id: 'fire_mastery',
      name: 'Fire Mastery',
      level: 2,
      maxLevel: 20,
      description: '+5% fire damage per level',
      cost: 1,
      unlocked: true,
      icon: '🔥'
    },
    {
      id: 'mana_shield',
      name: 'Mana Shield',
      level: 0,
      maxLevel: 10,
      description: 'Damage is taken from mana before HP',
      cost: 1,
      unlocked: false,
      icon: '🛡️'
    }
  ];

  const handleUpgradeSkill = (skill: Skill) => {
    if (skillPoints <= 0) return;
    if (!skill.unlocked) return;
    if (skill.level >= skill.maxLevel) return;

    // TODO: Call API to upgrade skill
    console.log('Upgrading skill:', skill.name);
  };

  const handleUnlockSkill = (skill: Skill) => {
    if (skillPoints <= 0) return;
    if (skill.unlocked) return;

    // TODO: Call API to unlock skill
    console.log('Unlocking skill:', skill.name);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={['#2a1810', '#1a1a2e']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Skill Tree</Text>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsLabel}>Available Points:</Text>
          <Text style={styles.pointsValue}>{skillPoints}</Text>
        </View>
      </LinearGradient>

      {/* Active Skills Tree */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🗡️ Active Skills</Text>
        <View style={styles.skillTree}>
          {classSkills.map(skill => (
            <View key={skill.id} style={styles.skillContainer}>
              <LinearGradient
                colors={skill.unlocked ? ['#1a1a2e', '#2a2a3e'] : ['#0a0a0f', '#1a1a1f']}
                style={[
                  styles.skillBox,
                  !skill.unlocked && styles.skillBoxLocked
                ]}
              >
                {/* Skill Icon */}
                <View style={styles.skillIconContainer}>
                  <Text style={styles.skillIcon}>{skill.icon}</Text>
                  {skill.level > 0 && (
                    <View style={styles.skillLevelBadge}>
                      <Text style={styles.skillLevelText}>{skill.level}</Text>
                    </View>
                  )}
                </View>

                {/* Skill Info */}
                <Text style={[styles.skillName, !skill.unlocked && styles.skillNameLocked]}>
                  {skill.name}
                </Text>
                <Text style={styles.skillDescription}>{skill.description}</Text>

                {/* Skill Level Bar */}
                {skill.unlocked && (
                  <View style={styles.skillLevelBar}>
                    <View 
                      style={[
                        styles.skillLevelFill,
                        { width: `${(skill.level / skill.maxLevel) * 100}%` }
                      ]}
                    />
                    <Text style={styles.skillLevelLabel}>
                      {skill.level} / {skill.maxLevel}
                    </Text>
                  </View>
                )}

                {/* Action Button */}
                <Pressable
                  style={[
                    styles.skillButton,
                    (skillPoints <= 0 || (!skill.unlocked && skill.cost > skillPoints) ||
                     (skill.unlocked && skill.level >= skill.maxLevel)) && styles.skillButtonDisabled
                  ]}
                  onPress={() => skill.unlocked ? handleUpgradeSkill(skill) : handleUnlockSkill(skill)}
                  disabled={skillPoints <= 0 || (!skill.unlocked && skill.cost > skillPoints) ||
                           (skill.unlocked && skill.level >= skill.maxLevel)}
                >
                  <Text style={styles.skillButtonText}>
                    {!skill.unlocked ? `Unlock (${skill.cost})` :
                     skill.level >= skill.maxLevel ? 'Maxed' : `Upgrade (+1)`}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          ))}
        </View>
      </View>

      {/* Passive Skills Tree */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🌟 Passive Skills</Text>
        <View style={styles.skillTree}>
          {passiveSkills.map(skill => (
            <View key={skill.id} style={styles.skillContainer}>
              <LinearGradient
                colors={skill.unlocked ? ['#1a2a1a', '#2a3a2a'] : ['#0a0a0f', '#1a1a1f']}
                style={[
                  styles.skillBox,
                  !skill.unlocked && styles.skillBoxLocked
                ]}
              >
                {/* Skill Icon */}
                <View style={styles.skillIconContainer}>
                  <Text style={styles.skillIcon}>{skill.icon}</Text>
                  {skill.level > 0 && (
                    <View style={styles.skillLevelBadge}>
                      <Text style={styles.skillLevelText}>{skill.level}</Text>
                    </View>
                  )}
                </View>

                {/* Skill Info */}
                <Text style={[styles.skillName, !skill.unlocked && styles.skillNameLocked]}>
                  {skill.name}
                </Text>
                <Text style={styles.skillDescription}>{skill.description}</Text>

                {/* Skill Level Bar */}
                {skill.unlocked && (
                  <View style={styles.skillLevelBar}>
                    <View 
                      style={[
                        styles.skillLevelFill,
                        { width: `${(skill.level / skill.maxLevel) * 100}%`, backgroundColor: '#4a9eff' }
                      ]}
                    />
                    <Text style={styles.skillLevelLabel}>
                      {skill.level} / {skill.maxLevel}
                    </Text>
                  </View>
                )}

                {/* Action Button */}
                <Pressable
                  style={[
                    styles.skillButton,
                    (skillPoints <= 0 || (!skill.unlocked && skill.cost > skillPoints) ||
                     (skill.unlocked && skill.level >= skill.maxLevel)) && styles.skillButtonDisabled
                  ]}
                  onPress={() => skill.unlocked ? handleUpgradeSkill(skill) : handleUnlockSkill(skill)}
                  disabled={skillPoints <= 0 || (!skill.unlocked && skill.cost > skillPoints) ||
                           (skill.unlocked && skill.level >= skill.maxLevel)}
                >
                  <Text style={styles.skillButtonText}>
                    {!skill.unlocked ? `Unlock (${skill.cost})` :
                     skill.level >= skill.maxLevel ? 'Maxed' : `Upgrade (+1)`}
                  </Text>
                </Pressable>
              </LinearGradient>
            </View>
          ))}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  pointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  pointsLabel: {
    color: '#aaa',
    fontSize: 14
  },
  pointsValue: {
    color: '#4a9eff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  skillTree: {
    gap: 12
  },
  skillContainer: {
    marginBottom: 4
  },
  skillBox: {
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e'
  },
  skillBoxLocked: {
    opacity: 0.6,
    borderColor: '#1a1a1f'
  },
  skillIconContainer: {
    position: 'relative',
    width: 48,
    height: 48,
    marginBottom: 12
  },
  skillIcon: {
    fontSize: 40
  },
  skillLevelBadge: {
    position: 'absolute',
    right: -8,
    bottom: -8,
    backgroundColor: '#ffd700',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center'
  },
  skillLevelText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold'
  },
  skillName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4
  },
  skillNameLocked: {
    color: '#666'
  },
  skillDescription: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 12,
    lineHeight: 18
  },
  skillLevelBar: {
    height: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative'
  },
  skillLevelFill: {
    height: '100%',
    backgroundColor: '#ff4444',
    borderRadius: 4
  },
  skillLevelLabel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 20
  },
  skillButton: {
    backgroundColor: '#4a9eff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
    alignItems: 'center'
  },
  skillButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5
  },
  skillButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold'
  }
});

