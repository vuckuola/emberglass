#!/usr/bin/env python3
"""
Generate game assets for Emberglass via 9Router cx/gpt-5.4-image.
Strategy: generate at 1024x1024 with stylized fantasy art prompts,
downscale to native game resolution with LANCZOS for smooth quality.
"""
from __future__ import annotations
import json, time, sys, urllib.request, base64, io, concurrent.futures
from pathlib import Path
from PIL import Image

ROUTER = "http://localhost:20128"
ENDPOINT = f"{ROUTER}/v1/images/generations"
MODEL = "cx/gpt-5.4-image"
OUT = Path(__file__).resolve().parents[1] / "public" / "assets" / "generated"
OUT.mkdir(parents=True, exist_ok=True)

STYLE = (
    "Stylized fantasy game illustration, Breath of Fire IV inspired, "
    "clean cel-shaded look, vibrant colors, detailed, "
    "transparent background PNG, game asset sprite"
)

# (filename, gen_size, target_w, target_h, prompt)
ASSETS = [
    # ── Heroes (single frame → composited to 4-frame sheet) ──
    ("hero_nara_frame.png", "1024x1024", 96, 144,
     f"{STYLE}. A beautiful young female protagonist with fiery auburn hair, "
     "wearing elegant white and crimson robes with gold trim, "
     "holding a small glowing ember crystal that illuminates her face. "
     "Front-facing idle stance, confident expression. "
     "Fantasy JRPG main character portrait. Warm amber and crimson palette."),

    ("hero_kael_frame.png", "1024x1024", 96, 144,
     f"{STYLE}. A handsome young male warrior with short dark hair and a scar across his brow, "
     "wearing polished steel-grey armor with a crimson cape flowing behind, "
     "holding a gleaming broadsword. "
     "Front-facing idle stance, stoic and determined. "
     "Fantasy JRPG warrior character. Cool steel and crimson palette."),

    ("hero_io_frame.png", "1024x1024", 96, 144,
     f"{STYLE}. A mysterious small child-like mage with pale silver-white hair and glowing blue eyes, "
     "wearing an oversized deep blue cloak covered in silver arcane runes, "
     "floating slightly above the ground with magical energy swirling around. "
     "Front-facing idle stance, ethereal and otherworldly. "
     "Fantasy JRPG mage character. Deep blue and silver palette."),

    # ── NPCs (unique designs per character) ──
    ("npc_guide_rin.png", "1024x1024", 96, 144,
     f"{STYLE}. A friendly young woman with teal-colored hair tied in a side ponytail, "
     "wearing a practical sky-blue traveler's tunic with leather belts and a small satchel, "
     "carrying a walking stick. "
     "Front-facing idle stance, warm smile. "
     "Fantasy JRPG NPC guide character. Teal and sky blue palette."),

    ("npc_elder_maelin.png", "1024x1024", 96, 144,
     f"{STYLE}. A wise elderly sage with a long flowing white beard and golden-brown ornate robes, "
     "wearing a glowing jade pendant, leaning on a gnarled wooden staff topped with a crystal. "
     "Front-facing idle stance, kind but knowing eyes. "
     "Fantasy JRPG elder NPC. Gold, jade green, and warm brown palette."),

    ("npc_peddler.png", "1024x1024", 96, 144,
     f"{STYLE}. A cheerful traveling merchant with a round face, round spectacles, and a wide-brimmed hat, "
     "wearing a forest green coat covered in pockets, carrying a massive overstuffed backpack. "
     "Front-facing idle stance, big grin showing he's excited to sell. "
     "Fantasy JRPG merchant NPC. Forest green and warm brown palette."),

    # ── Objects for drawMarker (game world interactive objects) ──
    ("object_signpost.png", "1024x1024", 96, 96,
     f"{STYLE}. A weathered wooden signpost with two directional signs pointing different ways, "
     "faded hand-painted text, moss growing at the base, slight magical glow on the arrows. "
     "Top-down perspective RPG overworld object."),

    ("object_tide_bell.png", "1024x1024", 96, 96,
     f"{STYLE}. An ornate bronze bell hanging from an elegant stone arch frame, "
     "faint blue magical energy ripples radiating outward, "
     "seaweed and shells decorating the base. "
     "Top-down perspective RPG overworld object."),

    ("object_mural.png", "1024x1024", 96, 96,
     f"{STYLE}. A beautiful cracked glass mosaic mural embedded in an ancient stone wall, "
     "depicting a village scene with glowing stained-glass colors in purple, gold, and blue, "
     "some pieces missing revealing darkness beneath. "
     "Top-down perspective RPG overworld object."),

    ("object_watch_lantern.png", "1024x1024", 96, 96,
     f"{STYLE}. A tall ornate iron lantern on a carved wooden post, "
     "burning with warm golden flame, light radiating outward in a soft cone, "
     "moths fluttering near the glow. "
     "Top-down perspective RPG overworld object."),

    ("object_shrine_gate.png", "1024x1024", 96, 96,
     f"{STYLE}. A mystical stone shrine gate (torii-style) covered in glowing arcane runes, "
     "faint purple magical energy crackling between the pillars, "
     "cherry blossom petals floating in the air around it. "
     "Top-down perspective RPG overworld object."),

    ("object_pilgrim_font.png", "1024x1024", 96, 96,
     f"{STYLE}. A circular ornate stone basin filled with glowing ethereal blue water, "
     "small offering candles flickering around the rim, lotus flowers floating on the surface. "
     "Top-down perspective RPG overworld object."),

    ("object_inner_seal.png", "1024x1024", 96, 96,
     f"{STYLE}. A magical seal circle carved into stone floor, "
     "glowing with purple and gold arcane geometric patterns, "
     "a brilliant gem floating and spinning slowly above the center. "
     "Top-down perspective RPG overworld object."),

    ("object_ruin_marker.png", "1024x1024", 96, 96,
     f"{STYLE}. An ancient stone obelisk covered in moss and glowing orange runes, "
     "slightly cracked but radiating warmth, surrounded by small wildflowers. "
     "Top-down perspective RPG overworld object."),

    ("object_guardian_field.png", "1024x1024", 96, 96,
     f"{STYLE}. A patch of corrupted ground with dark purple energy swirling upward, "
     "thorny twisted vines emerging from deep cracks in the earth, "
     "a faint menacing silhouette lurking in the dark mist. "
     "Top-down perspective RPG overworld object."),

    ("object_chest.png", "1024x1024", 96, 96,
     f"{STYLE}. A beautiful ornate wooden treasure chest with golden metal bands and intricate carvings, "
     "slightly open with warm golden light spilling out, jewels visible inside. "
     "Top-down perspective RPG overworld object."),

    # ── Enemies (battle sprites — bigger for impact) ──
    ("enemy_vinecrawler.png", "1024x1024", 192, 192,
     f"{STYLE}. A large terrifying plant monster made of twisting thorny vines, "
     "multiple glowing green eyes scattered across its body, "
     "massive leaf-like claws dripping with sap, roots digging deep into stone. "
     "JRPG boss enemy battle sprite, front-facing, dynamic pose."),

    ("enemy_moss_knight.png", "1024x1024", 192, 192,
     f"{STYLE}. A hulking humanoid knight encased in ancient moss-covered armor, "
     "wielding a massive rusted greatsword with green glowing runes etched into the blade, "
     "glowing green particles emanating from cracks in the armor. "
     "JRPG boss enemy battle sprite, front-facing, imposing stance."),

    ("enemy_sporefiend.png", "1024x1024", 192, 192,
     f"{STYLE}. A floating eldritch mushroom creature with three massive bioluminescent purple caps, "
     "toxic spores drifting around it in swirling patterns, "
     "three glowing yellow eyes on the main stalk, tentacle-like mycelium roots. "
     "JRPG enemy battle sprite, front-facing, eerie atmosphere."),

    ("enemy_archive_guardian.png", "1024x1024", 192, 192,
     f"{STYLE}. A colossal stone golem made of ancient stone tablets and golden magical binding, "
     "glowing blue rune eyes, a brilliant crystal core embedded in its chest pulsing with energy, "
     "floating ancient book pages orbiting around it. "
     "JRPG boss enemy battle sprite, front-facing, majestic and terrifying."),

    # ── Item Icons ──
    ("icon_potion.png", "1024x1024", 64, 64,
     f"{STYLE}. A beautiful glass vial filled with glowing red health potion, "
     "crystal stopper on top, the liquid inside swirling with magical energy. "
     "RPG item icon, clean design on transparent background, glowing aura."),

    ("icon_ether.png", "1024x1024", 64, 64,
     f"{STYLE}. A elegant crystal flask filled with luminous deep blue mana liquid, "
     "magical sparkles and stars orbiting around it. "
     "RPG item icon, clean design on transparent background, mystical glow."),

    ("icon_ember_shard.png", "1024x1024", 64, 64,
     f"{STYLE}. A beautiful jagged orange-gold ember crystal shard, "
     "glowing intensely from within like a captured flame, "
     "tiny flame particles drifting upward. "
     "RPG item icon, clean design on transparent background, warm glow."),

    # ── Tileset ──
    ("tileset_ember_quay.png", "1024x1024", 512, 512,
     f"{STYLE}. A rich fantasy terrain tileset for a magical harbor village. "
     "Seamlessly tiled grid of terrain textures including: lush grass variants, "
     "stone cobblestone paths, clear blue water with subtle reflections, "
     "wooden dock planks, flower patches, dark soil, cliff edges, stone walls. "
     "Top-down view, earthy greens, blues, browns palette. Clean tileable squares."),

    # ── Backgrounds (wider format) ──
    ("bg_overworld_luma_quay.png", "1536x1024", 960, 640,
     f"{STYLE}. A breathtaking scenic overworld background of a magical harbor village at twilight. "
     "Fishing boats gently bobbing at weathered wooden piers, warm lantern light glowing from cozy buildings, "
     "a massive glowing full moon perfectly reflected in calm water, distant misty mountains. "
     "Layered parallax depth: starry sky gradient, distant mountains, village silhouette, water foreground. "
     "Atmospheric and peaceful, warm amber and deep blue palette. Highly detailed."),

    ("bg_battle_skywell.png", "1536x1024", 960, 640,
     f"{STYLE}. A dramatic mystical battle arena background inside an ancient celestial shrine. "
     "Ornate stone floor with glowing blue rune circles and sacred geometry, "
     "massive pillars covered in moss and ancient carvings, "
     "a colossal crystal formation in the background pulsing with blue-white light, "
     "ethereal particles and motes of light floating throughout. "
     "Dramatic cinematic lighting, deep purple and gold tones. Highly detailed."),

    # ── UI Panel ──
    ("ui_panel_frame.png", "1024x1024", 640, 192,
     f"{STYLE}. An ornate fantasy RPG dialog and menu panel frame. "
     "Dark navy blue semi-transparent background with intricate golden decorative borders, "
     "elegant corner ornaments with small diamonds and filigree, "
     "subtle inner gradient, fantasy scrollwork along edges. "
     "Clean readable design suitable for text overlay. Game UI element."),
]


def generate_one(asset: tuple) -> bool:
    filename, gen_size, tw, th, prompt = asset
    out_path = OUT / filename

    payload = json.dumps({
        "model": MODEL,
        "prompt": prompt,
        "n": 1,
        "size": gen_size,
        "response_format": "b64_json"
    }).encode()

    req = urllib.request.Request(ENDPOINT, data=payload, headers={
        "Content-Type": "application/json"
    })

    print(f"  [GEN] {filename} ({gen_size} → {tw}x{th}) ...", end=" ", flush=True)
    t0 = time.time()

    try:
        with urllib.request.urlopen(req, timeout=300) as resp:
            data = json.loads(resp.read())
        b64 = data["data"][0]["b64_json"]
        img = Image.open(io.BytesIO(base64.b64decode(b64))).convert("RGBA")

        # Downscale with LANCZOS for smooth quality
        img = img.resize((tw, th), Image.LANCZOS)
        img.save(out_path, optimize=True)
        elapsed = time.time() - t0
        print(f"OK ({elapsed:.0f}s)")
        return True
    except Exception as e:
        elapsed = time.time() - t0
        print(f"FAIL ({elapsed:.0f}s): {e}")
        return False


def make_spritesheet(frame_path: str, sheet_path: str, frame_w: int, frame_h: int):
    """Create a 4-frame animation sheet from a single frame.
    Frame 0: original, 1: slight bob down, 2: original, 3: mirrored."""
    img = Image.open(frame_path).convert("RGBA")
    frames = 4
    sheet = Image.new("RGBA", (frame_w * frames, frame_h), (0, 0, 0, 0))

    for i in range(frames):
        frame = img.copy()
        if i == 1:
            # Slight shift for bob animation
            shifted = Image.new("RGBA", (frame_w, frame_h), (0, 0, 0, 0))
            shifted.paste(frame, (0, 2))
            frame = shifted
        elif i == 3:
            frame = frame.transpose(Image.FLIP_LEFT_RIGHT)
        sheet.paste(frame, (i * frame_w, 0))

    sheet.save(sheet_path, optimize=True)
    print(f"  [SHEET] {sheet_path.name} ({sheet.size[0]}x{sheet.size[1]})")


def main():
    try:
        with urllib.request.urlopen(f"{ROUTER}/v1/models", timeout=5) as r:
            models = json.loads(r.read())
        img_models = [m["id"] for m in models["data"] if "image" in m["id"].lower()]
        print(f"9Router OK — image models: {img_models}")
    except Exception as e:
        print(f"9Router not reachable: {e}")
        sys.exit(1)

    print(f"\n{'='*60}")
    print(f"Emberglass Asset Generator v2 (Fantasy Art Style)")
    print(f"Total assets: {len(ASSETS)}")
    print(f"Output: {OUT}")
    print(f"{'='*60}\n")

    success = 0
    fail = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures = {pool.submit(generate_one, a): a for a in ASSETS}
        for future in concurrent.futures.as_completed(futures):
            if future.result():
                success += 1
            else:
                fail += 1

    print(f"\n{'='*60}")
    print(f"Generated: {success} | Failed: {fail} | Total: {len(ASSETS)}")

    # Create spritesheets
    print(f"\n{'='*60}")
    print("Creating animation spritesheets...")
    hero_frames = [
        ("hero_nara_frame.png", "hero_nara_sheet.png"),
        ("hero_kael_frame.png", "hero_kael_sheet.png"),
        ("hero_io_frame.png", "hero_io_sheet.png"),
    ]
    for frame_name, sheet_name in hero_frames:
        fp = OUT / frame_name
        sp = OUT / sheet_name
        if fp.exists():
            make_spritesheet(str(fp), str(sp), 96, 144)
        else:
            print(f"  [SKIP] {frame_name} missing")

    # NPC elder sheet (backward compat)
    ep = OUT / "npc_elder_maelin.png"
    es = OUT / "npc_luma_elder_sheet.png"
    if ep.exists():
        make_spritesheet(str(ep), str(es), 96, 144)

    # Manifest
    assets_list = []
    for f in sorted(OUT.glob("*.png")):
        assets_list.append({"path": f"/assets/generated/{f.name}", "purpose": f"game asset"})
    manifest = {
        "generatedBy": "scripts/gen_pixel_assets.py",
        "style": "Stylized fantasy game art (Breath of Fire IV inspired)",
        "count": len(assets_list),
        "assets": assets_list
    }
    (OUT / "asset-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"\nManifest: {len(assets_list)} assets written")
    print("DONE!")


if __name__ == "__main__":
    main()
