import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFirebase } from '@/lib/firebase-context';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { DraggableItem } from '@/components/DraggableItem';
import { DropZone } from '@/components/DropZone';

/**
 * Stash Tab - Account-wide item storage
 * 
 * Features:
 * - 4 tabs: Equipment, Consumables, Materials, Misc
 * - 200 slots per tab
 * - Drag-and-drop to organize
 * - Shared across all characters
 */

type StashTab = 'equipment' | 'consumables' | 'materials' | 'misc';

const STASH_CAPACITY = 200;

export default function StashScreen() {
  const { user, db } = useFirebase();
  const [activeTab, setActiveTab] = useState<StashTab>('equipment');
  const [stashData, setStashData] = useState<Record<StashTab, any[]>>({
    equipment: [],
    consumables: [],
    materials: [],
    misc: []
  });
  const [loading, setLoading] = useState(true);

  // Load stash data
  useEffect(() => {
    if (!user || !db) return;

    const loadStash = async () => {
      try {
        const stashRef = doc(db, 'stashes', user.uid);
        const stashSnap = await getDoc(stashRef);
        
        if (stashSnap.exists()) {
          setStashData(stashSnap.data() as any);
        }
      } catch (error) {
        console.error('Error loading stash:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStash();
  }, [user, db]);

  // Save stash data
  const saveStash = async (newData: Record<StashTab, any[]>) => {
    if (!user || !db) return;

    try {
      const stashRef = doc(db, 'stashes', user.uid);
      await setDoc(stashRef, newData);
      setStashData(newData);
    } catch (error) {
      console.error('Error saving stash:', error);
      Alert.alert('Error', 'Failed to save stash');
    }
  };

  // Handle item drop (rearrange)
  const handleItemDrop = (slotIndex: number) => (itemId: string, itemData: any) => {
    console.log('📦 Drop on slot:', slotIndex, itemData);
    
    const currentTabItems = [...stashData[activeTab]];
    
    // Find source index
    const sourceIndex = currentTabItems.findIndex(item => item?.id === itemId);
    
    if (sourceIndex === -1) {
      // New item from elsewhere
      currentTabItems[slotIndex] = itemData;
    } else {
      // Rearrange within stash
      const [movedItem] = currentTabItems.splice(sourceIndex, 1);
      currentTabItems.splice(slotIndex, 0, movedItem);
    }
    
    const newData = { ...stashData, [activeTab]: currentTabItems };
    saveStash(newData);
  };

  // Seed test items
  const seedTestItems = async () => {
    const testItems = [
      { id: 'helmet1', name: 'Iron Helmet', type: 'helmet', rarity: 'Common', icon: '⛑️', cardId: 'card_helmet_iron' },
      { id: 'sword1', name: 'Steel Sword', type: 'sword', rarity: 'Uncommon', icon: '⚔️', cardId: 'card_sword_steel' },
      { id: 'shield1', name: 'Wooden Shield', type: 'shield', rarity: 'Common', icon: '🛡️', cardId: 'card_shield_wood' },
      { id: 'armor1', name: 'Leather Armor', type: 'armor', rarity: 'Common', icon: '🦺', cardId: 'card_armor_leather' },
      { id: 'boots1', name: 'Travelers Boots', type: 'boots', rarity: 'Uncommon', icon: '👢', cardId: 'card_boots_travel' },
      { id: 'gloves1', name: 'Silk Gloves', type: 'gloves', rarity: 'Rare', icon: '🧤', cardId: 'card_gloves_silk' },
      { id: 'ring1', name: 'Gold Ring', type: 'ring', rarity: 'Epic', icon: '💍', cardId: 'card_ring_gold' },
      { id: 'ring2', name: 'Silver Ring', type: 'ring', rarity: 'Uncommon', icon: '💍', cardId: 'card_ring_silver' },
      { id: 'amulet1', name: 'Ruby Amulet', type: 'amulet', rarity: 'Legendary', icon: '📿', cardId: 'card_amulet_ruby' },
      { id: 'belt1', name: 'Leather Belt', type: 'belt', rarity: 'Common', icon: '🎗️', cardId: 'card_belt_leather' },
      { id: 'crown1', name: 'Golden Crown', type: 'helmet', rarity: 'Legendary', icon: '👑', cardId: 'card_crown_gold' }
    ];

    const newData = {
      ...stashData,
      equipment: testItems
    };

    await saveStash(newData);
    Alert.alert('Success', `Added ${testItems.length} test items to equipment tab`);
  };

  const currentTabItems = stashData[activeTab];
  const itemCount = currentTabItems.filter(item => item).length;

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <Text style={styles.loadingText}>Loading stash...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Account Stash</Text>
        <Text style={styles.capacity}>
          {itemCount}/{STASH_CAPACITY}
        </Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(['equipment', 'consumables', 'materials', 'misc'] as StashTab[]).map(tab => (
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

      {/* Seed Button (Equipment tab only) */}
      {activeTab === 'equipment' && (
        <Pressable style={styles.seedButton} onPress={seedTestItems}>
          <Text style={styles.seedButtonText}>Seed Test Items</Text>
        </Pressable>
      )}

      {/* Item Grid */}
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.grid}>
        {Array.from({ length: STASH_CAPACITY }).map((_, index) => {
          const item = currentTabItems[index];
          
          return (
            <DropZone
              key={`slot-${index}`}
              zoneId={`stash-${activeTab}-${index}`}
              onItemDrop={handleItemDrop(index)}
              style={styles.slot}
            >
              {item ? (
                <DraggableItem
                  itemId={item.id}
                  itemData={item}
                  sourceId={`stash-${activeTab}-${index}`}
                >
                  <View style={styles.itemCard}>
                    <Text style={styles.itemIcon}>{item.icon}</Text>
                    <Text style={styles.itemName} numberOfLines={1}>
                      {item.name}
                    </Text>
                  </View>
                </DraggableItem>
              ) : (
                <View style={styles.emptySlot}>
                  <Text style={styles.emptySlotText}>—</Text>
                </View>
              )}
            </DropZone>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff'
  },
  capacity: {
    fontSize: 18,
    color: '#4488ff',
    fontWeight: '600'
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent'
  },
  tabActive: {
    borderBottomColor: '#4488ff'
  },
  tabText: {
    color: '#8e8e93',
    fontSize: 14,
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#4488ff'
  },
  seedButton: {
    backgroundColor: '#4488ff',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  seedButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 100
  },
  slot: {
    width: '18%',
    aspectRatio: 1,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden'
  },
  itemCard: {
    flex: 1,
    backgroundColor: '#2a2a3e',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#3a3a4e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4
  },
  itemIcon: {
    fontSize: 24,
    marginBottom: 2
  },
  itemName: {
    color: '#fff',
    fontSize: 8,
    textAlign: 'center'
  },
  emptySlot: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2a2a3e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptySlotText: {
    color: '#4a4a5e',
    fontSize: 20
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 100
  }
});

