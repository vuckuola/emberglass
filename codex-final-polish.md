# Emberglass — Final Polish Pass

You are working on a Phaser 3 + TypeScript pixel-art action RPG called "Emberglass: Covenant of the Skywell".
Working dir: /home/adm-herm/emberglass
Build: `npm run typecheck && npm run build`
CRITICAL: Never use `letterSpacing` property on Phaser Text — it will crash.

## Context
The game has been through 8 phases of development. 3 patch packs of game feel tuning are done.
This is the FINAL tuning pass to make it truly playable and polished.

## Tasks (do ALL of these)

### 1. Movement & Collision Polish
- Ensure diagonal movement uses sqrt(2) normalization (already there, verify it works)
- Player should NOT walk through solid tiles or off-map. Check tile collision is working.
- Dash should check collision — if player would dash into a wall, stop at the wall (don't clip through)
- Dash afterimage trail should use the player's facing direction sprite, not just a colored rectangle

### 2. Combat Tightness
- Attack hitbox must be generous (80% wider than visual) but visually precise (slash VFX matches)
- Enemies should have brief iFrames after being hit (prevent stun-locking) — 400ms
- Player should have iFrames after taking damage — 800ms, with blinking sprite
- Combo counter should reset after COMBO_WINDOW ms of no hits (verify COMBO_WINDOW is defined ~1500ms)
- Boss phase transitions should feel dramatic — slow-mo for 500ms, zoom pulse, phase announcement banner
- Skills (1-4) should have clear visual feedback: cooldown overlay on skill slots, flash when ready, shake when not enough MP

### 3. Enemy AI Improvements
- Enemies should have a brief "aggro" telegraph before attacking (red flash 200ms before)
- Ranged enemies (if any) should keep distance and shoot projectiles
- Boss should have distinct attack patterns per phase (phase 1: melee charge, phase 2: area attack, phase 3: summon minions, phase 4: rage mode with faster attacks)
- Dead enemies should drop loot that auto-magnetizes to player within 48px
- Enemies shouldn't spawn too close to player (min 220px) — verify this is enforced

### 4. Companion Polish (Kael + Io)
- Kael should visibly run to enemies and attack (not just teleport)
- Io should have a visible heal pulse effect when healing (green ring expanding outward)
- Both companions should have HP bars above their heads (small, 2px high)
- Companions should take damage from enemy AoE attacks
- If companion HP reaches 0, they should kneel (not disappear) and auto-revive after 8 seconds

### 5. UI/UX Polish
- Pause menu (Esc) should have: Resume, Settings, Save, Load, Quit to Title — ALL must work
- Settings panel should actually save to SaveSystem (master volume, SFX volume, screen shake on/off, text speed)
- HUD should be clean and readable: HP bar (red), MP bar (blue), skill cooldowns (numbered 1-4), gold counter, minimap
- Interaction prompts ("E to interact") should appear smoothly with fade-in
- Death screen should have "Load Last Save" and "Quit to Title" buttons that work
- Victory screen (boss defeated) should show: XP gained, gold gained, items found, play time

### 6. Performance
- Ensure no memory leaks: destroy tweens, particles, and timers on scene shutdown
- Object pool damage numbers (reuse text objects, don't create new ones each hit)
- Limit particle count: max 50 active particles at once
- Ensure update loop doesn't do expensive operations every frame (cache values, use dirty flags)
- Confirm no `console.log` calls in production code

### 7. Save System Integrity
- Auto-save should trigger: after boss defeat, after entering new area, every 60 seconds during exploration
- Save should store: player position, HP/MP, level, XP, gold, inventory, quest progress, companion HP
- Load should restore ALL of the above accurately
- If save data is corrupted, show error message and offer to start new game (don't crash)

### 8. Audio Consistency
- Every attack should play a hit SFX (different pitch per hit, 3 variants)
- Dash should play a whoosh SFX
- Taking damage should play a hurt SFX + screen flash red briefly
- Boss music should change between phases (or at least tempo change)
- Menu open/close should play a click SFX
- ALL audio should respect the master volume setting

## Verification
After making changes:
1. Run `npm run typecheck` — must pass with 0 errors
2. Run `npm run build` — must pass with 0 errors, 0 warnings
3. Search for `letterSpacing` in src/ — must return 0 results
4. Search for `console.log` in src/ — must return 0 results
5. Verify OverworldScene.ts has no TypeScript `any` types