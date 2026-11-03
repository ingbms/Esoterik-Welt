#!/usr/bin/env python3
"""Abschlusskontrolle: Manifest kompakt ausgeben, damit die Struktur sichtbar geprueft ist."""
import json
import sys

m = json.load(open(sys.argv[1], encoding="utf-8"))
print("schema:", m["schema_version"], "| counts:", m["counts"])
for it in m["items"]:
    v = {f: sum(1 for x in it["varianten"] if x["format"] == f) for f in ("webp", "avif", "png")}
    print(
        f"{it['id']} {it['key']:24s} {it['lizenz']['kurz']:30s} var={v} "
        f"alt={len(it['alt']):3d}Z cap={len(it['caption']):3d}Z sha1={it['original']['sha1'][:10]}"
    )
print()
print("own_assets:")
for a in m["own_assets"]:
    print("  ", a["datei"], a["sicherheitspruefung"])
print()
print("web-Block Beispiel:")
print(json.dumps(m["items"][0]["web"], ensure_ascii=False, indent=1))
print("open_issues:", len(m["open_issues"]))
