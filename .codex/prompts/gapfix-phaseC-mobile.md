# Emberglass Gap Fix — Phase C: Mobile-First Controls Redesign

## Context
Emberglass is a browser Action RPG at ~/emberglass. 65% of traffic is mobile, but the game
was designed for keyboard+mouse. PP3 added overlaid 56px touch controls that cover 30% of
the view, drift during combat, and produce 89% mobile bounce rate.

## CRITICAL RULES
- Do NOT use `letterSpacing` — Phaser 3.80.1 does not support it
- Do NOT upgrade Phaser or React
- Do NOT modify `vite.config.ts`
- Do NOT import `BattleScene` (deleted)
- Touch controls must be INTEGRATED into the game, not an HTML overlay
- All touch elements must be at least 48px tap targets (WCAG minimum)
- UI panels must be thumb-reachable in landscape orientation
- Do NOT break existing keyboard+mouse controls — both input methods must work

## Task: Redesign Touch Controls

### 1. Virtual Joystick (Bottom-Left)
- Replace any HTML overlay joystick with a Phaser-based virtual joystick
- Create a `VirtualJoystick` class in `src/game/input/VirtualJoystick.ts`
- Base: semi-transparent circle (120px diameter) with inner knob (50px)
- Position: bottom-left, 20px from edges
- Only show on touch devices (detect via `'ontouchstart' in window`)
- Knob follows finger within base radius
- Output normalized x/y direction (-1 to 1)
- Snaps back to center on release
- Use `this.input.on('pointermove')` for tracking
- Semi-transparent so it doesn't obscure too much

### 2. Action Buttons (Bottom-Right)
Create a cluster of 3-4 action buttons using Phaser game objects:
- **Attack** (largest, primary — sword icon or red circle, 64px)
- **Dash** (medium, secondary — blue circle with arrow, 52px)  
- **Block/Parry** (medium, secondary — shield icon or green circle, 52px)
- **Interact** (small, contextual — yellow circle, 44px, only visible near NPC/object)
- Layout: diamond/arc arrangement, bottom-right
- Buttons should have tap feedback (scale pulse on press)
- Button presses should trigger the same game logic as keyboard equivalents
  (Space for attack, Shift for dash, F for block, E for interact)

### 3. Skill Buttons (Bottom-Right, Above Action Buttons)
- 4 small buttons for skills 1-4
- 44px each, arranged horizontally
- Show cooldown overlay (darkened with timer)
- Only visible after player has unlocked skills

### 4. Mobile-Optimized UI Panels
Modify existing UI overlays for mobile:
- **HUD**: Move HP/MP bars to top-left, make slightly larger
- **Minimap**: Top-right, slightly smaller on mobile (120x90px)
- **Inventory/Menu**: Full-screen panels instead of centered overlays
- **Dialogue**: Bottom 40% of screen, larger text, tap-to-advance
- **Toast messages**: Larger font, center-bottom, 3s duration
- **Pause**: Tap top-right corner (or gear icon) instead of Esc
- **Objective banner**: Top-center, compact, auto-fade

### 5. Context-Sensitive Controls
- When near an NPC/object: show Interact button, hide Block
- In combat: show Attack/Dash/Block, hide Interact
- In menus: show only Confirm/Cancel buttons
- Auto-aim on mobile: slightly widen attack hitbox angle (+15°)

### 6. Landscape Lock + Orientation Handling
- The manifest already has `"orientation": "landscape"`
- Add an orientation warning overlay for portrait mode:
  "Please rotate your device for the best experience"
  Show a rotation icon, dismiss automatically when landscape detected
- Use `screen.orientation.addEventListener('change')` or resize event

### Implementation Notes
- Detect mobile via `'ontouchstart' in window || navigator.maxTouchPoints > 0`
- Store `isMobileDevice` flag accessible from OverworldScene
- Create touch input as a separate module: `src/game/input/TouchControls.ts`
- TouchControls class manages joystick + buttons + orientation
- OverworldScene creates TouchControls in `create()` if mobile
- Existing keyboard input in OverworldScene must remain fully functional
- Use Phaser game objects (Graphics, Text, Container) for all touch elements
- No HTML/DOM overlay elements for game controls

### Files to Create
1. `src/game/input/TouchControls.ts` — main touch input system
2. `src/game/input/VirtualJoystick.ts` — joystick component

### Files to Modify
1. `src/game/scenes/OverworldScene.ts` — integrate TouchControls
2. `src/game/scenes/TitleScene.ts` — touch-friendly menu buttons
3. `src/game/controls.ts` — add touch control mappings

## Validation
```bash
npx tsc --noEmit
npm run build
grep -rn "letterSpacing" src/
```
