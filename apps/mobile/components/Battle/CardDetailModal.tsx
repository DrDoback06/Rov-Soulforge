/**
 * Card Detail Modal
 *
 * Full card information display with:
 * - Card art and name
 * - Mana cost and type
 * - Complete effect description
 * - Flavor text
 * - Rarity and stats
 */

import { Modal, View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import type { Card } from '@rov/types';

interface CardDetailModalProps {
  visible: boolean;
  card: Card | null;
  onClose: () => void;
  onPlay?: () => void;
  canPlay?: boolean;
}

export function CardDetailModal({
  visible,
  card,
  onClose,
  onPlay,
  canPlay = false
}: CardDetailModalProps) {
  if (!card) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={70} style={styles.backdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose}>
          <Pressable
            style={styles.modalContainer}
            onPress={(e) => e.stopPropagation()}
          >
            <Animated.View entering={ZoomIn.duration(300)} style={styles.modal}>
              <LinearGradient
                colors={getCardGradient(card.rarity)}
                style={styles.modalGradient}
              >
                {/* Close button */}
                <Pressable style={styles.closeButton} onPress={onClose}>
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>

                <ScrollView
                  style={styles.scrollView}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Card Art */}
                  <View style={styles.artContainer}>
                    <View style={styles.art}>
                      <Text style={styles.artIcon}>{getCardIcon(card.type)}</Text>
                    </View>

                    {/* Mana cost badge */}
                    <View style={styles.manaBadge}>
                      <Text style={styles.manaText}>{card.manaCost || 0}</Text>
                    </View>
                  </View>

                  {/* Card name */}
                  <View style={styles.nameContainer}>
                    <Text style={styles.cardName}>{card.name}</Text>
                    <View style={styles.typeRow}>
                      <Text style={styles.cardType}>
                        {formatCardType(card.type)}
                      </Text>
                      <View style={styles.rarityBadge}>
                        <Text style={styles.rarityText}>
                          {getRaritySymbol(card.rarity)} {card.rarity.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Divider */}
                  <View style={styles.divider} />

                  {/* Effect description */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Effect</Text>
                    <View style={styles.effectBox}>
                      {card.effects?.map((effect, index) => (
                        <View key={index} style={styles.effectItem}>
                          <Text style={styles.effectIcon}>
                            {getEffectIcon(effect.type)}
                          </Text>
                          <Text style={styles.effectText}>
                            {effect.description || formatEffect(effect)}
                          </Text>
                        </View>
                      ))}
                      {(!card.effects || card.effects.length === 0) && (
                        <Text style={styles.noEffectText}>
                          No special effects
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Stats (if applicable) */}
                  {(card.attack !== undefined || card.defense !== undefined) && (
                    <View style={styles.section}>
                      <Text style={styles.sectionTitle}>Stats</Text>
                      <View style={styles.statsRow}>
                        {card.attack !== undefined && (
                          <View style={styles.statBadge}>
                            <Text style={styles.statLabel}>⚔️ ATK</Text>
                            <Text style={styles.statValue}>{card.attack}</Text>
                          </View>
                        )}
                        {card.defense !== undefined && (
                          <View style={styles.statBadge}>
                            <Text style={styles.statLabel}>🛡️ DEF</Text>
                            <Text style={styles.statValue}>{card.defense}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Flavor text */}
                  {card.flavorText && (
                    <View style={styles.section}>
                      <View style={styles.flavorBox}>
                        <Text style={styles.flavorText}>"{card.flavorText}"</Text>
                      </View>
                    </View>
                  )}

                  {/* Card ID (debug) */}
                  <View style={styles.footer}>
                    <Text style={styles.footerText}>ID: {card.id}</Text>
                  </View>
                </ScrollView>

                {/* Action buttons */}
                <View style={styles.actions}>
                  {canPlay && onPlay && (
                    <Pressable style={styles.playButton} onPress={onPlay}>
                      <LinearGradient
                        colors={['#22c55e', '#16a34a']}
                        style={styles.playButtonGradient}
                      >
                        <Text style={styles.playButtonText}>▶ Play Card</Text>
                      </LinearGradient>
                    </Pressable>
                  )}

                  <Pressable style={styles.closeActionButton} onPress={onClose}>
                    <Text style={styles.closeActionButtonText}>Close</Text>
                  </Pressable>
                </View>
              </LinearGradient>
            </Animated.View>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

function getCardGradient(rarity: string): string[] {
  const gradients: Record<string, string[]> = {
    common: ['#4a5568', '#2d3748'],
    uncommon: ['#2f855a', '#22543d'],
    rare: ['#2b6cb0', '#2c5282'],
    epic: ['#805ad5', '#6b46c1'],
    legendary: ['#d69e2e', '#b7791f'],
    mythic: ['#e53e3e', '#c53030']
  };
  return gradients[rarity] || gradients.common;
}

function getCardIcon(type: string): string {
  const icons: Record<string, string> = {
    action: '⚔️',
    skill: '✨',
    loot: '🎁',
    creature: '🐉',
    spell: '🔮',
    artifact: '⚡'
  };
  return icons[type] || '🎴';
}

function getRaritySymbol(rarity: string): string {
  const symbols: Record<string, string> = {
    common: '○',
    uncommon: '◇',
    rare: '◆',
    epic: '★',
    legendary: '✦',
    mythic: '✧'
  };
  return symbols[rarity] || '○';
}

function getEffectIcon(type: string): string {
  const icons: Record<string, string> = {
    damage: '⚔️',
    heal: '💚',
    draw: '🃏',
    discard: '🗑️',
    buff: '⬆️',
    debuff: '⬇️',
    destroy: '💥',
    summon: '🐉',
    transform: '🔄',
    counter: '🚫'
  };
  return icons[type] || '✨';
}

function formatCardType(type: string): string {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatEffect(effect: any): string {
  // Fallback formatting if no description is provided
  if (effect.damage) {
    return `Deal ${effect.damage} damage`;
  }
  if (effect.heal) {
    return `Heal ${effect.heal} HP`;
  }
  if (effect.draw) {
    return `Draw ${effect.draw} card(s)`;
  }
  return effect.type || 'Unknown effect';
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  backdropPressable: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%'
  },
  modal: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.4)'
  },
  modalGradient: {
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10
  },
  closeButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  scrollView: {
    maxHeight: 600
  },
  scrollContent: {
    padding: 20,
    gap: 16
  },
  artContainer: {
    position: 'relative',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  art: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  artIcon: {
    fontSize: 120
  },
  manaBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#4c6ef5',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5
  },
  manaText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  nameContainer: {
    gap: 6
  },
  cardName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4
  },
  typeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  cardType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.8
  },
  rarityBadge: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  rarityText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffd700'
  },
  divider: {
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 8
  },
  section: {
    gap: 8
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  effectBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8
  },
  effectItem: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start'
  },
  effectIcon: {
    fontSize: 20
  },
  effectText: {
    flex: 1,
    fontSize: 15,
    color: '#ffffff',
    lineHeight: 22
  },
  noEffectText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic'
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12
  },
  statBadge: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)'
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93',
    marginBottom: 4
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  flavorBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(255, 255, 255, 0.3)',
    padding: 12
  },
  flavorText: {
    fontSize: 14,
    color: '#8e8e93',
    fontStyle: 'italic',
    lineHeight: 20
  },
  footer: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  footerText: {
    fontSize: 11,
    color: '#5e5e6e',
    fontFamily: 'monospace'
  },
  actions: {
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)'
  },
  playButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  playButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center'
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  closeActionButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  closeActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  }
});
