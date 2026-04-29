import Phaser from 'phaser'

export const GENERATED_ASSETS = {
  heroes: {
    nara: 'generated.hero.nara',
    kael: 'generated.hero.kael',
    io: 'generated.hero.io',
  },
  npc: 'generated.npc.lumaElder',
  enemies: {
    vinecrawler: 'generated.enemy.vinecrawler',
    moss_knight: 'generated.enemy.mossKnight',
    sporefiend: 'generated.enemy.sporefiend',
    archive_guardian: 'generated.enemy.archiveGuardian',
  },
  icons: {
    potion: 'generated.icon.potion',
    ether: 'generated.icon.ether',
    emberShard: 'generated.icon.emberShard',
  },
  tileset: 'generated.tileset.emberQuay',
  overworldBg: 'generated.bg.overworld',
  battleBg: 'generated.bg.battle',
  uiPanel: 'generated.ui.panel',
  chest: 'generated.object.chest',
} as const

const BASE = '/assets/generated/'

export function preloadGeneratedAssets(scene: Phaser.Scene) {
  scene.load.spritesheet(GENERATED_ASSETS.heroes.nara, `${BASE}hero_nara_sheet.png`, { frameWidth: 32, frameHeight: 48 })
  scene.load.spritesheet(GENERATED_ASSETS.heroes.kael, `${BASE}hero_kael_sheet.png`, { frameWidth: 32, frameHeight: 48 })
  scene.load.spritesheet(GENERATED_ASSETS.heroes.io, `${BASE}hero_io_sheet.png`, { frameWidth: 32, frameHeight: 48 })
  scene.load.spritesheet(GENERATED_ASSETS.npc, `${BASE}npc_luma_elder_sheet.png`, { frameWidth: 32, frameHeight: 48 })
  scene.load.image(GENERATED_ASSETS.enemies.vinecrawler, `${BASE}enemy_vinecrawler.png`)
  scene.load.image(GENERATED_ASSETS.enemies.moss_knight, `${BASE}enemy_moss_knight.png`)
  scene.load.image(GENERATED_ASSETS.enemies.sporefiend, `${BASE}enemy_sporefiend.png`)
  scene.load.image(GENERATED_ASSETS.enemies.archive_guardian, `${BASE}enemy_archive_guardian.png`)
  scene.load.image(GENERATED_ASSETS.icons.potion, `${BASE}icon_potion.png`)
  scene.load.image(GENERATED_ASSETS.icons.ether, `${BASE}icon_ether.png`)
  scene.load.image(GENERATED_ASSETS.icons.emberShard, `${BASE}icon_ember_shard.png`)
  scene.load.image(GENERATED_ASSETS.tileset, `${BASE}tileset_ember_quay_16.png`)
  scene.load.image(GENERATED_ASSETS.overworldBg, `${BASE}bg_overworld_luma_quay.png`)
  scene.load.image(GENERATED_ASSETS.battleBg, `${BASE}bg_battle_skywell.png`)
  scene.load.image(GENERATED_ASSETS.uiPanel, `${BASE}ui_panel_frame.png`)
  scene.load.image(GENERATED_ASSETS.chest, `${BASE}object_chest.png`)
}

export function hasTexture(scene: Phaser.Scene, key: string) {
  return scene.textures.exists(key)
}
