# 🎒 Inventory System

## Overview
Manages player inventory, stash, item sorting, and filtering.

## Structure
- `display/` - Inventory UI (grid, cards, filters)
- `management/` - Inventory logic (add, remove, sort)
- `stash/` - Stash storage system
- `hooks/` - React hooks (useInventory, useStash)

## Key Features
- Card/item grid display
- Drag-and-drop item management
- Inventory filtering (type, rarity, class)
- Inventory sorting (name, rarity, level)
- Stash system for extra storage

## AI Editing Guide
- Change UI layout: `display/InventoryGrid.tsx`
- Modify sorting: `management/ItemSorter.ts`
- Edit filters: `management/ItemFilter.ts`

## Firebase: `/characters/{id}/inventory/`, `/characters/{id}/stash/`
