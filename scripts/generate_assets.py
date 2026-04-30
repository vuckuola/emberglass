#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "generated"

PALETTE = {
    "ink": "#17131f",
    "deep": "#23243a",
    "shadow": "#342537",
    "water0": "#1f5f7a",
    "water1": "#2e8baa",
    "water2": "#7bd6d1",
    "grass0": "#2d6641",
    "grass1": "#3f8a4c",
    "grass2": "#7bbd65",
    "path0": "#8a6b45",
    "path1": "#b18a58",
    "stone0": "#5b5360",
    "stone1": "#8b8490",
    "ember": "#d9823b",
    "gold": "#e9c46a",
    "cream": "#f2d6a2",
    "skin": "#d89b6d",
    "skin_hi": "#efc08b",
    "red": "#a7483f",
    "blue": "#426aa8",
    "teal": "#58b7a4",
    "violet": "#6b547d",
}

EXPECTED = {
    "hero_nara_sheet.png": (384, 576),
    "hero_kael_sheet.png": (384, 576),
    "hero_io_sheet.png": (384, 576),
    "npc_luma_elder_sheet.png": (384, 576),
    "npc_guide_rin.png": (192, 144),
    "npc_elder_maelin.png": (192, 144),
    "npc_peddler.png": (192, 144),
    "enemy_vinecrawler.png": (192, 192),
    "enemy_moss_knight.png": (192, 192),
    "enemy_sporefiend.png": (192, 192),
    "enemy_archive_guardian.png": (192, 192),
    "icon_potion.png": (64, 64),
    "icon_ether.png": (64, 64),
    "icon_ember_shard.png": (64, 64),
    "object_signpost.png": (96, 96),
    "object_tide_bell.png": (96, 96),
    "object_mural.png": (96, 96),
    "object_watch_lantern.png": (96, 96),
    "object_shrine_gate.png": (96, 96),
    "object_pilgrim_font.png": (96, 96),
    "object_inner_seal.png": (96, 96),
    "object_ruin_marker.png": (96, 96),
    "object_guardian_field.png": (96, 96),
    "object_chest.png": (96, 96),
    "tileset_ember_quay.png": (512, 512),
    "tileset_ember_quay_16.png": (64, 16),
    "bg_overworld_luma_quay.png": (960, 640),
    "bg_battle_skywell.png": (960, 640),
    "ui_panel_frame.png": (640, 192),
}


def c(name: str, alpha: int = 255):
    value = PALETTE.get(name, name).lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def save(img: Image.Image, name: str, purpose: str, manifest: list[dict[str, str]]):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    manifest.append({"path": f"/assets/generated/{name}", "purpose": purpose})


def pix_rect(d: ImageDraw.ImageDraw, x: int, y: int, w: int, h: int, fill: str, scale: int = 3):
    d.rectangle((x * scale, y * scale, (x + w) * scale - 1, (y + h) * scale - 1), fill=c(fill))


def draw_character_frame(sheet: Image.Image, col: int, row: int, coat: str, hair: str, accent: str, phase: int, elder: bool = False):
    scale, fw, fh = 3, 96, 144
    ox, oy = col * fw, row * fh
    d = ImageDraw.Draw(sheet)
    bob = [0, 1, 0, -1][phase]
    step = -2 if phase == 1 else 2 if phase == 3 else 0
    cx, base = ox // scale + 16, oy // scale + 42
    # coordinates are in 32x48 space then scaled by drawing helper with local translation
    def r(x, y, w, h, color): pix_rect(d, ox // scale + x, oy // scale + y + bob, w, h, color, scale)
    # shadow stays transparent sprite-local; scene shadow supplies grounding
    r(11, 8, 10, 9, "skin")
    r(12, 9, 8, 3, "skin_hi")
    if row == 0:  # down
        r(9, 5, 14, 6, hair); r(8, 9, 4, 7, hair); r(20, 9, 4, 7, hair)
        r(13, 13, 2, 2, "ink"); r(18, 13, 2, 2, "ink")
    elif row == 1:  # left
        r(8, 6, 13, 9, hair); r(19, 10, 4, 6, hair); r(12, 13, 2, 2, "ink")
    elif row == 2:  # right
        r(11, 6, 13, 9, hair); r(8, 10, 4, 6, hair); r(19, 13, 2, 2, "ink")
    else:  # up
        r(8, 5, 16, 12, hair)
    r(9, 18, 14, 16, coat)
    r(11, 19, 10, 3, accent)
    r(15, 21, 2, 12, "gold" if elder else accent)
    r(5, 21 + (1 if phase == 1 else 0), 5, 11, coat)
    r(22, 21 + (1 if phase == 3 else 0), 5, 11, coat)
    r(10, 34, 5, 9 + max(0, step), "deep")
    r(18, 34, 5, 9 + max(0, -step), "deep")
    r(9, 42, 6, 2, "ink"); r(18, 42, 6, 2, "ink")
    if elder:
        r(13, 15, 7, 5, "cream")


def character_sheet(coat: str, hair: str, accent: str, rows: int = 4, elder: bool = False) -> Image.Image:
    img = Image.new("RGBA", (96 * 4, 144 * rows), (0, 0, 0, 0))
    for row in range(rows):
        for col in range(4):
            draw_character_frame(img, col, row, coat, hair, accent, col, elder)
    return img


def npc_sheet(coat: str, hair: str, accent: str, elder: bool = False) -> Image.Image:
    img = Image.new("RGBA", (192, 144), (0, 0, 0, 0))
    full = character_sheet(coat, hair, accent, elder=elder)
    img.alpha_composite(full.crop((0, 0, 96, 144)), (0, 0))
    img.alpha_composite(full.crop((96, 0, 192, 144)), (96, 0))
    return img


def enemy(kind: str) -> Image.Image:
    img = Image.new("RGBA", (192, 192), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse((34, 126, 158, 154), fill=c("ink", 90))
    if kind == "crawler":
        d.ellipse((42, 70, 150, 132), fill=c("grass0"), outline=c("ink"), width=6)
        for x in (46, 70, 120, 146): d.line((x, 116, x + (-28 if x < 96 else 28), 154), fill=c("grass2"), width=8)
        d.arc((36, 36, 118, 112), 220, 335, fill=c("gold"), width=8)
    elif kind == "knight":
        d.polygon([(96, 24), (142, 62), (130, 144), (62, 144), (50, 62)], fill=c("stone0"), outline=c("cream"))
        d.rectangle((72, 58, 120, 76), fill=c("ink")); d.line((132, 82, 164, 136), fill=c("ember"), width=10)
    elif kind == "fiend":
        d.ellipse((52, 54, 140, 146), fill=c("violet"), outline=c("cream"), width=4)
        for x, y in ((58, 52), (96, 34), (134, 56)): d.ellipse((x-18, y-18, x+18, y+18), fill=c("teal"), outline=c("ink"))
        d.rectangle((76, 88, 88, 100), fill=c("cream")); d.rectangle((106, 88, 118, 100), fill=c("cream"))
    else:
        d.rectangle((58, 38, 134, 148), fill=c("deep"), outline=c("cream"), width=5)
        d.polygon([(58, 38), (96, 16), (134, 38)], fill=c("gold"))
        d.line((72, 58, 120, 128), fill=c("water2"), width=5); d.line((120, 58, 72, 128), fill=c("water2"), width=5)
    return img


def icon(kind: str) -> Image.Image:
    img = Image.new("RGBA", (64, 64), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle((6, 6, 58, 58), radius=10, fill=c("deep"), outline=c("gold"), width=3)
    if kind == "potion":
        d.polygon([(26, 16), (38, 16), (36, 26), (46, 50), (18, 50), (28, 26)], fill=c("red"), outline=c("cream")); d.rectangle((24, 10, 40, 18), fill=c("water2"))
    elif kind == "ether":
        d.ellipse((20, 12, 44, 52), fill=c("blue"), outline=c("cream")); d.line((32, 16, 32, 48), fill=c("water2"), width=4)
    else:
        d.polygon([(32, 10), (50, 28), (42, 54), (20, 50), (12, 26)], fill=c("ember"), outline=c("cream")); d.line((24, 44, 42, 20), fill=c("gold"), width=4)
    return img


def object_sprite(kind: str) -> Image.Image:
    img = Image.new("RGBA", (96, 96), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.ellipse((18, 70, 78, 84), fill=c("ink", 90))
    if kind == "chest":
        d.rounded_rectangle((22, 42, 74, 72), radius=5, fill=c("path0"), outline=c("gold"), width=4); d.rectangle((22, 52, 74, 58), fill=c("ink")); d.rectangle((44, 48, 52, 64), fill=c("gold"))
    elif kind == "signpost":
        d.rectangle((44, 30, 52, 74), fill=c("path0")); d.polygon([(18, 26), (68, 22), (80, 38), (28, 42)], fill=c("path1"), outline=c("ink")); d.line((32, 34, 62, 31), fill=c("gold"), width=2)
    elif kind == "tide_bell":
        d.arc((22, 18, 74, 82), 200, 340, fill=c("stone1"), width=5); d.pieslice((30, 34, 66, 76), 180, 360, fill=c("gold"), outline=c("ink")); d.ellipse((44, 66, 52, 74), fill=c("ember"))
    elif kind == "mural":
        d.rectangle((18, 22, 78, 76), fill=c("stone0"), outline=c("cream"), width=3); d.polygon([(28, 64), (48, 30), (68, 64)], fill=c("water1")); d.line((30, 38, 66, 58), fill=c("gold"), width=3)
    elif kind == "watch_lantern":
        d.rectangle((44, 26, 52, 76), fill=c("stone0")); d.rectangle((32, 20, 64, 48), fill=c("deep"), outline=c("gold")); d.rectangle((40, 28, 56, 44), fill=c("ember"))
    elif kind == "shrine_gate":
        d.rectangle((18, 24, 30, 78), fill=c("stone0")); d.rectangle((66, 24, 78, 78), fill=c("stone0")); d.rectangle((18, 18, 78, 30), fill=c("stone1")); d.polygon([(48, 30), (60, 54), (48, 78), (36, 54)], fill=c("water2", 140))
    elif kind == "pilgrim_font":
        d.rectangle((36, 48, 60, 74), fill=c("stone0")); d.ellipse((26, 34, 70, 54), fill=c("stone1"), outline=c("cream")); d.ellipse((34, 38, 62, 48), fill=c("water2"))
    elif kind == "inner_seal":
        d.ellipse((20, 20, 76, 76), fill=c("deep"), outline=c("gold"), width=4); d.polygon([(48, 26), (66, 48), (48, 70), (30, 48)], outline=c("water2"))
    elif kind == "ruin_marker":
        d.rectangle((32, 22, 64, 76), fill=c("stone0"), outline=c("cream")); d.line((40, 36, 56, 60), fill=c("gold"), width=3); d.line((56, 36, 40, 60), fill=c("gold"), width=3)
    else:
        d.ellipse((20, 24, 76, 76), fill=c("deep"), outline=c("ember"), width=4); d.polygon([(48, 30), (66, 48), (48, 66), (30, 48)], fill=c("grass2"))
    return img


def tile16(kind: str) -> Image.Image:
    img = Image.new("RGBA", (16, 16), c("grass0")); d = ImageDraw.Draw(img)
    if kind == "grass":
        d.rectangle((0, 0, 15, 15), fill=c("grass1"));
        for x, y in ((2, 5), (7, 2), (11, 10), (4, 13)): d.point((x, y), fill=c("grass2"))
    elif kind == "path":
        d.rectangle((0, 0, 15, 15), fill=c("path1"));
        for x, y in ((3, 4), (9, 7), (13, 12)): d.rectangle((x, y, x+2, y+1), fill=c("path0"))
    elif kind == "water":
        d.rectangle((0, 0, 15, 15), fill=c("water0")); d.line((1, 5, 14, 3), fill=c("water2")); d.line((2, 12, 12, 10), fill=c("water1"))
    else:
        d.rectangle((0, 0, 15, 15), fill=c("stone0")); d.rectangle((0, 0, 15, 4), fill=c("stone1")); d.line((2, 9, 13, 9), fill=c("shadow")); d.line((8, 5, 8, 15), fill=c("shadow"))
    return img


def tilesets():
    kinds = ["grass", "path", "water", "wall"]
    small = Image.new("RGBA", (64, 16), (0, 0, 0, 0))
    large = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    for i, kind in enumerate(kinds):
        t = tile16(kind)
        small.alpha_composite(t, (i * 16, 0))
        big = t.resize((48, 48), Image.Resampling.NEAREST)
        large.alpha_composite(big, ((i % 8) * 64, (i // 8) * 64))
    return small, large


def bg(kind: str) -> Image.Image:
    img = Image.new("RGBA", (960, 640), c("ink")); d = ImageDraw.Draw(img)
    for y in range(640):
        if kind == "overworld":
            d.line((0, y, 960, y), fill=(23, 19 + y // 40, 31 + y // 20, 255))
        else:
            d.line((0, y, 960, y), fill=(18 + y // 60, 15, 32 + y // 14, 255))
    if kind == "overworld":
        for x in range(-80, 960, 140): d.polygon([(x, 640), (x+220, 640), (x+110, 350 + (x % 90))], fill=c("water0", 125))
        d.rectangle((0, 500, 960, 640), fill=c("grass0", 155))
    else:
        d.ellipse((-100, 360, 1060, 760), fill=c("deep")); d.ellipse((250, 210, 710, 670), outline=c("gold", 120), width=5)
    return img


def ui_panel() -> Image.Image:
    img = Image.new("RGBA", (640, 192), (0, 0, 0, 0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle((8, 8, 632, 184), radius=20, fill=c("deep", 238), outline=c("gold"), width=4)
    d.rounded_rectangle((24, 24, 616, 168), radius=14, outline=c("water2", 130), width=3)
    return img


def generate():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest: list[dict[str, str]] = []
    for name, coat, hair, accent, elder in [
        ("hero_nara_sheet.png", "red", "shadow", "gold", False),
        ("hero_kael_sheet.png", "stone0", "path0", "ember", False),
        ("hero_io_sheet.png", "blue", "cream", "water2", False),
        ("npc_luma_elder_sheet.png", "water0", "cream", "teal", True),
    ]:
        save(character_sheet(coat, hair, accent, elder=elder), name, "4-direction 4-frame overworld character spritesheet", manifest)
    for name, coat, hair, accent, elder in [
        ("npc_guide_rin.png", "teal", "shadow", "gold", False),
        ("npc_elder_maelin.png", "water0", "cream", "teal", True),
        ("npc_peddler.png", "path0", "ink", "ember", False),
    ]:
        save(npc_sheet(coat, hair, accent, elder), name, "2-frame idle NPC spritesheet", manifest)
    for filename, kind in [("enemy_vinecrawler.png", "crawler"), ("enemy_moss_knight.png", "knight"), ("enemy_sporefiend.png", "fiend"), ("enemy_archive_guardian.png", "guardian")]:
        save(enemy(kind), filename, "battle enemy pixel sprite", manifest)
    for kind in ["potion", "ether", "ember_shard"]: save(icon(kind), f"icon_{kind}.png", "item icon", manifest)
    for filename, kind in [("object_signpost.png", "signpost"), ("object_tide_bell.png", "tide_bell"), ("object_mural.png", "mural"), ("object_watch_lantern.png", "watch_lantern"), ("object_shrine_gate.png", "shrine_gate"), ("object_pilgrim_font.png", "pilgrim_font"), ("object_inner_seal.png", "inner_seal"), ("object_ruin_marker.png", "ruin_marker"), ("object_guardian_field.png", "guardian_field"), ("object_chest.png", "chest")]:
        save(object_sprite(kind), filename, "overworld object pixel sprite", manifest)
    small, large = tilesets(); save(large, "tileset_ember_quay.png", "512px overworld stage tileset", manifest); save(small, "tileset_ember_quay_16.png", "16px source overworld terrain tiles", manifest)
    save(bg("overworld"), "bg_overworld_luma_quay.png", "overworld parallax backdrop", manifest); save(bg("battle"), "bg_battle_skywell.png", "battle arena backdrop", manifest); save(ui_panel(), "ui_panel_frame.png", "JRPG UI panel frame", manifest)
    (OUT / "asset-manifest.json").write_text(json.dumps({"generatedBy": "scripts/generate_assets.py", "palette": PALETTE, "assets": manifest}, indent=2) + "\n")


def validate() -> None:
    missing: list[str] = []
    wrong: list[str] = []
    for name, size in EXPECTED.items():
        path = OUT / name
        if not path.exists():
            missing.append(name); continue
        with Image.open(path) as img:
            if img.size != size:
                wrong.append(f"{name}: expected {size}, got {img.size}")
    if missing or wrong:
        raise SystemExit("Asset validation failed\n" + "\n".join([*(f"missing: {m}" for m in missing), *wrong]))
    print(f"Asset validation passed: {len(EXPECTED)} files")


def main():
    parser = argparse.ArgumentParser(description="Generate deterministic Emberglass pixel assets")
    parser.add_argument("--validate", action="store_true", help="validate generated file existence and dimensions")
    args = parser.parse_args()
    generate()
    if args.validate:
        validate()


if __name__ == "__main__":
    main()
