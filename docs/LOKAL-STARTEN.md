# Esoterik-Welt lokal starten

## Ohne Installation: im Explorer doppelklicken

1. Im Windows-Explorer `C:\Users\mas\Arbeit\Esoterik-Welt` öffnen.
2. `index.html` doppelklicken (bei ausgeblendeten Dateiendungen: `index`, Typ HTML-Dokument). Falls HTML-Dateien einem Editor zugeordnet sind: **Öffnen mit → Microsoft Edge oder Google Chrome**.
3. Der Browser wechselt automatisch zur danebenliegenden **`Lokal.html`**. Kein Server, kein Terminal und keine Portauswahl erforderlich. JavaScript muss aktiviert sein; keine Browser-Sicherheitsoptionen ändern.

Exakte Adressen zum Einfügen in die Browser-Adressleiste:

- Gewohnter Einstieg: `file:///C:/Users/mas/Arbeit/Esoterik-Welt/index.html`
- Direkter Offline-Einstieg: `file:///C:/Users/mas/Arbeit/Esoterik-Welt/Lokal.html`
- Direkt zu Kristallen: `file:///C:/Users/mas/Arbeit/Esoterik-Welt/index.html#crystals` (wird zu `Lokal.html#crystals`)
- Weitere Bereiche: `Lokal.html#tarot`, `Lokal.html#moon`, `Lokal.html#runes`, `Lokal.html#blog`, `Lokal.html#home`.

Suchparameter und Fragment bleiben beim Wechsel von `index.html` erhalten. Derselbe Einstieg funktioniert im Produktionspaket über `file:///C:/Users/mas/Arbeit/Esoterik-Welt/dist/Esoterik-Welt/index.html`, sobald der Build erstellt wurde.

**Nur Dateien weitergeben:** `Lokal.html` enthält die Anwendung einschließlich CSS, Skripten, Daten und Favicon. Für die verlinkten Zusatzseiten außerdem `Lokal-impressum.html`, `Lokal-datenschutz.html`, `Lokal-haftung.html` und `Lokal-404.html` im selben Verzeichnis mitgeben. Optional `index.html` als gewohnten Einstieg beilegen. Die regulären Unterseiten `impressum.html` usw. bleiben HTTP-Seiten; ihre generierten `Lokal-*`-Gegenstücke sind für den Dateimodus vorgesehen.

## Was im Dateimodus anders ist

- Die Kernbereiche und ihre Daten kommen aus **denselben Quellen wie die HTTP-Website**. Getestet sind Navigation, Tarot-Dreierlegung/Detaildialog, Kristallsuche/Detaildialog, Mondkalender mit iCalendar-Download, Runenwurf, Blogartikel sowie Hin-/Rücknavigation der Zusatzseiten.
- Keine dynamischen Netzwerk-Imports und kein `fetch` zum Nachladen der Kristalldaten: Webpack bündelt die Module in ein klassisches Inline-Skript; die JSON-Daten werden eingebettet.
- Keine Google-Font-Anfragen: Die vorhandenen Systemschrift-Fallbacks werden verwendet. Schriftbild und Umbruch können deshalb von der Online-Version abweichen; Farben, Komponenten und Inhalte stammen aus denselben Stylesheets.
- Favoriten und Verlauf nutzen den vorhandenen Browser-Speicher. `file://`-Speicher ist browser-/pfadabhängig, nicht mit `http://localhost` oder GitHub Pages geteilt. Nach Verschieben der Dateien oder im privaten Modus ist dauerhafte Speicherung nicht garantiert.
- Externe Links benötigen beim Anklicken weiterhin Internet. Der lokale Start und die getesteten Kernmodule benötigen es nicht.
- Es handelt sich tatsächlich um eine **Dateimodus-Version**, nicht um einen versteckten Server-Starter. Ein bereits laufender Server auf Port 4178 wird weder benötigt noch verändert.

## HTTP-Preview und veröffentlichte Website

Bestehende Preview (wenn bereits gestartet):

`http://localhost:4178/Esoterik-Welt/`

Zum selbstständigen Starten einer HTTP-Preview in einem **separaten** Terminal, Arbeitsverzeichnis `C:\Users\mas\Arbeit\Esoterik-Welt`:

```powershell
npm ci
npm run build
$env:PORT = '4178'
npm run preview
```

Danach `http://localhost:4178/Esoterik-Welt/` öffnen. Ist Port 4178 schon belegt, keinen zweiten Server starten; zuerst die bestehende Preview verwenden. Für den empfohlenen Doppelklick-Einstieg spielt der Port keine Rolle.

Die veröffentlichte Basis bleibt unverändert:

`https://ingbms.github.io/Esoterik-Welt/`

**Nicht verwechseln:** Ein einfacher Dateiserver, dessen Wurzel direkt der Projektordner ist (z. B. bisher `npm run static` mit `http://localhost:3000/`), stellt `/Esoterik-Welt/css/...` nicht automatisch bereit. Deshalb ist dessen Wurzel-URL kein unterstützter Ersatz für die Projekt-Preview. Die feste HTTP-Basis `/Esoterik-Welt/` wird nicht entfernt, um diesen anders gemounteten Server scheinbar zu reparieren. Für lokale Nutzung ohne Server `index.html` als Datei öffnen; für HTTP die korrekt gemountete Express-Preview verwenden.

## Nach Quelländerungen neu erzeugen

Voraussetzung zum Entwickeln/Bauen: Node.js und die bereits im Projekt deklarierten npm-Abhängigkeiten. **Zum bloßen Doppelklick auf die mitgelieferte Lokal.html ist Node.js nicht erforderlich.**

```text
npm ci
npm run build
```

`npm run build` erzeugt sowohl `dist/Esoterik-Welt/` als auch die fünf `Lokal*.html`-Dateien im Projektordner. Diese werden automatisch aus `index.html`, den regulären Zusatzseiten, `css/`, `js/`, `data/` und dem Favicon erzeugt. **Generierte Lokal-Dateien niemals von Hand pflegen.** Nach Änderungen immer neu bauen und prüfen. Es gibt keinen zweiten manuell gepflegten Seitenquellstand.

Die Offline-Bündelung muss genau ein JS-Bundle erzeugen. Neu eingeführte CSS-Asset-URLs/Imports werden vom Generator abgewiesen, bis sie ausdrücklich offline eingebettet sind; zusätzliche Netzwerkabhängigkeiten dürfen nicht unbemerkt in die Dateiversion gelangen.

## Reproduzierbare Prüfung

```text
npm run test:local
npx jest tests/api.test.js --runInBand
```

`test:local` baut zuerst neu und prüft mit echtem Playwright-Chromium ohne eigene Sicherheitsflags:

- Datei-Einstieg über `index.html`, automatische Weiterleitung einschließlich Query/Fragment, mobile und Desktop-Navigation;
- vollständig isoliertes Offline-Verzeichnis ohne Quellordner, abgefangene unerlaubte `fetch`-Aufrufe, keine Netzwerkressourcen;
- gerenderte Inhalte aller Kernmodule und tatsächliche Bedienaktionen statt bloß HTTP 200;
- Zusatzseiten, kalte Direktaufrufe, fehlerfreie Konsole/Requests;
- Gleichheit der generierten lokalen Dateien mit dem Produktionspaket;
- HTTP-Produktionspreview auf einem automatisch vergebenen Test-Port sowie vorhandene Pages-Regressionen.

Fehlt der Playwright-Browser: `npx playwright install chromium` ausführen. Keine `--disable-web-security`-/Dateizugriffsflags verwenden.

Für die **zusätzliche** Prüfung der bereits laufenden Preview und der veröffentlichten Seite (PowerShell):

```powershell
$env:VERIFY_EXTERNAL = '1'
npm run test:local
Remove-Item Env:VERIFY_EXTERNAL
```

Ohne diese Umgebungsvariable werden genau die zwei externen Fälle übersprungen; die lokalen Prüfungen bleiben aktiv. Testbelege liegen unter `evidence/t_4f0ebfc2/`, getrennt von fremden Testergebnissen. Die Live-Prüfung liest nur die veröffentlichte Website; sie veröffentlicht keine Änderungen.

Breite HTTP-Layout-/Routenmatrix (je zehn Seiten/Routen in drei Viewports):

```text
node scripts/verify-pages.cjs http://localhost:4178/Esoterik-Welt/ evidence/t_4f0ebfc2/preview-matrix
node scripts/verify-pages.cjs https://ingbms.github.io/Esoterik-Welt/ evidence/t_4f0ebfc2/pages-matrix
```

Die ursprüngliche Fehleraufnahme ist in `evidence/t_4f0ebfc2/baseline.json` erhalten. Sie zeigt die falsche `file:///C:/Esoterik-Welt/`-Basis, fehlende Stylesheets und blockierte ES-Module vor der Korrektur. `scripts/probe-local-entry.cjs` ist das damalige Diagnosewerkzeug; nicht erneut gegen dieselben Belegdateien ausführen, wenn die historische Baseline erhalten bleiben soll.

## Änderungsumfang und Freigabe

Gezielt geändert: `index.html`, `js/modules/crystals.js`, `js/modules/tarot.js`, `scripts/build-pages.cjs`, `package.json`. Neu: `scripts/build-local.cjs`, `tests/local-entry.cjs`, die fünf generierten `Lokal*.html`-Dateien und diese Anleitung. Die kleine Tarot-Korrektur hält das Fokusziel vor dem verzögerten Modal-Schließen fest, statt später auf ein bereits auf `null` gesetztes Feld zuzugreifen.

Vorhandene uncommittete Workflows, Dokumente und andere Tests gehören nicht zu diesem Fix und werden nicht zurückgesetzt oder mitveröffentlicht. Die Änderung ist lokal umgesetzt; Commit/produktive Veröffentlichung benötigen eine getrennte Prüfung/Freigabe. Der Live-Test bestätigt nur den weiterhin funktionierenden veröffentlichten Altstand, nicht die Veröffentlichung des neuen Dateieinstiegs.
