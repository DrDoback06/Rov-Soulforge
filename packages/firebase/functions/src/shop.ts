import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import type { Rarity } from '@rov/types';

const db = admin.firestore();

/**
 * Pack odds configuration
 */
interface PackOdds {
  packId: string;
  cardCount: number;
  rarityOdds: Record<Rarity, number>;
  pityCounter: number; // Guaranteed rare after X packs
}

const PACK_ODDS: Record<string, PackOdds> = {
  'basic-pack': {
    packId: 'basic-pack',
    cardCount: 5,
    rarityOdds: {
      Common: 70,
      Uncommon: 20,
      Rare: 8,
      Epic: 1.8,
      Legendary: 0.2
    },
    pityCounter: 10 // Guaranteed rare every 10 packs
  },
  'premium-pack': {
    packId: 'premium-pack',
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
    packId: 'legendary-pack',
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

/**
 * Open a pack
 * HTTPS Callable function
 */
export const openPack = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { packId } = data;

  if (!packId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing packId');
  }

  const packOdds = PACK_ODDS[packId];

  if (!packOdds) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid pack type');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      // Get user's inventory
      const inventoryRef = db.collection('cardInventory').doc(context.auth!.uid);
      const inventoryDoc = await transaction.get(inventoryRef);

      if (!inventoryDoc.exists) {
        // Create inventory if doesn't exist
        transaction.set(inventoryRef, {
          uid: context.auth!.uid,
          cards: {},
          packs: {},
          pityCounters: {},
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      }

      const inventory = inventoryDoc.exists ? inventoryDoc.data() : { packs: {}, pityCounters: {} };

      // Check if user has pack
      const packCount = inventory.packs?.[packId] || 0;

      if (packCount <= 0) {
        throw new functions.https.HttpsError('failed-precondition', 'No packs available');
      }

      // Get pity counter
      const pityCounter = inventory.pityCounters?.[packId] || 0;

      // Generate cards
      const cards = generatePackCards(packOdds, pityCounter);

      // Update inventory
      const updates: any = {
        [`packs.${packId}`]: admin.firestore.FieldValue.increment(-1),
        [`pityCounters.${packId}`]: (pityCounter + 1) % packOdds.pityCounter
      };

      // Add cards to inventory
      cards.forEach(card => {
        updates[`cards.${card.cardId}`] = admin.firestore.FieldValue.increment(1);
      });

      transaction.update(inventoryRef, updates);

      return {
        cards,
        pityTriggered: pityCounter + 1 >= packOdds.pityCounter
      };
    });
  } catch (error) {
    console.error('Error opening pack:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to open pack');
  }
});

/**
 * Generate cards for pack opening
 */
function generatePackCards(
  packOdds: PackOdds,
  pityCounter: number
): Array<{ cardId: string; rarity: Rarity }> {
  const cards: Array<{ cardId: string; rarity: Rarity }> = [];

  // Check pity system
  const guaranteedRare = pityCounter + 1 >= packOdds.pityCounter;

  for (let i = 0; i < packOdds.cardCount; i++) {
    // Force rare on last card if pity triggered
    let rarity: Rarity;

    if (guaranteedRare && i === packOdds.cardCount - 1) {
      rarity = 'Rare';
    } else {
      rarity = rollRarity(packOdds.rarityOdds);
    }

    // Get random card of this rarity
    const cardId = selectRandomCard(rarity);

    cards.push({ cardId, rarity });
  }

  return cards;
}

/**
 * Roll rarity based on odds
 */
function rollRarity(odds: Record<Rarity, number>): Rarity {
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

/**
 * Select random card of given rarity
 */
function selectRandomCard(rarity: Rarity): string {
  // In full implementation, load from card database
  // For now, generate placeholder ID
  return `card_${rarity.toLowerCase()}_${Math.random().toString(36).substring(7)}`;
}

/**
 * Purchase pack with Gold
 * HTTPS Callable function
 */
export const purchasePackWithGold = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { packId, quantity } = data;

  if (!packId || !quantity || quantity < 1) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid packId or quantity');
  }

  // Pack prices
  const prices: Record<string, number> = {
    'basic-pack': 100,
    'premium-pack': 250,
    'legendary-pack': 1000
  };

  const price = prices[packId];

  if (!price) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid pack type');
  }

  const totalCost = price * quantity;

  try {
    return await db.runTransaction(async (transaction) => {
      // Get character
      const charSnapshot = await transaction.get(
        db.collection('characters')
          .where('uid', '==', context.auth!.uid)
          .limit(1)
      );

      if (charSnapshot.empty) {
        throw new functions.https.HttpsError('not-found', 'Character not found');
      }

      const charDoc = charSnapshot.docs[0];
      const char = charDoc.data();

      // Check gold
      if (char.gold < totalCost) {
        throw new functions.https.HttpsError('failed-precondition', 'Insufficient gold');
      }

      // Deduct gold
      transaction.update(charDoc.ref, {
        gold: char.gold - totalCost
      });

      // Add packs to inventory
      const inventoryRef = db.collection('cardInventory').doc(context.auth!.uid);
      const inventoryDoc = await transaction.get(inventoryRef);

      if (!inventoryDoc.exists) {
        transaction.set(inventoryRef, {
          uid: context.auth!.uid,
          cards: {},
          packs: { [packId]: quantity },
          pityCounters: {},
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      } else {
        transaction.update(inventoryRef, {
          [`packs.${packId}`]: admin.firestore.FieldValue.increment(quantity)
        });
      }

      return {
        success: true,
        packsAdded: quantity,
        goldSpent: totalCost,
        remainingGold: char.gold - totalCost
      };
    });
  } catch (error) {
    console.error('Error purchasing pack:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to purchase pack');
  }
});

/**
 * Verify IAP purchase
 * HTTPS Callable function
 */
export const verifyIAPPurchase = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { platform, receipt, productId } = data;

  if (!platform || !receipt || !productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
  }

  try {
    // Verify receipt with platform
    let verified = false;

    if (platform === 'ios') {
      verified = await verifyAppleReceipt(receipt);
    } else if (platform === 'android') {
      verified = await verifyGoogleReceipt(receipt);
    } else if (platform === 'web') {
      verified = await verifyStripePayment(receipt);
    }

    if (!verified) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid receipt');
    }

    // Check if purchase already processed
    const existingPurchase = await db.collection('purchases')
      .where('uid', '==', context.auth.uid)
      .where('receipt', '==', receipt)
      .get();

    if (!existingPurchase.empty) {
      throw new functions.https.HttpsError('already-exists', 'Purchase already processed');
    }

    // Record purchase
    const purchaseRef = db.collection('purchases').doc();

    await purchaseRef.set({
      id: purchaseRef.id,
      uid: context.auth.uid,
      platform,
      productId,
      receipt,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    // Grant product
    const product = await grantProduct(context.auth.uid, productId);

    return {
      success: true,
      product
    };
  } catch (error) {
    console.error('Error verifying IAP:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to verify purchase');
  }
});

/**
 * Verify Apple receipt
 */
async function verifyAppleReceipt(receipt: string): Promise<boolean> {
  // In full implementation, call Apple's verifyReceipt API
  // https://developer.apple.com/documentation/appstorereceipts/verifyreceipt
  return true;
}

/**
 * Verify Google receipt
 */
async function verifyGoogleReceipt(receipt: string): Promise<boolean> {
  // In full implementation, use Google Play Developer API
  // https://developers.google.com/android-publisher/api-ref/rest/v3/purchases.products/get
  return true;
}

/**
 * Verify Stripe payment
 */
async function verifyStripePayment(paymentIntentId: string): Promise<boolean> {
  // In full implementation, use Stripe API
  // https://stripe.com/docs/api/payment_intents/retrieve
  return true;
}

/**
 * Grant product to user
 */
async function grantProduct(uid: string, productId: string): Promise<any> {
  // Product mapping
  const products: Record<string, any> = {
    'gold_1000': { gold: 1000 },
    'gold_5000': { gold: 5500 }, // 10% bonus
    'gold_10000': { gold: 12000 }, // 20% bonus
    'basic_pack_5': { packs: { 'basic-pack': 5 } },
    'premium_pack_5': { packs: { 'premium-pack': 5 } },
    'legendary_pack_1': { packs: { 'legendary-pack': 1 } }
  };

  const product = products[productId];

  if (!product) {
    throw new functions.https.HttpsError('invalid-argument', 'Unknown product');
  }

  // Grant gold
  if (product.gold) {
    const charSnapshot = await db.collection('characters')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (!charSnapshot.empty) {
      await charSnapshot.docs[0].ref.update({
        gold: admin.firestore.FieldValue.increment(product.gold)
      });
    }
  }

  // Grant packs
  if (product.packs) {
    const inventoryRef = db.collection('cardInventory').doc(uid);
    const updates: any = {};

    Object.entries(product.packs).forEach(([packId, count]) => {
      updates[`packs.${packId}`] = admin.firestore.FieldValue.increment(count as number);
    });

    await inventoryRef.set(updates, { merge: true });
  }

  return product;
}