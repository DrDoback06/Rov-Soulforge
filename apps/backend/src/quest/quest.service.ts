import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as geofireCommon from 'geofire-common';

@Injectable()
export class QuestService {
  constructor(private readonly firebase: FirebaseService) {}

  async getNearbyQuests(lat: number, lng: number, radiusKm: number) {
    const center = [lat, lng];
    const radiusM = radiusKm * 1000;

    // Calculate geohash bounds
    const bounds = geofireCommon.geohashQueryBounds(center, radiusM);

    // Query all geohash ranges
    const promises = bounds.map((bound) => {
      return this.firebase
        .collection('activeQuests')
        .where('location.geohash', '>=', bound[0])
        .where('location.geohash', '<=', bound[1])
        .where('expireAt', '>', Date.now())
        .get();
    });

    const snapshots = await Promise.all(promises);

    // Flatten and filter by actual distance
    const quests: any[] = [];

    snapshots.forEach((snapshot) => {
      snapshot.docs.forEach((doc) => {
        const quest = doc.data();

        const distance = geofireCommon.distanceBetween(
          center,
          [quest.location.lat, quest.location.lng]
        );

        if (distance <= radiusKm) {
          quests.push({
            ...quest,
            distanceKm: distance
          });
        }
      });
    });

    // Sort by distance
    quests.sort((a, b) => a.distanceKm - b.distanceKm);

    return { quests };
  }

  async getQuest(questId: string) {
    const questDoc = await this.firebase.doc(`activeQuests/${questId}`).get();

    if (!questDoc.exists) {
      throw new NotFoundException('Quest not found');
    }

    return questDoc.data();
  }

  async startQuest(
    questId: string,
    uid: string,
    location: { lat: number; lng: number }
  ) {
    const quest = await this.getQuest(questId);

    // Verify geofence
    const distance = geofireCommon.distanceBetween(
      [location.lat, location.lng],
      [quest.location.lat, quest.location.lng]
    );

    const distanceM = distance * 1000;

    if (distanceM > quest.location.radiusM) {
      throw new Error('Not within quest area');
    }

    // Create quest progress
    const progressRef = this.firebase.collection('questProgress').doc();

    await progressRef.set({
      id: progressRef.id,
      uid,
      questId,
      status: 'active',
      progress: {},
      startedAt: new Date()
    });

    // Add user to active participants
    await this.firebase.doc(`activeQuests/${questId}`).update({
      activeParticipants: (quest.activeParticipants || []).concat(uid)
    });

    return {
      progressId: progressRef.id,
      quest
    };
  }

  async completeQuest(progressId: string) {
    const progressDoc = await this.firebase
      .doc(`questProgress/${progressId}`)
      .get();

    if (!progressDoc.exists) {
      throw new NotFoundException('Quest progress not found');
    }

    const progress = progressDoc.data();

    if (progress.status !== 'ready') {
      throw new Error('Quest requirements not met');
    }

    // Load quest
    const quest = await this.getQuest(progress.questId);

    // Grant rewards
    const rewards = quest.rewards || [];

    let goldReward = 0;
    let xpReward = 0;
    let renownReward = 0;

    rewards.forEach((reward: any) => {
      if (reward.type === 'gold') goldReward += reward.amount;
      if (reward.type === 'xp') xpReward += reward.amount;
      if (reward.type === 'renown') renownReward += reward.amount;
    });

    // Update character
    const charSnapshot = await this.firebase
      .collection('characters')
      .where('uid', '==', progress.uid)
      .limit(1)
      .get();

    if (!charSnapshot.empty) {
      const charDoc = charSnapshot.docs[0];
      const char = charDoc.data();

      await charDoc.ref.update({
        gold: char.gold + goldReward,
        'counters.xp': char.counters.xp + xpReward,
        'counters.renown': char.counters.renown + renownReward
      });
    }

    // Mark progress as completed
    await progressDoc.ref.update({
      status: 'completed',
      completedAt: new Date()
    });

    return {
      rewards: {
        gold: goldReward,
        xp: xpReward,
        renown: renownReward
      }
    };
  }

  async getQuestProgress(uid: string) {
    const snapshot = await this.firebase
      .collection('questProgress')
      .where('uid', '==', uid)
      .where('status', 'in', ['active', 'ready'])
      .get();

    return {
      progress: snapshot.docs.map((doc) => doc.data())
    };
  }
}