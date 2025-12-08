import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from './useAuth';
import type { CardDef, Rarity, DeckType } from '@rov/types';
import { useEffect } from 'react';

/**
 * Hook for managing player inventory (cards and packs)
 */
export function useInventory() {
  const { db } = useFirebase();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Load player's card inventory
  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory', user?.uid],
    queryFn: async () => {
      if (!user?.uid || !db) return null;

      const inventoryDoc = await getDoc(doc(db, 'inventories', user.uid));
      if (!inventoryDoc.exists()) {
        return {
          cards: {},
          packs: {}
        };
      }

      return inventoryDoc.data() as {
        cards: Record<string, number>;
        packs: Record<string, number>;
      };
    },
    enabled: !!user?.uid && !!db
  });

  // Load all available cards from database
  const { data: allCards, isLoading: cardsLoading } = useQuery({
    queryKey: ['allCards'],
    queryFn: async () => {
      if (!db) return [];

      const cardsSnapshot = await getDocs(collection(db, 'cards'));
      return cardsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as CardDef[];
    },
    enabled: !!db
  });

  // Real-time inventory updates
  useEffect(() => {
    if (!user?.uid || !db) return;

    const unsubscribe = onSnapshot(
      doc(db, 'inventories', user.uid),
      (doc) => {
        if (doc.exists()) {
          queryClient.setQueryData(['inventory', user.uid], doc.data());
        }
      }
    );

    return () => unsubscribe();
  }, [user?.uid, db, queryClient]);

  // Filter cards by ownership
  const ownedCards = allCards?.filter(card =>
    inventory?.cards?.[card.id] && inventory.cards[card.id] > 0
  ) || [];

  // Get cards by filters
  const getFilteredCards = (filters: {
    searchQuery?: string;
    deck?: DeckType | 'all';
    rarity?: Rarity | 'all';
  }) => {
    return ownedCards.filter(card => {
      // Search filter
      if (filters.searchQuery && !card.name.toLowerCase().includes(filters.searchQuery.toLowerCase())) {
        return false;
      }

      // Deck filter
      if (filters.deck && filters.deck !== 'all' && card.deck !== filters.deck) {
        return false;
      }

      // Rarity filter
      if (filters.rarity && filters.rarity !== 'all' && card.rarity !== filters.rarity) {
        return false;
      }

      return true;
    });
  };

  // Get card count
  const getCardCount = (cardId: string) => {
    return inventory?.cards?.[cardId] || 0;
  };

  // Get pack count
  const getPackCount = (packId: string) => {
    return inventory?.packs?.[packId] || 0;
  };

  return {
    inventory,
    allCards,
    ownedCards,
    isLoading: inventoryLoading || cardsLoading,
    getFilteredCards,
    getCardCount,
    getPackCount
  };
}
