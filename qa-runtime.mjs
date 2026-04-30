import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/adm-herm/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome',
  args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const pageErrors = [];
const consoleErrors = [];
const notableWarnings = [];
const steps = [];

await page.addInitScript(() => {
  let phaserValue;
  Object.defineProperty(window, 'Phaser', {
    configurable: true,
    enumerable: true,
    get() { return phaserValue; },
    set(v) {
      if (v && v.Game && !v.__emberglassPatched) {
        const OriginalGame = v.Game;
        class PatchedGame extends OriginalGame {
          constructor(config) {
            super(config);
            window.__EMBERGLASS_GAME__ = this;
          }
        }
        v.Game = PatchedGame;
        v.__emberglassPatched = true;
      }
      phaserValue = v;
    },
  });
});

page.on('pageerror', (err) => pageErrors.push(err.message));
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') {
    consoleErrors.push(text);
    return;
  }
  if (msg.type() === 'warning' && !text.includes('GPU stall due to ReadPixels')) {
    notableWarnings.push(text);
  }
});

async function waitForScene(key, timeout = 15000) {
  await page.waitForFunction(
    (sceneKey) => {
      const game = window.__EMBERGLASS_GAME__;
      if (!game) return false;
      return game.scene.getScenes(true).some((scene) => scene.scene.key === sceneKey);
    },
    key,
    { timeout },
  );
}

async function getActiveSceneKey() {
  return page.evaluate(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0]?.scene.key ?? null);
}

async function getSceneTexts() {
  return page.evaluate(() => {
    const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
    return scene.children.list
      .filter((child) => typeof child.text === 'string')
      .map((child) => child.text);
  });
}

async function clickGameObject(locator) {
  const { x, y } = await page.evaluate(locator);
  const canvas = await page.locator('canvas').boundingBox();
  assert(canvas, 'Canvas bounding box missing');
  await page.mouse.click(canvas.x + x, canvas.y + y);
}

async function evalScene(fn, arg) {
  return page.evaluate(fn, arg);
}

await page.goto('http://127.0.0.1:4173/emberglass/', { waitUntil: 'networkidle' });
await page.waitForSelector('canvas', { timeout: 10000 });
await page.waitForFunction(() => !!window.__EMBERGLASS_GAME__, undefined, { timeout: 10000 });
await page.evaluate(() => localStorage.clear());
await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__EMBERGLASS_GAME__, undefined, { timeout: 10000 });
await waitForScene('TitleScene');
steps.push('Loaded TitleScene from clean storage');

const titleState = await page.evaluate(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return { selectedIndex: scene.selectedIndex, buttonLabels: scene.buttons.map((button) => button.text) };
});
assert.deepEqual(titleState.buttonLabels, ['New Game', 'Continue', 'Settings', 'Credits']);
steps.push('Verified title menu buttons: New Game / Continue / Settings / Credits');

await page.keyboard.press('ArrowDown');
await page.keyboard.press('Enter');
await page.waitForTimeout(250);
assert.equal(await getActiveSceneKey(), 'TitleScene');
assert((await getSceneTexts()).some((text) => text.includes('No save found. Choose New Game')));
steps.push('Verified Continue with no save stays on title and shows warning');

await page.evaluate(() => {
  localStorage.setItem('emberglass_save_0', JSON.stringify({
    version: 1,
    timestamp: Date.now(),
    slot: 0,
    party: [],
    inventory: [],
    gold: Number.NaN,
    openedChests: [],
    completedEvents: [],
    currentObjective: 'Corrupt objective',
    battleRewards: { exp: 0, gold: 0, emberShards: 0 },
    position: { mapId: 'Luma Quay', x: 120, y: 120 },
    quests: {},
    flags: {},
    playTime: 0,
  }));
});
await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.buttons.find((item) => item.text === 'Continue');
  return { x: button.x, y: button.y };
});
await page.waitForTimeout(250);
assert.equal(await getActiveSceneKey(), 'TitleScene');
assert((await getSceneTexts()).some((text) => text.includes('No save found. Choose New Game')));
await page.evaluate(() => localStorage.clear());
steps.push('Verified corrupt save data cannot continue the title flow');

await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.buttons.find((item) => item.text === 'Settings');
  return { x: button.x, y: button.y };
});
await page.waitForTimeout(150);
assert((await getSceneTexts()).some((text) => text.includes('Settings are not implemented in this slice')));
steps.push('Verified Settings button response');

await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.buttons.find((item) => item.text === 'Credits');
  return { x: button.x, y: button.y };
});
await page.waitForTimeout(150);
assert((await getSceneTexts()).some((text) => text.includes('Emberglass vertical slice')));
steps.push('Verified Credits button response');

await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.buttons.find((item) => item.text === 'New Game');
  return { x: button.x, y: button.y };
});
await waitForScene('OverworldScene');
steps.push('Started New Game into OverworldScene');
await page.waitForTimeout(1000);
assert((await getSceneTexts()).some((text) => text.includes('Demo Start')));
assert((await getSceneTexts()).some((text) => text.includes('15-minute vertical slice')));
steps.push('Verified first-session demo start guidance appears');

let overworldState = await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return {
    objective: scene.saveData.currentObjective,
    gold: scene.saveData.gold,
    inventory: scene.saveData.inventory,
  };
});
assert.equal(overworldState.objective, 'Speak with Elder Maelin at Luma Quay.');
steps.push('Verified initial overworld objective and save data');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.player.setPosition(2 * 48 + 24, 2 * 48 + 24);
  scene.facing = 'down';
  scene.interact();
});
await page.waitForTimeout(150);
assert((await getSceneTexts()).some((text) => text.includes('Nothing responds here')));
steps.push('Verified overworld no-op interactions explain next steps');

await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].openMenu());
assert.equal(await evalScene(() => Boolean(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].menuOverlay)), true);
await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].closeMenu());
assert.equal(await evalScene(() => Boolean(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].menuOverlay)), false);
steps.push('Verified overworld menu open/close via M and Escape');

const blockedField = await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.startFieldBattle();
  return {
    texts: scene.children.list.filter((child) => typeof child.text === 'string').map((child) => child.text),
    routeClarityStates: { ...scene.routeClarityStates },
    visualNames: scene.children.list.map((child) => child.name).filter(Boolean),
  };
});
assert(blockedField.texts.some((text) => text.includes('Guardian Ward') && text.includes('Inspect the ruin marker')));
assert.equal(blockedField.routeClarityStates['Guardian Ward'], 'closed');
assert.equal(blockedField.routeClarityStates['Shrine Gate'], 'closed');
assert(blockedField.visualNames.some((name) => name.startsWith('route-state:Guardian Ward:closed')));
assert(!blockedField.visualNames.some((name) => name.startsWith('route-state:Guardian Ward:open')));
assert(blockedField.visualNames.includes('landmark:FIELD GATE'));
assert(blockedField.visualNames.some((name) => name === 'route:blue shrine road'));
steps.push('Verified blocked routes expose only closed visual clarity states');

const preChest = await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return JSON.parse(JSON.stringify(scene.saveData));
});
await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].openChest());
const postChest = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(postChest.openedChests.length, preChest.openedChests.length + 1);
assert.equal(postChest.party[0].equipment.charm, 'wind_charm');
steps.push('Verified chest reward flow and auto-equip');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.talkGuide();
  scene.talkElder();
  scene.inspectMarker();
  scene.openShop();
  scene.ringTideBell();
  scene.inspectMural();
  scene.lightWatchLantern();
});

overworldState = await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return {
    flags: { ...scene.saveData.flags },
    objective: scene.saveData.currentObjective,
    gold: scene.saveData.gold,
    inventory: scene.saveData.inventory,
    events: scene.saveData.completedEvents,
  };
});
assert.equal(overworldState.flags.elder_intro, true);
assert.equal(overworldState.flags.field_marker_seen, true);
assert.equal(overworldState.flags.tide_bell_rung, true);
assert.equal(overworldState.flags.watch_lantern_lit, true);
assert.equal(overworldState.objective, 'Defeat the field guardian beyond the marker.');
assert(overworldState.events.includes('glass_mural_seen'));
steps.push('Verified elder/marker/shop/bell/mural/lantern interactions mutate save and objective state');

await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].startFieldBattle());
await waitForScene('BattleScene');
steps.push('Entered field battle');

await page.waitForFunction(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return scene.scene.key === 'BattleScene' && scene.commandTexts?.length === 5 && scene.commandTexts[0].input?.enabled;
}, undefined, { timeout: 12000 });

await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.commandTexts.find((item) => item.text === 'Attack');
  return { x: button.x, y: button.y };
});
await page.waitForFunction(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].waitingForTarget, undefined, { timeout: 3000 });
await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const enemy = scene.combat.enemies.find((entity) => entity.isAlive);
  const view = scene.entityViews.get(enemy);
  return { x: view.rect.x, y: view.rect.y };
});
await page.waitForTimeout(1000);
steps.push('Verified field battle Attack button and target click response');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const actor = scene.combat.party.find((entity) => entity.isAlive);
  scene.combat.currentEntity = actor;
  scene.showActionMenu();
});
await page.waitForFunction(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return scene.scene.key === 'BattleScene' && scene.commandTexts?.length === 5 && scene.commandTexts[0].input?.enabled;
}, undefined, { timeout: 12000 });
assert((await getSceneTexts()).some((text) => text.includes('Commands 1–5')));
steps.push('Verified battle keyboard command prompt');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const actor = scene.combat.party.find((entity) => entity.isAlive);
  scene.combat.currentEntity = actor;
  scene.showActionMenu();
  scene.selectCommand('Item');
  scene.tryTarget(scene.combat.party[0]);
  scene.combat.currentEntity = actor;
  scene.showActionMenu();
  scene.selectCommand('Defend');
});
await page.waitForTimeout(1000);
steps.push('Verified Item and Defend battle command flows');

await evalScene(() => {
  window.__EMBERGLASS_GAME__.scene.start('OverworldScene', {
    continueGame: true,
    battleResult: {
      battleId: 'field_marker_battle',
      victory: true,
      rewards: { exp: 36, gold: 18, emberShards: 1, items: [{ itemId: 'health_potion', quantity: 1 }] },
    },
  });
});
await waitForScene('OverworldScene', 12000);
steps.push('Forced and verified field battle victory return flow');

let postFieldState = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(postFieldState.flags.field_battle_won, true);
assert.equal(postFieldState.currentObjective, 'Return to Elder Maelin with the ember shard.');
steps.push('Verified field battle rewards/objective application');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.talkElder();
  scene.attuneShrineFont();
  scene.inspectShrineGate();
  scene.attuneShrineFont();
});

let shrineState = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(shrineState.flags.slice_complete, true);
assert.equal(shrineState.flags.shrine_gate_seen, true);
assert.equal(shrineState.flags.shrine_font_attuned, true);
assert.equal(shrineState.currentObjective, 'Break the inner seal and face the Moonwake Guardian.');
steps.push('Verified elder reward, shrine gate unlock, and pilgrim font attunement');

await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].startShrineGuardianBattle());
await waitForScene('BattleScene', 12000);
steps.push('Entered shrine guardian boss battle');

await page.waitForFunction(() => (window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].messageText?.text ?? '').includes('Moonwake Guardian'), undefined, { timeout: 3000 });
steps.push('Verified boss intro messaging');

await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.commandTexts.find((item) => item.text === 'Escape');
  return { x: button.x, y: button.y };
});
await page.waitForTimeout(150);
const bossEscapeMessage = await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].messageText?.text ?? '');
assert(bossEscapeMessage.includes('seal refuses retreat'));
steps.push('Verified boss Escape command is blocked with seal message');

await page.waitForTimeout(900);
await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.commandTexts.find((item) => item.text === 'Attack');
  return { x: button.x, y: button.y };
});
await page.waitForTimeout(100);
await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const enemy = scene.combat.enemies.find((entity) => entity.isAlive);
  const view = scene.entityViews.get(enemy);
  return { x: view.rect.x, y: view.rect.y };
});
await page.waitForTimeout(800);
steps.push('Verified boss battle attack flow');

await evalScene(() => {
  const active = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const reward = active.combat.getReward();
  window.__EMBERGLASS_GAME__.scene.start('OverworldScene', {
    continueGame: true,
    battleResult: {
      battleId: 'moonwake_guardian_battle',
      victory: true,
      rewards: {
        exp: reward.exp,
        gold: reward.gold,
        emberShards: 0,
        items: [{ itemId: 'health_elixir', quantity: 1 }],
      },
    },
  });
});
await waitForScene('OverworldScene', 12000);
steps.push('Verified boss victory return flow');

const finalState = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(finalState.flags.shrine_guardian_won, true);
assert.equal(finalState.currentObjective, 'Follow the broken-bridge lane and recruit Mira.');
assert.equal(finalState.party[0].equipment.relic, 'skywell_shard');
assert(finalState.party.every((member) => member.level >= 4));
steps.push('Verified shrine completion now opens the longer Phase 2 route');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.recruitMira();
  scene.rescuePet();
  scene.restoreHome();
  scene.restoreHome();
  scene.restoreHome();
  scene.enterArchive();
});
let phase2State = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(phase2State.flags.mira_recruited, true);
assert.equal(phase2State.pet.unlocked, true);
assert.deepEqual(phase2State.home, { warmth: 1, garden: 1, workshop: 1 });
assert(phase2State.party.every((member) => member.currentHp > 0 && member.currentMp > 0));
assert(phase2State.inventory.some((entry) => entry.itemId === 'mira_bridge_key' && entry.quantity === 1));
assert.equal(phase2State.flags.archive_entered, true);
assert.equal(phase2State.currentObjective, 'Cut through the archive roots and defeat Thornheart.');
steps.push('Verified recruitable ally beat, pet unlock, home restoration loop, and archive entry');

await evalScene(() => {
  window.__EMBERGLASS_GAME__.scene.start('OverworldScene', {
    continueGame: true,
    battleResult: {
      battleId: 'archive_skirmish_battle',
      victory: true,
      rewards: { exp: 80, gold: 60, emberShards: 1, items: [{ itemId: 'mana_potion', quantity: 1 }, { itemId: 'glass_lens', quantity: 1 }] },
    },
  });
});
await waitForScene('OverworldScene', 12000);
await evalScene(() => {
  window.__EMBERGLASS_GAME__.scene.start('OverworldScene', {
    continueGame: true,
    battleResult: {
      battleId: 'thornheart_battle',
      victory: true,
      rewards: { exp: 180, gold: 120, emberShards: 2, items: [{ itemId: 'root_crown', quantity: 1 }] },
    },
  });
});
await waitForScene('OverworldScene', 12000);
phase2State = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(phase2State.flags.archive_skirmish_won, true);
assert.equal(phase2State.flags.thornheart_won, true);
assert.equal(phase2State.pet.forageReady, true);
assert.equal(phase2State.currentObjective, 'Use the restored home workshop to focus the Skywell Lens.');
steps.push('Verified archive encounter and mid-boss progression rewards');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.startFinalBossBattle();
});
let postGateTexts = await getSceneTexts();
assert(postGateTexts.some((text) => text.includes('Skywell Barrier') && text.includes('restored home workshop')));

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.restoreHome();
});
phase2State = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(phase2State.flags.skywell_opened, true);
assert.equal(phase2State.currentObjective, 'Follow the now-open Skywell approach and confront the Cartographer\'s Lie.');
const openedRouteTexts = await getSceneTexts();
assert(openedRouteTexts.some((text) => text.includes('Skywell Barrier open')));
const openedRouteVisuals = await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  return {
    routeClarityStates: { ...scene.routeClarityStates },
    visualNames: scene.children.list.map((child) => child.name).filter(Boolean),
  };
});
assert.equal(openedRouteVisuals.routeClarityStates['Skywell Barrier'], 'open');
assert.equal(openedRouteVisuals.routeClarityStates.Overgrowth, 'open');
assert(openedRouteVisuals.visualNames.some((name) => name.startsWith('route-state:Skywell Barrier:open')));
assert(!openedRouteVisuals.visualNames.some((name) => name.startsWith('route-state:Skywell Barrier:closed')));
assert(openedRouteVisuals.visualNames.some((name) => name.startsWith('route-state:Overgrowth:open')));
assert(!openedRouteVisuals.visualNames.some((name) => name.startsWith('route-state:Overgrowth:closed')));
assert(openedRouteVisuals.visualNames.includes('landmark:SKYWELL STAIRS'));
steps.push('Verified newly opened Skywell route state replaces the closed blockers on the map');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.startFinalBossBattle();
});
await waitForScene('BattleScene', 12000);
steps.push('Entered final boss battle');

await evalScene(() => {
  window.__EMBERGLASS_GAME__.scene.start('OverworldScene', {
    continueGame: true,
    battleResult: {
      battleId: 'cartographers_lie_battle',
      victory: true,
      rewards: { exp: 600, gold: 500, emberShards: 3, items: [{ itemId: 'true_map', quantity: 1 }] },
    },
  });
});
await waitForScene('OverworldScene', 12000);
const clearState = await evalScene(() => JSON.parse(JSON.stringify(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData)));
assert.equal(clearState.flags.final_boss_won, true);
assert.equal(clearState.flags.demo_complete, true);
assert.equal(clearState.stage, 'homecoming');
assert.equal(clearState.currentObjective, 'Return home. Luma Quay has a future again.');
await page.waitForFunction(async () => {
  const texts = Array.from(window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].children.list)
    .filter((child) => child && child.type === 'Text')
    .map((child) => child.text ?? '');
  return texts.some((text) => text.includes('Thanks for Playing the Emberglass Demo'));
}, undefined, { timeout: 7000 });
steps.push('Verified final boss clear, final objective, and demo card');

await evalScene(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  scene.saveNoticeShown = false;
  scene.player.setPosition(5 * 48 + 24, 5 * 48 + 24);
  scene.checkSavePoint();
});
const saveSnapshot = await page.evaluate(() => JSON.parse(localStorage.getItem('emberglass_save_0')));
assert(saveSnapshot && saveSnapshot.position && saveSnapshot.currentObjective);
assert((await getSceneTexts()).some((text) => text.includes('Progress saved at the Skywell')));
steps.push('Verified save point writes slot 0 save data');

await page.reload({ waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__EMBERGLASS_GAME__, undefined, { timeout: 10000 });
await waitForScene('TitleScene');
await clickGameObject(() => {
  const scene = window.__EMBERGLASS_GAME__.scene.getScenes(true)[0];
  const button = scene.buttons.find((item) => item.text === 'Continue');
  return { x: button.x, y: button.y };
});
await waitForScene('OverworldScene', 12000);
const continuedObjective = await evalScene(() => window.__EMBERGLASS_GAME__.scene.getScenes(true)[0].saveData.currentObjective);
assert.equal(continuedObjective, 'Return home. Luma Quay has a future again.');
steps.push('Verified Continue button loads persisted save');

await browser.close();

console.log(JSON.stringify({
  ok: true,
  steps,
  pageErrors,
  consoleErrors,
  notableWarnings,
}, null, 2));
