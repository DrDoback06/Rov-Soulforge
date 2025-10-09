import { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Rarity } from '@rov/types';

export interface StandardCardProps {
  card: {
    id: string;
    name: string;
    type?: string;
    rarity: Rarity | string;
    image?: string;
    description?: string;
    cost?: number;
    hp?: number;
    attack?: number;
    count?: number;
    physicalOnly?: boolean;
  };
  size?: 'small' | 'medium';
  disabled?: boolean;
  onPress?: () => void;
  onHover?: (card: any | null) => void;
  showHoverPreview?: boolean;
}

/**
 * StandardCard - Unified card component for all tabs
 * Rectangle shape matching the Diablo II-style from inventory
 */
export function StandardCard({
  card,
  size = 'small',
  disabled = false,
  onPress,
  onHover,
  showHoverPreview = true
}: StandardCardProps) {
  const [isHoverLocked, setIsHoverLocked] = useState(false);

  const handlePress = () => {
    if (disabled) return;

    if (onPress) {
      onPress();
    }

    // Mobile: Tap to lock/unlock hover
    if (showHoverPreview && onHover) {
      if (isHoverLocked) {
        setIsHoverLocked(false);
        onHover(null);
      } else {
        setIsHoverLocked(true);
        onHover(card);
      }
    }
  };

  const handleMouseEnter = () => {
    // Desktop: Hover to show (only if not locked)
    if (showHoverPreview && onHover && !isHoverLocked && !disabled) {
      onHover(card);
    }
  };

  const handleMouseLeave = () => {
    // Desktop: Leave to hide (only if not locked)
    if (showHoverPreview && onHover && !isHoverLocked) {
      onHover(null);
    }
  };

  const cardWidth = size === 'small' ? 56 : 80;
  const cardHeight = size === 'small' ? 80 : 112;

  return (
    <Pressable
      style={[
        styles.cardIcon,
        { width: cardWidth, height: cardHeight },
        isHoverLocked && styles.cardIconLocked,
        disabled && styles.cardIconDisabled
      ]}
      onPress={handlePress}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      disabled={disabled}
    >
      <LinearGradient
        colors={[getRarityColor(card.rarity) + '40', getRarityColor(card.rarity) + '10']}
        style={styles.cardIconGradient}
      >
        {/* Card Icon/Image */}
        <Text style={[styles.cardIconImage, size === 'medium' && styles.cardIconImageMedium]}>
          {card.image || '🃏'}
        </Text>

        {/* Stack Count */}
        {card.count && card.count > 1 && (
          <View style={styles.stackBadge}>
            <Text style={styles.stackCount}>×{card.count}</Text>
          </View>
        )}

        {/* Rarity Border */}
        <View style={[styles.cardIconBorder, { borderColor: getRarityColor(card.rarity) }]} />

        {/* Unusable indicator */}
        {card.physicalOnly && (
          <View style={styles.unusableDot} />
        )}

        {/* Locked indicator */}
        {isHoverLocked && (
          <View style={styles.lockedIndicator}>
            <Text style={styles.lockedIcon}>📌</Text>
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

/**
 * Card Hover Preview - Large tooltip (Diablo II style)
 */
export function CardHoverPreview({ card }: { card: any | null }) {
  if (!card) return null;

  return (
    <View style={styles.hoverPreview}>
      <LinearGradient
        colors={[getRarityColor(card.rarity) + '30', '#1a1a2e']}
        style={styles.previewCard}
      >
        {/* Card Header */}
        <View style={styles.previewHeader}>
          <Text style={[styles.previewName, { color: getRarityColor(card.rarity) }]}>
            {card.name}
          </Text>
          <View style={styles.previewRarityBadge}>
            <Text style={[styles.previewRarity, { color: getRarityColor(card.rarity) }]}>
              {card.rarity}
            </Text>
          </View>
        </View>

        {/* Card Icon/Image */}
        <View style={styles.previewIconContainer}>
          <Text style={styles.previewIcon}>{card.image || '🃏'}</Text>
        </View>

        {/* Card Type & Cost */}
        <View style={styles.previewMeta}>
          <Text style={styles.previewType}>{card.type || 'Unknown'}</Text>
          {card.cost !== undefined && (
            <Text style={styles.previewCost}>⚡ {card.cost} Mana</Text>
          )}
        </View>

        {/* Card Description */}
        {card.description && (
          <>
            <View style={styles.previewDivider} />
            <Text style={styles.previewDescription}>{card.description}</Text>
          </>
        )}

        {/* Additional Stats (if applicable) */}
        {(card.hp || card.attack) && (
          <>
            <View style={styles.previewDivider} />
            <View style={styles.previewStats}>
              {card.hp && (
                <Text style={styles.previewStat}>❤️ HP: {card.hp}</Text>
              )}
              {card.attack && (
                <Text style={styles.previewStat}>⚔️ ATK: {card.attack}</Text>
              )}
            </View>
          </>
        )}

        {/* Stack Count */}
        {card.count && (
          <>
            <View style={styles.previewDivider} />
            <Text style={styles.previewStack}>You own: ×{card.count}</Text>
          </>
        )}

        {/* App Usability Status */}
        {card.physicalOnly && (
          <View style={styles.unusableWarning}>
            <Text style={styles.unusableText}>⚠️ Physical Card Game Only</Text>
            <Text style={styles.unusableSubtext}>Can be traded for dust</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

function getRarityColor(rarity: Rarity | string): string {
  const colors: Record<string, string> = {
    Common: '#ffffff',
    Uncommon: '#00ff00',
    Rare: '#0088ff',
    Epic: '#ff00ff',
    Legendary: '#ffd700',
    Mythic: '#ff6b00'
  };
  return colors[rarity] || '#ffffff';
}

const styles = StyleSheet.create({
  // Card Icon (Small, Diablo II style)
  cardIcon: {
    position: 'relative'
  },
  cardIconLocked: {
    transform: [{ scale: 1.05 }],
    elevation: 5,
    shadowColor: '#4488ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8
  },
  cardIconDisabled: {
    opacity: 0.5
  },
  cardIconGradient: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4
  },
  cardIconImage: {
    fontSize: 32
  },
  cardIconImageMedium: {
    fontSize: 48
  },
  cardIconBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 2,
    borderRadius: 8,
    pointerEvents: 'none'
  },
  stackBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ffd700'
  },
  stackCount: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  unusableDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4444'
  },
  lockedIndicator: {
    position: 'absolute',
    top: 2,
    left: 2,
    backgroundColor: '#4488ff',
    borderRadius: 8,
    padding: 2
  },
  lockedIcon: {
    fontSize: 10
  },

  // Hover Preview (Large card tooltip)
  hoverPreview: {
    position: 'absolute',
    top: 120,
    right: 16,
    width: 320,
    zIndex: 1000,
    elevation: 10
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: '#ffd700'
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  previewName: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1
  },
  previewRarityBadge: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  previewRarity: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  previewIconContainer: {
    alignItems: 'center',
    marginVertical: 16
  },
  previewIcon: {
    fontSize: 80
  },
  previewMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  previewType: {
    fontSize: 14,
    color: '#8e8e93',
    textTransform: 'uppercase',
    fontWeight: '600'
  },
  previewCost: {
    fontSize: 14,
    color: '#4488ff',
    fontWeight: '600'
  },
  previewDivider: {
    height: 1,
    backgroundColor: '#4a4a5e',
    marginVertical: 12
  },
  previewDescription: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20
  },
  previewStats: {
    flexDirection: 'row',
    gap: 16
  },
  previewStat: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '600'
  },
  previewStack: {
    fontSize: 14,
    color: '#ffd700',
    fontWeight: '600',
    textAlign: 'center'
  },
  unusableWarning: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 68, 68, 0.2)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ff4444'
  },
  unusableText: {
    fontSize: 14,
    color: '#ff4444',
    fontWeight: '600',
    marginBottom: 4
  },
  unusableSubtext: {
    fontSize: 12,
    color: '#ff8888'
  }
});
