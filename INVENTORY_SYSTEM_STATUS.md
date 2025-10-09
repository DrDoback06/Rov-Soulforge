# 📦 Inventory System Status & Next Steps

**Date**: October 5, 2025
**Status**: Core systems exist, need UI polish & slot restrictions

---

## ✅ What's Working Now

### 1. Card Collection Tab (inventory.tsx)
**Status**: READ-ONLY ✅ (Fixed)
- Shows all cards you own
- Searchable & filterable
- Click card → "Show in Stash" button
- Hover preview with card details
- This is just for viewing your collection

### 2. Stash Tab (stash.tsx)  
**Status**: Drag-and-Drop EXISTS ✅
- 4 tabs: Equipment, Consumables, Materials, Misc
- 200 slots per tab
- Grid layout
- Already has `DraggableItem` and `DropZone` components
- Can drag items around
- **Needs**: Updated UI to match rest of app

### 3. Shop Tab
**Status**: COMPLETE ✅
- Buy/Sell tabs
- Diablo II merchant style
- Working perfectly

---

## 🔄 What Needs Work

### Priority 1: Equipment Slot Type Restrictions
**Location**: Character equipment screen (not in tabs yet?)

**Current Issue**: Any card can go in any slot

**What's Needed**:
```typescript
// Equipment slot types
const EQUIPMENT_SLOTS = {
  head: { acceptedTypes: ['helmet', 'hat', 'crown'] },
  chest: { acceptedTypes: ['armor', 'robe', 'chest'] },
  mainHand: { acceptedTypes: ['weapon', 'sword', 'axe', 'staff', 'bow'] },
  offHand: { acceptedTypes: ['shield', 'tome', 'orb'] },
  gloves: { acceptedTypes: ['gloves', 'gauntlets'] },
  boots: { acceptedTypes: ['boots', 'shoes'] },
  ring1: { acceptedTypes: ['ring'] },
  ring2: { acceptedTypes: ['ring'] },
  amulet: { acceptedTypes: ['amulet', 'necklace'] }
};

// In DropZone component:
function canAcceptItem(slot: string, item: any): boolean {
  const slotConfig = EQUIPMENT_SLOTS[slot];
  return slotConfig.acceptedTypes.includes(item.type);
}
```

**Files to Update**:
- `rov/apps/mobile/components/DropZone.tsx` - Add type checking
- `rov/apps/mobile/app/(tabs)/profile.tsx` (or character equipment screen)

---

### Priority 2: Slot-to-Slot Dragging for Sorting
**Location**: Stash tab

**Current**: Items can be dragged, but sorting between slots might not work

**What's Needed**:
```typescript
// Allow dropping in ANY stash slot to reorder
function handleSlotToSlotMove(
  sourceSlot: number,
  targetSlot: number,
  item: any
) {
  const newItems = [...currentTabItems];
  
  // Remove from source
  newItems.splice(sourceSlot, 1);
  
  // Insert at target
  newItems.splice(targetSlot, 0, item);
  
  // Save to Firestore
  updateStash(activeTab, newItems);
}
```

**Files to Update**:
- `rov/apps/mobile/app/(tabs)/stash.tsx` - Add slot-to-slot logic

---

### Priority 3: Update Stash UI to Match App Style
**Location**: Stash tab

**Current**: Basic grid, might not match Quest/Shop style

**What's Needed**:
- Use same gradient backgrounds
- Same card hover style
- Same button styles
- Match color scheme (#1a1a2e, #4488ff, etc.)

**Example Styles** (from Shop tab):
```typescript
container: {
  flex: 1,
  backgroundColor: '#1a1a2e' // Use gradients
},
card: {
  borderRadius: 16,
  borderWidth: 2,
  borderColor: '#3a3a4e'
},
button: {
  backgroundColor: '#4488ff', // Primary action
  borderRadius: 12,
  padding: 16
}
```

---

### Priority 4: Drop-Down Inventory
**Location**: Not found yet - needs creating?

**User Wants**: Character equipment visible in a drop-down panel

**What to Create**:
```typescript
// Component: CharacterEquipmentPanel.tsx
- Overlays on screen
- Shows equipped items
- Can drag items to/from equipment slots
- Collapsible panel
```

**Where to Add**:
- Maybe in Map screen as floating panel?
- Or Profile tab?
- Ask user where they want this

---

## 📋 Implementation Checklist

### Immediate (1-2 hours):
- [ ] Add equipment slot type restrictions
  - Update DropZone to check item.type
  - Show red border if incompatible
  - Display tooltip "This item can't go here"

- [ ] Enable slot-to-slot sorting in Stash
  - Each stash slot is both DraggableItem AND DropZone
  - On drop, swap items or move to empty slot
  - Update Firestore on change

- [ ] Update Stash UI styling
  - Match gradient backgrounds from other tabs
  - Use same LinearGradient colors
  - Update button styles
  - Add hover effects

### Next (2-3 hours):
- [ ] Find/Create character equipment screen
  - Profile tab shows basic stats
  - Need dedicated equipment management
  - Or add to Profile tab

- [ ] Create drop-down inventory panel
  - Floating panel that slides out
  - Shows all equipped items
  - Drag to swap equipment
  - Add to Map or Profile screen

- [ ] Test full flow:
  - Card Collection (view only) ✓
  - Buy pack in Shop ✓
  - Open pack → cards go to Stash
  - Stash → sort cards
  - Stash → equip to character
  - Equipped → use in battle

---

## 🗺️ Where Are Each Tab/Screen?

### Current Tab Structure:
```
rov/apps/mobile/app/(tabs)/
├── index.tsx          - Map tab ✅
├── quests.tsx         - Quest management ✅
├── inventory.tsx      - Card Collection (READ-ONLY) ✅
├── stash.tsx          - Main inventory/storage ✅
├── shop.tsx           - Buy/Sell shop ✅
├── profile.tsx        - Character stats
├── leaderboard.tsx    - Rankings ✅
├── companion.tsx      - AI companion
└── decks.tsx          - Deck builder
```

### Missing/Unclear:
- **Character Equipment Screen** - Where? Profile tab? Separate screen?
- **Drop-Down Inventory** - Where should this appear? User needs to specify

---

## 🎯 What to Do NEXT

**Option A: Continue Quest Tab Enhancement** (original plan)
- Phase 2: Drag-to-reorder quests
- Phase 3: Sections/categories
- Phase 4-6: Layout options, filters, abandon modal

**Option B: Fix Inventory System** (current request)
- Add equipment slot restrictions
- Enable slot-to-slot sorting
- Update Stash UI
- Create/find character equipment screen

**Ask User**: Which should we prioritize?

---

## 🔍 Key Questions for User

1. **Where is the character equipment screen?**
   - Is it in Profile tab?
   - Separate screen?
   - Should we create it?

2. **What is "drop-down inventory"?**
   - Floating panel that slides from top/bottom?
   - Appears on Map screen?
   - Always visible or toggle open/close?
   - What should it show? Just equipped items or full stash?

3. **Priority order**:
   - Quest Tab enhancements (Phase 2-6)
   - OR Inventory system polish
   - OR Both in parallel?

---

## 📝 Code Examples Ready

### Equipment Slot Restrictions:
```typescript
// File: rov/apps/mobile/components/DropZone.tsx
// Add this to existing DropZone component:

interface DropZoneProps {
  zoneId: string;
  onDrop: (itemId: string, itemData: any) => void;
  children?: React.ReactNode;
  acceptedTypes?: string[]; // NEW: Restrict what can be dropped
}

// In component:
const canAccept = (item: any) => {
  if (!acceptedTypes) return true; // Accept all
  return acceptedTypes.includes(item.type);
};

// Show visual feedback:
{dragState.isDragging && !canAccept(dragState.itemData) && (
  <View style={styles.incompatibleOverlay}>
    <Text>❌ Can't equip here</Text>
  </View>
)}
```

### Slot-to-Slot Sorting:
```typescript
// File: rov/apps/mobile/app/(tabs)/stash.tsx
// Add this handler:

async function handleSlotSwap(sourceIndex: number, targetIndex: number) {
  const newItems = [...currentTabItems];
  const [movedItem] = newItems.splice(sourceIndex, 1);
  newItems.splice(targetIndex, 0, movedItem);
  
  // Update Firestore
  const stashRef = doc(db, 'stashes', user.uid);
  await setDoc(stashRef, {
    ...stashData,
    [activeTab]: newItems
  }, { merge: true });
  
  setStashData({ ...stashData, [activeTab]: newItems });
}
```

---

## ✅ Summary

**Card Collection**: READ-ONLY with "Show in Stash" ✅  
**Stash**: Drag-and-drop infrastructure EXISTS ✅  
**Shop**: Buy/Sell COMPLETE ✅  
**Quest Tab**: Phase 1 COMPLETE (beautiful cards) ✅  

**Needs**:
1. Equipment slot type restrictions
2. Slot-to-slot sorting
3. UI polish to match app style
4. Find/create character equipment screen
5. Clarify "drop-down inventory" requirements

**Time Est**: 3-4 hours to complete inventory system polish

---

**Next Step**: User chooses priority - Quest Tab Phase 2+ OR Inventory fixes
