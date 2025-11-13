import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useCharacter } from '@/hooks/useCharacter';
import { DropZone } from '@/components/DropZone';
import { DraggableItem } from '@/components/DraggableItem';
import { useDragDropContext } from '@/contexts/DragDropContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Character Panel - Persistent top drop-down
 * 
 * Accessible from all screens (global UI)
 * Shows character-specific:
 * - Stats (HP, Mana, XP, Level)
 * - Equipment slots
 * - Skill tree (TODO)
 * 
 * Similar to Diablo II character screen
 */
export function CharacterPanel() {
  const { character, loading, updateCharacter } = useCharacter();
  const [isExpanded, setIsExpanded] = useState(false);
  const [panelHeight] = useState(new Animated.Value(0));

  const togglePanel = () => {
    const toValue = isExpanded ? 0 : SCREEN_HEIGHT * 0.7; // 70% of screen
    
    Animated.spring(panelHeight, {
      toValue,
      useNativeDriver: false,
      tension: 50,
      friction: 8
    }).start();
    
    setIsExpanded(!isExpanded);
  };

  if (!character) {
    return null; // No character selected
  }

  return (
    <>
      {/* Toggle Button - Always Visible */}
      <Pressable
        style={styles.toggleButton}
        onPress={togglePanel}
      >
        <LinearGradient
          colors={['#4488ff', '#2266dd']}
          style={styles.toggleButtonGradient}
        >
          <Text style={styles.toggleButtonIcon}>
            {isExpanded ? '▲' : '▼'}
          </Text>
          <Text style={styles.toggleButtonText}>
            {character.classId || 'Character'}
          </Text>
          <View style={styles.quickStats}>
            <Text style={styles.quickStatText}>❤️ {character.counters.hp}</Text>
            <Text style={styles.quickStatText}>⚡ {character.counters.mana}</Text>
            <Text style={styles.quickStatText}>Lv.{character.level}</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Drop-Down Panel */}
      <Animated.View
        style={[
          styles.panel,
          {
            height: panelHeight,
            opacity: panelHeight.interpolate({
              inputRange: [0, SCREEN_HEIGHT * 0.7],
              outputRange: [0, 1]
            })
          }
        ]}
        pointerEvents={isExpanded ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={['#1a1a2e', '#0f0f1e']}
          style={styles.panelContent}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Character Header */}
            <View style={styles.characterHeader}>
              <View style={styles.characterPortrait}>
                <Text style={styles.portraitIcon}>🧙</Text>
              </View>
              <View style={styles.characterInfo}>
                <Text style={styles.characterName}>{character.name || 'Hero'}</Text>
                <Text style={styles.characterClass}>{character.classId}</Text>
                <Text style={styles.characterLevel}>Level {character.level}</Text>
                <View style={styles.xpBar}>
                  <View style={[styles.xpBarFill, { width: `${Math.min((character.counters.xp / (character.level * 1000)) * 100, 100)}%` }]} />
                  <Text style={styles.xpText}>
                    {character.counters.xp} / {character.level * 1000} XP
                  </Text>
                </View>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>📊 Stats</Text>
              <View style={styles.statsGrid}>
                <StatBox label="HP" value={character.counters.hp} max={character.stats.maxHp} icon="❤️" color="#ff4444" />
                <StatBox label="Mana" value={character.counters.mana} max={character.stats.maxMana} icon="⚡" color="#4488ff" />
                <StatBox label="Attack" value={character.stats.atk} icon="⚔️" color="#ff9800" />
                <StatBox label="Defense" value={character.stats.def} icon="🛡️" color="#4caf50" />
                <StatBox label="Speed" value={character.stats.spd} icon="💨" color="#00bcd4" />
                <StatBox label="Lives" value={character.lives} icon="💚" color="#8bc34a" />
              </View>
            </View>

            {/* Equipment Slots */}
            <View style={styles.equipmentSection}>
              <Text style={styles.sectionTitle}>⚔️ Equipment</Text>
              <View style={styles.equipmentGrid}>
                {/* Row 1: Helm, Amulet */}
                <View style={styles.equipmentRow}>
                  <EquipmentSlot
                    slotId="head"
                    slotName="Head"
                    icon="⛑️"
                    acceptedTypes={['helmet', 'hat', 'crown']}
                    equippedItem={character.equipment?.head}
                    updateCharacter={updateCharacter}
                  />
                  <EquipmentSlot
                    slotId="amulet"
                    slotName="Amulet"
                    icon="💎"
                    acceptedTypes={['amulet', 'necklace']}
                    equippedItem={character.equipment?.amulet}
                    updateCharacter={updateCharacter}
                  />
                </View>

                {/* Row 2: Chest, Gloves */}
                <View style={styles.equipmentRow}>
                  <EquipmentSlot
                    slotId="chest"
                    slotName="Chest"
                    icon="🛡️"
                    acceptedTypes={['armor', 'robe', 'chest']}
                    equippedItem={character.equipment?.chest}
                    updateCharacter={updateCharacter}
                  />
                  <EquipmentSlot
                    slotId="gloves"
                    slotName="Gloves"
                    icon="🧤"
                    acceptedTypes={['gloves', 'gauntlets']}
                    equippedItem={character.equipment?.gloves}
                    updateCharacter={updateCharacter}
                  />
                </View>

                {/* Row 3: Main Hand, Off Hand */}
                <View style={styles.equipmentRow}>
                  <EquipmentSlot
                    slotId="mainHand"
                    slotName="Main Hand"
                    icon="⚔️"
                    acceptedTypes={['weapon', 'sword', 'axe', 'staff', 'bow', 'dagger']}
                    equippedItem={character.equipment?.mainHand}
                    updateCharacter={updateCharacter}
                  />
                  <EquipmentSlot
                    slotId="offHand"
                    slotName="Off Hand"
                    icon="🛡️"
                    acceptedTypes={['shield', 'tome', 'orb', 'dagger']}
                    equippedItem={character.equipment?.offHand}
                    updateCharacter={updateCharacter}
                  />
                </View>

                {/* Row 4: Boots, Belt */}
                <View style={styles.equipmentRow}>
                  <EquipmentSlot
                    slotId="boots"
                    slotName="Boots"
                    icon="👢"
                    acceptedTypes={['boots', 'shoes']}
                    equippedItem={character.equipment?.boots}
                    updateCharacter={updateCharacter}
                  />
                  <EquipmentSlot
                    slotId="belt"
                    slotName="Belt"
                    icon="📿"
                    acceptedTypes={['belt']}
                    equippedItem={character.equipment?.belt}
                    updateCharacter={updateCharacter}
                  />
                </View>

                {/* Row 5: Rings */}
                <View style={styles.equipmentRow}>
                  <EquipmentSlot
                    slotId="ring1"
                    slotName="Ring 1"
                    icon="💍"
                    acceptedTypes={['ring']}
                    equippedItem={character.equipment?.ring1}
                    updateCharacter={updateCharacter}
                  />
                  <EquipmentSlot
                    slotId="ring2"
                    slotName="Ring 2"
                    icon="💍"
                    acceptedTypes={['ring']}
                    equippedItem={character.equipment?.ring2}
                    updateCharacter={updateCharacter}
                  />
                </View>
              </View>
            </View>

            {/* Skill Tree Placeholder */}
            <View style={styles.skillTreeSection}>
              <Text style={styles.sectionTitle}>🌳 Skill Tree</Text>
              <View style={styles.placeholder}>
                <Text style={styles.placeholderText}>Coming Soon!</Text>
                <Text style={styles.placeholderSubtext}>
                  Unlock powerful abilities as you level up
                </Text>
              </View>
            </View>
          </ScrollView>
        </LinearGradient>
      </Animated.View>

      {/* Backdrop - Close on tap */}
      {isExpanded && (
        <Pressable
          style={styles.backdrop}
          onPress={togglePanel}
        />
      )}
    </>
  );
}

// Sub-components
function StatBox({ label, value, max, icon, color }: any) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>
        {value}{max ? `/${max}` : ''}
      </Text>
    </View>
  );
}

function EquipmentSlot({ slotId, slotName, icon, acceptedTypes, equippedItem, updateCharacter }: any) {
  const { dragState } = useDragDropContext();

  // Check if dragging and if item is compatible
  const isDragging = dragState.isDragging && dragState.itemData;
  const isCompatible = isDragging && acceptedTypes.includes(dragState.itemData.type);
  const isIncompatible = isDragging && !isCompatible;

  return (
    <DropZone
      zoneId={`equipment-${slotId}`}
      onDrop={async (itemId, itemData) => {
        // Validate item type before equipping
        if (!acceptedTypes.includes(itemData.type)) {
          console.warn(`❌ Cannot equip ${itemData.name} to ${slotName} slot. Expected types: ${acceptedTypes.join(', ')}, got: ${itemData.type}`);
          // TODO: Show error toast to user
          return;
        }

        console.log(`⚔️ Equipping ${itemData.name} (${itemData.type}) to ${slotId}`);
        try {
          // Update character equipment in Firestore using dot notation to merge
          await updateCharacter({
            [`equipped.${slotId}`]: itemId
          });
          console.log(`✅ Successfully equipped ${itemData.name} to ${slotId}`);
        } catch (error) {
          console.error('❌ Failed to equip item:', error);
          // TODO: Show error toast to user
        }
      }}
    >
      <View style={[
        styles.equipmentSlot,
        isCompatible && styles.equipmentSlotCompatible,
        isIncompatible && styles.equipmentSlotIncompatible
      ]}>
        {equippedItem ? (
          <DraggableItem
            itemId={equippedItem.id}
            itemData={equippedItem}
            onDragEnd={() => {}}
          >
            <View style={styles.equippedItem}>
              <Text style={styles.equippedItemIcon}>{equippedItem.image || icon}</Text>
            </View>
          </DraggableItem>
        ) : (
          <View style={styles.emptySlot}>
            <Text style={styles.emptySlotIcon}>{icon}</Text>
            <Text style={styles.emptySlotText}>{slotName}</Text>
          </View>
        )}
      </View>
    </DropZone>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    elevation: 10
  },
  toggleButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingTop: 50, // Account for status bar
    gap: 12
  },
  toggleButtonIcon: {
    fontSize: 16,
    color: '#ffffff'
  },
  toggleButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1
  },
  quickStats: {
    flexDirection: 'row',
    gap: 12
  },
  quickStatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  panel: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 9,
    overflow: 'hidden'
  },
  panelContent: {
    flex: 1,
    paddingTop: 80 // Below toggle button
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 998
  },
  characterHeader: {
    flexDirection: 'row',
    padding: 16,
    gap: 16
  },
  characterPortrait: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#2a2a3e',
    borderWidth: 2,
    borderColor: '#4488ff',
    justifyContent: 'center',
    alignItems: 'center'
  },
  portraitIcon: {
    fontSize: 48
  },
  characterInfo: {
    flex: 1
  },
  characterName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  characterClass: {
    fontSize: 14,
    color: '#4488ff',
    marginBottom: 2
  },
  characterLevel: {
    fontSize: 12,
    color: '#8e8e93',
    marginBottom: 8
  },
  xpBar: {
    height: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center'
  },
  xpBarFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#4caf50'
  },
  xpText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
    zIndex: 1
  },
  statsSection: {
    padding: 16,
    paddingTop: 8
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12
  },
  statBox: {
    width: (SCREEN_WIDTH - 56) / 3, // 3 per row
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a4e'
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#8e8e93',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  equipmentSection: {
    padding: 16,
    paddingTop: 8
  },
  equipmentGrid: {
    gap: 12
  },
  equipmentRow: {
    flexDirection: 'row',
    gap: 12
  },
  equipmentSlot: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    padding: 8
  },
  equipmentSlotCompatible: {
    borderColor: '#4caf50',
    backgroundColor: 'rgba(76, 175, 80, 0.1)'
  },
  equipmentSlotIncompatible: {
    borderColor: '#f44336',
    backgroundColor: 'rgba(244, 67, 54, 0.1)'
  },
  emptySlot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptySlotIcon: {
    fontSize: 32,
    opacity: 0.3,
    marginBottom: 4
  },
  emptySlotText: {
    fontSize: 10,
    color: '#8e8e93',
    textAlign: 'center'
  },
  equippedItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  equippedItemIcon: {
    fontSize: 40
  },
  skillTreeSection: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 32
  },
  placeholder: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a4e',
    borderStyle: 'dashed'
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#8e8e93',
    marginBottom: 8
  },
  placeholderSubtext: {
    fontSize: 12,
    color: '#5e5e6e',
    textAlign: 'center'
  }
});
