# 🏪 Shop System

## Overview
In-game shop for purchasing cards, packs, and items using gold/renown.

## Structure
- `display/` - Shop UI (items, packs, cart)
- `catalog/` - Shop items and pack definitions
- `transactions/` - Purchase logic and currency management
- `hooks/` - React hooks (useShop, usePurchase)

## Key Features
- Purchase card packs
- Buy individual items
- Pack opening animations
- Currency management (gold, renown)
- Daily/weekly shop rotation

## AI Editing Guide
- Change shop items: `catalog/ShopCatalog.ts`
- Modify pack generation: `catalog/PackGenerator.ts`
- Edit purchase flow: `transactions/PurchaseManager.ts`

## Firebase: `/shop/`, `/characters/{id}/purchases/`
