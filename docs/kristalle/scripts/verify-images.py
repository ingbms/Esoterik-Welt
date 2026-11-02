"""Prueft Bildpaket, Manifest, Daten und Impressum gegen die Spezifikation.

Aufruf: python docs/kristalle/scripts/verify-images.py
Exit 0 = alle Pruefungen bestanden.
"""

import hashlib
import json
import os
import re
import sys

from PIL import Image

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
OUT = os.path.join(ROOT, 'assets', 'crystals')
LEVELS = (320, 640, 960, 1280)
BUDGET = {320: 25 * 1024, 640: 60 * 1024, 960: 110 * 1024, 1280: 180 * 1024}
BG = (11, 16, 18)
failures = []
notes = []


def check(cond, message):
    if cond:
        return True
    failures.append(message)
    return False


def sha(path):
    return hashlib.sha256(open(path, 'rb').read()).hexdigest()


def main():
    manifest = json.load(open(os.path.join(OUT, 'manifest.json'), encoding='utf-8'))
    data = json.load(open(os.path.join(ROOT, 'data', 'crystals.json'), encoding='utf-8'))['crystals']
    sources = {c['crystal_id']: c for c in json.load(open(os.path.join(ROOT, 'docs', 'kristalle', 'image-sources.json'), encoding='utf-8'))['crystals']}
    order = [c['id'] for c in data]

    check(len(manifest['images']) == 30, 'Manifest: %d statt 30 Bilder' % len(manifest['images']))
    check(len(data) == 30, 'data/crystals.json: %d statt 30 Eintraege' % len(data))
    check([i['id'] for i in manifest['images']] == order, 'Manifest-Reihenfolge != data/crystals.json')

    files = 0
    for img in manifest['images']:
        cid, slug = img['id'], img['slug']
        check(cid in sources, '%s fehlt in image-sources.json' % cid)
        if cid in sources:
            sel = [x for x in sources[cid]['candidates'] if x.get('selected')]
            src_sha = sel[0]['source']['renditions']['w1280']['sha256'] if sel else None
            check(img['source_sha256'] == src_sha, '%s: source_sha256 != Recherche-Rendition' % cid)
        for lv in LEVELS:
            path = os.path.join(OUT, str(lv), slug + '.webp')
            check(os.path.exists(path), '%s: Datei fehlt (%s)' % (cid, path))
            if not os.path.exists(path):
                continue
            files += 1
            size = os.path.getsize(path)
            check(size <= BUDGET[lv], '%s: %dpx ueber Budget (%d > %d)' % (cid, lv, size, BUDGET[lv]))
            check(img['bytes'][str(lv)] == size, '%s: bytes %dpx != Manifest' % (cid, lv))
            check(img['sha256'][str(lv)] == sha(path), '%s: sha256 %dpx != Manifest' % (cid, lv))
            with Image.open(path) as im:
                check(im.size == (lv, lv), '%s: %dpx hat Masse %s' % (cid, lv, im.size))
                check(im.mode == 'RGB', '%s: %dpx hat Modus %s (Alpha?)' % (cid, lv, im.mode))
                if lv == 1280:
                    px = im.convert('RGB')
                    pts = [(3, 3), (3, 1276), (1276, 3), (1276, 1276), (640, 20)]
                    delta = max(max(abs(a - b) for a, b in zip(px.getpixel(p), BG)) for p in pts)
                    check(delta <= 4, '%s: Eckfarbe weicht um %d von #0b1012 ab' % (cid, delta))
            check(img['levels'][str(lv)] == '%d/%s.webp' % (lv, slug), '%s: Pfad %dpx falsch' % (cid, lv))
        check(img['credit']['license_url'].startswith('http'), '%s: Lizenz-URL fehlt' % cid)
        check(img['credit']['source_url'].startswith('https://commons.wikimedia.org/'), '%s: Quell-URL fehlt' % cid)
        check(len(img['attribution_text_required']) > 20, '%s: Pflichttext zu kurz' % cid)
        alt = img['credit']['alt']
        check(alt.startswith(sources[cid]['display_name'].split(' (')[0]) or '—' in alt, '%s: Alt beginnt nicht mit dem Namen' % cid)
        check('vollständig im Bild' in alt, '%s: Alt ohne Vollstaendigkeitsangabe' % cid)
        check(len(alt) <= 150, '%s: Alt zu lang (%d)' % (cid, len(alt)))
        check('Bild von' not in alt, '%s: Alt nutzt verbotene Formel' % cid)

    check(files == 120, '%d Bilddateien statt 120' % files)

    # Datenmodell: Bildfelder, Reihenfolge, Attribution
    for c in data:
        img = next((i for i in manifest['images'] if i['id'] == c['id']), None)
        check(img is not None, '%s: kein Manifest-Eintrag' % c['id'])
        if not img:
            continue
        check(c['image'] == 'assets/crystals/640/%s.webp' % img['slug'], '%s: image-Feld falsch' % c['id'])
        check(c['image_stem'] == 'assets/crystals' and c['image_file'] == img['slug'] + '.webp', '%s: stem/file falsch' % c['id'])
        check(c['image_alt'] == img['credit']['alt'], '%s: image_alt != Manifest' % c['id'])
        check(c['attribution_text_short'] == img['attribution_text_short'], '%s: Kurznachweis != Manifest' % c['id'])
        check(c['image_credit']['license_url'] == img['credit']['license_url'], '%s: Lizenz-URL != Manifest' % c['id'])
        check(c['image_credit']['source_url'] == img['credit']['source_url'], '%s: Quell-URL != Manifest' % c['id'])
        check(os.path.exists(os.path.join(ROOT, c['image'])), '%s: image-Datei fehlt' % c['id'])
        check('image_placeholder' not in c, '%s: image_placeholder noch vorhanden' % c['id'])

    # Chakra-Abstieg (grobe Ordnungspruefung wie check-order.cjs)
    expected = ['crys-01', 'crys-09', 'crys-24', 'crys-28', 'crys-08', 'crys-05', 'crys-14',
                'crys-18', 'crys-29', 'crys-11', 'crys-06', 'crys-20', 'crys-22', 'crys-26',
                'crys-02', 'crys-17', 'crys-21', 'crys-25', 'crys-03', 'crys-13', 'crys-07',
                'crys-16', 'crys-12', 'crys-27', 'crys-15', 'crys-30', 'crys-19', 'crys-23',
                'crys-04', 'crys-10']
    check(order == expected, 'Reihenfolge != Spezifikation 5.2')
    for a, b in (('crys-02', 'crys-21'), ('crys-03', 'crys-07')):
        check(abs(order.index(a) - order.index(b)) > 1, 'Doppelmotiv %s/%s benachbart' % (a, b))

    # Impressum
    imp = open(os.path.join(ROOT, 'impressum.html'), encoding='utf-8').read()
    section = imp.split('<h2 id="kristalle-fotos">', 1)
    check(len(section) == 2, 'Impressum: Abschnitt #kristalle-fotos fehlt')
    if len(section) == 2:
        body = section[1].split('</ul>', 1)[0]
        items = re.findall(r'<li>', body)
        links = re.findall(r'href="(https?://[^"]+)"', body)
        check(len(items) == 30, 'Impressum: %d Eintraege statt 30' % len(items))
        check(sum(1 for l in links if 'creativecommons' in l or 'wiki/Template' in l) >= 30, 'Impressum: Lizenz-Links fehlen')
        for img in manifest['images']:
            check(img['credit']['source_url'] in body, 'Impressum: Quelle %s fehlt' % img['id'])
            check(img['credit']['license_url'] in body, 'Impressum: Lizenzlink %s fehlt' % img['id'])

    print('Dateien geprueft:', files)
    print('Summe je Stufe:', {lv: round(sum(i['bytes'][str(lv)] for i in manifest['images']) / 1024) for lv in LEVELS}, 'KB')
    print('Fehler:', len(failures))
    for f in failures:
        print('  FAIL', f)
    for n in notes:
        print('  NOTE', n)
    return 1 if failures else 0


if __name__ == '__main__':
    sys.exit(main())
