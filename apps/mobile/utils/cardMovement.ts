import { doc, updateDoc, arrayUnion, arrayRemove, runTransaction } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { GameCard } from '@rov/types';

/**
 * Move a card from character inventory to stash
 * Uses Firestore transaction for data consistency
 */
export async function moveCardToStash(
  characterId: string,
  cardId: string,
  cardData: GameCard
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const inventoryRef = doc(db, 'inventories', characterId);
  
  await runTransaction(db, async (transaction) => {
    const inventoryDoc = await transaction.get(inventoryRef);
    if (!inventoryDoc.exists()) {
      throw new Error('Inventory not found');
    }
    
    const inventory = inventoryDoc.data();
    const cards = inventory.cards || [];
    
    // Check if card exists in inventory
    if (!cards.includes(cardId)) {
      throw new Error('Card not found in inventory');
    }
    
    // Remove from cards array and add to stash
    transaction.update(inventoryRef, {
      cards: arrayRemove(cardId),
      stash: arrayUnion({ id: cardId, ...cardData })
    });
  });
}

/**
 * Move a card from stash back to character inventory
 * Uses Firestore transaction for data consistency
 */
export async function moveCardToInventory(
  characterId: string,
  cardId: string,
  cardData: GameCard
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const inventoryRef = doc(db, 'inventories', characterId);
  
  await runTransaction(db, async (transaction) => {
    const inventoryDoc = await transaction.get(inventoryRef);
    if (!inventoryDoc.exists()) {
      throw new Error('Inventory not found');
    }
    
    const inventory = inventoryDoc.data();
    const stash = inventory.stash || [];
    
    // Check if card exists in stash
    const cardInStash = stash.find((item: any) => item.id === cardId);
    if (!cardInStash) {
      throw new Error('Card not found in stash');
    }
    
    // Remove from stash and add to cards array
    transaction.update(inventoryRef, {
      stash: arrayRemove(cardInStash),
      cards: arrayUnion(cardId)
    });
  });
}

/**
 * Move multiple cards to stash at once
 */
export async function moveMultipleCardsToStash(
  characterId: string,
  cards: Array<{ id: string; data: GameCard }>
): Promise<void> {
  if (!db) {
    throw new Error('Firestore is not initialized');
  }

  const inventoryRef = doc(db, 'inventories', characterId);
  
  await runTransaction(db, async (transaction) => {
    const inventoryDoc = await transaction.get(inventoryRef);
    if (!inventoryDoc.exists()) {
      throw new Error('Inventory not found');
    }
    
    const inventory = inventoryDoc.data();
    let updatedCards = inventory.cards || [];
    let updatedStash = inventory.stash || [];
    
    for (const card of cards) {
      if (updatedCards.includes(card.id)) {
        updatedCards = updatedCards.filter((id: string) => id !== card.id);
        updatedStash.push({ id: card.id, ...card.data });
      }
    }
    
    transaction.update(inventoryRef, {
      cards: updatedCards,
      stash: updatedStash
    });
  });
}




