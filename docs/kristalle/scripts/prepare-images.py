"""Erzeugt die Kristall-Bildplatten (1:1, Basaltgrund) fuer assets/crystals/.

Quelle: docs/kristalle/image-sources.json (Wahl je Kristall, SHA-256 der 1280er-Rendition)
Ablage der Originaldateien: ausserhalb des Repos (Download-Cache), Nachweis ueber source_sha256.

Verfahren je Bild (nach der Spezifikation docs/kristalle-gallery-spec.md §3):
  * "matte": heller/unruhiger Hintergrund wird ueber eine gradientenbasierte
    Hintergrundmaske entfernt (Rand-Regionenwachstum), das Motiv wird freigestellt
    auf #0b1012 gesetzt. Nur wenn das Motiv nicht bis an den Bildrand reicht.
  * "pad":   Foto wird unbeschnitten in die quadratische Platte gesetzt; Ränder in
    #0b1012. Bei hellem Bildrand laeuft das Foto ueber 3 % sanft in den Grund aus.

In beiden Faellen: kein Beschnitt des Motivs, Motivkante >= 6 % Rand,
Ausgabe 320/640/960/1280 px WebP, Budget aus der Spezifikation.
"""

import hashlib
import json
import os
import sys

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
SRC = 'C:/Users/mas/AppData/Local/hermes/profiles/coder/cache/scratch/crystal-src'
OUT = os.path.join(ROOT, 'assets', 'crystals')
PREVIEW = 'C:/Users/mas/AppData/Local/hermes/profiles/coder/cache/scratch/preview'
BG = (11, 16, 18)          # #0b1012
MASTER = 1280              # Kantenlaenge der Platte
CONTENT = 0.88             # Motivflaeche = 88 % der Platte -> 6 % Rand je Seite
LEVELS = (320, 640, 960, 1280)
BUDGET = {320: 25 * 1024, 640: 60 * 1024, 960: 110 * 1024, 1280: 180 * 1024}
QUALITY = (82, 80, 78, 76, 74, 72, 70, 68, 66, 64, 62)

# Freistellen lohnt nur, wo der Grund hell und das Motiv klar getrennt ist. Alle
# uebrigen Motive behalten ihr Foto unbeschnitten (pad) - dort ist der Bildgrund
# selbst dunkel und geht in den Basaltgrund ueber (Spezifikation §3.1).
MATTE = {'obsidian', 'tigerauge', 'karneol', 'hematit', 'lapis'}
MATTE_COLOR_TOL = 50       # Farbabstand zum Rand-Median, der als Grund gilt
# Ausnahmen: Obsidian hat einen weichen Schlagschatten auf dem weissen Tisch, der
# mit dem Standardabstand stehen bleibt; ein weiterer Abstand nimmt ihn mit,
# waehrend das helle Steininnere als geschlossene Flaeche erhalten bleibt.
MATTE_TOL_OVERRIDE = {'obsidian': 120}
MATTE_ERODE = 1            # 1 px schrumpfen gegen helle Antialiasing-Saeume

# Retusche: Massstabs-Beschriftungen, die im Quellfoto eingebrannt sind
# (Spezifikation §3.1: keine Buchstaben/Zahlen im Bild). Rechtecke in Pixeln des
# Quellbildes; jede Aenderung steht im Bildnachweis (`changes`).
RETOUCH = {
    # gelber Massstabsbalken "1.0 cm" auf der Holzstruktur: Klon aus dem Bereich
    # darueber (gleiche Maserung), vertikal gespiegelt, weich auslaufend.
    'steinholz': {'type': 'clone_up', 'box': (47, 820, 192, 872), 'feather': 8},
    # eingebettete Massstabs-Miniatur ("56 mm", gruener Rahmen) im schwarzen
    # Hintergrund oberhalb des Kristalls: mit dem umgebenden Grund aufgefuellt.
    'moonstone': {'type': 'row_bg', 'box': (160, 55, 305, 225), 'feather': 6},
}


def sel_path():
    return os.path.join(ROOT, 'docs', 'kristalle', '.selection.json')


def luminance(rgb):
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]


def border_stats(arr):
    h, w, _ = arr.shape
    k = max(2, int(round(min(h, w) * 0.02)))
    frame = np.concatenate(
        [arr[:k].reshape(-1, 3), arr[-k:].reshape(-1, 3), arr[:, :k].reshape(-1, 3), arr[:, -k:].reshape(-1, 3)]
    )
    med = np.median(frame, axis=0)
    std = float(frame.std(axis=0).mean())
    return med, std


def connected_from_border(mask):
    lab, _ = ndimage.label(mask)
    edge = np.unique(np.concatenate([lab[0, :], lab[-1, :], lab[:, 0], lab[:, -1]]))
    edge = edge[edge != 0]
    return np.isin(lab, edge)


def background_mask(arr, bg_med, tol=MATTE_COLOR_TOL):
    """Hintergrund = vom Bildrand erreichbare Flaeche ohne starke Kante bzw. ohne
    deutlichen Farbabstand zum Rand-Median. Gradienten im Grund bleiben erreichbar,
    das Motiv ist durch seine Kante abgetrennt."""
    gray = (
        0.2126 * arr[:, :, 0].astype(np.float32)
        + 0.7152 * arr[:, :, 1].astype(np.float32)
        + 0.0722 * arr[:, :, 2].astype(np.float32)
    )
    grad = np.hypot(ndimage.sobel(gray, axis=1), ndimage.sobel(gray, axis=0))
    # Kantenschwelle: Kanten trennen Motiv und Grund. Niedrig genug, um weiche
    # Kanten zuverlaessig zu schliessen, hoch genug, um keine Textur zu zerlegen.
    thr = float(np.clip(np.percentile(grad, 90), 10.0, 26.0))
    smooth = grad <= thr
    dist = np.abs(arr.astype(np.int16) - bg_med.astype(np.int16)).max(axis=2)
    near_bg = dist <= tol
    return connected_from_border(smooth | near_bg), thr


def subject_mask(arr, bg_med, tol=MATTE_COLOR_TOL):
    bg, thr = background_mask(arr, bg_med, tol)
    subj = ndimage.binary_fill_holes(~bg)
    subj = ndimage.binary_opening(subj, structure=np.ones((3, 3)))
    if MATTE_ERODE:
        subj = ndimage.binary_erosion(subj, iterations=MATTE_ERODE)
    lab, n = ndimage.label(subj)
    if n > 1:
        sizes = ndimage.sum(subj, lab, range(1, n + 1))
        subj = lab == int(np.argmax(sizes)) + 1
    return subj, thr


def bbox_of(mask):
    rows = np.where(mask.any(axis=1))[0]
    cols = np.where(mask.any(axis=0))[0]
    if not len(rows) or not len(cols):
        return None
    return int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1


def fit_size(w, h, box):
    s = box / max(w, h)
    return max(1, int(round(w * s))), max(1, int(round(h * s)))


def apply_retouch(im, slug):
    """Entfernt Massstabs-Beschriftungen, die im Quellfoto eingebrannt sind."""
    conf = RETOUCH.get(slug)
    if not conf:
        return im, None
    arr = np.asarray(im).astype(np.float32).copy()
    x0, y0, x1, y1 = conf['box']
    bw, bh = x1 - x0, y1 - y0
    if conf['type'] == 'clone_up':
        dy = bh + 4
        arr[y0:y1, x0:x1] = arr[y0 - dy : y1 - dy, x0:x1][::-1]
    elif conf['type'] == 'row_bg':
        left = arr[y0:y1, x0 - 12 : x0 - 2].mean(axis=1)
        right = arr[y0:y1, x1 + 2 : x1 + 12].mean(axis=1)
        t = np.linspace(0, 1, bw)[None, :, None]
        arr[y0:y1, x0:x1] = left[:, None, :] * (1 - t) + right[:, None, :] * t
    else:
        raise ValueError(conf['type'])
    # Weicher Uebergang, damit keine Rechteckkante stehen bleibt.
    mask = np.zeros(arr.shape[:2], np.float32)
    mask[y0:y1, x0:x1] = 1.0
    mask = ndimage.gaussian_filter(mask, conf['feather'])
    out = np.asarray(im).astype(np.float32) * (1 - mask[..., None]) + arr * mask[..., None]
    return Image.fromarray(np.clip(out, 0, 255).astype(np.uint8)), conf


def compose_matte(im, subj):
    bbox = bbox_of(subj)
    x0, y0, x1, y1 = bbox
    alpha = ndimage.gaussian_filter(subj.astype(np.float32), 1.1)
    alpha = np.clip(alpha, 0.0, 1.0)
    rgba = np.dstack([np.asarray(im).astype(np.uint8), (alpha * 255).astype(np.uint8)])
    crop = Image.fromarray(rgba[y0:y1, x0:x1], 'RGBA')
    tw, th = fit_size(crop.width, crop.height, int(MASTER * CONTENT))
    crop = crop.resize((tw, th), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (MASTER, MASTER), BG + (255,))
    pos = ((MASTER - tw) // 2, (MASTER - th) // 2)
    # Vor dem Alpha-Compositing auf deckenden Grund legen (kein Alpharest in der Datei).
    canvas.alpha_composite(crop, pos)
    return canvas.convert('RGB'), bbox


def compose_pad(im, border_lum):
    tw, th = fit_size(im.width, im.height, int(MASTER * CONTENT))
    photo = im.resize((tw, th), Image.Resampling.LANCZOS).convert('RGBA')
    if border_lum > 40:
        # Helle Bildraender laufen ueber 3 % in den Basaltgrund aus, damit kein
        # harter heller Kasten auf der dunklen Platte steht.
        ramp = np.ones((th, tw), dtype=np.float32)
        fade = max(2, int(round(min(tw, th) * 0.03)))
        ramp[:fade, :] *= np.linspace(0, 1, fade)[:, None]
        ramp[-fade:, :] *= np.linspace(1, 0, fade)[:, None]
        ramp[:, :fade] *= np.linspace(0, 1, fade)[None, :]
        ramp[:, -fade:] *= np.linspace(1, 0, fade)[None, :]
        a = np.asarray(photo).astype(np.uint8).copy()
        a[:, :, 3] = (np.asarray(photo)[:, :, 3].astype(np.float32) * ramp).astype(np.uint8)
        photo = Image.fromarray(a, 'RGBA')
    canvas = Image.new('RGBA', (MASTER, MASTER), BG + (255,))
    canvas.alpha_composite(photo, ((MASTER - tw) // 2, (MASTER - th) // 2))
    return canvas.convert('RGB')


def encode(img, path, budget):
    for q in QUALITY:
        img.save(path, 'WEBP', quality=q, method=6, exact=False)
        size = os.path.getsize(path)
        if size <= budget:
            return q, size
    return QUALITY[-1], os.path.getsize(path)


def corner_delta(plate):
    """5 Stichproben (4 Ecken + obere Mitte) gegen #0b1012, Toleranz +/-4/255."""
    a = np.asarray(plate).astype(np.int16)
    pts = [(3, 3), (3, MASTER - 4), (MASTER - 4, 3), (MASTER - 4, MASTER - 4), (MASTER // 2, 20)]
    return max(int(np.abs(a[y, x] - np.array(BG)).max()) for x, y in pts)


def main():
    check = '--check' in sys.argv
    sel = json.load(open(sel_path(), encoding='utf-8'))
    os.makedirs(PREVIEW, exist_ok=True)
    results = []
    for e in sel:
        slug = e['slug']
        im = Image.open(os.path.join(SRC, slug + '.jpg')).convert('RGB')
        im, retouch = apply_retouch(im, slug)
        arr = np.asarray(im)
        med, std = border_stats(arr.astype(np.float32))
        lum = luminance(med)
        mode = 'matte' if slug in MATTE else 'pad'
        if mode == 'matte':
            subj, thr = subject_mask(arr, med, MATTE_TOL_OVERRIDE.get(slug, MATTE_COLOR_TOL))
            plate, bbox = compose_matte(im, subj)
            ratio = float(subj.mean())
        else:
            plate = compose_pad(im, lum)
            bbox, ratio, thr = None, None, None
        rec = {
            'id': e['id'],
            'slug': slug,
            'mode': mode,
            'border_lum': round(float(lum), 1),
            'border_std': round(float(std), 1),
            'subject_ratio': round(ratio, 3) if ratio is not None else None,
            'subject_bbox': [int(v) for v in bbox] if bbox else None,
            'corner_delta': corner_delta(plate),
            'retouch': retouch['type'] if retouch else None,
        }
        if check:
            plate.resize((420, 420), Image.Resampling.LANCZOS).save(os.path.join(PREVIEW, slug + '.png'))
        else:
            for lv in LEVELS:
                d = os.path.join(OUT, str(lv))
                os.makedirs(d, exist_ok=True)
                path = os.path.join(d, slug + '.webp')
                q, size = encode(plate.resize((lv, lv), Image.Resampling.LANCZOS), path, BUDGET[lv])
                rec.setdefault('levels', {})[str(lv)] = {
                    'quality': q,
                    'bytes': size,
                    'sha256': hashlib.sha256(open(path, 'rb').read()).hexdigest(),
                }
        results.append(rec)
        print(rec['id'], slug, mode, 'lum=%.0f' % lum, 'corner=%d' % rec['corner_delta'], rec.get('levels', ''))
    json.dump(results, open(os.path.join(PREVIEW, 'modes.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('modes ->', os.path.join(PREVIEW, 'modes.json'))


if __name__ == '__main__':
    main()
