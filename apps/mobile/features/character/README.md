# 👤 Character System

## Overview
Manages character creation, stats, leveling, equipment, and progression.

## Structure
- `creation/` - Character creation flow
- `stats/` - Stats calculation and leveling
- `equipment/` - Equipment management
- `hooks/` - React hooks (useCharacter, useCharacterStats)

## Key Features
- Character creation with class selection
- Stat management (HP, mana, strength, etc.)
- Level-up system with XP tracking
- Equipment slots (weapon, armor, accessories)
- Character appearance customization

## AI Editing Guide
- Change stats: `stats/StatCalculator.ts`
- Modify leveling: `stats/LevelUpSystem.ts`
- Edit creation flow: `creation/CharacterCreator.tsx`

## Firebase: `/characters/{characterId}/`
