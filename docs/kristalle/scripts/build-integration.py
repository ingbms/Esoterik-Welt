"""Baut aus Bildpaket + Recherche-Manifest die Auslieferungsdaten:

  assets/crystals/manifest.json          ausgeliefertes Derivat (Spec §4.4)
  data/crystals.json                     Bildfelder + Reihenfolge (Spec §5.2/§9.4)
  docs/kristalle/QUELLEN-RECHTS-MANIFEST.md    Sammelnachweis (Ebene 3)
  docs/kristalle/impressum-snippet.html  Abschnitt #kristalle-fotos

Die Alt-Texte und der Änderungstext werden hier gepflegt, nicht in den Quelldaten:
der Recherchebestand (docs/kristalle/image-sources.json) bleibt unverfälscht.

`attribution_text_required` wird NICHT mehr aus dem Recherchebestand übernommen,
sondern ausschließlich aus `credit` (Urheber, Lizenz, Lizenz-URL, Quelle,
ShareAlike, Änderungen) plus `production.mode`/`production.retouch` erzeugt – eine
Quelle der Wahrheit in `scripts/lib/crystal-attribution.cjs` (Review t_385afa1e,
Befund P1.1). Der dortige Text behauptete einen Beschnitt, drei statt vier
Ausgabestufen und JPEG-Kodierung.
"""

import hashlib
import json
import os
import subprocess

ROOT = 'C:/Users/mas/Arbeit/Esoterik-Welt'
OUT = os.path.join(ROOT, 'assets', 'crystals')
LEVELS = (320, 640, 960, 1280)
TODAY = '2026-11-02'

# Reihenfolge der Spezifikation §5.2 (Chakra-Abstieg Krone -> Wurzel).
ORDER = [
    'crys-01', 'crys-09', 'crys-24', 'crys-28', 'crys-08', 'crys-05', 'crys-14',
    'crys-18', 'crys-29', 'crys-11', 'crys-06', 'crys-20', 'crys-22', 'crys-26',
    'crys-02', 'crys-17', 'crys-21', 'crys-25', 'crys-03', 'crys-13', 'crys-07',
    'crys-16', 'crys-12', 'crys-27', 'crys-15', 'crys-30', 'crys-19', 'crys-23',
    'crys-04', 'crys-10',
]

# Alt-Text (Dialog): Name — Motivtyp vor Grund, Vollständigkeit, zwei Merkmale.
ALT = {
    'crys-01': 'Amethyst — violette Kristallstufe über gelboranger Matrix, vollständig im Bild, Spitzen und Bruchflächen sichtbar',
    'crys-02': 'Rosenquarz — tiefrosafarbener massiver Handstein vor dunklem Grund, vollständig im Bild, körnige Oberfläche und Bruchkanten sichtbar',
    'crys-03': 'Zitrin — orangegelbe Kristallstufe mit Matrix vor dunklem Grund, vollständig im Bild, Kristallspitzen sichtbar',
    'crys-04': 'Schneeflockenobsidian — polierter schwarzer Knollen vor dunklem Grund, vollständig im Bild, helle Einschlüsse sichtbar',
    'crys-05': 'Lapis Lazuli — ultramarinblauer Handstein vor dunklem Grund, vollständig im Bild, goldene Pyritadern sichtbar',
    'crys-06': 'Malachit — traubige grüne Kruste auf hellem Dolomit vor dunklem Grund, vollständig im Bild, knospige Oberfläche sichtbar',
    'crys-07': 'Citrin — geschliffener goldgelber Einzelkristall vor dunklem Grund, vollständig im Bild, klare Facettenflächen sichtbar',
    'crys-08': 'Fluorit — grüne Stufe aus würfeligen Kristallen vor dunklem Grund, vollständig im Bild, Würfelkanten sichtbar',
    'crys-09': 'Selenit — hochkant stehende transparente Gipssäule vor dunklem Grund, vollständig im Bild, Schichtung sichtbar',
    'crys-10': 'Schwarzer Turmalin — längs gestreifter Schörl-Kristall vor dunklem Grund, vollständig im Bild, Riefung sichtbar',
    'crys-11': 'Aventurin — polierter grüner Trommelstein vor dunklem Stoffgrund, vollständig im Bild, glänzende Oberfläche sichtbar',
    'crys-12': 'Karneol — orange-roter Achat-Handstein vor dunklem Grund, vollständig im Bild, Bänderung und Bruchkante sichtbar',
    'crys-13': 'Tigerauge — polierter goldbrauner Ei-Stein vor dunklem Grund, vollständig im Bild, helles Chatoyance-Band sichtbar',
    'crys-14': 'Labradorit — polierte Platte vor dunklem Grund, vollständig im Bild, blau-goldener Labradoreszenz-Schimmer sichtbar',
    'crys-15': 'Petrified Wood — angeschnittene Scheibe vor dunklem Grund, vollständig im Bild, Jahresringe und Zellstruktur sichtbar',
    'crys-16': 'Bernstein — polierter honiggelber baltischer Bernstein vor hellem Grund, vollständig im Bild, Oberflächenglanz sichtbar',
    'crys-17': 'Mondstein — angeschliffene Platte vor dunklem Grund, vollständig im Bild, blauer Schimmer und Vitrinenreflexe sichtbar',
    'crys-18': 'Celestit — hellblaue Kristallgruppe auf Matrix vor dunklem Grund, vollständig im Bild, tafelige Kristallformen sichtbar',
    'crys-19': 'Grossular-Granat — drei gelbgrüne Ikosaeder-Kristalle vor dunklem Grund, vollständig im Bild, Facettenflächen sichtbar',
    'crys-20': 'Smaragd — grüne Beryll-Kristalle in heller Matrix vor dunklem Grund, vollständig im Bild, Kristallköpfe sichtbar',
    'crys-21': 'Rosenquarz — blassrosa, milchig-trüber massiver Brocken vor hellem Grund, vollständig im Bild, matte Bruchflächen sichtbar',
    'crys-22': 'Amazonit — türkisgrüner Feldspat mit Rauchquarz vor dunklem Grund, vollständig im Bild, Kristallflächen sichtbar',
    'crys-23': 'Hematit — traubiger, metallisch grau-blau schillernder Einzelstein vor dunklem Grund, vollständig im Bild, Knollenoberfläche sichtbar',
    'crys-24': 'Kristallquarz — klarer Bergkristall mit Endfläche vor hellem Grund, vollständig im Bild, klare Silhouette sichtbar',
    'crys-25': 'Peridot — grüner Olivinkristall vor dunklem Grund, vollständig im Bild, Facetten und Einschlüsse sichtbar',
    'crys-26': 'Kunzit — rosavioletter Spodumen-Kristall vor dunklem Grund, vollständig im Bild, Spaltflächen sichtbar',
    'crys-27': 'Roter Jaspis — plattiger roter Handstein mit grünen Einschlüssen vor dunklem Grund, vollständig im Bild, Bruchkante sichtbar',
    'crys-28': 'Feueropal — oranger Opal in dunkler Matrix vor hellem Studiohintergrund, vollständig im Bild, leuchtende Farbflächen sichtbar',
    'crys-29': 'Aquamarin — hellblauer Kristall auf dunklem Muskovit vor dunklem Grund, vollständig im Bild, Kristallflächen sichtbar',
    'crys-30': 'Rauchquarz — hochkant stehender graubrauner Kristall vor grauem Grund, vollständig im Bild, Kristallspitze sichtbar',
}

RETOUCH_NOTE = {
    'steinholz': 'Maßstabsbalken „1.0 cm“ retuschiert',
    'moonstone': 'eingebettete Maßstabs-Miniatur „56 mm“ entfernt',
}


def levels_for(slug):
    out = {}
    for lv in LEVELS:
        p = os.path.join(OUT, str(lv), slug + '.webp')
        data = open(p, 'rb').read()
        out[str(lv)] = {'path': f'{lv}/{slug}.webp', 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()}
    return out


def changes_text(rec):
    parts = ['1:1-Leinwand mit 6 % Rand', 'Hintergrund auf #0b1012 vereinheitlicht']
    if rec['mode'] == 'matte':
        parts.append('Motiv freigestellt')
    elif rec['border_lum'] > 40:
        parts.append('Bildrand weich in den Grund überblendet')
    if rec.get('retouch'):
        parts.append(RETOUCH_NOTE[rec['slug']])
    parts.append('Skalierung auf 320/640/960/1280 px (WebP)')
    return ', '.join(parts)


def attribution_texts(images):
    """Erzeugt attribution_text_required mit der gemeinsamen Regel (Node-Modul).

    Eine Implementierung für Generator, Sync-Skript und Test; hier wird sie nur
    aufgerufen, damit Python und JavaScript nicht auseinanderlaufen können.
    """
    payload = json.dumps(images, ensure_ascii=False).encode('utf-8')
    proc = subprocess.run(
        ['node', os.path.join(ROOT, 'scripts', 'lib', 'crystal-attribution.cjs')],
        input=payload,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        check=False,
    )
    if proc.returncode != 0:
        raise SystemExit('crystal-attribution.cjs fehlgeschlagen: ' + proc.stderr.decode('utf-8'))
    texts = json.loads(proc.stdout.decode('utf-8'))
    if len(texts) != len(images):
        raise SystemExit('crystal-attribution.cjs lieferte %d statt %d Texte' % (len(texts), len(images)))
    return {img['id']: text for img, text in zip(images, texts)}


def main():
    sel = {e['id']: e for e in json.load(open(ROOT + '/docs/kristalle/.selection.json', encoding='utf-8'))}
    modes = {m['id']: m for m in json.load(open('C:/Users/mas/AppData/Local/hermes/profiles/coder/cache/scratch/preview/modes.json', encoding='utf-8'))}
    assert len(sel) == 30 and len(modes) == 30, (len(sel), len(modes))
    assert sorted(ORDER) == sorted(sel), 'ORDER muss alle 30 IDs enthalten'

    images = []
    for cid in ORDER:
        e, m = sel[cid], modes[cid]
        lv = levels_for(e['slug'])
        credit = {
            'author': e['author'],
            'source_label': 'Wikimedia Commons',
            'source_url': e['page_url'],
            'license': e['license_name'],
            'license_url': e['license_url'],
            'share_alike': bool(e['share_alike']),
            'retrieved': e['retrieved_at'],
            'changes': changes_text(m),
            'alt': ALT[cid],
        }
        images.append({
            'id': cid,
            'slug': e['slug'],
            'title': e['file_title'],
            'levels': {k: v['path'] for k, v in lv.items()},
            'size': [1280, 1280],
            'bytes': {k: v['bytes'] for k, v in lv.items()},
            'sha256': {k: v['sha256'] for k, v in lv.items()},
            'source_sha256': e['w1280_sha256'],
            'subject_bbox': m['subject_bbox'],
            'production': {
                'mode': m['mode'],
                'background': '#0b1012',
                'content_box': 0.88,
                'corner_delta': m['corner_delta'],
                'retouch': m.get('retouch'),
                'quality': {k: v['quality'] for k, v in m.get('levels', {}).items()},
            },
            'attribution_text_short': e['attribution_text_short'],
            'attribution_text_required': '',  # wird nach der Schleife gesetzt
            'credit': credit,
        })

    texts = attribution_texts(images)
    for img in images:
        img['attribution_text_required'] = texts[img['id']]
        img['adaptation_license'] = (
            {'name': img['credit']['license'], 'url': img['credit']['license_url']}
            if img['credit']['share_alike']
            else None
        )

    manifest = {
        'package': 'crystals-v1',
        'generated_from': 'docs/kristalle/image-sources.json',
        'generated': TODAY,
        'license_policy': 'nur Public Domain / CC0 / CC BY / CC BY-SA, keine NC/ND',
        'geometry': {'master_px': 1280, 'aspect': '1:1', 'content_box': 0.88, 'background': '#0b1012',
                     'levels': list(LEVELS), 'format': 'WebP'},
        'images': images,
    }
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'manifest.json'), 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=1)
        f.write('\n')

    # ---- data/crystals.json: Bildfelder + Reihenfolge -------------------
    raw = json.load(open(ROOT + '/data/crystals.json', encoding='utf-8'))
    by_id = {c['id']: c for c in raw['crystals']}
    lines = []
    for img in images:
        c = dict(by_id[img['id']])
        c.pop('image_placeholder', None)
        slug = img['slug']
        c['image'] = f'assets/crystals/640/{slug}.webp'
        c['image_stem'] = 'assets/crystals'
        c['image_file'] = f'{slug}.webp'
        c['image_alt'] = img['credit']['alt']
        c['attribution_text_short'] = img['attribution_text_short']
        c['attribution_text_required'] = img['attribution_text_required']
        c['image_credit'] = {
            'author': img['credit']['author'],
            'source_label': img['credit']['source_label'],
            'source_url': img['credit']['source_url'],
            'license': img['credit']['license'],
            'license_url': img['credit']['license_url'],
            'share_alike': img['credit']['share_alike'],
            'retrieved': img['credit']['retrieved'],
            'changes': img['credit']['changes'],
        }
        lines.append('    ' + json.dumps(c, ensure_ascii=False, separators=(',', ':')))
    body = '{\r\n  "crystals": [\r\n' + ',\r\n'.join(lines) + '\r\n  ]\r\n}\r\n'
    open(ROOT + '/data/crystals.json', 'w', encoding='utf-8', newline='').write(body)

    # ---- Sammelnachweis (Markdown) --------------------------------------
    md = ['# Quellen- und Rechtenachweis: Kristallfotografien', '',
          f'Stand {TODAY}. Grundlage: `docs/kristalle/image-sources.json` (Bildrecherche), ausgeliefert als',
          '`assets/crystals/manifest.json` und im Impressum unter `#kristalle-fotos`.', '',
          'Alle Fotografien stammen von Wikimedia Commons. Zulässig sind ausschließlich Public Domain, CC0,',
          'CC BY und CC BY-SA (keine NC/ND). Jede Datei trägt Urheber, Lizenz samt Lizenz-URL, Quellseite,',
          'Abrufdatum, die vorgenommenen Änderungen und die SHA-256-Prüfsumme je Ausgabestufe.', '',
          'Bearbeitung aller Bilder (einheitlich): 1:1-Leinwand mit 6 % Rand auf `#0b1012`, Skalierung auf',
          '320/640/960/1280 px, WebP (Qualität 78–82). Je Bild zusätzlich vermerkt: Freistellung oder',
          'Randüberblendung, Retuschen. Bei ShareAlike-Bildern steht die bearbeitete Fassung unter derselben',
          'Lizenz.', '']
    for img in images:
        cr = img['credit']
        md += [f'## {img["id"]} — {img["title"]}', '',
               f'- Urheber: {cr["author"]}',
               f'- Lizenz: {cr["license"]} — <{cr["license_url"]}>',
               f'- Quelle: {cr["source_label"]}, <{cr["source_url"]}> (abgerufen {cr["retrieved"]})',
               f'- Änderungen: {cr["changes"]}']
        if cr['share_alike']:
            md.append(f'- Lizenz der bearbeiteten Fassung: {cr["license"]} (ShareAlike)')
        md.append(f'- Pflicht-Namensnennung: {img["attribution_text_required"]}')
        md.append('- Dateien: ' + ', '.join(f'{k}px {b} B' for k, b in img['bytes'].items()))
        md.append('- Prüfsummen: ' + ', '.join(f'{k}px {h}' for k, h in img['sha256'].items()))
        md.append(f'- Bildbeschreibung (Alt-Text): {cr["alt"]}')
        md.append('')
    open(ROOT + '/docs/kristalle/QUELLEN-RECHTS-MANIFEST.md', 'w', encoding='utf-8').write('\n'.join(md))

    # ---- Impressum-Snippet ----------------------------------------------
    h = ['<h2 id="kristalle-fotos">Fotografie: Kristalle &amp; Steine</h2>',
         '<p>',
         '  Die Kristallgalerie zeigt 30 Fotografien von Wikimedia Commons. Je Bild sind Urheber und Lizenz unter',
         '  der Karte und vollständig im Detaildialog genannt; hier stehen alle Nachweise dauerhaft. Bearbeitung',
         '  aller Bilder: 1:1-Leinwand mit 6 % Rand auf <code>#0b1012</code>, Skalierung auf',
         '  320/640/960/1280 px, WebP. Bei Bildern unter CC BY-SA steht die bearbeitete Fassung unter derselben',
         '  Lizenz. Maschinenlesbar: <code>assets/crystals/manifest.json</code>.',
         '</p>',
         '<ul class="crystal-credits">']
    for img in images:
        cr = img['credit']
        sa = ' Die bearbeitete Fassung steht ebenfalls unter dieser Lizenz (ShareAlike).' if cr['share_alike'] else ''
        h.append(
            '  <li>'
            f'<strong>{img["id"]} · {img["title"].replace("File:", "")}</strong> — {cr["author"]}, '
            f'<a href="{cr["license_url"]}" rel="noopener">{cr["license"]}</a>. '
            f'Quelle: <a href="{cr["source_url"]}" rel="noopener">Wikimedia Commons</a>, abgerufen {cr["retrieved"]}. '
            f'Änderungen: {cr["changes"]}.{sa}'
            '</li>'
        )
    h += ['</ul>']
    snippet = '\n'.join(h) + '\n'
    open(ROOT + '/docs/kristalle/impressum-snippet.html', 'w', encoding='utf-8').write(snippet)

    # Impressum zwischen den Markern aktualisieren (ein Generator, keine Doppelpflege).
    imp_path = ROOT + '/impressum.html'
    imp = open(imp_path, encoding='utf-8').read()
    start, end = '<!-- KRISTALLE-CREDITS:START -->', '<!-- KRISTALLE-CREDITS:END -->'
    if start in imp and end in imp:
        head, rest = imp.split(start, 1)
        _, tail = rest.split(end, 1)
        # Einrueckung wie der umgebende Rechtstext (10 Leerzeichen).
        indent = '\n'.join(('          ' + line) if line.strip() else '' for line in snippet.rstrip('\n').split('\n'))
        block = f'{start}\n{indent}\n          {end}'
        imp = f'{head}{block}{tail}'
        open(imp_path, 'w', encoding='utf-8', newline='').write(imp)
        # Prettier formatiert die neu erzeugten Zeilen um; das hier ausfuehren, damit
        # `npm run format:check` nach jedem Generatorlauf gruen bleibt.
        try:
            subprocess.run(
                'npx prettier --write impressum.html',
                shell=True,
                cwd=ROOT,
                check=False,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
            )
        except OSError as exc:  # pragma: no cover - nur ohne node/npx
            print('Hinweis: prettier nicht ausgefuehrt (%s); `npm run format` nachziehen.' % exc)
        print('impressum.html: Kristall-Nachweise aktualisiert')
    else:
        print('WARNUNG: Marker KRISTALLE-CREDITS fehlen in impressum.html')

    total = {lv: sum(i['bytes'][str(lv)] for i in images) for lv in LEVELS}
    print('manifest images:', len(images))
    print('bytes per level:', total)
    print('avg per level:', {k: round(v / 30 / 1024, 1) for k, v in total.items()}, 'KB')
    over = [(i['id'], lv, i['bytes'][str(lv)]) for i in images for lv in LEVELS]
    print('max bytes 1280:', max(i['bytes']['1280'] for i in images))
    print('data/crystals.json written, order head:', [c for c in ORDER[:4]])


if __name__ == '__main__':
    main()
