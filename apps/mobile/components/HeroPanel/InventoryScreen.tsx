import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Character } from '@rov/types';

interface InventoryScreenProps {
  character: Character | null;
  loading?: boolean;
}

/**
 * Inventory Screen
 * 
 * Features:
 * - Equipment slots (type-restricted)
 * - Universal inventory slots (40 total)
 * - Drag-and-drop support
 * - Diablo II-style item interaction (hover for stats)
 * - Stash integration (can drag to/from stash while open)
 */
export function InventoryScreen({ character, loading }: InventoryScreenProps) {
  if (loading || !character) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading inventory...</Text>
      </View>
    );
  }

  // Equipment slots
  const equipmentSlots = [
    { id: 'helmet', label: 'Helmet', icon: '🪖', type: 'helmet' },
    { id: 'amulet', label: 'Amulet', icon: '📿', type: 'amulet' },
    { id: 'weapon', label: 'Weapon', icon: '⚔️', type: 'weapon' },
    { id: 'armor', label: 'Armor', icon: '🛡️', type: 'armor' },
    { id: 'ring1', label: 'Ring', icon: '💍', type: 'ring' },
    { id: 'ring2', label: 'Ring', icon: '💍', type: 'ring' },
    { id: 'belt', label: 'Belt', icon: '🎗️', type: 'belt' },
    { id: 'gloves', label: 'Gloves', icon: '🧤', type: 'gloves' },
    { id: 'boots', label: 'Boots', icon: '🥾', type: 'boots' },
  ];

  // Create 40 inventory slots
  const inventorySlots = Array.from({ length: 40 }, (_, i) => ({
    id: `inv-${i}`,
    item: character.inventory[i] || null
  }));

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={['#2a1810', '#1a1a2e']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Inventory & Equipment</Text>
      </LinearGradient>

      {/* Equipment Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipment</Text>
        
        <View style={styles.equipmentGrid}>
          {equipmentSlots.map(slot => {
            const equipped = character.equipped[slot.id as keyof typeof character.equipped];
            
            return (
              <Pressable
                key={slot.id}
                style={styles.equipmentSlot}
                onPress={() => {
                  // TODO: Show item details or allow drag
                  console.log('Equipment slot pressed:', slot.id);
                }}
              >
                <LinearGradient
                  colors={equipped ? ['#2a2a3e', '#1a1a2e'] : ['#1a1a1f', '#0a0a0f']}
                  style={styles.equipmentSlotInner}
                >
                  {equipped ? (
                    <View>
                      <Text style={styles.equipmentIcon}>{slot.icon}</Text>
                      <Text style={styles.equipmentLabel}>{slot.label}</Text>
                      <View style={styles.itemIndicator} />
                    </View>
                  ) : (
                    <View style={styles.emptySlot}>
                      <Text style={styles.emptySlotIcon}>{slot.icon}</Text>
                      <Text style={styles.emptySlotLabel}>{slot.label}</Text>
                    </View>
                  )}
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Inventory Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Inventory (40 Slots)</Text>
        
        <View style={styles.inventoryGrid}>
          {inventorySlots.map((slot, index) => (
            <Pressable
              key={slot.id}
              style={styles.inventorySlot}
              onPress={() => {
                // TODO: Show item details or allow drag
                console.log('Inventory slot pressed:', index);
              }}
            >
              <LinearGradient
                colors={slot.item ? ['#2a2a3e', '#1a1a2e'] : ['#1a1a1f', '#0a0a0f']}
                style={styles.inventorySlotInner}
              >
                {slot.item ? (
                  <View style={styles.itemContainer}>
                    <Text style={styles.itemIcon}>🎴</Text>
                    <View style={styles.itemIndicator} />
                  </View>
                ) : (
                  <View style={styles.emptyInventorySlot}>
                    <Text style={styles.emptyInventorySlotLabel}>{index + 1}</Text>
                  </View>
                )}
              </LinearGradient>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionsTitle}>📝 How to Use:</Text>
        <Text style={styles.instructionsText}>• Drag items from your Stash to equip them</Text>
        <Text style={styles.instructionsText}>• Equipment slots are type-restricted</Text>
        <Text style={styles.instructionsText}>• Inventory slots are universal</Text>
        <Text style={styles.instructionsText}>• Drag items anywhere to sort your inventory</Text>
        <Text style={styles.instructionsText}>• Hover over items to see their stats</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f'
  },
  content: {
    padding: 16
  },
  loadingText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40
  },
  header: {
    padding: 20,
    borderRadius: 8,
    marginBottom: 16
  },
  headerTitle: {
    color: '#ffd700',
    fontSize: 20,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 2,
    textAlign: 'center'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    color: '#ffd700',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12
  },
  equipmentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  equipmentSlot: {
    width: '31%'
  },
  equipmentSlotInner: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2a2a3e',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  equipmentIcon: {
    fontSize: 32,
    textAlign: 'center'
  },
  equipmentLabel: {
    color: '#fff',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4
  },
  emptySlot: {
    alignItems: 'center'
  },
  emptySlotIcon: {
    fontSize: 32,
    opacity: 0.3
  },
  emptySlotLabel: {
    color: '#666',
    fontSize: 10,
    marginTop: 4
  },
  itemIndicator: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4a9eff'
  },
  inventoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4
  },
  inventorySlot: {
    width: '18%'
  },
  inventorySlotInner: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemContainer: {
    position: 'relative',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center'
  },
  itemIcon: {
    fontSize: 24
  },
  emptyInventorySlot: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyInventorySlotLabel: {
    color: '#333',
    fontSize: 10
  },
  instructions: {
    backgroundColor: '#1a1a2e',
    padding: 16,
    borderRadius: 8,
    marginTop: 8
  },
  instructionsTitle: {
    color: '#ffd700',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8
  },
  instructionsText: {
    color: '#aaa',
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 18
  }
});

