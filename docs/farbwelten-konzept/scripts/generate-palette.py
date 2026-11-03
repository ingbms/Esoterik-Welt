#!/usr/bin/env python3
"""Erzeugt die Farbwelt-Paletten und rechnet alle WCAG-Kontraste tatsaechlich.

Keine Handwerte: Die Toene werden in OKLCH konstruiert (gleiche wahrgenommene
Helligkeit je Rolle), in sRGB gamut-gemappt und anschliessend mit der
WCAG-2.x-Formel gegen die real verwendeten Flaechen gemessen.

Ausgabe:
  docs/farbwelten-konzept/messung/palette.json
  docs/farbwelten-konzept/mockup/palette.css   (nur Variablen, damit Mockup und
                                                Doku nicht auseinanderlaufen)

Aufruf: python docs/farbwelten-konzept/scripts/generate-palette.py
"""

from __future__ import annotations

import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # docs/farbwelten-konzept

# --- Flaechen und Textfarben des bestehenden Nachtatelier-Systems -------------
BG_DEEP = "#0b1012"
BG_CARD = "#141c1f"
BG_HOVER = "#1a2427"
TEXT_PRIMARY = "#eae6dc"
TEXT_SECONDARY = "#babdb7"
SAND = "#c6b38e"
SAND_HOVER = "#d5c4a2"
LINE_STRONG = "#82928e"
BORDER = "#3c484b"

# Rollen-Helligkeiten (OKLCH L) der Standardpalette.
DEFAULT_LEVELS = {"ink": 0.64, "line": 0.50, "core": 0.56, "core-deep": 0.44, "soft": 0.74}

# --- Farbwelten in Registerreihenfolge (Master-Auftrag §5) -------------------
# id, Name, Hue (OKLCH), Typ, Chroma-Skala, Rollen-Helligkeiten (optional)
WORLDS = [
    ("rot", "Rot", 27.0, "spectral", 1.0, None),
    ("orange", "Orange", 55.0, "spectral", 1.0, None),
    ("gelb", "Gelb", 96.0, "spectral", 1.0, None),
    ("gruen", "Grün", 148.0, "spectral", 1.0, None),
    # Türkis ist Spektralfarbe im Übergangsbereich (ca. 490–520 nm, Konvention).
    ("tuerkis", "Türkis", 195.0, "spectral", 1.0, None),
    ("blau", "Blau", 248.0, "spectral", 1.0, None),
    ("indigo", "Indigo", 285.0, "spectral", 1.0, None),
    ("violett", "Violett", 318.0, "spectral", 1.0, None),
    # Nicht spektral: additiver Rot-Blau-Mix, keine eigene Wellenlänge.
    ("magenta", "Magenta", 345.0, "non-spectral", 1.0, None),
    ("rosa", "Rosa", 0.0, "non-spectral", 0.62, {"ink": 0.70, "line": 0.56}),
    # Neutral: keine Wellenlänge. Die Hue dient nur dem warmen Grau des Systems.
    ("weiss", "Weiß", 90.0, "neutral", 0.16, {"ink": 0.82, "line": 0.66, "core": 0.94, "core-deep": 0.87, "soft": 0.98}),
    ("schwarz", "Schwarz", 90.0, "neutral", 0.16, {"ink": 0.74, "line": 0.46, "core": 0.32, "core-deep": 0.23, "soft": 0.44}),
]


# --- Farbmathematik -----------------------------------------------------------
def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))


def srgb_to_linear(channel: float) -> float:
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def linear_to_srgb(channel: float) -> float:
    return 12.92 * channel if channel <= 0.0031308 else 1.055 * channel ** (1 / 2.4) - 0.055


def luminance(hex_value: str) -> float:
    r, g, b = (srgb_to_linear(c / 255) for c in hex_to_rgb(hex_value))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = luminance(a), luminance(b)
    lighter, darker = max(la, lb), min(la, lb)
    return (lighter + 0.05) / (darker + 0.05)


def oklch_to_srgb(L: float, C: float, h_deg: float) -> tuple[float, float, float]:
    h = math.radians(h_deg)
    a, b = C * math.cos(h), C * math.sin(h)
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_**3, m_**3, s_**3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, bb


def in_gamut(rgb: tuple[float, float, float], eps: float = 1e-4) -> bool:
    return all(-eps <= c <= 1 + eps for c in rgb)


def oklch_hex(L: float, C: float, h: float) -> str | None:
    """Gamut-Mapping durch Chroma-Reduktion; None, wenn selbst C=0 nicht passt."""
    chroma = C
    while chroma >= 0:
        rgb = oklch_to_srgb(L, chroma, h)
        if in_gamut(rgb):
            channels = [round(linear_to_srgb(min(max(c, 0.0), 1.0)) * 255) for c in rgb]
            return "#" + "".join(f"{c:02x}" for c in channels)
        chroma = round(chroma - 0.002, 4)
    return None


def max_chroma(L: float, h: float, cap: float = 0.30) -> float:
    chroma = 0.0
    step = 0.002
    while chroma + step <= cap:
        if not in_gamut(oklch_to_srgb(L, chroma + step, h)):
            break
        chroma += step
    return round(chroma, 3)


# --- Palettenkonstruktion ----------------------------------------------------
def build_world(world_id: str, name: str, h: float, kind: str, scale: float, levels: dict | None) -> dict:
    role = dict(DEFAULT_LEVELS)
    role.update(levels or {})

    # Tiefe, getoente Flaeche: bleibt im Nachtraum, traegt aber den Farbton.
    deep = oklch_hex(0.225, 0.028 * max(scale, 0.5), h)
    deep_alt = oklch_hex(0.19, 0.022 * max(scale, 0.5), h)  # Verlaufstiefe / Hero-Rand
    assert deep and deep_alt

    # Ink: Textfarbe der Farbwelt. Startwert - so gedeckt wie moeglich, aber auf
    # allen drei dunklen Flaechen >= 4.6:1 (Puffer ueber AA).
    ink_L, ink_hex = role["ink"], None
    while ink_L <= 0.95:
        candidate = oklch_hex(ink_L, min(0.13 * scale, max_chroma(ink_L, h) * 0.85), h)
        if candidate and min(
            contrast(candidate, BG_DEEP), contrast(candidate, BG_CARD), contrast(candidate, deep)
        ) >= 4.6:
            ink_hex = candidate
            break
        ink_L = round(ink_L + 0.01, 2)
    if ink_hex is None:
        raise SystemExit(f"Kein AA-taugliches Ink fuer {name}")

    # Line: funktionale Linie, Ziel >= 3.2:1 auf getoenter und auf Kartenflaeche.
    line_L, line_hex = role["line"], None
    while line_L <= 0.95:
        candidate = oklch_hex(line_L, min(0.08 * scale, max_chroma(line_L, h) * 0.65), h)
        if candidate and contrast(candidate, deep) >= 3.2 and contrast(candidate, BG_CARD) >= 3.2:
            line_hex = candidate
            break
        line_L = round(line_L + 0.01, 2)
    if line_hex is None:
        raise SystemExit(f"Keine 3:1-Linie fuer {name}")

    # Core: Pigmentflaeche fuer grosse Felder, nie fuer Pflichttext.
    core = oklch_hex(role["core"], min(0.15 * scale, max_chroma(role["core"], h) * 0.95), h)
    core_deep = oklch_hex(role["core-deep"], min(0.11 * scale, max_chroma(role["core-deep"], h) * 0.9), h)
    soft = oklch_hex(role["soft"], min(0.075 * scale, max_chroma(role["soft"], h) * 0.8), h)
    assert core and core_deep and soft

    pairs = {
        "ink_auf_bg_deep": contrast(ink_hex, BG_DEEP),
        "ink_auf_bg_card": contrast(ink_hex, BG_CARD),
        "ink_auf_deep": contrast(ink_hex, deep),
        "text_primary_auf_deep": contrast(TEXT_PRIMARY, deep),
        "text_secondary_auf_deep": contrast(TEXT_SECONDARY, deep),
        "line_auf_deep": contrast(line_hex, deep),
        "line_auf_bg_card": contrast(line_hex, BG_CARD),
        "core_auf_bg_deep": contrast(core, BG_DEEP),
        "core_auf_bg_card": contrast(core, BG_CARD),
        "core_deep_auf_bg_card": contrast(core_deep, BG_CARD),
        "bg_deep_auf_ink": contrast(BG_DEEP, ink_hex),
        "sand_auf_deep": contrast(SAND, deep),
    }
    checks = {
        "ink_text_aa": pairs["ink_auf_deep"] >= 4.5
        and pairs["ink_auf_bg_deep"] >= 4.5
        and pairs["ink_auf_bg_card"] >= 4.5,
        "body_on_deep_aa": pairs["text_primary_auf_deep"] >= 4.5
        and pairs["text_secondary_auf_deep"] >= 4.5,
        "line_nontext_3to1": pairs["line_auf_deep"] >= 3.0
        and pairs["line_auf_bg_card"] >= 3.0,
        "button_label_aa": pairs["bg_deep_auf_ink"] >= 4.5,
        "sand_on_deep_aa": pairs["sand_auf_deep"] >= 4.5,
    }
    return {
        "id": world_id,
        "name": name,
        "type": kind,
        "hue_oklch": h,
        "tokens": {
            "ink": ink_hex,
            "core": core,
            "core-deep": core_deep,
            "soft": soft,
            "line": line_hex,
            "deep": deep,
            "deep-alt": deep_alt,
        },
        "contrast": {k: round(v, 2) for k, v in pairs.items()},
        # Abgrenzung der Farbflaeche zum Seitenhintergrund. Fuer Schwarz ist
        # 3:1 gegen einen fast schwarzen Grund physikalisch unerreichbar; dort
        # trennt der 1-px-Rahmen (--color-line-strong) die Flaeche.
        "swatch_separation": {
            "core_auf_bg_deep": round(pairs["core_auf_bg_deep"], 2),
            "core_auf_bg_card": round(pairs["core_auf_bg_card"], 2),
            "line_strong_auf_bg_deep": round(contrast(LINE_STRONG, BG_DEEP), 2),
            "hinweis": (
                "Flaeche wird zusaetzlich durch 1-px-Rahmen --color-line-strong begrenzt"
                if pairs["core_auf_bg_deep"] < 3.0
                else "Flaeche hebt sich ohne Rahmen ab"
            ),
        },
        "checks": checks,
    }


def wavelength_to_hex(nm: float) -> str:
    """Naeherung nach Bruton; ausdruecklich Simulation, keine Kolorimetrie."""
    if 380 <= nm < 440:
        r, g, b = -(nm - 440) / 60, 0.0, 1.0
    elif 440 <= nm < 490:
        r, g, b = 0.0, (nm - 440) / 50, 1.0
    elif 490 <= nm < 510:
        r, g, b = 0.0, 1.0, -(nm - 510) / 20
    elif 510 <= nm < 580:
        r, g, b = (nm - 510) / 70, 1.0, 0.0
    elif 580 <= nm < 645:
        r, g, b = 1.0, -(nm - 645) / 65, 0.0
    elif 645 <= nm <= 780:
        r, g, b = 1.0, 0.0, 0.0
    else:
        r = g = b = 0.0
    if nm < 420:
        factor = 0.3 + 0.7 * (nm - 380) / 40
    elif nm > 700:
        factor = 0.3 + 0.7 * (780 - nm) / 80
    else:
        factor = 1.0
    r, g, b = ((v * factor) for v in (r, g, b))
    if nm < 380 or nm > 780:
        return "#000000"
    gamma = 0.8
    channels = [round((max(c, 0.0) ** gamma) * 255) for c in (r, g, b)]
    return "#" + "".join(f"{c:02x}" for c in channels)


def main() -> None:
    worlds = [build_world(i, n, h, k, s, lv) for i, n, h, k, s, lv in WORLDS]

    spectrum = []
    for nm in range(380, 781, 20):
        spectrum.append({"nm": nm, "hex": wavelength_to_hex(float(nm))})

    base = {
        "bg_deep": BG_DEEP,
        "bg_card": BG_CARD,
        "bg_hover": BG_HOVER,
        "text_primary": TEXT_PRIMARY,
        "text_secondary": TEXT_SECONDARY,
        "sand": SAND,
        "sand_hover": SAND_HOVER,
        "line_strong": LINE_STRONG,
        "border": BORDER,
        "base_contrast": {
            "text_primary_auf_bg_deep": round(contrast(TEXT_PRIMARY, BG_DEEP), 2),
            "text_secondary_auf_bg_deep": round(contrast(TEXT_SECONDARY, BG_DEEP), 2),
            "sand_auf_bg_deep": round(contrast(SAND, BG_DEEP), 2),
            "text_primary_auf_bg_card": round(contrast(TEXT_PRIMARY, BG_CARD), 2),
            "text_secondary_auf_bg_card": round(contrast(TEXT_SECONDARY, BG_CARD), 2),
            "sand_auf_bg_card": round(contrast(SAND, BG_CARD), 2),
            "line_strong_auf_bg_deep": round(contrast(LINE_STRONG, BG_DEEP), 2),
            "border_auf_bg_deep": round(contrast(BORDER, BG_DEEP), 2),
        },
    }

    result = {
        "generated_by": "docs/farbwelten-konzept/scripts/generate-palette.py",
        "method": "OKLCH-Konstruktion, Gamut-Mapping per Chroma-Reduktion, WCAG-2.x-Kontrastformel",
        "base": base,
        "worlds": worlds,
        "spectrum_simulation": spectrum,
        "notes": [
            "Hex-Werte sind sRGB. Ein Bildschirm kann Spektralfarben nur naehern.",
            "core-Swatch ist eine Flaeche, kein Textgrund fuer Pflichtinformation.",
            "Alle Textwerte erreichen mindestens 4.5:1 auf ihrer getoenten Flaeche.",
            "Nichtspektrale und neutrale Farben haben keine Wellenlaengen-Rolle; ihre Tokens sind reine Flaechenfarben.",
        ],
    }
    (ROOT / "messung").mkdir(parents=True, exist_ok=True)
    (ROOT / "messung" / "palette.json").write_text(
        json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    lines = ["/* Automatisch erzeugt von scripts/generate-palette.py - nicht von Hand editieren. */", ":root {"]
    for world in worlds:
        for role, value in world["tokens"].items():
            lines.append(f"  --fw-{world['id']}-{role}: {value};")
    lines.append("}")
    (ROOT / "mockup").mkdir(parents=True, exist_ok=True)
    (ROOT / "mockup" / "palette.css").write_text("\n".join(lines) + "\n", encoding="utf-8")

    failures = [w["id"] for w in worlds if not all(w["checks"].values())]
    print(json.dumps({"worlds": len(worlds), "failures": failures}, indent=2))
    for world in worlds:
        t, c = world["tokens"], world["contrast"]
        print(
            f"{world['name']:<8} ink {t['ink']} ({c['ink_auf_deep']:.2f}:1 auf deep)  "
            f"core {t['core']} ({c['core_auf_bg_deep']:.2f}:1 auf bg-deep)  "
            f"line {t['line']} ({c['line_auf_deep']:.2f}:1)  deep {t['deep']}"
        )
    if failures:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
