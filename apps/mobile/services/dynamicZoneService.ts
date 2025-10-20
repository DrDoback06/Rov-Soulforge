/**
 * Dynamic Zone Service
 * 
 * Creates special areas on the map with temporary effects
 * Zones rotate every few hours to keep gameplay fresh
 * 
 * Examples:
 * - Double XP Zone (blue circle)
 * - Magic Find Zone (gold circle) - increased rare drops
 * - Boss Spawn Zone (red circle) - boss may appear
 * - PvP Zone (purple circle) - player vs player enabled
 */

export type ZoneEffect = 
  | 'DoubleXP'
  | 'DoublGold'
  | 'MagicFind'
  | 'BossSpawn'
  | 'MerchantSpawn'
  | 'IncreasedDrops'
  | 'SkillCardDrop'
  | 'PvPEnabled'
  | 'SafeZone'
  | 'WeatherBonus'
  | 'TimeBonus'
  | 'StreakBonus'
  | 'ComboBonus'
  | 'EliteEnemies';

export type ZoneRarity = 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary';

export interface DynamicZone {
  id: string;
  name: string;
  description: string;
  effect: ZoneEffect;
  rarity: ZoneRarity;
  
  // Location
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // meters
  
  // Visual
  color: string;
  opacity: number;
  icon: string;
  
  // Timing
  spawnedAt: number;
  expiresAt: number;
  duration: number; // milliseconds
  
  // Effect strength
  multiplier: number; // e.g., 2.0 for double XP, 1.25 for +25%
  stackable: boolean; // Can this stack with other zones?
}

export class DynamicZoneService {
  private static zones: Map<string, DynamicZone> = new Map();
  private static rotationInterval: NodeJS.Timeout | null = null;
  private static readonly ROTATION_INTERVAL = 3 * 60 * 60 * 1000; // 3 hours

  /**
   * Initialize zone system
   */
  static initialize(playerLocation: { latitude: number; longitude: number }) {
    // Stop existing rotation
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
    }

    // Spawn initial zones
    this.spawnZonesNearLocation(playerLocation, 3);

    // Start rotation timer
    this.rotationInterval = setInterval(() => {
      this.rotateZones(playerLocation);
    }, this.ROTATION_INTERVAL);
  }

  /**
   * Stop zone system
   */
  static shutdown() {
    if (this.rotationInterval) {
      clearInterval(this.rotationInterval);
      this.rotationInterval = null;
    }
  }

  /**
   * Spawn zones near a location
   */
  private static spawnZonesNearLocation(
    location: { latitude: number; longitude: number },
    count: number
  ) {
    for (let i = 0; i < count; i++) {
      const zone = this.createRandomZone(location);
      this.zones.set(zone.id, zone);
    }
  }

  /**
   * Create a random zone near location
   */
  private static createRandomZone(
    center: { latitude: number; longitude: number }
  ): DynamicZone {
    const rarity = this.rollZoneRarity();
    const effect = this.rollZoneEffect(rarity);
    const zoneData = this.getZoneData(effect, rarity);

    // Random offset from center (within 2km)
    const offsetLat = (Math.random() - 0.5) * 0.02;
    const offsetLng = (Math.random() - 0.5) * 0.02;

    const now = Date.now();

    return {
      id: `zone_${Date.now()}_${Math.random()}`,
      name: zoneData.name,
      description: zoneData.description,
      effect,
      rarity,
      center: {
        latitude: center.latitude + offsetLat,
        longitude: center.longitude + offsetLng,
      },
      radius: zoneData.radius,
      color: zoneData.color,
      opacity: 0.3,
      icon: zoneData.icon,
      spawnedAt: now,
      expiresAt: now + this.ROTATION_INTERVAL,
      duration: this.ROTATION_INTERVAL,
      multiplier: this.getRarityMultiplier(rarity),
      stackable: zoneData.stackable,
    };
  }

  /**
   * Roll for zone rarity
   */
  private static rollZoneRarity(): ZoneRarity {
    const roll = Math.random();
    if (roll < 0.01) return 'Legendary'; // 1%
    if (roll < 0.05) return 'Epic'; // 4%
    if (roll < 0.15) return 'Rare'; // 10%
    if (roll < 0.35) return 'Uncommon'; // 20%
    return 'Common'; // 65%
  }

  /**
   * Roll for zone effect based on rarity
   */
  private static rollZoneEffect(rarity: ZoneRarity): ZoneEffect {
    const effects: Record<ZoneRarity, ZoneEffect[]> = {
      Common: ['DoubleXP', 'DoublGold', 'WeatherBonus'],
      Uncommon: ['MagicFind', 'IncreasedDrops', 'TimeBonus'],
      Rare: ['SkillCardDrop', 'MerchantSpawn', 'StreakBonus'],
      Epic: ['BossSpawn', 'EliteEnemies', 'ComboBonus'],
      Legendary: ['PvPEnabled', 'SafeZone'],
    };

    const possibleEffects = effects[rarity];
    return possibleEffects[Math.floor(Math.random() * possibleEffects.length)];
  }

  /**
   * Get zone visual data
   */
  private static getZoneData(effect: ZoneEffect, rarity: ZoneRarity): {
    name: string;
    description: string;
    color: string;
    radius: number;
    icon: string;
    stackable: boolean;
  } {
    const baseRadius = 200; // meters
    const rarityBonus = this.getRarityMultiplier(rarity);
    const radius = baseRadius * rarityBonus;

    const zoneInfo: Record<ZoneEffect, { name: string; description: string; color: string; icon: string; stackable: boolean }> = {
      DoubleXP: {
        name: 'Experience Surge',
        description: 'Gain double XP from all activities',
        color: '#4488ff',
        icon: '⚡',
        stackable: true,
      },
      DoublGold: {
        name: 'Golden Hour',
        description: 'Earn double gold from quests',
        color: '#ffd700',
        icon: '💰',
        stackable: true,
      },
      MagicFind: {
        name: 'Treasure Zone',
        description: '+25% chance for rare items',
        color: '#ffaa00',
        icon: '🎁',
        stackable: false,
      },
      BossSpawn: {
        name: 'Boss Territory',
        description: 'A powerful boss may appear here',
        color: '#ff0000',
        icon: '💀',
        stackable: false,
      },
      MerchantSpawn: {
        name: 'Trade Hub',
        description: 'Traveling merchants frequent this area',
        color: '#9933ff',
        icon: '🏪',
        stackable: false,
      },
      IncreasedDrops: {
        name: 'Bountiful Zone',
        description: 'Enemies drop more loot',
        color: '#00ff00',
        icon: '📦',
        stackable: true,
      },
      SkillCardDrop: {
        name: 'Arcane Convergence',
        description: 'Chance to find rare skill cards',
        color: '#ff00ff',
        icon: '🎴',
        stackable: false,
      },
      PvPEnabled: {
        name: 'Contested Territory',
        description: 'Player vs Player combat enabled',
        color: '#cc0000',
        icon: '⚔️',
        stackable: false,
      },
      SafeZone: {
        name: 'Sanctuary',
        description: 'No enemy spawns, health regeneration',
        color: '#00ccff',
        icon: '🛡️',
        stackable: false,
      },
      WeatherBonus: {
        name: 'Perfect Weather',
        description: '+10% rewards in good weather',
        color: '#33ccff',
        icon: '☀️',
        stackable: true,
      },
      TimeBonus: {
        name: 'Magic Hour',
        description: '+15% rewards at dawn/dusk',
        color: '#ff9933',
        icon: '🌅',
        stackable: true,
      },
      StreakBonus: {
        name: 'Momentum Zone',
        description: '+5% per completed quest (stacks)',
        color: '#ff6600',
        icon: '🔥',
        stackable: true,
      },
      ComboBonus: {
        name: 'Combo Master',
        description: '3x rewards for quest chains',
        color: '#ffcc00',
        icon: '💥',
        stackable: false,
      },
      EliteEnemies: {
        name: 'Elite Grounds',
        description: 'All enemies are Elite rank',
        color: '#ffaa00',
        icon: '⭐',
        stackable: false,
      },
    };

    return {
      ...zoneInfo[effect],
      radius,
    };
  }

  /**
   * Get multiplier for rarity
   */
  private static getRarityMultiplier(rarity: ZoneRarity): number {
    switch (rarity) {
      case 'Legendary':
        return 3.0;
      case 'Epic':
        return 2.5;
      case 'Rare':
        return 2.0;
      case 'Uncommon':
        return 1.5;
      default:
        return 1.0;
    }
  }

  /**
   * Rotate zones (remove expired, spawn new ones)
   */
  private static rotateZones(playerLocation: { latitude: number; longitude: number }) {
    const now = Date.now();

    // Remove expired zones
    const expiredZones = Array.from(this.zones.values()).filter(zone => zone.expiresAt <= now);
    expiredZones.forEach(zone => {
      this.zones.delete(zone.id);
      console.log(`🔄 Zone expired: ${zone.name}`);
    });

    // Spawn new zones to maintain count
    const targetZoneCount = 3;
    const currentCount = this.zones.size;
    const toSpawn = targetZoneCount - currentCount;

    if (toSpawn > 0) {
      this.spawnZonesNearLocation(playerLocation, toSpawn);
      console.log(`✨ Spawned ${toSpawn} new zones`);
    }
  }

  /**
   * Get all active zones
   */
  static getAllZones(): DynamicZone[] {
    const now = Date.now();
    return Array.from(this.zones.values()).filter(zone => zone.expiresAt > now);
  }

  /**
   * Get zones player is currently in
   */
  static getActiveZonesForPlayer(
    playerLocation: { latitude: number; longitude: number }
  ): DynamicZone[] {
    return this.getAllZones().filter(zone => {
      const distance = this.calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        zone.center.latitude,
        zone.center.longitude
      );
      return distance <= zone.radius;
    });
  }

  /**
   * Calculate total reward multiplier for player
   */
  static calculateRewardMultiplier(
    playerLocation: { latitude: number; longitude: number }
  ): {
    xpMultiplier: number;
    goldMultiplier: number;
    dropMultiplier: number;
    activeEffects: string[];
  } {
    const activeZones = this.getActiveZonesForPlayer(playerLocation);

    let xpMultiplier = 1.0;
    let goldMultiplier = 1.0;
    let dropMultiplier = 1.0;
    const activeEffects: string[] = [];

    activeZones.forEach(zone => {
      activeEffects.push(zone.name);

      switch (zone.effect) {
        case 'DoubleXP':
          if (zone.stackable) {
            xpMultiplier *= zone.multiplier;
          } else {
            xpMultiplier = Math.max(xpMultiplier, zone.multiplier);
          }
          break;
        case 'DoublGold':
          if (zone.stackable) {
            goldMultiplier *= zone.multiplier;
          } else {
            goldMultiplier = Math.max(goldMultiplier, zone.multiplier);
          }
          break;
        case 'MagicFind':
        case 'IncreasedDrops':
          dropMultiplier = Math.max(dropMultiplier, zone.multiplier);
          break;
        case 'ComboBonus':
          xpMultiplier *= zone.multiplier;
          goldMultiplier *= zone.multiplier;
          break;
      }
    });

    return {
      xpMultiplier,
      goldMultiplier,
      dropMultiplier,
      activeEffects,
    };
  }

  /**
   * Calculate distance in meters
   */
  private static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
