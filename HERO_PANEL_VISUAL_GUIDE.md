# ⚔️ Hero Panel - Visual Guide

## 📍 Where to Find It

```
┌─────────────────────────────────────────┐
│  🗺️ Map Screen                          │
│                                          │
│                                          │
│              YOUR MAP                    │
│                                          │
│                            ┌──────┐      │
│                            │  ⚔️  │ ← Click here!
│                            └──────┘      │
│                                          │
└─────────────────────────────────────────┘
```

The **gold ⚔️ button** appears on the **right side** of every screen.

---

## 🎬 Panel Animation

**Closed State:**
```
┌─────────────────────────────────┐
│  Screen Content                 │
│                                 │
│  (Panel hidden off-screen)      │
│                                 │
└─────────────────────────────────┘
```

**Opening:**
```
┌─────────────────────┬───────────┐
│  Screen Content     │  ┌────────┤
│  (Darkened)         │  │ HERO   │
│                     │  │ PANEL  │
│                     │  │        │
└─────────────────────┴──┴────────┘
      ← Slides in from right
```

**Open State:**
```
┌──────────┬──────────────────────┐
│  Screen  │  ⚔️ HERO      [✕]   │
│ (Dimmed) ├──────────────────────┤
│          │ 📊│🌟│🎒            │
│          │ Stats│Skills│Inv    │
│          ├──────────────────────┤
│          │                      │
│          │   CONTENT AREA       │
│          │                      │
│          │                      │
└──────────┴──────────────────────┘
```

---

## 📊 Stats Tab

```
┌────────────────────────────────────┐
│  ⚔️ HERO                    [✕]   │
├────────────────────────────────────┤
│  📊 Stats │ 🌟 Skills │ 🎒 Inv    │
├────────────────────────────────────┤
│                                    │
│   ┌──────────────────────────┐    │
│   │    WARRIOR                │    │
│   │    Level 5                │    │
│   └──────────────────────────┘    │
│                                    │
│   CORE STATS                       │
│   ┌─────────────────────────┐     │
│   │ Health  ████████░░  85/100│   │
│   │ Mana    ██████░░░░  30/50 │   │
│   │ XP      ████░░░░░░  2000  │   │
│   │ Renown              1250  │   │
│   └─────────────────────────┘     │
│                                    │
│   ATTRIBUTES                       │
│   ┌──────┐  ┌──────┐             │
│   │  💪  │  │  🏹  │             │
│   │  15  │  │  12  │             │
│   │+45 DMG│ │+6% CR│             │
│   └──────┘  └──────┘             │
│                                    │
│   ┌──────┐  ┌──────┐             │
│   │  🧠  │  │  ❤️  │             │
│   │  10  │  │  18  │             │
│   │+50 MP │ │+180HP│             │
│   └──────┘  └──────┘             │
│                                    │
│   COMBAT                           │
│   Armor: 36   Damage: 45          │
│   Crit: 11%   Magic Find: 0%      │
│                                    │
└────────────────────────────────────┘
```

---

## 🌟 Skills Tab

```
┌────────────────────────────────────┐
│  ⚔️ HERO                    [✕]   │
├────────────────────────────────────┤
│  📊 Stats │ 🌟 Skills │ 🎒 Inv    │
├────────────────────────────────────┤
│                                    │
│   SKILL TREE                       │
│   Available Points: 7              │
│                                    │
│   🗡️ ACTIVE SKILLS                │
│                                    │
│   ┌──────────────────────────┐    │
│   │ 🔥 [3]                    │    │
│   │ Fireball                  │    │
│   │ Deals 50+(10×lvl) damage  │    │
│   │ ████░░░░░░ 3/20           │    │
│   │       [ Upgrade +1 ]      │    │
│   └──────────────────────────┘    │
│                                    │
│   ┌──────────────────────────┐    │
│   │ ❄️ [1]                    │    │
│   │ Frost Armor               │    │
│   │ +20×lvl armor for 60 sec  │    │
│   │ ██░░░░░░░░ 1/10           │    │
│   │       [ Upgrade +1 ]      │    │
│   └──────────────────────────┘    │
│                                    │
│   ┌──────────────────────────┐    │
│   │ ⚡ (locked)               │    │
│   │ Teleport                  │    │
│   │ Instant teleport          │    │
│   │       [ Unlock (1) ]      │    │
│   └──────────────────────────┘    │
│                                    │
│   🌟 PASSIVE SKILLS               │
│   ...                              │
│                                    │
└────────────────────────────────────┘
```

---

## 🎒 Inventory Tab

```
┌────────────────────────────────────┐
│  ⚔️ HERO                    [✕]   │
├────────────────────────────────────┤
│  📊 Stats │ 🌟 Skills │ 🎒 Inv    │
├────────────────────────────────────┤
│                                    │
│   EQUIPMENT                        │
│                                    │
│   ┌────┐ ┌────┐ ┌────┐           │
│   │🪖  │ │📿  │ │⚔️ •│           │
│   │Helm│ │Amul│ │Weap│           │
│   └────┘ └────┘ └────┘           │
│                                    │
│   ┌────┐ ┌────┐ ┌────┐           │
│   │🛡️  │ │💍  │ │💍  │           │
│   │Armr│ │Ring│ │Ring│           │
│   └────┘ └────┘ └────┘           │
│                                    │
│   ┌────┐ ┌────┐ ┌────┐           │
│   │🎗️  │ │🧤  │ │🥾  │           │
│   │Belt│ │Glov│ │Boot│           │
│   └────┘ └────┘ └────┘           │
│                                    │
│   INVENTORY (40 SLOTS)             │
│                                    │
│   ┌─┬─┬─┬─┬─┬─┬─┬─┬─┬─┐          │
│   │1│2│3│4│5│6│7│8│9│0│          │
│   ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤          │
│   │ │ │ │ │ │ │ │ │ │ │          │
│   ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤          │
│   │ │ │🎴│ │ │ │ │ │ │ │          │
│   ├─┼─┼─┼─┼─┼─┼─┼─┼─┼─┤          │
│   │ │ │ │ │ │ │ │ │ │ │          │
│   └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘          │
│                                    │
│   📝 HOW TO USE:                   │
│   • Drag items from Stash          │
│   • Equipment slots = type only    │
│   • Inventory slots = universal    │
│                                    │
└────────────────────────────────────┘
```

---

## 🎨 Color Legend

| Element | Color | Hex |
|---------|-------|-----|
| Background | Dark Blue | `#0a0a0f` |
| Panel | Dark Gray | `#1a1a2e` |
| Gold Text | Gold | `#ffd700` |
| HP Bar | Red | `#ff0000` |
| Mana Bar | Blue | `#0000ff` |
| XP Bar | Green | `#9acd32` |
| Borders | Gray | `#2a2a3e` |

---

## 🎮 Interactive Elements

### Buttons
- **Stats Tab**: View character attributes
- **Skills Tab**: Upgrade skills (costs skill points)
- **Inventory Tab**: Manage equipment
- **Close (✕)**: Closes the panel
- **Backdrop**: Click outside to close

### Skill Buttons
- **Upgrade (+1)**: Levels up unlocked skill (costs 1 point)
- **Unlock (1)**: Unlocks new skill (costs 1 point)
- **Maxed**: Skill at maximum level (disabled)

### Equipment Slots
- **Click**: View item details (ready for implementation)
- **Drag**: Move items around (ready for implementation)
- **Empty**: Shows slot type icon dimmed

---

## 📱 Responsive Behavior

### Desktop/Tablet
- Panel width: **40% of screen** (max 500px)
- Smooth slide animation
- Backdrop dims background

### Mobile
- Panel width: **40% of screen** (adaptive)
- Touch-friendly button sizes
- Scrollable content areas

---

## 🎯 Quick Reference

**To Open Hero Panel:**
1. Click the **⚔️ golden button** on the right side
2. Panel slides in from the right
3. Choose a tab: Stats, Skills, or Inventory

**To Close Hero Panel:**
1. Click **✕** button in header, OR
2. Click **backdrop** (darkened area), OR
3. Press **ESC** key (web only)

**To Switch Tabs:**
- Click tab names at the top
- Active tab highlighted in **gold**

---

## 💡 Tips

1. **Stats Tab** - Check your character's progress and attributes
2. **Skills Tab** - Plan your skill points before spending them
3. **Inventory Tab** - Equipment slots show what's equipped with a blue dot
4. **Skill Points** - Earn 2 points per level, spend wisely!
5. **Equipment Types** - Only correct types can go in equipment slots

---

**The Hero Panel is ready to use!** Click the ⚔️ button and start exploring! 🎮

