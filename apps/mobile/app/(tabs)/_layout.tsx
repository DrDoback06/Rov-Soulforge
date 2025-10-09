import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { usePanelManagerContext } from '@/contexts/PanelManagerContext';
import { HeroPanelContainer } from '@/components/HeroPanel/HeroPanelContainer';
import { PanelToggles } from '@/components/PanelToggles';
import { DragOverlay } from '@/components/DragOverlay';

const SCREEN_WIDTH = Dimensions.get('window').width;
const PANEL_WIDTH = Math.min(SCREEN_WIDTH * 0.4, 500); // 40% max 500px

/**
 * Tab layout with global panel management
 * 
 * Features:
 * - Quest Panel (managed from map screen)
 * - Hero Panel (stats, equipment, skills)
 * - Panel toggle buttons (accessible across all tabs)
 * - Drag overlay for card/quest drag-and-drop
 * - Mutual exclusion (only one panel open at a time)
 */
export default function TabLayout() {
  const {
    isQuestPanelOpen,
    isHeroPanelOpen,
    toggleQuestPanel,
    toggleHeroPanel,
    closeAllPanels
  } = usePanelManagerContext();

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: '#ffd700',
          tabBarInactiveTintColor: '#8e8e93',
          tabBarShowLabel: true
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />
          }}
        />
        <Tabs.Screen
          name="quests"
          options={{
            title: 'Quests',
            tabBarIcon: ({ color }) => <TabIcon name="quest" color={color} />
          }}
        />
        <Tabs.Screen
          name="inventory"
          options={{
            title: 'Cards',
            tabBarIcon: ({ color }) => <TabIcon name="cards" color={color} />
          }}
        />
        <Tabs.Screen
          name="stash"
          options={{
            title: 'Stash',
            tabBarIcon: ({ color }) => <TabIcon name="stash" color={color} />
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: 'Shop',
            tabBarIcon: ({ color }) => <TabIcon name="shop" color={color} />
          }}
        />
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Ranks',
            tabBarIcon: ({ color }) => <TabIcon name="leaderboard" color={color} />
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <TabIcon name="profile" color={color} />
          }}
        />
        <Tabs.Screen
          name="companion"
          options={{
            title: 'Companion',
            tabBarIcon: ({ color }) => <TabIcon name="companion" color={color} />
          }}
        />
      </Tabs>

      {/* Hero Panel - accessible from all tabs */}
      <HeroPanelContainer
        isOpen={isHeroPanelOpen}
        onClose={closeAllPanels}
        panelWidth={PANEL_WIDTH}
      />

      {/* Panel Toggle Buttons - accessible from all tabs */}
      <PanelToggles
        onQuestPress={toggleQuestPanel}
        onHeroPress={toggleHeroPanel}
        questPanelOpen={isQuestPanelOpen}
        heroPanelOpen={isHeroPanelOpen}
      />

      {/* Drag Overlay - shows dragged items */}
      <DragOverlay />
    </View>
  );
}

/**
 * Placeholder tab icon
 */
function TabIcon({ name, color }: { name: string; color: string }) {
  const icons: Record<string, string> = {
    map: '🗺️',
    quest: '⚔️',
    cards: '🎴',
    stash: '📦',
    shop: '🏪',
    leaderboard: '🏆',
    profile: '👤',
    companion: '🤖'
  };

  return (
    <Text style={{ fontSize: 24 }}>{icons[name]}</Text>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f0f1e',
    borderTopColor: '#2a2a3e',
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8
  }
});