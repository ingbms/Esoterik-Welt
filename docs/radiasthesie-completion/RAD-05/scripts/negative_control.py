#!/usr/bin/env python3
"""Negativkontrolle: absichtlich beschaedigter Bestand muss von der Validierung erkannt werden.

Kopie des Medienordners im Scratch anlegen, drei Fehler einbauen (Byteaenderung,
fehlende Datei, Waisen-Datei) und pruefen, dass validate_media.py sie meldet.
Das Original bleibt unberuehrt.

Aufruf: python negative_control.py <media-dir> <scratch-dir> <evidence-dir>
"""
import json
import os
import shutil
import subprocess
import sys

media_dir, scratch, evidence_dir = sys.argv[1], sys.argv[2], sys.argv[3]
target = os.path.join(scratch, "negtest-media")
if os.path.exists(target):
    shutil.rmtree(target)
shutil.copytree(media_dir, target)

# Das kopierte Manifest zeigt sonst weiter auf den echten Bestand. Fuer die
# Negativkontrolle wird es auf die Kopie umgeschrieben (absolute Pfade), damit
# sich die eingebauten Fehler ueberhaupt auf die geprueften Dateien beziehen.
PREFIX = "assets/radiasthesie/media/"
abs_target = os.path.abspath(target).replace("\\", "/")
man = json.load(open(os.path.join(target, "media-manifest.json"), encoding="utf-8"))
for it in man["items"]:
    for holder, feld in ((it["original"], "pfad"),):
        if holder[feld].startswith(PREFIX):
            holder[feld] = abs_target + "/" + holder[feld][len(PREFIX):]
    for v in it["varianten"]:
        if v["pfad"].startswith(PREFIX):
            v["pfad"] = abs_target + "/" + v["pfad"][len(PREFIX):]
with open(os.path.join(target, "media-manifest.json"), "w", encoding="utf-8") as fh:
    json.dump(man, fh, ensure_ascii=False, indent=2)

# Fehler 1: ein Byte in einer Variante kippen
victim = os.path.join(target, "520", "tarot.webp")
data = bytearray(open(victim, "rb").read())
data[-1] = data[-1] ^ 0xFF
open(victim, "wb").write(bytes(data))

# Fehler 2: eine deklarierte Datei entfernen
os.remove(os.path.join(target, "520", "klassisches-pendel.webp"))

# Fehler 3: eine nicht deklarierte Datei hinzufuegen
open(os.path.join(target, "520", "waise.webp"), "wb").write(b"kein echtes bild")

script = os.path.join(os.path.dirname(os.path.abspath(__file__)), "validate_media.py")
proc = subprocess.run(
    [sys.executable, script, target, evidence_dir],
    capture_output=True, text=True, encoding="utf-8", errors="replace",
)
print(proc.stdout)
print("Exitcode der Negativkontrolle:", proc.returncode)

erwartet = ["SHA-256 weicht ab", "Variante fehlt", "Datei ohne Manifesteintrag"]
erfuellt = [e for e in erwartet if e in proc.stdout]
print(f"erkannt: {len(erfuellt)}/{len(erwartet)} -> {erfuellt}")

shutil.rmtree(target)
if proc.returncode != 1 or len(erfuellt) != len(erwartet):
    print("NEGATIVKONTROLLE FEHLGESCHLAGEN: die Validierung erkennt eingebaute Fehler nicht.")
    sys.exit(1)
print("Negativkontrolle bestanden: alle drei eingebauten Fehler wurden gemeldet.")
