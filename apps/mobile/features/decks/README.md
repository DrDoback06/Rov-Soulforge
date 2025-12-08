# 🃏 Deck Builder System

## Overview
Create, edit, and manage battle decks.

## Structure
- `builder/` - Deck building UI
- `management/` - Deck CRUD operations
- `hooks/` - React hooks (useDecks, useDeckBuilder)

## Key Features
- Deck creation and editing
- Card selection from inventory
- Deck validation (min/max cards, class restrictions)
- Multiple deck slots
- Deck templates

## AI Editing Guide
- Change deck UI: `builder/DeckBuilder.tsx`
- Modify validation: `management/DeckValidator.ts`
- Edit deck management: `management/DeckManager.ts`

## Firebase: `/characters/{id}/decks/`
