/**
 * Card Detail Modal
 *
 * Shows full card information with effects, stats, and lore
 */

import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { Card, EffectDef, Alignment } from '@rov/types';

interface CardDetailModalProps {
  visible: boolean;
  card: Card | null;
  onClose: () => void;
  onAddToDeck?: (card: Card) => void;
  showDeckButton?: boolean;
}

export function CardDetailModal({
  visible,
  card,
  onClose,
  onAddToDeck,
  showDeckButton = false
}: CardDetailModalProps) {
  if (!card) return null;

  const rarityColor = getRarityColor(card.rarity);
  const alignmentColor = getAlignmentColor(card.alignment);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <LinearGradient
            colors={[rarityColor + '40', rarityColor + '10', '#0f0f1e']}
            style={styles.content}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.title}>{card.name}</Text>
                <View style={styles.headerBadges}>
                  <View style={[styles.deckBadge, { backgroundColor: rarityColor + '40' }]}>
                    <Text style={styles.deckText}>{getDeckIcon(card.deck)}</Text>
                  </View>
                  {card.alignment && (
                    <View style={[styles.alignmentBadge, { backgroundColor: alignmentColor + '40' }]}>
                      <Text style={styles.alignmentText}>
                        {getAlignmentIcon(card.alignment)} {card.alignment}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.rarityBadge, { backgroundColor: rarityColor }]}>
                    <Text style={styles.rarityText}>{card.rarity}</Text>
                  </View>
                </View>
              </View>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
              {/* Card Art */}
              <View style={styles.artContainer}>
                <View style={[styles.artBorder, { borderColor: rarityColor }]}>
                  <LinearGradient
                    colors={[rarityColor + '20', 'transparent']}
                    style={styles.artGradient}
                  >
                    <Text style={styles.artIcon}>{card.art?.iconUrl || '🎴'}</Text>
                  </LinearGradient>
                </View>

                {/* Mana Cost */}
                <View style={styles.manaCostDisplay}>
                  <Text style={styles.manaCostLabel}>Mana Cost</Text>
                  <Text style={styles.manaCostValue}>⚡{card.manaCost || 0}</Text>
                </View>
              </View>

              {/* Card Text */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Card Text</Text>
                <View style={styles.textBox}>
                  <Text style={styles.cardText}>{card.text}</Text>
                </View>
              </View>

              {/* Effects */}
              {card.effects && card.effects.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Effects ({card.effects.length})</Text>
                  {card.effects.map((effect, index) => (
                    <EffectRow key={index} effect={effect} index={index} />
                  ))}
                </View>
              )}

              {/* Tags */}
              {card.tags && card.tags.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Tags</Text>
                  <View style={styles.tagsContainer}>
                    {card.tags.map(tag => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Portable */}
              <View style={styles.section}>
                <View style={styles.portableRow}>
                  <Text style={styles.portableLabel}>Portable (Adventure Mode):</Text>
                  <Text style={[
                    styles.portableValue,
                    { color: card.portable ? '#22c55e' : '#ef4444' }
                  ]}>
                    {card.portable ? '✅ Yes' : '❌ No'}
                  </Text>
                </View>
              </View>

              {/* Card ID (Debug) */}
              <View style={styles.debugSection}>
                <Text style={styles.debugText}>ID: {card.id}</Text>
              </View>
            </ScrollView>

            {/* Actions */}
            <View style={styles.actions}>
              {showDeckButton && onAddToDeck && (
                <Pressable
                  style={styles.addButton}
                  onPress={() => onAddToDeck(card)}
                >
                  <LinearGradient
                    colors={['#4488ff', '#2244cc']}
                    style={styles.addButtonGradient}
                  >
                    <Text style={styles.addButtonText}>➕ Add to Deck</Text>
                  </LinearGradient>
                </Pressable>
              )}

              <Pressable style={styles.closeButtonBottom} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ============================================================================
// Effect Row Component
// ============================================================================

interface EffectRowProps {
  effect: EffectDef;
  index: number;
}

function EffectRow({ effect, index }: EffectRowProps) {
  const icon = getEffectIcon(effect.type);
  const description = getEffectDescription(effect);

  return (
    <View style={styles.effectRow}>
      <View style={styles.effectIcon}>
        <Text style={styles.effectIconText}>{icon}</Text>
      </View>
      <View style={styles.effectContent}>
        <Text style={styles.effectType}>{formatEffectType(effect.type)}</Text>
        <Text style={styles.effectDescription}>{description}</Text>
      </View>
    </View>
  );
}

function getEffectIcon(type: string): string {
  const icons: Record<string, string> = {
    damage: '⚔️',
    heal: '💚',
    draw: '🃏',
    buff: '⬆️',
    debuff: '⬇️',
    instantCancel: '🚫',
    gainRenown: '🏆',
    gainGold: '💰',
    gainXP: '⭐',
    gainTempMana: '💧',
    gainTempHP: '❤️',
    stealRandom: '🎭',
    discardRandom: '🗑️',
    destroyPersistent: '💥',
    equipLoot: '🎒'
  };
  return icons[type] || '✨';
}

function formatEffectType(type: string): string {
  return type
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

function getEffectDescription(effect: EffectDef): string {
  switch (effect.type) {
    case 'damage':
      return `Deal ${effect.amount} damage${effect.scaling ? ` (+scaling)` : ''}`;
    case 'heal':
      return `Heal ${effect.amount} HP${effect.scaling ? ` (+scaling)` : ''}`;
    case 'draw':
      return `Draw ${effect.amount} card(s) from ${effect.deck} deck`;
    case 'buff':
      return `+${effect.amount} ${effect.stat} (${effect.duration || 'battle'})`;
    case 'debuff':
      return `-${effect.amount} ${effect.stat} (${effect.duration || 'battle'})`;
    case 'instantCancel':
      return 'Cancel target effect';
    case 'gainTempMana':
      return `Gain ${effect.amount} temporary Mana`;
    case 'gainTempHP':
      return `Gain ${effect.amount} temporary HP`;
    case 'gainRenown':
      return `Gain ${effect.amount} Renown`;
    case 'gainGold':
      return `Gain ${effect.amount} Gold`;
    case 'gainXP':
      return `Gain ${effect.amount} XP`;
    case 'discardRandom':
      return `Discard ${effect.amount} random card(s) (${effect.who})`;
    case 'destroyPersistent':
      return `Destroy ${effect.target || 'any'} persistent effect`;
    default:
      return JSON.stringify(effect);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function getRarityColor(rarity: string): string {
  const colors: Record<string, string> = {
    Common: '#9ca3af',
    Uncommon: '#22c55e',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b'
  };
  return colors[rarity] || '#666666';
}

function getAlignmentColor(alignment?: Alignment): string {
  if (!alignment) return '#666666';

  const colors: Record<Alignment, string> = {
    Holy: '#FFD700',
    Chaos: '#ff4444',
    Arcane: '#8b5cf6',
    Neutral: '#8e8e93'
  };
  return colors[alignment];
}

function getDeckIcon(deck: string): string {
  const icons: Record<string, string> = {
    Action: '🎴',
    Skill: '✨',
    Loot: '💎',
    Boss: '👑',
    Summon: '🐉',
    Renown: '🏆',
    Quest: '📜',
    Class: '🎭'
  };
  return icons[deck] || '🎴';
}

function getAlignmentIcon(alignment: Alignment): string {
  const icons: Record<Alignment, string> = {
    Holy: '☀️',
    Chaos: '🔥',
    Arcane: '🔮',
    Neutral: '⚖️'
  };
  return icons[alignment];
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'flex-end'
  },
  container: {
    maxHeight: '95%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden'
  },
  content: {
    padding: 20,
    paddingBottom: 32
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
  },
  headerLeft: {
    flex: 1
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap'
  },
  deckBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  deckText: {
    fontSize: 16
  },
  alignmentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center'
  },
  alignmentText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600'
  },
  rarityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12
  },
  rarityText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeIcon: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  scrollView: {
    maxHeight: 500
  },
  artContainer: {
    alignItems: 'center',
    marginBottom: 24
  },
  artBorder: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 3,
    overflow: 'hidden',
    marginBottom: 16
  },
  artGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  artIcon: {
    fontSize: 96
  },
  manaCostDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#FFD700'
  },
  manaCostLabel: {
    fontSize: 14,
    color: '#8e8e93',
    fontWeight: '600'
  },
  manaCostValue: {
    fontSize: 20,
    color: '#FFD700',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 20
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  textBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a4e'
  },
  cardText: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20
  },
  effectRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4488ff'
  },
  effectIcon: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  effectIconText: {
    fontSize: 20
  },
  effectContent: {
    flex: 1
  },
  effectType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4488ff',
    marginBottom: 4
  },
  effectDescription: {
    fontSize: 13,
    color: '#ffffff'
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4488ff'
  },
  tagText: {
    fontSize: 12,
    color: '#4488ff',
    fontWeight: '600'
  },
  portableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 8
  },
  portableLabel: {
    fontSize: 14,
    color: '#8e8e93'
  },
  portableValue: {
    fontSize: 14,
    fontWeight: 'bold'
  },
  debugSection: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#3a3a4e'
  },
  debugText: {
    fontSize: 11,
    color: '#5e5e6e',
    fontFamily: 'monospace'
  },
  actions: {
    marginTop: 16,
    gap: 12
  },
  addButton: {
    borderRadius: 12,
    overflow: 'hidden'
  },
  addButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center'
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  closeButtonBottom: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 2,
    borderColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center'
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ef4444'
  }
});
