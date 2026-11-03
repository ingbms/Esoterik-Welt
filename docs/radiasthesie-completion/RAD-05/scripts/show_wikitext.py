#!/usr/bin/env python3
"""Wikitext der Dateiseiten im Wortlaut ausgeben (Beweis der Lizenzbausteine)."""
import json
import sys

data = json.load(open(sys.argv[1], encoding="utf-8"))
for key, entry in data.items():
    print("=" * 78)
    print(f"{key}  revid={entry['revid']}  {entry['timestamp']}")
    print("-" * 78)
    print(entry["wikitext"].strip())
    print()
