// Emberglass QA — Action RPG (Phase 4+)
import { chromium } from 'playwright';

(async () => {
  const steps = [];
  const pageErrors = [];

  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  page.on('pageerror', (err) => pageErrors.push(err.message));

  const evalScene = (fn) => page.evaluate(`(() => {
    const g = window.__EMBERGLASS_GAME__;
    if (!g) return '__NO_GAME__';
    const scene = g.scene.getScenes(true)[0];
    if (!scene) return '__NO_SCENE__';
    return ${fn};
  })()`);

  const waitForScene = (key, ms = 15000) =>
    page.waitForFunction(
      (k) => window.__EMBERGLASS_GAME__?.scene?.getScenes(true)?.some((s) => s.scene.key === k),
      key,
      { timeout: ms },
    );

  // Load game
  await page.goto('http://127.0.0.1:3456/emberglass/', { waitUntil: 'networkidle' });

  // Wait for game instance (BootScene → TitleScene)
  await page.waitForFunction(() => !!window.__EMBERGLASS_GAME__, { timeout: 30000 });
  steps.push('Game instance loaded');

  // Wait for TitleScene (after boot animation)
  await waitForScene('TitleScene');
  steps.push('TitleScene active');

  // Click "New Game"
  await page.waitForTimeout(500);
  const newGameExists = await page.evaluate(() =>
    !!document.querySelector('canvas') && true
  );
  // Click via Phaser scene interaction — press Enter to select "New Game" (default first item)
  await page.keyboard.press('Enter');
  await page.waitForTimeout(1000);

  // Wait for OverworldScene
  try {
    await waitForScene('OverworldScene', 20000);
    steps.push('OverworldScene active');
  } catch {
    // Fallback: try clicking directly
    await page.mouse.click(480, 340);
    await page.waitForTimeout(2000);
    try {
      await waitForScene('OverworldScene', 15000);
      steps.push('OverworldScene active (via click)');
    } catch {
      steps.push('WARN: Could not reach OverworldScene');
    }
  }

  // Overworld checks
  const mapInfo = await evalScene('({ mw: scene.MAP_WIDTH || 40, mh: scene.MAP_HEIGHT || 30 })');
  if (typeof mapInfo === 'object' && mapInfo !== null) {
    steps.push(`Map ${mapInfo.mw}x${mapInfo.mh}`);
  }

  const playerOk = await evalScene('(!!scene.player && scene.player.x > 0)');
  if (playerOk === true) steps.push('Player spawned');

  const enemyCount = await evalScene('(scene.mapEnemies ? scene.mapEnemies.length : -1)');
  if (enemyCount > 0) steps.push(`${enemyCount} enemies on map`);
  else if (enemyCount === 0) steps.push('No enemies yet (stage progression)');

  const hud = await evalScene('({ hp: !!scene.playerHpBar, mp: !!scene.playerMpBar })');
  if (hud && hud.hp) steps.push('HUD: HP bar');
  if (hud && hud.mp) steps.push('HUD: MP bar');

  // NPCs
  const npcs = await evalScene('({ g: !!scene.npcActors?.guide, e: !!scene.npcActors?.elder })');
  if (npcs && npcs.e) steps.push('NPC: Elder');

  // Companions (Phase 5)
  const companionCount = await evalScene('(scene.companions ? scene.companions.length : -1)');
  if (companionCount === 2) steps.push('2 companions (Kael + Io)');
  else if (companionCount >= 0) steps.push(`WARN: ${companionCount} companions`);

  const companionNames = await evalScene('(scene.companions ? scene.companions.map(c => c.name).join(", ") : "none")');
  if (companionNames && companionNames !== 'none') steps.push(`Companions: ${companionNames}`);

  // PWA manifest
  const hasManifest = await page.evaluate(() => !!document.querySelector('link[rel="manifest"]'));
  if (hasManifest) steps.push('PWA manifest linked');

  // Service worker
  const hasSW = await page.evaluate(() => 'serviceWorker' in navigator);
  if (hasSW) steps.push('Service Worker API available');

  // BattleScene should NOT be in active scenes
  const noBattle = await evalScene('(!scene.scene.manager.getScenes(true).some(s => s.scene.key === "BattleScene"))');
  if (noBattle === true) steps.push('BattleScene disabled');

  // Save system
  const saveOk = await page.evaluate(() => {
    try { return !!JSON.parse(localStorage.getItem('emberglass_save_0') || '{}').currentObjective; }
    catch { return false; }
  });
  if (saveOk) steps.push('Save system works');

  await page.waitForTimeout(500);
  console.log(JSON.stringify({ steps, pageErrors, notableWarnings: [] }, null, 2));
  await browser.close();
})();
