import type { Battle, Character, Quest, User, ActivityEvent } from '@rov/types';

/**
 * Firebase client wrapper
 *
 * Note: Actual Firebase SDK imports should be done in the consuming app
 * to avoid bundling issues. This file provides typed interfaces.
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

/**
 * Battle API
 */
export class BattleAPI {
  constructor(private callFunction: (name: string, data: any) => Promise<any>) {}

  async createBattle(
    participants: string[],
    mode: string,
    options?: { ranked?: boolean; bossId?: string }
  ) {
    return this.callFunction('createBattle', {
      participants,
      mode,
      ...options
    });
  }

  async executeBattleAction(battleId: string, action: any) {
    return this.callFunction('executeBattleAction', {
      battleId,
      action
    });
  }

  subscribeToBattle(battleId: string, callback: (battle: Battle) => void): () => void {
    // Implementation would use Firestore real-time listeners
    // This is a stub - actual implementation in consuming app
    return () => {};
  }
}

/**
 * Quest API
 */
export class QuestAPI {
  constructor(private callFunction: (name: string, data: any) => Promise<any>) {}

  async getNearbyQuests(lat: number, lng: number, radiusKm: number) {
    return this.callFunction('getNearbyQuests', {
      lat,
      lng,
      radiusKm
    });
  }

  async startQuest(questId: string, location: { lat: number; lng: number }) {
    return this.callFunction('startQuest', {
      questId,
      location
    });
  }

  async completeQuest(progressId: string) {
    return this.callFunction('completeQuest', {
      progressId
    });
  }

  subscribeToQuestProgress(uid: string, callback: (progress: any[]) => void): () => void {
    // Implementation would use Firestore real-time listeners
    return () => {};
  }
}

/**
 * Activity API
 */
export class ActivityAPI {
  constructor(private callFunction: (name: string, data: any) => Promise<any>) {}

  async submitActivity(activity: Partial<ActivityEvent>) {
    return this.callFunction('submitActivity', activity);
  }

  async syncThirdPartyActivity(source: string, accessToken: string) {
    return this.callFunction('syncThirdPartyActivity', {
      source,
      accessToken
    });
  }

  async getActivities(uid: string, limit: number = 20) {
    // Implementation would query Firestore
    return [];
  }
}

/**
 * Shop API
 */
export class ShopAPI {
  constructor(private callFunction: (name: string, data: any) => Promise<any>) {}

  async openPack(packId: string) {
    return this.callFunction('openPack', { packId });
  }

  async purchasePackWithGold(packId: string, quantity: number) {
    return this.callFunction('purchasePackWithGold', {
      packId,
      quantity
    });
  }

  async verifyIAPPurchase(platform: string, receipt: string, productId: string) {
    return this.callFunction('verifyIAPPurchase', {
      platform,
      receipt,
      productId
    });
  }

  async getInventory(uid: string) {
    // Implementation would query Firestore
    return null;
  }
}

/**
 * Character API
 */
export class CharacterAPI {
  constructor(
    private callFunction: (name: string, data: any) => Promise<any>,
    private db: any
  ) {}

  async getCharacter(charId: string): Promise<Character | null> {
    // Implementation would query Firestore
    return null;
  }

  async getCharacterByUid(uid: string): Promise<Character | null> {
    // Implementation would query Firestore
    return null;
  }

  async createCharacter(character: Partial<Character>): Promise<string> {
    // Implementation would create in Firestore
    return '';
  }

  async updateCharacter(charId: string, updates: Partial<Character>): Promise<void> {
    // Implementation would update in Firestore
  }

  subscribeToCharacter(charId: string, callback: (char: Character) => void): () => void {
    // Implementation would use Firestore real-time listeners
    return () => {};
  }
}

/**
 * User API
 */
export class UserAPI {
  constructor(
    private callFunction: (name: string, data: any) => Promise<any>,
    private db: any
  ) {}

  async getUser(uid: string): Promise<User | null> {
    // Implementation would query Firestore
    return null;
  }

  async createUser(user: User): Promise<void> {
    // Implementation would create in Firestore
  }

  async updateUser(uid: string, updates: Partial<User>): Promise<void> {
    // Implementation would update in Firestore
  }
}

/**
 * Main Firebase client
 */
export class ROVFirebase {
  public battle: BattleAPI;
  public quest: QuestAPI;
  public activity: ActivityAPI;
  public shop: ShopAPI;
  public character: CharacterAPI;
  public user: UserAPI;

  constructor(
    private auth: any,
    private db: any,
    private functions: any
  ) {
    const callFunction = async (name: string, data: any) => {
      // Wrapper around Firebase callable functions
      const fn = this.functions.httpsCallable(name);
      const result = await fn(data);
      return result.data;
    };

    this.battle = new BattleAPI(callFunction);
    this.quest = new QuestAPI(callFunction);
    this.activity = new ActivityAPI(callFunction);
    this.shop = new ShopAPI(callFunction);
    this.character = new CharacterAPI(callFunction, db);
    this.user = new UserAPI(callFunction, db);
  }

  /**
   * Sign in anonymously
   */
  async signInAnonymously() {
    return this.auth.signInAnonymously();
  }

  /**
   * Sign in with email/password
   */
  async signInWithEmail(email: string, password: string) {
    return this.auth.signInWithEmailAndPassword(email, password);
  }

  /**
   * Sign up with email/password
   */
  async signUpWithEmail(email: string, password: string) {
    return this.auth.createUserWithEmailAndPassword(email, password);
  }

  /**
   * Sign out
   */
  async signOut() {
    return this.auth.signOut();
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.auth.currentUser;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: any) => void): () => void {
    return this.auth.onAuthStateChanged(callback);
  }
}