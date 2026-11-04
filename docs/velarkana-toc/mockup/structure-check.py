"""Strukturprüfung der erzeugten Mockup-Seiten (Liste, Landmark, Titel)."""

import json
import re
from html.parser import HTMLParser
from pathlib import Path

HERE = Path(__file__).resolve().parents[1] / "mockup"


class Check(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.errors = []
        self.nav_label = 0
        self.asides = 0
        self.summaries = []
        self.links = 0
        self.nested_ol = 0
        self.ol_depth = 0
        self.items = {"2": 0, "3": 0}
        self.title_aria_hidden = None
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "nav" and a.get("aria-label") == "Inhaltsverzeichnis":
            self.nav_label += 1
        if tag == "aside" and "page-toc" in (a.get("class") or ""):
            self.asides += 1
        if tag == "summary":
            self.summaries.append(a)
        if tag == "a" and "page-toc__link" in (a.get("class") or ""):
            self.links += 1
        if tag == "ol" and "page-toc__list" in (a.get("class") or ""):
            self.ol_depth += 1
            if self.ol_depth > 1:
                self.nested_ol += 1
        if tag == "li" and "page-toc__item" in (a.get("class") or ""):
            for key in ("2", "3"):
                if f"page-toc__item--{key}" in (a.get("class") or ""):
                    self.items[key] += 1
        if tag == "p" and "page-toc__title" in (a.get("class") or ""):
            self.title_aria_hidden = a.get("aria-hidden")
        if tag == "h1":
            self.h1 += 1

    def handle_endtag(self, tag):
        if tag == "ol" and self.ol_depth:
            self.ol_depth -= 1


def check(path: Path) -> dict:
    parser = Check()
    parser.feed(path.read_text(encoding="utf-8"))
    return {
        "file": path.name,
        "nav_inhaltsverzeichnis": parser.nav_label,
        "asides": parser.asides,
        "summaries": len(parser.summaries),
        "summary_ids": [s.get("id") for s in parser.summaries],
        "links": parser.links,
        "nested_ol": parser.nested_ol,
        "items_h2": parser.items["2"],
        "items_h3": parser.items["3"],
        "title_aria_hidden": parser.title_aria_hidden,
        "h1": parser.h1,
    }


rows = [check(p) for p in sorted(HERE.glob("*.html"))]
print(json.dumps(rows, ensure_ascii=False, indent=1))
(HERE.parent / "evidence" / "strukturpruefung.json").write_text(
    json.dumps(rows, ensure_ascii=False, indent=1), encoding="utf-8"
)

# Konsistenz: Linkzahl = h2+h3-Einträge, genau ein Landmark, genau ein Aside
for row in rows:
    assert row["nav_inhaltsverzeichnis"] == 1, row
    assert row["asides"] == 1, row
    assert row["links"] == row["items_h2"] + row["items_h3"], row
    assert row["title_aria_hidden"] == "true", row
    assert row["summary_ids"] == ["page-toc-title"], row
print("Struktur OK")
