import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCharacter } from '@/hooks/useCharacter';
import { useState } from 'react';
import type { Character } from '@rov/types';
import { CharacterStatsScreen } from './CharacterStatsScreen';
import { SkillTreeScreen } from './SkillTreeScreen';
import { InventoryScreen } from './InventoryScreen';

interface HeroPanelContainerProps {
  isOpen: boolean;
  onClose: () => void;
  panelWidth: number;
}

type HeroTab = 'stats' | 'equipment' | 'skills';

/**
 * Hero Panel Container
 * 
 * Sliding panel from right side (like Quest Panel)
 * Shows character stats, equipment, and skills
 * Recreates HeroPullDown functionality in panel format
 */
export function HeroPanelContainer({
  isOpen,
  onClose,
  panelWidth
}: HeroPanelContainerProps) {
  const insets = useSafeAreaInsets();
  const { character, loading } = useCharacter();
  const [activeTab, setActiveTab] = useState<HeroTab>('stats');

  // Animated panel slide
  const translateX = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(isOpen ? 0 : panelWidth, {
      damping: 20,
      stiffness: 90
    }) }]
  }));

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={StyleSheet.absoluteFillObject} />
      </Pressable>

      {/* Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            width: panelWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom
          },
          translateX
        ]}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0a0a0f']}
          style={styles.panelGradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>⚔️ Hero</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {/* Tabs */}
          <View style={styles.tabs}>
            <Pressable
              onPress={() => setActiveTab('stats')}
              style={[styles.tab, activeTab === 'stats' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'stats' && styles.tabTextActive]}>
                📊 Stats
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('equipment')}
              style={[styles.tab, activeTab === 'equipment' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'equipment' && styles.tabTextActive]}>
                🎒 Equipment
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab('skills')}
              style={[styles.tab, activeTab === 'skills' && styles.tabActive]}
            >
              <Text style={[styles.tabText, activeTab === 'skills' && styles.tabTextActive]}>
                🌟 Skills
              </Text>
            </Pressable>
          </View>

          {/* Content */}
          <View style={styles.content}>
            {loading ? (
              <LoadingState />
            ) : !character ? (
              <EmptyState />
            ) : (
              <>
                {activeTab === 'stats' && <CharacterStatsScreen character={character} loading={loading} />}
                {activeTab === 'equipment' && <InventoryScreen character={character} loading={loading} />}
                {activeTab === 'skills' && <SkillTreeScreen character={character} loading={loading} />}
              </>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    </>
  );
}

/**
 * Loading State
 */
function LoadingState() {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.loadingText}>Loading character...</Text>
    </View>
  );
}

/**
 * Empty State
 */
function EmptyState() {
  return (
    <View style={styles.centerContainer}>
      <Text style={styles.emptyText}>No character found</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100
  },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    zIndex: 101,
    shadowColor: '#000',
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10
  },
  panelGradient: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2a2a3e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a3e'
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#ffd700'
  },
  tabText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#ffd700'
  },
  content: {
    flex: 1
  },
  contentContainer: {
    padding: 16
  },
  tabContent: {
    gap: 16
  },
  characterHeader: {
    padding: 20,
    borderRadius: 8,
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
    gap: 12
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8
  },
  statBarContainer: {
    gap: 4
  },
  statLabel: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600'
  },
  barWrapper: {
    position: 'relative'
  },
  barBackground: {
    height: 24,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden'
  },
  barFill: {
    height: '100%',
    borderRadius: 4
  },
  barText: {
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
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  goldValue: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold'
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a3e'
  },
  statBoxLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4
  },
  statBoxValue: {
    color: '#ffd700',
    fontSize: 24,
    fontWeight: 'bold'
  },
  equipmentList: {
    gap: 12
  },
  equipmentSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 12
  },
  equipmentIcon: {
    fontSize: 32
  },
  equipmentInfo: {
    flex: 1
  },
  equipmentLabel: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4
  },
  equipmentValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  skillsList: {
    gap: 12
  },
  skillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    gap: 12
  },
  skillIcon: {
    fontSize: 24
  },
  skillName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  hint: {
    color: '#888',
    fontSize: 12,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 16
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    color: '#888',
    fontSize: 16
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center'
  }
});
