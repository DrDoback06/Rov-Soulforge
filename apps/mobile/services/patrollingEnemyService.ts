/**
 * Patrolling Enemy Service
 * 
 * Manages enemies/NPCs that move around the map
 * Players can see them in real-time and engage in battles
 */

export type EnemyRarity = 'Common' | 'Elite' | 'Boss' | 'Merchant';
export type EnemyBehavior = 'Patrol' | 'Guard' | 'Chase' | 'Flee' | 'Wander';

export interface PatrollingEnemy {
  id: string;
  name: string;
  type: string; // 'Goblin', 'Dragon', 'Merchant', etc.
  level: number;
  rarity: EnemyRarity;
  behavior: EnemyBehavior;
  
  // Current position
  location: {
    latitude: number;
    longitude: number;
  };
  
  // Movement
  patrolRoute?: Array<{ latitude: number; longitude: number }>;
  currentRouteIndex: number;
  moveSpeed: number; // meters per update (every 3 seconds)
  
  // Combat stats
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  
  // Visual
  icon: string;
  color: string; // For marker color
  
  // Interaction
  aggroRadius: number; // meters - distance at which enemy notices player
  isAggressive: boolean;
  
  // Rewards
  rewardMultiplier: number; // Based on rarity
  
  // State
  lastUpdate: number;
  isDefeated: boolean;
  respawnTime?: number; // If defeated
}

export class PatrollingEnemyService {
  private static enemies: Map<string, PatrollingEnemy> = new Map();
  private static updateInterval: NodeJS.Timeout | null = null;

  /**
   * Initialize enemy patrol system
   */
  static initialize(playerLocation: { latitude: number; longitude: number }) {
    // Stop existing updates
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }

    // Spawn initial enemies near player
    this.spawnEnemiesNearLocation(playerLocation, 5); // Spawn 5 enemies

    // Start update loop (every 3 seconds)
    this.updateInterval = setInterval(() => {
      this.updateAllEnemies();
    }, 3000);
  }

  /**
   * Stop patrol system
   */
  static shutdown() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  /**
   * Spawn enemies near a location
   */
  static spawnEnemiesNearLocation(
    location: { latitude: number; longitude: number },
    count: number
  ): PatrollingEnemy[] {
    const newEnemies: PatrollingEnemy[] = [];

    for (let i = 0; i < count; i++) {
      const enemy = this.createRandomEnemy(location);
      this.enemies.set(enemy.id, enemy);
      newEnemies.push(enemy);
    }

    return newEnemies;
  }

  /**
   * Create a random enemy near location
   */
  private static createRandomEnemy(
    center: { latitude: number; longitude: number }
  ): PatrollingEnemy {
    const rarity = this.rollEnemyRarity();
    const enemyType = this.getEnemyTypeByRarity(rarity);
    const level = Math.floor(Math.random() * 10) + 1;

    // Random offset from center (within 1km)
    const offsetLat = (Math.random() - 0.5) * 0.01;
    const offsetLng = (Math.random() - 0.5) * 0.01;

    const location = {
      latitude: center.latitude + offsetLat,
      longitude: center.longitude + offsetLng,
    };

    // Create patrol route (4-6 points in a loop)
    const patrolRoute = this.generatePatrolRoute(location, 4);

    const baseHp = 100 + level * 20;
    const hpMultiplier = this.getRarityMultiplier(rarity);

    return {
      id: `enemy_${Date.now()}_${Math.random()}`,
      name: `${rarity} ${enemyType.name}`,
      type: enemyType.name,
      level,
      rarity,
      behavior: enemyType.behavior,
      location,
      patrolRoute,
      currentRouteIndex: 0,
      moveSpeed: 10 + Math.random() * 10, // 10-20 meters per update
      hp: baseHp * hpMultiplier,
      maxHp: baseHp * hpMultiplier,
      attack: 10 + level * 2,
      defense: 5 + level,
      icon: enemyType.icon,
      color: this.getRarityColor(rarity),
      aggroRadius: enemyType.aggroRadius,
      isAggressive: enemyType.isAggressive,
      rewardMultiplier: hpMultiplier,
      lastUpdate: Date.now(),
      isDefeated: false,
    };
  }

  /**
   * Roll for enemy rarity
   */
  private static rollEnemyRarity(): EnemyRarity {
    const roll = Math.random();
    if (roll < 0.02) return 'Boss'; // 2% Boss
    if (roll < 0.07) return 'Merchant'; // 5% Merchant (friendly NPC)
    if (roll < 0.20) return 'Elite'; // 13% Elite
    return 'Common'; // 80% Common
  }

  /**
   * Get enemy type data
   */
  private static getEnemyTypeByRarity(rarity: EnemyRarity): {
    name: string;
    icon: string;
    behavior: EnemyBehavior;
    aggroRadius: number;
    isAggressive: boolean;
  } {
    if (rarity === 'Merchant') {
      return {
        name: 'Traveling Merchant',
        icon: '🧙',
        behavior: 'Wander',
        aggroRadius: 30,
        isAggressive: false,
      };
    }

    if (rarity === 'Boss') {
      const bosses = [
        { name: 'Ancient Dragon', icon: '🐉' },
        { name: 'Frost Giant', icon: '🗿' },
        { name: 'Shadow Lord', icon: '👹' },
      ];
      const boss = bosses[Math.floor(Math.random() * bosses.length)];
      return {
        ...boss,
        behavior: 'Guard',
        aggroRadius: 100,
        isAggressive: true,
      };
    }

    const commonEnemies = [
      { name: 'Goblin', icon: '👺', behavior: 'Patrol' as EnemyBehavior },
      { name: 'Wolf', icon: '🐺', behavior: 'Chase' as EnemyBehavior },
      { name: 'Bandit', icon: '🗡️', behavior: 'Patrol' as EnemyBehavior },
      { name: 'Skeleton', icon: '💀', behavior: 'Wander' as EnemyBehavior },
    ];

    const enemy = commonEnemies[Math.floor(Math.random() * commonEnemies.length)];
    return {
      ...enemy,
      aggroRadius: rarity === 'Elite' ? 75 : 50,
      isAggressive: true,
    };
  }

  /**
   * Get rarity color for map marker
   */
  private static getRarityColor(rarity: EnemyRarity): string {
    switch (rarity) {
      case 'Boss':
        return '#ff0000'; // Red
      case 'Elite':
        return '#ffd700'; // Gold
      case 'Merchant':
        return '#9933ff'; // Purple
      default:
        return '#666666'; // Grey
    }
  }

  /**
   * Get HP/reward multiplier for rarity
   */
  private static getRarityMultiplier(rarity: EnemyRarity): number {
    switch (rarity) {
      case 'Boss':
        return 5.0;
      case 'Elite':
        return 2.0;
      case 'Merchant':
        return 1.0; // Non-combat
      default:
        return 1.0;
    }
  }

  /**
   * Generate patrol route around a center point
   */
  private static generatePatrolRoute(
    center: { latitude: number; longitude: number },
    pointCount: number
  ): Array<{ latitude: number; longitude: number }> {
    const route: Array<{ latitude: number; longitude: number }> = [];
    const radius = 0.002; // ~200m radius

    for (let i = 0; i < pointCount; i++) {
      const angle = (i / pointCount) * Math.PI * 2;
      route.push({
        latitude: center.latitude + Math.cos(angle) * radius,
        longitude: center.longitude + Math.sin(angle) * radius,
      });
    }

    return route;
  }

  /**
   * Update all enemy positions
   */
  private static updateAllEnemies() {
    const now = Date.now();

    this.enemies.forEach((enemy, id) => {
      if (enemy.isDefeated) {
        // Handle respawn
        if (enemy.respawnTime && now >= enemy.respawnTime) {
          enemy.isDefeated = false;
          enemy.hp = enemy.maxHp;
          delete enemy.respawnTime;
        }
        return;
      }

      // Move enemy based on behavior
      this.moveEnemy(enemy);
      enemy.lastUpdate = now;
    });
  }

  /**
   * Move enemy according to its behavior
   */
  private static moveEnemy(enemy: PatrollingEnemy) {
    switch (enemy.behavior) {
      case 'Patrol':
        this.moveAlongPatrol(enemy);
        break;
      case 'Wander':
        this.wander(enemy);
        break;
      case 'Guard':
        // Guards don't move
        break;
      // Chase and Flee require player location - handled elsewhere
    }
  }

  /**
   * Move enemy along patrol route
   */
  private static moveAlongPatrol(enemy: PatrollingEnemy) {
    if (!enemy.patrolRoute || enemy.patrolRoute.length === 0) return;

    const target = enemy.patrolRoute[enemy.currentRouteIndex];
    const reached = this.moveTowards(enemy, target, enemy.moveSpeed);

    if (reached) {
      // Move to next waypoint
      enemy.currentRouteIndex = (enemy.currentRouteIndex + 1) % enemy.patrolRoute.length;
    }
  }

  /**
   * Random wandering movement
   */
  private static wander(enemy: PatrollingEnemy) {
    // Move in random direction
    const angle = Math.random() * Math.PI * 2;
    const distance = enemy.moveSpeed / 111320; // Convert meters to degrees (approx)

    enemy.location.latitude += Math.cos(angle) * distance;
    enemy.location.longitude += Math.sin(angle) * distance;
  }

  /**
   * Move enemy towards a target
   * Returns true if reached
   */
  private static moveTowards(
    enemy: PatrollingEnemy,
    target: { latitude: number; longitude: number },
    speed: number
  ): boolean {
    const distance = this.calculateDistance(
      enemy.location.latitude,
      enemy.location.longitude,
      target.latitude,
      target.longitude
    );

    if (distance <= speed) {
      // Reached target
      enemy.location = target;
      return true;
    }

    // Move towards target
    const ratio = speed / distance;
    enemy.location.latitude += (target.latitude - enemy.location.latitude) * ratio;
    enemy.location.longitude += (target.longitude - enemy.location.longitude) * ratio;
    return false;
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

  /**
   * Get all active enemies
   */
  static getAllEnemies(): PatrollingEnemy[] {
    return Array.from(this.enemies.values()).filter(e => !e.isDefeated);
  }

  /**
   * Get enemies near player (for aggro detection)
   */
  static getEnemiesNearPlayer(
    playerLocation: { latitude: number; longitude: number },
    radius: number = 100
  ): PatrollingEnemy[] {
    return this.getAllEnemies().filter(enemy => {
      const distance = this.calculateDistance(
        playerLocation.latitude,
        playerLocation.longitude,
        enemy.location.latitude,
        enemy.location.longitude
      );
      return distance <= radius;
    });
  }

  /**
   * Mark enemy as defeated
   */
  static defeatEnemy(enemyId: string) {
    const enemy = this.enemies.get(enemyId);
    if (enemy) {
      enemy.isDefeated = true;
      enemy.respawnTime = Date.now() + 5 * 60 * 1000; // Respawn in 5 minutes
    }
  }
}
