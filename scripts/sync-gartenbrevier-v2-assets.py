#!/usr/bin/env python3
"""Ship the approved Gartenbrevier V2 deck as a second, optional site deck.

What this script does — and does not — do:

* copies the 300 px and 600 px web derivatives of ``docs/tarot-deck-v2/web``
  byte-identically into ``assets/tarot/gartenbrevier-v2/{300,600}`` and checks
  every copy against the SHA-256 recorded in the approved package manifest,
* generates the missing 1200 px zoom step as JPEG (quality 84, progressive,
  optimize — the same encoder settings as the approved 300/600 derivatives)
  from the approved 1200 x 2000 card masters; it never redraws, resamples from
  a smaller file or touches the artwork itself,
* measures every shipped file (bytes, SHA-256, pixel size) and writes the
  shipped deck manifest ``assets/tarot/gartenbrevier-v2/manifest.json``.

The deck production folder stays the source of truth. Re-running the script is
idempotent: identical files are reported as unchanged and not rewritten.

Usage:  python scripts/sync-gartenbrevier-v2-assets.py [--check]
        --check verifies the shipped tree against the package without writing.
"""
from __future__ import annotations

import hashlib
import json
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PKG = os.path.join(ROOT, "docs", "tarot-deck-v2")
TARGET = os.path.join(ROOT, "assets", "tarot", "gartenbrevier-v2")
DECK_ID = "gartenbrevier-v2"
LABEL = "Gartenbrevier"
QUALITY = 84
LEVELS = [
    # key, source subfolder inside the package, target folder, target width
    ("thumb", "web/karten-300", "300", 300),
    ("detail", "web/karten-600", "600", 600),
    ("zoom", None, "1200", 1200),
]


def sha256(path: str) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as handle:
        for chunk in iter(lambda: handle.read(1 << 20), b""):
            digest.update(chunk)
    return digest.hexdigest()


def jpeg_size(path: str) -> tuple[int, int]:
    """Read the pixel size from the JPEG SOF marker (baseline + progressive)."""
    with open(path, "rb") as handle:
        data = handle.read()
    if data[0] != 0xFF or data[1] != 0xD8:
        raise ValueError("not a JPEG: " + path)
    offset = 2
    while offset < len(data):
        if data[offset] != 0xFF:
            offset += 1
            continue
        marker = data[offset + 1]
        if marker in (0xD8, 0x01) or 0xD0 <= marker <= 0xD7:
            offset += 2
            continue
        length = int.from_bytes(data[offset + 2 : offset + 4], "big")
        if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
            height = int.from_bytes(data[offset + 5 : offset + 7], "big")
            width = int.from_bytes(data[offset + 7 : offset + 9], "big")
            return width, height
        offset += 2 + length
    raise ValueError("no SOF marker: " + path)


def main() -> int:
    check_only = "--check" in sys.argv
    package_manifest_path = os.path.join(PKG, "manifest.json")
    package_manifest = json.load(open(package_manifest_path, encoding="utf-8"))
    package_files = {
        entry["path"]: entry for entry in package_manifest.get("dateien", []) if "path" in entry
    }
    if not package_files:
        raise SystemExit("package manifest has no file index: " + package_manifest_path)

    identities = json.load(
        open(os.path.join(PKG, "sources", "karten-identitaeten.json"), encoding="utf-8")
    )
    cards_meta = identities.get("rows") or []
    if not cards_meta:
        raise SystemExit("identity source has no card list")
    names = {}
    for card in cards_meta:
        names[int(card["id"])] = {
            "name": card.get("name"),
            "numeral": card.get("rank"),
            "number": card.get("number"),
            "arcana": card.get("arcana"),
            "suit": card.get("suit"),
        }

    problems: list[str] = []
    copied: list[str] = []
    unchanged: list[str] = []
    generated: list[str] = []

    # --- 1) copy the approved 300/600 derivatives, verify against the package
    for _key, source_sub, target_sub, _width in LEVELS[:2]:
        source_dir = os.path.join(PKG, *source_sub.split("/"))
        target_dir = os.path.join(TARGET, target_sub)
        if not os.path.isdir(source_dir):
            problems.append(f"missing package level: {source_sub}")
            continue
        if not check_only:
            os.makedirs(target_dir, exist_ok=True)
        for name in sorted(os.listdir(source_dir)):
            if not name.endswith(".jpg"):
                continue
            source = os.path.join(source_dir, name)
            target = os.path.join(target_dir, name)
            rel = f"{source_sub}/{name}"
            declared = package_files.get(rel)
            actual = sha256(source)
            if declared and declared.get("sha256") and declared["sha256"] != actual:
                problems.append(f"package file differs from its manifest: {rel}")
            if check_only:
                if not os.path.exists(target):
                    problems.append(f"missing shipped file: {target_sub}/{name}")
                elif sha256(target) != actual:
                    problems.append(f"shipped copy differs: {target_sub}/{name}")
                continue
            if os.path.exists(target) and sha256(target) == actual:
                unchanged.append(f"{target_sub}/{name}")
                continue
            with open(source, "rb") as reader, open(target, "wb") as writer:
                writer.write(reader.read())
            if sha256(target) != actual:
                problems.append(f"hash mismatch after copy: {target_sub}/{name}")
            copied.append(f"{target_sub}/{name}")

    # --- 2) generate the 1200 px zoom step from the approved masters
    zoom_dir = os.path.join(TARGET, "1200")
    if not check_only:
        os.makedirs(zoom_dir, exist_ok=True)
    masters = [("Ruecken", "Ruecken")] + [(f"{cid:02d}", f"{cid:02d}") for cid in range(78)]
    for source_name, target_name in masters:
        source = os.path.join(PKG, "karten", source_name + ".png")
        target = os.path.join(zoom_dir, target_name + ".jpg")
        if not os.path.exists(source):
            problems.append(f"missing master: karten/{source_name}.png")
            continue
        if check_only:
            if not os.path.exists(target):
                problems.append(f"missing shipped zoom: 1200/{target_name}.jpg")
            continue
        with Image.open(source) as image:
            if image.size != (1200, 2000):
                problems.append(f"master is not 1200x2000: karten/{source_name}.png {image.size}")
            rgb = image.convert("RGB")
        if os.path.exists(target):
            with Image.open(target) as existing:
                if existing.size == (1200, 2000):
                    # Regenerate only when the encoded bytes would be identical:
                    # compare against a fresh encode in memory (kein stiller Drift).
                    import io

                    buffer = io.BytesIO()
                    rgb.save(buffer, "JPEG", quality=QUALITY, optimize=True, progressive=True)
                    if buffer.getvalue() == open(target, "rb").read():
                        unchanged.append(f"1200/{target_name}.jpg")
                        continue
        rgb.save(target, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        generated.append(f"1200/{target_name}.jpg")

    if check_only:
        report = {"ok": not problems, "mode": "check", "problems": problems}
        print(json.dumps(report, indent=1, ensure_ascii=False))
        return 0 if report["ok"] else 1

    # --- 3) measure everything and write the shipped manifest
    cards = []
    for cid in range(78):
        files = {}
        for key, _source_sub, target_sub, width in LEVELS:
            name = f"{cid:02d}.jpg"
            path = os.path.join(TARGET, target_sub, name)
            if not os.path.exists(path):
                problems.append(f"missing shipped file: {target_sub}/{name}")
                continue
            measured = jpeg_size(path)
            if measured[0] != width or measured[0] * 5 != measured[1] * 3:
                problems.append(f"unexpected size {target_sub}/{name}: {measured}")
            files[key] = {
                "path": f"{target_sub}/{name}",
                "bytes": os.path.getsize(path),
                "sha256": sha256(path),
                "size": [measured[0], measured[1]],
            }
        meta = names.get(cid, {})
        cards.append({"id": cid, **meta, "files": files})

    back_files = {}
    for key, _source_sub, target_sub, width in LEVELS:
        path = os.path.join(TARGET, target_sub, "Ruecken.jpg")
        if not os.path.exists(path):
            problems.append(f"missing back: {target_sub}/Ruecken.jpg")
            continue
        measured = jpeg_size(path)
        if measured[0] != width or measured[0] * 5 != measured[1] * 3:
            problems.append(f"unexpected back size {target_sub}/Ruecken.jpg: {measured}")
        back_files[key] = {
            "path": f"{target_sub}/Ruecken.jpg",
            "bytes": os.path.getsize(path),
            "sha256": sha256(path),
            "size": [measured[0], measured[1]],
        }

    ids = [card["id"] for card in cards]
    if ids != list(range(78)):
        problems.append("card ids are not 0..77")
    if sum(1 for card in cards if card.get("arcana") == "major") != 22:
        problems.append("major arcana count is not 22")
    for suit in ("wands", "cups", "swords", "pentacles"):
        if sum(1 for card in cards if card.get("suit") == suit) != 14:
            problems.append(f"suit {suit} count is not 14")

    total_bytes = sum(
        entry["bytes"] for card in cards for entry in card["files"].values()
    ) + sum(entry["bytes"] for entry in back_files.values())

    manifest = {
        "deck_id": DECK_ID,
        "label": LABEL,
        "version": str(package_manifest.get("stand", "")),
        "card_count": len(cards),
        "aspect": "3:5",
        "color_space": "sRGB",
        "levels": {"thumb": "300", "detail": "600", "zoom": "1200"},
        "source_package": "docs/tarot-deck-v2",
        "source_manifest_sha256": sha256(package_manifest_path),
        "derivation": {
            "thumb": "byte-identical copy of web/karten-300",
            "detail": "byte-identical copy of web/karten-600",
            "zoom": "JPEG quality 84, progressive, optimize, encoded from karten/NN.png (1200x2000)",
        },
        "total_bytes": total_bytes,
        "back": {"files": back_files},
        "cards": cards,
    }

    if problems:
        print(json.dumps({"ok": False, "problems": problems}, indent=1, ensure_ascii=False))
        return 1

    out = os.path.join(TARGET, "manifest.json")
    with open(out, "w", encoding="utf-8") as handle:
        json.dump(manifest, handle, indent=1, ensure_ascii=False)
        handle.write("\n")

    print(
        json.dumps(
            {
                "ok": True,
                "copied": len(copied),
                "unchanged": len(unchanged),
                "generated": len(generated),
                "cards": len(cards),
                "total_bytes": total_bytes,
                "manifest_sha256": sha256(out),
            },
            indent=1,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
