#!/usr/bin/env python3
"""Schritt 6: Technische Eigenschaften der Originale fuer die Variantenplanung pruefen.

Fragt je Datei ab, ob ein Alphakanal echte Transparenz enthaelt (dann muss er
erhalten bleiben), ob ein ICC-Profil vorliegt (dann wird es weitergereicht) und
ob das Original gross genug fuer eine 2x-Variante ist.

Aufruf: python plan_variants.py <media-dir>
"""
import os
import sys

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

TARGET_1X = 520   # Breite des Figuren-Slots im bestehenden Datenmodell
TARGET_2X = 1040


def main():
    src_dir = os.path.join(sys.argv[1], "original")
    for name in sorted(os.listdir(src_dir)):
        path = os.path.join(src_dir, name)
        with Image.open(path) as im:
            w, h = im.size
            alpha = None
            if im.mode in ("RGBA", "LA", "P"):
                rgba = im.convert("RGBA")
                lo, hi = rgba.getchannel("A").getextrema()
                alpha = f"alpha min={lo} max={hi} -> {'echte Transparenz' if lo < 255 else 'voll deckend'}"
            has_icc = bool(im.info.get("icc_profile"))
            two_x = w >= TARGET_2X
            print(f"{name}")
            print(f"   Modus {im.mode}, {w}x{h}, ICC={has_icc}, {alpha or 'kein Alphakanal'}")
            print(f"   1x ({TARGET_1X}px): {'ja' if w >= TARGET_1X else 'Original kleiner – auf Originalbreite begrenzen'}")
            print(f"   2x ({TARGET_2X}px): {'ja' if two_x else 'NEIN – Original zu klein, kein Hochskalieren'}")
            print(f"   Hochformat? {h > w}  Seitenverhaeltnis {w / h:.3f}")


if __name__ == "__main__":
    main()
