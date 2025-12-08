import { View, Text, StyleSheet, Modal, Pressable, ScrollView, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { useFirebase } from '@/lib/firebase-context';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { geohashForLocation } from 'geofire-common';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, SlideInRight, SlideOutLeft } from 'react-native-reanimated';
import type { QuestObjective, QuestDifficulty, QuestType } from '@/types/quest-enhanced';

interface PlayerQuestCreationWizardProps {
  visible: boolean;
  onClose: () => void;
  playerLocation: { latitude: number; longitude: number } | null;
  onQuestCreated?: (questId: string) => void;
}

type WizardStep = 'basic' | 'location' | 'objectives' | 'rewards' | 'review';

const QUEST_CREATION_COSTS = {
  easy: 100,
  medium: 250,
  hard: 500,
  epic: 1000,
  legendary: 2500
};

/**
 * Player Quest Creation Wizard
 *
 * Multi-step wizard for creating player-generated quests:
 * 1. Basic Info (title, description, difficulty, icon)
 * 2. Location Selection (use current or set custom)
 * 3. Objectives (battle, travel, collect, etc.)
 * 4. Rewards (item offering + bonus)
 * 5. Review & Create (pay creation cost)
 */
export function PlayerQuestCreationWizard({
  visible,
  onClose,
  playerLocation,
  onQuestCreated
}: PlayerQuestCreationWizardProps) {
  const { db, user } = useFirebase();

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic');

  // Basic Info
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<QuestDifficulty>('medium');
  const [icon, setIcon] = useState('🎯');
  const [timeLimit, setTimeLimit] = useState<number | null>(null);
  const [leaderboardEnabled, setLeaderboardEnabled] = useState(true);

  // Location
  const [useCurrentLocation, setUseCurrentLocation] = useState(true);
  const [questLocation, setQuestLocation] = useState(playerLocation);

  // Objectives
  const [objectives, setObjectives] = useState<Partial<QuestObjective>[]>([
    { type: 'battle', description: '', target: 1, current: 0, completed: false, order: 0 }
  ]);

  // Rewards
  const [offeredItemId, setOfferedItemId] = useState<string | null>(null);
  const [offeredItemName, setOfferedItemName] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const iconOptions = ['🎯', '⚔️', '🏰', '🐉', '💎', '🗡️', '🛡️', '⚡', '🔥', '🌟', '👹', '🏆'];

  const handleNextStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (currentStep) {
      case 'basic':
        if (!title.trim()) {
          Alert.alert('Missing Info', 'Please enter a quest title');
          return;
        }
        setCurrentStep('location');
        break;
      case 'location':
        if (!questLocation) {
          Alert.alert('Missing Location', 'Please set a quest location');
          return;
        }
        setCurrentStep('objectives');
        break;
      case 'objectives':
        if (objectives.length === 0 || !objectives[0].description) {
          Alert.alert('Missing Objectives', 'Please add at least one objective');
          return;
        }
        setCurrentStep('rewards');
        break;
      case 'rewards':
        setCurrentStep('review');
        break;
      case 'review':
        handleCreateQuest();
        break;
    }
  };

  const handlePrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    switch (currentStep) {
      case 'location':
        setCurrentStep('basic');
        break;
      case 'objectives':
        setCurrentStep('location');
        break;
      case 'rewards':
        setCurrentStep('objectives');
        break;
      case 'review':
        setCurrentStep('rewards');
        break;
    }
  };

  const handleCreateQuest = async () => {
    if (!db || !user || !questLocation) return;

    setIsSubmitting(true);

    try {
      const creationCost = QUEST_CREATION_COSTS[difficulty];

      // TODO: Check user's gold balance and deduct cost

      const geohash = geohashForLocation([questLocation.latitude, questLocation.longitude]);

      const questData = {
        // Basic
        title,
        description,
        difficulty,
        icon,
        type: 'player_created' as QuestType,
        status: 'available',
        visibility: 'local',

        // Location
        location: {
          latitude: questLocation.latitude,
          longitude: questLocation.longitude,
          geohash,
          name: 'Player Quest Location'
        },
        activationRadius: 100,
        acceptRadius: 50,

        // Objectives
        objectives: objectives.map((obj, index) => ({
          id: `obj_${index}`,
          type: obj.type || 'battle',
          description: obj.description || '',
          target: obj.target || 1,
          current: 0,
          completed: false,
          order: index
        })),

        // Rewards
        rewards: {
          gold: Math.floor(creationCost * 0.5), // System adds 50% of creation cost
          xp: creationCost * 2,
          items: offeredItemId ? [{
            id: offeredItemId,
            type: 'equipment',
            rarity: 'rare',
            quantity: 1
          }] : []
        },

        // Time & Leaderboard
        timeLimit,
        leaderboardEnabled,

        // Player-created specific
        createdBy: user.uid,
        creatorReward: offeredItemId ? { id: offeredItemId, locked: true } : null,
        creationCost,

        // Metadata
        requiredLevel: 1,
        recommendedLevel: 1,
        isLegendary: false,
        isBoss: false,
        isSeasonal: false,
        tags: ['player_created'],
        createdAt: Timestamp.fromDate(new Date()),
        spawnedAt: Timestamp.fromDate(new Date()),
        expiresAt: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)), // 7 days
        completionCount: 0
      };

      const docRef = await addDoc(collection(db, 'dynamicQuests'), questData);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Quest Created!',
        `Your quest "${title}" has been published!\n\nOthers can now discover and complete it.`,
        [
          {
            text: 'OK',
            onPress: () => {
              if (onQuestCreated) {
                onQuestCreated(docRef.id);
              }
              handleClose();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error creating quest:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to create quest. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('basic');
    setTitle('');
    setDescription('');
    setDifficulty('medium');
    setIcon('🎯');
    setTimeLimit(null);
    setLeaderboardEnabled(true);
    setUseCurrentLocation(true);
    setQuestLocation(playerLocation);
    setObjectives([{ type: 'battle', description: '', target: 1, current: 0, completed: false, order: 0 }]);
    setOfferedItemId(null);
    setOfferedItemName('');
    onClose();
  };

  const addObjective = () => {
    setObjectives([
      ...objectives,
      {
        type: 'battle',
        description: '',
        target: 1,
        current: 0,
        completed: false,
        order: objectives.length
      }
    ]);
  };

  const removeObjective = (index: number) => {
    setObjectives(objectives.filter((_, i) => i !== index));
  };

  const updateObjective = (index: number, field: string, value: any) => {
    const updated = [...objectives];
    updated[index] = { ...updated[index], [field]: value };
    setObjectives(updated);
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'basic': return 'Basic Information';
      case 'location': return 'Quest Location';
      case 'objectives': return 'Objectives';
      case 'rewards': return 'Rewards';
      case 'review': return 'Review & Create';
    }
  };

  const getStepNumber = () => {
    const steps: WizardStep[] = ['basic', 'location', 'objectives', 'rewards', 'review'];
    return steps.indexOf(currentStep) + 1;
  };

  const creationCost = QUEST_CREATION_COSTS[difficulty];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <Animated.View
          entering={SlideInRight.springify()}
          style={styles.modalContainer}
        >
          <LinearGradient
            colors={['#1a1a2e', '#0f0f1e']}
            style={styles.gradient}
          >
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerIcon}>✨</Text>
              <View style={styles.headerTitleContainer}>
                <Text style={styles.headerTitle}>Create Quest</Text>
                <Text style={styles.headerSubtitle}>
                  Step {getStepNumber()} of 5: {getStepTitle()}
                </Text>
              </View>
              <Pressable style={styles.closeButton} onPress={handleClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[styles.progressFill, { width: `${(getStepNumber() / 5) * 100}%` }]}
                />
              </View>
            </View>

            {/* Content */}
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* STEP 1: Basic Info */}
              {currentStep === 'basic' && (
                <Animated.View entering={FadeIn} style={styles.stepContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quest Title *</Text>
                    <TextInput
                      style={styles.formInput}
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Enter an epic quest name..."
                      placeholderTextColor="#6b7280"
                      maxLength={50}
                    />
                    <Text style={styles.charCount}>{title.length}/50</Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Description *</Text>
                    <TextInput
                      style={[styles.formInput, styles.textArea]}
                      value={description}
                      onChangeText={setDescription}
                      placeholder="Describe your quest and what adventurers must do..."
                      placeholderTextColor="#6b7280"
                      multiline
                      numberOfLines={4}
                      maxLength={200}
                    />
                    <Text style={styles.charCount}>{description.length}/200</Text>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quest Icon</Text>
                    <View style={styles.iconGrid}>
                      {iconOptions.map(iconOption => (
                        <Pressable
                          key={iconOption}
                          style={[
                            styles.iconOption,
                            icon === iconOption && styles.iconOptionSelected
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setIcon(iconOption);
                          }}
                        >
                          <Text style={styles.iconOptionText}>{iconOption}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Difficulty</Text>
                    <View style={styles.difficultyGrid}>
                      {(['easy', 'medium', 'hard', 'epic', 'legendary'] as const).map(diff => (
                        <Pressable
                          key={diff}
                          style={[
                            styles.difficultyOption,
                            difficulty === diff && styles.difficultyOptionSelected
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setDifficulty(diff);
                          }}
                        >
                          <Text style={styles.difficultyText}>{diff.toUpperCase()}</Text>
                          <Text style={styles.difficultyCost}>{QUEST_CREATION_COSTS[diff]}g</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <View style={styles.checkboxRow}>
                      <Pressable
                        style={styles.checkbox}
                        onPress={() => setLeaderboardEnabled(!leaderboardEnabled)}
                      >
                        <View style={[
                          styles.checkboxBox,
                          leaderboardEnabled && styles.checkboxBoxChecked
                        ]}>
                          {leaderboardEnabled && <Text style={styles.checkboxCheck}>✓</Text>}
                        </View>
                        <Text style={styles.checkboxLabel}>Enable Leaderboard</Text>
                      </Pressable>
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* STEP 2: Location */}
              {currentStep === 'location' && (
                <Animated.View entering={FadeIn} style={styles.stepContent}>
                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Quest Location</Text>
                    <Pressable
                      style={[
                        styles.locationOption,
                        useCurrentLocation && styles.locationOptionSelected
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setUseCurrentLocation(true);
                        setQuestLocation(playerLocation);
                      }}
                    >
                      <View style={styles.locationOptionIcon}>
                        <Text style={styles.locationIconText}>📍</Text>
                      </View>
                      <View style={styles.locationOptionText}>
                        <Text style={styles.locationOptionTitle}>Current Location</Text>
                        <Text style={styles.locationOptionSubtitle}>
                          Use your current position
                        </Text>
                      </View>
                    </Pressable>

                    <View style={styles.locationInfo}>
                      <Text style={styles.locationInfoTitle}>Location Details:</Text>
                      {questLocation && (
                        <>
                          <Text style={styles.locationInfoText}>
                            Latitude: {questLocation.latitude.toFixed(6)}
                          </Text>
                          <Text style={styles.locationInfoText}>
                            Longitude: {questLocation.longitude.toFixed(6)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </Animated.View>
              )}

              {/* STEP 3: Objectives */}
              {currentStep === 'objectives' && (
                <Animated.View entering={FadeIn} style={styles.stepContent}>
                  {objectives.map((objective, index) => (
                    <View key={index} style={styles.objectiveCard}>
                      <View style={styles.objectiveHeader}>
                        <Text style={styles.objectiveNumber}>Objective {index + 1}</Text>
                        {objectives.length > 1 && (
                          <Pressable
                            style={styles.removeObjectiveButton}
                            onPress={() => removeObjective(index)}
                          >
                            <Text style={styles.removeObjectiveText}>Remove</Text>
                          </Pressable>
                        )}
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Type</Text>
                        <View style={styles.objectiveTypeGrid}>
                          {(['battle', 'travel', 'collect', 'fitness'] as const).map(type => (
                            <Pressable
                              key={type}
                              style={[
                                styles.objectiveTypeOption,
                                objective.type === type && styles.objectiveTypeOptionSelected
                              ]}
                              onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                updateObjective(index, 'type', type);
                              }}
                            >
                              <Text style={styles.objectiveTypeText}>{type}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Description</Text>
                        <TextInput
                          style={styles.formInput}
                          value={objective.description}
                          onChangeText={(value) => updateObjective(index, 'description', value)}
                          placeholder="What must be done?"
                          placeholderTextColor="#6b7280"
                        />
                      </View>

                      <View style={styles.formGroup}>
                        <Text style={styles.formLabel}>Target Count</Text>
                        <TextInput
                          style={styles.formInput}
                          value={objective.target?.toString()}
                          onChangeText={(value) => updateObjective(index, 'target', parseInt(value) || 1)}
                          placeholder="1"
                          placeholderTextColor="#6b7280"
                          keyboardType="number-pad"
                        />
                      </View>
                    </View>
                  ))}

                  <Pressable style={styles.addObjectiveButton} onPress={addObjective}>
                    <Text style={styles.addObjectiveText}>+ Add Objective</Text>
                  </Pressable>
                </Animated.View>
              )}

              {/* STEP 4: Rewards */}
              {currentStep === 'rewards' && (
                <Animated.View entering={FadeIn} style={styles.stepContent}>
                  <View style={styles.rewardsInfo}>
                    <Text style={styles.rewardsInfoTitle}>Automatic Rewards</Text>
                    <Text style={styles.rewardsInfoText}>
                      Based on difficulty ({difficulty}):
                    </Text>
                    <View style={styles.rewardsList}>
                      <Text style={styles.rewardItem}>💰 {Math.floor(creationCost * 0.5)} Gold</Text>
                      <Text style={styles.rewardItem}>⭐ {creationCost * 2} XP</Text>
                    </View>
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Offer Item (Optional)</Text>
                    <Text style={styles.formHelperText}>
                      Offer one of your items as the quest reward. It will be locked until someone completes the quest or it expires.
                    </Text>
                    <Pressable style={styles.selectItemButton}>
                      <Text style={styles.selectItemText}>
                        {offeredItemName || '+ Select Item from Inventory'}
                      </Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* STEP 5: Review */}
              {currentStep === 'review' && (
                <Animated.View entering={FadeIn} style={styles.stepContent}>
                  <View style={styles.reviewCard}>
                    <Text style={styles.reviewTitle}>Quest Summary</Text>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Title:</Text>
                      <Text style={styles.reviewValue}>{title}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Difficulty:</Text>
                      <Text style={styles.reviewValue}>{difficulty}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Objectives:</Text>
                      <Text style={styles.reviewValue}>{objectives.length}</Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Location:</Text>
                      <Text style={styles.reviewValue}>
                        {questLocation ? 'Set' : 'Not set'}
                      </Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Leaderboard:</Text>
                      <Text style={styles.reviewValue}>
                        {leaderboardEnabled ? 'Enabled' : 'Disabled'}
                      </Text>
                    </View>

                    <View style={styles.reviewDivider} />

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Creation Cost:</Text>
                      <Text style={[styles.reviewValue, styles.reviewCost]}>
                        💰 {creationCost} Gold
                      </Text>
                    </View>

                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Expires In:</Text>
                      <Text style={styles.reviewValue}>7 days</Text>
                    </View>
                  </View>

                  <View style={styles.warningBox}>
                    <Text style={styles.warningIcon}>⚠️</Text>
                    <View style={styles.warningTextContainer}>
                      <Text style={styles.warningTitle}>Important</Text>
                      <Text style={styles.warningText}>
                        {creationCost} gold will be deducted from your balance.
                        {offeredItemId && ' Your offered item will be locked until completion or expiry.'}
                      </Text>
                    </View>
                  </View>
                </Animated.View>
              )}
            </ScrollView>

            {/* Footer Actions */}
            <View style={styles.footer}>
              {currentStep !== 'basic' && (
                <Pressable
                  style={[styles.footerButton, styles.backButton]}
                  onPress={handlePrevStep}
                  disabled={isSubmitting}
                >
                  <Text style={styles.backButtonText}>← Back</Text>
                </Pressable>
              )}

              <Pressable
                style={[styles.footerButton, styles.nextButton]}
                onPress={handleNextStep}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={['#22c55e', '#16a34a']}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>
                    {currentStep === 'review'
                      ? isSubmitting ? 'Creating...' : 'Create Quest'
                      : 'Next →'}
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
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
  headerTitleContainer: {
    flex: 1
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff'
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2
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
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  progressBar: {
    height: 4,
    backgroundColor: '#2a2a3e',
    borderRadius: 2,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2
  },
  content: {
    flex: 1,
    padding: 16
  },
  stepContent: {
    gap: 20
  },
  formGroup: {
    gap: 8
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5
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
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  charCount: {
    fontSize: 11,
    color: '#6b7280',
    textAlign: 'right'
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#232336',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  },
  iconOptionText: {
    fontSize: 24
  },
  difficultyGrid: {
    gap: 8
  },
  difficultyOption: {
    borderRadius: 10,
    backgroundColor: '#232336',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  difficultyOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  },
  difficultyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  difficultyCost: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fbbf24'
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 12
  },
  checkbox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#6b7280',
    alignItems: 'center',
    justifyContent: 'center'
  },
  checkboxBoxChecked: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  checkboxCheck: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700'
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600'
  },
  locationOption: {
    borderRadius: 12,
    backgroundColor: '#232336',
    borderWidth: 2,
    borderColor: '#2a2a3e',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  locationOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  },
  locationOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center'
  },
  locationIconText: {
    fontSize: 20
  },
  locationOptionText: {
    flex: 1
  },
  locationOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  locationOptionSubtitle: {
    fontSize: 12,
    color: '#8e8e93',
    marginTop: 2
  },
  locationInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: 'rgba(68, 136, 255, 0.1)',
    borderRadius: 8,
    gap: 4
  },
  locationInfoTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4488ff'
  },
  locationInfoText: {
    fontSize: 11,
    color: '#8e8e93'
  },
  objectiveCard: {
    backgroundColor: '#232336',
    borderRadius: 12,
    padding: 14,
    gap: 12
  },
  objectiveHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  objectiveNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff'
  },
  removeObjectiveButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderRadius: 6
  },
  removeObjectiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ef4444'
  },
  objectiveTypeGrid: {
    flexDirection: 'row',
    gap: 8
  },
  objectiveTypeOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#2a2a3e',
    alignItems: 'center'
  },
  objectiveTypeOptionSelected: {
    borderColor: '#22c55e',
    backgroundColor: 'rgba(34, 197, 94, 0.1)'
  },
  objectiveTypeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#fff',
    textTransform: 'capitalize'
  },
  addObjectiveButton: {
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  addObjectiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4488ff'
  },
  rewardsInfo: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 8
  },
  rewardsInfoTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#22c55e'
  },
  rewardsInfoText: {
    fontSize: 13,
    color: '#fff'
  },
  rewardsList: {
    marginTop: 8,
    gap: 4
  },
  rewardItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff'
  },
  formHelperText: {
    fontSize: 12,
    color: '#8e8e93',
    lineHeight: 16
  },
  selectItemButton: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    borderStyle: 'dashed',
    alignItems: 'center'
  },
  selectItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4488ff'
  },
  reviewCard: {
    backgroundColor: '#232336',
    borderRadius: 12,
    padding: 16,
    gap: 12
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reviewLabel: {
    fontSize: 13,
    color: '#8e8e93',
    fontWeight: '600'
  },
  reviewValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'capitalize'
  },
  reviewCost: {
    color: '#fbbf24'
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#2a2a3e',
    marginVertical: 4
  },
  warningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 10,
    padding: 14,
    flexDirection: 'row',
    gap: 12
  },
  warningIcon: {
    fontSize: 20
  },
  warningTextContainer: {
    flex: 1,
    gap: 4
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f59e0b'
  },
  warningText: {
    fontSize: 12,
    color: '#fff',
    lineHeight: 16
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#2a2a3e'
  },
  footerButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden'
  },
  backButton: {
    backgroundColor: '#2a2a3e',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  },
  nextButton: {},
  nextButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff'
  }
});
