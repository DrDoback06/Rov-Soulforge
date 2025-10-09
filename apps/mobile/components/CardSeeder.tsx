import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { collection, doc, setDoc, getDocs, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useFirebase } from '@/lib/firebase-context';

/**
 * 🧪 TEST SYSTEM - Card Seeder Component
 *
 * ⚠️ REMOVE IN PRODUCTION - This is a development/testing tool
 *
 * Seeds card data to Firebase and adds them to selected character's inventory
 * for testing purposes.
 */
export function CardSeeder() {
  const { db, user } = useFirebase();
  const [loading, setLoading] = useState(false);

  async function seedCards() {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to seed cards');
      return;
    }

    setLoading(true);
    try {
      // Get selected character ID
      const selectedCharId = typeof window !== 'undefined'
        ? localStorage.getItem('selectedCharacterId')
        : null;

      if (!selectedCharId) {
        Alert.alert('Error', 'No character selected. Please select a character first.');
        setLoading(false);
        return;
      }

      const cardsRef = collection(db, 'cards');

      // Sample cards for testing (will expand with full parser later)
      const testCards = [
        // Class Cards
        {
          id: 'class-guardian',
          name: 'Guardian',
          type: 'Class',
          rarity: 'Legendary',
          hp: 18,
          mana: 8,
          baseAttack: {
            name: 'Shield Bash',
            cost: 3,
            description: 'Deal 2 damage'
          },
          baseSkill: {
            name: 'Aegis of Protection',
            cost: 2,
            description: 'Grant a player 3 Temporary HP'
          },
          avatarPower: 'During the Infusion, for every 1 Mana you spend, your Soulforge gains +2 HP instead of +1',
          image: '🛡️'
        },
        {
          id: 'class-barbarian',
          name: 'Barbarian',
          type: 'Class',
          rarity: 'Legendary',
          hp: 15,
          mana: 10,
          baseAttack: {
            name: 'Primal Strike',
            cost: 2,
            description: 'Deal 3 damage'
          },
          baseSkill: {
            name: 'Blood Rage',
            cost: 0,
            description: 'Once per turn, lose 1-6 HP. Roll a d6. Gain temp Mana equal to HP lost + die roll. Your Base Attack deals +2 damage this turn'
          },
          avatarPower: 'During the Infusion, for every 1 HP you sacrifice, your Soulforge gains +5 HP instead of +3',
          image: '⚔️'
        },
        {
          id: 'class-sorceress',
          name: 'Sorceress',
          type: 'Class',
          rarity: 'Legendary',
          hp: 8,
          mana: 18,
          baseAttack: {
            name: 'Arcane Bolt',
            cost: 2,
            description: 'Deal 4 damage'
          },
          baseSkill: {
            name: 'Arcane Infusion',
            cost: 0,
            description: 'Once per turn, gain 4 temporary Mana'
          },
          avatarPower: 'After the Infusion, you gain temporary Mana equal to half the Mana you spent infusing the Soulforge',
          image: '🔮'
        },

        // Action Cards
        {
          id: 'action-stop-action',
          name: 'Stop Action',
          type: 'Action',
          subtype: 'Instant',
          rarity: 'Common',
          cost: 1,
          description: 'Cancel any one action, skill, or effect as it is being played',
          quantity: 10,
          image: '🚫'
        },
        {
          id: 'action-steal-card',
          name: 'Steal Card',
          type: 'Action',
          rarity: 'Common',
          cost: 2,
          description: 'Steal a random card from another player\'s hand. You cannot steal Renown cards',
          quantity: 10,
          image: '🃏'
        },
        {
          id: 'action-friends',
          name: 'Friends',
          type: 'Action',
          rarity: 'Uncommon',
          cost: 4,
          description: 'Form an alliance with another player. You may now use the "Borrow" action with your ally',
          quantity: 5,
          image: '🤝'
        },

        // Skill Cards
        {
          id: 'skill-fireball',
          name: 'Fireball',
          type: 'Skill',
          rarity: 'Rare',
          cost: 5,
          description: 'Deal 8 fire damage to target player',
          element: 'Fire',
          image: '🔥'
        },
        {
          id: 'skill-healing-touch',
          name: 'Healing Touch',
          type: 'Skill',
          rarity: 'Uncommon',
          cost: 3,
          description: 'Restore 6 HP to any player',
          element: 'Holy',
          image: '✨'
        },

        // Loot Cards
        {
          id: 'loot-health-potion',
          name: 'Health Potion',
          type: 'Loot',
          subtype: 'Consumable',
          rarity: 'Common',
          cost: 2,
          description: 'Restore 5 HP',
          image: '🧪'
        },
        {
          id: 'loot-mana-crystal',
          name: 'Mana Crystal',
          type: 'Loot',
          subtype: 'Consumable',
          rarity: 'Common',
          cost: 2,
          description: 'Restore 5 Mana',
          image: '💎'
        },

        // Summon Cards
        {
          id: 'summon-golem',
          name: 'Stone Golem',
          type: 'Summon',
          rarity: 'Rare',
          cost: 6,
          hp: 12,
          attack: 3,
          description: 'Summon a Stone Golem. Command it to attack for 3 damage (Cost: 2 Mana)',
          image: '🗿'
        },

        // Boss Cards
        {
          id: 'boss-dragon',
          name: 'Ancient Dragon',
          type: 'Boss',
          rarity: 'Mythic',
          hp: 50,
          attack: 10,
          description: 'Breath of Fire: Deal 8 damage to all players',
          rewards: ['Dragon Scale', '500 Gold', '3 Rare Cards'],
          image: '🐉'
        }
      ];

      console.log(`🃏 [TEST] Seeding ${testCards.length} test cards...`);

      // Step 1: Seed card definitions to cards collection
      for (const card of testCards) {
        await setDoc(doc(cardsRef, card.id), card);
      }

      // Step 2: Add cards to user's inventory collection (not character)
      const inventoryRef = doc(db, 'inventories', user.uid);
      const inventorySnap = await getDoc(inventoryRef);

      // Create cards object with cardId: quantity format
      const cardsToAdd: Record<string, number> = {};
      testCards.forEach(card => {
        cardsToAdd[card.id] = 1; // 1 copy of each card
      });

      if (inventorySnap.exists()) {
        // Update existing inventory
        const currentInventory = inventorySnap.data();
        const updatedCards = { ...(currentInventory.cards || {}), ...cardsToAdd };

        await updateDoc(inventoryRef, {
          cards: updatedCards
        });
      } else {
        // Create new inventory
        await setDoc(inventoryRef, {
          cards: cardsToAdd,
          packs: {}
        });
      }

      // Check if seeded successfully
      const snapshot = await getDocs(cardsRef);
      const count = snapshot.size;

      Alert.alert(
        '🧪 Test Cards Seeded!',
        `Successfully seeded ${count} card definitions and added ${testCards.length} cards to your inventory.\n\n⚠️ This is a TEST feature - will be removed in production.`
      );
      console.log(`✅ [TEST] Successfully seeded ${count} cards and added to inventory for user ${user.uid}`);
    } catch (error: any) {
      console.error('[TEST] Error seeding cards:', error);
      Alert.alert('Error', `Failed to seed cards:\n${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={seedCards}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Seeding Cards...' : '🧪 Seed Test Cards'}
        </Text>
      </Pressable>
      <Text style={styles.helperText}>
        🧪 TEST ONLY: Seeds sample cards to your character's inventory
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: 'rgba(155, 89, 182, 0.1)',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(155, 89, 182, 0.3)',
    borderStyle: 'dashed',
    padding: 8
  },
  button: {
    backgroundColor: '#9b59b6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonDisabled: {
    opacity: 0.5
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  helperText: {
    marginTop: 6,
    fontSize: 11,
    color: '#9b59b6',
    textAlign: 'center',
    fontWeight: '600'
  }
});
