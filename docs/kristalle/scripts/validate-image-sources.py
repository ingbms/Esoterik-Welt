#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Prüft docs/kristalle/image-sources.json gegen data/crystals.json, die Lizenz-Allowlist
und die Live-Lizenz-URLs. Schreibt image-sources.validation.json neben das Manifest.

Aufruf (aus dem Repo-Root oder von überall):
    python docs/kristalle/scripts/validate-image-sources.py [--offline]
"""
import json
import os
import re
import sys
import hashlib
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
MAN = ROOT / "docs" / "kristalle" / "image-sources.json"
UA = "EsoterikWeltImageResearch/1.0 (+https://github.com/ingbms/Esoterik-Welt)"

REQUIRED_CAND = [
    ("crystal_slug",), ("selected",), ("source", "page_url"), ("source", "direct_image_url"),
    ("source", "file_title"), ("author",), ("license", "name"), ("license", "url"),
    ("license", "class"), ("attribution_text_required",), ("attribution_text_short",),
    ("retrieved_at",), ("original", "width_px"), ("original", "height_px"),
    ("original", "mime"), ("visual_note",), ("square_crop",),
    ("license_compatibility", "status"),
]
ALLOWED = {"Public-Domain", "CC0-1.0", "CC-BY-2.0", "CC-BY-3.0", "CC-BY-4.0",
           "CC-BY-SA-2.0", "CC-BY-SA-2.5", "CC-BY-SA-3.0", "CC-BY-SA-4.0"}
BAD = ("-NC", "-ND", "NonCommercial", "NoDeriv", "GFDL", "Fair use")


def get(obj, path):
    cur = obj
    for k in path:
        if not isinstance(cur, dict) or k not in cur:
            return ""
        cur = cur[k]
    return cur


def main(offline=False):
    errors, warnings = [], []
    raw = MAN.read_bytes()
    man = json.loads(raw.decode("utf-8"))
    print(f"JSON parst: {len(raw)} Bytes, {len(man['crystals'])} Kristalle")

    data_file = ROOT / "data" / "crystals.json"
    if not data_file.exists():
        print(f"FEHLER: {data_file} fehlt — das Skript erwartet die Website-Repo-Wurzel "
              f"(gefunden: {ROOT}). Bitte im Repository 'Esoterik-Welt' ausführen.",
              file=sys.stderr)
        return 2
    dcr = json.loads(data_file.read_text(encoding="utf-8"))
    dc = dcr["crystals"] if isinstance(dcr, dict) else dcr
    proj = {c["id"]: c for c in dc}
    if len(proj) != 30:
        errors.append(f"data/crystals.json hat {len(proj)} Einträge, erwartet 30")

    ids, slugs = set(), set()
    for entry in man["crystals"]:
        cid, slug = entry["crystal_id"], entry["slug"]
        if slug in slugs:
            errors.append(f"doppelter Slug: {slug}")
        if cid in ids:
            errors.append(f"doppelte crystal_id: {cid}")
        ids.add(cid)
        slugs.add(slug)
        p = proj.get(cid)
        if not p:
            errors.append(f"{cid} nicht in data/crystals.json")
            continue
        if entry["target_path"] != p["image_placeholder"]:
            errors.append(f"{cid}: target_path {entry['target_path']} != "
                          f"image_placeholder {p['image_placeholder']}")
        if not entry["candidates"]:
            errors.append(f"{cid}: kein Kandidat")
        for cand in entry["candidates"]:
            for path in REQUIRED_CAND:
                if get(cand, path) in ("", None, [], {}):
                    errors.append(f"{cid}/{cand['candidate_id']}: Feld fehlt: {'.'.join(path)}")
            lic = cand["license"]
            if lic["class"] not in ALLOWED:
                errors.append(f"{cid}: Lizenzklasse nicht erlaubt: {lic['class']}")
            blob = " ".join(str(x) for x in (lic["name"], lic["url"], lic["class"])).lower()
            for bad in BAD:
                if bad.lower() in blob:
                    errors.append(f"{cid}: verbotene Lizenzangabe '{bad}'")
            if not str(lic["url"]).startswith("http"):
                errors.append(f"{cid}: Lizenz-URL fehlt/ungültig")
            ath = cand["attribution_text_required"]
            if cand["author"].split()[0] not in ath:
                errors.append(f"{cid}: Attributionspflicht-Text nennt den Urheber nicht")
            if lic["requires_attribution"] and lic["url"] not in ath:
                errors.append(f"{cid}: Attributionspflicht-Text enthält die Lizenz-URL nicht")
            sha = cand["master_rendition_used_for_check"]["sha256"]
            if not re.fullmatch(r"[0-9a-f]{64}", sha or ""):
                errors.append(f"{cid}: sha256 der Rendition fehlt/ungültig")
            if cand["original"]["width_px"] < 1280:
                warnings.append(f"{cid}: Original nur {cand['original']['width_px']} px breit")

    missing = set(proj) - ids
    if missing:
        errors.append(f"Kristalle ohne Manifest-Eintrag: {sorted(missing)}")
    st = man["statistics"]
    if st["crystals_with_documented_candidate"] != 30:
        errors.append("Statistik: nicht 30 dokumentierte Kandidaten")
    if sum(st["license_classes"].values()) != 30:
        errors.append("Statistik: Lizenzklassen summieren nicht auf 30")

    urls, hash_ok = {}, None
    if not offline:
        c0 = man["crystals"][0]["candidates"][0]
        u = c0["source"]["renditions"]["w1280"]["url"]
        try:
            req = urllib.request.Request(u, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=120) as r:
                data = r.read()
            hash_ok = hashlib.sha256(data).hexdigest() == c0["source"]["renditions"]["w1280"]["sha256"]
            print(f"Rendition-Hash {'OK' if hash_ok else 'ABWEICHUNG'}: {c0['candidate_id']} (1280px)")
            if not hash_ok:
                errors.append(f"Rendition-Hash weicht ab: {c0['candidate_id']}")
        except Exception as e:  # Netzfehler sind kein Inhaltsfehler
            warnings.append(f"Rendition nicht abrufbar: {e}")
        for entry in man["crystals"]:
            lu = entry["candidates"][0]["license"]["url"]
            if lu in urls:
                continue
            try:
                rq = urllib.request.Request(lu, headers={"User-Agent": UA})
                with urllib.request.urlopen(rq, timeout=60) as r:
                    urls[lu] = r.status
            except Exception as e:
                urls[lu] = str(e)
        bad_urls = [(u, s) for u, s in urls.items() if str(s) != "200"]
        if bad_urls:
            errors.append(f"Lizenz-URL nicht 200: {bad_urls}")
        print(f"Lizenz-URLs live geprüft: {len(urls)} eindeutige URLs, Fehler: {bad_urls}")

    print(f"\nFEHLER: {len(errors)}")
    for e in errors:
        print("  x", e)
    print(f"WARNUNGEN: {len(warnings)}")
    for w in warnings:
        print("  !", w)

    report = {
        "manifest": str(MAN.relative_to(ROOT)).replace("\\", "/"),
        "manifest_bytes": len(raw),
        "manifest_sha256": hashlib.sha256(raw).hexdigest(),
        "crystals": len(man["crystals"]),
        "errors": errors,
        "warnings": warnings,
        "license_urls_checked": {u: str(s) for u, s in urls.items()},
        "rendition_hash_check": {"candidate": man["crystals"][0]["candidates"][0]["candidate_id"],
                                  "ok": hash_ok},
        "mode": "offline" if offline else "live",
    }
    out = MAN.parent / "image-sources.validation.json"
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Report:", out)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(offline="--offline" in sys.argv))
