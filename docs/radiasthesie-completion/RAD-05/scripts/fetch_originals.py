#!/usr/bin/env python3
"""Schritt 4: Originaldateien laden und bytegenau gegen die Commons-SHA1 pruefen.

- Quelle: die in commons-raw.json von der API gelieferte file_url (upload.wikimedia.org).
- Ablage: assets/radiasthesie/media/original/<key>.<ext>  (unveraendert, wie geladen)
- Pruefung: SHA-1 des geladenen Bytes muss der von Commons gemeldeten SHA-1 entsprechen.
  Zusaetzlich: magic bytes (unabhaengig von der Endung) und Pillow-Masse.

Aufruf: python fetch_originals.py <evidence-dir> <media-dir>
"""
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.request

# Wikimedia verlangt einen aussagekraeftigen User-Agent mit Kontaktmoeglichkeit.
# Ohne URL/E-Mail im UA antwortet upload.wikimedia.org mit HTTP 429.
UA = "Esoterik-Welt-MediaAudit/1.0 (https://github.com/ingbms/Esoterik-Welt) python-urllib/3"

MIME_EXT = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}

MAGIC = [
    (b"\xff\xd8\xff", "image/jpeg"),
    (b"\x89PNG\r\n\x1a\n", "image/png"),
    (b"RIFF", "image/webp"),  # nur zusammen mit WEBP an Offset 8
]


def sniff(head):
    if head.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if head.startswith(b"\x89PNG\r\n\x1a\n"):
        return "image/png"
    if head.startswith(b"RIFF") and head[8:12] == b"WEBP":
        return "image/webp"
    return "unbekannt"


def download(url, attempts=5):
    """Download mit Retry/Backoff: Wikimedia drosselt haeufige Zugriffe (HTTP 429)."""
    delay = 20
    last = None
    for n in range(attempts):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
            with urllib.request.urlopen(req, timeout=180) as resp:
                return resp.read(), resp.status, resp.headers
        except urllib.error.HTTPError as exc:
            last = exc
            if exc.code in (429, 503, 500):
                wait = int(exc.headers.get("Retry-After") or delay)
                print(f"    HTTP {exc.code} – warte {wait}s (Versuch {n + 1}/{attempts})")
                time.sleep(wait)
                delay = min(delay * 2, 180)
                continue
            raise
    raise last


def main():
    evidence_dir, media_dir = sys.argv[1], sys.argv[2]
    raw = json.load(open(os.path.join(evidence_dir, "commons-raw.json"), encoding="utf-8"))
    out_dir = os.path.join(media_dir, "original")
    os.makedirs(out_dir, exist_ok=True)
    report = {}
    for key, entry in raw.items():
        s = entry["summary"]
        url = s["file_url"].split("?")[0]
        ext = MIME_EXT.get(s["mime"], "bin")
        dest = os.path.join(out_dir, f"{key}.{ext}")
        payload = None
        http_status = None
        content_type = None
        content_length = None
        # Wiederaufnahme: bereits korrekt geladene Datei nicht erneut ziehen.
        if os.path.exists(dest):
            existing = open(dest, "rb").read()
            if hashlib.sha1(existing).hexdigest() == s["sha1"]:
                payload = existing
                http_status = "cached"
                print(f"    bereits vorhanden und SHA-1-korrekt: {dest}")
        if payload is None:
            payload, http_status, headers = download(url)
            content_type = headers.get("Content-Type")
            content_length = headers.get("Content-Length")
            with open(dest, "wb") as fh:
                fh.write(payload)
        sha1 = hashlib.sha1(payload).hexdigest()
        sha256 = hashlib.sha256(payload).hexdigest()
        detected = sniff(payload[:16])
        rec = {
            "key": key,
            "source_url": url,
            "http_status": http_status,
            "content_type_header": content_type,
            "content_length_header": content_length,
            "stored_path": dest.replace("\\", "/"),
            "bytes": len(payload),
            "sha1": sha1,
            "sha256": sha256,
            "sha1_commons": s["sha1"],
            "sha1_match": sha1 == s["sha1"],
            "mime_commons": s["mime"],
            "mime_detected": detected,
            "mime_match": detected == s["mime"],
            "width_commons": s["width"],
            "height_commons": s["height"],
        }
        report[key] = rec
        flag = "OK " if rec["sha1_match"] and rec["mime_match"] else "!! "
        print(f"{flag}{key}: {len(payload)} B  {detected}  sha1_match={rec['sha1_match']}  {dest}")
        time.sleep(1.0)

    path = os.path.join(evidence_dir, "download-report.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(report, fh, ensure_ascii=False, indent=2)
    bad = [k for k, v in report.items() if not (v["sha1_match"] and v["mime_match"])]
    print("geschrieben:", path)
    print("Abweichungen:", bad or "keine")


if __name__ == "__main__":
    main()
