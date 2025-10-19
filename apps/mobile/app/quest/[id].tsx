import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from '@/lib/location';
import * as Haptics from '@/lib/haptics';
import { useQuests } from '@/hooks/useQuests';
import { useFirebase } from '@/lib/firebase-context';
import { doc, getDoc } from 'firebase/firestore';
import type { Quest, QuestProgress } from '@rov/types';

/**
 * Quest Detail Screen - Enhanced with real Firebase integration
 */
export default function QuestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [quest, setQuest] = useState<Quest | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const { questProgress, startQuest, completeQuest, isStarting, isCompleting } = useQuests();
  const { db } = useFirebase();

  const progress = questProgress?.find(p => p.questId === id);

  useEffect(() => {
    loadQuestData();
    watchLocation();
  }, [id]);

  useEffect(() => {
    if (userLocation && quest?.location) {
      const dist = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        quest.location.latitude,
        quest.location.longitude
      );
      setDistance(dist);
    }
  }, [userLocation, quest]);

  async function loadQuestData() {
    setLoading(true);
    try {
      const questDoc = await getDoc(doc(db, 'activeQuests', id as string));
      if (questDoc.exists()) {
        setQuest({ id: questDoc.id, ...questDoc.data() } as Quest);
      }
    } catch (error) {
      console.error('Failed to load quest:', error);
    } finally {
      setLoading(false);
    }
  }

  async function watchLocation() {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return;

    const loc = await Location.getCurrentPositionAsync({});
    setUserLocation(loc);

    Location.watchPositionAsync(
      { accuracy: Location.Accuracy.High, distanceInterval: 5 },
      (newLoc) => setUserLocation(newLoc)
    );
  }

  function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  const handleStartQuest = async () => {
    if (!quest || !distance) return;

    const geofenceRadius = quest.location.geofenceRadius || 100;
    if (distance > geofenceRadius) {
      Alert.alert('Too Far Away', `You must be within ${geofenceRadius}m. Currently ${Math.round(distance)}m away.`);
      return;
    }

    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      startQuest(quest.id);
      Alert.alert('Quest Started!', 'Good luck on your adventure!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start quest');
    }
  };

  const handleCompleteQuest = async () => {
    if (!quest || !userLocation || !distance) return;

    const geofenceRadius = quest.location.geofenceRadius || 100;
    if (distance > geofenceRadius) {
      Alert.alert('Too Far Away', `You must be within ${geofenceRadius}m. Currently ${Math.round(distance)}m away.`);
      return;
    }

    if (!areRequirementsMet()) {
      Alert.alert('Requirements Not Met', 'Complete all requirements first.');
      return;
    }

    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await completeQuest({
        questId: quest.id,
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude
      });
      Alert.alert(
        'Quest Complete! 🎉',
        `Earned ${quest.rewards.gold || 0} gold, ${quest.rewards.xp || 0} XP!`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete quest');
    }
  };

  const areRequirementsMet = (): boolean => {
    if (!quest || !progress) return false;
    const reqs = quest.requirements;
    const prog = progress.progress || {};
    if (reqs.distance && (prog.distance || 0) < reqs.distance) return false;
    if (reqs.steps && (prog.steps || 0) < reqs.steps) return false;
    if (reqs.elevationGain && (prog.elevationGain || 0) < reqs.elevationGain) return false;
    if (reqs.duration && (prog.duration || 0) < reqs.duration) return false;
    return true;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
          <Text style={styles.loadingText}>Loading quest...</Text>
        </View>
      </View>
    );
  }

  if (!quest) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Quest not found</Text>
          <Pressable style={styles.button} onPress={() => router.back()}>
            <Text style={styles.buttonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isWithinRange = distance !== null && distance <= (quest.location.geofenceRadius || 100);
  const canStart = !progress && isWithinRange;
  const canComplete = progress?.status === 'active' && areRequirementsMet() && isWithinRange;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Quest Header */}
        <View style={styles.questHeader}>
          <Text style={styles.questIcon}>⚔️</Text>
          <View style={styles.questTitleContainer}>
            <Text style={styles.questName}>{quest.name}</Text>
            <Text style={[styles.questRarity, { color: getRarityColor(quest.rarity) }]}>
              {quest.rarity}
            </Text>
          </View>
        </View>

        <Text style={styles.questDescription}>{quest.description}</Text>

        {/* Distance Card */}
        {distance !== null && (
          <View style={styles.distanceCard}>
            <Text style={styles.distanceIcon}>📍</Text>
            <View style={styles.distanceInfo}>
              <Text style={styles.distanceLabel}>Distance</Text>
              <Text style={styles.distanceValue}>{Math.round(distance)}m away</Text>
            </View>
            <View style={[styles.distanceStatus, isWithinRange && styles.distanceStatusInRange]}>
              <Text style={styles.distanceStatusText}>
                {isWithinRange ? '✓ In Range' : '✗ Out of Range'}
              </Text>
            </View>
          </View>
        )}

        {/* Requirements */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requirements</Text>
          {quest.requirements.distance && (
            <RequirementRow
              label="Distance"
              current={progress?.progress?.distance || 0}
              target={quest.requirements.distance}
              unit="m"
            />
          )}
          {quest.requirements.steps && (
            <RequirementRow
              label="Steps"
              current={progress?.progress?.steps || 0}
              target={quest.requirements.steps}
              unit=""
            />
          )}
          {quest.requirements.elevationGain && (
            <RequirementRow
              label="Elevation"
              current={progress?.progress?.elevationGain || 0}
              target={quest.requirements.elevationGain}
              unit="m"
            />
          )}
          {quest.requirements.duration && (
            <RequirementRow
              label="Duration"
              current={progress?.progress?.duration || 0}
              target={quest.requirements.duration}
              unit="min"
            />
          )}
        </View>

        {/* Rewards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rewards</Text>
          <View style={styles.rewardsList}>
            {quest.rewards.gold && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>💰</Text>
                <Text style={styles.rewardText}>{quest.rewards.gold} Gold</Text>
              </View>
            )}
            {quest.rewards.xp && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>⭐</Text>
                <Text style={styles.rewardText}>{quest.rewards.xp} XP</Text>
              </View>
            )}
            {quest.rewards.renown && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🏆</Text>
                <Text style={styles.rewardText}>{quest.rewards.renown} Renown</Text>
              </View>
            )}
            {quest.rewards.cards && (
              <View style={styles.rewardItem}>
                <Text style={styles.rewardIcon}>🎴</Text>
                <Text style={styles.rewardText}>{quest.rewards.cards.length} Cards</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {!progress && (
            <Pressable
              style={[styles.actionButton, !canStart && styles.actionButtonDisabled]}
              onPress={handleStartQuest}
              disabled={!canStart || isStarting}
            >
              <LinearGradient
                colors={canStart ? ['#00ff00', '#00aa00'] : ['#2a2a3e', '#1a1a2e']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>
                  {isStarting ? 'Starting...' : 'Start Quest'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}

          {progress?.status === 'active' && (
            <Pressable
              style={[styles.actionButton, !canComplete && styles.actionButtonDisabled]}
              onPress={handleCompleteQuest}
              disabled={!canComplete || isCompleting}
            >
              <LinearGradient
                colors={canComplete ? ['#4488ff', '#2244cc'] : ['#2a2a3e', '#1a1a2e']}
                style={styles.actionButtonGradient}
              >
                <Text style={styles.actionButtonText}>
                  {isCompleting ? 'Completing...' : 'Complete Quest'}
                </Text>
              </LinearGradient>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function RequirementRow({ label, current, target, unit }: {
  label: string;
  current: number;
  target: number;
  unit: string;
}) {
  const percentage = Math.min(100, (current / target) * 100);
  const isComplete = current >= target;

  return (
    <View style={styles.requirementRow}>
      <View style={styles.requirementHeader}>
        <Text style={styles.requirementLabel}>{label}</Text>
        <Text style={[styles.requirementValue, isComplete && styles.requirementComplete]}>
          {current}/{target}{unit}
        </Text>
      </View>
      <View style={styles.progressBar}>
        <LinearGradient
          colors={isComplete ? ['#00ff00', '#00aa00'] : ['#4488ff', '#2244cc']}
          style={[styles.progressFill, { width: `${percentage}%` }]}
        />
      </View>
    </View>
  );
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700'
  };
  return colors[rarity] || '#ffffff';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 },
  loadingText: { color: '#8e8e93', fontSize: 16 },
  errorText: { color: '#ff4444', fontSize: 18, marginBottom: 16 },
  header: { paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16 },
  backButton: { padding: 8 },
  backButtonText: { color: '#4488ff', fontSize: 16, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  questHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  questIcon: { fontSize: 64, marginRight: 16 },
  questTitleContainer: { flex: 1 },
  questName: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', marginBottom: 4 },
  questRarity: { fontSize: 16, fontWeight: '600' },
  questDescription: { fontSize: 16, color: '#8e8e93', lineHeight: 24, marginBottom: 24 },
  distanceCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a3e', borderRadius: 12, padding: 16, marginBottom: 24 },
  distanceIcon: { fontSize: 32, marginRight: 12 },
  distanceInfo: { flex: 1 },
  distanceLabel: { fontSize: 12, color: '#8e8e93', textTransform: 'uppercase' },
  distanceValue: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  distanceStatus: { backgroundColor: '#ff4444', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  distanceStatusInRange: { backgroundColor: '#00ff00' },
  distanceStatusText: { fontSize: 12, fontWeight: '600', color: '#ffffff' },
  section: { backgroundColor: '#2a2a3e', borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  requirementRow: { marginBottom: 12 },
  requirementHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  requirementLabel: { fontSize: 14, color: '#ffffff' },
  requirementValue: { fontSize: 14, color: '#8e8e93' },
  requirementComplete: { color: '#00ff00', fontWeight: 'bold' },
  progressBar: { height: 8, backgroundColor: '#1a1a2e', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  rewardsList: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  rewardItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  rewardIcon: { fontSize: 20 },
  rewardText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  actionsContainer: { gap: 12 },
  actionButton: { borderRadius: 12, overflow: 'hidden' },
  actionButtonDisabled: { opacity: 0.5 },
  actionButtonGradient: { paddingVertical: 16, alignItems: 'center' },
  actionButtonText: { fontSize: 18, fontWeight: 'bold', color: '#ffffff' },
  button: { backgroundColor: '#4488ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' }
});
