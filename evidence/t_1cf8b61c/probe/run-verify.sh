#!/usr/bin/env bash
# Projekt-Nachweisskripte gegen den eigenen Build auf 8099 ausführen.
# Eigener Server, PID-basiertes Beenden, Ausgaben in das Abnahme-Verzeichnis.
set -u
cd "$(dirname "$0")/../../.."
OUT="evidence/t_1cf8b61c/verify"
mkdir -p "$OUT"
node evidence/t_1cf8b61c/probe/serve.mjs dist/Esoterik-Welt 8099 > evidence/t_1cf8b61c/probe/serve-verify.log 2>&1 &
SRV=$!
sleep 2
echo "### verify-farbwelten"
node scripts/verify-farbwelten.cjs http://127.0.0.1:8099/Esoterik-Welt/ "$OUT/verify-farbwelten" > "$OUT/verify-farbwelten.log" 2>&1
echo "exit=$?"
tail -3 "$OUT/verify-farbwelten.log"
echo "### verify-farbwelten-rendered"
node scripts/verify-farbwelten-rendered.cjs http://127.0.0.1:8099/Esoterik-Welt/index.html --json "$OUT/rendered.json" > "$OUT/rendered.log" 2>&1
echo "exit=$?"
tail -6 "$OUT/rendered.log"
echo "### verify-farbwelten-sync"
node scripts/verify-farbwelten-sync.cjs --json "$OUT/sync.json" > "$OUT/sync.log" 2>&1
echo "exit=$?"
tail -4 "$OUT/sync.log"
kill "$SRV" 2>/dev/null
wait "$SRV" 2>/dev/null
echo "fertig"
