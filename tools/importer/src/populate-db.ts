#!/usr/bin/env node
/**
 * Database Population Script
 *
 * Imports parsed card data into Firebase Firestore
 * Usage: pnpm run import:cards
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { parseCardFile } from './parser';
import type { CardDef } from '@rov/types';

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(process.cwd(), 'service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * Import cards to Firestore
 */
async function importCards(cards: CardDef[]) {
  const batch = db.batch();
  let count = 0;

  for (const card of cards) {
    const docRef = db.collection('cards').doc(card.id);
    batch.set(docRef, card);
    count++;

    // Commit in batches of 500 (Firestore limit)
    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Imported ${count} cards...`);
    }
  }

  // Commit remaining
  await batch.commit();
  console.log(`✅ Imported ${count} cards total`);
}

/**
 * Import quest definitions
 */
async function importQuests(quests: any[]) {
  const batch = db.batch();
  let count = 0;

  for (const quest of quests) {
    const docRef = db.collection('questDefinitions').doc(quest.id);
    batch.set(docRef, quest);
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Imported ${count} quests...`);
    }
  }

  await batch.commit();
  console.log(`✅ Imported ${count} quests total`);
}

/**
 * Create card collections metadata
 */
async function createCollectionMetadata() {
  const cardsSnapshot = await db.collection('cards').get();

  const deckCounts: Record<string, number> = {
    Action: 0,
    Skill: 0,
    Loot: 0
  };

  const rarityCounts: Record<string, number> = {
    Common: 0,
    Uncommon: 0,
    Rare: 0,
    Epic: 0,
    Legendary: 0
  };

  const alignmentCounts: Record<string, number> = {
    Holy: 0,
    Chaos: 0,
    Arcane: 0,
    Neutral: 0
  };

  cardsSnapshot.forEach(doc => {
    const card = doc.data() as CardDef;
    deckCounts[card.deck] = (deckCounts[card.deck] || 0) + 1;
    rarityCounts[card.rarity] = (rarityCounts[card.rarity] || 0) + 1;
    alignmentCounts[card.alignment] = (alignmentCounts[card.alignment] || 0) + 1;
  });

  await db.collection('metadata').doc('cardCollections').set({
    totalCards: cardsSnapshot.size,
    deckCounts,
    rarityCounts,
    alignmentCounts,
    lastUpdated: new Date().toISOString()
  });

  console.log('✅ Created collection metadata');
}

/**
 * Main import process
 */
async function main() {
  console.log('🚀 Starting database import...\n');

  try {
    // Parse card files
    console.log('📖 Parsing card files...');
    const cardDataPath = join(process.cwd(), '..', '..', 'cardgamedata');

    const allCards: CardDef[] = [];

    // Action Deck
    console.log('  - Parsing Action Deck...');
    const actionCards = parseCardFile(join(cardDataPath, '1. Action Deck Complete 21-09-25.txt'));
    allCards.push(...actionCards);

    // Skill Deck
    console.log('  - Parsing Skill Deck...');
    const skillCards = parseCardFile(join(cardDataPath, '2. Skill Deck Complete 21-09-25.txt'));
    allCards.push(...skillCards);

    // Loot Deck
    console.log('  - Parsing Loot Deck...');
    const lootCards = parseCardFile(join(cardDataPath, '3. Loot Deck Complete 21-09-25.txt'));
    allCards.push(...lootCards);

    console.log(`\n📦 Parsed ${allCards.length} cards total\n`);

    // Import to Firestore
    console.log('☁️  Importing to Firestore...');
    await importCards(allCards);

    // Create metadata
    console.log('\n📊 Creating metadata...');
    await createCollectionMetadata();

    // Parse and import quest definitions
    console.log('\n📖 Parsing quest definitions...');
    const questFile = join(cardDataPath, '7. Renown Cards, Shop and Quest Cards Complete 21-09-25.txt');
    const questData = parseQuestFile(questFile);

    console.log(`\n📦 Parsed ${questData.quests.length} quests\n`);
    await importQuests(questData.quests);

    // Import Renown Shop cards
    console.log('\n📖 Importing Renown Shop cards...');
    await importRenownShop(questData.shopCards);

    console.log('\n✨ Import complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

/**
 * Parse quest file
 */
function parseQuestFile(filePath: string) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  const quests: any[] = [];
  const shopCards: any[] = [];

  let currentSection = '';
  let currentQuest: any = null;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.includes('Quest Deck')) {
      currentSection = 'quests';
      continue;
    } else if (trimmed.includes('Renown Shop')) {
      currentSection = 'shop';
      continue;
    }

    // Parse quest entries
    if (currentSection === 'quests' && trimmed && !trimmed.startsWith('Rulebook')) {
      // Simple quest parsing - could be enhanced
      const match = trimmed.match(/^(.+?)\s+\(x(\d+)\):\s+(.+?)\.\s+Reward:\s+(.+)$/);
      if (match) {
        const [, name, count, condition, reward] = match;

        // Determine difficulty based on section
        let difficulty: 'simple' | 'intermediate' | 'difficult' = 'simple';
        if (name.includes('Unstoppable') || name.includes('Untouchable') || name.includes('Comeback')) {
          difficulty = 'difficult';
        } else if (name.includes('Executioner') || name.includes('Duelist') || name.includes('Saint')) {
          difficulty = 'intermediate';
        }

        for (let i = 0; i < parseInt(count); i++) {
          quests.push({
            id: `quest_${name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
            name,
            condition,
            reward,
            difficulty,
            manaCost: 2
          });
        }
      }
    }

    // Parse shop card entries
    if (currentSection === 'shop' && trimmed && !trimmed.startsWith('Rulebook')) {
      const match = trimmed.match(/^(.+?)\s+\(x(\d+)\):\s+(.+)$/);
      if (match) {
        const [, name, count, effect] = match;

        // Determine use cost from section headers
        let useCost = 0;
        if (trimmed.includes('Use Cost: 1')) useCost = 1;
        if (trimmed.includes('Use Cost: 2')) useCost = 2;
        if (trimmed.includes('Use Cost: 4')) useCost = 4;

        for (let i = 0; i < parseInt(count); i++) {
          shopCards.push({
            id: `shop_${name.toLowerCase().replace(/\s+/g, '_')}_${i + 1}`,
            name,
            effect,
            useCost,
            purchaseCost: 1 // All cards cost 1 Renown to purchase
          });
        }
      }
    }
  }

  return { quests, shopCards };
}

/**
 * Import Renown Shop cards
 */
async function importRenownShop(shopCards: any[]) {
  const batch = db.batch();
  let count = 0;

  for (const card of shopCards) {
    const docRef = db.collection('renownShop').doc(card.id);
    batch.set(docRef, card);
    count++;

    if (count % 500 === 0) {
      await batch.commit();
      console.log(`Imported ${count} shop cards...`);
    }
  }

  await batch.commit();
  console.log(`✅ Imported ${count} shop cards total`);
}

// Run import
main();
