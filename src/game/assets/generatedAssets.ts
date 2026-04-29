import Phaser from 'phaser'

export const GENERATED_ASSETS = {
  heroes: {
    nara: 'generated.hero.nara',
    kael: 'generated.hero.kael',
    io: 'generated.hero.io',
  },
  npcs: {
    guideRin: 'generated.npc.guideRin',
    elderMaelin: 'generated.npc.elderMaelin',
    peddler: 'generated.npc.peddler',
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
  objects: {
    signpost: 'generated.object.signpost',
    tideBell: 'generated.object.tideBell',
    mural: 'generated.object.mural',
    watchLantern: 'generated.object.watchLantern',
    shrineGate: 'generated.object.shrineGate',
    pilgrimFont: 'generated.object.pilgrimFont',
    innerSeal: 'generated.object.innerSeal',
    ruinMarker: 'generated.object.ruinMarker',
    guardianField: 'generated.object.guardianField',
    chest: 'generated.object.chest',
  },
  tileset: 'generated.tileset.emberQuay',
  overworldBg: 'generated.bg.overworld',
  battleBg: 'generated.bg.battle',
  uiPanel: 'generated.ui.panel',
  chest: 'generated.object.chest',
} as const

const BASE = import.meta.env.BASE_URL + 'assets/generated/'

export function preloadGeneratedAssets(scene: Phaser.Scene) {
  // Hero spritesheets: 384x144, frameWidth:96, frameHeight:144
  scene.load.spritesheet(GENERATED_ASSETS.heroes.nara, `${BASE}hero_nara_sheet.png`, { frameWidth: 96, frameHeight: 144 })
  scene.load.spritesheet(GENERATED_ASSETS.heroes.kael, `${BASE}hero_kael_sheet.png`, { frameWidth: 96, frameHeight: 144 })
  scene.load.spritesheet(GENERATED_ASSETS.heroes.io, `${BASE}hero_io_sheet.png`, { frameWidth: 96, frameHeight: 144 })

  // Unique NPC images (single frame 96x144)
  scene.load.image(GENERATED_ASSETS.npcs.guideRin, `${BASE}npc_guide_rin.png`)
  scene.load.image(GENERATED_ASSETS.npcs.elderMaelin, `${BASE}npc_elder_maelin.png`)
  scene.load.image(GENERATED_ASSETS.npcs.peddler, `${BASE}npc_peddler.png`)

  // NPC spritesheet (backward compat): 384x144, frameWidth:96, frameHeight:144
  scene.load.spritesheet(GENERATED_ASSETS.npc, `${BASE}npc_luma_elder_sheet.png`, { frameWidth: 96, frameHeight: 144 })

  // Enemies (192x192)
  scene.load.image(GENERATED_ASSETS.enemies.vinecrawler, `${BASE}enemy_vinecrawler.png`)
  scene.load.image(GENERATED_ASSETS.enemies.moss_knight, `${BASE}enemy_moss_knight.png`)
  scene.load.image(GENERATED_ASSETS.enemies.sporefiend, `${BASE}enemy_sporefiend.png`)
  scene.load.image(GENERATED_ASSETS.enemies.archive_guardian, `${BASE}enemy_archive_guardian.png`)

  // Object sprites (96x96)
  scene.load.image(GENERATED_ASSETS.objects.signpost, `${BASE}object_signpost.png`)
  scene.load.image(GENERATED_ASSETS.objects.tideBell, `${BASE}object_tide_bell.png`)
  scene.load.image(GENERATED_ASSETS.objects.mural, `${BASE}object_mural.png`)
  scene.load.image(GENERATED_ASSETS.objects.watchLantern, `${BASE}object_watch_lantern.png`)
  scene.load.image(GENERATED_ASSETS.objects.shrineGate, `${BASE}object_shrine_gate.png`)
  scene.load.image(GENERATED_ASSETS.objects.pilgrimFont, `${BASE}object_pilgrim_font.png`)
  scene.load.image(GENERATED_ASSETS.objects.innerSeal, `${BASE}object_inner_seal.png`)
  scene.load.image(GENERATED_ASSETS.objects.ruinMarker, `${BASE}object_ruin_marker.png`)
  scene.load.image(GENERATED_ASSETS.objects.guardianField, `${BASE}object_guardian_field.png`)
  scene.load.image(GENERATED_ASSETS.objects.chest, `${BASE}object_chest.png`)

  // Icons (64x64)
  scene.load.image(GENERATED_ASSETS.icons.potion, `${BASE}icon_potion.png`)
  scene.load.image(GENERATED_ASSETS.icons.ether, `${BASE}icon_ether.png`)
  scene.load.image(GENERATED_ASSETS.icons.emberShard, `${BASE}icon_ember_shard.png`)

  // Tileset (512x512)
  scene.load.image(GENERATED_ASSETS.tileset, `${BASE}tileset_ember_quay.png`)

  // Backgrounds (960x640)
  scene.load.image(GENERATED_ASSETS.overworldBg, `${BASE}bg_overworld_luma_quay.png`)
  scene.load.image(GENERATED_ASSETS.battleBg, `${BASE}bg_battle_skywell.png`)

  // UI (640x192)
  scene.load.image(GENERATED_ASSETS.uiPanel, `${BASE}ui_panel_frame.png`)
}

export function hasTexture(scene: Phaser.Scene, key: string) {
  return scene.textures.exists(key)
}
