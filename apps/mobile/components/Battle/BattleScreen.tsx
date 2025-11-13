/**
 * Battle Screen
 *
 * Main battle interface integrating all battle components:
 * - Player and opponent status displays
 * - Turn timer
 * - Deck visualizations
 * - The Stack
 * - Battlefield effects
 * - Player hand
 * - Battle log
 * - Floating damage numbers
 * - Action buttons
 */

import { View, Text, StyleSheet, ScrollView, Pressable, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useCallback } from 'react';
import type { Card } from '@rov/types';

import { PlayerStatus } from './PlayerStatus';
import { TurnTimer } from './TurnTimer';
import { DeckVisualization } from './DeckVisualization';
import { StackPanel } from './StackPanel';
import { Battlefield } from './Battlefield';
import { Hand } from './Hand';
import { BattleLog } from './BattleLog';
import { FloatingNumbersContainer, useFloatingNumbers } from './FloatingNumber';
import { CardDetailModal } from './CardDetailModal';
import { BattleResultModal } from './BattleResultModal';

import { useBattle } from '@/hooks/useBattle';
import { useAuth } from '@/hooks/useAuth';
import { heavyImpact } from '@/utils/haptics';

interface BattleScreenProps {
  battleId: string;
  onExit?: () => void;
}

export function BattleScreen({ battleId, onExit }: BattleScreenProps) {
  const { user } = useAuth();
  const {
    battle,
    isLoading,
    myPlayerState,
    opponentState,
    isMyTurn,
    playCard,
    passTurn,
    surrender,
    isExecuting
  } = useBattle(battleId);

  const { numbers, addNumber, removeNumber } = useFloatingNumbers();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [showBattleLog, setShowBattleLog] = useState(false);

  // Calculate turn time remaining
  const getTurnTimeRemaining = useCallback(() => {
    if (!battle) return 60;
    const elapsed = (Date.now() - battle.turnStartedAt) / 1000;
    return Math.max(0, battle.turnTimeLimit - elapsed);
  }, [battle]);

  const handleCardPlay = useCallback(
    (card: Card, index: number) => {
      if (!isMyTurn || isExecuting) return;

      heavyImpact();
      playCard(card.id);

      // Add floating number for mana cost
      if (card.manaCost) {
        addNumber(card.manaCost, 'mana', 200, 400);
      }
    },
    [isMyTurn, isExecuting, playCard, addNumber]
  );

  const handlePassTurn = useCallback(() => {
    if (!isMyTurn || isExecuting) return;
    heavyImpact();
    passTurn();
  }, [isMyTurn, isExecuting, passTurn]);

  const handleSurrender = useCallback(() => {
    if (isExecuting) return;
    heavyImpact();
    surrender();
  }, [isExecuting, surrender]);

  const handleCardView = useCallback((card: Card) => {
    setSelectedCard(card);
  }, []);

  if (isLoading || !battle || !myPlayerState) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading battle...</Text>
      </SafeAreaView>
    );
  }

  const isBattleOver = battle.status === 'completed';
  const myVictory = battle.winnerIds?.includes(user?.uid || '');

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={['#0f0f1e', '#1a1a2e']} style={styles.gradient}>
        {/* Floating numbers overlay */}
        <FloatingNumbersContainer numbers={numbers} onNumberComplete={removeNumber} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Opponent Section */}
          <View style={styles.opponentSection}>
            {opponentState && (
              <>
                <PlayerStatus
                  playerId={opponentState.userId || 'AI'}
                  playerName={opponentState.username || 'Opponent'}
                  hp={opponentState.hp}
                  maxHp={opponentState.maxHp}
                  mana={opponentState.mana}
                  maxMana={opponentState.maxMana}
                  lives={opponentState.lives}
                  isActive={!isMyTurn}
                  isOpponent={true}
                  buffsCount={opponentState.buffs?.length || 0}
                  debuffsCount={opponentState.debuffs?.length || 0}
                />

                {/* Opponent's decks */}
                <DeckVisualization
                  actionDeck={opponentState.actionDeck || []}
                  skillDeck={opponentState.skillDeck || []}
                  lootDeck={opponentState.lootDeck || []}
                  actionDiscard={opponentState.actionDiscard || []}
                  skillDiscard={opponentState.skillDiscard || []}
                  lootDiscard={opponentState.lootDiscard || []}
                  isOpponent={true}
                  disabled={true}
                />
              </>
            )}
          </View>

          {/* Turn Timer */}
          <TurnTimer
            timeRemaining={getTurnTimeRemaining()}
            totalTime={battle.turnTimeLimit}
            isMyTurn={isMyTurn}
            isPaused={isBattleOver}
          />

          {/* Battlefield Effects */}
          <Battlefield
            playerEffects={myPlayerState.battlefield || []}
            opponentEffects={opponentState?.battlefield || []}
            globalEffects={[]}
          />

          {/* The Stack */}
          <StackPanel
            stack={battle.stack || []}
            canRespond={isMyTurn && !isExecuting}
          />

          {/* Player Section */}
          <View style={styles.playerSection}>
            <PlayerStatus
              playerId={myPlayerState.userId}
              playerName={myPlayerState.username}
              hp={myPlayerState.hp}
              maxHp={myPlayerState.maxHp}
              mana={myPlayerState.mana}
              maxMana={myPlayerState.maxMana}
              lives={myPlayerState.lives}
              isActive={isMyTurn}
              buffsCount={myPlayerState.buffs?.length || 0}
              debuffsCount={myPlayerState.debuffs?.length || 0}
            />

            {/* Player's decks */}
            <DeckVisualization
              actionDeck={myPlayerState.actionDeck || []}
              skillDeck={myPlayerState.skillDeck || []}
              lootDeck={myPlayerState.lootDeck || []}
              actionDiscard={myPlayerState.actionDiscard || []}
              skillDiscard={myPlayerState.skillDiscard || []}
              lootDiscard={myPlayerState.lootDiscard || []}
              disabled={!isMyTurn || isExecuting}
            />
          </View>

          {/* Player Hand */}
          <Hand
            cards={myPlayerState.hand || []}
            onCardPlay={handleCardPlay}
            onCardView={handleCardView}
            disabled={!isMyTurn || isExecuting}
            maxHandSize={myPlayerState.maxHandSize}
          />

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable
              style={[styles.actionButton, styles.logButton]}
              onPress={() => setShowBattleLog(!showBattleLog)}
            >
              <Text style={styles.actionButtonText}>
                📜 Log ({battle.battleLog?.length || 0})
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.actionButton,
                styles.passTurnButton,
                (!isMyTurn || isExecuting) && styles.actionButtonDisabled
              ]}
              onPress={handlePassTurn}
              disabled={!isMyTurn || isExecuting}
            >
              <Text style={styles.actionButtonText}>⏭️ Pass Turn</Text>
            </Pressable>

            <Pressable
              style={[styles.actionButton, styles.surrenderButton]}
              onPress={handleSurrender}
              disabled={isExecuting}
            >
              <Text style={styles.actionButtonText}>🏳️ Surrender</Text>
            </Pressable>
          </View>

          {/* Battle Log (collapsible) */}
          {showBattleLog && (
            <View style={styles.battleLogContainer}>
              <BattleLog log={battle.battleLog || []} expanded={true} />
            </View>
          )}
        </ScrollView>

        {/* Card Detail Modal */}
        <CardDetailModal
          visible={!!selectedCard}
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
          onPlay={
            selectedCard
              ? () => {
                  const index = myPlayerState.hand?.findIndex(
                    (c) => c.id === selectedCard.id
                  );
                  if (index !== undefined && index >= 0) {
                    handleCardPlay(selectedCard, index);
                    setSelectedCard(null);
                  }
                }
              : undefined
          }
          canPlay={isMyTurn && !isExecuting}
        />

        {/* Battle Result Modal */}
        {isBattleOver && (
          <BattleResultModal
            visible={true}
            victory={myVictory}
            rewards={{
              battleId: battle.id,
              userId: user?.uid || '',
              victory: myVictory,
              gold: 100, // TODO: Get from battle rewards
              xp: 50,
              items: [],
              damageDealt: 0,
              damageTaken: 0,
              cardsPlayed: 0,
              turnsTaken: battle.turnNumber,
              timeElapsed: Math.floor(
                ((battle.completedAt || Date.now()) - battle.createdAt) / 1000
              )
            }}
            onClose={onExit || (() => {})}
          />
        )}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f1e'
  },
  gradient: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f1e'
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: '600'
  },
  scrollView: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    gap: 16,
    paddingBottom: 32
  },
  opponentSection: {
    gap: 12
  },
  playerSection: {
    gap: 12
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)'
  },
  logButton: {
    backgroundColor: '#4c6ef5'
  },
  passTurnButton: {
    backgroundColor: '#22c55e'
  },
  surrenderButton: {
    backgroundColor: '#f03e3e'
  },
  actionButtonDisabled: {
    opacity: 0.4
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  battleLogContainer: {
    marginTop: 8
  }
});
