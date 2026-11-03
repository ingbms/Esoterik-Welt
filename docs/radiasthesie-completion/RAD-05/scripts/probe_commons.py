#!/usr/bin/env python3
"""Schritt 1: Rechte-/Urheber-/Laenderhinweise der sechs Originaldateiseiten abrufen.

Quelle: Wikimedia Commons MediaWiki-API (action=query, prop=imageinfo, extmetadata).
Die API liefert die Metadaten, die aus der Dateiseite selbst stammen (Lizenzbaustein,
Urheber, Credit, Nutzungsbedingungen, Einschraenkungen). Rohantwort wird als Beweis
gespeichert und nicht veraendert.

Aufruf: python probe_commons.py <outdir>
"""
import json
import os
import sys
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "Esoterik-Welt-Radiasthesie-Media-Audit/1.0 (research; contact: ingbms)"

FILES = [
    ("klassisches-pendel", "File:Radiesthetic pendulum.jpg"),
    ("universalpendel", "File:Universal pendulum E.jpg"),
    ("radiasthesierute", "File:Varilla de radiestesia.JPG"),
    ("wuenschelrute-historisch", "File:Divining Rod.jpg"),
    ("tarot", "File:Tarot cards - 3 card spread with candles.jpg"),
    ("ouija-historisch", "File:Ouija board - Kennard Novelty Company.png"),
]


def fetch(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read().decode("utf-8")), url


def main():
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    result = {}
    for key, title in FILES:
        params = {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "imageinfo",
            "iiprop": "url|size|mime|sha1|extmetadata|mediatype",
            "titles": title,
            "iiextmetadatalanguage": "de",
        }
        try:
            data, used_url = fetch(params)
        except Exception as exc:  # noqa: BLE001
            result[key] = {"title": title, "error": repr(exc)}
            print(f"FEHLER {key}: {exc}")
            continue
        page = (data.get("query", {}).get("pages") or [{}])[0]
        entry = {
            "key": key,
            "title": title,
            "api_url": used_url,
            "page_missing": "missing" in page,
            "pageid": page.get("pageid"),
            "canonical_title": page.get("title"),
            "raw": data,
        }
        if page.get("imageinfo"):
            ii = page["imageinfo"][0]
            em = ii.get("extmetadata", {})
            def val(name):
                return (em.get(name) or {}).get("value")
            entry["summary"] = {
                "file_url": ii.get("url"),
                "description_url": ii.get("descriptionurl"),
                "mime": ii.get("mime"),
                "mediatype": ii.get("mediatype"),
                "width": ii.get("width"),
                "height": ii.get("height"),
                "size_bytes": ii.get("size"),
                "sha1": ii.get("sha1"),
                "license_short": val("LicenseShortName"),
                "license_url": val("LicenseUrl"),
                "usage_terms": val("UsageTerms"),
                "artist_html": val("Artist"),
                "credit_html": val("Credit"),
                "attribution_required": val("AttributionRequired"),
                "restrictions": val("Restrictions"),
                "copyrighted": val("Copyrighted"),
                "license_heading": val("License"),
                "object_name": val("ObjectName"),
                "date_original": val("DateTimeOriginal"),
                "categories": val("Categories"),
                "image_description": val("ImageDescription"),
            }
        else:
            entry["summary"] = None
        result[key] = entry
        print(f"{key}: {entry['canonical_title']} -> {(entry['summary'] or {}).get('license_short')}")
        time.sleep(1.0)

    path = os.path.join(outdir, "commons-raw.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=2)
    print("geschrieben:", path)
    missing = [k for k, v in result.items() if not v.get("summary")]
    print("ohne imageinfo:", missing)


if __name__ == "__main__":
    main()
