# Emberglass Public Demo

Emberglass is a compact Phaser + React + Vite JRPG demo slice built for a public showcase. The demo covers title/load flow, exploration in Luma Quay, save/load, touch and keyboard controls, field combat, Moonwake Shrine, a guardian boss, and the demo-complete payoff.

## Run Locally

```bash
npm install
npm run dev
```

Open the local Vite URL and use the browser viewport you intend to demo. The game canvas scales to the available window while preserving the 960x640 design area.

## Demo Controls

- Move: `WASD`, arrow keys, or the on-screen touch pad.
- Interact/confirm: `Enter`, `Space`, tap objects, or `ACT`.
- Menu: `M`, `Esc`, or `MENU`.
- Title reset: press `R` on the title screen to clear the demo save.
- Battle commands: number keys `1`-`5`, mouse, or tap.

## Presenter Route

1. Start a new game and collect the supply chest.
2. Talk to Elder Maelin, inspect the eastern marker, then trigger the field battle.
3. Return to the elder, receive the Warding Ember, and enter Moonwake Shrine.
4. Attune the shrine font, challenge the guardian, and finish the boss flow.
5. Save at the Skywell and return to title to show continue/reset readiness.

## Release Candidate Checks

Run these before publishing a demo build:

```bash
npx tsc --noEmit
npm run build
node qa-runtime.mjs
```

The production build lazy-loads the Phaser game bootstrap from the React shell so the first app chunk stays small while the playable slice remains intact.
