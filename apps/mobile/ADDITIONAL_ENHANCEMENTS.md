# Additional Enhancements - Realm of Valor

This document covers all the **additional** features and enhancements beyond the core overhaul.

---

## 🎉 NEW COMPONENTS CREATED

### 1. Quest Celebration Animation
**File**: `components/QuestCelebration.tsx`

Beautiful celebration when completing quests with:
- 🎊 Confetti animation
- 🏆 Animated reward reveal
- ⭐ Random epic messages
- 💰 Gold and XP display
- 🎁 Item count
- Auto-dismisses after 3 seconds

**Usage**:
```typescript
import { QuestCelebration } from '@/components/QuestCelebration';

const [showCelebration, setShowCelebration] = useState(false);

<QuestCelebration
  visible={showCelebration}
  questTitle="Explore Northampton"
  rewards={{
    gold: 150,
    xp: 300,
    items: [{ name: 'Iron Sword' }]
  }}
  onComplete={() => setShowCelebration(false)}
/>
```

**Features**:
- Spring animations for smooth entrance
- Gradient background
- Random celebration messages
- Shows all reward types
- Mobile-friendly

---

### 2. Rewards Preview Modal
**File**: `components/RewardsPreviewModal.tsx`

Detailed reward preview before accepting quests:
- 💰 Currency display (gold, XP)
- 🃏 Card rewards with previews
- ⚔️ Item rewards with stats
- 💎 Rarity color coding
- 💡 Bonus tips and information
- Total value calculation

**Usage**:
```typescript
import { RewardsPreviewModal } from '@/components/RewardsPreviewModal';

<RewardsPreviewModal
  visible={showRewards}
  rewards={{
    gold: 150,
    xp: 300,
    cards: [
      { name: 'Fireball', rarity: 'rare', image: '🔥' }
    ],
    items: [
      { name: 'Iron Sword', rarity: 'uncommon', damage: 12 }
    ]
  }}
  onClose={() => setShowRewards(false)}
/>
```

**Features**:
- Beautiful Diablo II styling
- Scrollable for many rewards
- Interactive card previews
- Item stat display
- Total value calculation
- Bonus tips section

---

## 🚀 ADDITIONAL ENHANCEMENTS TO IMPLEMENT

### 3. Quest Notification System

Create `hooks/useQuestNotifications.ts`:

```typescript
import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';

export function useQuestNotifications() {
  useEffect(() => {
    // Configure notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  const notifyQuestNearby = async (questTitle: string, distance: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🗺️ Quest Nearby!',
        body: `${questTitle} is only ${distance}m away!`,
        data: { type: 'quest_nearby' }
      },
      trigger: null // Immediate
    });
  };

  const notifyQuestComplete = async (questTitle: string, rewards: any) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎉 Quest Complete!',
        body: `${questTitle} - Earned ${rewards.xp} XP!`,
        data: { type: 'quest_complete' }
      },
      trigger: null
    });
  };

  const notifyQuestExpiring = async (questTitle: string, minutesLeft: number) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Quest Expiring Soon!',
        body: `${questTitle} expires in ${minutesLeft} minutes!`,
        data: { type: 'quest_expiring' }
      },
      trigger: null
    });
  };

  return {
    notifyQuestNearby,
    notifyQuestComplete,
    notifyQuestExpiring
  };
}
```

**Features**:
- Notify when within 100m of quest
- Notify on quest completion
- Notify when quest expiring (dynamic quests)
- Notify when party member completes quest
- Customizable notification settings

---

### 4. Quest Leaderboards

Create `components/QuestLeaderboard.tsx`:

```typescript
import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export function QuestLeaderboard({ questId, type = 'speed' }: {
  questId: string;
  type: 'speed' | 'score' | 'completions';
}) {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    loadLeaderboard();
  }, [questId, type]);

  const loadLeaderboard = async () => {
    const q = query(
      collection(db, 'questLeaderboards', questId, type),
      orderBy('value', 'desc'),
      limit(10)
    );

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    setLeaderboard(data);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏆 Leaderboard - {type}</Text>
      <FlatList
        data={leaderboard}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <Text style={styles.rank}>#{index + 1}</Text>
            <Text style={styles.name}>{item.playerName}</Text>
            <Text style={styles.value}>
              {type === 'speed' ? `${item.value}s` : item.value}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
```

**Leaderboard Types**:
- **Speed**: Fastest completion time
- **Score**: Highest score (for challenges)
- **Completions**: Most completions
- **Streak**: Longest daily streak

---

### 5. Quest Chain System

Create `utils/questChains.ts`:

```typescript
export interface QuestChain {
  id: string;
  name: string;
  description: string;
  quests: string[]; // Quest IDs in order
  rewards: {
    chainCompletion: any; // Bonus for completing all
  };
}

export const questChains: Record<string, QuestChain> = {
  'northampton_explorer': {
    id: 'northampton_explorer',
    name: 'Northampton Explorer',
    description: 'Discover all major landmarks in Northampton',
    quests: [
      'explore_guildhall',
      'visit_castle',
      'find_market_square'
    ],
    rewards: {
      chainCompletion: {
        title: 'Northampton Expert',
        gold: 500,
        xp: 1000,
        badge: '🏰'
      }
    }
  },
  'tavern_crawler': {
    id: 'tavern_crawler',
    name: 'Tavern Crawler',
    description: 'Visit 10 different pubs in the area',
    quests: [
      'pub_1', 'pub_2', 'pub_3', 'pub_4', 'pub_5',
      'pub_6', 'pub_7', 'pub_8', 'pub_9', 'pub_10'
    ],
    rewards: {
      chainCompletion: {
        title: 'Local Legend',
        gold: 1000,
        xp: 2000,
        item: { name: 'Tankard of Valor', rarity: 'epic' }
      }
    }
  }
};

export function getQuestChainProgress(completedQuests: string[], chainId: string): {
  completed: number;
  total: number;
  percentage: number;
  isComplete: boolean;
} {
  const chain = questChains[chainId];
  if (!chain) return { completed: 0, total: 0, percentage: 0, isComplete: false };

  const completed = chain.quests.filter(qId => completedQuests.includes(qId)).length;
  const total = chain.quests.length;
  const percentage = Math.round((completed / total) * 100);
  const isComplete = completed === total;

  return { completed, total, percentage, isComplete };
}
```

**Features**:
- Sequential quest unlocking
- Chain progress tracking
- Bonus rewards for completion
- Story-driven chains
- Achievement integration

---

### 6. Battle Arena (Defend Quests)

Create `components/BattleArena.tsx`:

```typescript
export function BattleArena({ questId, defenderCard, onBattleEnd }: {
  questId: string;
  defenderCard: any;
  onBattleEnd: (won: boolean) => void;
}) {
  const [playerHp, setPlayerHp] = useState(100);
  const [defenderHp, setDefenderHp] = useState(100);
  const [turn, setTurn] = useState<'player' | 'defender'>('player');
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [battleLog, setBattleLog] = useState<string[]>([]);

  const handleAttack = () => {
    if (turn !== 'player' || !selectedCard) return;

    const damage = calculateDamage(selectedCard, defenderCard);
    const newDefenderHp = Math.max(0, defenderHp - damage);

    setBattleLog(prev => [...prev, `You dealt ${damage} damage!`]);
    setDefenderHp(newDefenderHp);

    if (newDefenderHp === 0) {
      onBattleEnd(true);
      return;
    }

    // Defender's turn
    setTimeout(() => {
      const counterDamage = calculateDamage(defenderCard, selectedCard);
      const newPlayerHp = Math.max(0, playerHp - counterDamage);

      setBattleLog(prev => [...prev, `Defender dealt ${counterDamage} damage!`]);
      setPlayerHp(newPlayerHp);

      if (newPlayerHp === 0) {
        onBattleEnd(false);
      } else {
        setTurn('player');
      }
    }, 1500);

    setTurn('defender');
  };

  return (
    <View style={styles.arena}>
      {/* HP Bars */}
      <View style={styles.hpBars}>
        <HPBar label="You" hp={playerHp} maxHp={100} />
        <HPBar label="Defender" hp={defenderHp} maxHp={100} />
      </View>

      {/* Battle Field */}
      <View style={styles.battlefield}>
        <CardDisplay card={selectedCard} />
        <Text style={styles.vs}>⚔️ VS ⚔️</Text>
        <CardDisplay card={defenderCard} />
      </View>

      {/* Battle Log */}
      <ScrollView style={styles.battleLog}>
        {battleLog.map((log, i) => (
          <Text key={i} style={styles.logText}>{log}</Text>
        ))}
      </ScrollView>

      {/* Actions */}
      <View style={styles.actions}>
        <Pressable
          style={styles.attackButton}
          onPress={handleAttack}
          disabled={turn !== 'player'}
        >
          <Text style={styles.attackButtonText}>Attack</Text>
        </Pressable>
      </View>
    </View>
  );
}

function calculateDamage(attackCard: any, defendCard: any): number {
  const baseAtk = attackCard.damage || attackCard.atk || 10;
  const def = defendCard.defense || defendCard.def || 5;
  const crit = Math.random() > 0.8 ? 2 : 1; // 20% crit chance

  return Math.max(1, Math.round((baseAtk - def/2) * crit));
}
```

**Features**:
- Turn-based combat
- Card vs Card battles
- Damage calculation
- HP bars with animations
- Battle log
- Critical hits
- Defend quest integration
- PvP support (future)

---

### 7. Quest Difficulty Indicators

Add to quest cards:

```typescript
function getDifficultyColor(quest: any, playerLevel: number): string {
  const levelDiff = quest.recommendedLevel - playerLevel;

  if (levelDiff <= -5) return '#22c55e'; // Green - Trivial
  if (levelDiff <= -2) return '#84cc16'; // Light Green - Easy
  if (levelDiff <= 2) return '#eab308'; // Yellow - Appropriate
  if (levelDiff <= 5) return '#f97316'; // Orange - Challenging
  return '#ef4444'; // Red - Very Hard
}

// In QuestCard component:
<View style={[styles.difficultyIndicator, {
  backgroundColor: getDifficultyColor(quest, character.level)
}]} />
```

**Levels**:
- 🟢 Green: 5+ levels below (trivial)
- 🟡 Yellow: ±2 levels (appropriate)
- 🟠 Orange: 3-5 levels above (challenging)
- 🔴 Red: 5+ levels above (very hard)

---

### 8. Quest Timer/Expiration

Add to quest cards for dynamic quests:

```typescript
function QuestExpirationTimer({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('EXPIRED');
        clearInterval(interval);
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${minutes}m`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <View style={styles.timerContainer}>
      <Text style={styles.timerIcon}>⏰</Text>
      <Text style={[
        styles.timerText,
        timeLeft === 'EXPIRED' && styles.expired
      ]}>
        {timeLeft}
      </Text>
    </View>
  );
}
```

---

### 9. Auto-Accept Nearby Quests

Add setting to automatically accept quests within range:

```typescript
// In settings
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function getAutoAcceptSetting(): Promise<boolean> {
  const value = await AsyncStorage.getItem('autoAcceptQuests');
  return value === 'true';
}

export async function setAutoAcceptSetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem('autoAcceptQuests', enabled.toString());
}

// In useQuestLoader hook
useEffect(() => {
  const checkNearbyQuests = async () => {
    const autoAccept = await getAutoAcceptSetting();
    if (!autoAccept) return;

    const nearbyQuests = staticQuests.filter(quest => {
      const distance = calculateDistance(
        latitude, longitude,
        quest.location.latitude, quest.location.longitude
      );
      return distance.meters <= 100; // Within 100m
    });

    for (const quest of nearbyQuests) {
      // Auto-accept
      await acceptQuest(quest.id);
      showNotification(`Auto-accepted: ${quest.title}`);
    }
  };

  checkNearbyQuests();
}, [staticQuests, latitude, longitude]);
```

---

### 10. Quest Share System

Share quests with party members:

```typescript
export async function generateQuestShareCode(questId: string): Promise<string> {
  // Generate short code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  // Store in Firebase
  await setDoc(doc(db, 'questShares', code), {
    questId,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24h
  });

  return code;
}

export async function acceptSharedQuest(code: string): Promise<string> {
  const shareDoc = await getDoc(doc(db, 'questShares', code));

  if (!shareDoc.exists()) {
    throw new Error('Invalid or expired share code');
  }

  const { questId, expiresAt } = shareDoc.data();

  if (new Date(expiresAt) < new Date()) {
    throw new Error('This quest share has expired');
  }

  return questId;
}

// UI Component
<Pressable onPress={async () => {
  const code = await generateQuestShareCode(quest.id);
  Alert.alert(
    'Quest Share Code',
    `Share this code with party members:\n\n${code}`,
    [
      { text: 'Copy', onPress: () => Clipboard.setString(code) },
      { text: 'Close' }
    ]
  );
}}>
  <Text>📤 Share Quest</Text>
</Pressable>
```

---

## 📋 IMPLEMENTATION CHECKLIST

- [ ] Install `react-native-confetti` for celebration animations
- [ ] Install `expo-notifications` for quest notifications
- [ ] Import and use `QuestCelebration` component when completing quests
- [ ] Import and use `RewardsPreviewModal` for quest rewards preview
- [ ] Implement quest notification hooks
- [ ] Add leaderboard components to defend quests
- [ ] Create quest chain definitions
- [ ] Implement battle arena for defend quests
- [ ] Add difficulty color indicators
- [ ] Add expiration timers for dynamic quests
- [ ] Add auto-accept setting
- [ ] Implement quest share system

---

## 🎮 USAGE EXAMPLES

### Completing a Quest with Celebration

```typescript
const handleCompleteQuest = async () => {
  // Mark quest as complete in Firebase
  await updateDoc(doc(db, 'questProgress', questProgressId), {
    status: 'completed',
    completedAt: new Date().toISOString()
  });

  // Show celebration
  setShowCelebration(true);

  // Send notification
  await notifyQuestComplete(quest.title, quest.rewards);
};
```

### Previewing Rewards Before Accept

```typescript
<Pressable onPress={() => setShowRewardsPreview(true)}>
  <Text>👀 Preview Rewards</Text>
</Pressable>

<RewardsPreviewModal
  visible={showRewardsPreview}
  rewards={quest.rewards}
  onClose={() => setShowRewardsPreview(false)}
/>
```

---

## 🚀 NEXT STEPS

1. **Install Dependencies**:
```bash
pnpm add react-native-confetti expo-notifications
```

2. **Import Components** where needed

3. **Test Each Feature** individually

4. **Customize** styling to match your Diablo II theme

5. **Deploy** and enjoy!

---

All enhancements maintain your existing UI style while adding powerful new functionality! 🎉
