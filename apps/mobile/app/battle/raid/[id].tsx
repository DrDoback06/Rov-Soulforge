import { View, Text, StyleSheet, Pressable, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState, useEffect } from 'react';
import { useBattle } from '@/hooks/useBattle';
import { BattleHand } from '@/components/BattleHand';
import { StackPanel } from '@/components/StackPanel';
import { DiceRoller } from '@/components/DiceRoller';
import type { BossRaidPhase } from '@/types/party';

/**
 * Boss Raid Screen
 * 
 * 1-4 player co-op boss battles with:
 * - Phase transitions
 * - Enrage timer
 * - Party member displays
 * - Boss HP bar
 * - Quick chat & emotes
 */
export default function BossRaidScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
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
  } = useBattle(id as string);

  const [showDice, setShowDice] = useState(false);
  const [showQuickChat, setShowQuickChat] = useState(false);
  const [showEmotes, setShowEmotes] = useState(false);

  // Boss state
  const bossHp = battle?.bossState?.hp || 10000;
  const bossMaxHp = battle?.bossState?.maxHp || 10000;
  const bossHpPercent = (bossHp / bossMaxHp) * 100;

  // Current phase (based on HP)
  const currentPhase = bossHpPercent > 66 ? 1 : bossHpPercent > 33 ? 2 : 3;

  // Enrage timer (15 minutes)
  const battleStarted = battle?.createdAt || Date.now();
  const enrageTime = battleStarted + (15 * 60 * 1000);
  const timeRemaining = Math.max(0, enrageTime - Date.now());
  const isEnraged = timeRemaining === 0;

  // Party members
  const partyMembers = battle?.playerStates ? Object.values(battle.playerStates) : [];

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
          <Text style={styles.loadingText}>Loading raid...</Text>
        </View>
      </View>
    );
  }

  if (!battle) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Raid not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.scrollContent}>
        {/* Boss Area */}
        <BossArea
          bossName={battle.bossState?.bossId || 'Ancient Boss'}
          hp={bossHp}
          maxHp={bossMaxHp}
          currentPhase={currentPhase}
          isEnraged={isEnraged}
        />

        {/* Enrage Timer */}
        <EnrageTimer timeRemaining={timeRemaining} isEnraged={isEnraged} />

        {/* Phase Indicator */}
        <PhaseIndicator phase={currentPhase} />

        {/* Party Members Grid */}
        <PartyMembersGrid members={partyMembers} myUserId={myPlayerState?.userId} />

        {/* Stack Display */}
        <StackPanel stack={battle.stack || []} />

        {/* My Character & Hand */}
        {myPlayerState && (
          <PlayerRaidArea
            playerState={myPlayerState}
            isMyTurn={isMyTurn}
            onPlayCard={playCard}
            onPassTurn={passTurn}
            onSurrender={surrender}
            isExecuting={isExecuting}
            onQuickChat={() => setShowQuickChat(true)}
            onEmote={() => setShowEmotes(true)}
          />
        )}
      </ScrollView>

      {/* Dice Roller Modal */}
      <DiceRoller
        visible={showDice}
        onRoll={(result) => {
          console.log('Dice rolled:', result);
          setShowDice(false);
        }}
        onClose={() => setShowDice(false)}
      />

      {/* Quick Chat Modal (simplified for now) */}
      {showQuickChat && (
        <QuickChatModal onClose={() => setShowQuickChat(false)} />
      )}

      {/* Emotes Modal (simplified for now) */}
      {showEmotes && (
        <EmotesModal onClose={() => setShowEmotes(false)} />
      )}
    </View>
  );
}

function BossArea({ bossName, hp, maxHp, currentPhase, isEnraged }: any) {
  const hpPercent = (hp / maxHp) * 100;

  return (
    <View style={styles.bossArea}>
      <LinearGradient colors={['#4a1a1a', '#2a0a0a']} style={styles.bossCard}>
        <View style={styles.bossHeader}>
          <Text style={styles.bossIcon}>💀</Text>
          <View style={styles.bossInfo}>
            <Text style={styles.bossName}>{bossName}</Text>
            <Text style={styles.bossPhase}>Phase {currentPhase}</Text>
            {isEnraged && (
              <Text style={styles.enragedText}>🔥 ENRAGED</Text>
            )}
          </View>
        </View>

        {/* Boss HP Bar */}
        <View style={styles.bossHpContainer}>
          <View style={styles.bossHpBar}>
            <LinearGradient
              colors={isEnraged ? ['#ff0000', '#aa0000'] : ['#ff4444', '#cc0000']}
              style={[styles.bossHpFill, { width: `${hpPercent}%` }]}
            />
          </View>
          <Text style={styles.bossHpText}>
            {hp.toLocaleString()} / {maxHp.toLocaleString()}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}

function EnrageTimer({ timeRemaining, isEnraged }: any) {
  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);

  return (
    <View style={[styles.enrageTimer, isEnraged && styles.enrageTimerEnraged]}>
      <Text style={styles.enrageTimerLabel}>
        {isEnraged ? '🔥 ENRAGED!' : '⏱️ Enrage Timer'}
      </Text>
      {!isEnraged && (
        <Text style={styles.enrageTimerValue}>
          {minutes}:{seconds.toString().padStart(2, '0')}
        </Text>
      )}
    </View>
  );
}

function PhaseIndicator({ phase }: { phase: number }) {
  return (
    <View style={styles.phaseIndicator}>
      <View style={styles.phaseSteps}>
        {[1, 2, 3].map(p => (
          <View key={p} style={[styles.phaseStep, p <= phase && styles.phaseStepActive]}>
            <Text style={styles.phaseStepText}>{p}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.phaseLabel}>Phase {phase}/3</Text>
    </View>
  );
}

function PartyMembersGrid({ members, myUserId }: any) {
  return (
    <View style={styles.partyGrid}>
      {members.map((member: any, index: number) => {
        const isMe = member.userId === myUserId;
        const hpPercent = (member.hp / member.maxHp) * 100;

        return (
          <View key={index} style={[styles.partyMember, isMe && styles.partyMemberMe]}>
            <Text style={styles.partyMemberName}>
              {isMe ? 'You' : `Player ${index + 1}`}
            </Text>
            <View style={styles.partyMemberHp}>
              <View style={[styles.partyMemberHpFill, { width: `${hpPercent}%` }]} />
            </View>
            <Text style={styles.partyMemberStats}>
              ❤️ {member.hp}/{member.maxHp} • ⚡ {member.mana}/{member.maxMana}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function PlayerRaidArea({ playerState, isMyTurn, onPlayCard, onPassTurn, onSurrender, isExecuting, onQuickChat, onEmote }: any) {
  return (
    <View style={styles.playerArea}>
      <LinearGradient colors={['#1a1a2e', '#2a2a3e']} style={styles.playerCard}>
        {/* Hand */}
        <View style={styles.handSection}>
          <BattleHand
            cards={playerState.hand || []}
            onCardPlay={onPlayCard}
            isMyTurn={isMyTurn}
            disabled={isExecuting}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, (!isMyTurn || isExecuting) && styles.actionButtonDisabled]}
            onPress={onPassTurn}
            disabled={!isMyTurn || isExecuting}
          >
            <Text style={styles.actionButtonText}>Pass Turn</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onQuickChat}>
            <Text style={styles.actionButtonText}>💬 Chat</Text>
          </Pressable>

          <Pressable style={styles.actionButton} onPress={onEmote}>
            <Text style={styles.actionButtonText}>😀 Emote</Text>
          </Pressable>

          <Pressable style={[styles.actionButton, styles.surrenderButton]} onPress={onSurrender}>
            <Text style={styles.actionButtonText}>Flee</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function QuickChatModal({ onClose }: { onClose: () => void }) {
  const messages = [
    { text: 'Attack!', icon: '⚔️' },
    { text: 'Defend!', icon: '🛡️' },
    { text: 'Need Healing!', icon: '❤️' },
    { text: 'Focus Boss!', icon: '🎯' },
    { text: 'Good Job!', icon: '👍' },
    { text: 'Sorry!', icon: '😅' }
  ];

  return (
    <View style={styles.chatModal}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.chatContent}>
        <Text style={styles.chatTitle}>Quick Chat</Text>
        <View style={styles.chatGrid}>
          {messages.map((msg, i) => (
            <Pressable
              key={i}
              style={styles.chatButton}
              onPress={() => {
                console.log('Chat:', msg.text);
                onClose();
              }}
            >
              <Text style={styles.chatIcon}>{msg.icon}</Text>
              <Text style={styles.chatText}>{msg.text}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.chatClose} onPress={onClose}>
          <Text style={styles.chatCloseText}>Close</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

function EmotesModal({ onClose }: { onClose: () => void }) {
  const emotes = ['👋', '🎉', '👍', '😂', '😢', '😡', '❤️', '🤔', '🥳', '😱', '😎', '😴'];

  return (
    <View style={styles.chatModal}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.chatContent}>
        <Text style={styles.chatTitle}>Emotes</Text>
        <View style={styles.emotesGrid}>
          {emotes.map((emote, i) => (
            <Pressable
              key={i}
              style={styles.emoteButton}
              onPress={() => {
                console.log('Emote:', emote);
                onClose();
              }}
            >
              <Text style={styles.emoteIcon}>{emote}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable style={styles.chatClose} onPress={onClose}>
          <Text style={styles.chatCloseText}>Close</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingBottom: 80
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16
  },
  loadingText: {
    color: '#8e8e93',
    fontSize: 16
  },
  errorText: {
    color: '#ff4444',
    fontSize: 18,
    marginBottom: 16
  },
  backButton: {
    backgroundColor: '#4488ff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600'
  },
  bossArea: {
    padding: 16,
    paddingTop: 60
  },
  bossCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 3,
    borderColor: '#ff4444'
  },
  bossHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16
  },
  bossIcon: {
    fontSize: 64
  },
  bossInfo: {
    flex: 1
  },
  bossName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  bossPhase: {
    fontSize: 14,
    color: '#ff9800',
    fontWeight: '600'
  },
  enragedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ff0000',
    marginTop: 4
  },
  bossHpContainer: {
    gap: 8
  },
  bossHpBar: {
    height: 30,
    backgroundColor: '#1a0a0a',
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#ff4444'
  },
  bossHpFill: {
    height: '100%',
    borderRadius: 13
  },
  bossHpText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center'
  },
  enrageTimer: {
    marginHorizontal: 16,
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#ff9800',
    alignItems: 'center',
    marginBottom: 8
  },
  enrageTimerEnraged: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    borderColor: '#ff0000'
  },
  enrageTimerLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 4
  },
  enrageTimerValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff9800'
  },
  phaseIndicator: {
    marginHorizontal: 16,
    marginBottom: 16,
    alignItems: 'center'
  },
  phaseSteps: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8
  },
  phaseStep: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a3e',
    borderWidth: 2,
    borderColor: '#4a4a5e',
    justifyContent: 'center',
    alignItems: 'center'
  },
  phaseStepActive: {
    backgroundColor: '#4488ff',
    borderColor: '#4488ff'
  },
  phaseStepText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  phaseLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8e8e93'
  },
  partyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16
  },
  partyMember: {
    width: '48%',
    backgroundColor: 'rgba(42, 42, 62, 0.5)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  partyMemberMe: {
    borderColor: '#4488ff',
    backgroundColor: 'rgba(68, 136, 255, 0.1)'
  },
  partyMemberName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8
  },
  partyMemberHp: {
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4
  },
  partyMemberHpFill: {
    height: '100%',
    backgroundColor: '#ff4444'
  },
  partyMemberStats: {
    fontSize: 11,
    color: '#8e8e93'
  },
  playerArea: {
    padding: 16
  },
  playerCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3a3a4e'
  },
  handSection: {
    marginBottom: 16
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#4488ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  actionButtonDisabled: {
    backgroundColor: '#2a2a3e',
    opacity: 0.5
  },
  surrenderButton: {
    backgroundColor: '#ff4444'
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#ffffff'
  },
  chatModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 400,
    justifyContent: 'flex-end'
  },
  chatContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24
  },
  chatTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16
  },
  chatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  chatButton: {
    width: '47%',
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4488ff'
  },
  chatIcon: {
    fontSize: 24,
    marginBottom: 4
  },
  chatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff'
  },
  emotesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  emoteButton: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: 'rgba(68, 136, 255, 0.2)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4488ff'
  },
  emoteIcon: {
    fontSize: 32
  },
  chatClose: {
    backgroundColor: '#4488ff',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  chatCloseText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});
