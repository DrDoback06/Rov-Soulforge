# 👹 Enemy System

## Overview
Enemy spawning, AI behavior, and enemy management.

## Structure
- `spawning/` - Enemy spawn logic
- `ai/` - Enemy AI behavior patterns
- `display/` - Enemy UI components
- `hooks/` - React hooks (useEnemies)

## Key Features
- Procedural enemy spawning
- Enemy AI behavior patterns (aggressive, defensive, etc.)
- Enemy leveling based on player level
- Boss enemies
- Enemy loot tables

## AI Editing Guide
- Change spawn logic: `spawning/EnemySpawner.ts`
- Modify AI: `ai/EnemyAI.ts`
- Edit behavior patterns: `ai/BehaviorPatterns.ts`

## Firebase: `/activeQuests/{questId}/enemies/`
