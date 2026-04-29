You are building "Emberglass: Covenant of the Skywell" — a pixel-art JRPG browser game.

## PHASE 1 ONLY: Project scaffold + core architecture + data files

### Step 1: Scaffold
- Create a Vite + React 18 + TypeScript project in this directory
- Use npm (pnpm not available)
- Install Phaser 3 (latest stable 3.x, NOT Phaser 4 which doesn't exist yet)
- Install vitest, @playwright/test, eslint
- Configure package.json scripts: dev, build, preview, lint, typecheck, test, test:e2e

### Step 2: Folder structure
```
src/
  game/
    scenes/        (BootScene, TitleScene, GameScene, BattleScene, etc.)
    systems/       (CombatSystem, SaveSystem, ProgressionSystem, etc.)
    data/          (characters, skills, items, enemies, bosses, maps, dialogue, quests)
    entities/      (Player, Enemy, NPC, etc.)
    ui/            (BattleUI, MenuUI, DialogueUI, etc.)
    audio/         (AudioManager with procedural WebAudio synth)
    assets/        (asset registry and loader helpers)
  react/          (React wrapper components for settings overlay, etc.)
  main.tsx
  App.tsx
  index.css
public/
  assets/
    generated/     (will be filled in Phase 2)
```

### Step 3: Data files (src/game/data/)
Create ALL these as typed TypeScript with proper interfaces:

**characters.ts** — Define Nara, Kael, Io with:
- id, name, class, baseStats (hp, mp, atk, def, spd, mag), growthRates, elementalAffinity
- Starting skills (skill IDs)
- Portrait path placeholder
- Spritesheet path placeholder

**skills.ts** — Define 15+ skills:
- id, name, type (physical/magical/heal/buff/debuff), element, mpCost, power, target (single/all/self), description
- Include 3 Resonance ultimate skills (one per character)
- Include basic attack and defend as special cases

**items.ts** — Define 10+ items:
- id, name, type (consumable/equipment/key), effect, value, description
- Potions, ethers, revive, status cures, equipment (weapon/charm/relic per character)

**enemies.ts** — Define 16 enemies across 4 regions (4 per region):
- id, name, hp, mp, atk, def, spd, mag, skills, elementalWeakness, elementalResist, expReward, goldReward, spritePath, behavior (aggressive/cautious/support)
- Region 1 (Verdant): Vinecrawler, Moss Knight, Sporefiend, Archive Guardian
- Region 2 (Mirrordrift): Glass Scorpion, Sand Wraith, Mirror Phantom, Dune Sentinel
- Region 3 (Thunderveil): Storm Imp, Volt Crawler, Thunder Hawk, Crystal Golem
- Region 4 (Skywell): Emberglass Wisp, Memory Phantom, Void Walker, Skywell Guardian

**bosses.ts** — Define 4 bosses:
- id, name, phase data (HP thresholds that change behavior), unique mechanics
- Boss 1: Thornheart (Verdant Archive) — root binding + vine summons
- Boss 2: Refraction Queen (Mirrordrift) — mirror clones + element swap
- Boss 3: Storm Seraph (Thunderveil) — charge attacks + lightning arena
- Final Boss: The Cartographer's Lie (Skywell Core) — map distortion + memory erase

**maps.ts** — Define 5 maps with tile data:
- id, name, width, height, tileLayers (ground/wall/decorations), collisionMap, interactables (NPCs, chests, signs, save points, doors), encounterZones, connections
- Start with Luma Quay as the hub

**dialogue.ts** — Define dialogue trees:
- NPC conversations, party banter triggers, boss intro lines, cutscene scripts
- At minimum: opening cutscene, each boss intro, ending

**quests.ts** — Define main quest + optional quests:
- Main quest: 5 stages (prologue through final)
- Optional: find all lore tablets, rescue NPC, find hidden Ember Shard caches

### Step 4: Core scenes (src/game/scenes/)
Create stub/functional implementations for:
- **BootScene** — Asset preloading with progress bar
- **TitleScene** — Animated background placeholder, menu buttons (New Game/Continue/Settings/Credits)
- **OverworldScene** — Top-down exploration with player movement, collision, camera follow
- **BattleScene** — Turn-based combat engine with UI

### Step 5: Core systems
- **CombatSystem** — Full turn-based combat:
  - Turn order by speed, action selection (attack/skill/defend/items/escape)
  - Damage formula: basePower * (attacker.atk / defender.def) * elementMultiplier * randomVariance
  - Stagger: each hit adds stagger, at 100% enemy skips turn
  - Resonance: builds over battle, unleashes ultimate at 100%
  - Status effects: poison, stun, burn, freeze, buff_atk, buff_def
  - XP and gold rewards

- **SaveSystem** — localStorage with schema validation:
  - Save slots (3), auto-save at checkpoints
  - Validate save data structure on load, recover from corruption
  - Store: party state, inventory, position, quest progress, flags

- **ProgressionSystem** — XP/leveling with stat growths, skill unlocks at levels

- **AudioManager** — Procedural WebAudio synth:
  - Title theme (mysterious, soft, atmospheric loop)
  - Town theme (warm, peaceful loop)
  - Dungeon ambience (tense, ambient loop)
  - Battle theme (energetic, driving loop)
  - Boss theme (intense, dramatic loop)
  - Victory jingle
  - UI blips, attack sounds, hit sounds, magic sounds
  - Volume control per channel

### Step 6: React integration
- App.tsx mounts Phaser game canvas
- Settings overlay in React (volume, text speed, screen shake, reduced motion, pixel scale)
- Settings persist to localStorage

### Step 7: Config
- tsconfig.json with strict mode
- .eslintrc.cjs
- .gitignore
- index.html with CSP meta tag
- vitest.config.ts
- playwright.config.ts (basic)

### Step 8: Verify
- Run: npm run typecheck (must pass)
- Run: npm run lint (must pass)
- Run: npm run build (must pass)
- Commit everything

DO NOT plan. DO NOT explain what you will do. Just write ALL the files. Make them real, typed, and complete. Every data file must have real content, not stubs. The combat system must be fully functional. The scenes must boot. The audio must play.
