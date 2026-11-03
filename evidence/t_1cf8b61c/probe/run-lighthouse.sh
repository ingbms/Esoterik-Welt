#!/usr/bin/env bash
# Lighthouse-Messung der neuen Ansichten gegen den eigenen Build.
# Startet einen eigenen Static-Server auf 3299, misst drei Routen und beendet
# den Server danach über die PID (kein pauschales taskkill).
set -u
cd "$(dirname "$0")/../../.."
OUT="evidence/t_1cf8b61c/lighthouse"
mkdir -p "$OUT"
node evidence/t_1cf8b61c/probe/serve.mjs dist/Esoterik-Welt 3299 > evidence/t_1cf8b61c/probe/serve-lh.log 2>&1 &
SRV=$!
sleep 2
for route in "farbwelten/kompass:kompass" "farbwelten/farbmeditation:farbmeditation" "farbwelten/tuerkis:tuerkis"; do
  hash="${route%%:*}"
  name="${route##*:}"
  node node_modules/lighthouse/cli/index.js \
    "http://127.0.0.1:3299/Esoterik-Welt/#${hash}" \
    --only-categories=accessibility,best-practices,seo \
    --output=json \
    --output-path="$OUT/$name.json" \
    --chrome-flags="--headless=new --no-sandbox --disable-gpu" \
    --quiet \
    --max-wait-for-load=45000 || echo "LIGHTHOUSE_FEHLER $name"
done
kill "$SRV" 2>/dev/null
wait "$SRV" 2>/dev/null
echo "fertig"
