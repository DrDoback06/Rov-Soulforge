import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useFirebase } from '@/lib/firebase-context';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { QuestCard } from '@/components/QuestCard';

/**
 * Quests Tab - Quest Management Interface
 * 
 * Features:
 * - All quest actions: Show on Map, Navigate, Abandon, Hide
 * - Filter by status
 * - Organized list view with scrolling
 * - Beautiful quest cards with progress tracking
 */

interface QuestProgress {
  id: string;
  questId: string;
  userId: string;
  status: 'active' | 'completed' | 'abandoned';
  order: number;
  hidden: boolean;
  objectives: any[];
  startedAt: string;
  lastUpdated: string;
  questDetails?: any;
}

type FilterType = 'active' | 'all' | 'hidden';

export default function QuestsScreen() {
  const { user, db } = useFirebase();
  const [quests, setQuests] = useState<QuestProgress[]>([]);
  const [filter, setFilter] = useState<FilterType>('active');
  const [loading, setLoading] = useState(true);
  const [expandedQuest, setExpandedQuest] = useState<string | null>(null);

  // Load quests from new generation system
  useEffect(() => {
    if (!user || !db) return;

    const loadQuests = async () => {
      try {
        setLoading(true);
        
        // Load all quest types (Static + Local + Dynamic)
        const [staticSnap, localSnap, dynamicSnap, progressSnap] = await Promise.all([
          getDocs(collection(db, 'staticQuests')),
          getDocs(collection(db, 'localQuests')),
          getDocs(query(collection(db, 'dynamicQuests'), where('userId', '==', user.uid))),
          getDocs(query(collection(db, 'questProgress'), where('userId', '==', user.uid)))
        ]);

        // Build quest progress map
        const progressMap = new Map();
        progressSnap.forEach(doc => {
          const data = doc.data();
          progressMap.set(data.questId, { id: doc.id, ...data });
        });

        const questsData: any[] = [];

        // Process all quest types
        const processQuest = (doc: any, source: string) => {
          const questData = { id: doc.id, ...doc.data() };
          const progress = progressMap.get(doc.id) || {
            status: 'available',
            objectives: questData.objectives,
            hidden: false,
            order: 999
          };

          questsData.push({
            ...progress,
            questId: doc.id,
            questDetails: questData,
            source
          });
        };

        staticSnap.forEach(doc => processQuest(doc, 'static'));
        localSnap.forEach(doc => processQuest(doc, 'local'));
        dynamicSnap.forEach(doc => processQuest(doc, 'dynamic'));

        // Sort by order
        questsData.sort((a, b) => (a.order || 999) - (b.order || 999));
        setQuests(questsData);
        
        console.log(`✅ Loaded ${questsData.length} quests for Quest Management`);
        console.log('First quest sample:', questsData[0]);
        console.log('Has questDetails?', questsData[0]?.questDetails ? 'YES' : 'NO');
      } catch (error) {
        console.error('Error loading quests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadQuests();

    // Refresh every 30 seconds
    const interval = setInterval(loadQuests, 30000);
    return () => clearInterval(interval);
  }, [user, db]);

  // Filter quests
  const filteredQuests = quests.filter(q => {
    if (filter === 'active') return !q.hidden && (q.status === 'active' || q.status === 'in_progress' || q.status === 'available');
    if (filter === 'hidden') return q.hidden;
    return true; // 'all'
  });

  // Abandon quest
  const handleAbandon = async (quest: QuestProgress) => {
    Alert.alert(
      'Abandon Quest',
      `Are you sure you want to abandon "${quest.questDetails?.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Abandon',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db!, 'questProgress', quest.id));
              setQuests(prev => prev.filter(q => q.id !== quest.id));
            } catch (error) {
              console.error('Error abandoning quest:', error);
              Alert.alert('Error', 'Failed to abandon quest');
            }
          }
        }
      ]
    );
  };

  // Hide quest
  const handleHide = async (quest: QuestProgress) => {
    try {
      const questRef = doc(db!, 'questProgress', quest.id);
      await updateDoc(questRef, { hidden: !quest.hidden });
      
      setQuests(prev =>
        prev.map(q =>
          q.id === quest.id ? { ...q, hidden: !q.hidden } : q
        )
      );
    } catch (error) {
      console.error('Error hiding quest:', error);
      Alert.alert('Error', 'Failed to hide quest');
    }
  };

  // Show on map (with route and compact details)
  const handleShowOnMap = (quest: QuestProgress) => {
    // Navigate to map tab with quest in query params
    router.push({
      pathname: '/(tabs)',
      params: {
        showQuestId: quest.questId,
        showRoute: 'true'
      }
    });
  };

  // Navigate to quest (drive mode)
  const handleNavigate = (quest: QuestProgress) => {
    // Navigate to map tab with drive mode active
    router.push({
      pathname: '/(tabs)',
      params: {
        navigateToQuestId: quest.questId,
        driveMode: 'true'
      }
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
          <Text style={styles.loadingText}>Loading quests...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Quest Management</Text>
        <Text style={styles.subtitle}>
          {filteredQuests.length} {filter === 'active' ? 'Active' : filter === 'hidden' ? 'Hidden' : 'Total'}
        </Text>
      </View>

      {/* Filters */}
      <View style={styles.filters}>
        {(['active', 'all', 'hidden'] as FilterType[]).map(f => (
          <Pressable
            key={f}
            style={[styles.filterButton, filter === f && styles.filterButtonActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Quest List */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.questList}>
        {filteredQuests.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🗺️</Text>
            <Text style={styles.emptyText}>No quests found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'active' ? 'Explore the map to find adventures!' : 'Try changing the filter'}
            </Text>
            {filter === 'active' && (
              <Pressable
                style={styles.exploreButton}
                onPress={() => router.push('/(tabs)')}
              >
                <Text style={styles.exploreButtonText}>Explore Map</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <>
            <Text style={{ color: '#fff', padding: 16 }}>
              DEBUG: Showing {filteredQuests.length} quests
            </Text>
            {filteredQuests.map((quest, index) => {
              console.log(`Rendering quest ${index}:`, quest.questDetails?.title || 'NO TITLE');
              return (
                <QuestCard
                  key={quest.id || `quest-${index}`}
                  quest={quest}
                  onShowOnMap={() => handleShowOnMap(quest)}
                  onNavigate={() => handleNavigate(quest)}
                  onHide={() => handleHide(quest)}
                  onAbandon={() => handleAbandon(quest)}
                  onExpand={() => setExpandedQuest(expandedQuest === quest.id ? null : quest.id)}
                  isExpanded={expandedQuest === quest.id}
                />
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  subtitle: {
    fontSize: 16,
    color: '#4488ff',
    fontWeight: '600'
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    alignItems: 'center'
  },
  filterButtonActive: {
    backgroundColor: '#4488ff'
  },
  filterText: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '600'
  },
  filterTextActive: {
    color: '#fff'
  },
  scrollView: {
    flex: 1
  },
  questList: {
    padding: 20,
    paddingBottom: 100,
    gap: 16
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12
  },
  emptyIcon: {
    fontSize: 64
  },
  emptyText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600'
  },
  emptySubtext: {
    color: '#8e8e93',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40
  },
  exploreButton: {
    marginTop: 20,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#4488ff'
  },
  exploreButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
