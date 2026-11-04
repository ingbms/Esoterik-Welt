/**
 * Typen für die Grenze zu den Legacy-Datenmodulen.
 *
 * Warum eigene Interfaces statt reiner Inferenz: Die Module in `js/data/` sind
 * groß und teilweise generiert; TypeScript leitet daraus teils `any` ab (etwa
 * bei `Object.freeze`-Strukturen) oder sehr enge Union-Typen (etwa
 * `{mode: 'none'} | {mode: 'tone'}`), die beim Zugriff auf optionale Felder
 * scheitern. Die Interfaces beschreiben genau die Felder, die die Astro-Seiten
 * lesen — nicht mehr. Alles darüber hinaus bleibt über den Index-Signatur-Zugang
 * erreichbar, ohne `any` zu verbreiten.
 */

export interface WerkstattEntry {
  id: string;
  slug: string;
  title: string;
  category: string;
  summary: string;
  body: string;
  tags: string[];
  evidenceStatus: string;
  reviewStatus: string;
  lastReviewed: string;
  [key: string]: unknown;
}

export interface WerkstattData {
  contractVersion: string;
  storageSchema: number;
  journalLimits: Record<string, number>;
  instrumente: WerkstattEntry[];
  methoden: WerkstattEntry[];
  ereignisse: WerkstattEntry[];
  erklaerungsmodelle: WerkstattEntry[];
  studien: WerkstattEntry[];
  medien: WerkstattEntry[];
  experimente: WerkstattEntry[];
  availableMedia: WerkstattEntry[];
  journalMethods: string[];
}

export interface MoonPhase {
  key: string;
  name: string;
  sector: string;
  appearance: string;
  geometry: string;
  numbers: string;
  culture: string;
  reflection: string;
}

export interface MoonRitual {
  title: string;
  description: string;
  duration: string;
  items: string[];
}

export interface FrequencyPlayback {
  mode: 'tone' | 'binaural' | 'none' | string;
  hz?: number;
  partner_hz?: number;
  carrier_hz?: number;
  delta_hz?: number;
}

export interface FrequencyEntry {
  id: string;
  name: string;
  hz: number | null;
  range_hz_min?: number | null;
  range_hz_max?: number | null;
  kategorie: string;
  unterkategorie: string;
  evidenzstatus: string;
  beschreibung_kurz: string;
  quelle_titel?: string;
  quelle_url?: string;
  partner_hz?: number | null;
  warnhinweis?: string;
  playback?: FrequencyPlayback;
}

export interface FrequencyData {
  schema_version: string;
  stand: string;
  titel: string;
  beschreibung: string;
  disclaimer: { kurz: string; lang: string; lautstaerke: string };
  evidenzstatus_definitionen: Record<string, string>;
  kategorien: Record<string, string>;
  feldschema: Record<string, string>;
  frequencies: FrequencyEntry[];
}

export interface CompassWorld {
  associations: string;
  kulturell: string;
  hinweis: string;
  quellen?: string[];
}

export interface CompassData {
  title: string;
  seoTitle: string;
  meta: { title: string; description: string };
  lede: string;
  note: string;
  worlds: Record<string, CompassWorld>;
  sources: string[];
}
