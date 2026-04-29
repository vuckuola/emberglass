Scaffold a Vite + React 18 + TypeScript project. Run these exact commands:

```
npm create vite@latest . -- --template react-ts
npm install phaser@3.80.1
npm install -D vitest @playwright/test eslint
```

Then create these files:

1. **src/game/scenes/BootScene.ts** — Phaser scene with preload progress bar, placeholder text "Loading..."
2. **src/game/scenes/TitleScene.ts** — Phaser scene with dark background, "EMBERGLASS" title text (gold, centered), and 4 clickable text buttons vertically centered: New Game, Continue, Settings, Credits. On New Game click, console.log("newGame").
3. **src/game/scenes/OverworldScene.ts** — Phaser scene with a colored ground (teal rect), a player sprite (32x48 orange rect, arrow keys to move, 200 speed), camera following player.
4. **src/game/scenes/BattleScene.ts** — Phaser scene with dark bg and text "Battle!" centered.
5. **src/game/config.ts** — export const GAME_CONFIG: Phaser.Types.Core.GameConfig with type Phaser.AUTO, width 960, height 640, pixelArt true, scene array [BootScene, TitleScene, OverworldScene, BattleScene].
6. **src/main.tsx** — import React, createRoot. Mount Phaser game using GAME_CONFIG into a div with id "game-container". Simple.
7. **src/App.tsx** — minimal React component rendering <div id="game-container" style="margin:0 auto;width:960px;height:640px" />.

After creating all files, run:
```
npm install
npx tsc --noEmit
npm run build
```

Fix any TypeScript or build errors. Then run `git add -A && git commit -m "phase1: scaffold with phaser scenes"`.
