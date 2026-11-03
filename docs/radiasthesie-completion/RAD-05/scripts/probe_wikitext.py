#!/usr/bin/env python3
"""Schritt 3: Wikitext der sechs Dateiseiten laden (Lizenzbausteine im Originalwortlaut).

HTML-Seiten sind gross und enthalten viel Navigation; der Wikitext zeigt die
Lizenzvorlagen (z. B. {{Cc-by-sa-3.0}}, {{PD-old-70-expired}}, {{PD-Art}}) und
Laenderhinweise unveraendert.

Aufruf: python probe_wickitext.py <outdir>
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


def main():
    outdir = sys.argv[1]
    os.makedirs(outdir, exist_ok=True)
    out = {}
    for key, title in FILES:
        params = {
            "action": "query",
            "format": "json",
            "formatversion": "2",
            "prop": "revisions",
            "rvprop": "content|timestamp|ids",
            "rvslots": "main",
            "titles": title,
        }
        url = API + "?" + urllib.parse.urlencode(params)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=60) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        page = (data.get("query", {}).get("pages") or [{}])[0]
        rev = (page.get("revisions") or [{}])[0]
        text = ((rev.get("slots") or {}).get("main") or {}).get("content") or ""
        out[key] = {
            "title": title,
            "revid": rev.get("revid"),
            "timestamp": rev.get("timestamp"),
            "wikitext": text,
        }
        print(f"{key}: revid={rev.get('revid')} {rev.get('timestamp')} {len(text)} Zeichen")
        time.sleep(1.0)
    path = os.path.join(outdir, "commons-wikitext.json")
    with open(path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)
    print("geschrieben:", path)


if __name__ == "__main__":
    main()
