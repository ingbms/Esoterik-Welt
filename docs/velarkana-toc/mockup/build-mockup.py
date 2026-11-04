#!/usr/bin/env python3
"""(Mockup-Generator) Baut die Entwurfsseiten aus gerenderten VELARKANA-Seiten.

NICHT PRODUKTIV. Der Generator nimmt eine bereits gebaute Seite aus dem
Astro-Migrationsstand (Worktree t_7ad19549, Commit 9d14d37), entnimmt
Kopfzeile, <main> und Fußzeile unverändert und setzt das Entwurfs-TOC in den
Seitenkörper — mit echtem Inhalt und echter Typografie statt Platzhaltertext.

Markup folgt der Spezifikation t_5edc1d8c §6.4 (D-7):
  .page-body--toc > aside.page-toc > details > summary + nav[aria-label] > ol

Aufruf (aus dem Repo-Wurzelverzeichnis):
  python docs/velarkana-toc/mockup/build-mockup.py
"""

from __future__ import annotations

import html
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DIST = Path("C:/Users/mas/Arbeit/Esoterik-Welt/.worktrees/t_7ad19549/dist")

PAGES = [
    {
        "source": DIST / "frequenzen/quellen.html",
        "out": HERE / "quellen.html",
        "label": "Pilot: 29 Einträge, zwei Ebenen",
        "drop_first": False,  # O-1: führende h2 bleibt im Verzeichnis
    },
    {
        "source": DIST / "farbwelten/blau.html",
        "out": HERE / "blau.html",
        "label": "Kurzfall: 8 Einträge, eine Ebene",
        "drop_first": False,
    },
]

HEAD = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="robots" content="noindex, nofollow">
<link rel="stylesheet" href="vendor/base.bundle.css">
<link rel="stylesheet" href="toc.css">
<link rel="stylesheet" href="annotate.css">
</head>
<body>
"""

TAIL = """<script src="annotate.js"></script>
<script src="toc.js"></script>
</body>
</html>
"""


def strip_tags(value: str) -> str:
    text = re.sub(r"<[^>]+>", "", value)
    return html.unescape(text).replace("\u00ad", "").strip()


def extract_headings(article: str) -> list[dict]:
    """Überschriften in Dokumentreihenfolge, inklusive Ebene und vorhandener ID."""
    found = []
    for match in re.finditer(r"<h([23])\b([^>]*)>(.*?)</h\1>", article, re.S):
        attrs = match.group(2)
        id_match = re.search(r'id="([^"]+)"', attrs)
        if not id_match:
            continue  # ohne ID kein Anker (Spezifikation §6.3)
        found.append(
            {
                "depth": int(match.group(1)),
                "id": id_match.group(1),
                "text": strip_tags(match.group(3)),
            }
        )
    return found


def build_nested_list(headings: list[dict]) -> str:
    """h2 als oberste Ebene, h3 als verschachtelte Liste im jeweils letzten h2."""
    items: list[str] = []
    open_sub = False
    for heading in headings:
        depth = heading["depth"]
        anchor = f'<a class="page-toc__link" href="#{heading["id"]}">{html.escape(heading["text"])}</a>'
        if depth == 2:
            if open_sub:
                items.append("</ol></li>")
                open_sub = False
            items.append(f'<li class="page-toc__item page-toc__item--2">{anchor}<!--sub-->')
        else:
            if not open_sub:
                items.append('<ol class="page-toc__list">')
                open_sub = True
            items.append(f'<li class="page-toc__item page-toc__item--3">{anchor}</li>')
    if open_sub:
        items.append("</ol>")
    if items and items[-1].endswith("<!--sub-->"):
        items[-1] = items[-1].replace("<!--sub-->", "</li>")
    else:
        items.append("</li>")
    return "".join(items)


def build_toc(headings: list[dict]) -> str:
    entries = build_nested_list(headings)
    return f"""<aside class="page-toc" data-toc aria-labelledby="page-toc-title">
  <details class="page-toc__details" data-toc-details open>
    <summary class="page-toc__summary" id="page-toc-title">Auf dieser Seite</summary>
    <nav class="page-toc__nav" aria-label="Inhaltsverzeichnis">
      <p class="page-toc__title" aria-hidden="true">Auf dieser Seite</p>
      <div class="page-toc__body" data-toc-body>
        <ol class="page-toc__list">{entries}</ol>
      </div>
    </nav>
  </details>
</aside>"""


def find_div_span(text: str, start: int) -> tuple[int, int]:
    """Findet zu einem öffnenden <div ...> das passende schließende </div>."""
    depth = 0
    for match in re.finditer(r"<div\b[^>]*>|</div>", text[start:], re.S):
        token = match.group(0)
        if token.startswith("</"):
            depth -= 1
            if depth == 0:
                return start, start + match.end()
        else:
            depth += 1
    raise ValueError("kein passendes </div> gefunden")


def build_page(page: dict) -> None:
    source = Path(page["source"]).read_text(encoding="utf-8")
    title_match = re.search(r"<title>(.*?)</title>", source, re.S)
    title = strip_tags(title_match.group(1)) if title_match else "VELARKANA"

    body = re.search(r"<body[^>]*>(.*)</body>", source, re.S).group(1)
    body = re.sub(r"<script\b[^>]*>.*?</script>", "", body, flags=re.S)

    main = re.search(r"<main\b[^>]*>(.*?)</main>", body, re.S).group(1)
    header = re.search(r"<header\b.*?</header>", body, re.S).group(0)
    footer = re.search(r"<footer\b.*?</footer>", body, re.S).group(0)

    article = re.search(r'<article class="prose">.*?</article>', main, re.S).group(0)
    headings = extract_headings(article)
    if page.get("drop_first") and headings:
        headings = headings[1:]

    toc = build_toc(headings)

    start = main.find('<div class="page-body">')
    if start < 0:
        sys.exit(f"page-body nicht gefunden: {page['source']}")
    div_start, div_end = find_div_span(main, start)
    open_tag_end = main.find(">", start) + 1
    inner = main[open_tag_end : div_end - len("</div>")]

    # Artikel als Grid-Kind kennzeichnen (Spezifikation §5.3: data-toc-scope).
    inner = inner.replace('<article class="prose">', '<article class="prose" data-toc-scope>', 1)
    wrapped_body = '<div class="page-body page-body--toc">' + toc + inner + "</div>"
    wrapped_main = main[:div_start] + wrapped_body + main[div_end:]

    document = (
        HEAD.format(title=html.escape(title))
        + header
        + '\n<main id="main" class="site-main" tabindex="-1">'
        + wrapped_main
        + "</main>\n"
        + footer
        + "\n"
        + TAIL
    )
    Path(page["out"]).write_text(document, encoding="utf-8")
    print(f"{page['out'].name}: {len(headings)} Einträge · {page['label']}")


def build_stress() -> None:
    """Fixture: eine 235-Zeichen-Überschrift (längster Bestandswert) im Verzeichnis."""
    source = (DIST / "frequenzen/quellen.html").read_text(encoding="utf-8")
    body = re.search(r"<body[^>]*>(.*)</body>", source, re.S).group(1)
    body = re.sub(r"<script\b[^>]*>.*?</script>", "", body, flags=re.S)
    header = re.search(r"<header\b.*?</header>", body, re.S).group(0)
    footer = re.search(r"<footer\b.*?</footer>", body, re.S).group(0)

    long_text = (
        "Wahrnehmungspsychologische, interkulturelle und historische Einordnung der Farbwirkung "
        "im Kontext ritueller Praxis, medizinischer Anwendung und künstlerischer Rezeption – "
        "eine zusammenhängende Betrachtung der Quellenlage, der Methodik und der offenen Fragen "
        "gegenwärtiger Forschungsliteratur"
    )[:235]
    assert len(long_text) == 235, len(long_text)

    headings = [
        {"depth": 2, "id": "einfuehrung", "text": "Einführung"},
        {"depth": 3, "id": "lang", "text": long_text},
        {"depth": 2, "id": "anwendung", "text": "Anwendung und Grenzen"},
        {"depth": 3, "id": "detail", "text": "Detailprüfung"},
        {"depth": 2, "id": "quellen", "text": "Quellen"},
    ]
    toc = build_toc(headings)
    article = (
        '<article class="prose" data-toc-scope>'
        '<h2 id="einfuehrung">Einführung</h2>'
        "<p>Fixtureseite für die Gestaltungsprüfung langer Einträge "
        "(Spezifikation AK-B7/R-8: bis 235 Zeichen, vollständiger Text, Umbruch statt Kürzung).</p>"
        f'<h3 id="lang">{html.escape(long_text)}</h3>'
        "<p>Der Eintrag steht als h3 im Verzeichnis und muss ohne Abschneiden umbrechen.</p>"
        '<h2 id="anwendung">Anwendung und Grenzen</h2>'
        "<p>Zweiter Abschnitt.</p>"
        '<h3 id="detail">Detailprüfung</h3>'
        "<p>Dritter Abschnitt.</p>"
        '<h2 id="quellen">Quellen</h2>'
        "<p>Vierter Abschnitt.</p>"
        "</article>"
    )
    main = (
        '<main id="main" class="site-main" tabindex="-1">'
        '<div class="page-head"><p class="label">Fixture</p><h1>Lange Einträge</h1>'
        '<p class="lede">Prüfseite für den Umbruch eines 235-Zeichen-Eintrags.</p></div>'
        '<div class="page-body page-body--toc">' + toc + article + "</div></main>"
    )
    document = HEAD.format(title="Fixture: lange TOC-Einträge | VELARKANA") + header + "\n" + main + "\n" + footer + "\n" + TAIL
    (HERE / "stress.html").write_text(document, encoding="utf-8")
    print(f"stress.html: {len(headings)} Einträge · längster Text {len(long_text)} Zeichen")


if __name__ == "__main__":
    for entry in PAGES:
        build_page(entry)
    build_stress()
