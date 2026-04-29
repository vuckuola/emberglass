Apply Phase 18 showcase polish to the Emberglass JRPG demo. Make ALL edits below. Return complete modified files.

## 1. package.json — version bump
Change version from "0.15.0" to "0.18.0".

## 2. TitleScene.ts — version text
In create(), find the version text `this.add.text(width / 2, height - 18, 'v0.1',` and change `'v0.1'` to `'v0.18'`.

## 3. OverworldScene.ts — MAJOR POLISH

### 3a. Add ambient particles
After createBackdrop(), add a new method and call it:
```typescript
this.createAmbientParticles()
```

New method:
```typescript
private createAmbientParticles() {
  const saveCenterX = SAVE_TILE.x * TILE_SIZE + TILE_SIZE / 2
  const saveCenterY = SAVE_TILE.y * TILE_SIZE + TILE_SIZE / 2
  for (let i = 0; i < 6; i++) {
    const fx = Phaser.Math.Between(saveCenterX - 48, saveCenterX + 48)
    const fy = Phaser.Math.Between(saveCenterY - 48, saveCenterY + 48)
    const glow = this.add.circle(fx, fy, Phaser.Math.FloatBetween(1.5, 3), 0x9ff3ff, Phaser.Math.FloatBetween(0.15, 0.35)).setDepth(5)
    this.tweens.add({
      targets: glow,
      x: `+=${Phaser.Math.Between(-20, 20)}`,
      y: `+=${Phaser.Math.Between(-30, -10)}`,
      alpha: 0.05,
      yoyo: true, repeat: -1,
      duration: Phaser.Math.Between(2500, 4500),
      ease: 'Sine.easeInOut',
    })
  }
  for (let i = 0; i < 8; i++) {
    const gx = Phaser.Math.Between(48, MAP_WIDTH * TILE_SIZE - 48)
    const gy = Phaser.Math.Between(48, MAP_HEIGHT * TILE_SIZE - 48)
    const leaf = this.add.circle(gx, gy, 1.5, 0x6abf5e, 0.12).setDepth(0.3)
    this.tweens.add({
      targets: leaf,
      x: `+=${Phaser.Math.Between(-12, 12)}`,
      y: `+=${Phaser.Math.Between(-16, 16)}`,
      alpha: 0.02,
      yoyo: true, repeat: -1,
      duration: Phaser.Math.Between(3000, 5000),
      delay: Phaser.Math.Between(0, 2000),
      ease: 'Sine.easeInOut',
    })
  }
}
```

### 3b. Banner queue — prevent overlapping banners
Add a private field at the top of the class (with other private fields):
```typescript
private activeBanners: Phaser.GameObjects.GameObject[] = []
```

Add a dismiss method:
```typescript
private dismissBanners() {
  this.activeBanners.forEach((b) => b.destroy())
  this.activeBanners = []
}
```

In create(), add `this.activeBanners = []` in the reset block.

In showAreaBanner(), at the start add `this.dismissBanners()`, and change the onComplete to also clear activeBanners. Replace the final tween with:
```typescript
this.activeBanners.push(panel, heading, body)
this.tweens.add({
  targets: [panel, heading, body],
  alpha: 0, delay: 2300, duration: 600,
  onComplete: () => { panel.destroy(); heading.destroy(); body.destroy(); this.activeBanners = this.activeBanners.filter(b => b.scene && b.active) },
})
```

In showEventBanner(), same pattern — add `this.dismissBanners()` at start, push objects into activeBanners, clean up in onComplete.

In showDemoCompletionCard(), add `this.dismissBanners()` at start, push objects into activeBanners.

### 3c. HUD polish
Replace createHud() with a version that uses decorative borders:

```typescript
private createHud() {
  const panel = this.add.rectangle(12, 12, 500, 86, 0x0b0e1a, 0.88).setOrigin(0).setScrollFactor(0).setDepth(90)
  panel.setStrokeStyle(2, 0xf3e1b0, 0.68)
  const cornerSize = 10
  const corners = [
    { x: 18, y: 18 }, { x: 500, y: 18 }, { x: 18, y: 86 }, { x: 500, y: 86 },
  ]
  const g = this.add.graphics().setScrollFactor(0).setDepth(90.1)
  g.lineStyle(2, 0xf0c040, 0.5)
  // top-left corner
  g.beginPath(); g.moveTo(14, 18 + cornerSize); g.lineTo(14, 18); g.lineTo(14 + cornerSize, 18); g.strokePath()
  // top-right corner
  g.beginPath(); g.moveTo(504, 18 + cornerSize); g.lineTo(504, 18); g.lineTo(504 - cornerSize, 18); g.strokePath()
  // bottom-left corner
  g.beginPath(); g.moveTo(14, 86 - cornerSize); g.lineTo(14, 86); g.lineTo(14 + cornerSize, 86); g.strokePath()
  // bottom-right corner
  g.beginPath(); g.moveTo(504, 86 - cornerSize); g.lineTo(504, 86); g.lineTo(504 - cornerSize, 86); g.strokePath()

  this.objectiveText = this.add.text(26, 23, '', { color: '#fff1a8', fontFamily: 'Georgia, serif', fontSize: '15px', fontStyle: 'bold', wordWrap: { width: 460 } }).setScrollFactor(0).setDepth(91)
  this.inventoryText = this.add.text(26, 69, '', { color: '#d7d9e8', fontFamily: 'Arial, sans-serif', fontSize: '13px' }).setScrollFactor(0).setDepth(91)
  
  const areaPanel = this.add.rectangle(this.scale.width / 2, 14, 160, 34, 0x0b0e1a, 0.88).setOrigin(0.5, 0).setScrollFactor(0).setDepth(90)
  areaPanel.setStrokeStyle(1, 0xf3e1b0, 0.5)
  this.areaText = this.add.text(this.scale.width / 2, 31, 'Luma Quay', { color: '#9ff3ff', fontFamily: 'Georgia, serif', fontSize: '16px' }).setOrigin(0.5).setScrollFactor(0).setDepth(91)
  this.promptText = this.add.text(this.scale.width / 2, this.scale.height - 18, '', { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '14px', backgroundColor: '#08091aaa', padding: { x: 12, y: 6 } }).setOrigin(0.5).setScrollFactor(0).setDepth(95)
}
```

### 3d. Contextual interaction prompt
Replace the updateInteractionPrompt() method. When near nothing, show shorter text:
```typescript
private updateInteractionPrompt() {
  const tile = this.getInteractionTile()
  const playerTile = this.player ? this.worldToTile(this.player.x, this.player.y) : null
  const isAt = (target: { x: number; y: number }) => this.matchesTile(tile, target) || this.matchesTile(playerTile, target)
  const actions: Array<[string, string]> = [
    [() => isAt(CHEST_TILE), this.saveData.openedChests.includes(CHEST_ID) ? 'Empty chest' : 'Open supply chest'],
    [() => isAt(GUIDE_TILE), 'Talk to Guide Rin'],
    [() => isAt(ELDER_TILE), 'Talk to Elder Maelin'],
    [() => isAt(MERCHANT_TILE), 'Trade with quay peddler'],
    [() => isAt(MARKER_TILE), 'Inspect ruin marker'],
    [() => isAt(SIGNPOST_TILE), 'Read signpost'],
    [() => isAt(TIDE_BELL_TILE), 'Ring tide bell'],
    [() => isAt(MURAL_TILE), 'Study glass mural'],
    [() => isAt(WATCH_LANTERN_TILE), 'Tend watch lantern'],
    [() => isAt(SHRINE_GATE_TILE), 'Inspect shrine gate'],
    [() => isAt(SHRINE_FONT_TILE), 'Attune pilgrim font'],
    [() => isAt(SHRINE_SEAL_TILE), 'Challenge inner seal'],
    [() => isAt(FIELD_BATTLE_TILE), 'Enter guardian field'],
  ]
  const match = actions.find(([check]) => check())
  const prompt = match ? `${match[1]}  [Enter/ACT]` : 'WASD/Arrows: Move • Enter: Interact • M/Esc: Menu'
  this.promptText?.setText(prompt)
}
```

### 3e. Toast dialogue box polish
Replace showToast with a styled version:
```typescript
private showToast(message: string) {
  const { width } = this.scale
  this.toast?.destroy()
  const panelW = Math.min(message.length * 9 + 48, 740)
  const panelH = Math.ceil(message.length / 70) * 22 + 32
  const panel = this.add.rectangle(width / 2, 126, panelW, Math.max(panelH, 40), 0x0a0e1e, 0.92).setScrollFactor(0).setDepth(100).setStrokeStyle(1, 0xd4a84b, 0.6)
  const accent = this.add.rectangle(width / 2 - panelW / 2 + 3, 126, 3, Math.max(panelH - 8, 28), 0xd4a84b, 0.8).setScrollFactor(0).setDepth(100.1)
  const text = this.add.text(width / 2, 126, message, { color: '#ffffff', fontFamily: 'Arial, sans-serif', fontSize: '17px', wordWrap: { width: panelW - 32 } }).setOrigin(0.5).setScrollFactor(0).setDepth(101)
  this.toast = text
  this.tweens.add({ targets: [panel, accent, text], y: 104, alpha: 0, delay: 1900, duration: 450, onComplete: () => { if (this.toast === text) { this.toast = undefined }; panel.destroy(); accent.destroy(); text.destroy() } })
}
```

### 3f. Menu overlay polish
Replace the openMenu() interior panel decoration. Add section dividers:
After the main panel line, add:
```typescript
container.add(this.add.rectangle(width / 2, height / 2 - 136, 640, 1, 0xd4a84b, 0.3))
container.add(this.add.rectangle(width / 2, height / 2 - 52, 640, 1, 0xd4a84b, 0.3))
container.add(this.add.rectangle(width / 2, height / 2 + 160, 640, 1, 0xd4a84b, 0.3))
```
Add a diamond decoration before the title:
```typescript
container.add(this.add.text(width / 2 - 310, height / 2 - 220, '◈', { color: '#f0c040', fontFamily: 'Arial, sans-serif', fontSize: '22px' }))
```

## 4. BattleScene.ts — BATTLE POLISH

### 4a. Entity views with wider HP bars and shadows
Replace createEntityView with:
```typescript
private createEntityView(entity: BattleEntity, x: number, y: number, color: number) {
  // Shadow
  this.add.ellipse(x, y + (entity.isPlayer ? 38 : 30), entity.isPlayer ? 36 : 42, 12, 0x050510, 0.4).setDepth(0.5)

  const rect = this.add
    .rectangle(x, y, entity.isPlayer ? 58 : 68, entity.isPlayer ? 72 : 58, color)
    .setStrokeStyle(2, 0xffffff, 0.25)
    .setInteractive({ useHandCursor: true })
    .setAlpha(this.getEntityAssetKey(entity) ? 0.18 : 1)
    .setDepth(1)

  rect.on('pointerdown', () => this.tryTarget(entity))

  const assetKey = this.getEntityAssetKey(entity)
  const sprite = assetKey
    ? this.add
        .image(x, y - (entity.isPlayer ? 4 : 0), assetKey)
        .setInteractive({ useHandCursor: true })
        .setDepth(2)
    : undefined
  sprite?.setScale(entity.isPlayer ? 1.25 : 1.05)
  sprite?.on('pointerdown', () => this.tryTarget(entity))

  const label = this.add
    .text(x, y - 54, entity.name, {
      color: '#ffffff',
      fontFamily: 'Georgia, serif',
      fontSize: '14px',
    })
    .setOrigin(0.5)
    .setDepth(10)

  // HP bar - wider with track
  const hpTrackW = 90
  const hpBarH = 8
  const hpY = y + 48
  this.add.rectangle(x - hpTrackW / 2, hpY, hpTrackW, hpBarH, 0x1a0a0a, 0.8).setOrigin(0, 0.5).setDepth(10)
  this.add.rectangle(x - hpTrackW / 2, hpY, hpTrackW, hpBarH, 0x2a1515, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, 0x4a2020, 0.4).setDepth(10.1)
  const hpFill = this.add.rectangle(x - hpTrackW / 2 + 1, hpY, hpTrackW - 2, hpBarH - 2, 0x36d65f).setOrigin(0, 0.5).setDepth(10.2)

  // MP bar
  const mpTrackW = 68
  const mpBarH = 6
  const mpY = y + 60
  this.add.rectangle(x - mpTrackW / 2, mpY, mpTrackW, mpBarH, 0x0a0a1a, 0.8).setOrigin(0, 0.5).setDepth(10)
  this.add.rectangle(x - mpTrackW / 2, mpY, mpTrackW, mpBarH, 0x101828, 0.6).setOrigin(0, 0.5).setStrokeStyle(1, 0x1a2040, 0.4).setDepth(10.1)
  const mpFill = this.add.rectangle(x - mpTrackW / 2 + 1, mpY, mpTrackW - 2, mpBarH - 2, 0x3f8cff).setOrigin(0, 0.5).setDepth(10.2)

  this.entityViews.set(entity, { rect, sprite, label, hpFill, mpFill, color })
}
```

### 4b. Update refreshUi to match new bar widths
Replace refreshUi():
```typescript
private refreshUi() {
  if (!this.combat) return
  for (const [entity, view] of this.entityViews) {
    const hpRatio = Phaser.Math.Clamp(entity.currentHp / entity.maxHp, 0, 1)
    const mpRatio = entity.maxMp > 0 ? Phaser.Math.Clamp(entity.currentMp / entity.maxMp, 0, 1) : 0
    view.hpFill.width = Math.max(0, 86 * hpRatio)
    view.hpFill.fillColor = hpRatio > 0.35 ? 0x36d65f : hpRatio > 0.15 ? 0xd4a020 : 0xd94747
    view.mpFill.width = Math.max(0, 64 * mpRatio)
    view.rect.setAlpha(entity.isAlive ? 1 : 0.35)
    if (view.sprite) view.sprite.setAlpha(entity.isAlive ? 1 : 0.35)
    view.label.setAlpha(entity.isAlive ? 1 : 0.45)
  }
  this.currentNameText?.setText(this.combat.currentEntity?.name ?? '')
  this.createTimeline()
}
```

### 4c. Enhanced flashTarget with screen shake and color
Replace flashTarget:
```typescript
private flashTarget(entity: BattleEntity) {
  const view = this.entityViews.get(entity)
  if (!view) return
  const targets = view.sprite ? [view.sprite, view.rect] : [view.rect]
  this.tweens.add({
    targets,
    duration: 80,
    onStart: () => {
      view.sprite?.setTint(0xff4444)
      view.rect.setFillStyle(0xff4444)
    },
    onComplete: () => {
      view.sprite?.clearTint()
      view.rect.setFillStyle(view.color)
    },
  })
}
```

### 4d. Active turn indicator pulse
In createEntityViews(), after setting up all entity views, add a method to highlight the current turn entity. Call it in startTurn() after refreshUi(). Add to the class:
```typescript
private turnIndicator?: Phaser.GameObjects.Ellipse

private updateTurnIndicator() {
  this.turnIndicator?.destroy()
  if (!this.combat?.currentEntity) return
  const view = this.entityViews.get(this.combat.currentEntity)
  if (!view) return
  const target = view.sprite ?? view.rect
  this.turnIndicator = this.add.ellipse(target.x, target.y, 70, 80, 0xfff1a8, 0).setDepth(0.8)
  this.tweens.add({
    targets: this.turnIndicator,
    alpha: 0.12,
    duration: 600,
    yoyo: true,
    repeat: -1,
    ease: 'Sine.easeInOut',
  })
}
```

### 4e. Bottom panel with number labels and gold border
Replace createBottomPanel:
```typescript
private createBottomPanel(width: number, height: number) {
  const panelY = height - 140
  if (hasTexture(this, GENERATED_ASSETS.uiPanel)) {
    this.add.image(width / 2, panelY + 70, GENERATED_ASSETS.uiPanel).setDisplaySize(width - 24, 132).setAlpha(0.96)
  } else {
    const panel = this.add.rectangle(12, panelY, width - 24, 132, 0x0a0e1e, 0.96).setOrigin(0).setStrokeStyle(2, 0xf3e1b0, 0.55).setDepth(49)
    // Corner accents
    const cg = this.add.graphics().setDepth(49.1)
    cg.lineStyle(2, 0xf0c040, 0.4)
    cg.beginPath(); cg.moveTo(18, panelY + 10); cg.lineTo(18, panelY + 2); cg.lineTo(26, panelY + 2); cg.strokePath()
    cg.beginPath(); cg.moveTo(width - 18, panelY + 10); cg.lineTo(width - 18, panelY + 2); cg.lineTo(width - 26, panelY + 2); cg.strokePath()
  }

  this.currentNameText = this.add.text(32, panelY + 22, '', {
    color: '#f0c040',
    fontFamily: 'Georgia, serif',
    fontSize: '20px',
  }).setDepth(50)

  COMMANDS.forEach((command, index) => {
    const numText = this.add.text(34 + index * 116, panelY + 62, `${index + 1}`, {
      color: '#f0c040',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
    }).setDepth(50)
    const text = this.add
      .text(50 + index * 116, panelY + 72, command, {
        color: '#d7d9e8',
        fontFamily: 'Arial, sans-serif',
        fontSize: '20px',
      })
      .setInteractive({ useHandCursor: true })
      .setDepth(50)
    text.on('pointerdown', () => this.selectCommand(command))
    text.on('pointerover', () => { text.setColor('#fff1a8'); numText.setColor('#fff1a8') })
    text.on('pointerout', () => { text.setColor('#d7d9e8'); numText.setColor('#f0c040') })
    this.commandTexts.push(text)
  })

  this.add.text(width - 330, panelY + 24, '1-5 or click to command', {
    color: '#8ab4f8',
    fontFamily: 'Arial, sans-serif',
    fontSize: '15px',
  }).setDepth(50)
}
```

### 4f. Victory sparkle effect
In showVictoryCard, after creating the card elements, add sparkle particles:
```typescript
// After the existing tweens:
for (let i = 0; i < 5; i++) {
  const sparkle = this.add.circle(width / 2 + Phaser.Math.Between(-180, 180), height / 2 - 108, Phaser.Math.Between(2, 4), 0xffd36e, 0.8).setDepth(99.5)
  this.tweens.add({
    targets: sparkle,
    y: sparkle.y - Phaser.Math.Between(30, 60),
    alpha: 0,
    duration: Phaser.Math.Between(600, 1200),
    delay: 200 + i * 80,
    ease: 'Sine.easeOut',
    onComplete: () => sparkle.destroy(),
  })
}
```

### 4g. Enemy death effect
In refreshUi(), when an entity dies (alpha set to 0.35), add a death effect:
```typescript
// In refreshUi, after setting alpha for dead entities:
if (!entity.isAlive && entity.expReward > 0) {
  this.addDeathEffect(view)
}
```
New method:
```typescript
private addDeathEffect(view: EntityView) {
  const target = view.sprite ?? view.rect
  if (!target || !target.active) return
  const x = target.x
  const y = target.y
  for (let i = 0; i < 3; i++) {
    const particle = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffffff, 0.7).setDepth(95)
    this.tweens.add({
      targets: particle,
      x: x + Phaser.Math.Between(-30, 30),
      y: y + Phaser.Math.Between(-30, 10),
      alpha: 0,
      scale: 0.2,
      duration: Phaser.Math.Between(400, 700),
      delay: i * 60,
      ease: 'Sine.easeOut',
      onComplete: () => particle.destroy(),
    })
  }
}
```

IMPORTANT: Keep all existing function signatures. Keep all QA-visible text content identical. Do NOT change the QA runtime test flow. Make sure `npm run typecheck` passes. Make sure `npm run build` succeeds. Return ALL modified files in full.
