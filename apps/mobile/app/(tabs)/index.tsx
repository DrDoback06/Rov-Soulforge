import { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, Alert, Platform, Pressable, Text } from 'react-native';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import { geohashQueryBounds, distanceBetween } from 'geofire-common';
import type { EnhancedQuest, QuestObjective } from '@/types/quest-enhanced';
import { MapView } from '@/components/MapView.web';
import { EnhancedQuestList } from '@/components/EnhancedQuestList';
import { QuestDetailModal } from '@/components/QuestDetailModal';
import { QuestActivationModal } from '@/components/QuestActivationModal';
import { QuestObjectiveHUD } from '@/components/QuestObjectiveHUD';
import { SearchHereButton } from '@/components/SearchHereButton';
import { QuestPanelContainer } from '@/components/QuestPanel';
import { QuestPanelToggle } from '@/components/QuestPanel/QuestPanelToggle';
import { MultiStopNavigationHUD } from '@/components/MultiStopNavigationHUD';
import { QuestCompletionModal } from '@/components/QuestCompletionModal';
import { QuestAbandonModal } from '@/components/QuestAbandonModal';
import { FloatingQuestDetails } from '@/components/FloatingQuestDetails';
import { useLocalSearchParams } from 'expo-router';
import { useQuestProximity } from '@/hooks/useQuestProximity';
import { useQuestBattleListener } from '@/hooks/useQuestBattleListener';
import { usePanelManagerContext } from '@/contexts/PanelManagerContext';
import { useActiveQuests } from '@/hooks/useActiveQuests';
import { useRouteOptimization } from '@/hooks/useRouteOptimization';
import { useQuestNavigation } from '@/hooks/useQuestNavigation';
import { useQuestActions } from '@/hooks/useQuestActions';
import { generateStaticQuests, generateLocalQuests, generateDynamicQuests } from '@/services/questGeneration';
// import { loadViewportQuests } from '@/services/viewportQuestLoader';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { Dimensions } from 'react-native';

interface QuestProgress {
  id: string;
  questId: string;
  userId: string;
  status: 'in_progress' | 'completed' | 'failed';
  objectives: QuestObjective[];
  spawnedEnemies?: Array<{
    id: string;
    type: string;
    level: number;
    location: { latitude: number; longitude: number };
    defeated: boolean;
  }>;
}

/**
 * Map Tab - Main adventure screen
 */
export default function MapScreen() {
  const { db, user } = useFirebase();
  const params = useLocalSearchParams();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  
  // Drive mode state
  const [driveMode, setDriveMode] = useState(false);
  const [driveModeQuest, setDriveModeQuest] = useState<EnhancedQuest | null>(null);
  
  // Spoof movement for testing (DEV ONLY)
  const [spoofMovement, setSpoofMovement] = useState(false);
  const spoofAngle = useRef(0);
  const spoofSpeed = useRef(0.0001); // Speed in degrees per update
  const spoofDirection = useRef<'forward' | 'backward' | 'left' | 'right' | 'stop'>('stop');
  
  // Quest data
  const [staticQuests, setStaticQuests] = useState<EnhancedQuest[]>([]);
  const [dynamicQuests, setDynamicQuests] = useState<any[]>([]);
  const [worldEvents, setWorldEvents] = useState<any[]>([]);
  const [acceptedQuestIds, setAcceptedQuestIds] = useState<string[]>([]);
  const [questProgress, setQuestProgress] = useState<QuestProgress[]>([]);
  
  // Active quest tracking
  const [activeQuest, setActiveQuest] = useState<QuestProgress | null>(null);
  const [currentObjective, setCurrentObjective] = useState<QuestObjective | null>(null);
  
  // Spawned enemies
  const [spawnedEnemies, setSpawnedEnemies] = useState<any[]>([]);
  
  // UI state
  const [selectedQuest, setSelectedQuest] = useState<EnhancedQuest | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activationQuest, setActivationQuest] = useState<EnhancedQuest | null>(null);
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showQuestOnMap, setShowQuestOnMap] = useState<EnhancedQuest | null>(null);
  const [navigatingToQuest, setNavigatingToQuest] = useState<EnhancedQuest | null>(null);
  const [showSearchHere, setShowSearchHere] = useState(false);
  
  // Quest action modals
  const [completionQuest, setCompletionQuest] = useState<EnhancedQuest | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [abandonQuest, setAbandonQuest] = useState<EnhancedQuest | null>(null);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  
  // Derived player coordinates (needs to be defined early for hooks)
  const playerCoords = location ? {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude
  } : null;

  // Quest Panel - using global panel manager
  const { isQuestPanelOpen, openQuestPanel, closeAllPanels } = usePanelManagerContext();
  const PANEL_WIDTH = Math.min(Dimensions.get('window').width * 0.4, 500);
  const panelTranslateX = useSharedValue(PANEL_WIDTH);

  // Sync panel animation with global state
  useEffect(() => {
    panelTranslateX.value = withSpring(isQuestPanelOpen ? 0 : PANEL_WIDTH);
  }, [isQuestPanelOpen, PANEL_WIDTH]);

  // Active Quests (Multi-Stop Routing)
  const {
    activeQuests: activeQuestEntries,
    canAddMore,
    maxQuests,
    addToActive,
    removeFromActive,
    reorderActiveQuests,
    loadActiveQuests
  } = useActiveQuests(db, user?.uid);

  const activeQuestsData = activeQuestEntries.map(entry => entry.quest);

  // Route Optimization
  const {
    optimizeRoute,
    calculateTotalDistance,
    calculateOptimizationSavings
  } = useRouteOptimization();

  const [isRouteOptimized, setIsRouteOptimized] = useState(false);
  const [completedQuestIdsInSession, setCompletedQuestIdsInSession] = useState<string[]>([]);
  
  // Calculate reward multiplier based on completed quests in session
  const rewardMultiplier = 1 + (completedQuestIdsInSession.length * 0.1); // 10% bonus per completed quest

  // Quest Actions (Accept, Abandon, Complete)
  const {
    acceptQuest,
    abandonQuest: abandonQuestAction,
    completeQuest,
    getQuestProgress
  } = useQuestActions(db, user?.uid);

  // Multi-Stop Navigation with Real-Time Updates
  const {
    isNavigating: isMultiStopNavigating,
    currentQuest: currentNavQuest,
    nextQuest: nextNavQuest,
    currentQuestIndex,
    distanceToCurrentQuest,
    etaToCurrentQuest,
    totalDistance: navTotalDistance,
    totalEta: navTotalEta,
    startNavigation: startMultiStopNav,
    stopNavigation: stopMultiStopNav,
    skipCurrentQuest,
    formatDistance,
    formatEta
  } = useQuestNavigation(activeQuestsData, playerCoords);

  // Quest proximity detection
  const {
    nearbyQuests,
    getDistanceToQuest,
    isWithinAcceptRadius
  } = useQuestProximity({
    playerLocation: location ? {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude
    } : null,
    quests: staticQuests,
    onQuestEntered: (quest) => {
      if (!acceptedQuestIds.includes(quest.id)) {
      setActivationQuest(quest);
      setShowActivationModal(true);
      }
    }
  });

  // Battle completion listener
  useQuestBattleListener(
    db,
    user?.uid,
    async (battleResult: any) => {
      console.log('⚔️ Battle completed:', battleResult);
      loadQuestProgress();
    }
  );

  // Auto-exit drive mode when arriving at quest destination
  useEffect(() => {
    if (driveMode && driveModeQuest && playerCoords) {
      const distance = getDistanceToQuest(driveModeQuest);
      const withinRadius = isWithinAcceptRadius(driveModeQuest);
      
      // Exit drive mode when within acceptance radius (50m by default)
      if (withinRadius) {
        console.log('🎯 Arrived at quest destination! Exiting drive mode.');
        setDriveMode(false);
        setDriveModeQuest(null);
        setNavigatingToQuest(null);
        
        // Show acceptance modal if not already accepted
        if (!acceptedQuestIds.includes(driveModeQuest.id)) {
          setActivationQuest(driveModeQuest);
          setShowActivationModal(true);
        }
      }
    }
  }, [driveMode, driveModeQuest, playerCoords, getDistanceToQuest, isWithinAcceptRadius, acceptedQuestIds]);

  // Load active quests on mount
  useEffect(() => {
    loadActiveQuests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Handle route params (from quest tab)
  useEffect(() => {
    if (params.showQuestId && staticQuests.length > 0) {
      // Show quest on map with route
      const quest = staticQuests.find(q => q.id === params.showQuestId);
      if (quest) {
        setShowQuestOnMap(quest);
        setNavigatingToQuest(quest);
      }
    }

    if (params.navigateToQuestId && params.driveMode === 'true') {
      // Start drive mode
      const quest = staticQuests.find(q => q.id === params.navigateToQuestId);
      if (quest) {
        setDriveMode(true);
        setDriveModeQuest(quest);
        setNavigatingToQuest(quest);
      }
    }
  }, [params.showQuestId, params.navigateToQuestId, params.driveMode, staticQuests.length]); // Use specific param properties and array length instead of whole array

  // Request location permission
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
    })();
  }, []);

  // Spoof movement for testing camera follow
  useEffect(() => {
    if (!spoofMovement || !location) return;

    // Store initial center point
    let centerLat = location.coords.latitude;
    let centerLng = location.coords.longitude;

    const interval = setInterval(() => {
      if (spoofDirection.current === 'stop') return;

      let deltaLat = 0;
      let deltaLng = 0;
      const speed = spoofSpeed.current;

      switch (spoofDirection.current) {
        case 'forward':
          deltaLat = speed * Math.cos(spoofAngle.current * Math.PI / 180);
          deltaLng = speed * Math.sin(spoofAngle.current * Math.PI / 180);
          break;
        case 'backward':
          deltaLat = -speed * Math.cos(spoofAngle.current * Math.PI / 180);
          deltaLng = -speed * Math.sin(spoofAngle.current * Math.PI / 180);
          break;
        case 'left':
          spoofAngle.current -= 5; // Turn left
          break;
        case 'right':
          spoofAngle.current += 5; // Turn right
          break;
      }

      // Calculate new position
      const newLat = centerLat + deltaLat;
      const newLng = centerLng + deltaLng;
      
      // Update center for next movement
      centerLat = newLat;
      centerLng = newLng;

      setLocation(prev => prev ? {
        ...prev,
        coords: {
          ...prev.coords,
          latitude: newLat,
          longitude: newLng,
          heading: spoofAngle.current,
          speed: spoofDirection.current === 'stop' ? 0 : 1.0
        }
      } : prev);
    }, 100); // Update every 100ms for smoother movement

    return () => clearInterval(interval);
  }, [spoofMovement]); // Only depend on spoofMovement toggle, NOT location

  // Watch user location
  useEffect(() => {
    if (!locationPermission || spoofMovement) return; // Don't watch if spoofing

    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      if (Platform.OS === 'web') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High
          });
          setLocation(loc);
      } else {
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10
          },
          (loc) => {
            setLocation(loc);
          }
        );
      }
    })();

    return () => {
      subscription?.remove();
    };
  }, [locationPermission, spoofMovement]);

  // Load accepted quest IDs
  const loadAcceptedQuestIds = useCallback(async () => {
      if (!user || !db) return;

      try {
        const q = query(
          collection(db, 'questProgress'),
          where('userId', '==', user.uid),
        where('status', '==', 'in_progress')
        );

        const snapshot = await getDocs(q);
        const ids = snapshot.docs.map(doc => doc.data().questId);
        setAcceptedQuestIds(ids);
      } catch (error) {
      console.error('Error loading accepted quest IDs:', error);
      }
  }, [user, db]);

  useEffect(() => {
    if (user && db) {
      loadAcceptedQuestIds();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, db]); // Run when user and db become available

  // Load quest progress and enemies
  const loadQuestProgress = useCallback(async () => {
    if (!user || !db) return;

    try {
      const q = query(
        collection(db, 'questProgress'),
        where('userId', '==', user.uid),
        where('status', '==', 'in_progress')
      );

      const snapshot = await getDocs(q);
      const progressData: QuestProgress[] = [];
      const allEnemies: any[] = [];

      for (const docSnap of snapshot.docs) {
        const data = { id: docSnap.id, ...docSnap.data() } as QuestProgress;
        progressData.push(data);

        // Extract spawned enemies
        if (data.spawnedEnemies) {
          const undefeatedEnemies = data.spawnedEnemies.filter(e => !e.defeated);
          allEnemies.push(...undefeatedEnemies.map(e => ({
            ...e,
            name: e.type,
            latitude: e.location.latitude,
            longitude: e.location.longitude,
            icon: '👹',
            questId: data.questId
          })));
        }
      }

      setQuestProgress(progressData);
      setSpawnedEnemies(allEnemies);

      // Find active quest (first in-progress)
      if (progressData.length > 0) {
        const active = progressData[0];
        setActiveQuest(active);

        // Find current objective
        const currentObj = active.objectives.find(obj => !obj.completed);
        setCurrentObjective(currentObj || null);
      } else {
        setActiveQuest(null);
        setCurrentObjective(null);
      }

    } catch (error) {
      console.error('Error loading quest progress:', error);
    }
  }, [user, db]);

  useEffect(() => {
    if (user && db) {
      loadQuestProgress();
      const interval = setInterval(loadQuestProgress, 30000);
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, db]); // Run when user and db become available

  // Load quests near center (Static + Local + Dynamic)
  const loadNearbyQuests = useCallback(async (center: { latitude: number; longitude: number }) => {
    if (!db || !user) return;

    try {
      console.log('🗺️ Loading quests near:', center);

      const playerLevel = 1; // TODO: Get from character

      // Load all quest types in parallel
      const [staticQ, localQ, dynamicQ] = await Promise.all([
        generateStaticQuests(db, center, playerLevel),
        generateLocalQuests(db, center, playerLevel, user.uid),
        generateDynamicQuests(db, center, playerLevel, user.uid)
      ]);

      console.log('✅ Quests loaded:', {
        static: staticQ.length,
        local: localQ.length,
        dynamic: dynamicQ.length,
        total: staticQ.length + localQ.length + dynamicQ.length
      });

      // Combine Static + Local into staticQuests (both are globally visible)
      setStaticQuests([...staticQ, ...localQ]);
      // Dynamic quests are player-specific
      setDynamicQuests(dynamicQ);

        } catch (error) {
      console.error('❌ Error loading quests:', error);
      // Fallback to empty arrays
      setStaticQuests([]);
      setDynamicQuests([]);
    }
  }, [db, user]);

  // Initial load
  useEffect(() => {
    if (location && user && db) {
      loadNearbyQuests({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.coords.latitude, location?.coords.longitude, user, db]); // Use specific coordinates instead of entire location object

  // Search Here button handler
  const handleSearchHere = () => {
    if (location) {
      loadNearbyQuests({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      setShowSearchHere(false);
    }
  };

  // Quest acceptance handler moved below (consolidated with Phase 4 implementation)

  // Snap to quest on map
  const handleSnapToQuest = (quest: EnhancedQuest) => {
    setShowQuestOnMap(null);
    setTimeout(() => {
      setShowQuestOnMap(quest);
    }, 50);
  };

  // Navigate to quest (no snap - let camera follow player)
  const handleNavigateToQuest = (quest: EnhancedQuest) => {
    setNavigatingToQuest(quest);
    // Don't snap to quest - camera should follow player instead
  };

  /**
   * Handle Add to Active
   */
  const handleAddToActive = async (quest: EnhancedQuest) => {
    if (!canAddMore) {
      Alert.alert(
        'Active List Full',
        `You can only have ${maxQuests} active quests at a time. Remove one to add more.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const success = await addToActive(quest);
    if (success) {
      Alert.alert('Quest Added', `${quest.title} added to active quests`, [{ text: 'OK' }]);
    }
  };

  /**
   * Handle Remove from Active
   */
  const handleRemoveFromActive = async (questId: string) => {
    await removeFromActive(questId);
  };

  /**
   * Handle Reorder Active Quests (Drag-and-Drop)
   */
  const handleReorderActive = async (newOrder: EnhancedQuest[]) => {
    await reorderActiveQuests(newOrder);
    // Reset optimization flag when manually reordered
    setIsRouteOptimized(false);
  };

  /**
   * Toggle Route Optimization (On/Off)
   */
  const handleOptimizeRoute = () => {
    if (!playerCoords || activeQuestsData.length === 0) return;

    // Toggle optimization state
    if (!isRouteOptimized) {
      // Optimize the route
      const optimized = optimizeRoute(playerCoords, activeQuestsData);
      const savings = calculateOptimizationSavings(playerCoords, activeQuestsData, optimized);

      reorderActiveQuests(optimized);
      setIsRouteOptimized(true);

      if (savings.saved > 0) {
        Alert.alert(
          'Route Optimized! ⚡',
          `You'll save ${formatDistance(savings.saved)} (${savings.percentage.toFixed(0)}% shorter)`,
          [{ text: 'Nice!' }]
        );
      } else {
        Alert.alert('Route Already Optimal', 'This is the best route!', [{ text: 'OK' }]);
      }
    } else {
      // Turn off optimization (just toggle the state, keep current order)
      setIsRouteOptimized(false);
    }
  };

  /**
   * Start Multi-Stop Navigation with Drive Mode
   */
  const handleNavigateAll = () => {
    if (activeQuestsData.length === 0) return;

    closeAllPanels();
    
    // Enter drive mode with first quest BEFORE starting navigation
    const firstQuest = activeQuestsData[0];
    setDriveMode(true);
    setDriveModeQuest(firstQuest);
    setNavigatingToQuest(firstQuest);
    
    // Start multi-stop navigation
    startMultiStopNav();
    
    console.log('🧭 Multi-Stop Navigation Started:', {
      driveMode: true,
      questCount: activeQuestsData.length,
      firstQuest: firstQuest.title
    });
    
    Alert.alert(
      'Navigation Started 🧭',
      `Routing to ${activeQuestsData.length} quest${activeQuestsData.length > 1 ? 's' : ''}`,
      [{ text: 'Let\'s Go!' }]
    );
  };

  /**
   * Calculate total route stats for display
   */
  const totalRouteDistance = playerCoords && activeQuestsData.length > 0
    ? calculateTotalDistance(playerCoords, activeQuestsData)
    : 0;

  const totalRouteEta = totalRouteDistance / 1.4; // Walking speed 1.4 m/s

  /**
   * Handle Accept Quest (unified handler for all quest accept actions)
   * Accepts the quest AND adds it to active quests automatically
   */
  const handleAcceptQuest = async (quest: EnhancedQuest) => {
    if (!canAddMore) {
      Alert.alert(
        'Active List Full',
        `You can only have ${maxQuests} active quests at a time. Remove one to add more.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Add to active quests (this also accepts it)
    const success = await addToActive(quest);
    
    if (success) {
      Alert.alert('Quest Accepted! ✅', `"${quest.title}" added to active quests`, [{ text: 'OK' }]);
      setShowActivationModal(false); // Close activation modal if open
      await loadAcceptedQuestIds(); // Reload accepted quest IDs
      await loadQuestProgress(); // Reload quest progress
      await loadActiveQuests(); // Reload active quests
      } else {
      Alert.alert('Error', 'Failed to accept quest. Quest may already be accepted or active list is full.', [{ text: 'OK' }]);
    }
  };

  /**
   * Handle Abandon Quest (Show Confirmation)
   */
  const handleAbandonQuest = (quest: EnhancedQuest) => {
    setAbandonQuest(quest);
    setShowAbandonModal(true);
  };

  /**
   * Confirm Abandon Quest
   */
  const confirmAbandonQuest = async () => {
    if (!abandonQuest) return;

    const currentQuestProgress = questProgress.find((qp: QuestProgress) => qp.questId === abandonQuest.id);
    const result = await abandonQuestAction(abandonQuest);

    setShowAbandonModal(false);

    if (result.success) {
      Alert.alert(
        'Quest Abandoned',
        result.xpPenalty 
          ? `You've abandoned "${abandonQuest.title}". XP penalty: -${result.xpPenalty}`
          : `You've abandoned "${abandonQuest.title}".`,
        [{ text: 'OK' }]
      );
      loadQuestProgress(); // Reload to update status
    } else {
      Alert.alert('Error', result.error || 'Failed to abandon quest', [{ text: 'OK' }]);
    }

    setAbandonQuest(null);
  };

  /**
   * Handle Complete Quest (Show Rewards Modal)
   */
  const handleCompleteQuest = (quest: EnhancedQuest) => {
    setCompletionQuest(quest);
    setShowCompletionModal(true);
  };

  /**
   * Accept Rewards and Complete Quest
   */
  const handleAcceptRewards = async () => {
    if (!completionQuest) return;

    // Track completion in current session
    setCompletedQuestIdsInSession(prev => [...prev, completionQuest.id]);

    // Complete quest (multiplier will be applied in the function)
    const result = await completeQuest(completionQuest);

    if (result.success) {
      // Log fitness data (distance traveled to quest)
      const distanceToQuest = playerCoords ? getDistanceToQuest(completionQuest) : 0;
      console.log('🏃 Fitness Log:', {
        questId: completionQuest.id,
        distanceTraveled: distanceToQuest,
        multiplier: rewardMultiplier,
        timestamp: new Date().toISOString()
      });

      loadQuestProgress(); // Reload to show completed status
      removeFromActive(completionQuest.id); // Remove from active quests

      // Show completion message with multiplier
      if (rewardMultiplier > 1) {
        Alert.alert(
          '🎉 Quest Complete!',
          `Rewards boosted by ${((rewardMultiplier - 1) * 100).toFixed(0)}% for completing multiple quests!\n\nStreak: ${completedQuestIdsInSession.length + 1} quests`,
          [{ text: 'Nice!' }]
        );
      }

      // Auto-advance to next quest in multi-stop navigation
      if (isMultiStopNavigating && currentQuestIndex < activeQuestsData.length - 1) {
        const nextQuest = activeQuestsData[currentQuestIndex + 1];
        setDriveModeQuest(nextQuest);
        console.log('➡️ Auto-advancing to next quest:', nextQuest.title);
      } else if (isMultiStopNavigating) {
        // Completed all quests in route!
        Alert.alert(
          '🏆 Route Complete!',
          `Completed ${completedQuestIdsInSession.length + 1} quests with ${rewardMultiplier.toFixed(1)}x multiplier!`,
          [{ text: 'Awesome!' }]
        );
        stopMultiStopNav();
        setDriveMode(false);
        setDriveModeQuest(null);
        setCompletedQuestIdsInSession([]);
      }
    } else {
      Alert.alert('Error', result.error || 'Failed to complete quest', [{ text: 'OK' }]);
    }

    setCompletionQuest(null);
  };

  // Enemy tap handler
  const handleEnemyTap = (enemy: any) => {
    Alert.alert(
      `${enemy.name} (Level ${enemy.level})`,
      'Ready to fight this enemy?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Fight!',
          onPress: async () => {
            try {
              const battleRef = await addDoc(collection(db!, 'battles'), {
                playerIds: [user!.uid],
                enemyId: enemy.id,
                enemyType: enemy.type || enemy.name,
                enemyLevel: enemy.level,
                status: 'active',
                createdAt: new Date().toISOString(),
                questId: enemy.questId
              });

              router.push(`/battle/${battleRef.id}`);
            } catch (error) {
              console.error('Error creating battle:', error);
              Alert.alert('Error', 'Failed to start battle');
            }
          }
        }
      ]
    );
  };

  const activationDistance = activationQuest && playerCoords
    ? getDistanceToQuest(activationQuest)
    : null;

  const canAcceptActivationQuest = activationQuest && playerCoords
    ? isWithinAcceptRadius(activationQuest)
    : false;

  if (!location) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          {/* Loading... */}
        </View>
      </View>
    );
  }

    return (
      <View style={styles.container}>
      {/* Map */}
        <MapView
          location={{
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
          }}
          quests={[]}
        onQuestPress={() => {}}
          staticQuests={staticQuests}
        onStaticQuestPress={(quest) => {
          setSelectedQuest(quest);
          setShowDetailModal(true);
        }}
        onMapMove={() => setShowSearchHere(true)}
          focusQuest={showQuestOnMap}
          navigatingToQuest={navigatingToQuest}
          activeQuests={activeQuestsData}
          spawnedEnemies={spawnedEnemies}
        onEnemyPress={handleEnemyTap}
        driveMode={driveMode}
      />

      {/* Quest Objective HUD */}
      {activeQuest && currentObjective && (
        <View style={styles.hudContainer}>
          <QuestObjectiveHUD
            questTitle={activeQuest.questId}
            currentObjective={currentObjective}
            totalObjectives={activeQuest.objectives.length}
            currentObjectiveIndex={activeQuest.objectives.findIndex(obj => !obj.completed)}
          />
        </View>
      )}

      {/* Search Here Button */}
      {showSearchHere && (
        <SearchHereButton
          visible={showSearchHere}
          onPress={handleSearchHere}
        />
      )}

      {/* DEV: Spoof Movement Controls */}
      <View style={styles.spoofControls}>
        <Pressable
          style={[styles.spoofButton, spoofMovement && styles.spoofButtonActive]}
          onPress={() => setSpoofMovement(!spoofMovement)}
        >
          <Text style={styles.spoofButtonText}>
            {spoofMovement ? '🔄 Spoofing ON' : '⏸️ Spoof OFF'}
          </Text>
        </Pressable>

        {spoofMovement && (
          <View style={styles.directionControls}>
            <Pressable
              style={styles.directionButton}
              onPress={() => spoofDirection.current = 'forward'}
            >
              <Text style={styles.directionText}>↑</Text>
            </Pressable>
            <View style={styles.directionRow}>
              <Pressable
                style={styles.directionButton}
                onPress={() => spoofDirection.current = 'left'}
              >
                <Text style={styles.directionText}>←</Text>
              </Pressable>
              <Pressable
                style={styles.directionButton}
                onPress={() => spoofDirection.current = 'stop'}
              >
                <Text style={styles.directionText}>⏹</Text>
              </Pressable>
              <Pressable
                style={styles.directionButton}
                onPress={() => spoofDirection.current = 'right'}
              >
                <Text style={styles.directionText}>→</Text>
              </Pressable>
            </View>
            <Pressable
              style={styles.directionButton}
              onPress={() => spoofDirection.current = 'backward'}
            >
              <Text style={styles.directionText}>↓</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Quest Panel with Active Quests - Local to map screen */}
      <QuestPanelContainer
        quests={staticQuests}
        activeQuests={activeQuestsData}
        acceptedQuestIds={acceptedQuestIds}
        playerLocation={playerCoords}
        isOpen={isQuestPanelOpen}
        onClose={closeAllPanels}
        db={db}
        userId={user?.uid}
        onQuestPress={(quest) => {
          setSelectedQuest(quest);
          setShowDetailModal(true);
        }}
        onAcceptQuest={handleAcceptQuest}
        onAbandonQuest={handleAbandonQuest}
        onAddToActive={handleAddToActive}
        onNavigate={(quest) => {
          handleNavigateToQuest(quest);
          closeAllPanels();
        }}
        onViewLocation={(quest) => {
          handleSnapToQuest(quest);
        }}
        onReorderActive={handleReorderActive}
        onRemoveFromActive={handleRemoveFromActive}
        onNavigateAll={handleNavigateAll}
        onOptimizeRoute={handleOptimizeRoute}
        isRouteOptimized={isRouteOptimized}
        totalRouteDistance={totalRouteDistance}
        totalRouteEta={totalRouteEta}
        maxActiveQuests={maxQuests}
        panelTranslateX={panelTranslateX}
      />

      {/* Multi-Stop Navigation HUD */}
      {isMultiStopNavigating && activeQuestsData.length > 0 && (
        <MultiStopNavigationHUD
          quests={activeQuestsData}
          currentQuestIndex={currentQuestIndex}
          completedQuestIds={completedQuestIdsInSession}
          totalDistance={navTotalDistance}
          totalEta={navTotalEta}
          rewardMultiplier={rewardMultiplier}
          formatDistance={formatDistance}
          formatEta={formatEta}
          onClose={() => {
            stopMultiStopNav();
            setDriveMode(false);
            setDriveModeQuest(null);
            setCompletedQuestIdsInSession([]);
          }}
        />
      )}

      {/* Floating Quest Details (Drive Mode) */}
      {driveMode && driveModeQuest && playerCoords && (
        <FloatingQuestDetails
          quest={driveModeQuest}
          distance={getDistanceToQuest(driveModeQuest) || 0}
          eta={(getDistanceToQuest(driveModeQuest) || 0) / 1.4}
          onClose={() => {
            setDriveMode(false);
            setDriveModeQuest(null);
            setNavigatingToQuest(null);
          }}
          onAbandon={() => {
            Alert.alert(
              'End Navigation?',
              'Stop navigating to this quest?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'End Navigation',
                  style: 'destructive',
                  onPress: () => {
                    setDriveMode(false);
                    setDriveModeQuest(null);
                    setNavigatingToQuest(null);
                  }
                }
              ]
            );
          }}
          formatDistance={formatDistance}
          formatEta={formatEta}
        />
      )}

      {/* Quest Detail Modal */}
          <QuestDetailModal
            quest={selectedQuest}
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
            onAccept={handleAcceptQuest}
        onNavigate={() => {
          if (selectedQuest) {
            handleNavigateToQuest(selectedQuest);
            setDriveMode(true);
            setDriveModeQuest(selectedQuest);
            setShowDetailModal(false);
          }
        }}
        onShowOnMap={(q) => setShowQuestOnMap(q)}
        onAbandon={(q) => {
          setAbandonQuest(q);
          setShowAbandonModal(true);
          setShowDetailModal(false);
        }}
      />

      {/* Quest Activation Modal */}
        <QuestActivationModal
          quest={activationQuest}
          visible={showActivationModal}
        playerDistance={activationDistance}
        canAccept={canAcceptActivationQuest}
        onAccept={handleAcceptQuest}
          onDismiss={() => setShowActivationModal(false)}
        />

      {/* Quest Completion Modal */}
      <QuestCompletionModal
        visible={showCompletionModal}
        quest={completionQuest}
        onClose={() => {
          setShowCompletionModal(false);
          setCompletionQuest(null);
        }}
        onAcceptRewards={handleAcceptRewards}
      />

      {/* Quest Abandon Modal */}
      <QuestAbandonModal
        visible={showAbandonModal}
        quest={abandonQuest}
        progress={abandonQuest ? getQuestProgress(
          questProgress.find(qp => qp.questId === abandonQuest.id)?.objectives || []
        ) : 0}
        onConfirm={confirmAbandonQuest}
        onCancel={() => {
          setShowAbandonModal(false);
          setAbandonQuest(null);
        }}
      />
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
    alignItems: 'center'
  },
  hudContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20
  },
  spoofControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1000
  },
  spoofButton: {
    backgroundColor: 'rgba(68, 68, 68, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#666',
    marginBottom: 8
  },
  spoofButtonActive: {
    backgroundColor: 'rgba(68, 136, 255, 0.9)',
    borderColor: '#4488ff'
  },
  spoofButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  directionControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center'
  },
  directionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4
  },
  directionButton: {
    backgroundColor: 'rgba(68, 68, 68, 0.9)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 4,
    borderWidth: 1,
    borderColor: '#666'
  },
  directionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
