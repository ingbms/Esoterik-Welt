#!/usr/bin/env python3
"""Schritt 2: Rohantwort auswerten und je Motiv die rechtenrelevanten Felder kompakt zeigen."""
import html
import json
import re
import sys


def plain(value):
    if not value:
        return ""
    txt = re.sub(r"<[^>]+>", " ", str(value))
    txt = html.unescape(txt)
    return re.sub(r"\s+", " ", txt).strip()


def main():
    data = json.load(open(sys.argv[1], encoding="utf-8"))
    for key, entry in data.items():
        s = entry.get("summary") or {}
        print("=" * 78)
        print(f"{key}  |  {entry.get('canonical_title')}")
        print(f"  Seite      : {s.get('description_url')}")
        print(f"  Datei      : {s.get('file_url')}")
        print(f"  MIME       : {s.get('mime')}  ({s.get('mediatype')})")
        print(f"  Maße       : {s.get('width')}x{s.get('height')}  {s.get('size_bytes')} B")
        print(f"  SHA1(Com.) : {s.get('sha1')}")
        print(f"  Lizenz     : {s.get('license_short')}  <{s.get('license_url')}>")
        print(f"  UsageTerms : {plain(s.get('usage_terms'))}")
        print(f"  AttrReq    : {plain(s.get('attribution_required'))}")
        print(f"  Copyrighted: {plain(s.get('copyrighted'))}")
        print(f"  Restrict   : {plain(s.get('restrictions')) or '-'}")
        print(f"  Urheber    : {plain(s.get('artist_html')) or '-'}")
        print(f"  Credit     : {plain(s.get('credit_html')) or '-'}")
        print(f"  Objekt     : {plain(s.get('object_name')) or '-'}")
        print(f"  Datum      : {plain(s.get('date_original')) or '-'}")
        print(f"  Lizenzkopf : {plain(s.get('license_heading')) or '-'}")
        desc = plain(s.get("image_description")) or "-"
        print(f"  Beschreib. : {desc[:400]}")
        cats = plain(s.get("categories")) or "-"
        print(f"  Kategorien : {cats[:300]}")


if __name__ == "__main__":
    main()
