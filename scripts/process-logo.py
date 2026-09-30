"""
Cuts the baked-in "fake transparency" checkerboard out of the supplied ARNA logos
and writes clean transparent assets into apps/web/public/brand.

Source files are RGB (no alpha): a light grey/white checkerboard is part of the picture.
  * wordmark  : gold tube. Alpha comes from colour saturation (background saturation ~ 0).
  * emblem    : dark teal rounded square. Alpha comes from "not background" + hole fill.

Usage: python scripts/process-logo.py <Logo dir> <out dir>
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage as ndi  # noqa: F401  (hole filling / erosion)

src_dir = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
out_dir.mkdir(parents=True, exist_ok=True)


def sat_lum(a):
    mx = a.max(2)
    mn = a.min(2)
    sat = (mx - mn) / np.maximum(mx, 1)
    lum = a.mean(2)
    return sat, lum


# ---------------------------------------------------------------- wordmark
wm = np.array(Image.open(src_dir / "logo.png").convert("RGB")).astype(np.float32)
sat, lum = sat_lum(wm)
solid = sat > 0.25


def fill_small_holes(mask, max_area):
    """Fill only tiny enclosed holes (specular pin-holes), never the gaps between tubes."""
    lab, n = ndi.label(~mask)
    if n == 0:
        return mask
    sizes = ndi.sum(~mask, lab, range(1, n + 1))
    small = np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s <= max_area])
    return mask | small


solid = fill_small_holes(solid, 60)
# soft anti-aliased edge: saturation ramp between "pure background" and "solid gold"
edge = np.clip((sat - 0.12) / 0.16, 0, 1)
alpha = np.where(solid, 1.0, edge)
# de-matte: remove the light background contribution from edge pixels
bg = 246.0
a3 = np.clip(alpha, 0.001, 1)[..., None]
fg = np.clip((wm - bg * (1 - a3)) / a3, 0, 255)
rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, "RGBA")
bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
pad = 24
bbox = (max(bbox[0] - pad, 0), max(bbox[1] - pad, 0), min(bbox[2] + pad, img.width), min(bbox[3] + pad, img.height))
img = img.crop(bbox)
img.save(out_dir / "wordmark.png", optimize=True)
w = 1200
img.resize((w, round(img.height * w / img.width)), Image.LANCZOS).save(out_dir / "wordmark.webp", quality=92, method=6)
print("wordmark", img.size)

# ---------------------------------------------------------------- emblem
em = np.array(Image.open(src_dir / "эмблема.png").convert("RGB")).astype(np.float32)
sat, lum = sat_lum(em)
fgmask = (lum < 205) | (sat > 0.10)
fgmask = ndi.binary_opening(fgmask, iterations=3)
fgmask = ndi.binary_fill_holes(fgmask)
# keep only the biggest component (drops speckles of the checkerboard noise)
lab, n = ndi.label(fgmask)
sizes = ndi.sum(fgmask, lab, range(1, n + 1))
fgmask = lab == (1 + int(np.argmax(sizes)))
fgmask = ndi.binary_fill_holes(fgmask)
alpha_img = Image.fromarray((fgmask * 255).astype(np.uint8), "L").filter(ImageFilter.GaussianBlur(1.1))
alpha = np.array(alpha_img).astype(np.float32) / 255
bg = 246.0
a3 = np.clip(alpha, 0.001, 1)[..., None]
fg = np.clip((em - bg * (1 - a3)) / a3, 0, 255)
rgba = np.dstack([fg, alpha * 255]).astype(np.uint8)
img = Image.fromarray(rgba, "RGBA")
bbox = img.getchannel("A").point(lambda v: 255 if v > 8 else 0).getbbox()
img = img.crop(bbox)
side = max(img.size)
sq = Image.new("RGBA", (side, side), (0, 0, 0, 0))
sq.paste(img, ((side - img.width) // 2, (side - img.height) // 2))
sq.save(out_dir / "emblem.png", optimize=True)
for s in (512, 192, 96):
    sq.resize((s, s), Image.LANCZOS).save(out_dir / f"emblem-{s}.png", optimize=True)
sq.resize((512, 512), Image.LANCZOS).save(out_dir / "emblem.webp", quality=92, method=6)
print("emblem", sq.size)
