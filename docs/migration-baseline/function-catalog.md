# Funktions-Katalog — Pfadhinweis

Der verbindliche Funktions-Katalog dieser Baseline liegt unter
[`funktionen-katalog.md`](funktionen-katalog.md).

Dieser Hinweis existiert, weil der Kartenauftrag den Dateinamen `function-catalog.md` nennt, während
die verbindliche Struktur in `docs/migration-baseline/00-schema-und-scope.md` §9 den Namen
`funktionen-katalog.md` festschreibt. Es gibt **eine** Quelle: `funktionen-katalog.md`. Diese Datei
enthält keinen Inhalt und darf keinen erhalten — sonst entstünde ein zweiter, driftender Katalog
(dasselbe Muster wie Befund B-02 im Katalog).

Prüfung: `node scripts/migration-baseline/verify-function-catalog.cjs`
