# Esoterik-Welt

Statistische Website zu Tarot, Kristallen, Runen und Mondphasen — bewusst ohne medizinische Wirkungsaussagen, mit Design-Tokens, Hash-Routing und echten Datenquellen.

## Quickstart

```bash
npm install
npm run serve     # python -m http.server 8080
npm run static    # python -m http.server 3000
npm run build     # webpack production
npm test          # Jest
```

## Architektur-Entscheidungen

- **Hash-Routing:** Keine Server-Side-Routing nötig; statisches Hosting reicht. Routen: `#tarot`, `#crystals`, `#runes`, `#blog`, `#moon`, `#home`.
- **Vanilla JS + ES-Module:** Keine Framework-Abhängigkeit; `blog.js`/`moon.js` nutzen `import/export`; `main.js` lädt dynamisch.
- **Daten-Modell:** JSON/JS-Exports (`data/articles.js`, `data/crystals.json`, `data/runes.json`, `data/moon-phases.js`, `data/moon.js`).
- **Design-System (`css/design-system.css`):** CSS-Variablen, Typografie (Cinzel, Inter), Reduced-Motion / Print / Kontrast.
- **A11y:** Skip-Link (`#main`), sichtbarer Fokus, `aria-label`, `de`, Keyboard-Menü, Fokus-Restore, `prefers-reduced-motion`.

## Datenquellen

- **Tarot:** Rider-Waite-Smith — Public Domain (78 Karten). Keine medizinischen/prognostischen Aussagen.
- **Kristalle:** Mindat.org (Mohs-Härte, chemische Formeln). Keine Heilversprechen.
- **Runen:** Elder Futhark (`data/runes.json`, `js/data/runes.js`).
- **Mond:** Synodische Periode 29,53059 d; Referenz 2000-01-06; 42-Tage-Grid; iCal-Export `.ics`. Astronomische Formel, keine astrologische Prognose.
- **Blog:** 10 reale Artikel (`js/data/articles.js`) mit Markdown-Inhalten.

## Projektstruktur

```
esoterik-welt/
├── index.html, 404.html, robots.txt, sitemap.xml
├── css/design-system.css, css/main.css
├── js/main.js, js/index.js, js/modules/*.js, js/data/*.js
├── data/*.json, data/*.js
├── docs/polish-review.md, docs/design-tokens.md
├── assets/favicon.svg
└── tests/
```

## Deploy-Anleitung

- **GitHub Pages:** Repo-Einstellungen → Pages → Deploy from Branch `main` / (root). URL: `https://ingbms.github.io/Esoterik-Welt/`
- **Netlify:** `netlify deploy --prod --dir=.` oder Drag-and-Drop.
- **Vercel:** `vercel --prod` — statische Dateien automatisch erkannt.
- **Static Host (Surge):** `npx surge . esoterik-welt.surge.sh`

404-Seite (`404.html`) wird von GitHub Pages bei unbekannten Pfaden ausgeliefert.

## QA-Status (Task 10)

- **Cross-Browser:** Chrome, Firefox, Edge (Desktop + Mobile) verifiziert; Safari + echte Touch-Simulation als Limitation dokumentiert. Keine kritischen Rendering-Bugs; 320 px Mobile-Layout geprüft.
- **JS-Features:** LocalStorage, ES-Module, `IntersectionObserver`, Touch-Events geprüft; kein Fehler in Production-Build.
- **Console-Errors:** Keine in Production-Build; `_tarot_old.js` unverwendet.
- **Lighthouse-CI (`lhci autorun`, `.lighthouserc.json`):** Performance 0,87 (Warnung, Budget ≥0,90 nicht eingehalten — bekanntes Risiko); Accessibility/Best Practices/SEO ohne Assertion-Fehler (Budgets erfüllt).
- **SEO:** `robots.txt`, `sitemap.xml` (6 Routen + 10 Artikel), `404.html`, OG/Twitter/Canonical in `index.html` vorhanden.
- **A11y (axe-core 4.10.3):** 0 WCAG-Verstöße auf 6 Routen (Task 9).

## Bekannte Limitations

- **Performance-Budget:** 0,87 < 0,90 (Fonts/Assets, kein funktionaler Defekt).
- **Safari / Touch:** Keine automatisierten Tests; manuelle 320-px-Prüfung.
- **Crystal-Dropdown:** Design-Kritik separat vorgemerkt; keine HTML-Änderung ohne Abnahme.
- **Inline-Tokens:** Task 71 migriert; `blog.js` + `moon.js` unberührt.
- **OG-Image:** `assets/og-preview.png` referenziert, nicht im Repo.

## Lizenz

MIT — siehe `LICENSE`. Datenquellen mit jeweiligen Lizenzen referenziert; keine medizinischen Wirkungsaussagen.
