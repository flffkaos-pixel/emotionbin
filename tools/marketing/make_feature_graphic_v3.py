# -*- coding: utf-8 -*-
"""감정쓰레기통 Google Play feature graphic v3 — real 3D scene composite."""
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

W, H, S = 1024, 500, 2
BOLD = "C:/Windows/Fonts/malgunbd.ttf"
REG = "C:/Windows/Fonts/malgun.ttf"
GREEN = (57, 255, 20)
RED = (255, 23, 68)


def F(sz, bold=True):
    return ImageFont.truetype(BOLD if bold else REG, sz * S)


def letterspaced(d, xy, text, fnt, fill, sp):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=fnt, fill=fill)
        bb = d.textbbox((x, y), ch, font=fnt)
        x += (bb[2] - bb[0]) + sp * S
    return x


def main():
    src = Image.open("store/scene-live-v2.png").convert("RGB")

    # zoom so the trash pile sits right of the text block
    scale = 1.3
    big = src.resize((int(src.width * scale), int(src.height * scale)), Image.LANCZOS)
    x0, y0 = int(170 * scale), 0
    img = big.crop((x0, y0, x0 + W * S, y0 + H * S)).convert("RGBA")

    # ---- scrim: horizontal dark gradient on the left ----
    scrim = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(scrim)
    fade_end = 660 * S
    for x in range(0, W * S, 2 * S):
        t = min(1.0, x / fade_end)
        a = int(238 * (1 - t) ** 1.4)
        if a > 0:
            sd.rectangle([x, 0, x + 2 * S, H * S], fill=(6, 8, 6, a))
    # bottom grounding gradient
    for y in range(int(H * 0.62 * S), H * S, 2 * S):
        t = (y - H * 0.62 * S) / (H * 0.38 * S)
        a = int(70 * t)
        sd.rectangle([0, y, W * S, y + 2 * S], fill=(6, 8, 6, a))
    img = Image.alpha_composite(img, scrim)

    # ---- text ----
    txt = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    td = ImageDraw.Draw(txt)
    letterspaced(td, (58 * S, 66 * S), "EMOTIONAL TRASH CAN", F(19), GREEN, 7)

    # title with green glow
    tf = F(86)
    tpos = (54 * S, 98 * S)
    base = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    bd = ImageDraw.Draw(base)
    bd.text(tpos, "감정쓰레기통", font=tf, fill=(255, 255, 255, 255))
    glow = base.filter(ImageFilter.GaussianBlur(22 * S))
    glow.putalpha(glow.getchannel("A").point(lambda v: int(v * 0.55)))
    txt = Image.alpha_composite(txt, Image.alpha_composite(glow, base))
    td = ImageDraw.Draw(txt)

    td.rounded_rectangle([(58 * S, 242 * S), (200 * S, 250 * S)], radius=4 * S, fill=GREEN)
    td.rounded_rectangle([(210 * S, 242 * S), (268 * S, 250 * S)], radius=4 * S, fill=RED)

    sub = F(26, bold=False)
    td.text((58 * S, 272 * S), "버린 감정이 실시간 3D 쓰레기산이 된다", font=sub, fill=(225, 225, 225, 255))
    td.text((58 * S, 314 * S), "익명 · 계정 없이 무료 · AI 위로 댓글까지", font=sub, fill=(150, 150, 150, 255))

    chip_f = F(18)
    x, y = 58 * S, 374 * S
    for c in ["실시간 3D 쓰레기산", "완전 무료", "AI 위로 댓글"]:
        bb = td.textbbox((0, 0), c, font=chip_f)
        cw = bb[2] - bb[0] + 40 * S
        td.rounded_rectangle([(x, y), (x + cw, y + 44 * S)], radius=22 * S,
                             outline=(57, 255, 20, 210), width=2 * S, fill=(57, 255, 20, 30))
        td.text((x + 20 * S, y + 9 * S), c, font=chip_f, fill=(200, 255, 185, 255))
        x += cw + 14 * S
    img = Image.alpha_composite(img, txt)

    # ---- corner brackets ----
    br = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))
    bnd = ImageDraw.Draw(br)
    for (bx, by, sx, sy) in [(24, 24, 1, 1), (W - 24, 24, -1, 1),
                             (24, H - 24, 1, -1), (W - 24, H - 24, -1, -1)]:
        bx, by = bx * S, by * S
        bnd.line([(bx, by), (bx + 24 * S * sx, by)], fill=GREEN + (210,), width=3 * S)
        bnd.line([(bx, by), (bx, by + 24 * S * sy)], fill=GREEN + (210,), width=3 * S)
    img = Image.alpha_composite(img, br)

    out = img.convert("RGB").resize((W, H), Image.LANCZOS)
    out.save("store/feature-graphic-1024x500.png", "PNG")
    out.save("store/feature-graphic-v3-scene.png", "PNG")
    print("saved store/feature-graphic-1024x500.png (+ v3 copy)")


if __name__ == "__main__":
    main()
