#!/usr/bin/env python3
"""Schritt 11: Unabhaengige Validierung des Bildbestands gegen das Manifest.

Geprueft wird nicht, was das Manifest behauptet, sondern was auf der Platte liegt:
- Existiert jede deklarierte Datei? Stimmen Bytes und SHA-256?
- Stimmt der per magic bytes bestimmte Typ mit dem deklarierten Format?
- Stimmen die Masse mit den deklarierten Massen?
- Gibt es Dateien im Bestand, die das Manifest nicht kennt (Waisen)?
- Hat jedes Motiv Alt-Text, Bildunterschrift, Attributionszeile und Lizenz-URL?
- Ist die Lizenz-URL erreichbar (HTTP-Status)?
- Sind die eigenen SVGs geprueft und fehlerfrei?
- Stimmt die vom Manifest behauptete Anzahl mit der gezaehlten Anzahl?

Aufruf: python validate_media.py <media-dir> <evidence-dir>
Exitcode 0 = keine Fehler, 1 = Fehler.
"""
import hashlib
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request
from html.parser import HTMLParser

from PIL import Image

Image.MAX_IMAGE_PIXELS = None

UA = "Esoterik-Welt-MediaAudit/1.0 (https://github.com/ingbms/Esoterik-Welt) python-urllib/3"


class HtmlChecker(HTMLParser):
    """Minimaler Parser, der unbalancierte Tags der Nachweisseite bemerkt."""

    VOID = {"img", "br", "meta", "link", "hr", "input", "source", "area", "wbr"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.imbalance = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.VOID:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if self.stack and self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.imbalance.append(tag)

    def close(self):
        super().close()
        if self.stack or self.imbalance:
            raise ValueError(f"unbalancierte Tags: offen={self.stack} unerwartet={self.imbalance}")


def sniff(head):
    if head.startswith(b"\xff\xd8\xff"):
        return "jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "png"
    if head.startswith(b"RIFF") and head[8:12] == b"WEBP":
        return "webp"
    if len(head) >= 12 and head[4:8] == b"ftyp" and head[8:12] in (b"avif", b"avis"):
        return "avif"
    return "unbekannt"


def http_status(url, attempts=3):
    delay = 5
    for n in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA}, method="GET")
            with urllib.request.urlopen(req, timeout=45) as resp:
                return resp.status
        except urllib.error.HTTPError as exc:
            if exc.code in (429, 503) and n + 1 < attempts:
                time.sleep(delay)
                delay *= 2
                continue
            return exc.code
        except Exception as exc:  # noqa: BLE001
            if n + 1 < attempts:
                time.sleep(delay)
                delay *= 2
                continue
            return f"Fehler: {exc.__class__.__name__}"
    return "unbekannt"


def main():
    media_dir, evidence_dir = sys.argv[1], sys.argv[2]
    # Manifestpfade sind projektwurzel-relativ ("assets/radiasthesie/media/...").
    # Sie duerfen nicht vom Arbeitsverzeichnis abhaengen, sonst prueft der Lauf mit
    # absolutem Medienpfad stillschweigend ganz andere Dateien.
    base_root = os.path.abspath(os.path.join(media_dir, "..", "..", ".."))
    media_abs = os.path.abspath(media_dir)

    def resolve(p):
        return p if os.path.isabs(p) else os.path.normpath(os.path.join(base_root, p))

    manifest_path = os.path.join(media_dir, "media-manifest.json")
    m = json.load(open(manifest_path, encoding="utf-8"))
    errors, warnings, checks = [], [], []

    declared = set()
    variant_total = 0

    # 1) Je Motiv: Original und Varianten pruefen
    for it in m["items"]:
        o = it["original"]
        declared.add(resolve(o["pfad"]))
        path = resolve(o["pfad"])
        if not os.path.exists(path):
            errors.append(f"{it['id']}: Original fehlt: {o['pfad']}")
        else:
            data = open(path, "rb").read()
            sha256 = hashlib.sha256(data).hexdigest()
            sha1 = hashlib.sha1(data).hexdigest()
            if len(data) != o["bytes"]:
                errors.append(f"{it['id']}: Original Bytes {len(data)} ≠ {o['bytes']}")
            if sha256 != o["sha256"]:
                errors.append(f"{it['id']}: Original SHA-256 weicht ab")
            if sha1 != o["sha1"]:
                errors.append(f"{it['id']}: Original SHA-1 weicht ab")
            if sha1 != o["sha1_quelle"]:
                errors.append(f"{it['id']}: SHA-1 stimmt nicht mit der Quelle überein")
            if sniff(data[:16]) != o["mime"].split("/")[-1]:
                errors.append(f"{it['id']}: Original MIME weicht ab ({sniff(data[:16])} ≠ {o['mime']})")
            with Image.open(path) as im:
                if list(im.size) != [o["breite"], o["hoehe"]]:
                    errors.append(f"{it['id']}: Original Masse {im.size} ≠ {o['breite']}x{o['hoehe']}")

        for v in it["varianten"]:
            variant_total += 1
            declared.add(resolve(v["pfad"]))
            vpath = resolve(v["pfad"])
            if not os.path.exists(vpath):
                errors.append(f"{it['id']}: Variante fehlt: {v['pfad']}")
                continue
            data = open(vpath, "rb").read()
            if len(data) != v["bytes"]:
                errors.append(f"{it['id']}: {v['pfad']} Bytes {len(data)} ≠ {v['bytes']}")
            if hashlib.sha256(data).hexdigest() != v["sha256"]:
                errors.append(f"{it['id']}: {v['pfad']} SHA-256 weicht ab")
            if sniff(data[:16]) != v["format"]:
                errors.append(f"{it['id']}: {v['pfad']} Format {sniff(data[:16])} ≠ {v['format']}")
            with Image.open(vpath) as im:
                if list(im.size) != [v["breite"], v["hoehe"]]:
                    errors.append(f"{it['id']}: {v['pfad']} Masse {im.size} ≠ {v['breite']}x{v['hoehe']}")
                if v["hat_alpha"]:
                    has_alpha = im.mode in ("RGBA", "LA") or "transparency" in im.info
                    if not has_alpha:
                        errors.append(f"{it['id']}: {v['pfad']} hat keinen Alphakanal mehr")

        # 2) Pflichtfelder fuer die Attribution
        for feld, wert in (
            ("alt", it.get("alt")),
            ("caption", it.get("caption")),
            ("attribution_text", it.get("attribution_text")),
            ("lizenz.url", (it.get("lizenz") or {}).get("url")),
            ("quelle.dateiseite", (it.get("quelle") or {}).get("dateiseite")),
            ("urheber.name", (it.get("urheber") or {}).get("name")),
            ("rechte.laenderhinweis", (it.get("rechte") or {}).get("laenderhinweis")),
        ):
            if not wert or not str(wert).strip():
                errors.append(f"{it['id']}: Pflichtfeld leer: {feld}")
        if it.get("alt") and len(it["alt"]) < 40:
            warnings.append(f"{it['id']}: Alt-Text sehr kurz ({len(it['alt'])} Zeichen)")
        if it.get("alt") and it["alt"].startswith(("Bild von", "Foto von", "image of")):
            warnings.append(f"{it['id']}: Alt-Text beginnt mit Floskel")
        if it["lizenz"]["attribution_pflicht"] and it["urheber"]["name"] not in it["attribution_text"]:
            errors.append(f"{it['id']}: Attributionspflicht, aber Urheber fehlt in der Attributionszeile")

    # 3) Eigene Assets
    for a in m["own_assets"]:
        declared.add(resolve(a["datei"]))
        if not os.path.exists(resolve(a["datei"])):
            errors.append(f"Eigenes Asset fehlt: {a['datei']}")
        if not a.get("sicherheitspruefung", {}).get("keine_skripte"):
            errors.append(f"Sicherheitspruefung fehlt: {a['datei']}")

    # 4) Waisen: Dateien im Bestand, die das Manifest nicht kennt
    for root, _dirs, files in os.walk(media_abs):
        for name in files:
            p = os.path.normpath(os.path.join(root, name))
            if os.path.basename(p) in ("media-manifest.json", "bildnachweis.html", "ATTRIBUTION.md"):
                continue
            if p not in declared:
                errors.append(f"Datei ohne Manifesteintrag: {os.path.relpath(p, base_root).replace(os.sep, '/')}")

    # 5) Zaehlung
    motif_disk = len(os.listdir(os.path.join(media_abs, "original")))
    variant_disk = sum(
        len(os.listdir(os.path.join(media_abs, d)))
        for d in os.listdir(media_abs)
        if d.isdigit() and os.path.isdir(os.path.join(media_abs, d))
    )
    counts = m["counts"]
    dateien_disk = sum(len(files) for _r, _d, files in os.walk(media_abs))
    for feld, soll, ist in (
        ("motive", counts["motive"], len(m["items"])),
        ("originale", counts["originale"], motif_disk),
        ("varianten", counts["varianten"], variant_disk),
        ("eigene_svgs", counts["eigene_svgs"], len(m["own_assets"])),
        ("dateien_im_medienordner", counts.get("dateien_im_medienordner"), dateien_disk),
    ):
        if soll != ist:
            errors.append(f"Zaehlung {feld}: Manifest {soll} ≠ gezaehlt {ist}")
    if variant_total != variant_disk:
        errors.append(f"Varianten im Manifest {variant_total} ≠ auf Platte {variant_disk}")

    # 6) Lizenz-URLs tatsaechlich abrufen
    urls = sorted({it["lizenz"]["url"] for it in m["items"]})
    status = {}
    for u in urls:
        st = http_status(u)
        status[u] = st
        if st != 200:
            errors.append(f"Lizenz-URL nicht erreichbar: {u} -> {st}")
        time.sleep(1.5)

    # 7) Nachweisseite: Bildpfade muessen von der Seite aus aufloesbar sein
    html_path = os.path.join(media_dir, "bildnachweis.html")
    if not os.path.exists(html_path):
        errors.append("Bildnachweisseite fehlt: bildnachweis.html")
    else:
        raw = open(html_path, encoding="utf-8").read()
        try:
            parser = HtmlChecker()
            parser.feed(raw)
            parser.close()
        except Exception as exc:  # noqa: BLE001
            errors.append(f"bildnachweis.html nicht parsebar: {exc}")
        imgs = re.findall(r'<img[^>]+src="([^"]+)"', raw)
        if len(imgs) != len(m["items"]):
            errors.append(f"Nachweisseite zeigt {len(imgs)} Bilder, erwartet {len(m['items'])}")
        base = media_abs
        for src in imgs:
            if src.startswith(("http://", "https://", "data:")):
                errors.append(f"Nachweisseite referenziert extern: {src}")
                continue
            if not os.path.exists(os.path.normpath(os.path.join(base, src))):
                errors.append(f"Bildpfad der Nachweisseite nicht aufloesbar: {src}")
        for it in m["items"]:
            if it["alt"] not in raw:
                errors.append(f"{it['id']}: Alt-Text fehlt in der Nachweisseite")
            if it["attribution_text"] not in raw:
                errors.append(f"{it['id']}: Attributionszeile fehlt in der Nachweisseite")

    report = {
        "manifest": manifest_path.replace("\\", "/"),
        "manifest_sha256": hashlib.sha256(open(manifest_path, "rb").read()).hexdigest(),
        "geprueft_am": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "motive": len(m["items"]),
        "varianten": variant_total,
        "originale_auf_platte": motif_disk,
        "varianten_auf_platte": variant_disk,
        "lizenz_urls": status,
        "errors": errors,
        "warnings": warnings,
        "ergebnis": "bestanden" if not errors else "nicht bestanden",
    }
    out = os.path.join(evidence_dir, "validation.json")
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)

    print(f"Motive: {len(m['items'])}  Originale auf Platte: {motif_disk}  Varianten auf Platte: {variant_disk}")
    print("Lizenz-URLs:")
    for u, st in status.items():
        print(f"  {st}  {u}")
    print(f"Fehler: {len(errors)}  Warnungen: {len(warnings)}")
    for e in errors:
        print("  FEHLER:", e)
    for w in warnings:
        print("  WARNUNG:", w)
    print("Ergebnis:", report["ergebnis"])
    print("geschrieben:", out)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
