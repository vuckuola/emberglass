#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parents[1] / 'public' / 'assets' / 'generated'
OUT.mkdir(parents=True, exist_ok=True)

S = Image.Resampling.NEAREST
T = (0, 0, 0, 0)
INK = (24, 22, 26, 255)
DEEP = (35, 32, 43, 255)
SHADOW = (47, 43, 48, 255)
WHITE = (238, 232, 203, 255)
SKIN = (205, 144, 98, 255)
SKIN_HI = (240, 181, 124, 255)
SKIN_SH = (129, 78, 62, 255)
GOLD = (247, 195, 86, 255)
EMBER = (232, 91, 45, 255)
AMBER = (183, 87, 38, 255)
BROWN = (103, 62, 42, 255)
BROWN2 = (154, 93, 52, 255)
GREEN = (70, 135, 76, 255)
GREEN_HI = (131, 184, 91, 255)
GREEN_SH = (42, 86, 57, 255)
TEAL = (48, 160, 143, 255)
TEAL_HI = (113, 210, 187, 255)
BLUE = (54, 127, 186, 255)
BLUE_HI = (122, 213, 238, 255)
BLUE_SH = (34, 67, 117, 255)
PURPLE = (124, 74, 160, 255)
PURPLE_HI = (193, 124, 218, 255)
PURPLE_SH = (67, 44, 95, 255)
STONE = (103, 113, 119, 255)
STONE_HI = (165, 180, 181, 255)
STONE_SH = (59, 68, 76, 255)
MOSS = (91, 125, 63, 255)
RED = (169, 57, 54, 255)
PINK = (219, 103, 121, 255)


def img(w, h):
    return Image.new('RGBA', (w, h), T)


def draw_pixel_outline(draw, shape_points, color, outline_color=INK):
    if isinstance(shape_points, tuple):
        draw.rectangle((shape_points[0]-1, shape_points[1]-1, shape_points[2]+1, shape_points[3]+1), fill=outline_color)
        draw.rectangle(shape_points, fill=color)
    else:
        draw.polygon(shape_points, fill=outline_color)
        cx = sum(x for x, _ in shape_points) / len(shape_points)
        cy = sum(y for _, y in shape_points) / len(shape_points)
        inner = []
        for x, y in shape_points:
            nx = x + (1 if x < cx else -1 if x > cx else 0)
            ny = y + (1 if y < cy else -1 if y > cy else 0)
            inner.append((nx, ny))
        draw.polygon(inner, fill=color)


def add_highlight(im, region, highlight_color, opacity=255):
    d = ImageDraw.Draw(im)
    x0, y0, x1, y1 = region
    col = (*highlight_color[:3], opacity)
    d.line((x0, y0, x1, y0), fill=col, width=2)
    d.line((x0, y0, x0, y1), fill=col, width=2)


def scale2(base):
    return base.resize((base.width * 2, base.height * 2), S)


def humanoid_frame(pal, direction, step=0, elder=False, staff=False, pack=False, wave=False):
    b = img(48, 72); d = ImageDraw.Draw(b)
    dx = [0, -2, 0, 2][step % 4]
    leg = [0, -2, 1, 2][step % 4]
    cloak, cloak_hi, cloak_sh, hair, accent = pal
    d.ellipse((12, 58, 36, 66), fill=(0, 0, 0, 85))
    # legs / boots
    d.rectangle((17+dx, 49, 22+dx, 62+leg), fill=INK)
    d.rectangle((27+dx, 49, 32+dx, 62-leg), fill=INK)
    d.rectangle((15+dx, 61+leg, 23+dx, 65+leg), fill=DEEP)
    d.rectangle((26+dx, 61-leg, 34+dx, 65-leg), fill=DEEP)
    # body/cloak
    body = [(16+dx, 26), (32+dx, 26), (38+dx, 58), (10+dx, 58)] if not elder else [(15+dx, 25),(33+dx,25),(36+dx,59),(12+dx,59)]
    draw_pixel_outline(d, body, cloak)
    d.line((19+dx, 28, 14+dx, 56), fill=cloak_hi, width=2)
    d.line((31+dx, 29, 36+dx, 57), fill=cloak_sh, width=2)
    d.rectangle((18+dx, 40, 30+dx, 43), fill=BROWN, outline=INK)
    d.rectangle((23+dx, 39, 26+dx, 44), fill=GOLD)
    if direction == 'up':
        d.rectangle((18+dx, 17, 30+dx, 34), fill=hair, outline=INK)
        d.polygon([(15+dx, 24), (33+dx, 24), (30+dx, 41), (18+dx, 41)], fill=cloak_sh)
    else:
        d.ellipse((15+dx, 12, 33+dx, 30), fill=INK)
        d.ellipse((17+dx, 14, 31+dx, 29), fill=SKIN)
        if direction in ('down', 'left', 'right'):
            d.rectangle((17+dx, 12, 31+dx, 18), fill=hair)
            d.rectangle((15+dx, 17, 19+dx, 27), fill=hair)
        if direction == 'down':
            d.rectangle((20+dx, 21, 22+dx, 23), fill=WHITE); d.point((21+dx,22), fill=INK)
            d.rectangle((27+dx, 21, 29+dx, 23), fill=WHITE); d.point((28+dx,22), fill=INK)
        elif direction == 'left':
            d.rectangle((18+dx, 21, 20+dx, 23), fill=WHITE); d.point((18+dx,22), fill=INK)
        else:
            d.rectangle((28+dx, 21, 30+dx, 23), fill=WHITE); d.point((30+dx,22), fill=INK)
        d.rectangle((20+dx, 29, 29+dx, 31), fill=SKIN_SH)
    # arms/details
    leftarm_y = 35 + (4 if step == 1 else -2 if step == 3 else 0)
    rightarm_y = 35 + (-2 if step == 1 else 4 if step == 3 else 0)
    d.rectangle((9+dx, 31, 14+dx, leftarm_y+11), fill=cloak_sh, outline=INK)
    d.rectangle((34+dx, 31, 39+dx, rightarm_y+11), fill=cloak_hi if wave else cloak_sh, outline=INK)
    if wave:
        d.rectangle((35+dx, 22, 40+dx, 35), fill=cloak_hi, outline=INK); d.ellipse((35+dx,18,41+dx,24), fill=SKIN, outline=INK)
    if staff:
        sx = 39 + dx
        d.rectangle((sx, 13, sx+2, 62), fill=BROWN2)
        d.ellipse((sx-3, 8, sx+5, 16), fill=accent, outline=INK)
        d.point((sx+1, 11), fill=WHITE)
    if pack:
        d.rectangle((7+dx, 30, 15+dx, 53), fill=BROWN2, outline=INK)
        d.line((9+dx, 34, 13+dx, 50), fill=GOLD, width=1)
    if elder:
        d.rectangle((20+dx, 28, 29+dx, 43), fill=WHITE)
    d.rectangle((22+dx, 33, 27+dx, 38), fill=accent, outline=INK)
    d.point((24+dx, 35), fill=WHITE)
    return scale2(b)


def hero_sheet(pal):
    sheet = img(384, 576)
    for row, direction in enumerate(['down', 'left', 'right', 'up']):
        for col in range(4):
            sheet.alpha_composite(humanoid_frame(pal, direction, col), (col*96, row*144))
    return sheet


def generate_hero_nara(): return hero_sheet((AMBER, GOLD, BROWN, (92, 45, 30, 255), EMBER))
def generate_hero_kael(): return hero_sheet((GREEN_SH, GREEN_HI, BROWN, (54, 42, 35, 255), BLUE_HI))
def generate_hero_io(): return hero_sheet(((212, 231, 232, 255), WHITE, BLUE_SH, (197, 221, 229, 255), GOLD))


def npc_sheet(pal, elder=False, staff=False, pack=False):
    out = img(192, 144)
    out.alpha_composite(humanoid_frame(pal, 'down', 0, elder, staff, pack, False), (0, 0))
    out.alpha_composite(humanoid_frame(pal, 'down', 2, elder, staff, pack, True), (96, 0))
    return out

def generate_npc_guide_rin(): return npc_sheet((TEAL, TEAL_HI, GREEN_SH, (32, 92, 84, 255), GOLD), staff=True)
def generate_npc_elder_maelin(): return npc_sheet((STONE_HI, WHITE, STONE, WHITE, BLUE_HI), elder=True, staff=True)
def generate_npc_peddler(): return npc_sheet((BROWN2, GOLD, BROWN, (80, 49, 33, 255), TEAL_HI), pack=True)
def generate_npc_luma_elder(): return hero_sheet((STONE_HI, WHITE, STONE, WHITE, BLUE_HI))


def enemy_canvas():
    im = img(192, 192); ImageDraw.Draw(im).ellipse((38, 152, 154, 172), fill=(0,0,0,80)); return im

def generate_enemy_vinecrawler():
    im=enemy_canvas(); d=ImageDraw.Draw(im)
    for pts in [[(36,118),(14,132),(26,148),(58,132)],[(136,112),(174,126),(164,146),(128,132)],[(82,126),(60,160),(78,166),(100,132)]]:
        d.line(pts, fill=INK, width=12); d.line(pts, fill=GREEN_SH, width=8); d.line(pts[:2], fill=GREEN_HI, width=2)
    d.ellipse((42,58,152,136), fill=INK); d.ellipse((48,64,146,132), fill=GREEN)
    d.polygon([(56,74),(92,48),(140,74),(130,126),(64,132)], fill=GREEN_SH, outline=INK)
    for x,y in [(70,86),(96,76),(124,92),(88,108)]: d.ellipse((x-8,y-6,x+8,y+6), fill=WHITE, outline=INK); d.point((x,y), fill=EMBER)
    for x,y in [(54,60),(138,64),(118,128),(68,126)]: d.polygon([(x,y),(x+6,y-12),(x+12,y)], fill=GOLD, outline=INK)
    add_highlight(im,(54,66,125,68),GREEN_HI); d.line((132,92,142,124), fill=GREEN_SH, width=5); return im

def generate_enemy_moss_knight():
    im=enemy_canvas(); d=ImageDraw.Draw(im)
    d.rectangle((72,34,122,74), fill=STONE_SH, outline=INK, width=4); d.rectangle((56,68,136,140), fill=STONE, outline=INK, width=5)
    d.rectangle((42,74,62,128), fill=MOSS, outline=INK, width=3); d.rectangle((130,72,150,128), fill=MOSS, outline=INK, width=3)
    d.rectangle((66,138,86,166), fill=STONE_SH, outline=INK, width=3); d.rectangle((108,138,128,166), fill=STONE_SH, outline=INK, width=3)
    d.rectangle((36,82,70,130), fill=GREEN_SH, outline=INK, width=4); d.line((142,74,166,138), fill=BROWN, width=10); d.line((142,74,166,138), fill=GOLD, width=2)
    d.rectangle((86,52,108,60), fill=INK); d.point((92,56), fill=BLUE_HI); d.point((102,56), fill=BLUE_HI)
    for x,y in [(62,66),(116,76),(78,118),(128,104)]: d.rectangle((x,y,x+12,y+5), fill=GREEN_HI)
    add_highlight(im,(58,70,112,70),STONE_HI); d.line((128,90,132,136), fill=STONE_SH, width=4); return im

def generate_enemy_sporefiend():
    im=enemy_canvas(); d=ImageDraw.Draw(im)
    d.rectangle((76,88,116,150), fill=GREEN_SH, outline=INK, width=4); d.ellipse((38,42,154,102), fill=INK); d.ellipse((44,46,148,98), fill=PURPLE)
    for spot in [(66,58,84,72),(104,52,126,68),(126,76,140,88)]: d.ellipse(spot, fill=PURPLE_HI, outline=PURPLE_SH)
    d.rectangle((84,102,90,108), fill=WHITE); d.rectangle((104,102,110,108), fill=WHITE); d.point((87,105), fill=INK); d.point((107,105), fill=INK)
    d.arc((86,116,110,130), 0, 180, fill=INK, width=2)
    for x,y in [(44,120),(146,116),(58,36),(136,34),(96,30)]: d.ellipse((x-4,y-4,x+4,y+4), fill=TEAL_HI, outline=INK)
    d.line((56,96,40,132), fill=GREEN, width=7); d.line((136,94,156,126), fill=GREEN, width=7)
    add_highlight(im,(50,50,118,50),PURPLE_HI); d.line((116,104,118,146), fill=GREEN_SH, width=4); return im

def generate_enemy_archive_guardian():
    im=enemy_canvas(); d=ImageDraw.Draw(im)
    d.polygon([(96,18),(132,48),(122,82),(70,82),(60,48)], fill=STONE, outline=INK)
    d.rectangle((56,78,136,142), fill=STONE_SH, outline=INK, width=5); d.polygon([(96,82),(120,106),(96,132),(72,106)], fill=BLUE, outline=INK)
    d.rectangle((34,86,56,132), fill=STONE, outline=INK, width=4); d.rectangle((136,86,158,132), fill=STONE, outline=INK, width=4)
    d.rectangle((62,142,84,166), fill=STONE, outline=INK, width=4); d.rectangle((108,142,130,166), fill=STONE, outline=INK, width=4)
    d.line((72,52,120,52), fill=INK, width=5); d.point((84,52), fill=BLUE_HI); d.point((108,52), fill=BLUE_HI)
    d.line((76,92,116,126), fill=BLUE_HI, width=3); d.line((116,92,76,126), fill=BLUE_HI, width=3)
    add_highlight(im,(62,48,122,48),STONE_HI); d.line((126,86,132,138), fill=DEEP, width=4); return im


def make_icon(kind):
    im=img(64,64); d=ImageDraw.Draw(im); d.rounded_rectangle((5,5,58,58), radius=8, fill=DEEP, outline=GOLD, width=3)
    if kind=='potion': d.polygon([(27,14),(38,14),(36,24),(47,51),(18,51),(29,24)], fill=PINK, outline=INK); d.rectangle((25,9,40,16), fill=BLUE_HI, outline=INK)
    elif kind=='ether': d.ellipse((19,12,45,52), fill=BLUE, outline=INK, width=2); d.line((32,16,32,48), fill=BLUE_HI, width=4); d.point((27,23), fill=WHITE)
    else: d.polygon([(32,8),(51,28),(42,55),(19,51),(11,26)], fill=EMBER, outline=INK); d.line((24,44,42,18), fill=GOLD, width=4); d.point((32,25), fill=WHITE)
    add_highlight(im,(8,8,52,8),WHITE,180); return im


def object_sprite(kind):
    im=img(96,96); d=ImageDraw.Draw(im); d.ellipse((16,72,80,86), fill=(0,0,0,75))
    if kind=='chest': d.rounded_rectangle((20,39,76,73), radius=5, fill=BROWN2, outline=INK, width=3); d.rectangle((20,51,76,58), fill=BROWN); d.rectangle((43,47,53,65), fill=GOLD, outline=INK); add_highlight(im,(23,42,72,42),GOLD)
    elif kind=='signpost': d.rectangle((44,28,53,76), fill=BROWN, outline=INK); d.polygon([(16,22),(70,19),(82,35),(28,40)], fill=BROWN2, outline=INK); d.line((30,31,64,28), fill=GOLD, width=2)
    elif kind=='tide_bell': d.arc((20,16,76,82),200,340,fill=STONE_HI,width=5); d.pieslice((30,34,66,76),180,360,fill=GOLD,outline=INK); d.line((34,43,62,43), fill=WHITE, width=2)
    elif kind=='mural': d.rectangle((17,20,79,78), fill=STONE, outline=INK, width=3); d.polygon([(28,64),(48,28),(68,64)], fill=BLUE); d.line((30,38,66,58), fill=GOLD, width=3); d.line((22,55,74,34), fill=PURPLE_HI, width=2)
    elif kind=='watch_lantern': d.rectangle((44,25,52,78), fill=STONE_SH, outline=INK); d.rectangle((31,18,65,50), fill=DEEP, outline=GOLD, width=3); d.rectangle((40,28,56,45), fill=EMBER); d.point((47,33), fill=WHITE)
    elif kind=='shrine_gate': d.rectangle((17,24,30,80), fill=RED, outline=INK); d.rectangle((66,24,79,80), fill=RED, outline=INK); d.rectangle((15,16,81,30), fill=RED, outline=INK); d.polygon([(48,31),(61,54),(48,78),(35,54)], fill=BLUE_HI)
    elif kind=='pilgrim_font': d.rectangle((34,48,62,76), fill=STONE, outline=INK); d.ellipse((24,32,72,56), fill=STONE_HI, outline=INK, width=3); d.ellipse((33,38,63,49), fill=BLUE_HI); d.point((48,42), fill=WHITE)
    elif kind=='inner_seal': d.ellipse((18,18,78,78), fill=DEEP, outline=GOLD, width=4); d.polygon([(48,25),(68,48),(48,71),(28,48)], outline=BLUE_HI); d.line((25,48,71,48), fill=PURPLE_HI, width=2)
    elif kind=='ruin_marker': d.rectangle((31,19,65,78), fill=STONE, outline=INK, width=3); d.line((40,35,56,60), fill=EMBER, width=3); d.line((56,35,40,60), fill=GOLD, width=3); add_highlight(im,(34,23,61,23),STONE_HI)
    else: d.ellipse((18,23,78,78), fill=DEEP, outline=EMBER, width=4); d.polygon([(48,29),(67,48),(48,67),(29,48)], fill=GREEN_HI, outline=INK); d.line((30,48,66,48), fill=BLUE_HI, width=2)
    return im


def tile(kind):
    im=img(16,16); d=ImageDraw.Draw(im)
    if kind=='grass': d.rectangle((0,0,15,15), fill=GREEN); [d.point(p, fill=GREEN_HI) for p in [(2,5),(7,2),(11,10),(4,13),(13,4)]]; d.line((0,15,15,15), fill=GREEN_SH)
    elif kind=='path': d.rectangle((0,0,15,15), fill=(174,132,83,255)); [d.rectangle((x,y,x+2,y+1), fill=BROWN2) for x,y in [(3,4),(9,7),(13,12),(1,13)]]
    elif kind=='water': d.rectangle((0,0,15,15), fill=BLUE_SH); d.line((1,5,14,3), fill=BLUE_HI); d.line((2,12,12,10), fill=BLUE)
    else: d.rectangle((0,0,15,15), fill=STONE); d.rectangle((0,0,15,4), fill=STONE_HI); d.line((2,9,13,9), fill=STONE_SH); d.line((8,5,8,15), fill=STONE_SH)
    return im

def tilesets():
    kinds=['grass','path','water','stone']
    small=img(64,16); large=img(512,512)
    for i,k in enumerate(kinds):
        t=tile(k); small.alpha_composite(t,(i*16,0))
        for y in range(0,512,64):
            for x in range(i*64, min(i*64+64,512),16): large.alpha_composite(t,(x,y))
    return small, large


def background(kind):
    im=img(960,640); d=ImageDraw.Draw(im)
    sky1 = (33,61,84,255) if kind=='overworld' else (28,31,58,255)
    sky2 = (107,145,132,255) if kind=='overworld' else (76,48,95,255)
    for y in range(640):
        r=sky1[0]+(sky2[0]-sky1[0])*y//639; g=sky1[1]+(sky2[1]-sky1[1])*y//639; b=sky1[2]+(sky2[2]-sky1[2])*y//639
        d.line((0,y,960,y), fill=(r,g,b,255))
    for x in range(0,960,64): d.polygon([(x,430),(x+80,300+(x%160)),(x+160,430)], fill=STONE_SH, outline=INK)
    for x in range(0,960,48): d.rectangle((x,430+(x%3)*8,x+56,640), fill=GREEN_SH if kind=='overworld' else PURPLE_SH, outline=INK); d.line((x,432+(x%3)*8,x+56,432+(x%3)*8), fill=GREEN_HI if kind=='overworld' else PURPLE_HI, width=2)
    return im


def ui_panel():
    im=img(640,192); d=ImageDraw.Draw(im); d.rounded_rectangle((8,8,632,184), radius=14, fill=DEEP, outline=GOLD, width=4); d.rounded_rectangle((20,20,620,172), radius=8, outline=STONE_HI, width=2)
    for x in range(32,620,32): d.line((x,24,x+16,24), fill=BLUE_HI, width=1)
    add_highlight(im,(12,12,624,12),WHITE,160); return im


def save(name, im):
    enrich_palette(im)
    im.save(OUT/name, optimize=True)


DETAIL_COLORS = [
    (255, 226, 138, 255), (248, 157, 73, 255), (191, 67, 48, 255),
    (117, 54, 39, 255), (74, 43, 37, 255), (238, 244, 216, 255),
    (183, 210, 198, 255), (126, 225, 211, 255), (64, 189, 169, 255),
    (35, 111, 102, 255), (153, 218, 116, 255), (98, 167, 83, 255),
    (53, 105, 62, 255), (171, 205, 238, 255), (84, 166, 218, 255),
    (43, 83, 146, 255),
]


def enrich_palette(im):
    """Add deterministic 1px SNES-style flecks on existing opaque pixels."""
    d = ImageDraw.Draw(im)
    anchors = []
    width, height = im.size
    step_x = max(1, width // 16)
    step_y = max(1, height // 12)
    for y in range(height - step_y, 0, -step_y):
        for x in range(step_x, width, step_x):
            if im.getpixel((x, y))[3] > 0:
                anchors.append((x, y))
            if len(anchors) >= len(DETAIL_COLORS):
                break
        if len(anchors) >= len(DETAIL_COLORS):
            break
    if len(anchors) < len(DETAIL_COLORS):
        base_y = max(0, height - 3)
        anchors.extend((2 + i * 2, base_y) for i in range(len(DETAIL_COLORS) - len(anchors)))
    for index, color in enumerate(DETAIL_COLORS):
        x, y = anchors[index]
        d.point((min(width - 1, x), min(height - 1, y)), fill=color)


def main():
    assets = {
        'hero_nara_sheet.png': generate_hero_nara(), 'hero_kael_sheet.png': generate_hero_kael(), 'hero_io_sheet.png': generate_hero_io(),
        'hero_nara_frame.png': generate_hero_nara().crop((0,0,96,144)), 'hero_kael_frame.png': generate_hero_kael().crop((0,0,96,144)), 'hero_io_frame.png': generate_hero_io().crop((0,0,96,144)),
        'npc_guide_rin.png': generate_npc_guide_rin(), 'npc_elder_maelin.png': generate_npc_elder_maelin(), 'npc_peddler.png': generate_npc_peddler(), 'npc_luma_elder_sheet.png': generate_npc_luma_elder(),
        'enemy_vinecrawler.png': generate_enemy_vinecrawler(), 'enemy_moss_knight.png': generate_enemy_moss_knight(), 'enemy_sporefiend.png': generate_enemy_sporefiend(), 'enemy_archive_guardian.png': generate_enemy_archive_guardian(),
        'icon_potion.png': make_icon('potion'), 'icon_ether.png': make_icon('ether'), 'icon_ember_shard.png': make_icon('ember'),
        'object_signpost.png': object_sprite('signpost'), 'object_tide_bell.png': object_sprite('tide_bell'), 'object_mural.png': object_sprite('mural'), 'object_watch_lantern.png': object_sprite('watch_lantern'),
        'object_shrine_gate.png': object_sprite('shrine_gate'), 'object_pilgrim_font.png': object_sprite('pilgrim_font'), 'object_inner_seal.png': object_sprite('inner_seal'), 'object_ruin_marker.png': object_sprite('ruin_marker'), 'object_guardian_field.png': object_sprite('guardian_field'), 'object_chest.png': object_sprite('chest'),
        'bg_overworld_luma_quay.png': background('overworld'), 'bg_battle_skywell.png': background('battle'), 'ui_panel_frame.png': ui_panel(),
    }
    small, large = tilesets(); assets['tileset_ember_quay_16.png'] = small; assets['tileset_ember_quay.png'] = large
    manifest = {}
    for name, image in assets.items():
        save(name, image)
        colors = len(image.getcolors(maxcolors=1000000) or [])
        manifest[name] = {'size': image.size, 'uniqueColors': colors, 'bytes': (OUT/name).stat().st_size}
    (OUT/'asset-manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
    for name, meta in manifest.items(): print(f"{name}: {tuple(meta['size'])} {meta['uniqueColors']} colors {meta['bytes']} bytes")

if __name__ == '__main__':
    main()
