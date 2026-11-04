"""Vergleicht die sichtbare Textmenge der Radiästhesie-Seiten mit dem Bestand."""
import re
import html
import sys
import pathlib

def text_of(path):
    s = pathlib.Path(path).read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<main\b.*?</main>', s, re.S)
    if m:
        s = m.group(0)
    s = re.sub(r'<(script|style)\b.*?</\1>', ' ', s, flags=re.S)
    s = re.sub(r'<[^>]+>', ' ', s)
    s = html.unescape(s)
    return re.sub(r'\s+', ' ', s).strip()

base = pathlib.Path(sys.argv[1])
astro = pathlib.Path(sys.argv[2])
for f in sorted(base.glob('*.html')):
    a = astro / f.name
    tb = text_of(f)
    ta = text_of(a) if a.exists() else ''
    pct = (len(ta) - len(tb)) / len(tb) * 100 if tb else 0
    print(f'{f.name:20s} base={len(tb):6d} astro={len(ta):6d} delta={pct:+6.1f} %')
