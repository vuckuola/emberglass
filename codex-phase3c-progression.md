# Emberglass Phase 3C — Progression Depth Pass

## Context
Emberglass is a browser JRPG (Phaser 3 + React + TypeScript + Vite). Phases 1-3B are complete: premium presentation, living world ambience, NPC behaviors, companion follow, home visuals all working. Save data has `pet`, `home`, `flags`, `quests` fields already.

Now we make progression **feel meaningful** — every upgrade the player earns should have a real gameplay payoff, not just a visual change.

## CRITICAL RULES
- Do NOT upgrade Phaser or any dependency
- Do NOT add `letterSpacing` to any Phaser text style (unsupported)
- Do NOT change the scene architecture or save schema structure (SaveData interface)
- Keep all existing battle flow working — Attack/Skill/Defend/Item/Escape must all still function
- All existing QA assertions must still pass
- Use only programmatic graphics (Phaser primitives) — no new image assets

## Task 1: Home Buffs Become Real (OverworldScene.ts)

The save data already tracks `home: { warmth: number; garden: number; workshop: number }` (each 0 or 1). Currently these are only visual. Make them functional:

### Warmth (home.warmth === 1)
When the player steps on the HOME_TILE after warmth is unlocked:
- Auto-heal: restore 30% of missing HP and 20% of missing MP to all party members in save data
- Show a warm toast: "The hearth embraces you. HP and MP partially restored."
- Cooldown: only trigger once per visit (use a flag `homeWarmthUsedThisVisit`, reset when player leaves home tile area > 3 tiles away)
- Update party member currentHp/currentMp in save data accordingly

### Garden (home.garden === 1)
When the player steps on HOME_TILE after garden is unlocked:
- Random chance (40%) each visit to receive a free consumable:
  - 50% chance: health_potion +1
  - 30% chance: mana_potion +1  
  - 20% chance: antidote +1
- Show toast: "The garden yields a [item name]."
- Same cooldown pattern as warmth (once per visit)
- Add items to saveData.inventory

### Workshop (home.workshop === 1)
Passive effect — no action needed:
- All party members get +2 ATK and +1 DEF in battle when workshop is unlocked
- This must be applied in BattleScene.createBattle() via `applyEquipmentStats` or a new method
- Show a toast once when workshop is first unlocked (check `home.workshop` and a flag `workshopBuffNotified`): "The workshop hums with purpose. All allies gain ATK +2, DEF +1."

## Task 2: Pet Forage Gives Real Loot (OverworldScene.ts)

The save data already has `pet: { unlocked: boolean; forageReady: boolean; bonus: string | null }`.

When `pet.unlocked === true` AND `pet.forageReady === true` AND the player is in the overworld:
- Every ~45 seconds of play time, Pip forages automatically
- Random loot table:
  - 35% chance: health_potion +1
  - 25% chance: mana_potion +1
  - 15% chance: ember_shard +1
  - 15% chance: antidote +1
  - 10% chance: burn_salve +1
- Show toast: "Pip returns with a [item name]!"
- Add to inventory in save data
- Set `pet.forageReady = false`
- After 60 seconds, set `pet.forageReady = true` again (auto-reset)
- Persist save after each forage

Use a time-based check in the overworld `update()` loop. Track last forage time with a class property like `lastForageTime`.

## Task 3: Mira Combat Passive (BattleScene.ts)

When Mira has been recruited (check saveData.flags['mira_recruited'] === true):
- All party members gain +3 MAG in battle
- Apply in createBattle() alongside equipment stats
- Show in battle intro message: append "Mira's arcane link bolsters the party. MAG +3." if Mira is recruited

## Task 4: Level Up Ceremony (OverworldScene.ts)

Currently when enemies are defeated and EXP is gained, levels increase silently. Add feedback:

After processing battle rewards in the overworld (where exp/gold/emberShards are applied):
- Check if any party member's level increased
- For each level-up, show a celebratory toast with the character name and new level:
  "[CharacterName] ascends to Level [N]!"
- Brief golden flash on the HUD (a rectangle that flashes gold then fades)
- If multiple party members level up, show toasts sequentially with 800ms delay between each
- The level-up check should compare saved level vs calculated new level after adding EXP

Note: The overworld already handles battle results via the `battleResult` init data. Find where that's processed and add level-up toast logic there.

## Task 5: Resonance Meter Visible in Battle (BattleScene.ts)

Each party character has a `resonance` field that builds toward 100. Currently invisible.

In the battle UI:
- Add a small resonance bar below each party member's entity view
- Show as a thin bar (width 72, height 5) with a teal/cyan color (#00e5cc)
- Only visible when resonance > 0
- When resonance reaches 100, flash the bar gold briefly
- Update every frame in refreshUi()

Also, add a resonance skill to each character (if they don't already have one with `isResonance: true`):

### Nara resonance skill
```
{ id: 'emberglass_resonance', name: 'Emberglass Nova', type: 'magical', element: 'ember', mpCost: 0, power: 42, target: 'all_enemies', description: 'Unleash stored emberlight in a devastating wave.', isResonance: true }
```

### Kael resonance skill
```
{ id: 'tectonic_resonance', name: 'Tectonic Slam', type: 'physical', element: 'earth', mpCost: 0, power: 38, target: 'all_enemies', description: 'Channel seismic force through the earth.', isResonance: true }
```

### Io resonance skill
```
{ id: 'lumen_resonance', name: 'Lumen Restoration', type: 'heal', element: 'light', mpCost: 0, power: 50, target: 'all_allies', description: 'Channel stored light to heal all allies.', isResonance: true }
```

Append these to each character's skill list in the BattleEntity creation (in createPartyEntity), so they appear in the Skill menu when resonance is >= 100.

## Task 6: Save Point Partial Healing (OverworldScene.ts)

When the player interacts with a save point (the crystal/save tile):
- Restore 50% of missing HP and 30% of missing MP to all party members
- Update saveData with the new HP/MP values
- Persist the save
- Show toast: "The save crystal hums. Strength returns."
- This should work alongside the existing save prompt

## Implementation Notes
- All toast messages should use the existing `showToast()` method in OverworldScene
- All save modifications should use the existing `SaveSystem.autoSave()` 
- Inventory additions should follow the existing pattern in the codebase
- For cooldowns/flags that need to persist across scene transitions, use saveData.flags (e.g., 'workshopBuffNotified')
- Keep code clean, no console.log left in production code
- Match existing code style (look at surrounding code for patterns)

## Files to Modify
- `src/game/scenes/OverworldScene.ts` — Tasks 1, 2, 4, 6
- `src/game/scenes/BattleScene.ts` — Tasks 3, 5
- `src/game/data/characters.ts` — Task 5 (add resonance skills to character data)

## Validation
After making changes, run:
1. `npm run typecheck` — must pass with zero errors
2. `npm run build` — must succeed
Do NOT run qa-runtime.mjs (it requires a display server). Just ensure types and build pass.
