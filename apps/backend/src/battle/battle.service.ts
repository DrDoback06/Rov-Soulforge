import { Injectable, NotFoundException } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { BattleManager } from '@rov/logic';
import type { Battle, Character, BattleMode } from '@rov/types';
import { CreateBattleDto, ExecuteActionDto } from './dto';

@Injectable()
export class BattleService {
  constructor(private readonly firebase: FirebaseService) {}

  async createBattle(dto: CreateBattleDto) {
    const { participants, mode, ranked, bossId } = dto;

    // Load all participant characters
    const characters = new Map<string, Character>();

    for (const uid of participants) {
      const charSnapshot = await this.firebase
        .collection('characters')
        .where('uid', '==', uid)
        .limit(1)
        .get();

      if (!charSnapshot.empty) {
        const char = charSnapshot.docs[0].data() as Character;
        characters.set(char.id, char);
      }
    }

    // Create battle
    const battleRef = this.firebase.collection('battles').doc();
    const battleId = battleRef.id;

    const battleManager = new BattleManager(
      battleId,
      participants,
      characters,
      { mode: mode as BattleMode, ranked, bossId }
    );

    const battleState = battleManager.getState();

    await battleRef.set({
      ...battleState,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return {
      battleId,
      turnOrder: battleState.turnOrder,
      currentTurn: battleState.currentTurn
    };
  }

  async getBattle(battleId: string) {
    const battleDoc = await this.firebase.doc(`battles/${battleId}`).get();

    if (!battleDoc.exists) {
      throw new NotFoundException('Battle not found');
    }

    return battleDoc.data();
  }

  async executeAction(battleId: string, dto: ExecuteActionDto) {
    const battleDoc = await this.firebase.doc(`battles/${battleId}`).get();

    if (!battleDoc.exists) {
      throw new NotFoundException('Battle not found');
    }

    const battle = battleDoc.data() as Battle;

    // Load characters
    const characters = new Map<string, Character>();

    for (const uid of battle.participants) {
      const charSnapshot = await this.firebase
        .collection('characters')
        .where('uid', '==', uid)
        .limit(1)
        .get();

      if (!charSnapshot.empty) {
        const char = charSnapshot.docs[0].data() as Character;
        characters.set(char.id, char);
      }
    }

    // Execute action
    const battleManager = new BattleManager(
      battleId,
      battle.participants,
      characters,
      { mode: battle.mode }
    );

    const result = battleManager.executeAction(dto.action);

    if (!result.success) {
      throw new Error(result.error || 'Action failed');
    }

    // Save updated state
    const updatedBattle = battleManager.getState();

    await battleDoc.ref.update({
      ...updatedBattle,
      updatedAt: new Date()
    });

    // Update characters
    const updatedCharacters = battleManager.getAllCharacters();

    for (const [charId, char] of updatedCharacters) {
      const charDoc = await this.firebase
        .collection('characters')
        .doc(charId)
        .get();

      if (charDoc.exists) {
        await charDoc.ref.update({
          counters: char.counters,
          stats: char.stats,
          lives: char.lives
        });
      }
    }

    return { success: true, battle: updatedBattle };
  }

  async passTurn(battleId: string, charId: string) {
    return this.executeAction(battleId, {
      action: {
        type: 'passTurn',
        charId
      }
    });
  }

  async surrender(battleId: string, charId: string) {
    return this.executeAction(battleId, {
      action: {
        type: 'surrender',
        charId
      }
    });
  }

  async getBattleLog(battleId: string) {
    const battle = await this.getBattle(battleId);
    return { log: battle.log };
  }
}