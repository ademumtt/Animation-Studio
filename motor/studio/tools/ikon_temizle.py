"""Yuvarlak ikon (orn. WhatsApp) etrafindaki beyaz/gri zemini kaldirir, buyutur, kenari yumusak seffaf PNG yapar.

Kullanim: uv run tools/ikon_temizle.py <girdi.png> <cikti.png> [boyut=512]
"""
# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow", "numpy"]
# ///
import sys
import numpy as np
from PIL import Image

src, dst = sys.argv[1], sys.argv[2]
size = int(sys.argv[3]) if len(sys.argv) > 3 else 512
im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# renkli (doygun) pikseller = ikon govdesi
sat = a.max(-1) - a.min(-1)
mask = sat > 60
ys, xs = np.nonzero(mask)
cx, cy = xs.mean(), ys.mean()
rad = np.sqrt(mask.sum() / np.pi)  # dolu daire varsayimi (ic beyaz telefon hari tutuldugu icin hafif kucuk)
rad = max(rad, (xs.max() - xs.min() + ys.max() - ys.min()) / 4)
print(f"merkez=({cx:.1f},{cy:.1f}) yaricap={rad:.1f}")

# kareyi daireye gore kirp, buyut
pad = rad * 1.02
box = (cx - pad, cy - pad, cx + pad, cy + pad)
big = im.crop(tuple(int(round(v)) for v in box)).resize((size, size), Image.LANCZOS)
# yumusak kenarli daire maskesi (2x supersample)
s2 = size * 4
yy, xx = np.mgrid[0:s2, 0:s2]
d = np.sqrt((xx - s2 / 2 + 0.5) ** 2 + (yy - s2 / 2 + 0.5) ** 2)
R = s2 / 2 * (rad / pad) * 0.985
alpha = np.clip((R - d) / 3 + 0.5, 0, 1)
alpha = Image.fromarray((alpha * 255).astype(np.uint8)).resize((size, size), Image.LANCZOS)
out = big.convert("RGBA")
out.putalpha(alpha)
out.save(dst)
print("yazildi:", dst)
