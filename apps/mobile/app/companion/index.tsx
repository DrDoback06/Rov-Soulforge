import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useCharacter } from '@/hooks/useCharacter';
import * as Haptics from 'expo-haptics';

/**
 * AI Companion Screen
 *
 * An intelligent travel companion that helps players learn the game
 * Features:
 * - Contextual game advice
 * - Quest tips and strategies
 * - Card recommendations
 * - Battle tactics
 * - Fitness motivation
 * - Game mechanics explanations
 */

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function AICompanionScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Greetings, adventurer! I am your AI companion, here to guide you through the Realm of Valor. Ask me anything about quests, battles, cards, or how to play the game!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const { character } = useCharacter();

  // Quick action buttons
  const quickActions = [
    { id: '1', label: 'How do I complete quests?', icon: '🗺️' },
    { id: '2', label: 'Explain the battle system', icon: '⚔️' },
    { id: '3', label: 'What cards should I use?', icon: '🎴' },
    { id: '4', label: 'How does fitness tracking work?', icon: '💪' },
    { id: '5', label: 'Tips for my class', icon: '🎯' }
  ];

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Call AI service
      const response = await getAIResponse(text, messages, character);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('AI response error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I apologize, I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (label: string) => {
    sendMessage(label);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <LinearGradient colors={['#1a1a2e', '#0f0f1e']} style={StyleSheet.absoluteFillObject} />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>Your Travel Guide</Text>
        </View>
        <View style={styles.companionAvatar}>
          <Text style={styles.companionAvatarText}>🧙</Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4488ff" />
            <Text style={styles.loadingText}>Thinking...</Text>
          </View>
        )}

        {/* Quick Actions (only show if no user messages yet) */}
        {messages.filter(m => m.role === 'user').length === 0 && (
          <View style={styles.quickActionsContainer}>
            <Text style={styles.quickActionsTitle}>Quick Questions:</Text>
            {quickActions.map((action) => (
              <Pressable
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.label)}
              >
                <Text style={styles.quickActionIcon}>{action.icon}</Text>
                <Text style={styles.quickActionText}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#5e5e6e"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage(input)}
          multiline
          maxLength={500}
        />
        <Pressable
          style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
          onPress={() => sendMessage(input)}
          disabled={!input.trim() || loading}
        >
          <LinearGradient
            colors={input.trim() && !loading ? ['#4488ff', '#2244cc'] : ['#2a2a3e', '#1a1a2e']}
            style={styles.sendButtonGradient}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <View style={[styles.messageBubbleContainer, isUser && styles.messageBubbleContainerUser]}>
      <View style={[styles.messageBubble, isUser && styles.messageBubbleUser]}>
        {!isUser && (
          <Text style={styles.messageAvatar}>🧙</Text>
        )}
        <View style={[styles.messageContent, isUser && styles.messageContentUser]}>
          <Text style={[styles.messageText, isUser && styles.messageTextUser]}>
            {message.content}
          </Text>
          <Text style={[styles.messageTime, isUser && styles.messageTimeUser]}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
}

/**
 * Get AI response from backend
 * Uses character context for personalized advice
 */
async function getAIResponse(
  userMessage: string,
  conversationHistory: Message[],
  character: any
): Promise<string> {
  try {
    // In production, this would call your backend API endpoint
    // which then calls OpenAI with proper rate limiting and security
    const response = await fetch(process.env.EXPO_PUBLIC_API_URL + '/ai/companion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: userMessage,
        history: conversationHistory.slice(-10), // Last 10 messages
        context: {
          characterClass: character?.classId,
          level: character?.level,
          alignment: character?.alignment,
          gold: character?.gold,
          renown: character?.counters?.renown
        }
      })
    });

    if (!response.ok) throw new Error('AI service unavailable');

    const data = await response.json();
    return data.response;
  } catch (error) {
    console.error('AI API error:', error);

    // Fallback to rule-based responses
    return getRuleBasedResponse(userMessage, character);
  }
}

/**
 * Fallback rule-based responses
 * Used when AI service is unavailable
 */
function getRuleBasedResponse(message: string, character: any): string {
  const lowerMessage = message.toLowerCase();

  // Quest-related
  if (lowerMessage.includes('quest')) {
    return `Quests are the heart of your adventure! Here's how they work:

1️⃣ Find quests on the Map tab - they appear as markers
2️⃣ Walk to the quest location (within the geofence radius)
3️⃣ Tap the quest and hit "Start Quest"
4️⃣ Complete the requirements (distance, steps, etc.)
5️⃣ Return to the location and tap "Complete Quest"
6️⃣ Collect your rewards: Gold, XP, and sometimes rare cards!

Pro tip: Rare quests give better rewards but have tougher requirements. Start with Common quests to learn the system!`;
  }

  // Battle-related
  if (lowerMessage.includes('battle') || lowerMessage.includes('fight') || lowerMessage.includes('combat')) {
    return `Battles in Realm of Valor use a unique stack-based system:

⚔️ **The Stack (LIFO)**
- Cards resolve Last-In-First-Out
- Instant cards can interrupt other cards
- Strategic timing is key!

🎴 **Three Deck Types**
- Action: Events and challenges
- Skill: Spells and abilities
- Loot: Equipment and items

💡 **Battle Tips for ${character?.classId || 'your class'}:**
${character?.classId === 'Warrior' ? '- Use high ATK cards early\n- Save defensive buffs for enemy attacks\n- Your high HP lets you play aggressively' : ''}
${character?.classId === 'Mage' ? '- Leverage your high mana pool\n- Combo skill cards for massive damage\n- Control the battlefield with debuffs' : ''}

Turn order is based on SPD stat. Faster characters go first!`;
  }

  // Cards/Deck building
  if (lowerMessage.includes('card') || lowerMessage.includes('deck')) {
    return `Let me help you with cards and deck building!

🎴 **Card Types:**
- Action (30 max): Global effects, challenges
- Skill (20 max): Class abilities, spells
- Loot (15 max): Equipment, consumables

🌟 **Rarity Tiers:**
- Common: Basic cards, easy to get
- Uncommon: Solid utility
- Rare: Powerful effects
- Epic: Game-changers
- Legendary: Ultimate power!

💡 **For Your ${character?.classId || 'Class'}:**
Focus on cards that synergize with your stats. Visit the Deck Builder to customize your loadout!

You can get new cards from:
- Quest rewards
- Shop packs (use gold)
- Fitness achievements`;
  }

  // Fitness tracking
  if (lowerMessage.includes('fitness') || lowerMessage.includes('activity') || lowerMessage.includes('exercise')) {
    return `Fitness is core to Realm of Valor! Turn real-world exercise into in-game power:

💪 **Tracked Activities:**
- Running/Walking (distance)
- Cycling
- Hiking (elevation!)
- Swimming
- General workouts

📊 **Rewards:**
- 1 Gold per 0.5km (max 20/day)
- 1 Gold per 100m elevation (max 10/day)
- XP from completing quest requirements
- Temporary stat buffs from HR challenges

🔗 **Connect Your Apps:**
- Apple Health / Google Fit
- Strava
- Garmin
- WHOOP

Pro tip: Some quests require specific activities. Check quest details before starting!`;
  }

  // Class-specific advice
  if (lowerMessage.includes('class') || lowerMessage.includes(character?.classId?.toLowerCase() || '')) {
    const classAdvice: Record<string, string> = {
      Warrior: '🛡️ **Warrior Tips:**\n- High HP and DEF make you tanky\n- Focus on ATK buffs and direct damage\n- Use defensive skills when HP is low\n- Great for beginners!',
      Mage: '🔮 **Mage Tips:**\n- Massive mana pool for spell combos\n- Chain skill cards together\n- Low HP means avoid direct combat\n- Control battles with debuffs',
      Rogue: '🗡️ **Rogue Tips:**\n- Highest SPD = first strike advantage\n- Focus on quick, high-damage attacks\n- Steal and discard enemy cards\n- Glass cannon - hit fast, hit hard',
      Paladin: '⚔️ **Paladin Tips:**\n- Balance of offense and defense\n- Holy alignment synergy\n- Support skills help in co-op\n- Excellent for PvP battles',
      Ranger: '🏹 **Ranger Tips:**\n- Mid-range SPD for flexibility\n- Balanced stats suit any playstyle\n- Nature-themed card synergies\n- Great for solo adventuring',
      Necromancer: '💀 **Necromancer Tips:**\n- Summon minions for sustained damage\n- Life drain abilities keep you alive\n- High mana for spell spam\n- Chaos alignment benefits',
      Bard: '🎵 **Bard Tips:**\n- Buff allies in co-op\n- Card draw abilities\n- High SPD for turn priority\n- Versatile support class',
      Druid: '🌿 **Druid Tips:**\n- Nature magic and healing\n- Transform abilities\n- Good HP and mana balance\n- Excellent for long battles'
    };

    return classAdvice[character?.classId || 'Warrior'] || `Your class is ${character?.classId}! Each class has unique strengths. Experiment to find your playstyle!`;
  }

  // General help
  if (lowerMessage.includes('help') || lowerMessage.includes('start') || lowerMessage.includes('beginner')) {
    return `Welcome to Realm of Valor! Here's a quick start guide:

🎮 **Getting Started:**
1. Complete your first quest (Map tab)
2. Open a starter pack (Shop tab)
3. Build your first deck (Cards → Deck Builder)
4. Try a practice battle

🗺️ **Main Features:**
- Map: Find GPS-based quests
- Quests: Track active adventures
- Cards: View your collection
- Shop: Buy packs with gold
- Ranks: Compete on leaderboards
- Profile: View character stats

💡 **Pro Tips:**
- Complete daily quests for bonus rewards
- Connect fitness apps for passive gold
- Join friends for co-op battles
- Save gold for Premium packs (better cards!)

What would you like to learn more about?`;
  }

  // Default response
  return `Interesting question! While I'm still learning, here are some things I can help with:

🗺️ Quests and adventures
⚔️ Battle strategies
🎴 Cards and deck building
💪 Fitness tracking
🎯 Class-specific tips
👥 Social features
💰 Economy and shop

Try asking me something like "How do I complete quests?" or "What's the best strategy for my class?"

You can also check the game's documentation for detailed guides!`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 60, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#2a2a3e' },
  backButton: { padding: 8 },
  backButtonText: { color: '#4488ff', fontSize: 16, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  headerSubtitle: { fontSize: 12, color: '#8e8e93' },
  companionAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#4488ff', justifyContent: 'center', alignItems: 'center' },
  companionAvatarText: { fontSize: 28 },
  messagesContainer: { flex: 1 },
  messagesContent: { padding: 16, paddingBottom: 8 },
  messageBubbleContainer: { marginBottom: 16, alignItems: 'flex-start' },
  messageBubbleContainerUser: { alignItems: 'flex-end' },
  messageBubble: { flexDirection: 'row', maxWidth: '85%', gap: 8 },
  messageBubbleUser: { flexDirection: 'row-reverse' },
  messageAvatar: { fontSize: 28 },
  messageContent: { backgroundColor: '#2a2a3e', borderRadius: 16, padding: 12, borderBottomLeftRadius: 4 },
  messageContentUser: { backgroundColor: '#4488ff', borderBottomLeftRadius: 16, borderBottomRightRadius: 4 },
  messageText: { fontSize: 15, color: '#ffffff', lineHeight: 22, marginBottom: 4 },
  messageTextUser: { color: '#ffffff' },
  messageTime: { fontSize: 10, color: '#8e8e93', alignSelf: 'flex-end' },
  messageTimeUser: { color: '#cccccc' },
  loadingContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 },
  loadingText: { fontSize: 14, color: '#8e8e93', fontStyle: 'italic' },
  quickActionsContainer: { marginTop: 24 },
  quickActionsTitle: { fontSize: 14, color: '#8e8e93', marginBottom: 12, textTransform: 'uppercase' },
  quickActionButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#2a2a3e', padding: 12, borderRadius: 12, marginBottom: 8, gap: 12 },
  quickActionIcon: { fontSize: 24 },
  quickActionText: { fontSize: 15, color: '#ffffff', flex: 1 },
  inputContainer: { flexDirection: 'row', padding: 16, gap: 12, borderTopWidth: 1, borderTopColor: '#2a2a3e', backgroundColor: '#1a1a2e' },
  input: { flex: 1, backgroundColor: '#2a2a3e', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, color: '#ffffff', fontSize: 15, maxHeight: 100 },
  sendButton: { borderRadius: 20, overflow: 'hidden' },
  sendButtonDisabled: { opacity: 0.5 },
  sendButtonGradient: { paddingHorizontal: 24, paddingVertical: 12, justifyContent: 'center' },
  sendButtonText: { color: '#ffffff', fontSize: 15, fontWeight: '600' }
});
