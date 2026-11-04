# Redirects und Altlink-Zuordnung

Stand: generiert aus `scripts/generate-legacy-map.cjs` (nicht von Hand pflegen).

## Warum es keine Server-Redirects gibt

Der Bestand adressiert seine Ansichten über den URL-**Hash** (`#astrologie/zeichen/widder`).
Fragmente werden vom Browser ausgewertet und **nie an den Server gesendet** — GitHub Pages,
Netlify oder ein beliebiger Reverse-Proxy sehen nur `/`. Eine `_redirects`-Datei oder ein
301 kann eine Hash-Route deshalb grundsätzlich nicht umleiten (Migrationsplan Risiko R1).

Die Migration löst das an der einzigen Stelle, die den Hash sieht: ein Client-Shim im Layout
(`src/lib/legacy-routes.ts`) prüft `location.hash` und ersetzt die Adresse per
`location.replace()` durch die neue URL. Die Map ist generiert und deckt jede Adresse ab,
die der Bestand routen konnte.

## Dokumentadressen (unverändert)

Die zwölf bestehenden Dokumente behalten ihren Pfad (Entscheidung E1, `build.format: 'file'`).
Für sie sind **keine** Redirects nötig — das ist der Grund, warum die Migration ohne
301-Kette auskommt:

| Bestand | Neu | Status |
|---|---|---|
| `/` | `/` | identisch |
| `/404.html` | `/404.html` | identisch |
| `/impressum.html` | `/impressum.html` | identisch |
| `/datenschutz.html` | `/datenschutz.html` | identisch |
| `/haftung.html` | `/haftung.html` | identisch |
| `/radiasthesie/` | `/radiasthesie/` | identisch |
| `/radiasthesie/radiasthesie.html` | dito | identisch |
| `/radiasthesie/pendeln.html` | dito | identisch |
| `/radiasthesie/orakel.html` | dito | identisch |
| `/radiasthesie/glossar.html` | dito | identisch |
| `/radiasthesie/quellen.html` | dito | identisch |
| `/radiasthesie/methodik.html` | dito | identisch |

## Altlink-Map (Hash → neue URL)

Gesamtzahl: **274** Adressen.

| Familie | Anzahl | Beispiel |
|---|---|---|
| Startseite und Bereiche | 13 | `#astrologie` → `/astrologie/` |
| Artikel | 10 | `#blog/1` → `/wissen/01-die-78-tarot-karten-eine.html` |
| Astrologie | 85 | `#astrologie/aspekte` → `/astrologie/aspekte/` |
| Frequenzen | 6 | `#frequenzen` → `/frequenzen/` |
| Pendeln / Radiästhesie | 43 | `#pendeln/experiment` → `/pendeln/experiment.html` |
| Farbwelten | 121 | `#chakren` → `/farbwelten/chakren.html` |

### Vollständige Liste

| Hash-Adresse | Neue Adresse | Anmerkung |
|---|---|---|
| `#astrologie` | `/astrologie/` | Astrologie-Hub |
| `#astrologie/aspekte` | `/astrologie/aspekte/` | Aspekte-Index |
| `#astrologie/aspekte/konjunktion` | `/astrologie/aspekte/konjunktion.html` | Aspekte: konjunktion |
| `#astrologie/aspekte/opposition` | `/astrologie/aspekte/opposition.html` | Aspekte: opposition |
| `#astrologie/aspekte/quadrat` | `/astrologie/aspekte/quadrat.html` | Aspekte: quadrat |
| `#astrologie/aspekte/sextil` | `/astrologie/aspekte/sextil.html` | Aspekte: sextil |
| `#astrologie/aspekte/trigon` | `/astrologie/aspekte/trigon.html` | Aspekte: trigon |
| `#astrologie/beispiele` | `/astrologie/beispiele/` | Lehrbeispiele-Index |
| `#astrologie/beispiele/beispiel-mira` | `/astrologie/beispiele/beispiel-mira.html` | Lehrbeispiele: beispiel-mira |
| `#astrologie/beispiele/beispiel-nora` | `/astrologie/beispiele/beispiel-nora.html` | Lehrbeispiele: beispiel-nora |
| `#astrologie/beispiele/beispiel-selin` | `/astrologie/beispiele/beispiel-selin.html` | Lehrbeispiele: beispiel-selin |
| `#astrologie/beispiele/beispiel-tobias` | `/astrologie/beispiele/beispiel-tobias.html` | Lehrbeispiele: beispiel-tobias |
| `#astrologie/faktoren` | `/astrologie/faktoren/` | Faktoren-Index |
| `#astrologie/faktoren/jupiter` | `/astrologie/faktoren/jupiter.html` | Faktoren: jupiter |
| `#astrologie/faktoren/mars` | `/astrologie/faktoren/mars.html` | Faktoren: mars |
| `#astrologie/faktoren/merkur` | `/astrologie/faktoren/merkur.html` | Faktoren: merkur |
| `#astrologie/faktoren/mond` | `/astrologie/faktoren/mond.html` | Faktoren: mond |
| `#astrologie/faktoren/neptun` | `/astrologie/faktoren/neptun.html` | Faktoren: neptun |
| `#astrologie/faktoren/pluto` | `/astrologie/faktoren/pluto.html` | Faktoren: pluto |
| `#astrologie/faktoren/saturn` | `/astrologie/faktoren/saturn.html` | Faktoren: saturn |
| `#astrologie/faktoren/sonne` | `/astrologie/faktoren/sonne.html` | Faktoren: sonne |
| `#astrologie/faktoren/uranus` | `/astrologie/faktoren/uranus.html` | Faktoren: uranus |
| `#astrologie/faktoren/venus` | `/astrologie/faktoren/venus.html` | Faktoren: venus |
| `#astrologie/faq` | `/astrologie/faq.html` | Astrologie faq |
| `#astrologie/glossar` | `/astrologie/glossar.html` | Astrologie glossar |
| `#astrologie/grundlagen` | `/astrologie/grundlagen/` | Grundlagen-Index |
| `#astrologie/grundlagen/aspekte-und-orben` | `/astrologie/grundlagen/aspekte-und-orben.html` | Grundlagen: aspekte-und-orben |
| `#astrologie/grundlagen/aszendent-und-mc` | `/astrologie/grundlagen/aszendent-und-mc.html` | Grundlagen: aszendent-und-mc |
| `#astrologie/grundlagen/echte-berechnung` | `/astrologie/grundlagen/echte-berechnung.html` | Grundlagen: echte-berechnung |
| `#astrologie/grundlagen/ekliptik-und-himmelssphaere` | `/astrologie/grundlagen/ekliptik-und-himmelssphaere.html` | Grundlagen: ekliptik-und-himmelssphaere |
| `#astrologie/grundlagen/element-erde` | `/astrologie/grundlagen/element-erde.html` | Grundlagen: element-erde |
| `#astrologie/grundlagen/element-feuer` | `/astrologie/grundlagen/element-feuer.html` | Grundlagen: element-feuer |
| `#astrologie/grundlagen/element-luft` | `/astrologie/grundlagen/element-luft.html` | Grundlagen: element-luft |
| `#astrologie/grundlagen/element-wasser` | `/astrologie/grundlagen/element-wasser.html` | Grundlagen: element-wasser |
| `#astrologie/grundlagen/ethik-und-grenzen` | `/astrologie/grundlagen/ethik-und-grenzen.html` | Grundlagen: ethik-und-grenzen |
| `#astrologie/grundlagen/evidenz-und-grenzen` | `/astrologie/grundlagen/evidenz-und-grenzen.html` | Grundlagen: evidenz-und-grenzen |
| `#astrologie/grundlagen/geschichte` | `/astrologie/grundlagen/geschichte.html` | Grundlagen: geschichte |
| `#astrologie/grundlagen/grenzen-der-sonnenzeichen` | `/astrologie/grundlagen/grenzen-der-sonnenzeichen.html` | Grundlagen: grenzen-der-sonnenzeichen |
| `#astrologie/grundlagen/haeusersysteme` | `/astrologie/grundlagen/haeusersysteme.html` | Grundlagen: haeusersysteme |
| `#astrologie/grundlagen/herrschaft-und-wuerden` | `/astrologie/grundlagen/herrschaft-und-wuerden.html` | Grundlagen: herrschaft-und-wuerden |
| `#astrologie/grundlagen/modalitaet-fix` | `/astrologie/grundlagen/modalitaet-fix.html` | Grundlagen: modalitaet-fix |
| `#astrologie/grundlagen/modalitaet-kardinal` | `/astrologie/grundlagen/modalitaet-kardinal.html` | Grundlagen: modalitaet-kardinal |
| `#astrologie/grundlagen/modalitaet-veraenderlich` | `/astrologie/grundlagen/modalitaet-veraenderlich.html` | Grundlagen: modalitaet-veraenderlich |
| `#astrologie/grundlagen/mond-verstehen` | `/astrologie/grundlagen/mond-verstehen.html` | Grundlagen: mond-verstehen |
| `#astrologie/grundlagen/radix-lesen` | `/astrologie/grundlagen/radix-lesen.html` | Grundlagen: radix-lesen |
| `#astrologie/grundlagen/ruecklaeufigkeit` | `/astrologie/grundlagen/ruecklaeufigkeit.html` | Grundlagen: ruecklaeufigkeit |
| `#astrologie/grundlagen/transite` | `/astrologie/grundlagen/transite.html` | Grundlagen: transite |
| `#astrologie/grundlagen/tropisch-und-siderisch` | `/astrologie/grundlagen/tropisch-und-siderisch.html` | Grundlagen: tropisch-und-siderisch |
| `#astrologie/grundlagen/was-astrologie-ist` | `/astrologie/grundlagen/was-astrologie-ist.html` | Grundlagen: was-astrologie-ist |
| `#astrologie/grundlagen/zeichen-und-sternbilder` | `/astrologie/grundlagen/zeichen-und-sternbilder.html` | Grundlagen: zeichen-und-sternbilder |
| `#astrologie/haeuser` | `/astrologie/haeuser/` | Häuser-Index |
| `#astrologie/haeuser/achtes-haus` | `/astrologie/haeuser/achtes-haus.html` | Häuser: achtes-haus |
| `#astrologie/haeuser/drittes-haus` | `/astrologie/haeuser/drittes-haus.html` | Häuser: drittes-haus |
| `#astrologie/haeuser/elftes-haus` | `/astrologie/haeuser/elftes-haus.html` | Häuser: elftes-haus |
| `#astrologie/haeuser/erstes-haus` | `/astrologie/haeuser/erstes-haus.html` | Häuser: erstes-haus |
| `#astrologie/haeuser/fuenftes-haus` | `/astrologie/haeuser/fuenftes-haus.html` | Häuser: fuenftes-haus |
| `#astrologie/haeuser/neuntes-haus` | `/astrologie/haeuser/neuntes-haus.html` | Häuser: neuntes-haus |
| `#astrologie/haeuser/sechstes-haus` | `/astrologie/haeuser/sechstes-haus.html` | Häuser: sechstes-haus |
| `#astrologie/haeuser/siebtes-haus` | `/astrologie/haeuser/siebtes-haus.html` | Häuser: siebtes-haus |
| `#astrologie/haeuser/viertes-haus` | `/astrologie/haeuser/viertes-haus.html` | Häuser: viertes-haus |
| `#astrologie/haeuser/zehntes-haus` | `/astrologie/haeuser/zehntes-haus.html` | Häuser: zehntes-haus |
| `#astrologie/haeuser/zweites-haus` | `/astrologie/haeuser/zweites-haus.html` | Häuser: zweites-haus |
| `#astrologie/haeuser/zwoelftes-haus` | `/astrologie/haeuser/zwoelftes-haus.html` | Häuser: zwoelftes-haus |
| `#astrologie/lernpfad` | `/astrologie/lernpfad/` | Lernpfad-Index |
| `#astrologie/lernpfad/die-zwoelf-zeichen` | `/astrologie/lernpfad/die-zwoelf-zeichen.html` | Lernpfad: die-zwoelf-zeichen |
| `#astrologie/lernpfad/faktoren-und-aspekte` | `/astrologie/lernpfad/faktoren-und-aspekte.html` | Lernpfad: faktoren-und-aspekte |
| `#astrologie/lernpfad/haeuser-und-achsen` | `/astrologie/lernpfad/haeuser-und-achsen.html` | Lernpfad: haeuser-und-achsen |
| `#astrologie/lernpfad/nachschlagen-und-vertiefen` | `/astrologie/lernpfad/nachschlagen-und-vertiefen.html` | Lernpfad: nachschlagen-und-vertiefen |
| `#astrologie/lernpfad/orientierung` | `/astrologie/lernpfad/orientierung.html` | Lernpfad: orientierung |
| `#astrologie/lernpfad/synthese-und-grenzen` | `/astrologie/lernpfad/synthese-und-grenzen.html` | Lernpfad: synthese-und-grenzen |
| `#astrologie/methodik` | `/astrologie/methodik.html` | Astrologie methodik |
| `#astrologie/quellen` | `/astrologie/quellen.html` | Astrologie quellen |
| `#astrologie/suche` | `/astrologie/suche.html` | Astrologie suche |
| `#astrologie/zeichen` | `/astrologie/zeichen/` | Zeichen-Index |
| `#astrologie/zeichen/fische` | `/astrologie/zeichen/fische.html` | Zeichen: fische |
| `#astrologie/zeichen/jungfrau` | `/astrologie/zeichen/jungfrau.html` | Zeichen: jungfrau |
| `#astrologie/zeichen/krebs` | `/astrologie/zeichen/krebs.html` | Zeichen: krebs |
| `#astrologie/zeichen/loewe` | `/astrologie/zeichen/loewe.html` | Zeichen: loewe |
| `#astrologie/zeichen/schuetze` | `/astrologie/zeichen/schuetze.html` | Zeichen: schuetze |
| `#astrologie/zeichen/skorpion` | `/astrologie/zeichen/skorpion.html` | Zeichen: skorpion |
| `#astrologie/zeichen/steinbock` | `/astrologie/zeichen/steinbock.html` | Zeichen: steinbock |
| `#astrologie/zeichen/stier` | `/astrologie/zeichen/stier.html` | Zeichen: stier |
| `#astrologie/zeichen/waage` | `/astrologie/zeichen/waage.html` | Zeichen: waage |
| `#astrologie/zeichen/wassermann` | `/astrologie/zeichen/wassermann.html` | Zeichen: wassermann |
| `#astrologie/zeichen/widder` | `/astrologie/zeichen/widder.html` | Zeichen: widder |
| `#astrologie/zeichen/zwillinge` | `/astrologie/zeichen/zwillinge.html` | Zeichen: zwillinge |
| `#blog` | `/wissen/` | Artikel-Liste |
| `#blog/1` | `/wissen/01-die-78-tarot-karten-eine.html` | Artikel 1 |
| `#blog/10` | `/wissen/10-moldavit-der-meteorit-unter-den.html` | Artikel 10 |
| `#blog/2` | `/wissen/02-kristalle-als-werkzeuge-wie-steine.html` | Artikel 2 |
| `#blog/3` | `/wissen/03-runenwerfen-die-drei-positionen-der.html` | Artikel 3 |
| `#blog/4` | `/wissen/04-die-mondphasen-von-neumond-bis.html` | Artikel 4 |
| `#blog/5` | `/wissen/05-die-geschichte-des-tarot-von.html` | Artikel 5 |
| `#blog/6` | `/wissen/06-einsteiger-guide-wie-du-mit.html` | Artikel 6 |
| `#blog/7` | `/wissen/07-chakren-kristalle-welche-steine-fuer.html` | Artikel 7 |
| `#blog/8` | `/wissen/08-die-bedeutung-des-futhark-von.html` | Artikel 8 |
| `#blog/9` | `/wissen/09-rituale-fuer-jede-mondphase-ein.html` | Artikel 9 |
| `#chakren` | `/farbwelten/chakren.html` | Alias aus dem Bestand |
| `#crystals` | `/kristalle.html` | Kristall-Katalog |
| `#farbwelten` | `/farbwelten/` | Farbwelten-Landing |
| `#farbwelten/blau` | `/farbwelten/blau.html` | Farbseite Blau |
| `#farbwelten/blau/anwendung` | `/farbwelten/blau.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/blau/erleben` | `/farbwelten/blau.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/blau/geschichte` | `/farbwelten/blau.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/blau/physik` | `/farbwelten/blau.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/blau/psychologie` | `/farbwelten/blau.html` | Abschnitt Farbpsychologie |
| `#farbwelten/blau/quellen` | `/farbwelten/blau.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/blau/tradition` | `/farbwelten/blau.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/blau/uebung` | `/farbwelten/blau.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/chakren` | `/farbwelten/chakren.html` | Chakren-Sonderseite |
| `#farbwelten/einstiege` | `/farbwelten/` | Landing-Abschnitt einstiege (Anker: einstiege) |
| `#farbwelten/farbmeditation` | `/farbwelten/farbmeditation.html` | Farbmeditation |
| `#farbwelten/farbpsychologie` | `/farbwelten/farbpsychologie.html` | Themenseite Farbpsychologie |
| `#farbwelten/farbtherapie` | `/farbwelten/farbtherapie.html` | Themenseite Farbtherapie und Chromotherapie |
| `#farbwelten/gelb` | `/farbwelten/gelb.html` | Farbseite Gelb |
| `#farbwelten/gelb/anwendung` | `/farbwelten/gelb.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/gelb/erleben` | `/farbwelten/gelb.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/gelb/geschichte` | `/farbwelten/gelb.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/gelb/physik` | `/farbwelten/gelb.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/gelb/psychologie` | `/farbwelten/gelb.html` | Abschnitt Farbpsychologie |
| `#farbwelten/gelb/quellen` | `/farbwelten/gelb.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/gelb/tradition` | `/farbwelten/gelb.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/gelb/uebung` | `/farbwelten/gelb.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/gruen` | `/farbwelten/gruen.html` | Farbseite Grün |
| `#farbwelten/gruen/anwendung` | `/farbwelten/gruen.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/gruen/erleben` | `/farbwelten/gruen.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/gruen/geschichte` | `/farbwelten/gruen.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/gruen/physik` | `/farbwelten/gruen.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/gruen/psychologie` | `/farbwelten/gruen.html` | Abschnitt Farbpsychologie |
| `#farbwelten/gruen/quellen` | `/farbwelten/gruen.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/gruen/tradition` | `/farbwelten/gruen.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/gruen/uebung` | `/farbwelten/gruen.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/indigo` | `/farbwelten/indigo.html` | Farbseite Indigo |
| `#farbwelten/indigo/anwendung` | `/farbwelten/indigo.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/indigo/erleben` | `/farbwelten/indigo.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/indigo/geschichte` | `/farbwelten/indigo.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/indigo/physik` | `/farbwelten/indigo.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/indigo/psychologie` | `/farbwelten/indigo.html` | Abschnitt Farbpsychologie |
| `#farbwelten/indigo/quellen` | `/farbwelten/indigo.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/indigo/tradition` | `/farbwelten/indigo.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/indigo/uebung` | `/farbwelten/indigo.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/kompass` | `/farbwelten/kompass.html` | Farbkompass |
| `#farbwelten/lichtfrequenzen` | `/farbwelten/lichtfrequenzen.html` | Lichtfrequenzen |
| `#farbwelten/lichtmedizin` | `/farbwelten/lichtmedizin.html` | Themenseite Lichtmedizin und Photobiologie |
| `#farbwelten/magenta` | `/farbwelten/magenta.html` | Farbseite Magenta |
| `#farbwelten/magenta/anwendung` | `/farbwelten/magenta.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/magenta/erleben` | `/farbwelten/magenta.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/magenta/geschichte` | `/farbwelten/magenta.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/magenta/physik` | `/farbwelten/magenta.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/magenta/psychologie` | `/farbwelten/magenta.html` | Abschnitt Farbpsychologie |
| `#farbwelten/magenta/quellen` | `/farbwelten/magenta.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/magenta/tradition` | `/farbwelten/magenta.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/magenta/uebung` | `/farbwelten/magenta.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/methodik` | `/farbwelten/` | Landing-Abschnitt methodik (Anker: methodik) |
| `#farbwelten/orange` | `/farbwelten/orange.html` | Farbseite Orange |
| `#farbwelten/orange/anwendung` | `/farbwelten/orange.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/orange/erleben` | `/farbwelten/orange.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/orange/geschichte` | `/farbwelten/orange.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/orange/physik` | `/farbwelten/orange.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/orange/psychologie` | `/farbwelten/orange.html` | Abschnitt Farbpsychologie |
| `#farbwelten/orange/quellen` | `/farbwelten/orange.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/orange/tradition` | `/farbwelten/orange.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/orange/uebung` | `/farbwelten/orange.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/register` | `/farbwelten/` | Landing-Abschnitt register (Anker: register) |
| `#farbwelten/rosa` | `/farbwelten/rosa.html` | Farbseite Rosa |
| `#farbwelten/rosa/anwendung` | `/farbwelten/rosa.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/rosa/erleben` | `/farbwelten/rosa.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/rosa/geschichte` | `/farbwelten/rosa.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/rosa/physik` | `/farbwelten/rosa.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/rosa/psychologie` | `/farbwelten/rosa.html` | Abschnitt Farbpsychologie |
| `#farbwelten/rosa/quellen` | `/farbwelten/rosa.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/rosa/tradition` | `/farbwelten/rosa.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/rosa/uebung` | `/farbwelten/rosa.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/rot` | `/farbwelten/rot.html` | Farbseite Rot |
| `#farbwelten/rot/anwendung` | `/farbwelten/rot.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/rot/erleben` | `/farbwelten/rot.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/rot/geschichte` | `/farbwelten/rot.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/rot/physik` | `/farbwelten/rot.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/rot/psychologie` | `/farbwelten/rot.html` | Abschnitt Farbpsychologie |
| `#farbwelten/rot/quellen` | `/farbwelten/rot.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/rot/tradition` | `/farbwelten/rot.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/rot/uebung` | `/farbwelten/rot.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/schwarz` | `/farbwelten/schwarz.html` | Farbseite Schwarz |
| `#farbwelten/schwarz/anwendung` | `/farbwelten/schwarz.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/schwarz/erleben` | `/farbwelten/schwarz.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/schwarz/geschichte` | `/farbwelten/schwarz.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/schwarz/physik` | `/farbwelten/schwarz.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/schwarz/psychologie` | `/farbwelten/schwarz.html` | Abschnitt Farbpsychologie |
| `#farbwelten/schwarz/quellen` | `/farbwelten/schwarz.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/schwarz/tradition` | `/farbwelten/schwarz.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/schwarz/uebung` | `/farbwelten/schwarz.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/tuerkis` | `/farbwelten/tuerkis.html` | Farbseite Türkis (Cyan) |
| `#farbwelten/tuerkis/anwendung` | `/farbwelten/tuerkis.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/tuerkis/erleben` | `/farbwelten/tuerkis.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/tuerkis/geschichte` | `/farbwelten/tuerkis.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/tuerkis/physik` | `/farbwelten/tuerkis.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/tuerkis/psychologie` | `/farbwelten/tuerkis.html` | Abschnitt Farbpsychologie |
| `#farbwelten/tuerkis/quellen` | `/farbwelten/tuerkis.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/tuerkis/tradition` | `/farbwelten/tuerkis.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/tuerkis/uebung` | `/farbwelten/tuerkis.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/violett` | `/farbwelten/violett.html` | Farbseite Violett |
| `#farbwelten/violett/anwendung` | `/farbwelten/violett.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/violett/erleben` | `/farbwelten/violett.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/violett/geschichte` | `/farbwelten/violett.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/violett/physik` | `/farbwelten/violett.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/violett/psychologie` | `/farbwelten/violett.html` | Abschnitt Farbpsychologie |
| `#farbwelten/violett/quellen` | `/farbwelten/violett.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/violett/tradition` | `/farbwelten/violett.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/violett/uebung` | `/farbwelten/violett.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/weiss` | `/farbwelten/weiss.html` | Farbseite Weiß |
| `#farbwelten/weiss/anwendung` | `/farbwelten/weiss.html` | Abschnitt Farbtherapeutische Anwendung |
| `#farbwelten/weiss/erleben` | `/farbwelten/weiss.html` | Abschnitt Die Farbe erleben |
| `#farbwelten/weiss/geschichte` | `/farbwelten/weiss.html` | Abschnitt Kultur und Geschichte |
| `#farbwelten/weiss/physik` | `/farbwelten/weiss.html` | Abschnitt Physikalische Eigenschaften |
| `#farbwelten/weiss/psychologie` | `/farbwelten/weiss.html` | Abschnitt Farbpsychologie |
| `#farbwelten/weiss/quellen` | `/farbwelten/weiss.html` | Abschnitt Quellen und verwandte Themen |
| `#farbwelten/weiss/tradition` | `/farbwelten/weiss.html` | Abschnitt Spirituelle Bedeutung |
| `#farbwelten/weiss/uebung` | `/farbwelten/weiss.html` | Abschnitt Entdecken und ausprobieren |
| `#farbwelten/zeitleiste` | `/farbwelten/zeitleiste.html` | Zeitleiste |
| `#frequenzen` | `/frequenzen/` | Frequenzen-Hub |
| `#frequenzen/cymatics` | `/frequenzen/cymatics.html` | Chladni-Muster |
| `#frequenzen/labor` | `/frequenzen/labor.html` | Frequenzlabor |
| `#frequenzen/meditation` | `/frequenzen/meditation.html` | Meditationssitzung |
| `#frequenzen/quellen` | `/frequenzen/quellen.html` | Quellendokument |
| `#frequenzlabor` | `/frequenzen/labor.html` | Alias aus dem Bestand (history.replaceState) |
| `#home` | `/` | Startseite |
| `#lichtfrequenzen` | `/farbwelten/lichtfrequenzen.html` | Alias aus dem Bestand |
| `#moon` | `/mondphasen.html` | Mondphasen |
| `#pendeln` | `/radiasthesie/` | Bereichs-Landing (Entscheidung E2) |
| `#pendeln/experiment` | `/pendeln/experiment.html` | Werkstatt: experiment |
| `#pendeln/glossar` | `/radiasthesie/glossar.html` | Glossar (Buchstabenfilter → Anker) |
| `#pendeln/journal` | `/pendeln/journal.html` | Werkstatt: journal |
| `#pendeln/labor` | `/pendeln/labor.html` | Werkstatt: labor |
| `#pendeln/methodik` | `/radiasthesie/methodik.html` | Methodik |
| `#pendeln/orakel` | `/radiasthesie/orakel.html` | Themenseite Orakel |
| `#pendeln/orakel/delphi` | `/radiasthesie/orakel.html#delphi` | Kapitel 10 |
| `#pendeln/orakel/delphi-ethylen` | `/radiasthesie/orakel.html#delphi-ethylen` | Kapitel 11 |
| `#pendeln/orakel/divination` | `/radiasthesie/orakel.html#divination` | Kapitel 1 |
| `#pendeln/orakel/forer` | `/radiasthesie/orakel.html#forer` | Kapitel 12 |
| `#pendeln/orakel/iging` | `/radiasthesie/orakel.html#iging` | Kapitel 5 |
| `#pendeln/orakel/iging-west` | `/radiasthesie/orakel.html#iging-west` | Kapitel 6 |
| `#pendeln/orakel/orakelkarten` | `/radiasthesie/orakel.html#orakelkarten` | Kapitel 9 |
| `#pendeln/orakel/runen` | `/radiasthesie/orakel.html#runen` | Kapitel 7 |
| `#pendeln/orakel/runen-20` | `/radiasthesie/orakel.html#runen-20` | Kapitel 8 |
| `#pendeln/orakel/tarot-1` | `/radiasthesie/orakel.html#tarot-1` | Kapitel 2 |
| `#pendeln/orakel/tarot-2` | `/radiasthesie/orakel.html#tarot-2` | Kapitel 3 |
| `#pendeln/orakel/tarot-3` | `/radiasthesie/orakel.html#tarot-3` | Kapitel 4 |
| `#pendeln/pendeln` | `/radiasthesie/pendeln.html` | Themenseite Pendeln |
| `#pendeln/pendeln/arten` | `/radiasthesie/pendeln.html#arten` | Kapitel 3 |
| `#pendeln/pendeln/biotensor` | `/radiasthesie/pendeln.html#biotensor` | Kapitel 6 |
| `#pendeln/pendeln/forschung` | `/radiasthesie/pendeln.html#forschung` | Kapitel 9 |
| `#pendeln/pendeln/geschichte` | `/radiasthesie/pendeln.html#geschichte` | Kapitel 2 |
| `#pendeln/pendeln/karten` | `/radiasthesie/pendeln.html#karten` | Kapitel 7 |
| `#pendeln/pendeln/labor` | `/radiasthesie/pendeln.html#labor` | Kapitel 10 |
| `#pendeln/pendeln/lernen` | `/radiasthesie/pendeln.html#lernen` | Kapitel 4 |
| `#pendeln/pendeln/mechanismen` | `/radiasthesie/pendeln.html#mechanismen` | Kapitel 8 |
| `#pendeln/pendeln/tafeln` | `/radiasthesie/pendeln.html#tafeln` | Kapitel 5 |
| `#pendeln/pendeln/was` | `/radiasthesie/pendeln.html#was` | Kapitel 1 |
| `#pendeln/quellen` | `/radiasthesie/quellen.html` | Quellen |
| `#pendeln/radiasthesie` | `/radiasthesie/radiasthesie.html` | Themenseite Radiästhesie |
| `#pendeln/radiasthesie/befunde` | `/radiasthesie/radiasthesie.html#befunde` | Kapitel 10 |
| `#pendeln/radiasthesie/bovis` | `/radiasthesie/radiasthesie.html#bovis` | Kapitel 8 |
| `#pendeln/radiasthesie/erdstrahlen` | `/radiasthesie/radiasthesie.html#erdstrahlen` | Kapitel 6 |
| `#pendeln/radiasthesie/frequenz` | `/radiasthesie/radiasthesie.html#frequenz` | Kapitel 9 |
| `#pendeln/radiasthesie/geologie` | `/radiasthesie/radiasthesie.html#geologie` | Kapitel 7 |
| `#pendeln/radiasthesie/geschichte-1` | `/radiasthesie/radiasthesie.html#geschichte-1` | Kapitel 2 |
| `#pendeln/radiasthesie/geschichte-2` | `/radiasthesie/radiasthesie.html#geschichte-2` | Kapitel 3 |
| `#pendeln/radiasthesie/geschichte-3` | `/radiasthesie/radiasthesie.html#geschichte-3` | Kapitel 4 |
| `#pendeln/radiasthesie/instrumente` | `/radiasthesie/radiasthesie.html#instrumente` | Kapitel 5 |
| `#pendeln/radiasthesie/was` | `/radiasthesie/radiasthesie.html#was` | Kapitel 1 |
| `#pendeln/studio` | `/pendeln/studio.html` | Werkstatt: studio |
| `#pendeln/suche` | `/pendeln/suche.html` | Werkstatt: suche |
| `#runes` | `/runen.html` | Runen |
| `#tarot` | `/tarot.html` | Tarot-Katalog |

## Query-Parameter

Die Shim-Funktion hängt eine vorhandene Query unverändert an das Ziel an
(`#astrologie/glossar?q=mond` → `/astrologie/glossar.html?q=mond`). Seiten, die
ihre Filter bislang aus der Query lasen, behalten damit ihre Adresse; die Auswertung
erfolgt in der jeweiligen Seite (Suchseiten sind derzeit statische Verzeichnisse,
siehe `docs/migration-offene-punkte.md`).
