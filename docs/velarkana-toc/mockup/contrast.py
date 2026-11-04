"""Kontrastmessung für das TOC-Design (WCAG 2.x, sRGB).

Quellen der Werte: css/design-system.css (:root) und der Light-Reserve-Block
[data-theme='light'] derselben Datei. Ausgabe als JSON für das Design-Dokument.
"""

from __future__ import annotations

import json
from pathlib import Path

OUT = Path(__file__).resolve().parent / "kontrast.json"


def srgb_to_lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def lum(hex_color: str) -> float:
    h = hex_color.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)


def ratio(a: str, b: str) -> float:
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return round((hi + 0.05) / (lo + 0.05), 2)


DARK = {
    "bg-deep": "#0b1012",
    "bg-card": "#141c1f",
    "text-primary": "#eae6dc",
    "text-secondary": "#babdb7",
    "primary": "#c6b38e",
    "border": "#3c484b",
    "line-strong": "#82928e",
}

LIGHT = {
    "bg-deep": "#f8f5fc",
    "bg-card": "#ffffff",
    "text-primary": "#2d1b47",
    "text-secondary": "#5a4a7a",
    "primary": "#7041a6",
    "border": "#d4c4e8",
    "line-strong": "#bb86fc",
}


def pairs(palette: dict) -> list[dict]:
    rows = [
        ("Link (Ruhezustand)", palette["text-secondary"], palette["bg-deep"], 4.5, "Text auf Seitenfläche (Rail)"),
        ("Link (Ruhezustand, Inline)", palette["text-secondary"], palette["bg-card"], 4.5, "Text auf Karte (Panel < 1200 px)"),
        ("Link (Hover)", palette["primary"], palette["bg-deep"], 4.5, "Hover-Farbe"),
        ("Link (Hover, Inline)", palette["primary"], palette["bg-card"], 4.5, "Hover im Panel"),
        ("Aktiver Link", palette["text-primary"], palette["bg-deep"], 4.5, "aria-current='location'"),
        ("Aktiver Link (Inline)", palette["text-primary"], palette["bg-card"], 4.5, "aria-current im Panel"),
        ("Rail-Titel / Summary", palette["text-secondary"], palette["bg-deep"], 4.5, "Label „Auf dieser Seite“"),
        ("Rail-Titel / Summary (Inline)", palette["text-secondary"], palette["bg-card"], 4.5, "Label im Panel"),
        ("Fokusring", palette["text-primary"], palette["bg-deep"], 3.0, "2-px-Ring, angrenzend an Seitenfläche"),
        ("Fokusring (Inline)", palette["text-primary"], palette["bg-card"], 3.0, "2-px-Ring im Panel"),
        ("Aktivmarke (2-px-Balken)", palette["primary"], palette["bg-deep"], 3.0, "Nicht-textlicher Indikator"),
        ("Aktivmarke (Inline)", palette["primary"], palette["bg-card"], 3.0, "Nicht-textlicher Indikator im Panel"),
        ("Trennlinie Rail (dekorativ)", palette["border"], palette["bg-deep"], 3.0, "1-px-Rahmen, rein dekorativ"),
        ("Panel-Rahmen (funktional)", palette["line-strong"], palette["bg-deep"], 3.0, "Rahmen der Disclosure, `--color-line-strong`"),
        ("Panel-Rahmen (auf Karte)", palette["line-strong"], palette["bg-card"], 3.0, "Rahmen gegen eigene Fläche"),
    ]
    return [
        {
            "pair": name,
            "fg": fg,
            "bg": bg,
            "ratio": ratio(fg, bg),
            "target": target,
            "pass": ratio(fg, bg) >= target,
            "use": use,
        }
        for name, fg, bg, target, use in rows
    ]


result = {"dark": pairs(DARK), "light_reserve": pairs(LIGHT)}
OUT.write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
for theme, rows in result.items():
    print(theme)
    for row in rows:
        flag = "OK " if row["pass"] else "NICHT ERFÜLLT"
        print(f"  {flag:12s} {row['ratio']:5.2f}:1  {row['pair']}")
