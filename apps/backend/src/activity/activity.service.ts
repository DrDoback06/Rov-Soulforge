import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class ActivityService {
  constructor(private readonly firebase: FirebaseService) {}

  async submitActivity(activityData: any) {
    // Validate activity
    const validation = this.validateActivity(activityData);

    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    // Create activity event
    const activityRef = this.firebase.collection('activityEvents').doc();

    await activityRef.set({
      ...activityData,
      id: activityRef.id,
      createdAt: new Date()
    });

    return {
      activityId: activityRef.id,
      validated: true
    };
  }

  async getActivities(uid: string) {
    const snapshot = await this.firebase
      .collection('activityEvents')
      .where('uid', '==', uid)
      .orderBy('start', 'desc')
      .limit(20)
      .get();

    return {
      activities: snapshot.docs.map((doc) => doc.data())
    };
  }

  private validateActivity(activity: any): { valid: boolean; reason?: string } {
    const { start, end, distanceM } = activity;

    if (!start || !end) {
      return { valid: false, reason: 'Missing timestamps' };
    }

    const durationMs = end - start;
    const durationMin = durationMs / 1000 / 60;

    if (durationMin < 1) {
      return { valid: false, reason: 'Activity too short' };
    }

    if (durationMin > 720) {
      return { valid: false, reason: 'Activity too long' };
    }

    if (distanceM && distanceM > 0) {
      const paceMinPerKm = durationMin / (distanceM / 1000);

      if (paceMinPerKm < 2 || paceMinPerKm > 25) {
        return { valid: false, reason: 'Unrealistic pace' };
      }
    }

    return { valid: true };
  }
}