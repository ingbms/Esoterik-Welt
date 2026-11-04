"""Zeigt Absätze, die im Bestand stehen, aber in der Astro-Ausgabe fehlen."""
import re
import html
import sys
import pathlib

def paragraphs(path):
    s = pathlib.Path(path).read_text(encoding='utf-8', errors='replace')
    m = re.search(r'<main\b.*?</main>', s, re.S)
    if m:
        s = m.group(0)
    s = re.sub(r'<(script|style)\b.*?</\1>', ' ', s, flags=re.S)
    parts = re.split(r'</(?:p|li|h1|h2|h3|h4|td|th|dd|dt|figcaption|blockquote|caption)>|<br\s*/?>', s, flags=re.I)
    out = []
    for part in parts:
        t = re.sub(r'<[^>]+>', ' ', part)
        t = re.sub(r'\s+', ' ', html.unescape(t)).strip()
        if len(t) >= 25:
            out.append(t)
    return out

base = pathlib.Path(sys.argv[1]) / sys.argv[3]
astro = pathlib.Path(sys.argv[2]) / sys.argv[3]
pb = paragraphs(base)
pa = paragraphs(astro)
joined = '\n'.join(pa)
missing = [p for p in pb if p not in joined]
print(f'{sys.argv[3]}: {len(pb)} Absätze im Bestand, {len(pa)} in Astro, {len(missing)} fehlen')
for p in missing:
    print('  FEHLT:', p[:240])
