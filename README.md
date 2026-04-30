# Emberglass Public Demo

Emberglass is a compact Phaser + React + Vite JRPG vertical slice built for a public showcase. The demo covers title/load flow, exploration in Luma Quay, save/load, keyboard/touch controls, field combat, Moonwake Shrine, a guardian boss, and the demo-complete payoff.

## Quick Start

```bash
npm install
npm run dev
```

Open the Vite local URL in Chrome or Edge for the most reliable presenter build. The game canvas scales to the available window while preserving the 960x640 design area.

## Build & Preview

```bash
npm run typecheck
npm run build
npm run demo:serve
```

- `npm run dev` starts the local development server.
- `npm run build` type-checks and creates the production bundle in `dist/`.
- `npm run demo:serve` serves the built demo locally with Vite preview.
- `npm run demo:preview` rebuilds and serves the production bundle for a final local/LAN pass.
- `npm run demo:check` runs the required public-demo handoff checks.

## Public Drop Path

For a clean handoff or presenter machine, use the locked install and final ship check:

```bash
npm ci
npm run ship:strict
npm run demo:preview
```

Deploy the generated `dist/` folder to any static host. See `DEPLOY_DEMO.md` for the complete preview/deploy handoff checklist and `docs/launch/` for launch hardening/runbook notes.

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

## Demo Readiness Checklist

- Use a clean browser profile or press `R` on the title screen before a fresh run.
- Confirm audio can start after the first click/key press.
- Present in Chrome or Edge at desktop/tablet size when possible.
- Keep `SHOWCASE_NOTES.md` open for the route, limitations, and handoff notes.
- Keep `DEPLOY_DEMO.md` available for static-host and presenter-machine setup.
- Keep `docs/launch/STATIC_LAUNCH_AUDIT.md` and `docs/launch/INCIDENT_RUNBOOK.md` available for launch-risk and incident handling context.
- Run the full validation command before publishing or zipping a build.

```bash
npm run ship:strict
```

## Known Limitations

- This is a public-demo vertical slice, not a complete chapter.
- Settings and credits are informational title prompts rather than full menus.
- Save support uses autosave slot `0` only.
- Browser audio may require an initial user gesture before playback.
