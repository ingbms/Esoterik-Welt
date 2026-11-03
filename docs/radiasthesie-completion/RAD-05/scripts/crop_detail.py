#!/usr/bin/env python3
"""Detailausschnitt fuer die Lesbarkeitspruefung (Logo/Schrift) erzeugen.

Aufruf: python crop_detail.py <quelle> <ziel> x1 y1 x2 y2
"""
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

src, dest = sys.argv[1], sys.argv[2]
x1, y1, x2, y2 = (int(v) for v in sys.argv[3:7])
with Image.open(src) as im:
    crop = im.convert("RGB").crop((x1, y1, x2, y2))
    crop.save(dest, "PNG")
    print(f"Ausschnitt {crop.size} aus {im.size} -> {dest}")
