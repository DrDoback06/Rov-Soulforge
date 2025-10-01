import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/hooks/useAuth';
import { useCharacter } from '@/hooks/useCharacter';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function CompanionScreen() {
  const { user } = useAuth();
  const { character } = useCharacter();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Greetings, adventurer! I'm Valoris, your AI companion. I'm here to guide you through your journey in the Realm of Valor. Ask me anything about quests, combat, your class, or how to play!",
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const quickActions = [
    { id: '1', text: 'How do I complete quests?' },
    { id: '2', text: 'Explain the battle system' },
    { id: '3', text: 'Tips for my class' },
    { id: '4', text: 'How does deck building work?' },
  ];

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // Get conversation history (last 10 messages)
      const history = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Build context
      const context = {
        characterClass: character?.classId,
        level: character?.level,
        alignment: character?.alignment,
      };

      const response = await fetch(process.env.EXPO_PUBLIC_API_URL + '/ai/companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          history,
          context,
          userId: user?.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(data.timestamp),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Fallback to rule-based response
      const fallbackResponse = getRuleBasedResponse(text.trim(), character);
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAction = (text: string) => {
    sendMessage(text);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#0f0f1e']}
        style={StyleSheet.absoluteFillObject}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Companion</Text>
          <Text style={styles.headerSubtitle}>Valoris, Your Guide</Text>
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userMessage : styles.aiMessage,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user' ? styles.userMessageText : styles.aiMessageText,
                ]}
              >
                {message.content}
              </Text>
              <Text
                style={[
                  styles.timestamp,
                  message.role === 'user' ? styles.userTimestamp : styles.aiTimestamp,
                ]}
              >
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.messageBubble, styles.aiMessage]}>
              <ActivityIndicator size="small" color="#8B5CF6" />
            </View>
          )}
        </ScrollView>

        {messages.length === 1 && (
          <ScrollView
            horizontal
            style={styles.quickActionsContainer}
            contentContainerStyle={styles.quickActionsContent}
            showsHorizontalScrollIndicator={false}
          >
            {quickActions.map(action => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionButton}
                onPress={() => handleQuickAction(action.text)}
              >
                <Text style={styles.quickActionText}>{action.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ask Valoris anything..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage(inputText)}
            multiline
            maxLength={500}
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
            onPress={() => sendMessage(inputText)}
            disabled={!inputText.trim() || isLoading}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// Rule-based fallback for when API is unavailable
function getRuleBasedResponse(message: string, character: any): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('quest')) {
    if (lowerMessage.includes('find') || lowerMessage.includes('where')) {
      return "Open the Map tab to see nearby quests! They appear as markers on the map. Tap any marker to see quest details and navigate there.";
    }
    if (lowerMessage.includes('complete') || lowerMessage.includes('finish')) {
      return "To complete a quest, travel to its location (within the geofence radius). Make sure you meet all requirements, then tap 'Complete Quest'. You'll earn XP, gold, and rewards!";
    }
    return "Quests are location-based adventures! Check the Map tab to find quests near you, then travel to their locations to complete them and earn rewards.";
  }

  if (lowerMessage.includes('battle') || lowerMessage.includes('combat') || lowerMessage.includes('fight')) {
    if (lowerMessage.includes('stack')) {
      return "Combat uses a stack system (LIFO). Cards resolve in reverse order: the last card played resolves first! Play strategically to counter your opponent's moves.";
    }
    return "The stack-based combat system lets you play cards that resolve in Last-In-First-Out order. Watch the stack carefully and time your counters wisely!";
  }

  if (lowerMessage.includes('card') || lowerMessage.includes('deck')) {
    return "You have three deck types: Action (30 cards for combat), Skill (20 cards for abilities), and Loot (15 cards you've found). Visit the Deck Builder to customize your decks!";
  }

  if (lowerMessage.includes('class') && character?.classId) {
    const classAdvice: Record<string, string> = {
      warrior: "Warriors excel at close combat with high HP and armor. Focus on Action cards that deal physical damage and protect your allies!",
      mage: "Mages wield powerful spells but have lower HP. Use ranged attacks and area effects. Manage your mana wisely!",
      rogue: "Rogues are agile strikers. Use stealth, critical hits, and quick combos. Time your attacks when enemies are vulnerable!",
      cleric: "Clerics balance healing and holy damage. Support your allies while smiting evil. Your healing keeps everyone alive!",
      ranger: "Rangers are masters of ranged combat and nature magic. Keep distance, use traps, and call upon animal companions!",
      paladin: "Paladins combine martial prowess with divine magic. Tank damage, heal allies, and smite evil with righteous fury!",
      barbarian: "Barbarians rage into battle with devastating power. High damage, high HP, but watch your defense when raging!",
      druid: "Druids shapeshift and command nature. Adapt to any situation by changing forms. Balance offense with support!",
    };
    return classAdvice[character.classId.toLowerCase()] || "Each class has unique strengths. Experiment with different strategies to master your role!";
  }

  if (lowerMessage.includes('fitness') || lowerMessage.includes('strava') || lowerMessage.includes('exercise')) {
    return "Connect your Strava account in Settings! Your real-world activities earn in-game rewards. Walking, running, and cycling translate to XP, gold, and special loot!";
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
    return `Welcome, adventurer! I'm Valoris, your companion. ${character?.classId ? `I see you're a ${character.classId}. ` : ''}I can help with quests, combat, deck building, or any game questions. What would you like to know?`;
  }

  return "I'm here to help with any aspect of your adventure! Try asking about quests, combat, your class abilities, deck building, or fitness rewards.";
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 80,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#8B5CF6',
  },
  aiMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#374151',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  aiMessageText: {
    color: '#F9FAFB',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  userTimestamp: {
    color: '#E9D5FF',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: '#9CA3AF',
  },
  quickActionsContainer: {
    position: 'absolute',
    bottom: 70,
    left: 0,
    right: 0,
  },
  quickActionsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickActionButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  quickActionText: {
    color: '#D1D5DB',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#1F2937',
    borderTopWidth: 1,
    borderTopColor: '#374151',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#F9FAFB',
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#8B5CF6',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
