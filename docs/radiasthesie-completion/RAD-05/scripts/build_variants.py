#!/usr/bin/env python3
"""Schritt 7: Optimierte Bildvarianten erzeugen.

Regeln (bewusst konservativ, damit das Motiv sachlich unveraendert bleibt):
- Keine Beschneidung, kein Hochskalieren. Nur Herunterskalieren mit LANCZOS.
- Zielbreiten 520 px (1x) und 1040 px (2x) entsprechend dem bestehenden
  Figuren-Slot width=520 im Datenmodell (js/data/radiasthesie.js).
- Ist das Original schmaler als 1040 px, entfaellt die 2x-Variante; das wird
  im Bericht vermerkt und nicht durch Hochskalieren kaschiert.
- Alphakanal bleibt erhalten, wo das Original echte Transparenz hat.
- EXIF wird entfernt (Datensparsamkeit: Kamera-/GPS-Daten), ICC bleibt erhalten,
  damit die Farben stimmen. Die Attribution steht im Manifest und in der
  Nachweisseite, nicht in versteckten Metadaten.

Aufruf: python build_variants.py <media-dir> <evidence-dir>
"""
import hashlib
import io
import json
import os
import sys

from PIL import Image, ImageOps

Image.MAX_IMAGE_PIXELS = None

WIDTHS = (520, 1040)
QUALITY = {"photo": 82, "grafik": 88}
# AVIF erreicht bei niedrigerer Zahl dieselbe Wahrnehmungsqualitaet wie WebP.
AVIF_QUALITY = {"photo": 62, "grafik": 70}

# Motivklasse steuert Format und Qualitaet:
# - "photo": WebP (Projektkonvention, vgl. assets/crystals/<breite>/*.webp)
# - "grafik": WebP + PNG, weil Schrift/Transparenz verlustbehaftet leiden
PLAN = {
    "klassisches-pendel": ("photo", "klassisches-pendel.jpg"),
    "universalpendel": ("photo", "universalpendel.jpg"),
    "radiasthesierute": ("photo", "radiasthesierute.jpg"),
    "wuenschelrute-historisch": ("photo", "wuenschelrute-historisch.jpg"),
    "tarot": ("photo", "tarot.jpg"),
    "ouija-historisch": ("grafik", "ouija-historisch.png"),
}


def exif_summary(im):
    exif = im.getexif()
    if not exif:
        return {"vorhanden": False}
    keys = {0x010F: "Hersteller", 0x0110: "Modell", 0x0132: "Aenderungsdatum", 0x829A: "Belichtungszeit"}
    out = {"vorhanden": True, "tags": {}}
    for tag, label in keys.items():
        if tag in exif:
            out["tags"][label] = str(exif[tag])
    gps = exif.get_ifd(0x8825)
    out["gps"] = bool(gps)
    if gps:
        out["gps_keys"] = [str(k) for k in gps.keys()]
    return out


def main():
    media_dir, evidence_dir = sys.argv[1], sys.argv[2]
    src_dir = os.path.join(media_dir, "original")
    for w in WIDTHS:
        os.makedirs(os.path.join(media_dir, str(w)), exist_ok=True)

    report = {}
    for key, (klass, filename) in PLAN.items():
        src = os.path.join(src_dir, filename)
        entry = {"key": key, "klasse": klass, "original": filename, "varianten": [], "uebersprungen": []}
        with Image.open(src) as im:
            entry["exif_original"] = exif_summary(im)
            icc = im.info.get("icc_profile")
            im = ImageOps.exif_transpose(im)
            has_alpha = im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info)
            if has_alpha:
                base = im.convert("RGBA")
                entry["alpha"] = True
                alpha = base.getchannel("A")
                lo, hi = alpha.getextrema()
                entry["alpha_werte"] = {"min": lo, "max": hi}
            else:
                base = im.convert("RGB")
                entry["alpha"] = False
            ow, oh = base.size
            entry["original_masse"] = [ow, oh]

            for target in WIDTHS:
                if target > ow:
                    entry["uebersprungen"].append(
                        {"breite": target, "grund": f"Original ist nur {ow} px breit; kein Hochskalieren"}
                    )
                    continue
                height = round(oh * target / ow)
                resized = base.resize((target, height), Image.LANCZOS)
                # WebP (Projektkonvention)
                wpath = os.path.join(media_dir, str(target), f"{key}.webp")
                buf = io.BytesIO()
                save_kw = {"format": "WEBP", "quality": QUALITY[klass], "method": 6}
                if icc:
                    save_kw["icc_profile"] = icc
                resized.save(buf, **save_kw)
                data = buf.getvalue()
                with open(wpath, "wb") as fh:
                    fh.write(data)
                entry["varianten"].append({
                    "breite": target,
                    "hoehe": height,
                    "format": "webp",
                    "pfad": wpath.replace("\\", "/"),
                    "bytes": len(data),
                    "sha256": hashlib.sha256(data).hexdigest(),
                    "hat_alpha": bool(entry["alpha"]),
                })
                # AVIF als moderne Zweitfassung (Projektplan §2.5 nennt WebP/AVIF).
                # Wird noch von keiner Ansicht ausgeliefert; der Einbau braucht
                # <picture>/<source> und ist Integrationsumfang (RAD-06).
                apath = os.path.join(media_dir, str(target), f"{key}.avif")
                try:
                    buf = io.BytesIO()
                    avif_kw = {"format": "AVIF", "quality": AVIF_QUALITY[klass]}
                    if icc:
                        avif_kw["icc_profile"] = icc
                    try:
                        resized.save(buf, speed=6, **avif_kw)
                    except TypeError:
                        resized.save(buf, **avif_kw)
                    data = buf.getvalue()
                    with open(apath, "wb") as fh:
                        fh.write(data)
                    entry["varianten"].append({
                        "breite": target,
                        "hoehe": height,
                        "format": "avif",
                        "pfad": apath.replace("\\", "/"),
                        "bytes": len(data),
                        "sha256": hashlib.sha256(data).hexdigest(),
                        "hat_alpha": bool(entry["alpha"]),
                        "optional": True,
                    })
                except Exception as exc:  # noqa: BLE001
                    entry.setdefault("avif_fehler", []).append(f"{target}px: {exc.__class__.__name__}: {exc}")
                    print(f"    AVIF {target}px fehlgeschlagen: {exc}")
                # PNG nur fuer Grafik mit Transparenz/Schrift
                if klass == "grafik":
                    ppath = os.path.join(media_dir, str(target), f"{key}.png")
                    buf = io.BytesIO()
                    png_kw = {"format": "PNG", "optimize": True}
                    if icc:
                        png_kw["icc_profile"] = icc
                    resized.save(buf, **png_kw)
                    data = buf.getvalue()
                    with open(ppath, "wb") as fh:
                        fh.write(data)
                    entry["varianten"].append({
                        "breite": target,
                        "hoehe": height,
                        "format": "png",
                        "pfad": ppath.replace("\\", "/"),
                        "bytes": len(data),
                        "sha256": hashlib.sha256(data).hexdigest(),
                        "hat_alpha": bool(entry["alpha"]),
                    })
        report[key] = entry
        names = ", ".join(v["pfad"].split("/")[-2] + "/" + v["pfad"].split("/")[-1] for v in entry["varianten"])
        print(f"{key}: {entry['original_masse'][0]}x{entry['original_masse'][1]} -> {names}")
        if entry["uebersprungen"]:
            for s in entry["uebersprungen"]:
                print(f"    uebersprungen: {s['breite']} px – {s['grund']}")

    path = os.path.join(evidence_dir, "variant-report.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    print("geschrieben:", path)


if __name__ == "__main__":
    main()
