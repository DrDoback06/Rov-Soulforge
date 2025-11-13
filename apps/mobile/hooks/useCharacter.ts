import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import type { Character, ClassId, Alignment } from '@rov/types';
import { useAuth } from './useAuth';
import { useFirebase } from '@/lib/firebase-context';

/**
 * Hook to fetch and subscribe to current user's character
 */
export function useCharacter() {
  const { user } = useAuth();
  const { db } = useFirebase();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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

  /**
   * Update character data in Firestore
   */
  const updateCharacter = useCallback(async (updates: Partial<Character>) => {
    if (!user) {
      throw new Error('No user logged in');
    }

    const characterRef = doc(db, 'characters', user.uid);
    await updateDoc(characterRef, updates);
  }, [user, db]);

  return { character, loading, error, updateCharacter };
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