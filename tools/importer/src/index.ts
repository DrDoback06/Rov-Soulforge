import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { CardDef, ClassCard, BossCard, EffectDef, Rarity, Alignment } from '@rov/types';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_PATH = join(__dirname, '..', '..', '..', '..', 'cardgamedata');

// ============================================================================
// Effect Parsing Logic
// ============================================================================

function parseEffects(text: string, alignment?: Alignment): EffectDef[] {
  const effects: EffectDef[] = [];
  const lowerText = text.toLowerCase();

  // Deal X damage
  if (lowerText.includes('deal') && lowerText.includes('damage')) {
    const match = text.match(/deal (\d+) damage/i);
    if (match) {
      effects.push({ type: 'damage', amount: parseInt(match[1]) });
    }
    // AOE damage
    if (lowerText.includes('all other players') || lowerText.includes('all players')) {
      const matchAOE = text.match(/deal (\d+) damage to all/i);
      if (matchAOE) {
        effects.push({ type: 'aoe', damage: parseInt(matchAOE[1]), exclude: 'self' });
      }
    }
  }

  // Restore/Heal HP
  if (lowerText.includes('restore') || lowerText.includes('heal')) {
    const match = text.match(/restore (\d+) hp/i) || text.match(/heal (\d+)/i);
    if (match) {
      effects.push({ type: 'heal', amount: parseInt(match[1]) });
    }
  }

  // Draw cards
  if (lowerText.includes('draw') && (lowerText.includes('card') || lowerText.includes('skill') || lowerText.includes('loot'))) {
    const match = text.match(/draw (\d+) (card|skill|loot)/i);
    if (match) {
      const deck = match[2].toLowerCase() === 'skill' ? 'Skill' : match[2].toLowerCase() === 'loot' ? 'Loot' : 'Action';
      effects.push({ type: 'draw', deck: deck as any, amount: parseInt(match[1]) });
    }
  }

  // Gain temporary Mana
  if (lowerText.includes('gain') && lowerText.includes('mana')) {
    const match = text.match(/gain (\d+) (?:temporary )?mana/i);
    if (match) {
      effects.push({ type: 'gainTempMana', amount: parseInt(match[1]) });
    }
  }

  // Gain temporary HP
  if (lowerText.includes('gain') && lowerText.includes('temporary hp')) {
    const match = text.match(/gain (\d+) temporary hp/i);
    if (match) {
      effects.push({ type: 'gainTempHP', amount: parseInt(match[1]) });
    }
  }

  // Gain Renown
  if (lowerText.includes('gain') && lowerText.includes('renown')) {
    const match = text.match(/gain (\d+) renown/i);
    if (match) {
      effects.push({ type: 'gainRenown', amount: parseInt(match[1]) });
    }
  }

  // Gain Gold
  if (lowerText.includes('gain') && lowerText.includes('gold')) {
    const match = text.match(/gain (\d+) gold/i);
    if (match) {
      effects.push({ type: 'gainGold', amount: parseInt(match[1]) });
    }
  }

  // Cancel/Counterspell
  if (lowerText.includes('cancel') || lowerText.includes('counterspell')) {
    effects.push({ type: 'instantCancel' });
  }

  // Steal random card
  if (lowerText.includes('steal')) {
    const match = text.match(/steal (?:a )?(?:random )?(?:card|(\d+))/i);
    if (match) {
      const amount = match[1] ? parseInt(match[1]) : 1;
      effects.push({ type: 'stealRandom', from: 'opponent', deck: 'Action', amount });
    }
  }

  // Discard
  if (lowerText.includes('discard')) {
    const match = text.match(/discard (?:a )?(?:random )?(?:card|(\d+))/i);
    if (match) {
      const amount = match[1] ? parseInt(match[1]) : 1;
      effects.push({ type: 'discardRandom', who: 'self', amount });
    }
  }

  // Buffs
  if (lowerText.includes('+') && (lowerText.includes('atk') || lowerText.includes('max hp') || lowerText.includes('max mana'))) {
    const atkMatch = text.match(/\+(\d+) atk/i);
    const hpMatch = text.match(/\+(\d+) (?:max )?hp/i);
    const manaMatch = text.match(/\+(\d+) (?:max )?mana/i);

    if (atkMatch) {
      effects.push({ type: 'buff', stat: 'atk', amount: parseInt(atkMatch[1]), duration: 'battle' });
    }
    if (hpMatch && !lowerText.includes('restore')) {
      effects.push({ type: 'buff', stat: 'maxHp', amount: parseInt(hpMatch[1]), duration: 'battle' });
    }
    if (manaMatch && !lowerText.includes('gain')) {
      effects.push({ type: 'buff', stat: 'maxMana', amount: parseInt(manaMatch[1]), duration: 'battle' });
    }
  }

  // Boss Battle spawn
  if (lowerText.includes('boss appears') || lowerText.includes('boss battle')) {
    effects.push({ type: 'spawn', what: 'boss', refId: 'random' });
  }

  // Persistent effects (Aura, Curse, Link)
  if (lowerText.includes('persistent') || lowerText.includes('aura') || lowerText.includes('curse')) {
    const subtype = lowerText.includes('aura') ? 'aura' : lowerText.includes('link') ? 'link' : 'curse';
    const hpMatch = text.match(/(\d+) hp/i);
    effects.push({ type: 'persistent', subtype, hp: hpMatch ? parseInt(hpMatch[1]) : undefined });
  }

  // If no effects parsed, add custom with full text
  if (effects.length === 0) {
    effects.push({ type: 'custom', key: 'unparsed', payload: { text } });
  }

  return effects;
}

// ============================================================================
// Card Parsers
// ============================================================================

function parseClassCards(fileContent: string): ClassCard[] {
  const cards: ClassCard[] = [];
  const classBlocks = fileContent.split(/\n\d+\.\s+/).filter(Boolean);

  classBlocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    const name = lines[0].trim();

    const hpMatch = block.match(/HP:\s*(\d+)/i);
    const manaMatch = block.match(/Mana:\s*(\d+)/i);
    const baseAttackMatch = block.match(/Base Attack:\s*(.+?)\s*-\s*(.+?)(?:\n|Base Skill)/i);
    const baseSkillMatch = block.match(/Base Skill:\s*(.+?)\s*-\s*(.+?)(?:\n|Avatar)/i);
    const avatarMatch = block.match(/Avatar Power:\s*(.+?)(?:\n\n|$)/is);

    const baseAttackFull = baseAttackMatch ? baseAttackMatch[0] : '';
    const costMatch = baseAttackFull.match(/Cost:\s*(\d+)/i);
    const damageMatch = baseAttackFull.match(/Deal\s*(\d+)\s*damage/i);

    const baseSkillFull = baseSkillMatch ? baseSkillMatch[0] : '';
    const skillCostMatch = baseSkillFull.match(/Cost:\s*(\d+)/i);

    const card: ClassCard = {
      id: `class_${name.toLowerCase().replace(/\s+/g, '_')}`,
      name,
      deck: 'Class',
      rarity: 'Legendary',
      portable: true,
      text: block,
      baseHP: hpMatch ? parseInt(hpMatch[1]) : 10,
      baseMana: manaMatch ? parseInt(manaMatch[1]) : 10,
      baseAttack: {
        name: baseAttackMatch ? baseAttackMatch[1].trim() : 'Attack',
        cost: costMatch ? parseInt(costMatch[1]) : 2,
        damage: damageMatch ? parseInt(damageMatch[1]) : 2,
        effect: baseAttackMatch ? baseAttackMatch[2].trim() : '',
      },
      baseSkill: {
        name: baseSkillMatch ? baseSkillMatch[1].trim() : 'Skill',
        cost: skillCostMatch ? parseInt(skillCostMatch[1]) : 0,
        effect: baseSkillMatch ? baseSkillMatch[2].trim() : '',
      },
      avatarPower: avatarMatch ? avatarMatch[1].trim() : undefined,
      effects: [],
    };

    cards.push(card);
  });

  return cards;
}

function parseActionCards(fileContent: string): CardDef[] {
  const cards: CardDef[] = [];

  // Part 1: Hand-Played Actions
  const handPlayedSection = fileContent.match(/Part 1: Hand-Played Actions[\s\S]+?(?=Part 2:|$)/);
  if (handPlayedSection) {
    const cardBlocks = handPlayedSection[0].split(/\n\d+\.\s+/).filter(Boolean).slice(1);

    cardBlocks.forEach((block) => {
      const nameMatch = block.match(/^(.+?)\s*\(x(\d+)\)/);
      const costMatch = block.match(/Cost:\s*(\d+)\s*Mana/i);
      const textMatch = block.match(/On-Card Text:[\s\S]+?Effect:\s*(.+?)(?:\n\nRulebook|$)/is);

      if (nameMatch) {
        const card: CardDef = {
          id: `action_hand_${nameMatch[1].toLowerCase().replace(/\s+/g, '_')}`,
          name: nameMatch[1].trim(),
          deck: 'Action',
          rarity: 'Uncommon',
          manaCost: costMatch ? parseInt(costMatch[1]) : 0,
          tags: block.includes('Instant') ? ['Instant'] : [],
          portable: true,
          text: textMatch ? textMatch[1].trim() : '',
          effects: parseEffects(block),
        };
        cards.push(card);
      }
    });
  }

  // Part 2: Main Action Deck
  const categories = [
    { name: 'Category 1: Social & Physical Challenges', rarity: 'Common' as Rarity },
    { name: 'Category 2: Player vs. Player Confrontations', rarity: 'Uncommon' as Rarity },
    { name: 'Category 3: Global Events', rarity: 'Rare' as Rarity },
    { name: 'Category 4: Curses & "Bombs"', rarity: 'Rare' as Rarity },
    { name: 'Category 5: High-Impact "Fate-Like" Events', rarity: 'Epic' as Rarity },
  ];

  categories.forEach((category) => {
    const categorySection = fileContent.match(new RegExp(`${category.name}[\\s\\S]+?(?=Category \\d+:|$)`));
    if (categorySection) {
      const cardLines = categorySection[0].split('\n').filter(line => line.match(/^[A-Z]/));

      cardLines.forEach((line) => {
        const match = line.match(/^(.+?)\s*\(x(\d+)\):\s*(.+)$/);
        if (match) {
          const name = match[1].trim();
          const count = parseInt(match[2]);
          const description = match[3].trim();

          // Determine portability
          let portable = true;
          const lowerDesc = description.toLowerCase();

          // Physical exertion cards - convert to HR-based
          if (lowerDesc.includes('physical feat') || lowerDesc.includes('draw a creature') || lowerDesc.includes('sing')) {
            portable = false; // These are too social/physical for app
          }

          // Check if Soulforge-related
          if (lowerDesc.includes('soulforge') || lowerDesc.includes('ascension')) {
            portable = false;
          }

          const card: CardDef = {
            id: `action_${name.toLowerCase().replace(/[\s'!?]/g, '_')}`,
            name,
            deck: 'Action',
            rarity: category.rarity,
            manaCost: 0,
            tags: [],
            portable,
            text: description,
            effects: parseEffects(description),
          };
          cards.push(card);
        }
      });
    }
  });

  return cards;
}

function parseSkillCards(fileContent: string): CardDef[] {
  const cards: CardDef[] = [];

  // Parse Legendary Skills
  const legendarySection = fileContent.match(/Legendary Skills[\s\S]+?(?=Epic Skills|$)/);
  if (legendarySection) {
    const skillBlocks = legendarySection[0].split(/\n\d+\.\s+/).filter(Boolean).slice(1);

    skillBlocks.forEach((block) => {
      const nameMatch = block.match(/^(.+?)\s+On-Card/);
      const alignMatch = block.match(/Align:\s*\[(\w+)\]/i);
      const costMatch = block.match(/Cost:\s*(\d+)\s*Mana/i);
      const textMatch = block.match(/Type:.+?\n(.+?)(?:\n\n|Align Bonus:|$)/is);

      if (nameMatch) {
        const card: CardDef = {
          id: `skill_legendary_${nameMatch[1].toLowerCase().replace(/\s+/g, '_')}`,
          name: nameMatch[1].trim(),
          deck: 'Skill',
          rarity: 'Legendary',
          alignment: alignMatch ? (alignMatch[1] as Alignment) : undefined,
          manaCost: costMatch ? parseInt(costMatch[1]) : 0,
          tags: [],
          portable: !block.toLowerCase().includes('soulforge'),
          text: textMatch ? textMatch[1].trim() : '',
          effects: parseEffects(block, alignMatch ? (alignMatch[1] as Alignment) : undefined),
        };
        cards.push(card);
      }
    });
  }

  // Parse Epic, Rare, and Common Skills (similar pattern)
  const sections = [
    { header: 'Epic Skills', rarity: 'Epic' as Rarity },
    { header: 'Rare Skills', rarity: 'Rare' as Rarity },
    { header: 'Common Skills', rarity: 'Common' as Rarity },
  ];

  sections.forEach((section) => {
    const sectionRegex = new RegExp(`${section.header}[\\s\\S]+?(?=Legendary Skills|Epic Skills|Rare Skills|Common Skills|$)`);
    const sectionMatch = fileContent.match(sectionRegex);

    if (sectionMatch) {
      const skillLines = sectionMatch[0].split('\n').filter(line => line.match(/^[A-Z]/));

      skillLines.forEach((line) => {
        const match = line.match(/^(.+?)\s*\(x(\d+)\)\s*-\s*\[?(\w+)?\]?\s*Cost:\s*(\d+)\.(.+)$/);
        if (match) {
          const name = match[1].trim();
          const count = parseInt(match[2]);
          const align = match[3] as Alignment | undefined;
          const cost = parseInt(match[4]);
          const effect = match[5].trim();

          const card: CardDef = {
            id: `skill_${section.rarity.toLowerCase()}_${name.toLowerCase().replace(/\s+/g, '_')}`,
            name,
            deck: 'Skill',
            rarity: section.rarity,
            alignment: align,
            manaCost: cost,
            tags: effect.toLowerCase().includes('instant') ? ['Instant'] : [],
            portable: true,
            text: effect,
            effects: parseEffects(effect, align),
          };
          cards.push(card);
        }
      });
    }
  });

  return cards;
}

function parseLootCards(fileContent: string): CardDef[] {
  const cards: CardDef[] = [];

  const sections = [
    { header: 'Legendary Loot', rarity: 'Legendary' as Rarity },
    { header: 'Epic Loot', rarity: 'Epic' as Rarity },
    { header: 'Rare Loot', rarity: 'Rare' as Rarity },
    { header: 'Common Loot', rarity: 'Common' as Rarity },
  ];

  sections.forEach((section) => {
    const sectionRegex = new RegExp(`${section.header}[\\s\\S]+?(?=Legendary Loot|Epic Loot|Rare Loot|Common Loot|Renown & Fate Cards|$)`);
    const sectionMatch = fileContent.match(sectionRegex);

    if (sectionMatch) {
      const lootLines = sectionMatch[0].split('\n').filter(line => line.match(/^[A-Z]/) && line.includes('-'));

      lootLines.forEach((line) => {
        const match = line.match(/^(.+?)\s*\(x(\d+)\)\s*-\s*(.+?)\.\s*Cost:\s*(\d+)\.(.+)$/);
        if (match) {
          const name = match[1].trim();
          const count = parseInt(match[2]);
          const type = match[3].trim(); // Weapon, Armor, Consumable, etc.
          const cost = parseInt(match[4]);
          const effect = match[5].trim();

          const card: CardDef = {
            id: `loot_${section.rarity.toLowerCase()}_${name.toLowerCase().replace(/[\s']/g, '_')}`,
            name,
            deck: 'Loot',
            rarity: section.rarity,
            manaCost: cost,
            tags: [type],
            portable: true,
            text: effect,
            effects: parseEffects(effect),
          };
          cards.push(card);
        }
      });
    }
  });

  // Parse Fate Cards
  const fateSection = fileContent.match(/Fate Cards[\s\S]+/);
  if (fateSection) {
    const fateLines = fateSection[0].split('\n').filter(line => line.startsWith('Fate:'));

    fateLines.forEach((line) => {
      const match = line.match(/^Fate:\s*(.+?)\s*-\s*Wildcard.*?\.(.+)$/);
      if (match) {
        const name = `Fate: ${match[1].trim()}`;
        const effect = match[2].trim();

        const card: CardDef = {
          id: `fate_${match[1].toLowerCase().replace(/\s+/g, '_')}`,
          name,
          deck: 'Loot',
          rarity: 'Legendary',
          manaCost: 0,
          tags: ['Wildcard', 'Fate'],
          portable: true,
          text: effect,
          effects: parseEffects(effect),
        };
        cards.push(card);
      }
    });
  }

  return cards;
}

function parseSummonCards(fileContent: string): CardDef[] {
  const cards: CardDef[] = [];

  // Parse Helpful Summons
  const helpfulSection = fileContent.match(/Helpful Summons[\s\S]+?(?=Problematic Summons|$)/);
  if (helpfulSection) {
    const summonBlocks = helpfulSection[0].split(/\n\d+\.\s+/).filter(Boolean).slice(1);

    summonBlocks.forEach((block) => {
      const nameMatch = block.match(/^(.+?)\s+On-Card/);
      const costMatch = block.match(/Cost:\s*(\d+)\s*Mana/i);
      const hpMatch = block.match(/HP:\s*(\d+)/i);
      const textMatch = block.match(/Type:.+?\n(.+?)(?:\n\nRulebook|$)/is);

      if (nameMatch) {
        const card: CardDef = {
          id: `summon_helpful_${nameMatch[1].toLowerCase().replace(/\s+/g, '_')}`,
          name: nameMatch[1].trim(),
          deck: 'Summon',
          rarity: 'Uncommon',
          manaCost: costMatch ? parseInt(costMatch[1]) : 0,
          tags: ['Ally', block.includes('Persistent') ? 'Persistent' : 'OneTime'],
          portable: true,
          text: textMatch ? textMatch[1].trim() : '',
          effects: parseEffects(block),
        };
        cards.push(card);
      }
    });
  }

  // Parse Problematic Summons
  const problematicSection = fileContent.match(/Problematic Summons[\s\S]+/);
  if (problematicSection) {
    const summonBlocks = problematicSection[0].split(/\n\d+\.\s+/).filter(Boolean).slice(1);

    summonBlocks.forEach((block) => {
      const nameMatch = block.match(/^(.+?)\s+On-Card/);
      const costMatch = block.match(/Cost:\s*(\d+)\s*Mana/i);
      const hpMatch = block.match(/HP:\s*(\d+)/i);
      const textMatch = block.match(/Type:.+?\n(.+?)(?:\n\nRulebook|$)/is);

      if (nameMatch) {
        const card: CardDef = {
          id: `summon_hindrance_${nameMatch[1].toLowerCase().replace(/[\s'-]/g, '_')}`,
          name: nameMatch[1].trim(),
          deck: 'Summon',
          rarity: 'Rare',
          manaCost: costMatch ? parseInt(costMatch[1]) : 0,
          tags: ['Hindrance', block.includes('Persistent') ? 'Persistent' : 'OneTime'],
          portable: true,
          text: textMatch ? textMatch[1].trim() : '',
          effects: parseEffects(block),
        };
        cards.push(card);
      }
    });
  }

  return cards;
}

function parseBossCards(fileContent: string): BossCard[] {
  const cards: BossCard[] = [];
  const bossBlocks = fileContent.split(/\n\d+\.\s+/).filter(Boolean).slice(1);

  bossBlocks.forEach((block) => {
    const nameMatch = block.match(/^(.+?)\s+On-Card/);
    const hpMatch = block.match(/HP:\s*(\d+)\s*x\s*Players/i);
    const hpFixedMatch = block.match(/HP:\s*(\d+)\s*\(does not scale\)/i);
    const actionMatch = block.match(/Action:\s*(.+?)(?:\n|Passive:)/is);
    const passiveMatch = block.match(/Passive:\s*(.+?)(?:\n|Special:|Reward:)/is);
    const specialMatch = block.match(/Special:\s*(.+?)(?:\n|Reward:)/is);
    const rewardMatch = block.match(/Reward:\s*(.+?)(?:\n\n|$)/is);

    if (nameMatch) {
      const card: BossCard = {
        id: `boss_${nameMatch[1].toLowerCase().replace(/[\s,'-]/g, '_')}`,
        name: nameMatch[1].trim(),
        deck: 'Boss',
        rarity: 'Epic',
        portable: true,
        text: block,
        baseHP: hpMatch ? parseInt(hpMatch[1]) : hpFixedMatch ? parseInt(hpFixedMatch[1]) : 10,
        hpScaling: hpMatch ? 'perPlayer' : 'fixed',
        action: actionMatch ? actionMatch[1].trim() : '',
        passive: passiveMatch ? passiveMatch[1].trim() : '',
        special: specialMatch ? specialMatch[1].trim() : undefined,
        reward: rewardMatch ? rewardMatch[1].trim() : '',
        effects: [],
      };
      cards.push(card);
    }
  });

  return cards;
}

function parseQuestAndShopCards(fileContent: string): { quests: any[]; shopItems: any[] } {
  const quests: any[] = [];
  const shopItems: any[] = [];

  // Parse Renown Shop
  const shopSection = fileContent.match(/The Renown Shop Deck[\s\S]+?(?=The Quest Deck|$)/);
  if (shopSection) {
    const treasureLines = shopSection[0].split('\n').filter(line => line.match(/^[A-Z]/));

    treasureLines.forEach((line) => {
      const match = line.match(/^(.+?)\s*\(x(\d+)\):\s*(.+)$/);
      if (match) {
        const name = match[1].trim();
        const count = parseInt(match[2]);
        const effect = match[3].trim();

        shopItems.push({
          id: `shop_${name.toLowerCase().replace(/\s+/g, '_')}`,
          name,
          description: effect,
          kind: 'item',
          priceGold: 750, // Default, will be tuned
          portable: true,
        });
      }
    });
  }

  // Parse Quest Deck
  const questSection = fileContent.match(/The Quest Deck[\s\S]+/);
  if (questSection) {
    const questLines = questSection[0].split('\n').filter(line => line.match(/^[A-Z]/));

    questLines.forEach((line) => {
      const match = line.match(/^(.+?)\s*\(x(\d+)\):\s*(.+?)\.\s*Reward:\s*(.+)$/);
      if (match) {
        const name = match[1].trim();
        const count = parseInt(match[2]);
        const description = match[3].trim();
        const reward = match[4].trim();

        quests.push({
          id: `quest_${name.toLowerCase().replace(/\s+/g, '_')}`,
          title: name,
          description,
          type: 'Daily',
          rarity: 'Common',
          placeType: 'Any',
          dynamic: false,
          timerSec: 3600,
          requirements: [],
          rewards: [{ kind: 'xp', value: 1 }],
        });
      }
    });
  }

  return { quests, shopItems };
}

// ============================================================================
// Main Import Function
// ============================================================================

async function importAllCards() {
  console.log('🎴 Realm of Valor - Card Importer\n');

  try {
    // Read all source files
    const classFile = readFileSync(join(BASE_PATH, '1. Class Cards Complete 21-09-25.txt'), 'utf-8');
    const actionFile = readFileSync(join(BASE_PATH, '2. Action Cards Complete 21-09-25.txt'), 'utf-8');
    const skillFile = readFileSync(join(BASE_PATH, '3. Skill Cards Complete 21-09-25.txt'), 'utf-8');
    const lootFile = readFileSync(join(BASE_PATH, '4. Loot Cards Complete 21-09-25.txt'), 'utf-8');
    const summonFile = readFileSync(join(BASE_PATH, '5. Summon Cards Complete 21-09-25.txt'), 'utf-8');
    const bossFile = readFileSync(join(BASE_PATH, '6. Boss Cards Complete 21-09-25.txt'), 'utf-8');
    const questShopFile = readFileSync(join(BASE_PATH, '7. Renown Cards, Shop and Quest Cards Complete 21-09-25.txt'), 'utf-8');

    // Parse all cards
    console.log('📋 Parsing Class Cards...');
    const classCards = parseClassCards(classFile);
    console.log(`   ✅ ${classCards.length} class cards parsed`);

    console.log('📋 Parsing Action Cards...');
    const actionCards = parseActionCards(actionFile);
    console.log(`   ✅ ${actionCards.length} action cards parsed`);

    console.log('📋 Parsing Skill Cards...');
    const skillCards = parseSkillCards(skillFile);
    console.log(`   ✅ ${skillCards.length} skill cards parsed`);

    console.log('📋 Parsing Loot Cards...');
    const lootCards = parseLootCards(lootFile);
    console.log(`   ✅ ${lootCards.length} loot cards parsed`);

    console.log('📋 Parsing Summon Cards...');
    const summonCards = parseSummonCards(summonFile);
    console.log(`   ✅ ${summonCards.length} summon cards parsed`);

    console.log('📋 Parsing Boss Cards...');
    const bossCards = parseBossCards(bossFile);
    console.log(`   ✅ ${bossCards.length} boss cards parsed`);

    console.log('📋 Parsing Quests & Shop Items...');
    const { quests, shopItems } = parseQuestAndShopCards(questShopFile);
    console.log(`   ✅ ${quests.length} quests parsed`);
    console.log(`   ✅ ${shopItems.length} shop items parsed`);

    // Combine all cards
    const allCards = [
      ...classCards,
      ...actionCards,
      ...skillCards,
      ...lootCards,
      ...summonCards,
      ...bossCards,
    ];

    // Generate coverage report
    const portableCount = allCards.filter(c => c.portable).length;
    const nonPortableCount = allCards.filter(c => !c.portable).length;
    const unparsedCount = allCards.filter(c =>
      c.effects.some(e => e.type === 'custom' && e.payload?.text)
    ).length;

    console.log('\n📊 Import Summary:');
    console.log(`   Total Cards: ${allCards.length}`);
    console.log(`   Portable: ${portableCount} (${((portableCount / allCards.length) * 100).toFixed(1)}%)`);
    console.log(`   Non-Portable: ${nonPortableCount} (${((nonPortableCount / allCards.length) * 100).toFixed(1)}%)`);
    console.log(`   Unparsed Effects: ${unparsedCount}`);

    // Write output files
    const outputDir = join(__dirname, '..', '..', '..', 'docs');
    writeFileSync(join(outputDir, 'cards.json'), JSON.stringify(allCards, null, 2));
    writeFileSync(join(outputDir, 'quests.json'), JSON.stringify(quests, null, 2));
    writeFileSync(join(outputDir, 'shop-items.json'), JSON.stringify(shopItems, null, 2));

    console.log('\n✅ Import complete!');
    console.log(`   📁 Output: ${outputDir}/cards.json`);
    console.log(`   📁 Output: ${outputDir}/quests.json`);
    console.log(`   📁 Output: ${outputDir}/shop-items.json`);

    // List unparsed cards for review
    if (unparsedCount > 0) {
      console.log('\n⚠️  Cards with unparsed effects (manual review needed):');
      allCards
        .filter(c => c.effects.some(e => e.type === 'custom'))
        .slice(0, 10)
        .forEach(c => {
          console.log(`   - ${c.name} (${c.deck})`);
        });
      if (unparsedCount > 10) {
        console.log(`   ... and ${unparsedCount - 10} more`);
      }
    }

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run the importer
importAllCards();