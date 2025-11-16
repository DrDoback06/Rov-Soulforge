import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useParty, type PartyMember } from '@/hooks/useParty';
import { useFirebase } from '@/lib/firebase-context';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut, SlideInRight, SlideOutRight } from 'react-native-reanimated';

interface PartyModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Party Management Modal
 *
 * Features:
 * - Create new party
 * - View party members
 * - Send invites to friends
 * - Manage party settings
 * - Leave/disband party
 */
export function PartyModal({ visible, onClose }: PartyModalProps) {
  const { db, user } = useFirebase();
  const {
    currentParty,
    pendingInvites,
    isLeader,
    canInvite,
    createParty,
    leaveParty,
    sendInvite,
    acceptInvite,
    declineInvite
  } = useParty(db, user?.uid);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [partyName, setPartyName] = useState('');
  const [lootDistribution, setLootDistribution] = useState<'equal' | 'proximity' | 'contribution'>('equal');
  const [friendUsername, setFriendUsername] = useState('');

  const handleCreateParty = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const partyId = await createParty(partyName || undefined, lootDistribution);
    if (partyId) {
      setShowCreateForm(false);
      setPartyName('');
      Alert.alert('Party Created!', 'Your party is ready for adventures!');
    }
  };

  const handleLeaveParty = () => {
    Alert.alert(
      isLeader ? 'Disband Party?' : 'Leave Party?',
      isLeader
        ? 'This will disband the party for all members.'
        : 'Are you sure you want to leave the party?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isLeader ? 'Disband' : 'Leave',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            const success = await leaveParty();
            if (success) {
              Alert.alert('Success', isLeader ? 'Party disbanded' : 'You left the party');
            }
          }
        }
      ]
    );
  };

  const handleSendInvite = async () => {
    if (!friendUsername.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Lookup user by username to get their UID
    // For now, this is a placeholder
    Alert.alert('Invite Sent!', `Invite sent to ${friendUsername}`);
    setFriendUsername('');
    setShowInviteForm(false);
  };

  const handleAcceptInvite = async (inviteId: string, fromUserName: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const success = await acceptInvite(inviteId);
    if (success) {
      Alert.alert('Joined!', `You joined ${fromUserName}'s party!`);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await declineInvite(inviteId);
  };

  const getMemberStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'in_quest': return '#f59e0b';
      case 'offline': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getMemberStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return '🟢';
      case 'in_quest': return '⚔️';
      case 'offline': return '⚫';
      default: return '⚫';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          entering={SlideInRight.springify()}
          exiting={SlideOutRight.springify()}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1e']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>👥</Text>
              <Text style={styles.headerTitle}>Party Management</Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Pending Invites */}
              {pendingInvites.length > 0 && (
                <Animated.View entering={FadeIn} style={styles.section}>
                  <Text style={styles.sectionTitle}>📨 Pending Invites</Text>
                  {pendingInvites.map(invite => (
                    <View key={invite.id} style={styles.inviteCard}>
                      <LinearGradient
                        colors={['#4488ff', '#2266dd']}
                        style={styles.inviteGradient}
                      >
                        <View style={styles.inviteInfo}>
                          <Text style={styles.inviteFrom}>{invite.fromUserName}</Text>
                          <Text style={styles.inviteParty}>{invite.partyName}</Text>
                        </View>
                        <View style={styles.inviteActions}>
                          <Pressable
                            style={[styles.inviteButton, styles.acceptButton]}
                            onPress={() => handleAcceptInvite(invite.id, invite.fromUserName)}
                          >
                            <Text style={styles.inviteButtonText}>✓ Accept</Text>
                          </Pressable>
                          <Pressable
                            style={[styles.inviteButton, styles.declineButton]}
                            onPress={() => handleDeclineInvite(invite.id)}
                          >
                            <Text style={styles.inviteButtonText}>✕</Text>
                          </Pressable>
                        </View>
                      </LinearGradient>
                    </View>
                  ))}
                </Animated.View>
              )}

              {/* Current Party */}
              {currentParty ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>🎮 {currentParty.partyName}</Text>
                    {isLeader && <Text style={styles.leaderBadge}>👑 LEADER</Text>}
                  </View>

                  {/* Party Members */}
                  <View style={styles.membersContainer}>
                    {currentParty.members.map((member, index) => (
                      <View key={member.uid} style={styles.memberCard}>
                        <LinearGradient
                          colors={['#232336', '#181824']}
                          style={styles.memberGradient}
                        >
                          <View style={styles.memberInfo}>
                            <View style={styles.memberHeader}>
                              <Text style={styles.memberAvatar}>{member.avatar || '👤'}</Text>
                              <View style={styles.memberDetails}>
                                <View style={styles.memberNameRow}>
                                  <Text style={styles.memberName}>{member.username}</Text>
                                  {member.uid === currentParty.leaderId && (
                                    <Text style={styles.memberLeaderIcon}>👑</Text>
                                  )}
                                </View>
                                <Text style={styles.memberLevel}>Level {member.level}</Text>
                              </View>
                            </View>
                            <View style={styles.memberStatus}>
                              <Text style={styles.statusIcon}>{getMemberStatusIcon(member.status)}</Text>
                              <Text style={[
                                styles.statusText,
                                { color: getMemberStatusColor(member.status) }
                              ]}>
                                {member.status}
                              </Text>
                            </View>
                          </View>
                        </LinearGradient>
                      </View>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: 4 - currentParty.members.length }).map((_, index) => (
                      <View key={`empty-${index}`} style={styles.emptySlot}>
                        <Text style={styles.emptySlotText}>Empty Slot</Text>
                        <Text style={styles.emptySlotIcon}>➕</Text>
                      </View>
                    ))}
                  </View>

                  {/* Party Settings */}
                  <View style={styles.settingsCard}>
                    <Text style={styles.settingsTitle}>Loot Distribution</Text>
                    <Text style={styles.settingsValue}>{currentParty.lootDistribution}</Text>
                  </View>

                  {/* Actions */}
                  <View style={styles.actions}>
                    {canInvite && (
                      <Pressable
                        style={[styles.actionButton, styles.inviteActionButton]}
                        onPress={() => setShowInviteForm(true)}
                      >
                        <LinearGradient
                          colors={['#4488ff', '#2266dd']}
                          style={styles.actionGradient}
                        >
                          <Text style={styles.actionIcon}>📨</Text>
                          <Text style={styles.actionText}>Invite Friend</Text>
                        </LinearGradient>
                      </Pressable>
                    )}

                    <Pressable
                      style={[styles.actionButton, styles.leaveActionButton]}
                      onPress={handleLeaveParty}
                    >
                      <LinearGradient
                        colors={['#ef4444', '#dc2626']}
                        style={styles.actionGradient}
                      >
                        <Text style={styles.actionIcon}>{isLeader ? '🗑️' : '🚪'}</Text>
                        <Text style={styles.actionText}>
                          {isLeader ? 'Disband Party' : 'Leave Party'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </View>
                </View>
              ) : (
                /* No Party - Create Party Form */
                <View style={styles.section}>
                  {!showCreateForm ? (
                    <View style={styles.noPartyContainer}>
                      <Text style={styles.noPartyIcon}>👥</Text>
                      <Text style={styles.noPartyTitle}>You're not in a party</Text>
                      <Text style={styles.noPartyText}>
                        Create a party to adventure with friends and earn co-op bonuses!
                      </Text>

                      <Pressable
                        style={styles.createPartyButton}
                        onPress={() => setShowCreateForm(true)}
                      >
                        <LinearGradient
                          colors={['#22c55e', '#16a34a']}
                          style={styles.createGradient}
                        >
                          <Text style={styles.createIcon}>➕</Text>
                          <Text style={styles.createText}>Create Party</Text>
                        </LinearGradient>
                      </Pressable>
                    </View>
                  ) : (
                    <Animated.View entering={FadeIn} style={styles.createForm}>
                      <Text style={styles.formTitle}>Create Your Party</Text>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Party Name (Optional)</Text>
                        <TextInput
                          style={styles.formInput}
                          value={partyName}
                          onChangeText={setPartyName}
                          placeholder="Enter party name..."
                          placeholderTextColor="#6b7280"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Loot Distribution</Text>
                        <View style={styles.radioGroup}>
                          {(['equal', 'proximity', 'contribution'] as const).map(option => (
                            <Pressable
                              key={option}
                              style={[
                                styles.radioOption,
                                lootDistribution === option && styles.radioOptionSelected
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setLootDistribution(option);
                              }}
                            >
                              <View style={[
                                styles.radio,
                                lootDistribution === option && styles.radioSelected
                              ]}>
                                {lootDistribution === option && (
                                  <View style={styles.radioDot} />
                                )}
                              </View>
                              <Text style={styles.radioText}>{option}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={styles.formActions}>
                        <Pressable
                          style={[styles.formButton, styles.formButtonSecondary]}
                          onPress={() => setShowCreateForm(false)}
                        >
                          <Text style={styles.formButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.formButton, styles.formButtonPrimary]}
                          onPress={handleCreateParty}
                        >
                          <LinearGradient
                            colors={['#22c55e', '#16a34a']}
                            style={styles.formButtonGradient}
                          >
                            <Text style={styles.formButtonTextPrimary}>Create Party</Text>
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </Animated.View>
                  )}
                </View>
              )}
            </ScrollView>

            {/* Invite Friend Modal */}
            {showInviteForm && (
              <Modal transparent animationType="fade">
                <View style={styles.overlay}>
                  <Pressable style={styles.backdrop} onPress={() => setShowInviteForm(false)} />
                  <Animated.View entering={FadeIn} style={styles.inviteModal}>
                    <LinearGradient
                      colors={['#232336', '#181824']}
                      style={styles.inviteModalGradient}
                    >
                      <Text style={styles.inviteModalTitle}>Invite Friend</Text>

                      <TextInput
                        style={styles.inviteInput}
                        value={friendUsername}
                        onChangeText={setFriendUsername}
                        placeholder="Enter username..."
                        placeholderTextColor="#6b7280"
                        autoFocus
                      />

                      <View style={styles.inviteModalActions}>
                        <Pressable
                          style={[styles.inviteModalButton, styles.inviteModalButtonCancel]}
                          onPress={() => setShowInviteForm(false)}
                        >
                          <Text style={styles.inviteModalButtonText}>Cancel</Text>
                        </Pressable>

                        <Pressable
                          style={[styles.inviteModalButton, styles.inviteModalButtonSend]}
                          onPress={handleSendInvite}
                        >
                          <LinearGradient
                            colors={['#4488ff', '#2266dd']}
                            style={styles.inviteModalButtonGradient}
                          >
                            <Text style={styles.inviteModalButtonTextSend}>Send Invite</Text>
                          </LinearGradient>
                        </Pressable>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                </View>
              </Modal>
            )}
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12
  },
  gradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  headerIcon: {
    fontSize: 24,
    marginRight: 12
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: '#fff'
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(142, 142, 147, 0.3)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeIcon: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700'
  },
  content: {
    flex: 1,
    padding: 16
  },
  section: {
    marginBottom: 24
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 12
  },
  leaderBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fbbf24',
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  membersContainer: {
    gap: 8
  },
  memberCard: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  memberGradient: {
    padding: 12
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  memberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12
  },
  memberAvatar: {
    fontSize: 32
  },
  memberDetails: {
    flex: 1
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  memberName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  memberLeaderIcon: {
    fontSize: 14
  },
  memberLevel: {
    fontSize: 12,
    color: '#8e8e93',
    fontWeight: '600'
  },
  memberStatus: {
    alignItems: 'center',
    gap: 4
  },
  statusIcon: {
    fontSize: 16
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  emptySlot: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  emptySlotText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '600'
  },
  emptySlotIcon: {
    fontSize: 20,
    opacity: 0.5
  },
  settingsCard: {
    backgroundColor: '#232336',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12
  },
  settingsTitle: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  settingsValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  actions: {
    gap: 10,
    marginTop: 16
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    gap: 10
  },
  actionIcon: {
    fontSize: 18
  },
  actionText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  inviteActionButton: {},
  leaveActionButton: {},
  inviteCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 10
  },
  inviteGradient: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  inviteInfo: {
    flex: 1
  },
  inviteFrom: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4
  },
  inviteParty: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)'
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8
  },
  inviteButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8
  },
  acceptButton: {
    backgroundColor: '#22c55e'
  },
  declineButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)'
  },
  inviteButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff'
  },
  noPartyContainer: {
    alignItems: 'center',
    padding: 32,
    gap: 12
  },
  noPartyIcon: {
    fontSize: 64
  },
  noPartyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff'
  },
  noPartyText: {
    fontSize: 14,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 20
  },
  createPartyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16
  },
  createGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 10
  },
  createIcon: {
    fontSize: 18
  },
  createText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff'
  },
  createForm: {
    gap: 16
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8
  },
  formGroup: {
    gap: 8
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8e8e93'
  },
  formInput: {
    backgroundColor: '#232336',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a3e'
  },
  radioGroup: {
    gap: 8
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#232336',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 12
  },
  radioOptionSelected: {
    borderColor: '#4488ff',
    backgroundColor: 'rgba(68, 136, 255, 0.1)'
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radioSelected: {
    borderColor: '#4488ff'
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4488ff'
  },
  radioText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  formActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8
  },
  formButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  formButtonSecondary: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 14,
    alignItems: 'center'
  },
  formButtonPrimary: {},
  formButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  formButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  formButtonTextPrimary: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  inviteModal: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden'
  },
  inviteModalGradient: {
    padding: 20
  },
  inviteModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16
  },
  inviteInput: {
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    marginBottom: 16
  },
  inviteModalActions: {
    flexDirection: 'row',
    gap: 10
  },
  inviteModalButton: {
    flex: 1,
    borderRadius: 10,
    overflow: 'hidden'
  },
  inviteModalButtonCancel: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 12,
    alignItems: 'center'
  },
  inviteModalButtonSend: {},
  inviteModalButtonGradient: {
    paddingVertical: 12,
    alignItems: 'center'
  },
  inviteModalButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  inviteModalButtonTextSend: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  }
});
