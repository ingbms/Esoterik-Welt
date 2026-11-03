#!/usr/bin/env python3
"""Schritt 5: Kontrollvorschauen fuer die visuelle Pruefung erzeugen.

Die Vorschauen liegen nur im Scratch-Verzeichnis; sie sind kein Deliverable.
Die volle Aufloesung wird dabei nicht beschnitten, nur skaliert.

Aufruf: python make_previews.py <media-dir> <out-dir> [max-kante]
"""
import os
import sys

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None


def main():
    media_dir, out_dir = sys.argv[1], sys.argv[2]
    edge = int(sys.argv[3]) if len(sys.argv) > 3 else 900
    os.makedirs(out_dir, exist_ok=True)
    src_dir = os.path.join(media_dir, "original")
    for name in sorted(os.listdir(src_dir)):
        path = os.path.join(src_dir, name)
        with Image.open(path) as im:
            im = ImageOps.exif_transpose(im)
            info = f"{name}: {im.format} {im.mode} {im.size} icc={'ja' if im.info.get('icc_profile') else 'nein'}"
            preview = im.convert("RGB")
            preview.thumbnail((edge, edge), Image.LANCZOS)
            dest = os.path.join(out_dir, os.path.splitext(name)[0] + "-preview.jpg")
            preview.save(dest, "JPEG", quality=88)
            print(info + f" -> {dest}")


if __name__ == "__main__":
    main()
