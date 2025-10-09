/**
 * Card Importer Script
 *
 * Reads card data from text files and imports to Firestore
 * Usage: npx ts-node scripts/importCards.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';
import type { DeckType } from '@rov/types';
import { parseAllCardFiles, toCardDef } from '../utils/cardParser';

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID_WEB
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ============================================================================
// File Reading
// ============================================================================

const CARD_DATA_DIR = path.join(__dirname, '../../../cardgamedata');

const FILE_MAP: Record<DeckType, string> = {
  Class: '1. Class Cards Complete 21-09-25.txt',
  Action: '2. Action Cards Complete 21-09-25.txt',
  Skill: '3. Skill Cards Complete 21-09-25.txt',
  Loot: '4. Loot Cards Complete 21-09-25.txt',
  Summon: '5. Summon Cards Complete 21-09-25.txt',
  Boss: '6. Boss Cards Complete 21-09-25.txt',
  Renown: '7. Renown Cards, Shop and Quest Cards Complete 21-09-25.txt',
  Quest: '7. Renown Cards, Shop and Quest Cards Complete 21-09-25.txt' // Same file
};

function readCardFiles(): Map<DeckType, string> {
  const fileContents = new Map<DeckType, string>();

  console.log('📖 Reading card files from:', CARD_DATA_DIR);
  console.log('');

  for (const [deckType, filename] of Object.entries(FILE_MAP) as [DeckType, string][]) {
    const filePath = path.join(CARD_DATA_DIR, filename);

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      fileContents.set(deckType, content);
      console.log(`  ✅ Read ${deckType}: ${filename}`);
    } catch (error) {
      console.error(`  ❌ Error reading ${filename}:`, error);
    }
  }

  console.log('');
  return fileContents;
}

// ============================================================================
// Firestore Upload
// ============================================================================

async function uploadCardsToFirestore(allCards: Map<DeckType, any[]>): Promise<void> {
  console.log('📤 Uploading cards to Firestore...');
  console.log('');

  let totalUploaded = 0;

  for (const [deckType, cards] of allCards) {
    console.log(`  📦 Uploading ${deckType} cards (${cards.length} cards)...`);

    // Use batch writes (max 500 per batch)
    const batchSize = 500;
    const batches = Math.ceil(cards.length / batchSize);

    for (let i = 0; i < batches; i++) {
      const batch = writeBatch(db);
      const start = i * batchSize;
      const end = Math.min((i + 1) * batchSize, cards.length);
      const batchCards = cards.slice(start, end);

      for (const card of batchCards) {
        const cardRef = doc(collection(db, 'cards'), card.id);
        batch.set(cardRef, card);
      }

      await batch.commit();
      totalUploaded += batchCards.length;

      console.log(`    Batch ${i + 1}/${batches} uploaded (${batchCards.length} cards)`);
    }

    console.log(`  ✅ ${deckType} complete`);
    console.log('');
  }

  console.log(`🎉 Total cards uploaded: ${totalUploaded}`);
}

// ============================================================================
// Statistics
// ============================================================================

function printStatistics(allCards: Map<DeckType, any[]>): void {
  console.log('');
  console.log('📊 Card Statistics:');
  console.log('═══════════════════════════════════════');

  let totalCards = 0;
  const rarityCount: Record<string, number> = {};
  const alignmentCount: Record<string, number> = {};
  const tagCount: Record<string, number> = {};

  for (const [deckType, cards] of allCards) {
    console.log('');
    console.log(`${deckType} Deck: ${cards.length} cards`);

    totalCards += cards.length;

    // Count rarities
    const rarities = cards.reduce((acc: Record<string, number>, card) => {
      acc[card.rarity] = (acc[card.rarity] || 0) + 1;
      rarityCount[card.rarity] = (rarityCount[card.rarity] || 0) + 1;
      return acc;
    }, {});

    for (const [rarity, count] of Object.entries(rarities)) {
      console.log(`  ${rarity}: ${count}`);
    }

    // Count alignments
    const alignments = cards.filter(c => c.alignment);
    for (const card of alignments) {
      alignmentCount[card.alignment] = (alignmentCount[card.alignment] || 0) + 1;
    }

    // Count tags
    for (const card of cards) {
      for (const tag of card.tags || []) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════');
  console.log(`Total Cards: ${totalCards}`);
  console.log('');

  console.log('Rarity Distribution:');
  for (const [rarity, count] of Object.entries(rarityCount)) {
    const percentage = ((count / totalCards) * 100).toFixed(1);
    console.log(`  ${rarity}: ${count} (${percentage}%)`);
  }

  console.log('');
  console.log('Alignment Distribution:');
  for (const [alignment, count] of Object.entries(alignmentCount)) {
    const percentage = ((count / totalCards) * 100).toFixed(1);
    console.log(`  ${alignment}: ${count} (${percentage}%)`);
  }

  console.log('');
  console.log('Top Tags:');
  const topTags = Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  for (const [tag, count] of topTags) {
    console.log(`  ${tag}: ${count}`);
  }

  console.log('═══════════════════════════════════════');
  console.log('');
}

// ============================================================================
// Validation
// ============================================================================

function validateCards(allCards: Map<DeckType, any[]>): boolean {
  console.log('✅ Validating cards...');
  console.log('');

  let hasErrors = false;

  for (const [deckType, cards] of allCards) {
    for (const card of cards) {
      // Check required fields
      if (!card.id) {
        console.error(`  ❌ ${card.name || 'Unknown'}: Missing ID`);
        hasErrors = true;
      }

      if (!card.name) {
        console.error(`  ❌ Card ${card.id}: Missing name`);
        hasErrors = true;
      }

      if (!card.deck) {
        console.error(`  ❌ ${card.name}: Missing deck type`);
        hasErrors = true;
      }

      if (!card.rarity) {
        console.error(`  ❌ ${card.name}: Missing rarity`);
        hasErrors = true;
      }

      if (card.manaCost === undefined && !['Boss', 'Summon', 'Class'].includes(deckType)) {
        console.warn(`  ⚠️  ${card.name}: Missing mana cost (set to 0)`);
      }

      if (!card.text || card.text.trim().length === 0) {
        console.warn(`  ⚠️  ${card.name}: Missing card text`);
      }

      if (!card.effects || card.effects.length === 0) {
        console.warn(`  ⚠️  ${card.name}: No effects parsed (might be intentional)`);
      }
    }
  }

  if (!hasErrors) {
    console.log('  ✅ All cards validated successfully!');
  } else {
    console.error('  ❌ Validation errors found');
  }

  console.log('');
  return !hasErrors;
}

// ============================================================================
// Main Script
// ============================================================================

async function main() {
  console.log('🎴 Realm of Valor - Card Importer');
  console.log('═══════════════════════════════════════');
  console.log('');

  try {
    // Step 1: Read files
    const fileContents = readCardFiles();

    if (fileContents.size === 0) {
      console.error('❌ No card files found!');
      process.exit(1);
    }

    // Step 2: Parse cards
    console.log('🔍 Parsing cards...');
    console.log('');
    const allCards = await parseAllCardFiles(fileContents);

    // Step 3: Print statistics
    printStatistics(allCards);

    // Step 4: Validate
    const isValid = validateCards(allCards);

    if (!isValid) {
      console.log('⚠️  Validation warnings found. Continue anyway? (Ctrl+C to cancel)');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // Step 5: Upload to Firestore
    const shouldUpload = process.argv.includes('--upload');

    if (shouldUpload) {
      console.log('🚀 Starting upload...');
      await uploadCardsToFirestore(allCards);
      console.log('');
      console.log('✨ Import complete!');
    } else {
      console.log('ℹ️  Dry run complete. Add --upload flag to upload to Firestore.');
      console.log('   Example: npx ts-node scripts/importCards.ts --upload');
    }

  } catch (error) {
    console.error('❌ Error during import:', error);
    process.exit(1);
  }
}

// Run the script
main();
