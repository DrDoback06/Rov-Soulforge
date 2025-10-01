import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import type { Rarity } from '@rov/types';

@Injectable()
export class ShopService {
  constructor(private readonly firebase: FirebaseService) {}

  async openPack(uid: string, packId: string) {
    const inventoryRef = this.firebase.doc(`cardInventory/${uid}`);
    const inventoryDoc = await inventoryRef.get();

    if (!inventoryDoc.exists) {
      throw new Error('No inventory found');
    }

    const inventory = inventoryDoc.data();
    const packCount = inventory.packs?.[packId] || 0;

    if (packCount <= 0) {
      throw new Error('No packs available');
    }

    // Get pack odds
    const packOdds = this.getPackOdds(packId);
    const pityCounter = inventory.pityCounters?.[packId] || 0;

    // Generate cards
    const cards = this.generatePackCards(packOdds, pityCounter);

    // Update inventory
    const updates: any = {
      [`packs.${packId}`]: packCount - 1,
      [`pityCounters.${packId}`]: (pityCounter + 1) % packOdds.pityCounter
    };

    cards.forEach((card) => {
      const currentCount = inventory.cards?.[card.cardId] || 0;
      updates[`cards.${card.cardId}`] = currentCount + 1;
    });

    await inventoryRef.update(updates);

    return {
      cards,
      pityTriggered: pityCounter + 1 >= packOdds.pityCounter
    };
  }

  async purchasePack(uid: string, packId: string, quantity: number) {
    const prices: Record<string, number> = {
      'basic-pack': 100,
      'premium-pack': 250,
      'legendary-pack': 1000
    };

    const price = prices[packId];

    if (!price) {
      throw new Error('Invalid pack type');
    }

    const totalCost = price * quantity;

    // Get character
    const charSnapshot = await this.firebase
      .collection('characters')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (charSnapshot.empty) {
      throw new Error('Character not found');
    }

    const charDoc = charSnapshot.docs[0];
    const char = charDoc.data();

    if (char.gold < totalCost) {
      throw new Error('Insufficient gold');
    }

    // Deduct gold
    await charDoc.ref.update({
      gold: char.gold - totalCost
    });

    // Add packs
    const inventoryRef = this.firebase.doc(`cardInventory/${uid}`);
    const inventoryDoc = await inventoryRef.get();

    if (!inventoryDoc.exists) {
      await inventoryRef.set({
        uid,
        cards: {},
        packs: { [packId]: quantity },
        pityCounters: {}
      });
    } else {
      const currentPacks = inventoryDoc.data()?.packs?.[packId] || 0;
      await inventoryRef.update({
        [`packs.${packId}`]: currentPacks + quantity
      });
    }

    return {
      success: true,
      packsAdded: quantity,
      goldSpent: totalCost,
      remainingGold: char.gold - totalCost
    };
  }

  async getInventory(uid: string) {
    const inventoryDoc = await this.firebase.doc(`cardInventory/${uid}`).get();

    if (!inventoryDoc.exists) {
      return { cards: {}, packs: {}, pityCounters: {} };
    }

    return inventoryDoc.data();
  }

  private getPackOdds(packId: string) {
    const odds: Record<string, any> = {
      'basic-pack': {
        cardCount: 5,
        rarityOdds: {
          Common: 70,
          Uncommon: 20,
          Rare: 8,
          Epic: 1.8,
          Legendary: 0.2
        },
        pityCounter: 10
      },
      'premium-pack': {
        cardCount: 5,
        rarityOdds: {
          Common: 50,
          Uncommon: 30,
          Rare: 15,
          Epic: 4,
          Legendary: 1
        },
        pityCounter: 5
      },
      'legendary-pack': {
        cardCount: 3,
        rarityOdds: {
          Common: 0,
          Uncommon: 20,
          Rare: 40,
          Epic: 30,
          Legendary: 10
        },
        pityCounter: 3
      }
    };

    return odds[packId] || odds['basic-pack'];
  }

  private generatePackCards(packOdds: any, pityCounter: number) {
    const cards: Array<{ cardId: string; rarity: Rarity }> = [];
    const guaranteedRare = pityCounter + 1 >= packOdds.pityCounter;

    for (let i = 0; i < packOdds.cardCount; i++) {
      let rarity: Rarity;

      if (guaranteedRare && i === packOdds.cardCount - 1) {
        rarity = 'Rare';
      } else {
        rarity = this.rollRarity(packOdds.rarityOdds);
      }

      const cardId = `card_${rarity.toLowerCase()}_${Math.random().toString(36).substring(7)}`;

      cards.push({ cardId, rarity });
    }

    return cards;
  }

  private rollRarity(odds: Record<Rarity, number>): Rarity {
    const total = Object.values(odds).reduce((sum, val) => sum + val, 0);
    const roll = Math.random() * total;

    let cumulative = 0;
    const rarities: Rarity[] = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];

    for (const rarity of rarities) {
      cumulative += odds[rarity];
      if (roll <= cumulative) {
        return rarity;
      }
    }

    return 'Common';
  }
}