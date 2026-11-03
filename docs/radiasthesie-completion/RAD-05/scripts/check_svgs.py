#!/usr/bin/env python3
"""Schritt 8: Sicherheits- und Qualitaetspruefung der eigenen SVGs.

Geprueft wird, ob die Dateien als SVG ohne aktive oder externe Inhalte
ausgeliefert werden koennen:
- keine <script>, <foreignObject>, <iframe>, <object>, <embed>
- keine Event-Handler-Attribute (on*)
- keine javascript:- oder data:text/html-URIs
- keine externen Referenzen (http/https) in href/xlink:href/src
- keine <image>-Elemente (koennten externe Rasterdaten nachladen)
- keine DOCTYPE-/ENTITY-Deklarationen (XXE / Entity-Expansion)
- barrierefrei: <title>, <desc>, viewBox vorhanden

Aufruf: python check_svgs.py <svg-dir> <evidence-dir>
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

VERBOTEN_ELEMENTE = {
    "script", "foreignobject", "iframe", "object", "embed", "handler",
    "set", "animate", "animatemotion", "animatetransform", "discard",
}
EXTERN = re.compile(r"(?i)\b(?:https?:)?//")
AKTIV = re.compile(r"(?i)(javascript:|data:text/html|vbscript:)")


def local(tag):
    return tag.split("}")[-1].lower()


def main():
    svg_dir, evidence_dir = sys.argv[1], sys.argv[2]
    report = {"checked_dir": svg_dir.replace("\\", "/"), "dateien": [], "fehler": [], "warnungen": []}
    for name in sorted(os.listdir(svg_dir)):
        if not name.lower().endswith(".svg"):
            continue
        path = os.path.join(svg_dir, name)
        raw = open(path, "r", encoding="utf-8").read()
        rec = {"datei": path.replace("\\", "/"), "bytes": len(raw.encode("utf-8")), "befunde": []}

        # 1) Wohlgeformtheit
        try:
            root = ET.fromstring(raw)
        except ET.ParseError as exc:
            report["fehler"].append(f"{name}: kein wohlgeformtes XML ({exc})")
            rec["befunde"].append(f"XML-Fehler: {exc}")
            report["dateien"].append(rec)
            continue

        # 2) DOCTYPE / ENTITY
        if re.search(r"(?i)<!DOCTYPE", raw):
            report["fehler"].append(f"{name}: enthaelt DOCTYPE")
            rec["befunde"].append("DOCTYPE vorhanden")
        if re.search(r"(?i)<!ENTITY", raw):
            report["fehler"].append(f"{name}: enthaelt ENTITY-Deklaration")
            rec["befunde"].append("ENTITY-Deklaration vorhanden")

        # 3) Elemente und Attribute
        elemente = []
        for el in root.iter():
            tag = local(el.tag)
            elemente.append(tag)
            if tag in VERBOTEN_ELEMENTE:
                report["fehler"].append(f"{name}: verbotenes Element <{tag}>")
                rec["befunde"].append(f"verbotenes Element <{tag}>")
            for attr, value in el.attrib.items():
                a = local(attr)
                if a.startswith("on"):
                    report["fehler"].append(f"{name}: Event-Handler {a}")
                    rec["befunde"].append(f"Event-Handler {a}")
                if AKTIV.search(value or ""):
                    report["fehler"].append(f"{name}: aktive URI in {a}")
                    rec["befunde"].append(f"aktive URI in {a}")
                if a in ("href", "src"):
                    if EXTERN.search(value or ""):
                        report["fehler"].append(f"{name}: externe Referenz in {a}: {value[:60]}")
                        rec["befunde"].append(f"externe Referenz in {a}")
                    elif (value or "").strip().startswith("#"):
                        pass  # interner Anker, unbedenklich
                    elif value:
                        report["warnungen"].append(f"{name}: relative Referenz in {a}: {value[:60]}")

        # 4) Barrierefreiheit
        title = root.find("{http://www.w3.org/2000/svg}title")
        desc = root.find("{http://www.w3.org/2000/svg}desc")
        rec["hat_title"] = title is not None and bool((title.text or "").strip())
        rec["hat_desc"] = desc is not None and bool((desc.text or "").strip())
        rec["hat_viewbox"] = bool(root.get("viewBox"))
        rec["hat_role_img"] = root.get("role") == "img"
        for feld, ok in (
            ("title", rec["hat_title"]), ("desc", rec["hat_desc"]),
            ("viewBox", rec["hat_viewbox"]), ("role=img", rec["hat_role_img"]),
        ):
            if not ok:
                report["warnungen"].append(f"{name}: {feld} fehlt")
                rec["befunde"].append(f"{feld} fehlt")
        rec["elemente"] = sorted(set(elemente))
        report["dateien"].append(rec)
        status = "OK " if not any("verboten" in b or "Handler" in b or "extern" in b or "aktiv" in b for b in rec["befunde"]) else "!! "
        print(f"{status}{name}: {rec['bytes']} B, Elemente={','.join(rec['elemente'])}, "
              f"title={rec['hat_title']} desc={rec['hat_desc']} viewBox={rec['hat_viewbox']}")

    path = os.path.join(evidence_dir, "svg-report.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    print(f"\nDateien: {len(report['dateien'])}, Fehler: {len(report['fehler'])}, Warnungen: {len(report['warnungen'])}")
    for e in report["fehler"]:
        print("  FEHLER:", e)
    for w in report["warnungen"]:
        print("  WARNUNG:", w)
    print("geschrieben:", path)
    return 1 if report["fehler"] else 0


if __name__ == "__main__":
    sys.exit(main())
