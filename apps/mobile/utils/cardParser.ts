/**
 * Card Parser - Parse rulebook text files into CardDef objects
 *
 * Parses all card types from text files and converts them to the app's CardDef format
 */

import type { CardDef, DeckType, Rarity, Alignment, EffectDef } from '@rov/types';

export interface ParsedCard {
  name: string;
  deck: DeckType;
  rarity: Rarity;
  alignment?: Alignment;
  manaCost?: number;
  overloadCost?: number;
  quantity?: number;
  text: string;
  onCardText: string;
  rulebookEntry?: string;
  clarification?: string;
  effects: EffectDef[];
  tags: string[];
  portable: boolean;

  // Class-specific
  hp?: number;
  baseAttack?: string;
  baseSkill?: string;
  avatarPower?: string;
}

// ============================================================================
// Main Parser
// ============================================================================

/**
 * Parse a card text file and extract all cards
 */
export function parseCardFile(fileContent: string, deckType: DeckType): ParsedCard[] {
  const cards: ParsedCard[] = [];

  // Split by card entries (look for numbered patterns like "1.", "2.", etc.)
  const sections = fileContent.split(/\n(?=\d+\.\s+)/);

  for (const section of sections) {
    if (section.trim().length === 0) continue;

    try {
      const card = parseCardSection(section, deckType);
      if (card) {
        cards.push(card);
      }
    } catch (error) {
      console.error('Error parsing card section:', error);
      console.error('Section:', section.substring(0, 200));
    }
  }

  return cards;
}

/**
 * Parse a single card section
 */
function parseCardSection(section: string, deckType: DeckType): ParsedCard | null {
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return null;

  // Extract card name from first line (e.g., "1. Stop Action (x10)")
  const firstLine = lines[0];
  const nameMatch = firstLine.match(/^\d+\.\s+(.+?)(?:\s+\(x(\d+)\))?(?:\s+On-Card Text:)?$/);

  if (!nameMatch) return null;

  const name = nameMatch[1].trim();
  const quantity = nameMatch[2] ? parseInt(nameMatch[2]) : 1;

  // Find "On-Card Text:" section
  const onCardTextIndex = lines.findIndex(l => l.includes('On-Card Text:'));
  const rulebookEntryIndex = lines.findIndex(l => l.includes('Rulebook Entry:'));
  const clarificationIndex = lines.findIndex(l => l.includes('Rulebook Clarification:'));

  let onCardText = '';
  let rulebookEntry = '';
  let clarification = '';

  if (onCardTextIndex >= 0) {
    const endIndex = rulebookEntryIndex >= 0 ? rulebookEntryIndex : lines.length;
    onCardText = lines.slice(onCardTextIndex + 1, endIndex).join(' ').trim();
  }

  if (rulebookEntryIndex >= 0) {
    const endIndex = clarificationIndex >= 0 ? clarificationIndex : lines.length;
    rulebookEntry = lines.slice(rulebookEntryIndex + 1, endIndex).join(' ').trim();
  }

  if (clarificationIndex >= 0) {
    clarification = lines.slice(clarificationIndex + 1).join(' ').trim();
  }

  // Use the most complete text available
  const cardText = onCardText || rulebookEntry || lines.slice(1).join(' ');

  // Parse card details
  const rarity = extractRarity(name, cardText);
  const alignment = extractAlignment(cardText);
  const manaCost = extractManaCost(cardText);
  const overloadCost = extractOverloadCost(cardText);
  const effects = parseEffects(cardText, name);
  const tags = extractTags(cardText, name);

  return {
    name,
    deck: deckType,
    rarity,
    alignment,
    manaCost,
    overloadCost,
    quantity,
    text: cardText,
    onCardText,
    rulebookEntry,
    clarification,
    effects,
    tags,
    portable: determinePortability(deckType, tags)
  };
}

// ============================================================================
// Extraction Functions
// ============================================================================

function extractRarity(name: string, text: string): Rarity {
  const lowerText = text.toLowerCase();
  const lowerName = name.toLowerCase();

  if (lowerName.includes('legendary') || lowerText.includes('legendary')) return 'Legendary';
  if (lowerName.includes('epic') || lowerText.includes('epic')) return 'Epic';
  if (lowerName.includes('rare') || lowerText.includes('rare')) return 'Rare';
  if (lowerName.includes('uncommon') || lowerText.includes('uncommon')) return 'Uncommon';

  return 'Common';
}

function extractAlignment(text: string): Alignment | undefined {
  if (text.includes('[Chaos]')) return 'Chaos';
  if (text.includes('[Holy]')) return 'Holy';
  if (text.includes('[Arcane]')) return 'Arcane';
  if (text.includes('[Neutral]')) return 'Neutral';

  return undefined;
}

function extractManaCost(text: string): number | undefined {
  // Look for "Cost: X Mana" or "Cost: X"
  const costMatch = text.match(/Cost:\s*(\d+)\s*(?:Mana)?/i);
  if (costMatch) {
    return parseInt(costMatch[1]);
  }

  return undefined;
}

function extractOverloadCost(text: string): number | undefined {
  const overloadMatch = text.match(/Overload\s*\((\d+)\)/i);
  if (overloadMatch) {
    return parseInt(overloadMatch[1]);
  }

  return undefined;
}

function extractTags(text: string, name: string): string[] {
  const tags: string[] = [];

  // Type tags
  if (text.includes('Instant')) tags.push('instant');
  if (text.includes('Persistent')) tags.push('persistent');
  if (text.includes('Aura')) tags.push('aura');
  if (text.includes('Curse')) tags.push('curse');
  if (text.includes('Trap')) tags.push('trap');
  if (text.includes('Link')) tags.push('link');
  if (text.includes('Summon')) tags.push('summon');
  if (text.includes('Consumable')) tags.push('consumable');
  if (text.includes('Equip')) tags.push('equip');
  if (text.includes('Weapon')) tags.push('weapon');
  if (text.includes('Armor')) tags.push('armor');
  if (text.includes('Accessory')) tags.push('accessory');

  // Mechanic tags
  if (text.includes('Overload')) tags.push('overload');
  if (text.includes('Echo')) tags.push('echo');
  if (text.includes('Scry')) tags.push('scry');

  return tags;
}

function determinePortability(deckType: DeckType, tags: string[]): boolean {
  // Loot is portable (can be used in adventures)
  if (deckType === 'Loot') return true;

  // Skills marked as consumable are portable
  if (tags.includes('consumable')) return true;

  // Action cards are not portable (PvP only)
  if (deckType === 'Action') return false;

  // Most skills are portable
  if (deckType === 'Skill') return true;

  // Boss and Summon cards are not portable
  if (deckType === 'Boss' || deckType === 'Summon') return false;

  return false;
}

// ============================================================================
// Effect Parsing
// ============================================================================

function parseEffects(text: string, cardName: string): EffectDef[] {
  const effects: EffectDef[] = [];
  const lowerText = text.toLowerCase();

  // Damage effects
  const damageMatch = text.match(/deal\s+(\d+)\s+damage/i);
  if (damageMatch) {
    const amount = parseInt(damageMatch[1]);
    effects.push({
      type: 'damage',
      amount,
      scaling: extractScaling(text)
    });
  }

  // Healing effects
  const healMatch = text.match(/(?:restore|heal)\s+(\d+)\s+hp/i);
  if (healMatch) {
    const amount = parseInt(healMatch[1]);
    effects.push({
      type: 'heal',
      amount,
      scaling: extractScaling(text)
    });
  }

  // Card draw
  const drawMatch = text.match(/draw\s+(\d+)\s+card/i);
  if (drawMatch) {
    const amount = parseInt(drawMatch[1]);
    effects.push({
      type: 'draw',
      deck: 'Action', // Default, could be improved
      amount
    });
  }

  // Mana gain
  const manaMatch = text.match(/gain\s+(\d+)\s+(?:temporary\s+)?mana/i);
  if (manaMatch) {
    const amount = parseInt(manaMatch[1]);
    effects.push({
      type: 'gainTempMana',
      amount
    });
  }

  // Gold gain
  const goldMatch = text.match(/(?:gain|steal)\s+(\d+)\s+(?:gold|renown)/i);
  if (goldMatch) {
    const amount = parseInt(goldMatch[1]);
    if (lowerText.includes('renown')) {
      effects.push({
        type: 'gainRenown',
        amount
      });
    } else {
      effects.push({
        type: 'gainGold',
        amount
      });
    }
  }

  // Buffs
  const buffMatch = text.match(/\+(\d+)\s+(atk|attack|def|defense|max\s+hp|max\s+mana)/i);
  if (buffMatch) {
    const amount = parseInt(buffMatch[1]);
    const statType = buffMatch[2].toLowerCase();

    let stat: 'atk' | 'def' | 'maxHp' | 'maxMana' = 'atk';
    if (statType.includes('def')) stat = 'def';
    else if (statType.includes('hp')) stat = 'maxHp';
    else if (statType.includes('mana')) stat = 'maxMana';

    effects.push({
      type: 'buff',
      stat,
      amount,
      duration: text.toLowerCase().includes('permanent') ? 'permanent' : 'battle'
    });
  }

  // Cancel/Counter
  if (lowerText.includes('cancel') || lowerText.includes('counter')) {
    effects.push({
      type: 'instantCancel'
    });
  }

  // Discard
  const discardMatch = text.match(/discard\s+(\d+)\s+card/i);
  if (discardMatch) {
    const amount = parseInt(discardMatch[1]);
    effects.push({
      type: 'discardRandom',
      who: lowerText.includes('opponent') ? 'opponent' : 'self',
      amount
    });
  }

  return effects;
}

function extractScaling(text: string): { stat: 'atk' | 'def' | 'spd'; factor: number } | undefined {
  // Look for scaling patterns like "+1 for every X ATK"
  const scalingMatch = text.match(/\+(\d+)(?:\s+additional)?\s+(?:damage|healing)?\s+for\s+every\s+(\d+)\s+(atk|attack|def|defense|spd|speed)/i);

  if (scalingMatch) {
    const bonusPerStat = parseInt(scalingMatch[1]);
    const statThreshold = parseInt(scalingMatch[2]);
    const statType = scalingMatch[3].toLowerCase();

    let stat: 'atk' | 'def' | 'spd' = 'atk';
    if (statType.includes('def')) stat = 'def';
    else if (statType.includes('spd') || statType.includes('speed')) stat = 'spd';

    return {
      stat,
      factor: bonusPerStat / statThreshold
    };
  }

  return undefined;
}

// ============================================================================
// Class Card Parsing
// ============================================================================

export function parseClassCard(section: string): ParsedCard | null {
  const lines = section.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  if (lines.length === 0) return null;

  // Extract class name (e.g., "1. Guardian")
  const firstLine = lines[0];
  const nameMatch = firstLine.match(/^\d+\.\s+(.+)$/);

  if (!nameMatch) return null;

  const name = nameMatch[1].trim();

  // Extract stats
  const statsLine = lines.find(l => l.startsWith('HP:'));
  let hp: number | undefined;
  let manaCost: number | undefined;

  if (statsLine) {
    const hpMatch = statsLine.match(/HP:\s*(\d+)/);
    const manaMatch = statsLine.match(/Mana:\s*(\d+)/);

    if (hpMatch) hp = parseInt(hpMatch[1]);
    if (manaMatch) manaCost = parseInt(manaMatch[1]);
  }

  // Extract abilities
  const baseAttack = lines.find(l => l.includes('Base Attack:'));
  const baseSkill = lines.find(l => l.includes('Base Skill:'));
  const avatarPower = lines.find(l => l.includes('Avatar Power:'));

  const cardText = lines.join(' ');

  return {
    name,
    deck: 'Class',
    rarity: 'Epic', // All classes are epic
    manaCost,
    hp,
    quantity: 1,
    text: cardText,
    onCardText: cardText,
    baseAttack,
    baseSkill,
    avatarPower,
    effects: [],
    tags: ['class', 'unique'],
    portable: false
  };
}

// ============================================================================
// Convert to CardDef
// ============================================================================

/**
 * Convert ParsedCard to CardDef format for the app
 */
export function toCardDef(parsed: ParsedCard): CardDef {
  return {
    id: generateCardId(parsed.name, parsed.deck),
    name: parsed.name,
    deck: parsed.deck,
    rarity: parsed.rarity,
    alignment: parsed.alignment,
    manaCost: parsed.manaCost || 0,
    tags: parsed.tags,
    portable: parsed.portable,
    text: parsed.text,
    effects: parsed.effects,
    art: {
      iconUrl: getDefaultIcon(parsed.deck, parsed.tags),
      fullUrl: undefined
    }
  };
}

function generateCardId(name: string, deck: DeckType): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  return `${deck.toLowerCase()}_${slug}`;
}

function getDefaultIcon(deck: DeckType, tags: string[]): string {
  if (tags.includes('weapon')) return '⚔️';
  if (tags.includes('armor')) return '🛡️';
  if (tags.includes('accessory')) return '💍';
  if (tags.includes('consumable')) return '🧪';

  const deckIcons: Record<DeckType, string> = {
    Action: '🎴',
    Skill: '✨',
    Loot: '💎',
    Boss: '👑',
    Summon: '🐉',
    Renown: '🏆',
    Quest: '📜',
    Class: '🎭'
  };

  return deckIcons[deck] || '🎴';
}

// ============================================================================
// Batch Processing
// ============================================================================

/**
 * Parse all card files
 */
export async function parseAllCardFiles(
  fileContents: Map<DeckType, string>
): Promise<Map<DeckType, CardDef[]>> {
  const allCards = new Map<DeckType, CardDef[]>();

  for (const [deckType, content] of fileContents) {
    console.log(`📚 Parsing ${deckType} cards...`);

    let parsedCards: ParsedCard[];

    if (deckType === 'Class') {
      // Special handling for class cards
      const sections = content.split(/\n(?=\d+\.\s+)/);
      parsedCards = sections
        .map(s => parseClassCard(s))
        .filter((c): c is ParsedCard => c !== null);
    } else {
      parsedCards = parseCardFile(content, deckType);
    }

    const cardDefs = parsedCards.map(p => toCardDef(p));

    // Expand quantities (e.g., x10 becomes 10 separate cards)
    const expandedCards: CardDef[] = [];
    for (const card of cardDefs) {
      const parsed = parsedCards.find(p => p.name === card.name);
      const quantity = parsed?.quantity || 1;

      for (let i = 0; i < quantity; i++) {
        expandedCards.push({
          ...card,
          id: `${card.id}_${i + 1}`
        });
      }
    }

    allCards.set(deckType, expandedCards);

    console.log(`  ✅ Parsed ${parsedCards.length} unique cards (${expandedCards.length} total with quantities)`);
  }

  return allCards;
}
