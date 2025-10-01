import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { HeroPullDown } from '@/components/HeroPullDown';

/**
 * Tab layout with Hero Pull-Down overlay
 */
export default function TabLayout() {
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

      {/* Hero Pull-Down overlay - always visible */}
      <HeroPullDown />
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