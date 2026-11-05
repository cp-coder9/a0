#!/usr/bin/env python3
r"""Regenerate the SITRAK / Truk Afrik brand share assets.

Outputs (all deterministic, all derived from the supplied logo artwork):
  public/og/og-default.png   1200x630 social / OpenGraph card
  app/icon.png                512x512  Next.js favicon source
  app/apple-icon.png          180x180  Apple touch icon

Run from anywhere:
  C:\Users\greg\.dsh\dsh-runtimes\dsh-primary-runtime\dependencies\python\python.exe scripts/make-brand-assets.py

Only Pillow is required. No network access. Fonts: Arial Narrow Bold / Arial Bold.
"""

from __future__ import annotations

import math
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent

# ---- supplied artwork ------------------------------------------------------
WHITE_LOGO = ROOT / "public/intro/sitrak-truk-afrik-white.png"
COLOUR_LOGO = ROOT / "public/intro/sitrak-truk-afrik.png"

OUT_OG = ROOT / "public/og/og-default.png"
OUT_ICON = ROOT / "app/icon.png"
OUT_APPLE_ICON = ROOT / "app/apple-icon.png"

# ---- brand palette ---------------------------------------------------------
NAVY = (12, 35, 64)          # #0C2340 - theme colour
NAVY_GLOW = (21, 52, 90)     # slightly lifted navy for the radial glow
GOLD = (200, 135, 10)        # #C8870A
GOLD_BRIGHT = (240, 160, 32) # #F0A020
WHITE = (255, 255, 255)
SUBLINE = (208, 218, 233)    # ~85% white, cool tint

# ---- fonts -----------------------------------------------------------------
FONT_CANDIDATES = {
    "heavy": [
        r"C:\Windows\Fonts\ARIALNB.TTF",   # Arial Narrow Bold - heavy condensed
        r"C:\Windows\Fonts\ariblk.ttf",    # Arial Black
        r"C:\Windows\Fonts\arialbd.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ],
    "body": [
        r"C:\Windows\Fonts\arial.ttf",
        r"C:\Windows\Fonts\segoeui.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ],
}


def load_font(kind, size):
    for path in FONT_CANDIDATES[kind]:
        if Path(path).exists():
            return ImageFont.truetype(path, size)
    raise SystemExit("No usable font found for %r: %r" % (kind, FONT_CANDIDATES[kind]))


# ---- small image helpers ---------------------------------------------------
def radial_mask(size, center, radius, falloff=1.7, invert=False):
    """Soft radial mask: 255 at center, fading to 0 at radius (or the reverse)."""
    w, h = size
    sw, sh = max(2, w // 4), max(2, h // 4)
    mask = Image.new("L", (sw, sh), 0)
    px = mask.load()
    cx, cy, r = center[0] * sw / w, center[1] * sh / h, radius * sw / w
    for y in range(sh):
        dy = y - cy
        for x in range(sw):
            d = math.hypot(x - cx, dy) / r
            v = max(0.0, min(1.0, 1.0 - d)) ** falloff
            if invert:
                v = 1.0 - v
            px[x, y] = int(round(255 * v))
    return mask.resize((w, h), Image.LANCZOS)


def tint_mask(mask, strength):
    return mask.point(lambda v: int(round(v * strength)))


def fit(img, width):
    """Scale an image to the given width, preserving aspect ratio."""
    w, h = img.size
    height = max(1, round(h * width / w))
    return img.resize((width, height), Image.LANCZOS)


def emblem(logo_rgba):
    """Crop the pentagon emblem (the top band) out of the supplied logo."""
    alpha = logo_rgba.getchannel("A").point(lambda v: 255 if v > 128 else 0)
    w, h = alpha.size
    px = alpha.load()
    rows = [sum(1 for x in range(0, w, 2) if px[x, y]) for y in range(h)]
    y0 = next(y for y, c in enumerate(rows) if c > 2)   # first content row
    y1 = y0
    while y1 + 1 < h and rows[y1 + 1] > 2:              # end of the emblem band
        y1 += 1
    cols = [x for x in range(w) if any(px[x, y] for y in range(y0, y1 + 1, 2))]
    x0, x1 = min(cols), max(cols)
    return logo_rgba.crop((x0, y0, x1 + 1, y1 + 1))


def base_panel(size, glow_center, glow_radius, glow_strength, vignette_strength):
    """Navy panel with a soft lifted glow and a subtle corner vignette."""
    canvas = Image.new("RGB", size, NAVY)
    glow = Image.new("RGB", size, NAVY_GLOW)
    canvas = Image.composite(glow, canvas, tint_mask(radial_mask(size, glow_center, glow_radius, 1.6), glow_strength))
    dark = Image.new("RGB", size, (5, 14, 27))
    dim = radial_mask(size, (size[0] * 0.5, size[1] * 0.5), max(size) * 0.95, 1.2, invert=True)
    canvas = Image.composite(dark, canvas, tint_mask(dim, vignette_strength))
    return canvas


def tracked(draw, xy, text, font, fill, tracking=0.0, stroke=0):
    """Draw letter-spaced text on a common baseline; returns the end x."""
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill, anchor="ls",
                  stroke_width=stroke, stroke_fill=fill)
        x += font.getlength(ch) + tracking
    return x


def tracked_width(text, font, tracking=0.0):
    return sum(font.getlength(ch) + tracking for ch in text) - tracking


# ---- the OpenGraph card ----------------------------------------------------
def build_og():
    w, h = 1200, 630
    margin = 72

    # ---- typography first, so the artwork can be laid out around it ----
    body = load_font("body", 28)
    eyebrow = load_font("heavy", 26)
    body_text = "sales, parts and service in Mbombela and Benoni"
    eyebrow_text = "SITRAK \u00b7 HOWO \u00b7 TRUK AFRIK"
    headline_text = "COME DRIVE ONE."

    # largest weighty condensed size that still clears the watermark on the right
    headline_max_w = 780
    headline_size = 104
    while headline_size > 64:
        headline = load_font("heavy", headline_size)
        if tracked_width(headline_text, headline, tracking=1.2) <= headline_max_w:
            break
        headline_size -= 2

    body_baseline = h - margin - 2          # leaves ~7px descender room
    eyebrow_baseline = body_baseline - 42
    head_baseline = eyebrow_baseline - 46
    cap_height = round(headline_size * 0.72)
    rule_y = head_baseline - cap_height - 40

    logo_h_max = rule_y - margin - 34
    logo_w = min(470, round(logo_h_max * 1386 / 766))

    # ---- canvas ----
    canvas = base_panel((w, h), (margin + 230, 160), 800, 0.95, 0.55)

    # faint emblem watermark on the right keeps the wide card balanced
    em = emblem(Image.open(WHITE_LOGO).convert("RGBA"))
    wm = fit(em, 236)
    wm.putalpha(wm.getchannel("A").point(lambda v: int(round(v * 0.10))))
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(wm, (w - margin - wm.width + 10, (h - wm.height) // 2 - 10))

    # supplied white logo, top-left
    logo = fit(Image.open(WHITE_LOGO).convert("RGBA"), logo_w)
    canvas.alpha_composite(logo, (margin, margin))

    draw = ImageDraw.Draw(canvas)

    # gold rule between logo and headline
    draw.rectangle([margin, rule_y, margin + 150, rule_y + 2], fill=GOLD)
    draw.rectangle([margin + 158, rule_y, margin + 198, rule_y + 2], fill=GOLD_BRIGHT)

    # headline
    tracked(draw, (margin, head_baseline), headline_text, headline, WHITE, tracking=1.2, stroke=1)

    # sublines
    tracked(draw, (margin, eyebrow_baseline), eyebrow_text, eyebrow, GOLD_BRIGHT, tracking=3.2)
    draw.text((margin, body_baseline), body_text, font=body, fill=SUBLINE, anchor="ls")

    OUT_OG.parent.mkdir(parents=True, exist_ok=True)
    canvas.convert("RGB").save(OUT_OG, "PNG", optimize=True)
    return OUT_OG


# ---- app icons -------------------------------------------------------------
def build_icon_master():
    size = 1024
    canvas = base_panel((size, size), (size * 0.5, size * 0.42), size * 0.85, 0.85, 0.62)
    em = emblem(Image.open(WHITE_LOGO).convert("RGBA"))
    mark = fit(em, int(size * 0.78))
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(mark, ((size - mark.width) // 2, (size - mark.height) // 2))
    return canvas


def build_icons():
    master = build_icon_master()
    master.resize((512, 512), Image.LANCZOS).convert("RGB").save(OUT_ICON, "PNG", optimize=True)
    master.resize((180, 180), Image.LANCZOS).convert("RGB").save(OUT_APPLE_ICON, "PNG", optimize=True)
    return OUT_ICON, OUT_APPLE_ICON


def main():
    if not WHITE_LOGO.exists():
        sys.exit("missing supplied artwork: %s" % WHITE_LOGO)
    og = build_og()
    icon, apple = build_icons()
    for p in (og, icon, apple):
        with Image.open(p) as im:
            print("%s  %dx%d  %d bytes" % (p.relative_to(ROOT), im.size[0], im.size[1], p.stat().st_size))


if __name__ == "__main__":
    main()
