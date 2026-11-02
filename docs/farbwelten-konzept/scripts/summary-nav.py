#!/usr/bin/env python3
"""Fasst die Kopfzeilenmessung als Tabelle zusammen (Reserve je Serie)."""

from __future__ import annotations

import json
import sys
from pathlib import Path

path = Path(sys.argv[1] if len(sys.argv) > 1 else "docs/farbwelten-konzept/messung/nav-9-ziele-farben.json")
data = json.loads(path.read_text(encoding="utf-8"))
series = [
    ("withoutNinth", "8 Ziele, Zähler ♥0"),
    ("counterBaseline", "8 Ziele, Zähler ♥128"),
    ("withNinth", "9 Ziele, Zähler ♥0"),
    ("counter3", "9 Ziele, Zähler ♥128"),
    ("counter3Compacted", "9 Ziele, ♥128 + Regel 781–900"),
    ("withNinthCompacted", "9 Ziele, ♥0 + Regel 12 px"),
]
widths = [row["viewport"] for row in data["withoutNinth"]]
print(f"Label: {data['label']} | Basis: {data['base']}")
print("| Breite | " + " | ".join(title for _, title in series) + " |")
print("| ---: | " + " | ".join("---:" for _ in series) + " |")
for index, width in enumerate(widths):
    cells = []
    for key, _ in series:
        row = data[key][index]
        cells.append(f"{row['reserve']:.2f} px ({row['counterText']})")
    print(f"| {width} | " + " | ".join(cells) + " |")
print()
print("Mobilmenü 390 px:", json.dumps(data.get("mobileMenu"), ensure_ascii=False))
print("Konsolenfehler:", data.get("consoleErrors"))
