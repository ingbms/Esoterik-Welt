/**
 * Typisierte Grenze zu den Datenmodulen des Bestands.
 *
 * Warum nicht „Daten umschreiben“: Die Module in `js/data/` (852 KB) sind
 * generierte oder redaktionell gepflegte Quellen mit eigenen Generator- und
 * Byte-Vergleichstests (`npm run verify:sync`). Sie in Astro neu zu tippen
 * hieße, 78 Tarotkarten, 65 Glossarbegriffe, 66 Quellen und 12 Farbwelten
 * abzuschreiben — genau die Fehlerquelle, die der Migrationsplan unter R4
 * (doppelte Inhaltsquellen) beschreibt. Diese Datei bindet die *vorhandene*
 * Quelle build-seitig ein; die Umstellung der Generatoren auf Astro-Build-Schritte
 * ist eine eigene Aufgabe (Migrationsplan P3, R4).
 *
 * Konsequenz: Die Module werden ausschließlich zur Build-Zeit gelesen. Nichts
 * davon landet im Client-Bundle, solange es nicht in einem `<script>` steht.
 *
 * `checkJs` ist in `tsconfig.json` bewusst aus: Die Legacy-Module sind
 * JavaScript ohne eigene Typdeklaration. TypeScript leitet die Formen aus dem
 * Code ab; Fehler in den Legacy-Dateien selbst sind nicht Teil dieser Migration.
 * Wo die Inferenz zu `any` oder zu engen Union-Typen führt (etwa bei
 * `Object.freeze`-Strukturen und JSON-Importen), wird hier **einmal** auf die
 * Interfaces aus `./types` gecastet — nicht in den Seiten, damit keine
 * `any`-Werte durch die Templates wandern.
 */
import type { CompassData, FrequencyData, MoonPhase, MoonRitual, WerkstattData } from './types';

export {
  ASPEKTE,
  BEISPIELE,
  CLAIMS as ASTROLOGIE_CLAIMS,
  FAKTOREN,
  FAQ as ASTROLOGIE_FAQ,
  GLOSSAR as ASTROLOGIE_GLOSSAR,
  GRUNDLAGEN,
  HAEUSER,
  LERNPFAD,
  LERNPFAD_INTRO,
  META as ASTROLOGIE_META,
  QUELLEN as ASTROLOGIE_QUELLEN,
  ZEICHEN,
} from '../../js/data/astrologie.js';

export { CHAKREN, CHAKRA_POSITIONS } from '../../js/data/chakren.js';

export {
  FARBWELTEN,
  LANDING as FARB_LANDING,
  LIGHT_PAGE as FARB_LICHTFREQUENZEN,
  MEDITATION as FARB_MEDITATION,
  SECTION_ORDER as FARB_SECTION_ORDER,
  SOURCES as FARB_SOURCES,
  TIMELINE as FARB_TIMELINE,
  TOPIC_PAGES as FARB_TOPIC_PAGES,
} from '../../js/data/farbwelten.js';

export { DEEP_DIVE as MOON_DEEP_DIVE, PHASE_ORDER, SOURCES as MOON_SOURCES } from '../../js/data/moon.js';

export { RADIASTHESIE } from '../../js/data/radiasthesie.js';

export { runes as RUNEN, runeAetts as RUNEN_AETTIR } from '../../js/data/runes.js';

export { SUIT_LABELS, TAROT_CARD_COUNT, TAROT_DISCLAIMER, tarotCards } from '../../js/data/tarot.js';

export { SUPPORTED_DECK_IDS, DEFAULT_DECK_ID, listDecks, cardAssetPath } from '../../js/data/tarot-decks.js';

import crystalsJson from '../../data/crystals.json';
import frequenciesJson from '../../data/frequencies.json';
import { WERKSTATT as werkstattRaw } from '../../js/data/radiasthesie-werkstatt.js';
import { PHASE_CONTENT as phaseContentRaw, moonRituals as moonRitualsRaw } from '../../js/data/moon.js';
import { COMPASS as compassRaw } from '../../js/data/farbwelten.js';

/** Kristallkatalog: `data/crystals.json` ist die vom Modul geladene Quelle (30 Steine). */
export const KRISTALLE = crystalsJson.crystals;

/** Frequenzbestand: Presets, Evidenzstatus und Disclaimer. */
export const FREQUENZEN = frequenciesJson as unknown as FrequencyData;

/** Werkstatt-Konfiguration: Instrumente, Methoden, Studien, Medien, Experimente. */
export const WERKSTATT = werkstattRaw as unknown as WerkstattData;

/** Acht Mondphasen als Nachschlageobjekt (Index über den Phasenschlüssel). */
export const PHASE_CONTENT = phaseContentRaw as unknown as Record<string, MoonPhase>;

/** Rituale je Mondphase. */
export const MOON_RITUALS = moonRitualsRaw as unknown as Record<string, MoonRitual[]>;

/** Farbkompass: zwölf Farben mit Assoziationen und Kulturbezug. */
export const FARB_COMPASS = compassRaw as unknown as CompassData;
