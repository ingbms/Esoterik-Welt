#!/usr/bin/env python3
"""ESOW-RAD-02 Delta: Teile zusammenführen, prüfen, maschinenlesbare und lesbare Artefakte erzeugen.

Aufruf (aus dem Arbeitsbaum):
    python docs/radiasthesie-completion/RAD-02/scripts/build_delta.py

Schreibt ausschließlich in docs/radiasthesie-completion/RAD-02/.
"""
import csv
import json
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.dirname(HERE)
PARTS = os.path.join(HERE, "parts")
EXISTING = os.path.abspath(os.path.join(OUT, "..", "..", "radiasthesie-konzept", "recherche", "quellen.json"))


def load(name):
    with open(os.path.join(PARTS, name), encoding="utf-8") as fh:
        return json.load(fh)


def fail(msg):
    print("FEHLER: " + msg)
    sys.exit(1)


meta = load("meta.json")
sources = load("sources-1.json") + load("sources-2.json")
claims = load("claims-1.json") + load("claims-2.json")

# --- Strukturprüfung -------------------------------------------------------
ids = [s["id"] for s in sources]
if len(ids) != len(set(ids)):
    fail("doppelte Quellen-IDs: %s" % [i for i in ids if ids.count(i) > 1])
expected = ["Q%02d" % n for n in range(34, 67)]
if ids != expected:
    fail("Quellen-IDs nicht fortlaufend Q34-Q66: %s" % ids)

cid = [c["id"] for c in claims]
if len(cid) != len(set(cid)):
    fail("doppelte Claim-IDs")
if cid != ["C%02d" % n for n in range(1, 31)]:
    fail("Claim-IDs nicht fortlaufend C01-C30")

known_claims = set(cid)
known_sources = set(ids) | {"Q%02d" % n for n in range(1, 34)}
for s in sources:
    if s["verified"] not in meta["verification_levels"]:
        fail("%s: unbekanntes Verifikationsniveau %r" % (s["id"], s["verified"]))
    for c in s.get("claims", []):
        if c not in known_claims:
            fail("%s verweist auf unbekannten Claim %s" % (s["id"], c))
    for key in ("title", "authors", "type", "locator", "verified", "interest_note", "evidence_use"):
        if key not in s or s[key] in (None, "", []):
            fail("%s: Pflichtfeld %r fehlt" % (s["id"], key))
    if not re.match(r"^https?://", s["locator"]):
        fail("%s: Locator ist keine URL" % s["id"])

for c in claims:
    if not c.get("evidence"):
        fail("%s: keine Belege" % c["id"])
    for ev in c["evidence"]:
        if ev["source_id"] not in known_sources:
            fail("%s: unbekannte Quelle %s" % (c["id"], ev["source_id"]))
        if len(ev.get("quote", "").strip()) < 15:
            fail("%s: Zitat zu kurz/fehlt (%s)" % (c["id"], ev["source_id"]))
        if not ev.get("locator"):
            fail("%s: Locator fehlt (%s)" % (c["id"], ev["source_id"]))
    if c["status"] not in ("belegt", "widersprüchlich", "unbelegt"):
        fail("%s: unbekannter Status %r" % (c["id"], c["status"]))

# Bestand unangetastet?
if os.path.exists(EXISTING):
    with open(EXISTING, encoding="utf-8") as fh:
        existing = json.load(fh)
    existing_ids = [s["id"] for s in existing["sources"]]
    if len(existing_ids) != 33 or existing_ids[0] != "Q01" or existing_ids[-1] != "Q33":
        fail("Bestandsbibliothek hat sich verändert (erwartet 33 Quellen Q01-Q33): %s" % existing_ids)
else:
    fail("Bestandsbibliothek nicht gefunden: %s" % EXISTING)

# --- Zusammenführen --------------------------------------------------------
delta = dict(meta)
delta["sources"] = sources
delta["claims"] = claims
delta["counts"] = {
    "existing_sources": 33,
    "delta_sources": len(sources),
    "total_sources": 33 + len(sources),
    "claims": len(claims),
    "claims_belegt": sum(1 for c in claims if c["status"] == "belegt"),
    "claims_widerspruechlich": sum(1 for c in claims if c["status"] == "widersprüchlich"),
    "claims_unbelegt": sum(1 for c in claims if c["status"] == "unbelegt"),
}

json_path = os.path.join(OUT, "quellen-delta.json")
with open(json_path, "w", encoding="utf-8", newline="\n") as fh:
    json.dump(delta, fh, ensure_ascii=False, indent=2)
    fh.write("\n")

# --- CSV -------------------------------------------------------------------
csv_path = os.path.join(OUT, "quellen-delta.csv")
with open(csv_path, "w", encoding="utf-8", newline="") as fh:
    w = csv.writer(fh, delimiter=";")
    w.writerow(["id", "jahr", "typ", "titel", "autoren", "verifikation", "evidenzklasse",
                "region", "sprache", "locator", "claims", "delta_rolle", "datenqualitaet_kurz"])
    for s in sources:
        w.writerow([
            s["id"], s.get("year") or "", s["type"], s["title"], " / ".join(s["authors"]),
            s["verified"], ",".join(s["evidence_use"]), s.get("region", ""), s.get("language", ""),
            s["locator"], ",".join(s.get("claims", [])), ",".join(s["delta_role"]),
            " ".join(s.get("data_quality", {}).get("limitations", "").split())[:300],
        ])


def esc(text):
    return str(text).replace("|", "\\|").replace("\n", " ")


# --- QUELLEN-DELTA.md ------------------------------------------------------
lines = ["# Quellen-Delta ESOW-RAD-02 (Q34-Q66)", ""]
lines.append("Maschinenlesbare Fassung: `quellen-delta.json`; Tabellenexport: `quellen-delta.csv`.")
lines.append("")
lines.append("Die bestehenden 33 Quellen (Q01-Q33) bleiben unverändert. Dieses Dokument beschreibt "
             "ausschließlich die Ergänzungen und die daraus abgeleiteten Claims.")
lines.append("")
lines.append("## 1. Neue Quellen")
lines.append("")
lines.append("| ID | Jahr | Typ | Titel | Verifikation | Evidenz | Region | Claims |")
lines.append("| --- | --- | --- | --- | --- | --- | --- | --- |")
for s in sources:
    lines.append("| %s | %s | %s | %s | %s | %s | %s | %s |" % (
        s["id"], s.get("year") or "o. J.", esc(s["type"]), esc(s["title"]), s["verified"],
        ",".join(s["evidence_use"]), esc(s.get("region", "")), ",".join(s.get("claims", [])) or "–"))
lines.append("")
lines.append("## 2. Interessenvermerke und Datenqualität (Kurzfassung)")
lines.append("")
lines.append("| ID | Interessenvermerk | Zentrale Einschränkung |")
lines.append("| --- | --- | --- |")
for s in sources:
    lines.append("| %s | %s | %s |" % (
        s["id"], esc(s["interest_note"]),
        esc(" ".join(s.get("data_quality", {}).get("limitations", "").split()))))
with open(os.path.join(OUT, "QUELLEN-DELTA.md"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("\n".join(lines) + "\n")

# --- CLAIM-QUELLE-MATRIX.md ------------------------------------------------
m = ["# Claim-Quelle-Matrix ESOW-RAD-02 (Delta)", ""]
m.append("Jeder Claim nennt Quelle, Locator und ein wörtliches Zitat. Status: **belegt** (Quelle stützt die "
         "Aussage im Rahmen ihrer Methode), **widersprüchlich** (konkurrierende Quellen), **unbelegt** "
         "(Behauptung ohne tragfähigen Beleg).")
m.append("")
m.append("## Übersicht")
m.append("")
m.append("| Claim | Aussage | Status | Quellen | Konfidenz |")
m.append("| --- | --- | --- | --- | --- |")
for c in claims:
    m.append("| %s | %s | %s | %s | %s |" % (
        c["id"], esc(c["text"]), c["status"],
        ", ".join(dict.fromkeys(e["source_id"] for e in c["evidence"])), esc(c["confidence"])))
m.append("")
m.append("## Einzelbelege")
m.append("")
for c in claims:
    m.append("### %s — %s" % (c["id"], c["status"]))
    m.append("")
    m.append(c["text"])
    m.append("")
    for ev in c["evidence"]:
        m.append("- **%s** (%s): „%s“" % (ev["source_id"], ev["locator"], ev["quote"].replace("\n", " ")))
    m.append("")
    m.append("Gegenbefund/Einschränkung: %s" % c["counter_evidence"])
    m.append("")
with open(os.path.join(OUT, "CLAIM-QUELLE-MATRIX.md"), "w", encoding="utf-8", newline="\n") as fh:
    fh.write("\n".join(m))

print("OK: %d Quellen (Q34-Q66), %d Claims" % (len(sources), len(claims)))
print("geschrieben: quellen-delta.json, quellen-delta.csv, QUELLEN-DELTA.md, CLAIM-QUELLE-MATRIX.md")
for c in delta["counts"].items():
    print("  %s = %s" % c)
