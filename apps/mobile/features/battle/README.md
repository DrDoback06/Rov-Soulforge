# ⚔️ Battle System

## Overview
The Battle System handles all combat functionality including card-based battles, turn management, and basic AI opponents.

## Purpose
- **Built from scratch** - Previous implementation never worked
- Provide WORKING, simple turn-based card battle system
- Local-first approach (no Firebase dependency initially)
- Simple card types: attack, heal, buff
- Basic AI opponent that plays cards automatically
- Integration ready for quest system

## Current Implementation Status
✅ **SimpleBattleEngine** - Core battle logic complete (~300 lines)
✅ **useSimpleBattle** - React hook for battle state (~130 lines)
✅ **BattleCard** - Card visual component (~120 lines)
✅ **BattleScreen** - Full battle UI (~300 lines)
⏳ **Testing** - Need to verify in Expo app
⏳ **Quest Integration** - Connect to quest system
⏳ **Firebase Sync** - Add server-side battle state (future)

## Structure

```
battle/
├── README.md (this file)
├── engine/              # Core battle logic
│   ├── BattleEngine.ts          # ✅ SimpleBattleEngine class (~300 lines)
│   └── index.ts                 # ✅ Exports engine and types
├── hooks/               # React hooks for battles
│   ├── useSimpleBattle.ts       # ✅ Main battle hook (~130 lines)
│   └── index.ts                 # ✅ Exports hooks
├── ui/                  # Battle screen UI components
│   ├── BattleScreen.tsx         # ✅ Main battle screen (~300 lines)
│   ├── BattleCard.tsx           # ✅ Card component (~120 lines)
│   └── index.ts                 # ✅ Exports UI components
├── ai/                  # AI opponent (placeholder)
│   └── index.ts
├── cards/               # Card system (placeholder)
│   └── index.ts
└── types.ts             # Battle-specific types (placeholder)
```

**Simple Implementation:**
- Single `SimpleBattleEngine` class handles all game logic
- Basic AI built into engine (plays random valid cards)
- All state managed locally (no Firebase yet)
- Three card types: attack (damage), heal (restore HP), buff (increase attack)

## Key Features

### 1. SimpleBattleEngine (`engine/BattleEngine.ts`)

**Core battle logic** - Single class managing entire battle flow

```typescript
class SimpleBattleEngine {
  constructor(playerCharacter: Character, opponentName: string = 'Goblin')

  // Get current battle state
  getState(): SimpleBattleState

  // Play a card from player's hand
  playCard(cardId: string): { success: boolean; message: string }

  // End player's turn (triggers AI turn automatically)
  endTurn(): void

  // Private methods
  private initializeBattle(...)
  private drawCards(isPlayer: boolean, count: number)
  private applyCardEffect(card: SimpleCard, isPlayer: boolean)
  private executeAITurn()
  private checkGameOver()
}
```

**Battle State:**
```typescript
interface SimpleBattleState {
  id: string;
  player: {
    characterId: string;
    name: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    hand: SimpleCard[];
    deck: SimpleCard[];
    discard: SimpleCard[];
  };
  opponent: { /* same structure */ };
  currentTurn: 'player' | 'opponent';
  turnNumber: number;
  battleLog: string[];
  winner: 'player' | 'opponent' | null;
  status: 'active' | 'ended';
}
```

**Card Types:**
```typescript
interface SimpleCard {
  id: string;
  name: string;
  type: 'attack' | 'heal' | 'buff';
  value: number;      // Damage/heal amount/buff value
  manaCost: number;
  description: string;
}
```

### 2. useSimpleBattle Hook (`hooks/useSimpleBattle.ts`)

**React hook** - Manages battle state in components

```typescript
const {
  battleState,      // Current battle state
  playCard,         // (cardId: string) => void
  endTurn,          // () => void
  startBattle,      // (char: Character, opponent?: string) => void
  isPlayerTurn,     // boolean
  isGameOver,       // boolean
  winner,           // 'player' | 'opponent' | null
} = useSimpleBattle();
```

### 3. BattleScreen (`ui/BattleScreen.tsx`)

**Complete battle UI** - Full game screen

**Layout:**
- **Battle Log** (scrollable) - Shows turn-by-turn actions
- **Opponent Area** - Name, HP/mana bars, deck/discard counts
- **Turn Indicator** - Shows whose turn it is
- **Player Area** - HP/mana stats, deck/discard counts
- **Player Hand** - Horizontal scroll of playable cards
- **End Turn Button** - Pass turn to opponent

```typescript
<BattleScreen
  playerCharacter={character}
  opponentName="Goblin"
  onBattleEnd={(winner) => {/* handle result */}}
/>
```

### 4. BattleCard (`ui/BattleCard.tsx`)

**Card visual component** - Displays individual cards

**Features:**
- Color-coded by type (red=attack, green=heal, blue=buff)
- Shows mana cost
- Shows card value with icon
- Disabled state when not playable
- Press to play card

```typescript
<BattleCard
  card={card}
  onPress={() => playCard(card.id)}
  disabled={!isPlayerTurn}
/>
```

## Battle Flow

**Simple Turn-Based System:**

1. **Initialize Battle** - Create player and opponent with starting HP, mana, decks
2. **Draw Starting Hands** - Both draw 5 cards
3. **Player Turn:**
   - Restore 3 mana (up to max 10)
   - Play cards from hand (spend mana, apply effects immediately)
   - End turn when ready
4. **AI Turn (automatic):**
   - Restore 3 mana
   - Draw 1 card
   - Play random valid cards until out of mana or cards
   - Auto-end turn
5. **Check Win Condition:**
   - Player HP <= 0 → Player loses
   - Opponent HP <= 0 → Player wins
   - Continue if both alive
6. **Battle End** - Trigger `onBattleEnd` callback with winner

## Usage

### Starting a Battle
```typescript
import { BattleScreen } from '@/features/battle';
import { useCharacter } from '@/features/character/hooks';

function QuestBattleScreen({ onBattleComplete }) {
  const { character } = useCharacter();

  const handleBattleEnd = (winner: 'player' | 'opponent') => {
    if (winner === 'player') {
      // Award quest rewards, update progress, etc.
      onBattleComplete(true);
    } else {
      // Handle defeat
      onBattleComplete(false);
    }
  };

  if (!character) return <LoadingSpinner />;

  return (
    <BattleScreen
      playerCharacter={character}
      opponentName="Goblin"
      onBattleEnd={handleBattleEnd}
    />
  );
}
```

### Using Battle Hook Directly
```typescript
import { useSimpleBattle } from '@/features/battle/hooks';
import { useCharacter } from '@/features/character/hooks';

function CustomBattleScreen() {
  const { character } = useCharacter();
  const {
    battleState,
    playCard,
    endTurn,
    startBattle,
    isPlayerTurn,
    isGameOver,
    winner,
  } = useSimpleBattle();

  useEffect(() => {
    if (character) {
      startBattle(character, 'Orc Warrior');
    }
  }, [character]);

  if (!battleState) return <LoadingSpinner />;

  return (
    <View>
      <Text>Turn: {battleState.turnNumber}</Text>
      <Text>Player HP: {battleState.player.hp}/{battleState.player.maxHp}</Text>
      <Text>Enemy HP: {battleState.opponent.hp}/{battleState.opponent.maxHp}</Text>

      {isPlayerTurn && (
        <View>
          {battleState.player.hand.map(card => (
            <BattleCard
              key={card.id}
              card={card}
              onPress={() => playCard(card.id)}
              disabled={false}
            />
          ))}
          <Button onPress={endTurn} title="End Turn" />
        </View>
      )}

      {isGameOver && <Text>Winner: {winner}</Text>}
    </View>
  );
}
```

## Win Conditions

- **Player Victory**: Opponent's HP reaches 0
- **Player Defeat**: Player's HP reaches 0

**Future:**
- Deck out (cannot draw cards)
- Surrender option
- Turn time limit

## AI Editing Guide

**Small, focused files** - Easy to edit without breaking other parts

### To change battle UI layout:
Edit: `ui/BattleScreen.tsx` (~300 lines)
- Modify layout components, styling, turn indicator, etc.

### To modify battle logic:
Edit: `engine/BattleEngine.ts` (~300 lines)
- Change turn flow, mana restoration, card effects
- Modify `endTurn()` method for turn logic
- Update `applyCardEffect()` for card behavior

### To add new card types:
1. Edit: `engine/BattleEngine.ts`
   - Add type to `SimpleCard['type']`
   - Add case in `applyCardEffect()` method
   - Add sample cards in starting deck

### To improve AI behavior:
Edit: `engine/BattleEngine.ts` - `executeAITurn()` method
- Currently plays random valid cards
- Can add strategy (prioritize damage when low HP, etc.)

### To change win conditions:
Edit: `engine/BattleEngine.ts` - `checkGameOver()` method

### To modify card appearance:
Edit: `ui/BattleCard.tsx` (~120 lines)
- Change colors, layout, icons

### To integrate with quests:
Edit: Quest system to call `<BattleScreen>` and handle `onBattleEnd` callback

## Dependencies

**Current:**
- `@rov/types` - Character and type definitions
- `react-native` - UI components
- `features/character` - Character stats (for initialization)

**Future:**
- `firebase/firestore` - Server-side battle state
- `features/inventory` - Card collection and decks
- `features/quests` - Quest integration

## Related Features
- **Quests** (`features/quests/`) - Will integrate battle objectives
- **Character** (`features/character/`) - Character stats/abilities
- **Inventory** (`features/inventory/`) - Future card collection
- **Decks** (`features/decks/`) - Future deck building

## Next Steps

1. **Test in Expo** - Verify battle screen works in mobile app
2. **Quest Integration** - Add battle triggers to quest system
3. **Firebase Sync** - Add server-side battle state (optional for now)
4. **Card Variety** - Expand beyond 3 basic cards
5. **Better AI** - Smarter opponent decision-making
6. **Offline Mode** - Graceful degradation when offline

## Future Enhancements

**Polish:**
- Animations for card play, damage, healing
- Sound effects
- Better visual feedback for turn changes
- Victory/defeat animations

**Features:**
- Save/load battle state
- Battle replays
- Multiple difficulty levels
- Boss battles with special mechanics
- PvP battles (real-time or async)

**Content:**
- More card types (shields, counters, summons)
- Status effects (poison, stun, etc.)
- Character abilities/ultimates
- Equipment bonuses in battle
