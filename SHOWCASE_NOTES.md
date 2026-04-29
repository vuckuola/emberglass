# Emberglass Showcase Notes

## Demo Snapshot

- Public-demo JRPG slice centered on Luma Quay, built with Phaser, React, and Vite.
- Includes title/load flow, first-session guidance, overworld exploration, interactable NPCs/objects, autosave, touch controls, field battle, shrine boss route, victory rewards, and an end-of-slice thank-you card.
- Procedural/generated visual treatment and audio identity support title, town, battle, victory, and interaction feedback.
- Recommended presenter browser: current Chrome or Edge. Firefox/Safari should work, but Chrome-family browsers are the primary demo target.

## Presenter Checklist

- Run `npm run demo:check` before publishing or recording.
- Launch with `npm run demo:serve` after `npm run build` for a production-like local pass.
- Use `npm run demo:preview` when you want the one-command rebuild + production-like preview path.
- Use a clean save by pressing `R` on the title screen, then confirm `Continue` is unavailable before starting.
- Click or press a key once early so browser audio policies allow playback.
- Keep the browser at a stable 16:9-ish desktop/tablet viewport when presenting live.

## Controls Summary

- Move/select: `WASD`, arrow keys, or on-screen touch pad.
- Interact/confirm: `Enter`, `Space`, tap interactables, or `ACT`.
- Open/close menu: `M`, `Esc`, or `MENU`.
- Battle commands: number keys `1`-`5`, click, or tap.
- Fresh demo reset: `R` on the title screen deletes autosave slot `0`.

## Presenter Route

1. Start a new game from the title screen.
2. Follow the demo-start guidance and collect the supply chest.
3. Speak with Elder Maelin, then inspect the eastern ruin marker.
4. Enter the guardian field and win the field battle.
5. Return to Elder Maelin for the Warding Ember route-opening reward.
6. Inspect the Moonwake Shrine gate, attune the pilgrim font, and break the inner seal.
7. Defeat the Moonwake Guardian and read the thank-you/demo-complete payoff card.
8. Save at the Skywell or use the title-screen reset helper before another demo pass.

## Release / Handoff Checklist

```bash
npm run typecheck
npm run build
node qa-runtime.mjs
```

Or run all public-demo checks together:

```bash
npm run ship:check
```

- Confirm `dist/` is generated from a clean build.
- Confirm the public-drop preview starts with `npm run demo:preview` on the presenter machine.
- Confirm no console-breaking runtime errors appear during the presenter route.
- Confirm keyboard and touch controls are both usable at the target viewport.
- Confirm title `Continue`, save/reset, battle victory, shrine boss, and demo-complete flows still work.
- Package the repository or `dist/` with `README.md`, this file, and `QA_RUNTIME_REPORT.md` for handoff context.
- Include `DEPLOY_DEMO.md` when sending a presenter/deploy bundle.

## Phase 14 Release-Candidate Notes

- Production boot lazy-loads the Phaser game module after the React shell mounts, reducing the initial Vite entry chunk without changing scene flow.
- The browser shell uses a responsive, safe-area-aware canvas container for desktop, tablet, and phone demos while preserving the 960x640 game coordinate system.
- Overworld HUD text, prompts, and touch controls have larger hit targets and clearer contrast for small-screen presentation.
- Publish handoff validation: `npx tsc --noEmit`, `npm run build`, and `node qa-runtime.mjs`.

## Phase 15 Packaging Notes

- `package.json` exposes `typecheck`, `demo:serve`, and `demo:check` scripts for handoff clarity.
- `README.md` now separates quick start, build/preview, controls, presenter route, readiness checks, and limitations.
- These notes are the presenter-facing checklist for public demo delivery.

## Phase 16 Public-Drop Notes

- `DEPLOY_DEMO.md` documents the final static-host and presenter-machine command path.
- `demo:preview` provides a rebuild-and-preview workflow for production-like local review.
- `ship:check` aliases the full public-demo validation path for final handoff confidence.

## Known Limitations

- The slice is intentionally small and represents a public-demo vertical slice rather than a full chapter.
- Settings and credits are informational title prompts, not full submenus.
- Save support currently uses autosave slot `0` only.
- Battle presentation is functional for the showcase encounter, but enemy variety and long-form balancing are not final.
- Browser audio may still require an initial user gesture before playback, depending on browser policy.
