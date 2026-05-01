# Phase 13: Real Pixel Art Assets + Hero Procedural Override + Full QA

## Goal
Replace ALL placeholder PNG assets with proper 16-bit pixel art generated via Python PIL. The game should look like a real SNES/GBA RPG, not colored rectangles.

## Context
- Working directory: ~/emberglass
- Assets at: public/assets/generated/
- Asset definitions at: src/game/assets/generatedAssets.ts
- OverworldScene at: src/game/scenes/OverworldScene.ts
- All current PNGs are PLACEHOLDER (5-11 unique colors each — just colored rectangles)
- Phase 12 already added procedural tile rendering (useTileset=false forced), but hero/NPC still use PNG spritesheets

## Assets to Generate (Python PIL)

### 1. Hero Nara Sheet (384×576, 4×4 grid, 96×144 per frame)
- 16 frames total: 4 directions × 4 animation frames (idle + 3 walk)
- Style: Orange/amber cloak, brown hair, dark boots, glowing ember rune on chest
- Down: front-facing, cloak visible
- Up: back-facing, hood/hair visible
- Left/Right: side-facing, one arm visible
- Each frame: distinct pose (stand, step-left, mid-stride, step-right)
- Use a LIMITED PALETTE (16-24 colors) for authentic pixel art feel
- Anti-aliasing: NONE (nearest neighbor / pixel-perfect)

### 2. Hero Kael Sheet (384×576, 96×144 per frame)
- Green/brown tones, armored, broader shoulders
- Wind/thunder theme: light blue accent lines

### 3. Hero Io Sheet (384×576, 96×144 per frame)
- Light blue/white tones, healer robes
- Light/holy theme: golden glow accents

### 4. NPC Guide Rin (192×144, 2×1 grid, 96×144 per frame)
- Lean figure, teal/green cloak, staff
- 2 frames: idle + wave

### 5. NPC Elder Maelin (192×144, 2×1)
- Old figure, white/gray robes, tall staff with orb
- 2 frames: idle + gesture

### 6. NPC Peddler (192×144, 2×1)
- Short figure, brown vest, large pack on back
- 2 frames: idle + look-around

### 7. Enemy Vinecrawler (192×192)
- Green vine monster, multiple eyes, thorns
- Organic, asymmetric shape

### 8. Enemy Moss Knight (192×192)
- Large humanoid covered in moss, shield + club
- Brown/green tones

### 9. Enemy Sporefiend (192×192)
- Mushroom-like creature, purple cap, glowing spores
- Purple/green tones

### 10. Enemy Archive Guardian (192×192)
- Stone construct, crystal core, angular design
- Gray/blue tones

## Requirements

### Pixel Art Quality Standards
- MUST use `Image.NEAREST` for all scaling (no anti-aliasing)
- Palette: 16-32 unique colors per sprite (not 5)
- Every sprite must have OUTLINES (1px dark border around shapes)
- Every sprite must have HIGHLIGHTS (lighter color on top-left edges)
- Every sprite must have SHADOWS (darker color on bottom-right edges)
- Humanoid sprites: visible head, body, legs at minimum
- Animation frames: must differ visually (not just shifted 1px)
- Sprites should look good at 1:1 and 2x zoom

### Drawing Approach
Use PIL draw primitives (rectangle, ellipse, polygon, line, arc) to create pixel art:
- Bodies: filled rectangles with outline
- Heads: circles with eyes (2px dots)
- Hair: multiple small rectangles
- Cloaks: polygons/rectangles with fold lines
- Weapons: thin rectangles with glow circles
- Details: 1-2px accent lines for facial features, belt buckles, embroidery
- Eyes: 2-3px white with 1px dark pupil
- Boots: dark rectangles at bottom

### Script Structure
Create: scripts/generate-pixel-art-assets.py
- One function per asset type (generate_hero_nara, generate_npc_guide_rin, etc.)
- Each function returns PIL.Image
- Main: generate all, save to public/assets/generated/
- Use shared helper: draw_pixel_outline(draw, shape_points, color, outline_color)
- Use shared helper: add_highlight(img, region, highlight_color, opacity)

## Code Changes Required

### After generating assets:
1. OverworldScene.ts: Keep procedural rendering for tiles (Phase 12) but let hero/NPC PNG sprites load if they look good
2. generatedAssets.ts: No changes needed (same filenames)
3. BootScene.ts: No changes needed (same loading)

## Verification
1. Run: python3 scripts/generate-pixel-art-assets.py
2. Check: each PNG has 20+ unique colors
3. Run: npm run typecheck
4. Run: npm run build
5. Run: npx vite preview --port 4173 (background)
6. QA: Puppeteer script to verify hero visible, NPCs visible, enemies visible, no console errors
7. Commit and push

## Critical Rules
- Do NOT use random/noise for ANY part of the sprites
- Do NOT use ImageDraw.text() for faces — draw pixels manually
- Every sprite MUST have visible outlines, highlights, and shadows
- Keep file sizes reasonable (< 100KB each)
- MUST maintain same filenames and dimensions as existing assets
