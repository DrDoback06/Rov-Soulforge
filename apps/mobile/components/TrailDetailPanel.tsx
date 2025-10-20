import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import type { Trail } from '@/types/trail';

interface TrailDetailPanelProps {
  visible: boolean;
  onClose: () => void;
  trail: Trail | null;
  onStartTrail: (trail: Trail) => void;
  userCompletions?: number;
  userBestTime?: number;
  friendsCompleted?: Array<{ name: string; time: number; date: string }>;
}

type Tab = 'info' | 'leaderboard' | 'elevation' | 'social';

/**
 * Trail Detail Panel
 * 
 * Beautiful 4-tab interface showing:
 * - Info: Trail stats, facilities, safety
 * - Leaderboard: Strava KOM/QOM, personal bests
 * - Elevation: Profile graph
 * - Social: Friends, recent completions
 */
export function TrailDetailPanel({
  visible,
  onClose,
  trail,
  onStartTrail,
  userCompletions = 0,
  userBestTime,
  friendsCompleted = []
}: TrailDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info');

  if (!trail) return null;

  const difficultyColors = {
    Easy: '#4caf50',
    Moderate: '#2196f3',
    Hard: '#ff9800',
    Expert: '#f44336'
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.container}>
          <LinearGradient
            colors={['#2a1a4e', '#1a1a2e']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <Text style={styles.trailIcon}>{getTrailTypeIcon(trail)}</Text>
                <View style={styles.titleInfo}>
                  <Text style={styles.title}>{trail.name}</Text>
                  <Text style={styles.region}>{trail.region}, {trail.country}</Text>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Distance</Text>
                  <Text style={styles.statValue}>{(trail.distance / 1000).toFixed(1)}km</Text>
                </View>
                <View style={styles.statChip}>
                  <Text style={styles.statLabel}>Elevation</Text>
                  <Text style={styles.statValue}>{trail.elevationGain}m↑</Text>
                </View>
                <View style={[styles.statChip, { backgroundColor: difficultyColors[trail.difficulty] }]}>
                  <Text style={styles.statLabel}>Difficulty</Text>
                  <Text style={styles.statValue}>{trail.difficulty}</Text>
                </View>
              </View>

              {/* Completion Badge */}
              {userCompletions > 0 && (
                <View style={styles.completionBadge}>
                  <Text style={styles.completionText}>
                    ✅ Completed {userCompletions}x
                  </Text>
                  {userCompletions >= 10 && <Text style={styles.completionText}>🔥</Text>}
                </View>
              )}
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
              {(['info', 'leaderboard', 'elevation', 'social'] as Tab[]).map(tab => (
                <Pressable
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Tab Content */}
            <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
              {activeTab === 'info' && <InfoTab trail={trail} />}
              {activeTab === 'leaderboard' && <LeaderboardTab trail={trail} userBestTime={userBestTime} />}
              {activeTab === 'elevation' && <ElevationTab trail={trail} />}
              {activeTab === 'social' && <SocialTab friendsCompleted={friendsCompleted} />}
            </ScrollView>

            {/* Rewards Preview */}
            {trail.estimatedRewards && (
              <View style={styles.rewardsSection}>
                <Text style={styles.rewardsTitle}>Estimated Rewards</Text>
                <View style={styles.rewardsRow}>
                  <Text style={styles.rewardItem}>💰 {trail.estimatedRewards.gold} Gold</Text>
                  <Text style={styles.rewardItem}>⭐ {trail.estimatedRewards.xp} XP</Text>
                  {trail.estimatedRewards.buffs.length > 0 && (
                    <Text style={styles.rewardItem}>🔥 Buffs</Text>
                  )}
                </View>
              </View>
            )}

            {/* Start Trail Button */}
            <Pressable
              style={styles.startButton}
              onPress={() => {
                onStartTrail(trail);
                onClose();
              }}
            >
              <LinearGradient
                colors={['#4488ff', '#2266dd']}
                style={styles.startButtonGradient}
              >
                <Text style={styles.startButtonText}>🎯 Start Trail</Text>
              </LinearGradient>
            </Pressable>

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

// Info Tab
function InfoTab({ trail }: { trail: Trail }) {
  return (
    <View style={styles.infoTab}>
      <Text style={styles.description}>{trail.description}</Text>

      <View style={styles.infoGrid}>
        <InfoItem icon="⏱️" label="Time" value={trail.metadata.estimatedTime} />
        <InfoItem icon="📅" label="Best Time" value={trail.metadata.bestTime} />
        <InfoItem icon="🅿️" label="Parking" value={trail.metadata.parking || 'N/A'} />
        <InfoItem icon="⭐" label="Rating" value={`${trail.rating}/5 (${trail.reviewCount})`} />
      </View>

      {trail.metadata.facilities && trail.metadata.facilities.length > 0 && (
        <View style={styles.facilities}>
          <Text style={styles.facilitiesTitle}>Facilities</Text>
          <View style={styles.facilitiesList}>
            {trail.metadata.facilities.map((facility, i) => (
              <View key={i} style={styles.facilityChip}>
                <Text style={styles.facilityText}>{facility.replace('_', ' ')}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {trail.safety && (
        <View style={styles.safetySection}>
          <Text style={styles.safetyTitle}>⚠️ Safety Information</Text>
          {trail.safety.hazards.length > 0 && (
            <View style={styles.hazards}>
              <Text style={styles.hazardsLabel}>Hazards:</Text>
              {trail.safety.hazards.map((hazard, i) => (
                <Text key={i} style={styles.hazardText}>• {hazard}</Text>
              ))}
            </View>
          )}
          {trail.safety.emergencyContacts.length > 0 && (
            <View style={styles.emergency}>
              <Text style={styles.emergencyLabel}>Emergency:</Text>
              {trail.safety.emergencyContacts.map((contact, i) => (
                <Text key={i} style={styles.emergencyText}>{contact}</Text>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// Leaderboard Tab
function LeaderboardTab({ trail, userBestTime }: { trail: Trail; userBestTime?: number }) {
  return (
    <View style={styles.leaderboardTab}>
      {trail.stravaSegment ? (
        <>
          <Text style={styles.segmentTitle}>🏆 Strava Segment</Text>
          
          {/* KOM/QOM */}
          <View style={styles.komCard}>
            <Text style={styles.komLabel}>👑 KOM/QOM</Text>
            <Text style={styles.komName}>{trail.stravaSegment.kom.name}</Text>
            <Text style={styles.komTime}>{formatTime(trail.stravaSegment.kom.time)}</Text>
            <Text style={styles.komDate}>{trail.stravaSegment.kom.date}</Text>
          </View>

          {/* Personal Record */}
          {trail.stravaSegment.pr && (
            <View style={styles.prCard}>
              <Text style={styles.prLabel}>⭐ Your PR</Text>
              <Text style={styles.prTime}>{formatTime(trail.stravaSegment.pr.time)}</Text>
              <Text style={styles.prRank}>Rank #{trail.stravaSegment.pr.rank}</Text>
            </View>
          )}

          {/* Leaderboard */}
          <Text style={styles.leaderboardTitle}>Top Times</Text>
          {trail.stravaSegment.leaderboard.map(entry => (
            <View key={entry.rank} style={styles.leaderboardEntry}>
              <Text style={styles.leaderboardRank}>#{entry.rank}</Text>
              <View style={styles.leaderboardInfo}>
                <Text style={styles.leaderboardName}>{entry.name}</Text>
                <Text style={styles.leaderboardDate}>{entry.date}</Text>
              </View>
              <Text style={styles.leaderboardTime}>{formatTime(entry.time)}</Text>
            </View>
          ))}
        </>
      ) : (
        <View style={styles.noData}>
          <Text style={styles.noDataText}>No Strava segment data</Text>
          <Text style={styles.noDataSubtext}>Connect Strava to see leaderboards</Text>
        </View>
      )}

      {userBestTime && (
        <View style={styles.yourBest}>
          <Text style={styles.yourBestLabel}>Your Best Time</Text>
          <Text style={styles.yourBestTime}>{formatTime(userBestTime)}</Text>
        </View>
      )}
    </View>
  );
}

// Elevation Tab
function ElevationTab({ trail }: { trail: Trail }) {
  return (
    <View style={styles.elevationTab}>
      <Text style={styles.elevationTitle}>📈 Elevation Profile</Text>
      
      <View style={styles.elevationStats}>
        <View style={styles.elevationStat}>
          <Text style={styles.elevationLabel}>Gain</Text>
          <Text style={styles.elevationValue}>{trail.elevationGain}m</Text>
        </View>
        {trail.metadata.elevation && (
          <>
            <View style={styles.elevationStat}>
              <Text style={styles.elevationLabel}>Min</Text>
              <Text style={styles.elevationValue}>{trail.metadata.elevation.min}m</Text>
            </View>
            <View style={styles.elevationStat}>
              <Text style={styles.elevationLabel}>Max</Text>
              <Text style={styles.elevationValue}>{trail.metadata.elevation.max}m</Text>
            </View>
          </>
        )}
        {trail.stravaSegment && (
          <View style={styles.elevationStat}>
            <Text style={styles.elevationLabel}>Grade</Text>
            <Text style={styles.elevationValue}>{trail.stravaSegment.grade.toFixed(1)}%</Text>
          </View>
        )}
      </View>

      {/* Simple elevation graph */}
      <View style={styles.elevationGraph}>
        {trail.waypoints.map((waypoint, index) => {
          const height = waypoint.elevation 
            ? ((waypoint.elevation - (trail.metadata.elevation?.min || 0)) / 
               ((trail.metadata.elevation?.max || 1000) - (trail.metadata.elevation?.min || 0))) * 100
            : 50;

          return (
            <View key={index} style={styles.graphColumn}>
              <View style={[styles.graphBar, { height: `${height}%`, backgroundColor: getDifficultyColor(trail.difficulty) }]} />
              {waypoint.name && (
                <Text style={styles.waypointName} numberOfLines={1}>{waypoint.name}</Text>
              )}
            </View>
          );
        })}
      </View>

      {/* Waypoints List */}
      <View style={styles.waypointsList}>
        <Text style={styles.waypointsTitle}>📍 Waypoints</Text>
        {trail.waypoints.map((waypoint, index) => (
          <View key={index} style={styles.waypointItem}>
            <Text style={styles.waypointNumber}>{index + 1}</Text>
            <View style={styles.waypointInfo}>
              <Text style={styles.waypointNameText}>{waypoint.name || 'Waypoint'}</Text>
              {waypoint.elevation && (
                <Text style={styles.waypointElevation}>{waypoint.elevation}m</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

// Social Tab
function SocialTab({ friendsCompleted }: { friendsCompleted: Array<{ name: string; time: number; date: string }> }) {
  return (
    <View style={styles.socialTab}>
      <Text style={styles.socialTitle}>👥 Friends</Text>
      
      {friendsCompleted.length > 0 ? (
        friendsCompleted.map((friend, index) => (
          <View key={index} style={styles.friendCard}>
            <View style={styles.friendInfo}>
              <Text style={styles.friendName}>{friend.name}</Text>
              <Text style={styles.friendDate}>{friend.date}</Text>
            </View>
            <Text style={styles.friendTime}>{formatTime(friend.time)}</Text>
          </View>
        ))
      ) : (
        <View style={styles.noFriends}>
          <Text style={styles.noFriendsText}>No friends have completed this trail yet</Text>
          <Text style={styles.noFriendsSubtext}>Be the first! 🏆</Text>
        </View>
      )}

      {/* Share Button */}
      <Pressable style={styles.shareButton}>
        <Text style={styles.shareButtonText}>📤 Share Trail</Text>
      </Pressable>
    </View>
  );
}

// Helper Components
function InfoItem({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

function getTrailTypeIcon(trail: Trail): string {
  if (trail.tags.includes('mountain')) return '🏔️';
  if (trail.tags.includes('waterfall')) return '💧';
  if (trail.tags.includes('lake')) return '🏞️';
  if (trail.tags.includes('coastal')) return '🌊';
  if (trail.tags.includes('forest')) return '🌲';
  if (trail.type === 'Running') return '🏃';
  if (trail.type === 'Cycling') return '🚴';
  return '🥾';
}

function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case 'Easy': return '#4caf50';
    case 'Moderate': return '#2196f3';
    case 'Hard': return '#ff9800';
    case 'Expert': return '#f44336';
    default: return '#666666';
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end'
  },
  container: {
    width: '100%',
    maxHeight: '85%'
  },
  content: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  header: {
    marginBottom: 20
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16
  },
  trailIcon: {
    fontSize: 48
  },
  titleInfo: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  region: {
    fontSize: 14,
    color: '#8e8e93'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  statChip: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 8,
    gap: 8
  },
  completionText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4caf50'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: 'rgba(68, 136, 255, 0.3)'
  },
  tabText: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#ffffff'
  },
  tabContent: {
    maxHeight: 300,
    marginBottom: 16
  },
  infoTab: {
    gap: 16
  },
  description: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
    marginBottom: 8
  },
  infoGrid: {
    gap: 12
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12
  },
  infoIcon: {
    fontSize: 24
  },
  infoLabel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 2
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  facilities: {
    marginTop: 8
  },
  facilitiesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  facilitiesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  facilityChip: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  facilityText: {
    fontSize: 12,
    color: '#4488ff',
    fontWeight: '600'
  },
  safetySection: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff9800'
  },
  safetyTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 8
  },
  hazards: {
    marginBottom: 8
  },
  hazardsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  hazardText: {
    fontSize: 12,
    color: '#ff9800',
    marginLeft: 8
  },
  emergency: {},
  emergencyLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  emergencyText: {
    fontSize: 12,
    color: '#ffffff',
    marginLeft: 8
  },
  leaderboardTab: {
    gap: 12
  },
  segmentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  komCard: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#ffd700'
  },
  komLabel: {
    fontSize: 12,
    color: '#ffd700',
    marginBottom: 4
  },
  komName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  komTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  komDate: {
    fontSize: 11,
    color: '#8e8e93',
    marginTop: 4
  },
  prCard: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  prLabel: {
    fontSize: 12,
    color: '#4488ff',
    marginBottom: 4
  },
  prTime: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  prRank: {
    fontSize: 14,
    color: '#8e8e93',
    marginTop: 4
  },
  leaderboardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 8,
    marginBottom: 4
  },
  leaderboardEntry: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12
  },
  leaderboardRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd700',
    minWidth: 40
  },
  leaderboardInfo: {
    flex: 1
  },
  leaderboardName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  leaderboardDate: {
    fontSize: 11,
    color: '#8e8e93'
  },
  leaderboardTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4488ff'
  },
  noData: {
    padding: 32,
    alignItems: 'center'
  },
  noDataText: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 8
  },
  noDataSubtext: {
    fontSize: 12,
    color: '#5e5e6e'
  },
  yourBest: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center'
  },
  yourBestLabel: {
    fontSize: 12,
    color: '#4caf50',
    marginBottom: 4
  },
  yourBestTime: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  elevationTab: {},
  elevationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16
  },
  elevationStats: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20
  },
  elevationStat: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center'
  },
  elevationLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4
  },
  elevationValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  elevationGraph: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginBottom: 16
  },
  graphColumn: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center'
  },
  graphBar: {
    width: '100%',
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    minHeight: 4
  },
  waypointName: {
    fontSize: 8,
    color: '#8e8e93',
    marginTop: 4,
    textAlign: 'center'
  },
  waypointsList: {
    gap: 8
  },
  waypointsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  waypointItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    padding: 12
  },
  waypointNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4488ff',
    minWidth: 30,
    textAlign: 'center'
  },
  waypointInfo: {
    flex: 1
  },
  waypointNameText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600'
  },
  waypointElevation: {
    fontSize: 12,
    color: '#8e8e93'
  },
  socialTab: {
    gap: 12
  },
  socialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12
  },
  friendInfo: {
    flex: 1
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2
  },
  friendDate: {
    fontSize: 12,
    color: '#8e8e93'
  },
  friendTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4488ff'
  },
  noFriends: {
    padding: 32,
    alignItems: 'center'
  },
  noFriendsText: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
    textAlign: 'center'
  },
  noFriendsSubtext: {
    fontSize: 12,
    color: '#5e5e6e'
  },
  shareButton: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4488ff',
    marginTop: 8
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4488ff'
  },
  rewardsSection: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ffd700'
  },
  rewardsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffd700',
    marginBottom: 8
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 16
  },
  rewardItem: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff'
  },
  startButton: {
    width: '100%'
  },
  startButtonGradient: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center'
  },
  startButtonText: {
    fontSize: 18,
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
    alignItems: 'center',
    zIndex: 10
  },
  closeButtonText: {
    fontSize: 24,
    color: '#ffffff'
  }
});
