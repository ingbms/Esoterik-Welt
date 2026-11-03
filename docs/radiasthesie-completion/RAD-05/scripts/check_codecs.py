#!/usr/bin/env python3
"""Kurzpruefung: welche Bildformate kann die vorhandene Pillow-Installation schreiben?"""
from PIL import Image, features

print("Pillow:", Image.__version__)
for fmt in ("WEBP", "AVIF", "JPEG", "PNG", "JPEG2000"):
    try:
        ok = fmt in Image.SAVE
    except Exception:  # noqa: BLE001
        ok = False
    print(f"  {fmt}: {'schreibbar' if ok else 'nicht schreibbar'}")
for feat in ("webp", "avif", "jpg", "zlib"):
    try:
        print(f"  feature {feat}: {features.check(feat)}")
    except Exception as exc:  # noqa: BLE001
        print(f"  feature {feat}: Pruefung nicht moeglich ({exc.__class__.__name__})")
