import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { FirebaseService } from '../firebase/firebase.service';

interface CompanionContext {
  characterClass?: string;
  level?: number;
  alignment?: string;
  location?: { latitude: number; longitude: number };
  activeQuests?: number;
  deckSize?: number;
}

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

@Injectable()
export class AiService {
  private openai: OpenAI;
  private systemPrompt = `You are Valoris, a wise and friendly AI companion in the Realm of Valor adventure game. You guide players through their journey with helpful advice, encouragement, and game knowledge.

Game Overview:
- Players choose from 8 classes: Warrior, Mage, Rogue, Cleric, Ranger, Paladin, Barbarian, Druid
- Three alignments: Lawful, Neutral, Chaotic
- Three deck types: Action (30 cards), Skill (20 cards), Loot (15 cards)
- Combat uses a stack-based system (LIFO - Last In, First Out)
- Players complete real-world quests by traveling to GPS locations
- Fitness activities (walking, running, cycling) earn rewards via Strava integration

Your personality:
- Warm, encouraging, and enthusiastic
- Knowledgeable but not condescending
- Uses occasional fantasy-themed language naturally
- Brief responses (2-4 sentences usually)
- Celebrates player achievements

Keep responses concise and actionable. Focus on what the player asked about.`;

  constructor(
    private configService: ConfigService,
    private firebaseService: FirebaseService,
  ) {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    if (apiKey) {
      this.openai = new OpenAI({ apiKey });
    }
  }

  async getCompanionResponse(
    userId: string,
    message: string,
    history: Message[],
    context: CompanionContext,
  ): Promise<string> {
    if (!this.openai) {
      return this.getRuleBasedFallback(message, context);
    }

    try {
      // Build context-aware system message
      let contextInfo = '';
      if (context.characterClass) {
        contextInfo += `The player is a level ${context.level || 1} ${context.characterClass}`;
        if (context.alignment) contextInfo += ` with ${context.alignment} alignment`;
        contextInfo += '. ';
      }
      if (context.activeQuests) {
        contextInfo += `They have ${context.activeQuests} active quest(s). `;
      }

      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        {
          role: 'system',
          content: this.systemPrompt + (contextInfo ? `\n\nCurrent context: ${contextInfo}` : ''),
        },
        ...history.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        })),
        { role: 'user', content: message },
      ];

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 200,
        temperature: 0.8,
      });

      const response = completion.choices[0]?.message?.content || 'I apologize, I seem to have lost my train of thought. Could you ask that again?';

      // Log conversation to Firestore for analytics
      await this.logConversation(userId, message, response, context);

      return response;
    } catch (error) {
      console.error('OpenAI API error:', error);
      return this.getRuleBasedFallback(message, context);
    }
  }

  private getRuleBasedFallback(message: string, context: CompanionContext): string {
    const lowerMessage = message.toLowerCase();

    // Quest-related
    if (lowerMessage.includes('quest')) {
      if (lowerMessage.includes('find') || lowerMessage.includes('where')) {
        return "Open the Map tab to see nearby quests! They appear as markers on the map. Tap any marker to see quest details and navigate there.";
      }
      if (lowerMessage.includes('complete') || lowerMessage.includes('finish')) {
        return "To complete a quest, travel to its location (within the geofence radius). Make sure you meet all requirements, then tap 'Complete Quest'. You'll earn XP, gold, and rewards!";
      }
      return "Quests are location-based adventures! Check the Map tab to find quests near you, then travel to their locations to complete them and earn rewards.";
    }

    // Battle system
    if (lowerMessage.includes('battle') || lowerMessage.includes('combat') || lowerMessage.includes('fight')) {
      if (lowerMessage.includes('stack')) {
        return "Combat uses a stack system (LIFO). Cards resolve in reverse order: the last card played resolves first! Play strategically to counter your opponent's moves.";
      }
      return "The stack-based combat system lets you play cards that resolve in Last-In-First-Out order. Watch the stack carefully and time your counters wisely!";
    }

    // Cards and deck building
    if (lowerMessage.includes('card') || lowerMessage.includes('deck')) {
      return "You have three deck types: Action (30 cards for combat), Skill (20 cards for abilities), and Loot (15 cards you've found). Visit the Deck Builder to customize your decks!";
    }

    // Class-specific advice
    if (context.characterClass) {
      const classLower = context.characterClass.toLowerCase();
      if (lowerMessage.includes('class') || lowerMessage.includes(classLower)) {
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
        return classAdvice[classLower] || "Each class has unique strengths. Experiment with different strategies to master your role!";
      }
    }

    // Fitness integration
    if (lowerMessage.includes('fitness') || lowerMessage.includes('strava') || lowerMessage.includes('exercise')) {
      return "Connect your Strava account in Settings! Your real-world activities earn in-game rewards. Walking, running, and cycling translate to XP, gold, and special loot!";
    }

    // General welcome/help
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('help')) {
      return `Welcome, adventurer! I'm Valoris, your companion. ${context.characterClass ? `I see you're a ${context.characterClass}. ` : ''}I can help with quests, combat, deck building, or any game questions. What would you like to know?`;
    }

    // Default response
    return "I'm here to help with any aspect of your adventure! Try asking about quests, combat, your class abilities, deck building, or fitness rewards.";
  }

  private async logConversation(
    userId: string,
    userMessage: string,
    aiResponse: string,
    context: CompanionContext,
  ): Promise<void> {
    try {
      await this.firebaseService.firestore.collection('ai_conversations').add({
        userId,
        userMessage,
        aiResponse,
        context,
        timestamp: new Date(),
      });
    } catch (error) {
      console.error('Error logging conversation:', error);
    }
  }
}
