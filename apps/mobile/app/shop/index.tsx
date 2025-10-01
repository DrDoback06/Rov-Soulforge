import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { useCharacter } from '@/hooks/useCharacter';
import { useFirebase } from '@/lib/firebase-context';
import { httpsCallable } from 'firebase/functions';

/**
 * Shop Screen - Purchase card packs
 */
export default function ShopScreen() {
  const { character, loading } = useCharacter();
  const { functions } = useFirebase();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const packs = [
    {
      id: 'basic-pack',
      name: 'Basic Pack',
      description: '10 cards with guaranteed Common or better',
      cost: 750,
      icon: '📦',
      odds: {
        Common: '70%',
        Uncommon: '20%',
        Rare: '8%',
        Epic: '1.5%',
        Legendary: '0.5%'
      }
    },
    {
      id: 'premium-pack',
      name: 'Premium Pack',
      description: '10 cards with guaranteed Rare or better',
      cost: 1500,
      icon: '🎁',
      odds: {
        Common: '40%',
        Uncommon: '35%',
        Rare: '18%',
        Epic: '5%',
        Legendary: '2%'
      }
    },
    {
      id: 'legendary-pack',
      name: 'Legendary Pack',
      description: '10 cards with guaranteed Epic or better',
      cost: 3000,
      icon: '💎',
      odds: {
        Rare: '30%',
        Epic: '50%',
        Legendary: '20%'
      }
    }
  ];

  const handlePurchase = async (packId: string, cost: number) => {
    if (!character || character.gold < cost) {
      return;
    }

    setPurchasing(packId);

    try {
      const purchasePackFn = httpsCallable(functions, 'purchasePackWithGold');
      await purchasePackFn({ packId });

      // Navigate to pack opening
      router.push(`/shop/pack-opening?packId=${packId}`);
    } catch (error: any) {
      console.error('Purchase failed:', error);
      alert(error.message || 'Purchase failed');
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Shop</Text>
        <View style={styles.goldDisplay}>
          <Text style={styles.goldIcon}>💰</Text>
          <Text style={styles.goldAmount}>{character?.gold || 0}</Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Card Packs</Text>

        {packs.map((pack) => (
          <PackCard
            key={pack.id}
            pack={pack}
            canAfford={(character?.gold || 0) >= pack.cost}
            isPurchasing={purchasing === pack.id}
            onPurchase={() => handlePurchase(pack.id, pack.cost)}
          />
        ))}

        {/* Pity System Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎯 Pity System</Text>
          <Text style={styles.infoText}>
            Guaranteed Rare or better card every 3 packs!
          </Text>
          <Text style={styles.infoSubtext}>
            Your pity counter: 2/3
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function PackCard({
  pack,
  canAfford,
  isPurchasing,
  onPurchase
}: {
  pack: any;
  canAfford: boolean;
  isPurchasing: boolean;
  onPurchase: () => void;
}) {
  return (
    <Pressable
      style={[styles.packCard, !canAfford && styles.packCardDisabled]}
      onPress={onPurchase}
      disabled={!canAfford || isPurchasing}
    >
      <LinearGradient
        colors={canAfford ? ['#2a2a3e', '#1a1a2e'] : ['#1a1a1a', '#0a0a0a']}
        style={styles.packCardGradient}
      >
        <View style={styles.packHeader}>
          <Text style={styles.packIcon}>{pack.icon}</Text>
          <View style={styles.packInfo}>
            <Text style={styles.packName}>{pack.name}</Text>
            <Text style={styles.packDescription}>{pack.description}</Text>
          </View>
        </View>

        {/* Odds */}
        <View style={styles.oddsContainer}>
          <Text style={styles.oddsTitle}>Drop Rates:</Text>
          <View style={styles.oddsList}>
            {Object.entries(pack.odds).map(([rarity, chance]) => (
              <View key={rarity} style={styles.oddsItem}>
                <Text style={[styles.oddsRarity, { color: getRarityColor(rarity) }]}>
                  {rarity}
                </Text>
                <Text style={styles.oddsChance}>{chance as string}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Purchase button */}
        <View style={styles.packFooter}>
          <View style={styles.costBadge}>
            <Text style={styles.costIcon}>💰</Text>
            <Text style={styles.costAmount}>{pack.cost}</Text>
          </View>

          {isPurchasing ? (
            <ActivityIndicator size="small" color="#4488ff" />
          ) : (
            <View style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}>
              <Text style={styles.buyButtonText}>
                {canAfford ? 'Purchase' : 'Not Enough Gold'}
              </Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700'
  };
  return colors[rarity] || '#ffffff';
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingHorizontal: 16,
    paddingBottom: 16
  },
  backButton: {
    padding: 8
  },
  backButtonText: {
    color: '#4488ff',
    fontSize: 16,
    fontWeight: '600'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    textAlign: 'center'
  },
  goldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a3e',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6
  },
  goldIcon: {
    fontSize: 16
  },
  goldAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16
  },
  packCard: {
    marginBottom: 16
  },
  packCardDisabled: {
    opacity: 0.6
  },
  packCardGradient: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  packHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  packIcon: {
    fontSize: 48,
    marginRight: 16
  },
  packInfo: {
    flex: 1
  },
  packName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  packDescription: {
    fontSize: 14,
    color: '#8e8e93'
  },
  oddsContainer: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12
  },
  oddsTitle: {
    fontSize: 12,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  oddsList: {
    gap: 6
  },
  oddsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  oddsRarity: {
    fontSize: 14,
    fontWeight: '600'
  },
  oddsChance: {
    fontSize: 14,
    color: '#8e8e93'
  },
  packFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffd700',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 6
  },
  costIcon: {
    fontSize: 18
  },
  costAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a2e'
  },
  buyButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20
  },
  buyButtonDisabled: {
    backgroundColor: '#2a2a3e'
  },
  buyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  infoCard: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#4488ff'
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  infoText: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 4
  },
  infoSubtext: {
    fontSize: 12,
    color: '#8e8e93'
  }
});
