# Legacy-`public/`-Platzhalter (archiviert)

Dieser Ordner enthält den früheren Stand von `public/` aus der Zeit vor der
Astro-Migration. Er ist **kein Bestandteil des Builds oder der Website**:

- weder `scripts/build-pages.cjs` (Legacy-Build) noch `npm run build` (Astro)
  kopieren diese Dateien;
- die Inhalte sind veraltete Kopien der kanonischen Quellen im
  Repository-Wurzelverzeichnis (`index.html`, `css/`, `js/`, `assets/`);
- `public/` ist seit der Astro-Migration das statische Verzeichnis von Astro
  (`public/` → `/`) und enthält deshalb nur noch tatsächlich auszuliefernde
  Dateien.

Die Dateien bleiben als Nachweis des alten Platzhalters versioniert, damit die
Verschiebung nachvollziehbar ist. Sie dürfen gelöscht werden, sobald die
Migration abgeschlossen und die Legacy-Quellen im Wurzelverzeichnis entfernt
sind.
