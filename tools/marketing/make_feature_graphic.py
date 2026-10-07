# -*- coding: utf-8 -*-
"""감정쓰레기통 Google Play feature graphic (1024x500) generator."""
import math
import random
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H = 1024, 500
S = 2  # supersample
BG = (10, 10, 10)
GREEN = (57, 255, 20)
RED = (255, 23, 68)
ORANGE = (255, 109, 0)
YELLOW = (255, 234, 0)
CYAN = (0, 225, 255)
WHITE = (240, 240, 240)
GREY = (150, 150, 150)

BOLD = "C:/Windows/Fonts/malgunbd.ttf"
REG = "C:/Windows/Fonts/malgun.ttf"


def font(path, size):
    return ImageFont.truetype(path, size * S)


def letterspaced(draw, xy, text, fnt, fill, spacing, stroke=0, stroke_fill=None):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=fnt, fill=fill, stroke_width=stroke, stroke_fill=stroke_fill)
        bbox = draw.textbbox((x, y), ch, font=fnt, stroke_width=stroke)
        x += (bbox[2] - bbox[0]) + spacing * S
    return x


def glow_layer(size, draw_fn, color, blur):
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    draw_fn(d)
    glow = layer.filter(ImageFilter.GaussianBlur(blur))
    return Image.alpha_composite(glow, layer)


def main():
    random.seed(7)
    w, h = W * S, H * S
    img = Image.new("RGBA", (w, h), BG + (255,))
    d = ImageDraw.Draw(img)

    # --- background: faint grid + diagonal streaks ---
    grid = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, w, 64 * S):
        gd.line([(x, 0), (x, h)], fill=(57, 255, 20, 14), width=S)
    for y in range(0, h, 64 * S):
        gd.line([(0, y), (w, y)], fill=(57, 255, 20, 14), width=S)
    img = Image.alpha_composite(img, grid)

    # subtle diagonal red streak
    streak = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    sd = ImageDraw.Draw(streak)
    sd.polygon([(w * 0.62, 0), (w * 0.72, 0), (w * 0.40, h), (w * 0.30, h)], fill=(255, 23, 68, 26))
    streak = streak.filter(ImageFilter.GaussianBlur(40 * S))
    img = Image.alpha_composite(img, streak)

    d = ImageDraw.Draw(img)

    # --- background trash mountain silhouette (bottom) ---
    mountain = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    md = ImageDraw.Draw(mountain)
    pts = [(0, h)]
    base = h - 40 * S
    for i in range(0, w + 1, 20 * S):
        t = i / w
        y = base - (math.sin(t * math.pi * 1.6) * 70 * S + math.sin(t * 9 + 1) * 18 * S)
        pts.append((i, y))
    pts.append((w, h))
    md.polygon(pts, fill=(17, 20, 17, 255))
    md.line(pts[1:-1], fill=GREEN + (90,), width=2 * S)
    img = Image.alpha_composite(img, mountain)

    # --- neon trash can (right side) ---
    cx = 780 * S
    can = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    cd = ImageDraw.Draw(can)
    body_top, body_bot = 215 * S, 430 * S
    half_t, half_b = 105 * S, 78 * S
    body = [(cx - half_t, body_top), (cx + half_t, body_top),
            (cx + half_b, body_bot), (cx - half_b, body_bot)]
    cd.polygon(body, fill=(14, 24, 14, 255))
    cd.line(body + [body[0]], fill=GREEN + (255,), width=7 * S, joint="curve")
    # stripes
    for k in (-0.45, 0, 0.45):
        x1 = cx + k * half_t
        x2 = cx + k * half_b
        cd.line([(x1, body_top + 8 * S), (x2, body_bot - 8 * S)], fill=GREEN + (150,), width=4 * S)
    # lid
    lid_y = 190 * S
    cd.rounded_rectangle([(cx - 125 * S, lid_y), (cx + 125 * S, lid_y + 30 * S)], radius=14 * S,
                         fill=(16, 30, 16, 255), outline=GREEN + (255,), width=7 * S)
    cd.rounded_rectangle([(cx - 34 * S, lid_y - 22 * S), (cx + 34 * S, lid_y - 2 * S)], radius=9 * S,
                         fill=(16, 30, 16, 255), outline=GREEN + (255,), width=6 * S)
    # glow: green halo behind can
    halo = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    hd = ImageDraw.Draw(halo)
    hd.ellipse([(cx - 170 * S, 140 * S), (cx + 170 * S, 470 * S)], fill=(57, 255, 20, 70))
    halo = halo.filter(ImageFilter.GaussianBlur(45 * S))
    img = Image.alpha_composite(img, halo)
    glow = can.filter(ImageFilter.GaussianBlur(9 * S))
    can = Image.alpha_composite(glow, can)
    img = Image.alpha_composite(img, can)

    d = ImageDraw.Draw(img)

    # --- falling trash pieces above can ---
    def piece_bottle(xy):
        x, y = xy
        d.rounded_rectangle([x, y + 14 * S, x + 34 * S, y + 58 * S], radius=8 * S,
                            fill=CYAN + (230,), outline=(230, 255, 255, 255), width=2 * S)
        d.rectangle([x + 11 * S, y, x + 23 * S, y + 16 * S], fill=CYAN + (230,))

    def piece_can(xy):
        x, y = xy
        d.rounded_rectangle([x, y, x + 30 * S, y + 50 * S], radius=8 * S,
                            fill=RED + (235,), outline=(255, 200, 210, 255), width=2 * S)
        d.line([(x + 4 * S, y + 14 * S), (x + 26 * S, y + 14 * S)], fill=(255, 255, 255, 200), width=2 * S)

    def piece_paper(xy):
        x, y = xy
        pts = []
        for i in range(9):
            a = i / 9 * math.tau
            r = (20 + random.uniform(-6, 6)) * S
            pts.append((x + math.cos(a) * r, y + math.sin(a) * r))
        d.polygon(pts, fill=YELLOW + (225,), outline=(255, 255, 220, 255))

    def piece_broken(xy):
        x, y = xy
        d.polygon([(x, y + 40 * S), (x + 44 * S, y), (x + 44 * S, y + 40 * S)],
                  fill=ORANGE + (235,), outline=(255, 220, 180, 255))

    piece_bottle((640 * S, 40 * S))
    piece_can((905 * S, 62 * S))
    piece_paper((842 * S, 96 * S))
    piece_broken((740 * S, 108 * S))

    # --- left text block ---
    kicker = font(BOLD, 20)
    letterspaced(d, (64 * S, 78 * S), "EMOTIONAL TRASH CAN", kicker, GREEN, 7)

    title = font(BOLD, 84)
    d.text((64 * S, 112 * S), "감정쓰레기통", font=title, fill=WHITE,
           stroke_width=2 * S, stroke_fill=WHITE)

    d.rounded_rectangle([(64 * S, 238 * S), (196 * S, 246 * S)], radius=4 * S, fill=GREEN)

    sub = font(REG, 27)
    d.text((64 * S, 268 * S), "세상의 모든 감정 쓰레기가 모이는 곳", font=sub, fill=(210, 210, 210))
    d.text((64 * S, 310 * S), "익명으로 마음껏 버리고, 3D 쓰레기산으로 돌아보세요", font=sub, fill=GREY)

    # chips
    chip_f = font(BOLD, 19)
    chips = ["익명 · 계정 없음", "완전 무료", "AI 위로 댓글"]
    x = 64 * S
    y = 372 * S
    for c in chips:
        bbox = d.textbbox((0, 0), c, font=chip_f)
        cw = bbox[2] - bbox[0] + 40 * S
        d.rounded_rectangle([(x, y), (x + cw, y + 44 * S)], radius=22 * S,
                            outline=GREEN + (170,), width=2 * S, fill=(57, 255, 20, 22))
        d.text((x + 20 * S, y + 9 * S), c, font=chip_f, fill=(190, 255, 170))
        x += cw + 16 * S

    # --- corner brackets ---
    br = 26 * S
    for (bx, by, sx, sy) in [(24, 24, 1, 1), (W - 24, 24, -1, 1),
                             (24, H - 24, 1, -1), (W - 24, H - 24, -1, -1)]:
        bx, by = bx * S, by * S
        d.line([(bx, by), (bx + br * sx, by)], fill=GREEN + (200,), width=3 * S)
        d.line([(bx, by), (bx, by + br * sy)], fill=GREEN + (200,), width=3 * S)

    # --- grain ---
    grain = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grain)
    for _ in range(2600):
        gx, gy = random.randrange(w), random.randrange(h)
        gd.point((gx, gy), fill=(255, 255, 255, random.randrange(6, 16)))
    img = Image.alpha_composite(img, grain)

    img = img.convert("RGB").resize((W, H), Image.LANCZOS)
    out = "store/feature-graphic-1024x500.png"
    img.save(out, "PNG")
    print("saved", out)


if __name__ == "__main__":
    main()
