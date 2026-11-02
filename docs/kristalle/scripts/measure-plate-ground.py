"""Misst die Helligkeit des fotografierten Grundes je ausgelieferter Kristallkachel.

Hintergrund (Review P2.2): Zwei Alt-Texte behaupteten "vor dunklem Grund", obwohl
das gelieferte WebP eine helle Studioflaeche zeigt. Die Grundangabe muss aus dem
gelieferten Bild abgeleitet werden, nicht aus dem Quellfoto.

Verfahren:
 1. Fotoplatte finden: Bounding-Box aller Pixel, die sich vom Basaltgrund
    (#0b1012, Luminanz 0,059) um mehr als SCHWELLE unterscheiden.
 2. Randstreifen (obere/untere 10 % der Platte) mitteln; dort liegt bei
    Objektfotos der Studiohintergrund, nicht das Motiv.
 3. Klassifikation: >= 0,30 hell, <= 0,12 dunkel, sonst mittel/einfarbig.

Ausgabe: JSON (stdout oder Datei) mit Rohwerten je Bild; dient als Belegdatei
docs/kristalle/plate-ground.json.
"""

import json
import os
import sys

from PIL import Image

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
ASSETS = os.path.join(ROOT, 'assets', 'crystals')
BG_LUM = 0.0591  # #0b1012
DIFF = 0.035     # Toleranz gegen WebP-Kantenrauschen
STRIP = 0.10     # Anteil der Plattenhoehe fuer den Randstreifen


def px_lum(r, g, b):
    return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255.0


def analyse(path):
    im = Image.open(path).convert('RGB')
    w, h = im.size
    px = im.load()

    def is_plate(x, y):
        return abs(px_lum(*px[x, y]) - BG_LUM) > DIFF

    # Bounding-Box der Platte (grob, jede 2. Zeile/Spalte reicht).
    x0, y0, x1, y1 = w, h, -1, -1
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if is_plate(x, y):
                if x < x0:
                    x0 = x
                if x > x1:
                    x1 = x
                if y < y0:
                    y0 = y
                if y > y1:
                    y1 = y
    if x1 < 0:
        return None

    strip_h = max(2, int((y1 - y0 + 1) * STRIP))

    def band(y_from, y_to):
        total, n = 0.0, 0
        for y in range(max(y0, y_from), min(y1 + 1, y_to)):
            for x in range(x0, x1 + 1):
                total += px_lum(*px[x, y])
                n += 1
        return total / n if n else None

    top = band(y0, y0 + strip_h)
    bottom = band(y1 + 1 - strip_h, y1 + 1)
    whole = band(y0, y1 + 1)
    ref = top if top is not None else 0.0
    if whole is not None and bottom is not None and (bottom or 0) < (top or 0):
        ref = bottom
    ref = ref if ref is not None else whole
    if ref is None:
        cls = 'unbekannt'
    elif ref >= 0.30:
        cls = 'hell'
    elif ref <= 0.12:
        cls = 'dunkel'
    else:
        cls = 'mittel'
    return {
        'plate_bbox': [x0, y0, x1, y1],
        'strip_lum_top': round(top, 4) if top is not None else None,
        'strip_lum_bottom': round(bottom, 4) if bottom is not None else None,
        'plate_lum': round(whole, 4) if whole is not None else None,
        'ground_lum': round(ref, 4),
        'ground_class': cls,
    }


def main():
    manifest = json.load(open(os.path.join(ASSETS, 'manifest.json'), encoding='utf-8'))
    out = {'method': 'Randstreifen der Fotoplatte im gelieferten 1280er-WebP; '
                     'Klassen: hell >= 0.30, dunkel <= 0.12, mittel dazwischen',
           'images': {}}
    for img in manifest['images']:
        path = os.path.join(ASSETS, img['levels']['1280'])
        data = analyse(path)
        if data is None:
            data = {'ground_class': 'ohne Fotogrund (Freisteller)'}
        data['mode'] = img['production']['mode']
        data['alt'] = img['credit']['alt']
        out['images'][img['id']] = data
    text = json.dumps(out, ensure_ascii=False, indent=1) + '\n'
    if len(sys.argv) > 1:
        with open(sys.argv[1], 'w', encoding='utf-8', newline='\n') as fh:
            fh.write(text)
        print('geschrieben:', sys.argv[1])
    else:
        sys.stdout.write(text)


if __name__ == '__main__':
    main()
