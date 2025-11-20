import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import type { Party, PartyMember, PartyRole } from '@/types/party';

interface PartyFormationModalProps {
  visible: boolean;
  onClose: () => void;
  onStartBattle: (party: Party) => void;
  mode: '2v2' | '4v4_raid';
  targetBoss?: {
    id: string;
    name: string;
    difficulty: 'Normal' | 'Heroic' | 'Mythic';
  };
  currentUser: {
    userId: string;
    characterId: string;
    characterName: string;
    characterClass: string;
    level: number;
  };
}

/**
 * Party Formation Modal
 * 
 * Create/join parties for 2v2 brawls or 4v4 boss raids
 * Features:
 * - Role selection
 * - Party composition
 * - Ready checks
 * - Matchmaking
 */
export function PartyFormationModal({
  visible,
  onClose,
  onStartBattle,
  mode,
  targetBoss,
  currentUser
}: PartyFormationModalProps) {
  const [selectedRole, setSelectedRole] = useState<PartyRole>('DPS');
  const [isReady, setIsReady] = useState(false);
  const [partyMembers, setPartyMembers] = useState<PartyMember[]>([]);
  const [isMatchmaking, setIsMatchmaking] = useState(false);

  const maxSize = mode === '2v2' ? 2 : 4;

  useEffect(() => {
    if (visible) {
      // Initialize with current user
      setPartyMembers([{
        userId: currentUser.userId,
        characterId: currentUser.characterId,
        characterName: currentUser.characterName,
        characterClass: currentUser.characterClass,
        level: currentUser.level,
        role: selectedRole,
        isReady: false,
        isLeader: true,
        hp: 100,
        maxHp: 100,
        mana: 50,
        maxMana: 50
      }]);
      setIsReady(false);
      setIsMatchmaking(false);
    }
  }, [visible, currentUser, selectedRole]);

  const handleRoleSelect = (role: PartyRole) => {
    setSelectedRole(role);
    setPartyMembers(prev => prev.map(m => 
      m.userId === currentUser.userId ? { ...m, role } : m
    ));
  };

  const handleToggleReady = () => {
    setIsReady(!isReady);
    setPartyMembers(prev => prev.map(m =>
      m.userId === currentUser.userId ? { ...m, isReady: !isReady } : m
    ));
  };

  const handleStartMatchmaking = () => {
    setIsMatchmaking(true);
    // TODO: Call matchmaking Cloud Function
    Alert.alert('Matchmaking', 'Searching for players...');
    
    // Simulate finding players after 3 seconds
    setTimeout(() => {
      // Add simulated players
      const aiPlayers = generateAIPlayers(maxSize - partyMembers.length);
      setPartyMembers(prev => [...prev, ...aiPlayers]);
      setIsMatchmaking(false);
      Alert.alert('Party Full!', 'All players found. Click Start when ready.');
    }, 3000);
  };

  const handleStartBattle = () => {
    const allReady = partyMembers.every(m => m.isReady);
    
    if (!allReady) {
      Alert.alert('Not Ready', 'All party members must be ready!');
      return;
    }

    if (partyMembers.length < maxSize) {
      Alert.alert('Party Not Full', `Need ${maxSize} players for ${mode}`);
      return;
    }

    const party: Party = {
      id: `party_${Date.now()}`,
      leaderId: currentUser.userId,
      members: partyMembers,
      maxSize,
      status: 'ready',
      battleMode: mode,
      targetBossId: targetBoss?.id,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    onStartBattle(party);
  };

  const roleIcons: Record<PartyRole, string> = {
    Tank: '🛡️',
    DPS: '⚔️',
    Support: '❤️',
    Flex: '🎯'
  };

  const roleDescriptions: Record<PartyRole, string> = {
    Tank: 'High HP, protect allies',
    DPS: 'High damage output',
    Support: 'Healing and buffs',
    Flex: 'Adapt to party needs'
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={['#2a1a4e', '#1a1a2e']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>
                {mode === '2v2' ? '2v2 Brawl' : '4v4 Boss Raid'}
              </Text>
              {targetBoss && (
                <View style={styles.bossInfo}>
                  <Text style={styles.bossName}>💀 {targetBoss.name}</Text>
                  <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(targetBoss.difficulty) }]}>
                    <Text style={styles.difficultyText}>{targetBoss.difficulty}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Role Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Your Role</Text>
              <View style={styles.rolesGrid}>
                {(['Tank', 'DPS', 'Support', 'Flex'] as PartyRole[]).map(role => (
                  <Pressable
                    key={role}
                    style={[
                      styles.roleButton,
                      selectedRole === role && styles.roleButtonSelected
                    ]}
                    onPress={() => handleRoleSelect(role)}
                  >
                    <Text style={styles.roleIcon}>{roleIcons[role]}</Text>
                    <Text style={styles.roleName}>{role}</Text>
                    <Text style={styles.roleDesc}>{roleDescriptions[role]}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Party Members */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Party ({partyMembers.length}/{maxSize})</Text>
              <ScrollView style={styles.membersList}>
                {partyMembers.map((member, index) => (
                  <View key={member.userId} style={styles.memberCard}>
                    <View style={styles.memberInfo}>
                      <Text style={styles.memberRole}>{roleIcons[member.role]}</Text>
                      <View style={styles.memberDetails}>
                        <Text style={styles.memberName}>
                          {member.characterName} {member.isLeader && '👑'}
                        </Text>
                        <Text style={styles.memberClass}>
                          {member.characterClass} • Lv{member.level}
                        </Text>
                      </View>
                    </View>
                    <View style={[
                      styles.readyBadge,
                      { backgroundColor: member.isReady ? '#4caf50' : '#666666' }
                    ]}>
                      <Text style={styles.readyText}>
                        {member.isReady ? '✅ Ready' : '⏳ Not Ready'}
                      </Text>
                    </View>
                  </View>
                ))}

                {/* Empty slots */}
                {Array.from({ length: maxSize - partyMembers.length }).map((_, i) => (
                  <View key={`empty-${i}`} style={[styles.memberCard, styles.emptySlot]}>
                    <Text style={styles.emptySlotText}>Empty Slot</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              {/* Ready Button */}
              <Pressable
                style={[styles.actionButton, isReady && styles.readyButton]}
                onPress={handleToggleReady}
              >
                <Text style={styles.actionButtonText}>
                  {isReady ? '✅ Ready' : '⏳ Ready Up'}
                </Text>
              </Pressable>

              {/* Matchmaking Button (only for leader) */}
              {partyMembers.length < maxSize && partyMembers.find(m => m.userId === currentUser.userId)?.isLeader && (
                <Pressable
                  style={[styles.actionButton, styles.matchmakingButton, isMatchmaking && styles.actionButtonDisabled]}
                  onPress={handleStartMatchmaking}
                  disabled={isMatchmaking}
                >
                  <Text style={styles.actionButtonText}>
                    {isMatchmaking ? '🔍 Searching...' : '🔍 Find Players'}
                  </Text>
                </Pressable>
              )}

              {/* Start Button (only for leader when all ready) */}
              {partyMembers.find(m => m.userId === currentUser.userId)?.isLeader && (
                <Pressable
                  style={[styles.actionButton, styles.startButton]}
                  onPress={handleStartBattle}
                >
                  <Text style={styles.actionButtonText}>🎮 Start Battle</Text>
                </Pressable>
              )}
            </View>

            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Mythic': return '#ff0000';
    case 'Heroic': return '#ff9800';
    case 'Normal': return '#4caf50';
    default: return '#666666';
  }
}

function generateAIPlayers(count: number): PartyMember[] {
  const roles: PartyRole[] = ['Tank', 'DPS', 'Support', 'Flex'];
  const classes = ['Warrior', 'Mage', 'Rogue', 'Paladin'];
  const names = ['Aragorn', 'Legolas', 'Gimli', 'Gandalf', 'Frodo', 'Sam', 'Pippin', 'Merry'];

  return Array.from({ length: count }, (_, i) => ({
    userId: `ai_${Date.now()}_${i}`,
    characterId: `ai_char_${i}`,
    characterName: names[i % names.length],
    characterClass: classes[i % classes.length],
    level: 5 + Math.floor(Math.random() * 10),
    role: roles[i % roles.length],
    isReady: false,
    isLeader: false,
    hp: 100,
    maxHp: 100,
    mana: 50,
    maxMana: 50
  }));
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  container: {
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%'
  },
  content: {
    borderRadius: 16,
    padding: 24,
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  header: {
    marginBottom: 24,
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 12
  },
  bossInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  bossName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  difficultyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  roleButton: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center'
  },
  roleButtonSelected: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderColor: '#4488ff'
  },
  roleIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  roleName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  roleDesc: {
    fontSize: 11,
    color: '#8e8e93',
    textAlign: 'center'
  },
  membersList: {
    maxHeight: 200
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8
  },
  emptySlot: {
    justifyContent: 'center',
    opacity: 0.5
  },
  emptySlotText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center'
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1
  },
  memberRole: {
    fontSize: 28
  },
  memberDetails: {
    flex: 1
  },
  memberName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  memberClass: {
    fontSize: 12,
    color: '#8e8e93'
  },
  readyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  readyText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  actions: {
    gap: 12
  },
  actionButton: {
    backgroundColor: '#4488ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  readyButton: {
    backgroundColor: '#4caf50'
  },
  matchmakingButton: {
    backgroundColor: '#ff9800'
  },
  startButton: {
    backgroundColor: '#2196f3'
  },
  actionButtonDisabled: {
    opacity: 0.5
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff'
  }
});
