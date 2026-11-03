// Werkstatt-Konfiguration für RAD-07 bis RAD-10 — stabile, eingefrorene Fassade.
//
// Die Inhalte selbst stehen in js/data/radiasthesie.js (generiert aus
// docs/radiasthesie-konzept/daten/taxonomie.json). Diese Datei ist der
// vereinbarte Einstiegspunkt aus KOMPONENTENGRENZEN.md §1.1: Komponenten
// bekommen `data` als unveränderliche Konfiguration und greifen nicht direkt
// in die generierte Datei.
//
// Vertragsstand und Speicher-Schema kommen aus js/modules/radiasthesie-vertraege.js.

import RADIASTHESIE from './radiasthesie.js';
import {
  CONTRACT_VERSION,
  STORAGE_SCHEMA,
  JOURNAL_LIMITS,
  validateProtocol,
} from '../modules/radiasthesie-vertraege.js';

function freezeDeep(value) {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freezeDeep);
    Object.freeze(value);
  }
  return value;
}

const taxonomie = RADIASTHESIE.taxonomie;
if (!taxonomie) {
  throw new Error('Taxonomie fehlt — js/data/radiasthesie.js bitte mit npm run data:radiasthesie erzeugen');
}

const experimentById = (id) => taxonomie.experimente.find((experiment) => experiment.id === id) || null;
const instrumentById = (id) => taxonomie.instrumente.find((instrument) => instrument.id === id) || null;
const mediumById = (id) => taxonomie.medien.find((medium) => medium.id === id) || null;

export const WERKSTATT = freezeDeep({
  contractVersion: CONTRACT_VERSION,
  storageSchema: STORAGE_SCHEMA,
  journalLimits: { ...JOURNAL_LIMITS },
  source: {
    generatedAt: RADIASTHESIE.generatedAt,
    schemaVersion: RADIASTHESIE.schemaVersion,
    taxonomieVersion: taxonomie.$schema_version,
    updated: taxonomie.updated,
  },
  instrumente: taxonomie.instrumente,
  methoden: taxonomie.methoden,
  ereignisse: taxonomie.ereignisse,
  erklaerungsmodelle: taxonomie.erklaerungsmodelle,
  studien: taxonomie.studien,
  medien: taxonomie.medien,
  experimente: taxonomie.experimente,
  // Nur die im Katalog verfügbaren (nicht geplanten) Medien sind auslieferbar.
  availableMedia: taxonomie.medien.filter((medium) => medium.status === 'available'),
  experimentById,
  instrumentById,
  mediumById,
  // Methoden-Auswahl für das Tagebuch (RAD-10), ids sind stabile Slugs.
  journalMethods: taxonomie.methoden.map((method) => method.id),
  validateProtocol,
});

export default WERKSTATT;
