# VELARKANA · Seiten-Inhaltsverzeichnis — Gestaltungsentwurf

Entwurf für das automatische TOC im Velarkana-Seitentemplate (Pilot
`/frequenzen/quellen.html`), Aufgabe `t_fd9d97f0`.

**Keine Produktionsimplementierung.** Dieses Verzeichnis enthält Gestaltung,
Wireframes, ein lauffähiges Mockup, Messungen und den CSS-/Komponentenvertrag.
Verhalten, Anker und Abnahmekriterien stehen in `spezifikation.md`
(Task `t_5edc1d8c`).

| Datei | Inhalt |
|---|---|
| `01-design.md` | Gestaltungskonzept: Bestandsanalyse, Entscheidungen, Layout, Typografie, Zustände, Wireframes, Befunde, Abgleich mit den AK |
| `02-komponenten-spezifikation.md` | Markup, Props, CSS-Klassenvertrag, Breakpoints, JS-Vertrag, A11y-Prüfliste, Umsetzungsfallen, Budget |
| `mockup/toc.css` | Entwurfs-Stylesheet (nicht produktiv), Werte ausschließlich aus den Tokens |
| `mockup/toc.js` | Referenzverhalten: Disclosure, Scroll-Spy, Überlaufhinweis |
| `mockup/quellen.html` | Pilotseite mit 29 Einträgen, echtem Inhalt und echter Typografie |
| `mockup/blau.html` | Kurzfall mit 8 Einträgen |
| `mockup/stress.html` | Fixture für einen 235-Zeichen-Eintrag |
| `mockup/build-mockup.py` | erzeugt die drei Seiten aus der gebauten Astro-Ausgabe (`9d14d37`) |
| `mockup/contrast.py`, `mockup/budget.py` | Kontrast- und Budgetmessung |
| `mockup/structure-check.py` | prüft Landmark, Aside, Linkzahl, Verschachtelung, Summary-ID |
| `mockup/vendor/` | eingefrorenes CSS-Bundle + Schriften des Builds (Herkunft: `dist/_astro/BaseLayout.B-fbi4zj.css`, SHA-256 `9a3868f0…`) |
| `evidence/` | Mess-JSON, Kontrast-JSON, Screenshots |

Die **Produktionsimplementierung** dieses Entwurfs beschreibt `03-umsetzung.md` (Aufgabe
`t_3c130426`): Dateien, Aktivierung, Prüfungen, Budgets und bekannte Abweichungen.

## Ansehen

```bash
# aus der Repo-Wurzel
python -m http.server 8791 --bind 127.0.0.1
```

* <http://127.0.0.1:8791/docs/velarkana-toc/mockup/quellen.html>
* <http://127.0.0.1:8791/docs/velarkana-toc/mockup/quellen.html?annotate=1> (annotiert)
* <http://127.0.0.1:8791/docs/velarkana-toc/mockup/blau.html>
* <http://127.0.0.1:8791/docs/velarkana-toc/mockup/stress.html>

Die Seiten laden das echte CSS-Bundle des Migrationsstands; Kopf- und Fußzeile
sind unverändert aus dem Build übernommen. Nur der Seitenkörper ist um das
Verzeichnis ergänzt.

## Kurzfassung der Vorgaben

* **≥ 1200 px:** Randspalte rechts, 260 px, 64 px Abstand, sticky unter dem Header,
  eigener Scrollbereich, dauerhaft offen, 1-px-Haarlinie links.
* **< 1200 px:** `<details>`-Block über dem Artikel, mit JS geschlossen,
  Summary 44 px, Sandkante links, Liste max. 56–60 dvh mit eigenem Scrollen.
* **Typografie:** Label mono 13 px uppercase; Einträge 14 px Manrope; h3 +16 px
  eingerückt; aktiver Eintrag primary + Gewicht 500 + 2-px-Sandmarke.
* **Kontrast (gemessen):** Links 9,09–10,07:1, aktiv 15,36:1, Fokusring 15,36:1,
  Aktivmarke 9,33:1 (Dark). Light-Reserve 6,50–15,45:1 (nicht ausgeliefert).
* **Kein horizontaler Überlauf durch das TOC**, kein Kürzen, Umbruch bis
  235-Zeichen-Einträgen (10 Zeilen, 195 px, gemessen).

## Wichtige Vorbedingungen

1. Der Seitenüberlauf bei 390/320 px ist **vorbestehend** (`scrollWidth` 540 im
   Mockup und in der Basis ohne TOC) und nicht Folge des Verzeichnisses.
2. Die erste Prosa-Überschrift hat 79,2 px Rand oben; auf Seiten mit TOC wird
   dieser Rand lokal entfernt, damit Artikel und Randspalte auf gleicher Höhe
   beginnen.
3. Messungen erst nach `document.fonts.ready` — `72ch` misst vorher die
   Ersatzschrift (648 statt 720 px).
