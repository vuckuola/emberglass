# Emberglass Phase 3D — Skills, Shop & Battle Items

## Context
Emberglass is a browser JRPG (Phaser 3 + React + TypeScript + Vite). Phases 1-3C done: premium presentation, living world, progression depth (home buffs, pet forage, Mira passive, resonance skills, level-up ceremony, save point healing).

Current gaps: Each character only has 2 regular skills + 1 resonance skill. Gold has no use (no shop). Battle Item menu only shows health potions. Status cure items exist in data but aren't usable in battle.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style (unsupported)
- Do NOT change SaveData interface or SaveSystem validation
- Keep all existing battle flow working
- All existing QA assertions must still pass (you won't run QA, just don't break things)
- Use only programmatic graphics — no new image assets
- No console.log in production code

## Task 1: Expand Character Skills (characters.ts)

Each character currently has 2 skills + 1 resonance. Add more skills that unlock at specific levels. The skills should be added to the character data, and BattleScene should only show skills the character has learned based on their current level.

Add to each character:

### Nara (ember/arcane hybrid)
```typescript
// Level 1 (existing)
{ id: 'emberglass_strike', ... }
// Level 1 (existing)
{ id: 'skywell_spark', ... }
// NEW — Level 3
{ id: 'ember_flare', name: 'Ember Flare', type: 'magical', element: 'ember', mpCost: 7, power: 28, target: 'single_enemy', description: 'A burst of concentrated emberlight.', isResonance: false }
// NEW — Level 5
{ id: 'arcane_barrier', name: 'Arcane Barrier', type: 'buff', element: 'arcane', mpCost: 8, power: 0, target: 'self', description: 'Raise magical defense for 3 turns.', isResonance: false, statusEffect: 'buff_def', statusChance: 1, duration: 3 }
// NEW — Level 7
{ id: 'skywell_rain', name: 'Skywell Rain', type: 'magical', element: 'arcane', mpCost: 12, power: 22, target: 'all_enemies', description: 'Rain arcane energy across the battlefield.', isResonance: false }
// Resonance (existing, level 1)
{ id: 'emberglass_resonance', ... }
```

### Kael (earth/physical tank)
```typescript
// Level 1 (existing)
{ id: 'iron_cleave', ... }
// Level 1 (existing)
{ id: 'guard_break', ... }
// NEW — Level 3
{ id: 'stone_shield', name: 'Stone Shield', type: 'buff', element: 'earth', mpCost: 6, power: 0, target: 'self', description: 'Harden defenses for 3 turns.', isResonance: false, statusEffect: 'buff_def', statusChance: 1, duration: 3 }
// NEW — Level 5
{ id: 'earthquake', name: 'Earthquake', type: 'physical', element: 'earth', mpCost: 10, power: 26, target: 'all_enemies', description: 'Shatter the ground beneath all foes.', isResonance: false }
// NEW — Level 7
{ id: 'rally_cry', name: 'Rally Cry', type: 'buff', element: 'neutral', mpCost: 8, power: 0, target: 'all_allies', description: 'Boost all allies ATK for 2 turns.', isResonance: false, statusEffect: 'buff_atk', statusChance: 1, duration: 2 }
// Resonance (existing, level 1)
{ id: 'tectonic_resonance', ... }
```

### Io (light/healer)
```typescript
// Level 1 (existing)
{ id: 'lumen_bolt', ... }
// Level 1 (existing)
{ id: 'mend', ... }
// NEW — Level 3
{ id: 'purify', name: 'Purify', type: 'heal', element: 'light', mpCost: 4, power: 0, target: 'single_ally', description: 'Cure poison and burn from one ally.', isResonance: false, cureStatus: 'poison,burn' }
// NEW — Level 5
{ id: 'lumen_rain', name: 'Lumen Rain', type: 'heal', element: 'light', mpCost: 14, power: 30, target: 'all_allies', description: 'Heal all allies with gentle light.', isResonance: false }
// NEW — Level 7
{ id: 'radiance_burst', name: 'Radiance Burst', type: 'magical', element: 'light', mpCost: 10, power: 32, target: 'single_enemy', description: 'A focused beam of searing light.', isResonance: false }
// Resonance (existing, level 1)
{ id: 'lumen_resonance', ... }
```

Add a `learnLevel` field to the Skill interface (or use a separate mapping). The simplest approach: add a `minLevel: number` property to each skill object, and filter in BattleScene when showing skill options.

IMPORTANT: The Skill type in `src/game/data/skills.ts` needs `minLevel?: number` and `cureStatus?: string` added to it. Check the existing interface first — if it already has fields you need, use them.

## Task 2: Skill Level Gating in Battle (BattleScene.ts)

In `showSkillOptions()`:
- Filter skills by `skill.minLevel <= characterLevel` (get character level from saveData.party)
- Show all learnable skills but grey out ones the character hasn't learned yet (show the name and "Lv.X" requirement)
- Resonance skills should still require `resonance >= 100` to use (existing logic)

## Task 3: Battle Item Expansion (BattleScene.ts)

Currently the Item command only shows health potions. Expand it to show all usable battle items from inventory:

- Health Potion — heal 50 HP to one ally (existing)
- Mana Potion — restore 30 MP to one ally (NEW in battle)
- Health Elixir — heal 150 HP to one ally (NEW in battle)
- Mana Elixir — restore 80 MP to one ally (NEW in battle)
- Antidote — cure poison (NEW in battle)
- Burn Salve — cure burn (NEW in battle)

For each usable item, show a menu option: `[ItemName] x[quantity]`. If quantity is 0, grey it out.

When selected, show ally targeting (for heals/cures). Apply the item effect:
- healHp: restore HP to target
- healMp: restore MP to target
- cureStatus: remove the status effect from target (use `target.statusEffects.delete(status)`)

Decrement inventory quantity and persist save.

## Task 4: Merchant Shop System (OverworldScene.ts)

The merchant NPC exists at MERCHANT_TILE. Currently `talkMerchant()` just shows dialogue. Make it functional:

### Shop Interface
When the player talks to the merchant, show a simple shop overlay using Phaser primitives:
- Semi-transparent dark panel (centered, 500x380)
- Title: "Quay Merchant" in gold
- "Your Gold: [amount]" at top
- List of items for sale with prices:
  - Health Potion — 25g
  - Mana Potion — 35g
  - Antidote — 20g
  - Burn Salve — 20g
  - Wind Charm — 95g (if not owned)
  - Ember Charm — 95g (if not owned)
  - Arcane Charm — 95g (if not owned)
- Each item row: `[ItemName] — [Price]g [Buy]`
- "Buy" is clickable; if player has enough gold, deduct gold, add item to inventory, show toast
- "Close" button at bottom to dismiss shop
- Equipment purchases (charms) should auto-equip if the slot is empty, otherwise just add to inventory

### Implementation
- Create a `openShop()` method
- Use existing `showDialogue()` pattern but with interactive elements
- The shop panel and all its children should be stored in a group so they can be destroyed together on close
- Track `shopOpen: boolean` state to prevent movement while shopping
- Gold is already in saveData (`saveData.gold`)

## Task 5: Gold Rewards from Monsters (BattleScene.ts)

Currently enemies give exp and gold via `expReward` and `goldReward`, and this is returned by `getReward()`. The overworld processes battle results. Make sure gold from battles is actually added to `saveData.gold`.

Check the overworld's battle result processing code and ensure gold is being added. If it's not, add it.

## Files to Modify
- `src/game/data/skills.ts` — add `minLevel?: number` and `cureStatus?: string` to Skill type
- `src/game/data/characters.ts` — expanded skill lists
- `src/game/data/items.ts` — no changes needed (items already exist)
- `src/game/scenes/BattleScene.ts` — skill gating, battle items, gold rewards
- `src/game/scenes/OverworldScene.ts` — merchant shop

## Validation
After making changes, run:
1. `npm run typecheck` — must pass with zero errors
2. `npm run build` — must succeed
