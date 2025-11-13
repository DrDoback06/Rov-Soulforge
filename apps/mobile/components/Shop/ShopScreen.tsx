/**
 * Shop Screen
 *
 * Main shop interface with:
 * - Currency display
 * - Card pack listings
 * - Purchase confirmation
 * - Pack opening animations
 */

import { View, Text, StyleSheet, ScrollView, SafeAreaView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import { useFirebase } from '@/lib/firebase-context';
import { useAuth } from '@/hooks/useAuth';

import { CurrencyDisplay } from './CurrencyDisplay';
import { PackCard } from './PackCard';
import { PackOpeningModal } from './PackOpeningModal';

import { CARD_PACKS } from '@/constants/shopPacks';
import { openPack, initializePitySystem } from '@/utils/packOpening';
import type { CardPack, PitySystem, PackOpeningResult, UserCurrency } from '@/types/shop';
import type { Card } from '@rov/types';

export function ShopScreen() {
  const { db } = useFirebase();
  const { user } = useAuth();

  // Mock user currency (should come from Firestore in production)
  const [userCurrency, setUserCurrency] = useState<UserCurrency>({
    userId: user?.uid || '',
    gold: 1000,
    gems: 100,
    lastUpdated: Date.now()
  });

  // Mock pity systems (should come from Firestore in production)
  const [pityData, setPityData] = useState<Record<string, PitySystem>>({});

  const [openingResult, setOpeningResult] = useState<PackOpeningResult | null>(null);
  const [showPackOpening, setShowPackOpening] = useState(false);

  const handlePurchase = useCallback(
    (pack: CardPack, currency: 'gold' | 'gems' | 'money') => {
      // Get cost
      const cost =
        currency === 'gold'
          ? pack.price.gold
          : currency === 'gems'
          ? pack.price.gems
          : pack.price.realMoney;

      if (!cost) {
        Alert.alert('Error', 'This payment method is not available for this pack');
        return;
      }

      // Check if user can afford
      const canAfford =
        currency === 'gold'
          ? userCurrency.gold >= cost
          : currency === 'gems'
          ? userCurrency.gems >= cost
          : true; // Real money handled by IAP

      if (!canAfford && currency !== 'money') {
        Alert.alert(
          'Insufficient Funds',
          `You need ${cost} ${currency === 'gold' ? 'gold' : 'gems'} to purchase this pack`
        );
        return;
      }

      // Show confirmation
      const costText =
        currency === 'gold'
          ? `${cost} gold`
          : currency === 'gems'
          ? `${cost} gems`
          : `$${(cost / 100).toFixed(2)}`;

      Alert.alert(
        'Confirm Purchase',
        `Purchase ${pack.name} for ${costText}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Purchase',
            onPress: () => processPurchase(pack, currency, cost)
          }
        ]
      );
    },
    [userCurrency]
  );

  const processPurchase = useCallback(
    (pack: CardPack, currency: 'gold' | 'gems' | 'money', cost: number) => {
      // Deduct currency
      if (currency === 'gold') {
        setUserCurrency((prev) => ({
          ...prev,
          gold: prev.gold - cost
        }));
      } else if (currency === 'gems') {
        setUserCurrency((prev) => ({
          ...prev,
          gems: prev.gems - cost
        }));
      }
      // Real money purchases would use IAP here

      // Get or initialize pity data for this pack
      const packPityData =
        pityData[pack.id] || initializePitySystem(user?.uid || '', pack.id);

      // Mock available cards (should come from Firestore in production)
      const availableCards: Card[] = generateMockCards();

      // Open the pack
      const { result, updatedPity } = openPack(pack, packPityData, availableCards);

      // Update pity data
      setPityData((prev) => ({
        ...prev,
        [pack.id]: updatedPity
      }));

      // TODO: Save cards to user's collection in Firestore
      // TODO: Save updated pity data to Firestore
      // TODO: Save purchase history to Firestore

      // Show opening animation
      setOpeningResult(result);
      setShowPackOpening(true);
    },
    [pityData, user]
  );

  const handleClosePackOpening = useCallback(() => {
    setShowPackOpening(false);
    // Don't clear result immediately to avoid UI flash
    setTimeout(() => setOpeningResult(null), 300);
  }, []);

  const packs = Object.values(CARD_PACKS);

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f0f1e', '#1a1a2e']} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>🏪 Card Shop</Text>
          <Text style={styles.subtitle}>Purchase card packs and expand your collection</Text>
        </View>

        {/* Currency Display */}
        <CurrencyDisplay gold={userCurrency.gold} gems={userCurrency.gems} />

        {/* Packs List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {packs.map((pack) => (
            <PackCard
              key={pack.id}
              pack={pack}
              userGold={userCurrency.gold}
              userGems={userCurrency.gems}
              onPurchase={handlePurchase}
            />
          ))}

          {/* Pity System Info */}
          <View style={styles.pityInfo}>
            <Text style={styles.pityTitle}>🎯 Pity System</Text>
            <Text style={styles.pityText}>
              • Guaranteed Epic every 10 packs{'\n'}
              • Guaranteed Legendary every 40 packs{'\n'}
              • Guaranteed Mythic every 100 packs{'\n'}
              {'\n'}
              Your pity counters carry over between packs of the same type!
            </Text>
          </View>
        </ScrollView>

        {/* Pack Opening Modal */}
        <PackOpeningModal
          visible={showPackOpening}
          result={openingResult}
          onClose={handleClosePackOpening}
        />
      </LinearGradient>
    </SafeAreaView>
  );
}

// Mock card generator (should be replaced with real card data from Firestore)
function generateMockCards(): Card[] {
  const rarities: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary' | 'mythic'> = [
    'common',
    'uncommon',
    'rare',
    'epic',
    'legendary',
    'mythic'
  ];

  const types = ['action', 'skill', 'loot'];

  const cards: Card[] = [];

  // Generate 100 mock cards
  for (let i = 0; i < 100; i++) {
    const rarity = rarities[Math.floor(Math.random() * rarities.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    cards.push({
      id: `card_${i}`,
      name: `${rarity.charAt(0).toUpperCase() + rarity.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)} Card`,
      type,
      rarity,
      manaCost: Math.floor(Math.random() * 10) + 1,
      effects: []
    });
  }

  return cards;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e'
  },
  gradient: {
    flex: 1
  },
  header: {
    padding: 20,
    paddingBottom: 12,
    gap: 6
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  subtitle: {
    fontSize: 14,
    color: '#8e8e93',
    lineHeight: 20
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32
  },
  pityInfo: {
    backgroundColor: 'rgba(76, 110, 245, 0.1)',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4c6ef5',
    padding: 16,
    marginTop: 16,
    gap: 8
  },
  pityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  pityText: {
    fontSize: 14,
    color: '#e0e0e0',
    lineHeight: 22
  }
});
