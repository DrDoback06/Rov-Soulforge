/**
 * Effect Definitions
 *
 * Card effect types and definitions
 */

export type StatScale = {
  stat: "atk" | "def" | "spd";
  factor: number;
};

export type EffectDef =
  | { type: "damage"; amount: number; scaling?: StatScale }
  | { type: "heal"; amount: number; scaling?: StatScale }
  | { type: "draw"; deck: "Action" | "Skill" | "Loot"; amount: number }
  | { type: "buff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; duration?: "temp" | "battle" | "permanent" }
  | { type: "debuff"; stat: "atk" | "def" | "maxMana" | "maxHp"; amount: number; duration?: "temp" | "battle" }
  | { type: "instantCancel" }
  | { type: "stealRandom"; from: "opponent"; deck: "Action" | "Skill" | "Loot"; amount: number }
  | { type: "spawn"; what: "npc" | "boss" | "quest"; refId: string }
  | { type: "discardRandom"; who: "self" | "opponent"; amount: number }
  | { type: "gainRenown"; amount: number }
  | { type: "gainGold"; amount: number }
  | { type: "gainXP"; amount: number }
  | { type: "gainTempMana"; amount: number }
  | { type: "gainTempHP"; amount: number }
  | { type: "destroyPersistent"; target?: "aura" | "curse" | "summon" | "any" }
  | { type: "equipLoot"; slot: "weapon" | "armor" | "accessory" }
  | { type: "aoe"; damage: number; exclude?: "self" }
  | { type: "persistent"; subtype: "aura" | "curse" | "link"; hp?: number }
  | { type: "custom"; key: string; payload?: any };
