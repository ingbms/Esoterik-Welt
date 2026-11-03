#!/usr/bin/env python3
"""Prüflauf für das RAD-02-Delta. Gibt je Test OK/FAIL aus und beendet mit Exitcode != 0 bei Fehlern."""
import csv
import hashlib
import json
import os
import re
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
parts = os.path.join(HERE, "parts")
results = []


def check(name, cond, detail=""):
    results.append({"test": name, "ok": bool(cond), "detail": detail})
    print(("OK   " if cond else "FAIL ") + name + ((" — " + detail) if detail else ""))


def sha(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(65536), b""):
            h.update(chunk)
    return h.hexdigest()


# T1 JSON-Struktur
p = os.path.join(OUT, "quellen-delta.json")
d = json.load(open(p, encoding="utf-8"))
check("T1 JSON lädt und hat Pflichtfelder",
      all(k in d for k in ("schema_version", "base", "sources", "claims", "corrections", "gaps_remaining", "coverage_map")),
      "schema=%s" % d.get("schema_version"))

# T2 ID-Fortlauf
ids = [s["id"] for s in d["sources"]]
check("T2 Quellen-IDs exakt Q34-Q66", ids == ["Q%02d" % n for n in range(34, 67)], "%d Einträge" % len(ids))
cids = [c["id"] for c in d["claims"]]
check("T3 Claim-IDs exakt C01-C30", cids == ["C%02d" % n for n in range(1, 31)], "%d Claims" % len(cids))

# T4 Belegstruktur
bad = []
for c in d["claims"]:
    if not c.get("evidence"):
        bad.append(c["id"] + ":keine")
    for ev in c["evidence"]:
        if ev["source_id"] not in set(ids) | {"Q%02d" % n for n in range(1, 34)}:
            bad.append(c["id"] + ":src")
        if len(ev.get("quote", "")) < 15 or not ev.get("locator"):
            bad.append(c["id"] + ":quote/locator")
check("T4 Jeder Claim hat Quelle, Locator und Zitat >=15 Zeichen", not bad, ",".join(bad))

# T5 Verifikationsniveaus bekannt
levels = set(d["verification_levels"])
unknown = sorted({s["verified"] for s in d["sources"]} - levels)
check("T5 Alle Verifikationsniveaus definiert", not unknown, ",".join(unknown))

# T6 Zählwerte konsistent
c = d["counts"]
check("T6 Zählwerte konsistent",
      c["delta_sources"] == len(d["sources"]) and c["claims"] == len(d["claims"])
      and c["total_sources"] == 66
      and c["claims_belegt"] + c["claims_widerspruechlich"] + c["claims_unbelegt"] == len(d["claims"]),
      json.dumps(c, ensure_ascii=False))

# T7 CSV
with open(os.path.join(OUT, "quellen-delta.csv"), encoding="utf-8-sig", newline="") as fh:
    rows = list(csv.reader(fh, delimiter=";"))
check("T7 CSV: 1 Kopfzeile + 33 Datenzeilen, 13 Spalten",
      len(rows) == 34 and all(len(r) == 13 for r in rows), "%d Zeilen" % len(rows))

# T8 Markdown enthält alle IDs
matrix = open(os.path.join(OUT, "CLAIM-QUELLE-MATRIX.md"), encoding="utf-8").read()
missing = [cid for cid in cids if ("### " + cid) not in matrix]
check("T8 Claim-Matrix enthält alle 30 Claims", not missing, ",".join(missing))
qdoc = open(os.path.join(OUT, "QUELLEN-DELTA.md"), encoding="utf-8").read()
missing_q = [i for i in ids if ("| " + i + " |") not in qdoc]
check("T9 Quellen-Delta enthält alle 33 Quellen", not missing_q, ",".join(missing_q))

# T10 Bestand unverändert
existing_path = os.path.abspath(os.path.join(OUT, "..", "..", "radiasthesie-konzept", "recherche", "quellen.json"))
ex = json.load(open(existing_path, encoding="utf-8"))["sources"]
check("T10 Bestandsbibliothek unverändert (33 Quellen Q01-Q33)",
      len(ex) == 33 and ex[0]["id"] == "Q01" and ex[-1]["id"] == "Q33",
      "sha256=%s" % sha(existing_path)[:16])

# T11 Keine Überschneidung der IDs
check("T11 Keine ID-Überschneidung Bestand/Delta",
      not (set(ids) & {s["id"] for s in ex}))

# T12 Pflichtfelder je Quelle
req = ("title", "authors", "type", "locator", "verified", "interest_note", "evidence_use", "topics")
miss = [s["id"] for s in d["sources"] if any(not s.get(k) for k in req)]
check("T12 Alle Quellen haben Pflichtfelder", not miss, ",".join(miss))

# T13 Locators sind URLs
badurl = [s["id"] for s in d["sources"] if not re.match(r"^https?://", s["locator"])]
check("T13 Alle Locators sind http(s)-URLs", not badurl, ",".join(badurl))

# T14 Interessenvermerke vorhanden
nointerest = [s["id"] for s in d["sources"] if len(s.get("interest_note", "")) < 10]
check("T14 Interessenvermerk je Quelle vorhanden", not nointerest, ",".join(nointerest))

# T15 Nur RAD-02 beschrieben (git status): keine neuen Dateien in Produktions-/Konzeptpfaden
repo = os.path.abspath(os.path.join(OUT, "..", "..", ".."))
st = subprocess.run(["git", "-C", repo, "status", "--porcelain"], capture_output=True, text=True)
new_paths = [l[3:].strip() for l in st.stdout.splitlines() if l.startswith("??")]
prod_prefixes = ("docs/radiasthesie-konzept/", "css/", "js/", "scripts/", "tests/")
# assets/ bewusst ausgenommen: RAD-05 (parallele Karte) legt dort Bilddateien an.
outside = [x for x in new_paths if x.startswith(prod_prefixes)]
check("T15 Keine neuen Dateien in Produktions-/Konzeptpfaden", not outside, ",".join(outside))
check("T16 Delta-Verzeichnis ist als neue Dateigruppe sichtbar",
      any(x.startswith("docs/radiasthesie-completion/RAD-02") for x in new_paths),
      "git-untracked")

failed = [r for r in results if not r["ok"]]
json.dump({"tests": results, "failed": len(failed), "total": len(results), "timestamp": "2026-11-03"},
          open(os.path.join(parts, "test-report.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("\n%d/%d Tests bestanden" % (len(results) - len(failed), len(results)))
sys.exit(1 if failed else 0)
