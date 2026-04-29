#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "assets" / "generated"


def rgba(hex_color: str, alpha: int = 255):
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4)) + (alpha,)


def save(img: Image.Image, name: str, purpose: str, manifest: list[dict[str, str]]):
    path = OUT / name
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)
    manifest.append({"path": f"/assets/generated/{name}", "purpose": purpose})


def sprite_sheet(name: str, coat: str, hair: str, accent: str) -> Image.Image:
    frame_w, frame_h = 32, 48
    img = Image.new('RGBA', (frame_w * 4, frame_h), (0, 0, 0, 0))
    for frame in range(4):
        d = ImageDraw.Draw(img)
        x = frame * frame_w
        bob = [0, 1, 0, -1][frame]
        d.ellipse((x+9, 6+bob, x+23, 20+bob), fill=rgba('#f1c7a8'), outline=rgba('#4c2a24'))
        d.pieslice((x+7, 3+bob, x+25, 19+bob), 180, 360, fill=rgba(hair))
        d.polygon([(x+9, 21+bob), (x+23, 21+bob), (x+27, 40), (x+5, 40)], fill=rgba(coat), outline=rgba('#241927'))
        d.line((x+16, 22+bob, x+16, 39), fill=rgba(accent), width=2)
        d.rectangle((x+8, 40, x+14, 45), fill=rgba('#2a2430'))
        d.rectangle((x+18, 40, x+24, 45), fill=rgba('#2a2430'))
        if frame in (1, 3):
            d.rectangle((x+6, 27, x+10, 35), fill=rgba(accent))
            d.rectangle((x+22, 27, x+26, 35), fill=rgba('#130f17'))
        else:
            d.rectangle((x+6, 26, x+10, 34), fill=rgba('#130f17'))
            d.rectangle((x+22, 26, x+26, 34), fill=rgba(accent))
        d.line((x+21, 23, x+30, 13), fill=rgba('#f6d77a'), width=2)
        d.point((x+30, 12), fill=rgba('#fff7bf'))
    return img


def enemy_sprite(body: str, accent: str, shape: str) -> Image.Image:
    img = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
    glow = Image.new('RGBA', img.size, (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((14, 18, 82, 86), fill=rgba(accent, 80))
    img.alpha_composite(glow.filter(ImageFilter.GaussianBlur(6)))
    d = ImageDraw.Draw(img)
    if shape == 'crawler':
        d.ellipse((20, 36, 76, 72), fill=rgba(body), outline=rgba('#121014'))
        for lx in (16, 28, 58, 72): d.line((lx, 62, lx-10 if lx < 48 else lx+10, 82), fill=rgba(accent), width=4)
        d.arc((10, 8, 56, 58), 230, 330, fill=rgba(accent), width=5)
    elif shape == 'knight':
        d.polygon([(48,12),(72,32),(66,78),(30,78),(24,32)], fill=rgba(body), outline=rgba('#d8e6d5'))
        d.rectangle((37, 24, 59, 36), fill=rgba('#10171a'))
        d.line((67, 42, 86, 70), fill=rgba(accent), width=5)
    elif shape == 'fiend':
        d.ellipse((24, 26, 72, 78), fill=rgba(body), outline=rgba('#e7d6ff'))
        for cx, cy in [(31,25),(49,17),(65,29)]: d.ellipse((cx-8, cy-8, cx+8, cy+8), fill=rgba(accent))
        d.ellipse((36, 45, 43, 52), fill=rgba('#fff5b6')); d.ellipse((55,45,62,52), fill=rgba('#fff5b6'))
    else:
        d.rectangle((28, 20, 68, 76), fill=rgba(body), outline=rgba('#fbf0c8'), width=2)
        d.polygon([(28,20),(48,8),(68,20)], fill=rgba(accent))
        d.line((38, 30, 58, 66), fill=rgba('#fff6bd'), width=2)
        d.line((58, 30, 38, 66), fill=rgba('#fff6bd'), width=2)
    return img


def icon(kind: str) -> Image.Image:
    img = Image.new('RGBA', (32, 32), (0,0,0,0)); d = ImageDraw.Draw(img)
    d.rounded_rectangle((3,3,29,29), radius=6, fill=rgba('#171225',230), outline=rgba('#d7b65f'))
    if kind == 'potion':
        d.polygon([(13,8),(19,8),(18,13),(22,24),(10,24),(14,13)], fill=rgba('#f0546a'), outline=rgba('#ffd6d6'))
        d.rectangle((12,5,20,9), fill=rgba('#8be7ff'))
    elif kind == 'ether':
        d.ellipse((10,7,22,25), fill=rgba('#5a8cff'), outline=rgba('#dbe8ff'))
        d.line((16,9,16,23), fill=rgba('#ffffff'), width=2)
    else:
        d.polygon([(16,5),(25,14),(20,27),(9,25),(6,13)], fill=rgba('#ff9b3d'), outline=rgba('#fff0a8'))
        d.line((12,22,21,10), fill=rgba('#fff8d2'), width=2)
    return img


def tileset() -> Image.Image:
    img = Image.new('RGBA', (64, 16), (0,0,0,0)); d = ImageDraw.Draw(img)
    for i, base in enumerate(['#174a43', '#10282a', '#296b61', '#5a3a22']):
        x=i*16; d.rectangle((x,0,x+15,15), fill=rgba(base)); d.rectangle((x,0,x+15,15), outline=rgba('#6ee0c1',70))
        for p in range(4): d.point((x+3+p*3, 4+(i+p)%8), fill=rgba('#f7d77a',120))
    return img


def overworld_bg() -> Image.Image:
    img = Image.new('RGBA', (960,720), rgba('#071016'))
    d=ImageDraw.Draw(img)
    for y in range(720):
        col=(7,16+int(y*0.03),22+int(y*0.04),255); d.line((0,y,960,y), fill=col)
    for x in range(0,960,80): d.polygon([(x,720),(x+160,720),(x+80,420+(x%160))], fill=rgba('#0f2f35',150))
    for x in range(24,960,96): d.ellipse((x,90+(x*7)%260,x+3,93+(x*7)%260), fill=rgba('#f6d77a',180))
    return img


def battle_bg() -> Image.Image:
    img = Image.new('RGBA',(960,720),rgba('#090717')); d=ImageDraw.Draw(img)
    for y in range(720): d.line((0,y,960,y), fill=(9+int(y*.02),7+int(y*.015),23+int(y*.05),255))
    d.ellipse((-120,360,1080,860), fill=rgba('#172638'))
    for x in range(0,960,120): d.line((x,500,x+80,720), fill=rgba('#52d9ff',55), width=2)
    d.ellipse((250,250,710,690), outline=rgba('#f0c040',110), width=3)
    return img


def ui_panel() -> Image.Image:
    img=Image.new('RGBA',(320,96),(0,0,0,0)); d=ImageDraw.Draw(img)
    d.rounded_rectangle((4,4,316,92), radius=14, fill=rgba('#11142b',238), outline=rgba('#f0c040'))
    d.rounded_rectangle((10,10,310,86), radius=10, outline=rgba('#62d4ff',120), width=2)
    d.polygon([(18,18),(44,14),(34,30)], fill=rgba('#f0c040',160))
    d.polygon([(302,78),(276,82),(286,66)], fill=rgba('#f0c040',160))
    return img


def chest() -> Image.Image:
    img=Image.new('RGBA',(32,32),(0,0,0,0)); d=ImageDraw.Draw(img)
    d.rounded_rectangle((4,10,28,27), radius=3, fill=rgba('#7a4a22'), outline=rgba('#f0c040'), width=2)
    d.rectangle((4,15,28,18), fill=rgba('#2a1b17')); d.rectangle((14,14,18,21), fill=rgba('#f6d77a'))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    manifest=[]
    for name, coat, hair, accent in [('hero_nara_sheet.png','#b84a30','#2b1722','#ffcf64'),('hero_kael_sheet.png','#5e6674','#3a2b22','#d94747'),('hero_io_sheet.png','#365da8','#d9edf6','#8be7ff'),('npc_luma_elder_sheet.png','#275b74','#efe0bb','#70e0b5')]:
        save(sprite_sheet(name, coat, hair, accent), name, f"4-frame character sheet for {name.replace('_sheet.png','')}", manifest)
    for name, body, accent, shape in [('enemy_vinecrawler.png','#2d6b3e','#9be06a','crawler'),('enemy_moss_knight.png','#496255','#c6e48d','knight'),('enemy_sporefiend.png','#694d85','#e996ff','fiend'),('enemy_archive_guardian.png','#35435c','#f0c040','guardian')]:
        save(enemy_sprite(body, accent, shape), name, f"battle sprite for {name[6:-4]}", manifest)
    for kind in ['potion','ether','ember_shard']: save(icon(kind), f'icon_{kind}.png', f'item icon for {kind.replace("_"," ")}', manifest)
    save(tileset(), 'tileset_ember_quay_16.png', '16x16 overworld terrain tileset', manifest)
    save(overworld_bg(), 'bg_overworld_luma_quay.png', 'overworld parallax background layer', manifest)
    save(battle_bg(), 'bg_battle_skywell.png', 'battle arena background', manifest)
    save(ui_panel(), 'ui_panel_frame.png', 'ornate UI panel frame', manifest)
    save(chest(), 'object_chest.png', 'overworld treasure chest sprite', manifest)
    (OUT/'asset-manifest.json').write_text(json.dumps({"generatedBy":"scripts/generate_assets.py","assets":manifest}, indent=2)+"\n")

if __name__ == '__main__': main()
