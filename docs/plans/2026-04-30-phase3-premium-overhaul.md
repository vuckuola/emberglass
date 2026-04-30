# Emberglass Phase 3 Premium Overhaul Plan

> **For Hermes:** Use subagent-driven-development skill or Codex phase prompts to implement this plan milestone-by-milestone with validation after each pass.

**Goal:** Push Emberglass from a polished 30-minute slice into a premium-feeling showcase JRPG where moment-to-moment play, presentation, and progression feel materially richer.

**Architecture:** Keep the current Phaser 3 + React + Vite architecture, deterministic generated-asset pipeline, and GitHub Pages deploy model. Improve perceived quality through HD presentation, combat juice, stronger progression payoff, richer home/base loop, and denser world flavor rather than rewriting core systems.

**Tech Stack:** Phaser 3.80.1, TypeScript, React 18, Vite 8, deterministic Pillow asset generator, Playwright runtime QA, GitHub Pages.

---

## Premium target pillars
1. **HD premium presentation** — cleaner upscale, stronger scene composition, better HUD hierarchy, better title/ending presentation.
2. **Combat feel upgrade** — heavier hits, clearer turn readability, stronger enemy/boss intros, better victory reward payoff.
3. **World life upgrade** — more ambient NPC/world beats, stronger area identity, base/home warmth, more delight while walking.
4. **Progression depth** — companion/pet/home systems should grant real gameplay advantages, not just dialogue flavor.
5. **Performance honesty** — keep the static deploy model stable; only ship changes that still pass runtime QA/build/deploy checks.

## Milestone order

### Milestone A — HD premium presentation + combat juice
**Intent:** Biggest immediate wow-per-minute gain.

Scope:
- Increase premium feel of title, overworld HUD, banners, overlays, and battle panel composition.
- Strengthen battle impact: heavier hit response, clearer actor focus, stronger victory panel, better boss telegraphing.
- Keep current story/progression intact.

Success checks:
- Game still typechecks/builds.
- `qa-runtime.mjs` still passes.
- Visual strings/QA updated if any UI wording changes.
- Live deploy stays healthy.

### Milestone B — living world expansion
Scope:
- Add more ambient NPC reactions and route flavor text.
- Improve home restoration payoff visually and mechanically.
- Add more small map beats without architecture rewrite.

### Milestone C — progression depth
Scope:
- Companion/pet/home upgrades give persistent buffs, utility, or route benefits with explicit save-state support.
- More meaningful loot/relic differentiation.

### Milestone D — performance + bundle hygiene
Scope:
- Investigate chunk splitting for `startGame-*`.
- Reduce obvious bloat while keeping gameplay unchanged.
- Add perf notes/checklist in docs if helpful.

## Execution rule
- Implement one milestone at a time.
- After each milestone: run `npm run typecheck && npm run build && node qa-runtime.mjs`.
- For user-visible progression or flow changes, add/adjust QA assertions.
- Push only after independent review or at least targeted diff audit.

## Immediate next move
Implement **Milestone A** now: HD premium presentation + combat juice.
