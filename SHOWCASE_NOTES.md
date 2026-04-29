# Emberglass Showcase Notes

## Playable Now

- A playable web JRPG vertical slice centered on Luma Quay.
- Title screen, loading flow, first-session demo guidance, overworld exploration, interactable NPCs/objects, save persistence, shop/chest rewards, field-gated battle, shrine boss route, victory rewards, and an end-of-slice thank-you card.
- Procedural/generated visual treatment and audio identity are present for the title, town, battle, victory, and interaction feedback.

## Controls

- Move/select: `WASD` or arrow keys.
- Interact/confirm: `Enter` or `Space` in the overworld, `Enter` on the title screen.
- Open/close menu: `M` or `Esc` in the overworld.
- Reset demo save: `R` on the title screen deletes autosave slot `0` for a fresh showcase run.

## Current Loop

1. Start a new game from the title screen.
2. Follow the demo-start guidance, then speak with Elder Maelin.
3. Inspect the eastern ruin marker.
4. Enter the guardian field and win the battle.
5. Return to Elder Maelin for the route-opening reward.
6. Inspect the Moonwake Shrine gate, attune the pilgrim font, and break the inner seal.
7. Defeat the Moonwake Guardian and read the thank-you/demo-complete payoff card.
8. Save at the skywell or use the title-screen reset helper before another demo pass.

## QA Pass Summary

- Ran code-level inspection of title, overworld, save, and battle state transitions.
- Verified TypeScript with `npx tsc --noEmit` during the QA pass.
- Added title-screen feedback for unavailable `Continue`, `Settings`, and `Credits` selections so menu items no longer fail silently.
- Added a tiny title-screen reset helper for fresh demo-save behavior without browser devtools.
- Clarified title-screen controls with an on-screen hint.
- Added an authored first-session demo-start banner so new players know the intended route and scope.
- Added a deterministic demo-complete flag and end-of-slice thank-you card after the Moonwake Guardian route.

## Phase 14 Release-Candidate Notes

- Production boot lazy-loads the Phaser game module after the React shell mounts, reducing the initial Vite entry chunk without changing scene flow.
- The browser shell uses a responsive, safe-area-aware canvas container for desktop, tablet, and phone demos while preserving the 960x640 game coordinate system.
- Overworld HUD text, prompts, and touch controls have larger hit targets and clearer contrast for small-screen presentation.
- Publish handoff validation: `npx tsc --noEmit`, `npm run build`, and `node qa-runtime.mjs`.

## Known Limitations

- The slice is intentionally small and represents a public-demo vertical slice rather than a full chapter.
- Settings and credits are informational title prompts, not full submenus.
- Save support currently uses autosave slot `0` only.
- Battle presentation is functional for the showcase encounter, but enemy variety and long-form balancing are not final.
- Browser audio may still require an initial user gesture before playback, depending on browser policy.
