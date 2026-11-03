#!/usr/bin/env python3
"""Schritt 10: Bildnachweisseite und Attributionsdatei aus dem Manifest erzeugen.

Beide Ausgaben entstehen ausschliesslich aus media-manifest.json. Es gibt keine
zweite, von Hand gepflegte Wahrheit — wer das Manifest aendert, erzeugt die
Nachweise neu.

Aufruf: python build_attribution.py <media-dir>
"""
import html
import json
import os
import sys


def esc(text):
    return html.escape("" if text is None else str(text), quote=True)


def num(value):
    """Ganzzahl mit deutschem Tausenderpunkt."""
    return f"{int(value):,}".replace(",", ".")


PREFIX = "assets/radiasthesie/media/"


def rel(path):
    """Manifestpfade sind projektwurzel-relativ; die Nachweisseite liegt in media/.

    Fuer img/src muss der Pfad relativ zur Seite gelten, sonst laedt der Browser
    von /assets/radiasthesie/media/assets/radiasthesie/media/... und bekommt 404.
    """
    if path and path.startswith(PREFIX):
        return path[len(PREFIX):]
    return path


def render_html(m):
    items = m["items"]
    rows = []
    for it in items:
        variants = "".join(
            f"<li><code>{esc(v['pfad'])}</code> — {v['breite']}×{v['hoehe']} px, "
            f"{v['format'].upper()}, {num(v['bytes'])} B</li>"
            for v in it["varianten"]
        )
        skipped = "".join(
            f"<li>{s['breite']} px entfällt: {esc(s['grund'])}</li>" for s in it["varianten_uebersprungen"]
        )
        marke = f"<p><strong>Marke:</strong> {esc(it['rechte']['marken'])}</p>" if it["rechte"]["marken"] else ""
        src = it["web"]["src"]
        rows.append(f"""
    <article class="motiv" id="{esc(it['key'])}">
      <h2>{esc(it['motiv'])} <span class="id">{esc(it['id'])}</span></h2>
      <figure>
        <img src="{esc(rel(src))}" alt="{esc(it['alt'])}" width="{it['web']['width']}" height="{it['web']['height']}" loading="lazy" decoding="async">
        <figcaption>{esc(it['caption'])}</figcaption>
      </figure>
      <dl>
        <dt>Urheber</dt><dd><a href="{esc(it['urheber']['url'])}" rel="noopener">{esc(it['urheber']['name'])}</a></dd>
        <dt>Lizenz</dt><dd>{esc(it['lizenz']['kurz'])} — <a href="{esc(it['lizenz']['url'])}" rel="noopener license">{esc(it['lizenz']['url'])}</a></dd>
        <dt>Attributionspflicht</dt><dd>{'ja' if it['lizenz']['attribution_pflicht'] else 'nein (Nennung erfolgt freiwillig)'}</dd>
        <dt>ShareAlike</dt><dd>{'ja — Varianten stehen ebenfalls unter dieser Lizenz' if it['lizenz']['share_alike'] else 'nein'}</dd>
        <dt>Originalseite</dt><dd><a href="{esc(it['quelle']['dateiseite'])}" rel="noopener">{esc(it['quelle']['dateiseite'])}</a></dd>
        <dt>Stand der Seite</dt><dd>{esc(it['quelle']['seiten_stand'])} (revid {esc(it['quelle']['seiten_revid'])})</dd>
        <dt>Original</dt><dd>{esc(it['original']['mime'])}, {it['original']['breite']}×{it['original']['hoehe']} px,
          {num(it['original']['bytes'])} B, SHA-1 <code>{esc(it['original']['sha1'])}</code></dd>
        <dt>Verändert</dt><dd>{esc(it['lizenz']['aenderungshinweis'])}</dd>
        <dt>Länderhinweis</dt><dd>{esc(it['rechte']['laenderhinweis'])}</dd>
      </dl>
      {marke}
      <p class="attr"><strong>Attributionszeile:</strong> {esc(it['attribution_text'])}</p>
      <p class="hinweis">{esc(it['rechte']['bedenken'])}</p>
      <details><summary>Dateien</summary><ul>{variants}{skipped}</ul></details>
    </article>""")

    own = "".join(
        f"""
      <tr>
        <td><code>{esc(a['datei'])}</code></td>
        <td>{esc(a['motiv'])}</td>
        <td>{esc(a['lizenz']['kurz'])}</td>
        <td>{'geprüft, ohne Befund' if a['sicherheitspruefung']['fehler'] == 0 else 'Befund vorhanden'}</td>
      </tr>"""
        for a in m["own_assets"]
    )

    open_issues = "".join(f"<li>{esc(x)}</li>" for x in m["open_issues"])

    return f"""<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Bildnachweis Radiästhesie, Pendeln und Orakel</title>
<style>
  :root {{ color-scheme: light dark; }}
  body {{ font-family: system-ui, -apple-system, "Segoe UI", sans-serif; max-width: 60rem; margin: 0 auto; padding: 2rem 1rem 4rem; line-height: 1.6; }}
  h1 {{ font-size: 1.8rem; line-height: 1.2; }}
  h2 {{ font-size: 1.2rem; margin-top: 2.5rem; border-top: 1px solid #8884; padding-top: 1.5rem; }}
  .id {{ font-size: .8rem; font-weight: 400; opacity: .7; }}
  figure {{ margin: 1rem 0; }}
  img {{ max-width: 100%; height: auto; border-radius: 4px; background: #8881; }}
  figcaption {{ font-size: .9rem; opacity: .85; margin-top: .5rem; }}
  dl {{ display: grid; grid-template-columns: max-content 1fr; gap: .3rem 1rem; font-size: .9rem; }}
  dt {{ font-weight: 600; }}
  dd {{ margin: 0; overflow-wrap: anywhere; }}
  code {{ font-size: .82em; overflow-wrap: anywhere; }}
  .attr {{ background: #8881; padding: .7rem .9rem; border-radius: 4px; font-size: .9rem; }}
  .hinweis {{ font-size: .9rem; opacity: .9; }}
  table {{ border-collapse: collapse; width: 100%; font-size: .9rem; }}
  th, td {{ text-align: left; padding: .4rem .6rem; border-bottom: 1px solid #8883; vertical-align: top; }}
</style>
</head>
<body>
<h1>Bildnachweis — Radiästhesie, Pendeln und Orakel</h1>

<p>Diese Seite wird automatisch aus <code>media-manifest.json</code> erzeugt
(Stand {esc(m['generated_at'])}, Quellen abgerufen am {esc(m['retrieved_at'])}).
Sie nennt für jedes Bild Urheber, Lizenz mit Link, Originalquelle, Änderungen und
Länderhinweise. Alle Bilder wurden an der Originalquelle geprüft und bytegenau
gegen die dort gemeldete Prüfsumme abgeglichen.</p>

<p>{len(items)} Motive, {m['counts']['varianten']} Bildvarianten,
{m['counts']['eigene_svgs']} eigene Zeichnungen. Lizenzpolitik: zugelassen sind
Public Domain, CC0 und CC-BY(-SA); ausgeschlossen sind NC, ND, GFDL-only und
ungeklärte Herkünfte.</p>

{''.join(rows)}

<h2>Eigene Zeichnungen</h2>
<p>Diese SVGs sind im Projekt entstanden, nicht von Dritten übernommen. Sie wurden
auf aktive und externe Inhalte geprüft (keine Skripte, keine Event-Handler, keine
externen Referenzen, keine Entities).</p>
<table>
  <thead><tr><th>Datei</th><th>Motiv</th><th>Rechte</th><th>Sicherheitsprüfung</th></tr></thead>
  <tbody>{own}</tbody>
</table>

<h2>Offene Punkte</h2>
<ul>{open_issues}</ul>

<p><small>Erzeugt von <code>docs/radiasthesie-completion/RAD-05/scripts/build_attribution.py</code>.
Nicht von Hand bearbeiten — Änderungen am Manifest vornehmen und neu erzeugen.</small></p>
</body>
</html>
"""


def render_markdown(m):
    out = [
        "# Bildnachweis — Radiästhesie, Pendeln und Orakel",
        "",
        f"Automatisch erzeugt aus `media-manifest.json` (Stand {m['generated_at']}, "
        f"Quellen abgerufen am {m['retrieved_at']}). Nicht von Hand bearbeiten.",
        "",
        f"{m['counts']['motive']} Motive, {m['counts']['varianten']} Varianten, "
        f"{m['counts']['eigene_svgs']} eigene Zeichnungen.",
        "",
        "## Motive",
        "",
    ]
    for it in m["items"]:
        out += [
            f"### {it['motiv']} ({it['id']})",
            "",
            f"![{it['alt']}]({rel(it['web']['src'])})",
            "",
            f"*{it['caption']}*",
            "",
            f"- **Urheber:** {it['urheber']['name']} — {it['urheber']['url']}",
            f"- **Lizenz:** {it['lizenz']['kurz']} — {it['lizenz']['url']}",
            f"- **Attributionspflicht:** {'ja' if it['lizenz']['attribution_pflicht'] else 'nein (freiwillige Nennung)'}",
            f"- **ShareAlike:** {'ja' if it['lizenz']['share_alike'] else 'nein'}",
            f"- **Originalseite:** {it['quelle']['dateiseite']}",
            f"- **Stand der Seite:** {it['quelle']['seiten_stand']} (revid {it['quelle']['seiten_revid']})",
            f"- **Original:** {it['original']['mime']}, {it['original']['breite']}×{it['original']['hoehe']} px, "
            f"{it['original']['bytes']} B, SHA-1 `{it['original']['sha1']}`",
            f"- **Verändert:** {it['lizenz']['aenderungshinweis']}",
            f"- **Länderhinweis:** {it['rechte']['laenderhinweis']}",
        ]
        if it["rechte"]["marken"]:
            out.append(f"- **Marke:** {it['rechte']['marken']}")
        out += ["", f"**Attributionszeile:** {it['attribution_text']}", "", it["rechte"]["bedenken"], ""]

    out += ["## Eigene Zeichnungen", ""]
    for a in m["own_assets"]:
        out.append(f"- `{a['datei']}` — {a['motiv']} — {a['lizenz']['kurz']}")
    out += ["", "## Offene Punkte", ""]
    for x in m["open_issues"]:
        out.append(f"- {x}")
    out.append("")
    return "\n".join(out)


def main():
    media_dir = sys.argv[1]
    manifest_path = os.path.join(media_dir, "media-manifest.json")
    m = json.load(open(manifest_path, encoding="utf-8"))

    html_path = os.path.join(media_dir, "bildnachweis.html")
    with open(html_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(render_html(m))
    md_path = os.path.join(media_dir, "ATTRIBUTION.md")
    with open(md_path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(render_markdown(m))
    print(f"geschrieben: {html_path}")
    print(f"geschrieben: {md_path}")


if __name__ == "__main__":
    main()
