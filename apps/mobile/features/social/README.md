# 👥 Social System

## Overview
Friends, trading, parties, and leaderboards.

## Structure
- `friends/` - Friend system (add, remove, list)
- `trading/` - Player-to-player trading
- `party/` - Party/group system
- `leaderboard/` - Rankings by renown/level/gold
- `hooks/` - React hooks (useFriends, useTrade, useParty)

## Key Features
- Send/accept friend requests
- Player-to-player trading
- Party system for group quests
- Global and friend leaderboards
- Social notifications

## AI Editing Guide
- Change friend logic: `friends/FriendManager.ts`
- Modify trading: `trading/TradeManager.ts`
- Edit leaderboards: `leaderboard/RankingCalculator.ts`

## Firebase: `/socialConnections/`, `/leaderboards/`
