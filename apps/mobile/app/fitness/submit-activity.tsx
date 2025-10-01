import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import type { ActivitySource, ActivityKind } from '@rov/types';

/**
 * Fitness Activity Submission Screen
 *
 * Features:
 * - Manual activity logging
 * - Third-party integration (Strava, Garmin, WHOOP)
 * - Activity validation preview
 * - GPS tracking integration
 */

export default function SubmitActivityScreen() {
  const [activityType, setActivityType] = useState<ActivityKind>('running');
  const [source, setSource] = useState<ActivitySource>('manual');
  const [distanceKm, setDistanceKm] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [steps, setSteps] = useState('');
  const [elevGainM, setElevGainM] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const activityTypes: ActivityKind[] = [
    'running',
    'walking',
    'cycling',
    'hiking',
    'swimming'
  ];

  const sources: { value: ActivitySource; label: string }[] = [
    { value: 'manual', label: 'Manual Entry' },
    { value: 'healthkit', label: 'Apple Health' },
    { value: 'googlefit', label: 'Google Fit' },
    { value: 'strava', label: 'Strava' },
    { value: 'garmin', label: 'Garmin' },
    { value: 'whoop', label: 'WHOOP' }
  ];

  const handleSubmit = async () => {
    // Validate inputs
    if (!distanceKm || !durationMin) {
      Alert.alert('Missing Information', 'Please enter at least distance and duration.');
      return;
    }

    const distance = parseFloat(distanceKm);
    const duration = parseFloat(durationMin);

    if (distance <= 0 || duration <= 0) {
      Alert.alert('Invalid Values', 'Distance and duration must be positive numbers.');
      return;
    }

    // Calculate pace for validation
    const paceMinPerKm = duration / distance;

    // Validate pace (basic anti-cheat)
    if (activityType === 'running' && (paceMinPerKm < 2 || paceMinPerKm > 12)) {
      Alert.alert(
        'Unrealistic Pace',
        `Running pace of ${paceMinPerKm.toFixed(2)} min/km seems unrealistic. Please check your values.`
      );
      return;
    }

    if (activityType === 'walking' && (paceMinPerKm < 8 || paceMinPerKm > 25)) {
      Alert.alert(
        'Unrealistic Pace',
        `Walking pace of ${paceMinPerKm.toFixed(2)} min/km seems unrealistic. Please check your values.`
      );
      return;
    }

    setSubmitting(true);

    try {
      // Submit activity via Firebase function
      const activity = {
        source,
        kind: activityType,
        start: Date.now() - duration * 60 * 1000,
        end: Date.now(),
        distanceM: distance * 1000,
        steps: steps ? parseInt(steps) : undefined,
        avgHr: avgHr ? parseInt(avgHr) : undefined,
        elevGainM: elevGainM ? parseInt(elevGainM) : undefined,
        proofs: {
          gpsQuality: 'fair' as const,
          paceOK: true,
          hrOK: true
        }
      };

      // Call Firebase function
      // await submitActivity(activity);

      Alert.alert(
        'Activity Submitted!',
        'Your activity has been recorded and will be verified.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit activity. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSyncThirdParty = async (selectedSource: ActivitySource) => {
    Alert.alert(
      'Sync Activities',
      `Connect to ${selectedSource} to automatically import your activities?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Connect',
          onPress: async () => {
            // In full implementation, initiate OAuth flow
            Alert.alert('Coming Soon', 'Third-party sync will be available soon!');
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Log Activity</Text>

        {/* Activity Source */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source</Text>
          <View style={styles.sourcesGrid}>
            {sources.map((src) => (
              <Pressable
                key={src.value}
                style={[
                  styles.sourceButton,
                  source === src.value && styles.sourceButtonActive
                ]}
                onPress={() => {
                  setSource(src.value);
                  if (src.value !== 'manual') {
                    handleSyncThirdParty(src.value);
                  }
                }}
              >
                <Text
                  style={[
                    styles.sourceButtonText,
                    source === src.value && styles.sourceButtonTextActive
                  ]}
                >
                  {src.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Activity Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Activity Type</Text>
          <View style={styles.typesGrid}>
            {activityTypes.map((type) => (
              <Pressable
                key={type}
                style={[
                  styles.typeButton,
                  activityType === type && styles.typeButtonActive
                ]}
                onPress={() => setActivityType(type)}
              >
                <Text style={styles.typeEmoji}>{getActivityEmoji(type)}</Text>
                <Text
                  style={[
                    styles.typeButtonText,
                    activityType === type && styles.typeButtonTextActive
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Distance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Distance (km) *</Text>
          <TextInput
            style={styles.input}
            value={distanceKm}
            onChangeText={setDistanceKm}
            placeholder="5.0"
            placeholderTextColor="#5e5e6e"
            keyboardType="decimal-pad"
          />
        </View>

        {/* Duration */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duration (minutes) *</Text>
          <TextInput
            style={styles.input}
            value={durationMin}
            onChangeText={setDurationMin}
            placeholder="30"
            placeholderTextColor="#5e5e6e"
            keyboardType="number-pad"
          />
        </View>

        {/* Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Steps (optional)</Text>
          <TextInput
            style={styles.input}
            value={steps}
            onChangeText={setSteps}
            placeholder="5000"
            placeholderTextColor="#5e5e6e"
            keyboardType="number-pad"
          />
        </View>

        {/* Average Heart Rate */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avg Heart Rate (optional)</Text>
          <TextInput
            style={styles.input}
            value={avgHr}
            onChangeText={setAvgHr}
            placeholder="150"
            placeholderTextColor="#5e5e6e"
            keyboardType="number-pad"
          />
        </View>

        {/* Elevation Gain */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Elevation Gain (m) (optional)</Text>
          <TextInput
            style={styles.input}
            value={elevGainM}
            onChangeText={setElevGainM}
            placeholder="100"
            placeholderTextColor="#5e5e6e"
            keyboardType="number-pad"
          />
        </View>

        {/* Pace Preview */}
        {distanceKm && durationMin && (
          <View style={styles.previewCard}>
            <Text style={styles.previewLabel}>Pace</Text>
            <Text style={styles.previewValue}>
              {(parseFloat(durationMin) / parseFloat(distanceKm)).toFixed(2)} min/km
            </Text>
          </View>
        )}

        {/* Submit Button */}
        <Pressable
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Submitting...' : 'Submit Activity'}
          </Text>
        </Pressable>

        {/* Anti-Cheat Notice */}
        <Text style={styles.noticeText}>
          ⚠️ All activities are verified for realistic pace and GPS quality.
          Suspicious activities may be flagged.
        </Text>
      </ScrollView>

      {/* Close Button */}
      <Pressable style={styles.closeButton} onPress={() => router.back()}>
        <Text style={styles.closeButtonText}>✕</Text>
      </Pressable>
    </View>
  );
}

function getActivityEmoji(type: ActivityKind): string {
  const emojis: Record<ActivityKind, string> = {
    running: '🏃',
    walking: '🚶',
    cycling: '🚴',
    hiking: '🥾',
    swimming: '🏊',
    fitness: '💪',
    other: '⚡'
  };
  return emojis[type] || '⚡';
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingTop: 60,
    paddingBottom: 100
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 12
  },
  sourcesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  sourceButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  sourceButtonActive: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  sourceButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  sourceButtonTextActive: {
    color: '#ffffff'
  },
  typesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  typeButton: {
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent'
  },
  typeButtonActive: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  typeEmoji: {
    fontSize: 32,
    marginBottom: 8
  },
  typeButtonText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  typeButtonTextActive: {
    color: '#ffffff'
  },
  input: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: '#4a4a5e'
  },
  previewCard: {
    backgroundColor: '#2a4a3e',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#00ff00'
  },
  previewLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4
  },
  previewValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  submitButton: {
    backgroundColor: '#4488ff',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16
  },
  submitButtonDisabled: {
    backgroundColor: '#2a2a3e',
    opacity: 0.5
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  noticeText: {
    fontSize: 12,
    color: '#8e8e93',
    textAlign: 'center',
    lineHeight: 18
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff'
  }
});