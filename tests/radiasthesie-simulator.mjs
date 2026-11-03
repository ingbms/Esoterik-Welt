// Pendellabor (RAD-07) — deterministische Tests ohne Browser.
//
// Geprüft wird die Physik gegen geschlossene Referenzwerte:
//   * Kleinwinkelformel T₀ = 2π√(L/g) bei L = 0,25 m und L = 1,00 m,
//   * exakte Periode über das vollständige elliptische Integral (AGM) bei 60°,
//   * logarithmisches Dekrement der Dämpfung,
//   * Unabhängigkeit von Bildrate und Frame-Aufteilung,
//   * Energieverhalten, Grenzwerte und Fehlerfälle,
//   * Route, Markup und Werkstatt-Karte der Ansicht.
//
// Der Simulator ist reines ESM (js/package.json: type=module) und wird direkt
// importiert — kein Kopieren in ein temporäres Verzeichnis nötig.

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  SIM,
  PENDEL_STYLES,
  advance,
  angularFrequency,
  createPeriodMeter,
  createState,
  formatAngle,
  formatNumber,
  formatPeriod,
  normalizeParams,
  periodDamped,
  periodSmallAngle,
  simulate,
  specificEnergy,
  stepFixed,
  updatePeriodMeter,
} from '../js/modules/pendel-simulator.js';
import { createModel } from '../js/modules/radiasthesie-model.js';
import { renderLabor, renderLanding } from '../js/modules/radiasthesie-views.js';
import RADIASTHESIE from '../js/data/radiasthesie.js';

const model = createModel(RADIASTHESIE);

/**
 * Exakte Periode des ungedämpften Pendels:
 * T = 4·√(L/g)·K(k) mit k = sin(θ₀/2) und K(k) = π / (2·AGM(1, √(1−k²))).
 * Das arithmetisch-geometrische Mittel konvergiert quadratisch; 40 Runden
 * reichen weit über die Prüfgenauigkeit hinaus.
 */
function exactPeriod(lengthM, amplitudeDeg, gravity = SIM.gravity) {
  const k = Math.sin((amplitudeDeg * Math.PI) / 360);
  let a = 1;
  let b = Math.sqrt(1 - k * k);
  for (let i = 0; i < 40; i += 1) {
    const nextA = (a + b) / 2;
    const nextB = Math.sqrt(a * b);
    a = nextA;
    b = nextB;
  }
  const complete = Math.PI / (2 * a);
  return 4 * Math.sqrt(lengthM / gravity) * complete;
}

const relative = (value, reference) => Math.abs(value - reference) / Math.abs(reference);

// --- Parameter und Fehlerfälle -------------------------------------------

test('Parameterbereiche entsprechen dem dokumentierten Gültigkeitsbereich', () => {
  assert.deepEqual(
    { min: SIM.lengthM.min, max: SIM.lengthM.max, initial: SIM.lengthM.initial },
    { min: 0.05, max: 2, initial: 0.25 }
  );
  assert.deepEqual(
    { min: SIM.amplitudeDeg.min, max: SIM.amplitudeDeg.max, initial: SIM.amplitudeDeg.initial },
    { min: 0, max: 80, initial: 25 }
  );
  assert.deepEqual(
    { min: SIM.damping.min, max: SIM.damping.max, initial: SIM.damping.initial },
    { min: 0, max: 0.2, initial: 0.02 }
  );
  assert.equal(SIM.gravity, 9.81);
  assert.equal(SIM.fixedStep, 1 / 480);
  assert.deepEqual([...PENDEL_STYLES], ['klassisch', 'kugel', 'ring']);
});

test('Ungültige Längen, Auslenkungen und Dämpfungswerte werden abgewiesen', () => {
  for (const value of [0, 0.049, 2.001, -1, Number.NaN, Number.POSITIVE_INFINITY, '0.25', null]) {
    assert.throws(
      () => periodSmallAngle(value),
      (error) => error instanceof TypeError || error instanceof RangeError,
      `L=${value}`
    );
  }
  assert.throws(() => normalizeParams({ lengthM: 0.25, amplitudeDeg: -1, damping: 0 }), RangeError);
  assert.throws(() => normalizeParams({ lengthM: 0.25, amplitudeDeg: 81, damping: 0 }), RangeError);
  assert.throws(() => normalizeParams({ lengthM: 0.25, amplitudeDeg: 20, damping: -0.01 }), RangeError);
  assert.throws(() => normalizeParams({ lengthM: 0.25, amplitudeDeg: 20, damping: 0.201 }), RangeError);
  assert.throws(() => periodSmallAngle(0.25, 0), RangeError);
  assert.throws(() => periodDamped(0.25, 1), RangeError);
});

// --- Referenzwerte --------------------------------------------------------

test('Kleinwinkelformel trifft die Referenzwerte für 25 cm und 1 m', () => {
  assert.ok(relative(periodSmallAngle(0.25), 1.003033) < 5e-5, 'T₀(0,25 m) ≈ 1,003033 s');
  assert.ok(relative(periodSmallAngle(1), 2.006067) < 5e-5, 'T₀(1,00 m) ≈ 2,006067 s');
  assert.ok(relative(periodSmallAngle(0.05), 0.44857) < 5e-5, 'untere Grenze 5 cm');
  assert.ok(relative(periodSmallAngle(2), 2.837007) < 5e-5, 'obere Grenze 2 m');
  // Vierfache Länge, doppelte Dauer.
  assert.ok(relative(periodSmallAngle(2) / periodSmallAngle(0.5), 2) < 1e-12);
  assert.ok(relative(angularFrequency(0.25), Math.sqrt(SIM.gravity / 0.25)) < 1e-15);
});

test('Startzustand ruht in der Anfangsauslenkung', () => {
  const state = createState({ lengthM: 0.25, amplitudeDeg: 25, damping: 0.02 });
  assert.ok(Math.abs(state.theta - (25 * Math.PI) / 180) < 1e-15);
  assert.equal(state.omega, 0);
  assert.equal(state.t, 0);
  assert.equal(state.steps, 0);
  const params = normalizeParams({ lengthM: 0.25, amplitudeDeg: 25, damping: 0.02 });
  assert.equal(specificEnergy(state, params), SIM.gravity * 0.25 * (1 - Math.cos((25 * Math.PI) / 180)));
});

test('Ein RK4-Schritt ist deterministisch und verändert den Zustand', () => {
  const params = normalizeParams({ lengthM: 0.5, amplitudeDeg: 30, damping: 0 });
  const start = createState(params);
  const once = stepFixed(start, params);
  const again = stepFixed(start, params);
  assert.deepEqual(once, again);
  assert.ok(once.theta < start.theta, 'Rückstellkraft zieht zur Ruhelage');
  assert.ok(once.omega < 0);
  assert.equal(once.steps, 1);
  assert.ok(Math.abs(once.t - SIM.fixedStep) < 1e-15);
});

test('Ungedämpft bei kleiner Auslenkung: gemessene Dauer entspricht T₀', () => {
  const result = simulate({ lengthM: 0.25, amplitudeDeg: 2, damping: 0 }, 6);
  assert.ok(result.period, 'Periode wurde gemessen');
  assert.ok(relative(result.period, periodSmallAngle(0.25)) < 2e-3, `gemessen ${result.period}`);
});

test('Große Auslenkung: gemessene Dauer folgt der exakten elliptischen Referenz', () => {
  const cases = [25, 45, 60, 80];
  for (const amplitudeDeg of cases) {
    const result = simulate({ lengthM: 0.25, amplitudeDeg, damping: 0 }, 8);
    const reference = exactPeriod(0.25, amplitudeDeg);
    assert.ok(relative(result.period, reference) < 1e-3, `${amplitudeDeg}°: ${result.period} vs. ${reference}`);
  }
});

test('Kleinwinkelformel unterschätzt die Dauer mit wachsendem Winkel', () => {
  const ratio = (amplitudeDeg) =>
    simulate({ lengthM: 0.25, amplitudeDeg, damping: 0 }, 6).period / periodSmallAngle(0.25);
  const r25 = ratio(25);
  const r60 = ratio(60);
  const r80 = ratio(80);
  assert.ok(r25 > 1.01 && r25 < 1.015, `25°: ${r25}`);
  assert.ok(r60 > 1.07 && r60 < 1.077, `60°: ${r60}`);
  assert.ok(r80 > 1.13 && r80 < 1.145, `80°: ${r80}`);
  assert.ok(r60 > r25 && r80 > r60);
});

// --- Dämpfung -------------------------------------------------------------

test('Dämpfung: Amplitude klingt monoton ab und folgt dem logarithmischen Dekrement', () => {
  const damping = 0.05;
  const result = simulate({ lengthM: 0.25, amplitudeDeg: 20, damping }, 10);
  assert.ok(result.peaks.length >= 5, `Wendepunkte: ${result.peaks.length}`);
  const angles = result.peaks.map((peak) => peak.angleDeg);
  for (let i = 1; i < angles.length; i += 1) {
    assert.ok(angles[i] < angles[i - 1], `Abfall zwischen ${angles[i - 1]} und ${angles[i]}`);
  }
  // Benachbarte Wendepunkte liegen auf verschiedenen Seiten (halbe Periode),
  // erst jeder zweite gehört zur selben Seite. Das volle Dekrement gilt für
  // eine ganze Periode: A(n+1)/A(n) = exp(2πζ/√(1−ζ²)).
  const expected = Math.exp((2 * Math.PI * damping) / Math.sqrt(1 - damping * damping));
  for (let i = 2; i < angles.length; i += 1) {
    const ratio = angles[i - 2] / angles[i];
    assert.ok(relative(ratio, expected) < 0.01, `Dekrement ${ratio} vs. ${expected}`);
  }
});

test('Gedämpfte Dauer entspricht T_ged = 2π/(ω₀√(1−ζ²))', () => {
  const damping = 0.05;
  const result = simulate({ lengthM: 0.6, amplitudeDeg: 5, damping }, 12);
  assert.ok(result.period);
  assert.ok(relative(result.period, periodDamped(0.6, damping)) < 3e-3, `${result.period}`);
});

test('Ohne Dämpfung bleibt die Energie erhalten, mit Dämpfung sinkt sie', () => {
  const free = normalizeParams({ lengthM: 0.5, amplitudeDeg: 15, damping: 0 });
  const freeRun = simulate(free, 10);
  assert.ok(
    relative(freeRun.energy, freeRun.startEnergy) < 1e-6,
    `Drift ${relative(freeRun.energy, freeRun.startEnergy)}`
  );

  const damped = simulate({ lengthM: 0.5, amplitudeDeg: 15, damping: 0.05 }, 10);
  assert.ok(damped.energy < 0.6 * damped.startEnergy);
});

// --- Zeit und Bildrate ----------------------------------------------------

test('advance() liefert nach gleicher simulierter Zeit denselben Zustand', () => {
  const params = normalizeParams({ lengthM: 0.4, amplitudeDeg: 35, damping: 0.03 });
  const build = (chunk) => {
    let state = createState(params);
    let elapsed = 0;
    while (elapsed < 2 - 1e-12) {
      const step = Math.min(chunk, 2 - elapsed);
      state = advance(state, params, step);
      elapsed += step;
    }
    return state;
  };
  const sixty = build(1 / 60);
  const oneFortyFour = build(1 / 144);
  const coarse = build(0.25);
  assert.ok(Math.abs(sixty.theta - oneFortyFour.theta) < 1e-9, `${sixty.theta} vs. ${oneFortyFour.theta}`);
  assert.ok(Math.abs(sixty.omega - oneFortyFour.omega) < 1e-9);
  assert.ok(Math.abs(sixty.theta - coarse.theta) < 1e-9, `${sixty.theta} vs. ${coarse.theta}`);
  assert.ok(Math.abs(sixty.t - 2) < 1e-6, `t = ${sixty.t}`);
});

test('simulate() ist unabhängig von der Bildrate', () => {
  const slow = simulate({ lengthM: 0.7, amplitudeDeg: 40, damping: 0.02 }, 4, { fps: 30 });
  const fast = simulate({ lengthM: 0.7, amplitudeDeg: 40, damping: 0.02 }, 4, { fps: 144 });
  assert.ok(Math.abs(slow.state.theta - fast.state.theta) < 1e-9);
  assert.ok(Math.abs(slow.state.omega - fast.state.omega) < 1e-9);
  assert.ok(Math.abs(slow.state.t - fast.state.t) < 1e-6);
});

test('advance() begrenzt einen Aufruf und ignoriert negative oder ungültige Zeit', () => {
  const params = normalizeParams({ lengthM: 0.25, amplitudeDeg: 20, damping: 0 });
  const state = createState(params);
  const capped = advance(state, params, 5);
  assert.ok(capped.t <= SIM.maxFrameSeconds + 1e-9, `t = ${capped.t}`);
  assert.equal(advance(state, params, -1).t, 0);
  assert.equal(advance(state, params, Number.NaN).t, 0);
  assert.throws(() => stepFixed(state, params, 0), RangeError);
});

// --- Grenzfälle -----------------------------------------------------------

test('Auslenkung 0 bleibt in Ruhe und erzeugt keine Periode', () => {
  const result = simulate({ lengthM: 0.25, amplitudeDeg: 0, damping: 0 }, 3);
  assert.equal(result.state.theta, 0);
  assert.equal(result.state.omega, 0);
  assert.equal(result.period, null);
  assert.ok(Math.abs(result.state.t - 3) < 1e-6);
});

test('Starke Dämpfung bleibt über 30 s stabil und läuft nicht über', () => {
  const result = simulate({ lengthM: 2, amplitudeDeg: 80, damping: 0.2 }, 30);
  for (const value of [result.state.theta, result.state.omega, result.state.t, result.energy]) {
    assert.ok(Number.isFinite(value), `endlich: ${value}`);
  }
  assert.ok(Math.abs(result.state.theta) < 0.01, `Restwinkel ${result.state.theta}`);
  assert.ok(result.energy < 0.01 * result.startEnergy);
});

test('Periodenmesser interpoliert den Nulldurchgang und zählt nur Aufwärtswechsel', () => {
  let meter = createPeriodMeter();
  meter = updatePeriodMeter(meter, { theta: 0.2, t: 0 }, { theta: 0.1, t: 0.5 });
  assert.equal(meter.crossings, 0);
  meter = updatePeriodMeter(meter, { theta: 0.1, t: 0.5 }, { theta: -0.1, t: 1.0 }); // abwärts
  assert.equal(meter.crossings, 0);
  assert.equal(meter.period, null);
  meter = updatePeriodMeter(meter, { theta: -0.1, t: 1.0 }, { theta: 0.05, t: 1.6 }); // aufwärts
  assert.equal(meter.crossings, 1);
  assert.equal(meter.period, null);
  assert.ok(Math.abs(meter.lastCrossing - 1.4) < 1e-12, `Nulldurchgang ${meter.lastCrossing}`);
  meter = updatePeriodMeter(meter, { theta: -0.05, t: 2.0 }, { theta: 0.02, t: 2.4 });
  assert.equal(meter.crossings, 2);
  const second = 2.0 + 0.4 * (0.05 / 0.07);
  assert.ok(Math.abs(meter.period - (second - 1.4)) < 1e-12, `Periode ${meter.period}`);
});

// --- Formate --------------------------------------------------------------

test('Anzeigeformate nutzen deutsches Dezimalkomma und typografisches Minus', () => {
  assert.equal(formatNumber(1.0034, 3), '1,003');
  assert.equal(formatPeriod(1.0034), '1,003 s');
  assert.equal(formatAngle(25), '25,0°');
  assert.equal(formatAngle(-25), '−25,0°');
  assert.equal(formatNumber(Number.NaN), '—');
  assert.equal(formatPeriod(null), '—');
});

// --- Route und Ansicht ----------------------------------------------------

test('Route #pendeln/labor liefert die Laboransicht, unbekannte Slugs bleiben 404', () => {
  const route = model.resolve(['labor'], '');
  assert.equal(route.view, 'labor');
  assert.equal(model.resolve(['laborx'], '').view, 'notfound');
  assert.equal(model.resolve([], '').view, 'landing');
  assert.equal(model.resolve(['glossar'], '').view, 'glossar');
});

test('Laboransicht: eine H1, Regler mit Labels, drei Darstellungen, Disclaimer', () => {
  const view = renderLabor();
  const html = view.html;
  assert.equal(view.simulator, true);
  assert.equal(view.h1, 'Pendellabor');
  assert.ok(view.description.length >= 60 && view.description.length <= 165, `${view.description.length} Zeichen`);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.ok(html.includes('id="pendelLabor"'));
  assert.ok(html.includes('id="psimScene"'));
  assert.ok(!html.includes('<script'));

  for (const input of ['psimLength', 'psimAmplitude', 'psimDamping']) {
    assert.ok(html.includes(`id="${input}"`), `Regler ${input}`);
    assert.ok(html.includes(`for="${input}"`), `Label für ${input}`);
    assert.ok(html.includes(`id="${input}Value"`), `Ausgabe für ${input}`);
    assert.ok(html.includes(`aria-describedby="${input}Hint"`), `Hinweis für ${input}`);
  }
  assert.equal((html.match(/type="range"/g) || []).length, 3);
  assert.equal((html.match(/name="psimStyle"/g) || []).length, 3);
  for (const style of PENDEL_STYLES) {
    assert.ok(html.includes(`data-psim-bob="${style}"`), `Darstellung ${style}`);
  }
  assert.equal((html.match(/data-active/g) || []).length, 1, 'genau eine aktive Darstellung');
  assert.ok(html.includes('id="psimToggle"'));
  assert.ok(html.includes('id="psimReset"'));
  assert.ok(html.includes('id="psimStep" hidden'));
  assert.ok(html.includes('id="psimStatus" role="status" aria-live="polite"'));
  assert.ok(html.includes('id="psimTime"'));
  assert.ok(html.includes('id="psimTheta"'));
  assert.ok(html.includes('id="psimPeriodMeasured"'));
  assert.ok(html.includes('id="psimPeriodIdeal"'));
  assert.ok(html.includes('tabindex="0"'), 'Bühne ist per Tastatur erreichbar');
  assert.ok(html.includes('assets/radiasthesie/pendel-geometrie.svg'), 'Modellabbildung ist die Pendelgeometrie');

  // Keine Suggestion von Informationsgewinnung.
  assert.ok(html.includes('Keine Informationsgewinnung'));
  assert.ok(html.includes('Was diese Simulation nicht tut'));
  assert.ok(html.includes('beantwortet keine Fragen'));
  assert.ok(html.includes('Gültigkeitsbereich und Annahmen'));
});

test('Startseite verlinkt Pendellabor und Tafel-Studio als verfügbare Werkzeuge', () => {
  const workshop = model.data.landing.workshop;
  assert.equal(workshop.length, 3);
  assert.equal(workshop[0].title, 'Pendellabor');
  assert.equal(workshop[0].href, '#pendeln/labor');
  assert.equal(workshop[0].state, 'Verfügbar');
  assert.equal(workshop[1].title, 'Pendeltafel-Studio');
  assert.equal(workshop[1].href, '#pendeln/studio');
  assert.equal(workshop[1].state, 'Verfügbar');
  // Das Experimentierlabor folgt erst mit RAD-09 und bleibt angekündigt.
  assert.equal(workshop[2].title, 'Experimentierlabor');
  assert.equal(workshop[2].href, undefined);
  assert.equal(workshop[2].state, 'In Vorbereitung');

  const html = renderLanding(model).html;
  assert.ok(html.includes('class="rad-werk-link" href="#pendeln/labor"'));
  assert.ok(html.includes('class="rad-werk-link" href="#pendeln/studio"'));
  assert.equal((html.match(/rad-werk-state--ready/g) || []).length, 2);
  assert.equal((html.match(/rad-werk-state--planned/g) || []).length, 1);
});
