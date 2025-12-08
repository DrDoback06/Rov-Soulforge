# 🏃 Fitness System

## Overview
Tracks physical activity, integrates with third-party services (Strava), and rewards players for fitness.

## Structure
- `tracking/` - Activity tracking (steps, distance, calories)
- `integrations/` - Strava, Google Fit, Apple Health
- `rewards/` - Fitness-based rewards
- `ui/` - Fitness stats display
- `hooks/` - React hooks (useFitnessTracker, useActivitySync)

## Key Features
- Step counting and distance tracking
- Strava OAuth integration
- Google Fit integration (Android)
- Apple Health integration (iOS)
- Fitness quest objectives
- Rewards for physical activity

## AI Editing Guide
- Change tracking: `tracking/FitnessTracker.ts`
- Modify Strava integration: `integrations/StravaIntegration.ts`
- Edit rewards: `rewards/ActivityRewards.ts`

## Firebase: `/characters/{id}/activity/`
