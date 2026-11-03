#!/usr/bin/env python3
"""Schreibt die Tabellen der Palettendokumentation aus messung/palette.json.

Keine Werte werden hier von Hand getippt: Rollen, Hex-Werte und Kontraste
stammen aus dem Generatorlauf und dem WCAG-Rechner.
"""

from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = json.loads((ROOT / "messung" / "palette.json").read_text(encoding="utf-8"))


def table_worlds(worlds: list[dict]) -> str:
    lines = [
        "| Farbwelt | `-ink` Text | `-core` Fläche | `-core-deep` | `-soft` | `-line` | `-deep` Fläche | `-deep-alt` |",
        "| --- | --- | --- | --- | --- | --- | --- | --- |",
    ]
    for world in worlds:
        t = world["tokens"]
        lines.append(
            f"| {world['name']} | `{t['ink']}` | `{t['core']}` | `{t['core-deep']}` | "
            f"`{t['soft']}` | `{t['line']}` | `{t['deep']}` | `{t['deep-alt']}` |"
        )
    return "\n".join(lines)


def table_contrast(worlds: list[dict]) -> str:
    lines = [
        "| Farbwelt | Ink auf `#0b1012` | Ink auf `#141c1f` | Ink auf eigenem `-deep` | "
        "Text primär auf `-deep` | Text sekundär auf `-deep` | Linie auf `-deep` | Linie auf `#141c1f` |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for world in worlds:
        c = world["contrast"]
        lines.append(
            f"| {world['name']} | {c['ink_auf_bg_deep']:.2f}:1 | {c['ink_auf_bg_card']:.2f}:1 | "
            f"{c['ink_auf_deep']:.2f}:1 | {c['text_primary_auf_deep']:.2f}:1 | "
            f"{c['text_secondary_auf_deep']:.2f}:1 | {c['line_auf_deep']:.2f}:1 | "
            f"{c['line_auf_bg_card']:.2f}:1 |"
        )
    return "\n".join(lines)


def table_checks(worlds: list[dict]) -> str:
    lines = [
        "| Farbwelt | Ink ≥ 4,5:1 (drei Flächen) | Fließtext ≥ 4,5:1 | Linie ≥ 3:1 | Buttonlabel ≥ 4,5:1 | Sand auf `-deep` ≥ 4,5:1 |",
        "| --- | :---: | :---: | :---: | :---: | :---: |",
    ]
    labels = {
        "ink_text_aa": "ja",
        "body_on_deep_aa": "ja",
        "line_nontext_3to1": "ja",
        "button_label_aa": "ja",
        "sand_on_deep_aa": "ja",
    }
    for world in worlds:
        cells = " | ".join("ja" if world["checks"][key] else "**nein**" for key in labels)
        lines.append(f"| {world['name']} | {cells} |")
    return "\n".join(lines)


def table_spectrum(stops: list[dict]) -> str:
    parts = [f"{stop['nm']} nm `{stop['hex']}`" for stop in stops]
    return " · ".join(parts)


def main() -> None:
    base = DATA["base"]
    base_contrast = base["base_contrast"]
    parts = [
        "<!-- Automatisch erzeugt von scripts/render-tables.py - nicht von Hand editieren. -->",
        "",
        "## A. Palettenrollen je Farbwelt",
        "",
        table_worlds(DATA["worlds"]),
        "",
        "## B. Gemessene Kontraste (WCAG-Formel)",
        "",
        table_contrast(DATA["worlds"]),
        "",
        "## C. Prüfentscheid je Farbwelt",
        "",
        table_checks(DATA["worlds"]),
        "",
        "## D. Ausbaustufe 2 (vorbereitet, nicht Teil der ersten Lieferung)",
        "",
        table_worlds(DATA["phase2"]),
        "",
        "## E. Bestehende Systemflächen (unverändert)",
        "",
        "| Paar | Kontrast |",
        "| --- | ---: |",
    ]
    for key, value in base_contrast.items():
        parts.append(f"| {key.replace('_', ' ')} | {value:.2f}:1 |")
    parts += [
        "",
        "## F. Spektrum-Simulation (Wellenlänge → sRGB, Bruton-Näherung)",
        "",
        table_spectrum(DATA["spectrum_simulation"]),
        "",
        "> Die Simulation ist eine Bildschirmannäherung, keine kolorimetrische Umrechnung.",
        "",
    ]
    out = ROOT / "messung" / "palette-tabellen.md"
    out.write_text("\n".join(parts), encoding="utf-8")
    print(out)


if __name__ == "__main__":
    main()
