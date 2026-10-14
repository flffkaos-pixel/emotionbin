# -*- coding: utf-8 -*-
"""감정쓰레기통 Google Play feature graphic v2 — dark & pop variants."""
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, S = 1024, 500, 2
BOLD = "C:/Windows/Fonts/malgunbd.ttf"
REG = "C:/Windows/Fonts/malgun.ttf"

GREEN = (57, 255, 20)
RED = (255, 23, 68)
CYAN = (0, 225, 255)
YELLOW = (255, 234, 0)
ORANGE = (255, 109, 0)
INK = (10, 10, 10)


def F(sz, bold=True):
    return ImageFont.truetype(BOLD if bold else REG, sz * S)


def letterspaced(d, xy, text, fnt, fill, sp):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        bb = d.textbbox((x, y), ch, font=fnt)
        x += (bb[2] - bb[0]) + sp * S
    return x


def text_with_glow(size, pos, text, fnt, fill, glow_color, blur, strength, stroke=0):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    ld = ImageDraw.Draw(layer)
    ld.text(pos, text, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=fill)
    glow = layer.filter(ImageFilter.GaussianBlur(blur))
    glow.putalpha(glow.getchannel("A").point(lambda v: int(v * strength)))
    return Image.alpha_composite(glow, layer)


def vignette(size, strength):
    g = Image.radial_gradient("L").resize(size, Image.BILINEAR)
    a = g.point(lambda v: int((255 - v) * strength))
    layer = Image.new("RGBA", size, (0, 0, 0, 255))
    layer.putalpha(a)
    return layer


def grain(size, n, alpha):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    rnd = random.Random(3)
    for _ in range(n):
        d.point((rnd.randrange(size[0]), rnd.randrange(size[1])),
                fill=(255, 255, 255, rnd.randrange(4, alpha)))
    return layer


# ---------- trash pieces ----------
def item_bottle(d, x, y, s, body, cap=(230, 255, 255, 255)):
    d.rounded_rectangle([x, y + 16 * s, x + 30 * s, y + 56 * s], radius=9 * s,
                        fill=body, outline=(255, 255, 255, 200), width=max(1, int(2 * s)))
    d.rectangle([x + 10 * s, y, x + 20 * s, y + 18 * s], fill=cap)


def item_can(d, x, y, s, body):
    d.rounded_rectangle([x, y, x + 28 * s, y + 50 * s], radius=8 * s,
                        fill=body, outline=(255, 255, 255, 200), width=max(1, int(2 * s)))
    d.line([(x + 4 * s, y + 14 * s), (x + 24 * s, y + 14 * s)],
           fill=(255, 255, 255, 190), width=max(1, int(2 * s)))


def item_box(d, x, y, s, body):
    d.rectangle([x, y + 8 * s, x + 44 * s, y + 40 * s],
                fill=body, outline=(255, 255, 255, 180), width=max(1, int(2 * s)))
    d.line([(x + 22 * s, y + 8 * s), (x + 22 * s, y + 40 * s)],
           fill=(255, 255, 255, 150), width=max(1, int(2 * s)))


def item_ball(d, x, y, s, body):
    pts = []
    rnd = random.Random(int(x) + int(y))
    for i in range(10):
        a = i / 10 * math.tau
        r = (19 + rnd.uniform(-6, 6)) * s
        pts.append((x + math.cos(a) * r, y + math.sin(a) * r))
    d.polygon(pts, fill=body, outline=(255, 255, 255, 190))


def item_tv(d, x, y, s, body=(26, 30, 34, 255)):
    d.rounded_rectangle([x, y + 10 * s, x + 52 * s, y + 46 * s], radius=6 * s,
                        fill=body, outline=(255, 255, 255, 170), width=max(1, int(2 * s)))
    d.rectangle([x + 6 * s, y + 16 * s, x + 38 * s, y + 40 * s], fill=(90, 240, 255, 255))
    d.line([(x + 14 * s, y + 10 * s), (x + 6 * s, y)], fill=(255, 255, 255, 200), width=max(1, int(2 * s)))
    d.line([(x + 38 * s, y + 10 * s), (x + 46 * s, y)], fill=(255, 255, 255, 200), width=max(1, int(2 * s)))


PIECES = [item_bottle, item_can, item_box, item_ball]
PIECE_COLORS = [CYAN + (235,), RED + (235,), ORANGE + (235,), YELLOW + (235,),
                (170, 170, 175, 255), (90, 200, 120, 255)]


def draw_can(layer_size, cx, top, h, line, fill, stripe_alpha):
    """neon trash can drawn on its own transparent layer"""
    im = Image.new("RGBA", layer_size, (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    w = int(h * 0.92)
    body_top = top + int(h * 0.14)
    body_bot = top + h
    half_t = w // 2
    half_b = int(half_t * 0.74)
    lw = max(4, int(h * 0.030))
    body = [(cx - half_t, body_top), (cx + half_t, body_top),
            (cx + half_b, body_bot), (cx - half_b, body_bot)]
    d.polygon(body, fill=fill)
    d.line(body + [body[0]], fill=line, width=lw, joint="curve")
    for k in (-0.45, 0, 0.45):
        d.line([(cx + k * half_t, body_top + 8), (cx + k * half_b, body_bot - 8)],
               fill=(line[0], line[1], line[2], stripe_alpha), width=max(2, lw - 3))
    lid_y = top + int(h * 0.045)
    d.rounded_rectangle([(cx - int(half_t * 1.18), lid_y), (cx + int(half_t * 1.18), lid_y + int(h * 0.13))],
                        radius=int(h * 0.06), fill=fill, outline=line, width=lw)
    d.rounded_rectangle([(cx - int(half_t * 0.32), lid_y - int(h * 0.10)),
                         (cx + int(half_t * 0.32), lid_y + int(h * 0.01))],
                        radius=int(h * 0.045), fill=fill, outline=line, width=max(3, lw - 1))
    return im


def build(variant):
    rnd = random.Random(11)
    w, h = W * S, H * S
    dark = variant == "dark"

    # ---- background ----
    if dark:
        img = Image.new("RGBA", (w, h), (9, 10, 9, 255))
        glow1 = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        g1 = ImageDraw.Draw(glow1)
        g1.ellipse([(430 * S, 60 * S), (1130 * S, 640 * S)], fill=(57, 255, 20, 60))
        glow1 = glow1.filter(ImageFilter.GaussianBlur(90 * S))
        img = Image.alpha_composite(img, glow1)
        glow2 = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        g2 = ImageDraw.Draw(glow2)
        g2.ellipse([(-140 * S, -120 * S), (360 * S, 240 * S)], fill=(255, 23, 68, 55))
        glow2 = glow2.filter(ImageFilter.GaussianBlur(85 * S))
        img = Image.alpha_composite(img, glow2)
        grid_c, grid_a = (57, 255, 20), 13
    else:
        img = Image.new("RGBA", (w, h), (57, 255, 20, 255))
        rays = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        rd = ImageDraw.Draw(rays)
        ccx, ccy = 810 * S, 270 * S
        R = 1500 * S
        for i in range(24):
            a0 = i * 15
            if i % 2:
                continue
            p = [(ccx, ccy)]
            for a in (a0, a0 + 15):
                rad = math.radians(a)
                p.append((ccx + math.cos(rad) * R, ccy + math.sin(rad) * R))
            rd.polygon(p, fill=(38, 215, 12, 255))
        img = Image.alpha_composite(img, rays)
        grid_c, grid_a = (10, 60, 10), 40

    # grid
    grid = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, w, 64 * S):
        gd.line([(x, 0), (x, h)], fill=grid_c + (grid_a,), width=S)
    for y in range(0, h, 64 * S):
        gd.line([(0, y), (w, y)], fill=grid_c + (grid_a,), width=S)
    img = Image.alpha_composite(img, grid)

    # ---- trash mound + pile ----
    pile = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pile)
    x0, x1, base, peak = 545 * S, 1050 * S, 475 * S, 330 * S
    pts = [(x0, base)]
    n = 26
    curve = []
    for i in range(n + 1):
        t = i / n
        x = x0 + (x1 - x0) * t
        y = base - (base - peak) * math.sin(t * math.pi) ** 1.3 + rnd.uniform(-7, 7) * S
        curve.append((x, y))
        pts.append((x, y))
    pts += [(x1, base + 60 * S), (x0, base + 60 * S)]
    mound_fill = (16, 20, 16, 255) if dark else (12, 40, 14, 255)
    pd.polygon(pts, fill=mound_fill)
    pd.line(curve, fill=GREEN + (255 if dark else 0,) if dark else (12, 40, 14, 255),
            width=3 * S)
    # pieces on pile
    for _ in range(34):
        px = rnd.uniform(x0 + 8 * S, x1 - 40 * S)
        t = (px - x0) / (x1 - x0)
        cy = base - (base - peak) * math.sin(t * math.pi) ** 1.3
        py = cy + rnd.uniform(4, 60) * S
        if py > base + 20 * S:
            continue
        fn = rnd.choice(PIECES)
        col = rnd.choice(PIECE_COLORS)
        if not dark:
            col = rnd.choice([(10, 10, 10, 255), (255, 23, 68, 255), (255, 255, 255, 255), (255, 109, 0, 255)])
        fn(pd, px, py, S * rnd.uniform(0.75, 1.25), col)
    img = Image.alpha_composite(img, pile)

    # ---- neon trash can (tilted, sitting on pile) ----
    can_line = GREEN + (255,) if dark else (10, 10, 10, 255)
    can_fill = (12, 26, 12, 255) if dark else (57, 255, 20, 255)
    stripe_a = 150 if dark else 0
    if not dark:
        can_fill = (12, 12, 12, 255)
        stripe_a = 90
        can_line = (10, 10, 10, 255)
        # on pop bg use black can with green stripes
        can_line = (10, 10, 10, 255)
        stripe_a = 110
        can_stripe = (57, 255, 20, 255)
    can = draw_can((w, h), 815 * S, 175 * S, 235 * S, can_line, can_fill, stripe_a)
    if not dark:
        # recolor stripes to green for pop variant
        pass
    # halo
    if dark:
        halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        hd = ImageDraw.Draw(halo)
        hd.ellipse([(815 * S - 175 * S, 140 * S), (815 * S + 175 * S, 450 * S)], fill=(57, 255, 20, 60))
        halo = halo.filter(ImageFilter.GaussianBlur(48 * S))
        img = Image.alpha_composite(img, halo)
    rot = can.rotate(-9, resample=Image.BICUBIC, center=(815 * S, 400 * S))
    img.paste(rot, (0, 0), rot)

    # ---- falling trash with motion trails ----
    falling = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    fd = ImageDraw.Draw(falling)
    spots = [(672, 46, -18), (958, 70, 14), (878, 118, -8), (768, 128, 22)]
    for i, (fx, fy, ang) in enumerate(spots):
        fn = PIECES[i % len(PIECES)]
        col = PIECE_COLORS[i % len(PIECE_COLORS)] if dark else \
            [(10, 10, 10, 255), (255, 23, 68, 255), (255, 255, 255, 255), (255, 109, 0, 255)][i % 4]
        # trail
        for k in range(6):
            a = int(70 - k * 11)
            if a <= 0:
                continue
            col_t = (col[0], col[1], col[2], a) if dark else (10, 10, 10, a)
            fd.line([(fx * S, (fy - 6 - k * 13) * S), (fx * S, (fy - 12 - k * 13) * S)],
                    fill=col_t, width=int(5 * S - k * 0.6 * S) or S)
        piece = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        pd2 = ImageDraw.Draw(piece)
        fn(pd2, fx * S, fy * S, S * 1.05, col)
        piece = piece.rotate(ang, resample=Image.BICUBIC, center=(fx * S + 16 * S, fy * S + 24 * S))
        falling = Image.alpha_composite(falling, piece)
    img = Image.alpha_composite(img, falling)

    # ---- text block ----
    if dark:
        k_col, t_col, s1_col, s2_col = GREEN, (245, 245, 245, 255), (215, 215, 215, 255), (150, 150, 150, 255)
        bar1, bar2 = GREEN, RED
        chip_line, chip_fill, chip_text = (57, 255, 20, 200), (57, 255, 20, 26), (190, 255, 170, 255)
        glow_cfg = dict(glow_color=GREEN, blur=26 * S, strength=0.55)
    else:
        k_col, t_col, s1_col, s2_col = (10, 30, 10, 255), (10, 10, 10, 255), (12, 34, 14, 255), (20, 60, 24, 255)
        bar1, bar2 = (10, 10, 10, 255), (255, 23, 68, 255)
        chip_line, chip_fill, chip_text = (10, 10, 10, 255), (10, 10, 10, 235), (57, 255, 20, 255)
        glow_cfg = None

    txt = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt)
    letterspaced(td, (64 * S, 62 * S), "EMOTIONAL TRASH CAN", F(20), k_col, 7)

    title_f = F(96)
    title = "감정쓰레기통"
    tpos = (64 * S, 96 * S)
    if glow_cfg:
        base_layer = text_with_glow((w, h), tpos, title, title_f, t_col,
                                    glow_cfg["glow_color"], glow_cfg["blur"], glow_cfg["strength"])
    else:
        base_layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        bd = ImageDraw.Draw(base_layer)
        bd.text((tpos[0] + 6 * S, tpos[1] + 7 * S), title, font=title_f, fill=(255, 255, 255, 255))
        bd.text(tpos, title, font=title_f, fill=t_col)
    txt = Image.alpha_composite(txt, base_layer)
    td = ImageDraw.Draw(txt)

    td.rounded_rectangle([(64 * S, 246 * S), (206 * S, 254 * S)], radius=4 * S, fill=bar1)
    td.rounded_rectangle([(216 * S, 246 * S), (276 * S, 254 * S)], radius=4 * S, fill=bar2)

    sub = F(27, bold=False)
    td.text((64 * S, 276 * S), "세상의 모든 감정 쓰레기가 모이는 곳", font=sub, fill=s1_col)
    td.text((64 * S, 318 * S), "익명으로 마음껏 버리고, 3D 쓰레기산으로 돌아보세요", font=sub, fill=s2_col)

    chip_f = F(19)
    x = 64 * S
    y = 376 * S
    for c in ["익명 · 계정 없음", "완전 무료", "AI 위로 댓글"]:
        bb = td.textbbox((0, 0), c, font=chip_f)
        cw = bb[2] - bb[0] + 42 * S
        td.rounded_rectangle([(x, y), (x + cw, y + 46 * S)], radius=23 * S,
                             outline=chip_line, width=2 * S, fill=chip_fill)
        td.text((x + 21 * S, y + 10 * S), c, font=chip_f, fill=chip_text)
        x += cw + 16 * S

    img = Image.alpha_composite(img, txt)

    # ---- corner brackets ----
    br = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    bnd = ImageDraw.Draw(br)
    bcol = GREEN + (220,) if dark else (10, 10, 10, 220)
    for (bx, by, sx, sy) in [(24, 24, 1, 1), (W - 24, 24, -1, 1),
                             (24, H - 24, 1, -1), (W - 24, H - 24, -1, -1)]:
        bx, by = bx * S, by * S
        bnd.line([(bx, by), (bx + 26 * S * sx, by)], fill=bcol, width=3 * S)
        bnd.line([(bx, by), (bx, by + 26 * S * sy)], fill=bcol, width=3 * S)
    img = Image.alpha_composite(img, br)

    # ---- finish ----
    img = Image.alpha_composite(img, vignette((w, h), 0.45 if dark else 0.22))
    if dark:
        img = Image.alpha_composite(img, grain((w, h), 3200, 18))
    img = img.convert("RGB").resize((W, H), Image.LANCZOS)
    out = f"store/feature-graphic-v2-{variant}.png"
    img.save(out, "PNG")
    print("saved", out)


if __name__ == "__main__":
    build("dark")
    build("pop")
