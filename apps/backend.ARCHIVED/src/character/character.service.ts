import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import type { Character } from '@rov/types';

@Injectable()
export class CharacterService {
  constructor(private readonly firebase: FirebaseService) {}

  async getCharacter(id: string) {
    const charDoc = await this.firebase.doc(`characters/${id}`).get();

    if (!charDoc.exists) {
      throw new NotFoundException('Character not found');
    }

    return charDoc.data();
  }

  async getCharacterByUid(uid: string) {
    const snapshot = await this.firebase
      .collection('characters')
      .where('uid', '==', uid)
      .limit(1)
      .get();

    if (snapshot.empty) {
      throw new NotFoundException('Character not found');
    }

    return snapshot.docs[0].data();
  }

  async createCharacter(characterData: Partial<Character>) {
    const charRef = this.firebase.collection('characters').doc();

    const newCharacter: Character = {
      id: charRef.id,
      uid: characterData.uid || '',
      classId: characterData.classId,
      alignment: characterData.alignment,
      counters: {
        hp: characterData.counters?.hp || 100,
        mana: characterData.counters?.mana || 10,
        xp: characterData.counters?.xp || 0,
        renown: characterData.counters?.renown || 0
      },
      stats: {
        atk: characterData.stats?.atk || 5,
        def: characterData.stats?.def || 5,
        spd: characterData.stats?.spd || 5,
        maxHp: characterData.stats?.maxHp || 100,
        maxMana: characterData.stats?.maxMana || 10
      },
      level: 1,
      lives: 3,
      inventory: [],
      equipped: {},
      skills: [],
      gold: 100
    };

    await charRef.set(newCharacter);

    return { id: charRef.id, character: newCharacter };
  }

  async updateCharacter(id: string, updates: Partial<Character>) {
    const charDoc = await this.firebase.doc(`characters/${id}`).get();

    if (!charDoc.exists) {
      throw new NotFoundException('Character not found');
    }

    await charDoc.ref.update(updates);

    return { success: true };
  }
}