import { useEffect, useState, useMemo } from 'react';
import { doc, onSnapshot, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { Character, ClassId, Alignment, ComputedStats, GameCard } from '@rov/types';
import { useAuth } from './useAuth';
import { useFirebase } from '@/lib/firebase-context';
import { calculateCharacterStats } from '@/utils/statCalculator';

/**
 * Hook to fetch and subscribe to current user's character
 * Now includes computed stats from equipped items
 */
export function useCharacter() {
  const { user } = useAuth();
  const { db } = useFirebase();
  const [character, setCharacter] = useState<Character | null>(null);
  const [equippedCards, setEquippedCards] = useState<Map<string, GameCard>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load equipped cards whenever equipment changes
  useEffect(() => {
    if (!character || !user) return;

    const loadEquippedCards = async () => {
      const cardIds = Object.values(character.equipped).filter(Boolean) as string[];
      if (cardIds.length === 0) {
        setEquippedCards(new Map());
        return;
      }

      try {
        // Get inventory data to find equipped cards
        const inventoryRef = doc(db, 'inventories', user.uid);
        const inventorySnap = await getDoc(inventoryRef);
        
        if (!inventorySnap.exists()) {
          setEquippedCards(new Map());
          return;
        }

        const inventoryData = inventorySnap.data();
        const cardsMap = new Map<string, GameCard>();
        
        // Map equipped cards
        cardIds.forEach(cardId => {
          const cardData = inventoryData.cards?.[cardId];
          if (cardData) {
            cardsMap.set(cardId, cardData as GameCard);
          }
        });

        setEquippedCards(cardsMap);
      } catch (err) {
        console.error('Error loading equipped cards:', err);
      }
    };

    loadEquippedCards();
  }, [character?.equipped, user, db]);

  useEffect(() => {
    if (!user) {
      setCharacter(null);
      setLoading(false);
      return;
    }

    // Real-time listener for character
    const characterRef = doc(db, 'characters', user.uid);

    const unsubscribe = onSnapshot(
      characterRef,
      (doc) => {
        if (doc.exists()) {
          setCharacter(doc.data() as Character);
        } else {
          setCharacter(null);
        }
        setLoading(false);
      },
      (err) => {
        console.error('Error fetching character:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user, db]);

  // Calculate computed stats whenever character or equipment changes
  const computedStats = useMemo<ComputedStats | null>(() => {
    if (!character) return null;
    
    // TODO: Load temporary buffs from fitness activities
    const temporaryBuffs: Array<{
      stat: 'atk' | 'def' | 'maxHp' | 'maxMana';
      amount: number;
      expiresAt: number;
    }> = [];

    return calculateCharacterStats(character, equippedCards, temporaryBuffs);
  }, [character, equippedCards]);

  return { character, computedStats, loading, error };
}

/**
 * Create a new character for the current user
 */
export async function createCharacter(
  userId: string,
  classId: ClassId,
  alignment: Alignment,
  db: any
): Promise<Character> {
  const baseStats = getBaseStatsForClass(classId);

  const newCharacter: Character = {
    id: userId,
    uid: userId,
    classId,
    alignment,
    counters: {
      hp: baseStats.maxHp,
      mana: baseStats.maxMana,
      xp: 0,
      renown: 0
    },
    stats: baseStats,
    level: 1,
    lives: 3,
    inventory: [],
    equipped: {},
    skills: [],
    gold: 100 // Starting gold
  };

  await setDoc(doc(db, 'characters', userId), newCharacter);

  // Also create empty inventory
  await setDoc(doc(db, 'inventories', userId), {
    cards: {},
    packs: {}
  });

  return newCharacter;
}

/**
 * Get base stats for each class
 */
function getBaseStatsForClass(classId: ClassId) {
  const classStats: Record<ClassId, { atk: number; def: number; spd: number; maxHp: number; maxMana: number }> = {
    'Warrior': { atk: 12, def: 10, spd: 5, maxHp: 120, maxMana: 30 },
    'Mage': { atk: 8, def: 5, spd: 7, maxHp: 80, maxMana: 100 },
    'Rogue': { atk: 10, def: 6, spd: 10, maxHp: 90, maxMana: 50 },
    'Paladin': { atk: 11, def: 12, spd: 4, maxHp: 130, maxMana: 40 },
    'Ranger': { atk: 9, def: 7, spd: 8, maxHp: 100, maxMana: 60 },
    'Necromancer': { atk: 7, def: 6, spd: 6, maxHp: 85, maxMana: 90 },
    'Bard': { atk: 6, def: 8, spd: 9, maxHp: 95, maxMana: 70 },
    'Druid': { atk: 8, def: 9, spd: 7, maxHp: 110, maxMana: 80 }
  };

  return classStats[classId] || classStats['Warrior'];
}