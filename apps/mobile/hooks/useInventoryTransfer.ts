import { useCallback } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from './useAuth';

/**
 * Hook for transferring items between inventory and stash
 */
export function useInventoryTransfer() {
  const { db } = useFirebase();
  const { user } = useAuth();

  /**
   * Transfer card from inventory to stash
   */
  const transferToStash = useCallback(async (
    cardId: string,
    targetTab: 'equipment' | 'consumables' | 'materials' | 'misc',
    cardData: any
  ) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    console.log('📦 [Transfer] Moving card to stash:', { cardId, targetTab });

    try {
      // 1. Get current inventory
      const inventoryRef = doc(db, 'inventories', user.uid);
      const inventorySnap = await getDoc(inventoryRef);

      if (!inventorySnap.exists()) {
        throw new Error('Inventory not found');
      }

      const inventoryData = inventorySnap.data();
      const currentCards = inventoryData.cards || {};

      // Check if card exists in inventory
      if (!currentCards[cardId] || currentCards[cardId] <= 0) {
        throw new Error('Card not found in inventory');
      }

      // 2. Get current stash
      const stashRef = doc(db, 'stashes', user.uid);
      const stashSnap = await getDoc(stashRef);

      if (!stashSnap.exists()) {
        throw new Error('Stash not found');
      }

      const stashData = stashSnap.data();
      const currentTabItems = stashData[targetTab] || [];

      // Check stash capacity
      if (currentTabItems.length >= 40) {
        throw new Error('Stash tab is full (40/40 items)');
      }

      // 3. Remove one card from inventory
      const updatedCards = { ...currentCards };
      updatedCards[cardId] = currentCards[cardId] - 1;

      // If count reaches 0, remove the key
      if (updatedCards[cardId] === 0) {
        delete updatedCards[cardId];
      }

      // 4. Add card to stash
      const updatedTabItems = [
        ...currentTabItems,
        {
          id: cardId,
          ...cardData,
          storedAt: new Date().toISOString(),
        },
      ];

      // 5. Update both collections
      await updateDoc(inventoryRef, {
        cards: updatedCards,
      });

      await updateDoc(stashRef, {
        [targetTab]: updatedTabItems,
      });

      console.log('✅ [Transfer] Card transferred successfully');

      return {
        success: true,
        message: `${cardData.name} moved to stash`,
      };
    } catch (error: any) {
      console.error('❌ [Transfer] Error transferring card:', error);
      throw error;
    }
  }, [user, db]);

  /**
   * Transfer card from stash to inventory
   */
  const transferToInventory = useCallback(async (
    cardId: string,
    sourceTab: 'equipment' | 'consumables' | 'materials' | 'misc',
    slotIndex: number
  ) => {
    if (!user?.uid) {
      throw new Error('User not authenticated');
    }

    console.log('🎒 [Transfer] Moving card to inventory:', { cardId, sourceTab, slotIndex });

    try {
      // 1. Get current stash
      const stashRef = doc(db, 'stashes', user.uid);
      const stashSnap = await getDoc(stashRef);

      if (!stashSnap.exists()) {
        throw new Error('Stash not found');
      }

      const stashData = stashSnap.data();
      const currentTabItems = stashData[sourceTab] || [];

      // Check if item exists at slot
      if (slotIndex >= currentTabItems.length) {
        throw new Error('Item not found at slot');
      }

      const itemToTransfer = currentTabItems[slotIndex];

      // 2. Get current inventory
      const inventoryRef = doc(db, 'inventories', user.uid);
      const inventorySnap = await getDoc(inventoryRef);

      if (!inventorySnap.exists()) {
        throw new Error('Inventory not found');
      }

      const inventoryData = inventorySnap.data();
      const currentCards = inventoryData.cards || {};

      // 3. Add card to inventory (increment count)
      const updatedCards = { ...currentCards };
      updatedCards[cardId] = (currentCards[cardId] || 0) + 1;

      // 4. Remove card from stash
      const updatedTabItems = currentTabItems.filter((_: any, index: number) => index !== slotIndex);

      // 5. Update both collections
      await updateDoc(inventoryRef, {
        cards: updatedCards,
      });

      await updateDoc(stashRef, {
        [sourceTab]: updatedTabItems,
      });

      console.log('✅ [Transfer] Card transferred successfully');

      return {
        success: true,
        message: `${itemToTransfer.name} moved to inventory`,
      };
    } catch (error: any) {
      console.error('❌ [Transfer] Error transferring card:', error);
      throw error;
    }
  }, [user, db]);

  return {
    transferToStash,
    transferToInventory,
  };
}
