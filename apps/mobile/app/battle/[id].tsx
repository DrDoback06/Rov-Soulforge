import { View, Text, StyleSheet, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useBattle } from '@/hooks/useBattle';

/**
 * Battle Screen - Full battleground UI with real-time Firebase updates
 */
export default function BattleScreen() {
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

  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4488ff" />
          <Text style={styles.loadingText}>Loading battle...</Text>
        </View>
      </View>
    );
  }

  if (!battle || !myPlayerState || !opponentState) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Battle not found</Text>
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
        {/* Opponent area */}
        <OpponentArea playerState={opponentState} />

        {/* Stack display */}
        <StackPanel stack={battle.stack || []} />

        {/* Player area */}
        <PlayerArea
          playerState={myPlayerState}
          isMyTurn={isMyTurn}
          onPlayCard={playCard}
          onPassTurn={passTurn}
          onSurrender={surrender}
          isExecuting={isExecuting}
        />
      </ScrollView>

      {/* Turn indicator */}
      <TurnIndicator isMyTurn={isMyTurn} />
    </View>
  );
}

function OpponentArea({ playerState }: { playerState: any }) {
  return (
    <View style={styles.opponentArea}>
      <LinearGradient colors={['#2a2a3e', '#1a1a2e']} style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>Opponent</Text>
          <View style={styles.livesContainer}>
            {[...Array(playerState.lives || 3)].map((_, i) => (
              <Text key={i} style={styles.lifeIcon}>❤️</Text>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>HP</Text>
            <Text style={styles.statValue}>{playerState.hp || 100}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>Mana</Text>
            <Text style={styles.statValue}>{playerState.mana || 50}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>Hand</Text>
            <Text style={styles.statValue}>{playerState.hand?.length || 0}</Text>
          </View>
        </View>

        <View style={styles.deckPiles}>
          <DeckPile type="Action" count={playerState.actionDeck?.length || 0} />
          <DeckPile type="Skill" count={playerState.skillDeck?.length || 0} />
          <DeckPile type="Loot" count={playerState.lootDeck?.length || 0} />
        </View>
      </LinearGradient>
    </View>
  );
}

function StackPanel({ stack }: { stack: any[] }) {
  if (stack.length === 0) {
    return (
      <View style={styles.stackPanel}>
        <Text style={styles.stackEmpty}>The Stack is empty</Text>
      </View>
    );
  }

  return (
    <View style={styles.stackPanel}>
      <Text style={styles.stackTitle}>The Stack ({stack.length})</Text>
      {stack.map((item, index) => (
        <LinearGradient
          key={index}
          colors={['#4488ff', '#2244cc']}
          style={styles.stackItem}
        >
          <Text style={styles.stackItemText}>{item.cardName || 'Card Effect'}</Text>
        </LinearGradient>
      ))}
    </View>
  );
}

function PlayerArea({
  playerState,
  isMyTurn,
  onPlayCard,
  onPassTurn,
  onSurrender,
  isExecuting
}: {
  playerState: any;
  isMyTurn: boolean;
  onPlayCard: (cardId: string) => void;
  onPassTurn: () => void;
  onSurrender: () => void;
  isExecuting: boolean;
}) {
  return (
    <View style={styles.playerArea}>
      <LinearGradient colors={['#1a1a2e', '#2a2a3e']} style={styles.playerCard}>
        <View style={styles.playerHeader}>
          <Text style={styles.playerName}>You</Text>
          <View style={styles.livesContainer}>
            {[...Array(playerState.lives || 3)].map((_, i) => (
              <Text key={i} style={styles.lifeIcon}>❤️</Text>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>HP</Text>
            <Text style={styles.statValue}>{playerState.hp || 100}</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statLabel}>Mana</Text>
            <Text style={styles.statValue}>{playerState.mana || 50}</Text>
          </View>
        </View>

        <View style={styles.deckPiles}>
          <DeckPile type="Action" count={playerState.actionDeck?.length || 0} />
          <DeckPile type="Skill" count={playerState.skillDeck?.length || 0} />
          <DeckPile type="Loot" count={playerState.lootDeck?.length || 0} />
        </View>

        <View style={styles.handSection}>
          <Text style={styles.handLabel}>Hand ({playerState.hand?.length || 0})</Text>
          <HandDisplay cards={playerState.hand || []} onPlayCard={onPlayCard} isMyTurn={isMyTurn} />
        </View>

        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionButton, (!isMyTurn || isExecuting) && styles.actionButtonDisabled]}
            onPress={onPassTurn}
            disabled={!isMyTurn || isExecuting}
          >
            <Text style={styles.actionButtonText}>
              {isExecuting ? 'Executing...' : 'Pass Turn'}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.surrenderButton]}
            onPress={onSurrender}
            disabled={isExecuting}
          >
            <Text style={styles.actionButtonText}>Surrender</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </View>
  );
}

function DeckPile({ type, count }: { type: string; count: number }) {
  const colors: Record<string, string> = {
    Action: '#ff4444',
    Skill: '#4488ff',
    Loot: '#ffd700'
  };

  return (
    <View style={[styles.deckPile, { borderColor: colors[type] }]}>
      <Text style={styles.deckPileType}>{type[0]}</Text>
      <Text style={styles.deckPileCount}>{count}</Text>
    </View>
  );
}

function HandDisplay({
  cards,
  onPlayCard,
  isMyTurn
}: {
  cards: any[];
  onPlayCard: (cardId: string) => void;
  isMyTurn: boolean;
}) {
  if (cards.length === 0) {
    return (
      <View style={styles.emptyHand}>
        <Text style={styles.emptyHandText}>No cards in hand</Text>
      </View>
    );
  }

  return (
    <ScrollView horizontal style={styles.handDisplay} contentContainerStyle={styles.handContent}>
      {cards.map((card, index) => (
        <Pressable
          key={index}
          style={styles.handCard}
          onPress={() => isMyTurn && onPlayCard(card.id)}
          disabled={!isMyTurn}
        >
          <LinearGradient
            colors={getCardColors(card.deck)}
            style={styles.handCardGradient}
          >
            <Text style={styles.handCardMana}>⚡{card.manaCost || 0}</Text>
            <Text style={styles.handCardName} numberOfLines={2}>
              {card.name}
            </Text>
          </LinearGradient>
        </Pressable>
      ))}
    </ScrollView>
  );
}

function getCardColors(deckType: string): [string, string] {
  const colors: Record<string, [string, string]> = {
    Action: ['#ff4444', '#cc0000'],
    Skill: ['#4488ff', '#2244cc'],
    Loot: ['#ffd700', '#cc8800']
  };
  return colors[deckType] || ['#666666', '#444444'];
}

function TurnIndicator({ isMyTurn }: { isMyTurn: boolean }) {
  return (
    <View style={styles.turnIndicator}>
      <LinearGradient
        colors={isMyTurn ? ['#00ff00', '#00aa00'] : ['#ff4444', '#cc0000']}
        style={styles.turnIndicatorBadge}
      >
        <Text style={styles.turnIndicatorText}>
          {isMyTurn ? '🎯 Your Turn' : '⏳ Opponent Turn'}
        </Text>
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
  opponentArea: {
    padding: 16,
    paddingTop: 60
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
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  playerName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  livesContainer: {
    flexDirection: 'row',
    gap: 4
  },
  lifeIcon: {
    fontSize: 20
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12
  },
  statBadge: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 10,
    color: '#8e8e93',
    textTransform: 'uppercase',
    marginBottom: 4
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  deckPiles: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
    gap: 8
  },
  deckPile: {
    width: 50,
    height: 70,
    backgroundColor: '#0f0f1e',
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  deckPileType: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4
  },
  deckPileCount: {
    fontSize: 12,
    color: '#8e8e93'
  },
  stackPanel: {
    padding: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  stackEmpty: {
    fontSize: 14,
    color: '#5e5e6e',
    fontStyle: 'italic'
  },
  stackTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12
  },
  stackItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    minWidth: '80%'
  },
  stackItemText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600'
  },
  handSection: {
    marginBottom: 16
  },
  handLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 8,
    textTransform: 'uppercase'
  },
  handDisplay: {
    maxHeight: 120
  },
  handContent: {
    gap: 8
  },
  emptyHand: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyHandText: {
    fontSize: 14,
    color: '#5e5e6e'
  },
  handCard: {
    width: 80,
    height: 110
  },
  handCardGradient: {
    flex: 1,
    borderRadius: 8,
    padding: 8,
    justifyContent: 'space-between'
  },
  handCardMana: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  handCardName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff'
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12
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
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff'
  },
  turnIndicator: {
    position: 'absolute',
    top: 12,
    left: 16,
    right: 16,
    alignItems: 'center'
  },
  turnIndicatorBadge: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4
  },
  turnIndicatorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff'
  }
});
