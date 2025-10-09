import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Image } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';

interface HeroPanelProps {
  character: any; // Character data from Firebase
}

export function HeroPanel({ character }: HeroPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'skills' | 'equipment' | 'inventory'>('stats');

  const panelHeight = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: panelHeight.value,
      opacity: withTiming(isOpen ? 1 : 0, { duration: 200 })
    };
  });

  function togglePanel() {
    setIsOpen(!isOpen);
    panelHeight.value = withSpring(isOpen ? 0 : 600, {
      damping: 20,
      stiffness: 90
    });
  }

  if (!character) return null;

  return (
    <>
      {/* Pull-down tab button */}
      <Pressable
        style={styles.pullTab}
        onPress={togglePanel}
      >
        <View style={styles.pullTabInner}>
          <Text style={styles.pullTabIcon}>{isOpen ? '▲' : '▼'}</Text>
          <Text style={styles.pullTabText}>
            {character.name} • Lv {character.level}
          </Text>
          <View style={styles.healthBar}>
            <View
              style={[
                styles.healthBarFill,
                { width: `${(character.currentHealth / character.maxHealth) * 100}%` }
              ]}
            />
          </View>
        </View>
      </Pressable>

      {/* Hero panel */}
      <Animated.View style={[styles.panel, animatedStyle]}>
        <View style={styles.panelHeader}>
          <View style={styles.characterInfo}>
            <View style={styles.characterAvatar}>
              <Text style={styles.avatarText}>
                {character.class === 'warrior' && '⚔️'}
                {character.class === 'mage' && '🔮'}
                {character.class === 'ranger' && '🏹'}
              </Text>
            </View>
            <View style={styles.characterDetails}>
              <Text style={styles.characterName}>{character.name}</Text>
              <Text style={styles.characterClass}>
                Level {character.level} {character.class}
              </Text>
            </View>
          </View>

          {/* Tab navigation */}
          <View style={styles.tabBar}>
            <TabButton
              label="Stats"
              icon="📊"
              active={activeTab === 'stats'}
              onPress={() => setActiveTab('stats')}
            />
            <TabButton
              label="Skills"
              icon="⚡"
              active={activeTab === 'skills'}
              onPress={() => setActiveTab('skills')}
            />
            <TabButton
              label="Equipment"
              icon="🛡️"
              active={activeTab === 'equipment'}
              onPress={() => setActiveTab('equipment')}
            />
            <TabButton
              label="Inventory"
              icon="🎒"
              active={activeTab === 'inventory'}
              onPress={() => setActiveTab('inventory')}
            />
          </View>
        </View>

        <ScrollView style={styles.panelContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'stats' && <StatsTab character={character} />}
          {activeTab === 'skills' && <SkillsTab character={character} />}
          {activeTab === 'equipment' && <EquipmentTab character={character} />}
          {activeTab === 'inventory' && <InventoryTab character={character} />}
        </ScrollView>
      </Animated.View>
    </>
  );
}

function TabButton({
  label,
  icon,
  active,
  onPress
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tabButton, active && styles.tabButtonActive]}
      onPress={onPress}
    >
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function StatsTab({ character }: { character: any }) {
  const stats = [
    { label: 'Strength', value: character.stats?.strength || 10, icon: '💪' },
    { label: 'Dexterity', value: character.stats?.dexterity || 10, icon: '🎯' },
    { label: 'Intelligence', value: character.stats?.intelligence || 10, icon: '🧠' },
    { label: 'Vitality', value: character.stats?.vitality || 10, icon: '❤️' },
    { label: 'Luck', value: character.stats?.luck || 10, icon: '🍀' }
  ];

  return (
    <View style={styles.tabContent}>
      <View style={styles.statSection}>
        <Text style={styles.sectionTitle}>Core Stats</Text>
        {stats.map((stat, index) => (
          <View key={index} style={styles.statRow}>
            <Text style={styles.statIcon}>{stat.icon}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
            <View style={styles.statBar}>
              <View
                style={[
                  styles.statBarFill,
                  { width: `${(stat.value / 100) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.statSection}>
        <Text style={styles.sectionTitle}>Combat Stats</Text>
        <StatDisplay label="Health" value={character.maxHealth || 100} max={character.maxHealth || 100} color="#e74c3c" />
        <StatDisplay label="Mana" value={character.maxMana || 50} max={character.maxMana || 50} color="#3498db" />
        <StatDisplay label="Attack Power" value={character.attackPower || 25} color="#f39c12" />
        <StatDisplay label="Defense" value={character.defense || 15} color="#95a5a6" />
      </View>
    </View>
  );
}

function StatDisplay({
  label,
  value,
  max,
  color
}: {
  label: string;
  value: number;
  max?: number;
  color?: string;
}) {
  return (
    <View style={styles.statDisplay}>
      <Text style={styles.statDisplayLabel}>{label}</Text>
      {max ? (
        <View style={styles.statDisplayBar}>
          <View
            style={[
              styles.statDisplayBarFill,
              { width: `${(value / max) * 100}%`, backgroundColor: color }
            ]}
          />
          <Text style={styles.statDisplayText}>{value} / {max}</Text>
        </View>
      ) : (
        <Text style={[styles.statDisplayValue, { color }]}>{value}</Text>
      )}
    </View>
  );
}

function SkillsTab({ character }: { character: any }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Skill Tree</Text>
      <Text style={styles.comingSoonText}>🌳 Skill tree coming soon...</Text>
      <Text style={styles.comingSoonSubtext}>
        Unlock powerful abilities as you level up
      </Text>
    </View>
  );
}

function EquipmentTab({ character }: { character: any }) {
  const slots = [
    { name: 'Helmet', icon: '⛑️', position: 'top' },
    { name: 'Armor', icon: '🛡️', position: 'middle' },
    { name: 'Weapon', icon: '⚔️', position: 'left' },
    { name: 'Shield', icon: '🛡️', position: 'right' },
    { name: 'Boots', icon: '👢', position: 'bottom' },
    { name: 'Ring', icon: '💍', position: 'bottom-left' },
    { name: 'Amulet', icon: '📿', position: 'bottom-right' }
  ];

  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Equipment Slots</Text>
      <View style={styles.equipmentGrid}>
        {slots.map((slot, index) => (
          <View key={index} style={styles.equipmentSlot}>
            <Text style={styles.equipmentIcon}>{slot.icon}</Text>
            <Text style={styles.equipmentLabel}>{slot.name}</Text>
            <View style={styles.equipmentSlotEmpty}>
              <Text style={styles.equipmentSlotText}>Empty</Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function InventoryTab({ character }: { character: any }) {
  return (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Inventory</Text>
      <View style={styles.inventoryGrid}>
        {Array.from({ length: 24 }).map((_, index) => (
          <View key={index} style={styles.inventorySlot}>
            <Text style={styles.inventorySlotText}>•</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pullTab: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    backgroundColor: 'rgba(26, 26, 46, 0.95)',
    borderBottomWidth: 2,
    borderBottomColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  pullTabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12
  },
  pullTabIcon: {
    fontSize: 16,
    color: '#FFD700'
  },
  pullTabText: {
    flex: 1,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF'
  },
  healthBar: {
    width: 120,
    height: 8,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    borderRadius: 4,
    overflow: 'hidden'
  },
  healthBarFill: {
    height: '100%',
    backgroundColor: '#e74c3c',
    borderRadius: 4
  },
  panel: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 15, 30, 0.98)',
    borderBottomWidth: 3,
    borderBottomColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    zIndex: 998,
    overflow: 'hidden'
  },
  panelHeader: {
    padding: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255, 215, 0, 0.3)'
  },
  characterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  characterAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderWidth: 2,
    borderColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  avatarText: {
    fontSize: 32
  },
  characterDetails: {
    flex: 1
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 4
  },
  characterClass: {
    fontSize: 14,
    color: '#CCCCCC',
    textTransform: 'capitalize'
  },
  tabBar: {
    flexDirection: 'row',
    gap: 8
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    gap: 6
  },
  tabButtonActive: {
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD700'
  },
  tabIcon: {
    fontSize: 16
  },
  tabLabel: {
    fontSize: 12,
    color: '#999999',
    fontWeight: '600'
  },
  tabLabelActive: {
    color: '#FFD700'
  },
  panelContent: {
    flex: 1
  },
  tabContent: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  statSection: {
    marginBottom: 24
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10
  },
  statIcon: {
    fontSize: 20
  },
  statLabel: {
    width: 100,
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500'
  },
  statBar: {
    flex: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden'
  },
  statBarFill: {
    height: '100%',
    backgroundColor: '#3498db',
    borderRadius: 6
  },
  statValue: {
    width: 40,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'right'
  },
  statDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statDisplayLabel: {
    fontSize: 14,
    color: '#CCCCCC',
    fontWeight: '500',
    width: 120
  },
  statDisplayBar: {
    flex: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative'
  },
  statDisplayBarFill: {
    height: '100%',
    borderRadius: 10
  },
  statDisplayText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 20,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: 'bold'
  },
  statDisplayValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  comingSoonText: {
    fontSize: 18,
    color: '#999999',
    textAlign: 'center',
    marginTop: 40
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 8
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  equipmentSlot: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center'
  },
  equipmentIcon: {
    fontSize: 32,
    marginBottom: 4
  },
  equipmentLabel: {
    fontSize: 10,
    color: '#FFD700',
    fontWeight: '600',
    marginBottom: 4
  },
  equipmentSlotEmpty: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4
  },
  equipmentSlotText: {
    fontSize: 9,
    color: '#666666'
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  inventorySlot: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  inventorySlotText: {
    fontSize: 24,
    color: '#333333'
  }
});
