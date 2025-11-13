/**
 * Pack Card Component
 *
 * Displays a card pack with pricing and purchase button
 * Shows sale indicators and featured badges
 */

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence
} from 'react-native-reanimated';
import type { CardPack } from '@/types/shop';
import { mediumImpact } from '@/utils/haptics';

interface PackCardProps {
  pack: CardPack;
  userGold: number;
  userGems: number;
  onPurchase: (pack: CardPack, currency: 'gold' | 'gems' | 'money') => void;
  disabled?: boolean;
}

export function PackCard({
  pack,
  userGold,
  userGems,
  onPurchase,
  disabled = false
}: PackCardProps) {
  const scale = useSharedValue(1);

  const handlePress = (currency: 'gold' | 'gems' | 'money') => {
    if (disabled) return;

    mediumImpact();

    // Bounce animation
    scale.value = withSequence(
      withSpring(0.95, { damping: 10 }),
      withSpring(1, { damping: 8 })
    );

    onPurchase(pack, currency);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const canAffordGold = pack.price.gold ? userGold >= pack.price.gold : false;
  const canAffordGems = pack.price.gems ? userGems >= pack.price.gems : false;

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={pack.gradientColors}
        style={styles.gradient}
      >
        {/* Featured badge */}
        {pack.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>⭐ FEATURED</Text>
          </View>
        )}

        {/* Sale badge */}
        {pack.onSale && (
          <View style={styles.saleBadge}>
            <Text style={styles.saleText}>🔥 SALE</Text>
          </View>
        )}

        {/* Pack icon */}
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{pack.icon}</Text>
        </View>

        {/* Pack name */}
        <Text style={styles.packName}>{pack.name}</Text>

        {/* Description */}
        <Text style={styles.description}>{pack.description}</Text>

        {/* Contents */}
        <View style={styles.contents}>
          <Text style={styles.contentsTitle}>Contains:</Text>
          <View style={styles.contentsList}>
            <View style={styles.contentItem}>
              <Text style={styles.contentIcon}>🎴</Text>
              <Text style={styles.contentText}>{pack.guaranteedCards} cards</Text>
            </View>
            {pack.guaranteedRare > 0 && (
              <View style={styles.contentItem}>
                <Text style={styles.contentIcon}>💎</Text>
                <Text style={styles.contentText}>
                  {pack.guaranteedRare} rare{pack.guaranteedRare > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {pack.guaranteedEpic > 0 && (
              <View style={styles.contentItem}>
                <Text style={styles.contentIcon}>⭐</Text>
                <Text style={styles.contentText}>
                  {pack.guaranteedEpic} epic{pack.guaranteedEpic > 1 ? 's' : ''}
                </Text>
              </View>
            )}
            {pack.guaranteedLegendary > 0 && (
              <View style={styles.contentItem}>
                <Text style={styles.contentIcon}>✨</Text>
                <Text style={styles.contentText}>
                  {pack.guaranteedLegendary} legendary
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Purchase buttons */}
        <View style={styles.purchaseSection}>
          {/* Gold purchase */}
          {pack.price.gold && (
            <Pressable
              style={[
                styles.purchaseButton,
                !canAffordGold && styles.purchaseButtonDisabled
              ]}
              onPress={() => handlePress('gold')}
              disabled={!canAffordGold || disabled}
            >
              <View style={styles.priceRow}>
                <Text style={styles.currencyIcon}>💰</Text>
                <Text style={styles.priceText}>
                  {pack.onSale && pack.salePrice?.gold
                    ? pack.salePrice.gold
                    : pack.price.gold}
                </Text>
              </View>
              {pack.onSale && pack.salePrice?.gold && (
                <Text style={styles.originalPrice}>{pack.price.gold}</Text>
              )}
            </Pressable>
          )}

          {/* Gem purchase */}
          {pack.price.gems && (
            <Pressable
              style={[
                styles.purchaseButton,
                !canAffordGems && styles.purchaseButtonDisabled
              ]}
              onPress={() => handlePress('gems')}
              disabled={!canAffordGems || disabled}
            >
              <View style={styles.priceRow}>
                <Text style={styles.currencyIcon}>💎</Text>
                <Text style={styles.priceText}>
                  {pack.onSale && pack.salePrice?.gems
                    ? pack.salePrice.gems
                    : pack.price.gems}
                </Text>
              </View>
              {pack.onSale && pack.salePrice?.gems && (
                <Text style={styles.originalPrice}>{pack.price.gems}</Text>
              )}
            </Pressable>
          )}

          {/* Real money purchase */}
          {pack.price.realMoney && (
            <Pressable
              style={styles.purchaseButton}
              onPress={() => handlePress('money')}
              disabled={disabled}
            >
              <View style={styles.priceRow}>
                <Text style={styles.currencyIcon}>💵</Text>
                <Text style={styles.priceText}>
                  ${((pack.onSale && pack.salePrice?.realMoney
                    ? pack.salePrice.realMoney
                    : pack.price.realMoney) / 100).toFixed(2)}
                </Text>
              </View>
              {pack.onSale && pack.salePrice?.realMoney && (
                <Text style={styles.originalPrice}>
                  ${(pack.price.realMoney / 100).toFixed(2)}
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  gradient: {
    padding: 20,
    gap: 12
  },
  featuredBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#ffd700',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10
  },
  featuredText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1a1a2e',
    letterSpacing: 0.5
  },
  saleBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#ff4444',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10
  },
  saleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 8
  },
  icon: {
    fontSize: 64
  },
  packName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  description: {
    fontSize: 14,
    color: '#e0e0e0',
    textAlign: 'center',
    lineHeight: 20
  },
  contents: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    gap: 8
  },
  contentsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  contentsList: {
    gap: 6
  },
  contentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  contentIcon: {
    fontSize: 16
  },
  contentText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '500'
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8
  },
  purchaseSection: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  purchaseButton: {
    flex: 1,
    minWidth: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)'
  },
  purchaseButtonDisabled: {
    opacity: 0.4,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  currencyIcon: {
    fontSize: 20
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  originalPrice: {
    fontSize: 12,
    color: '#8e8e93',
    textDecorationLine: 'line-through',
    marginTop: 2
  }
});
