// Frequenzlabor — Vertrags- und Signalprüfungen der Audio-Engine ohne Browser.
//
// Abnahmematrix E1–E20 aus docs/adr-frequenzlabor.md §9.1. Die Engine wird als
// unveränderte Browser-Datei importiert; Node behandelt .js in diesem Paket als
// CommonJS, deshalb wird sie — wie bei tests/astrologie.mjs — in ein temporäres
// Verzeichnis mit eigener package.json ("type":"module") kopiert.
//
// Der Fake-Kontext zeichnet den kompletten Graphen und jede Automation auf.
// E18 rendert zusätzlich echtes Signal: der Fake wertet Oszillator-Wellenform,
// Gain- und Panner-Automation selbst aus (48 kHz, 1 s) und misst die Frequenz
// per Goertzel-Scan. Damit prüft der Test die Hüllkurve und die
// Pegel-Invariante aus ADR §4.3 ohne Audiogerät.

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAMPLE_RATE = 48000;

let tmp;
let engineModule;

before(async () => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'frequenz-engine-'));
  fs.mkdirSync(path.join(tmp, 'js/modules'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'package.json'), JSON.stringify({ type: 'module' }));
  fs.copyFileSync(path.join(root, 'js/modules/frequenz-engine.js'), path.join(tmp, 'js/modules/frequenz-engine.js'));
  engineModule = await import(pathToFileURL(path.join(tmp, 'js/modules/frequenz-engine.js')).href);
});

after(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

// --------------------------------------------------------------- Test-Doubles

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * AudioParam mit echter Automationsauswertung. `value` liefert den Wert zum
 * aktuellen `context.currentTime`, damit die Engine wie im Browser lesen kann.
 */
class FakeAudioParam {
  constructor(context, value = 0) {
    this.context = context;
    this.baseValue = value;
    this.events = [];
    this.calls = [];
  }

  get value() {
    return this.computeAt(this.context.currentTime);
  }

  set value(next) {
    this.baseValue = next;
  }

  #record(type, value, time) {
    this.events.push({ type, value, time });
    this.events.sort((a, b) => a.time - b.time);
  }

  setValueAtTime(value, time) {
    this.calls.push({ method: 'setValueAtTime', value, time });
    this.#record('set', value, time);
    return this;
  }

  linearRampToValueAtTime(value, time) {
    this.calls.push({ method: 'linearRampToValueAtTime', value, time });
    this.#record('linear', value, time);
    return this;
  }

  exponentialRampToValueAtTime(value, time) {
    this.calls.push({ method: 'exponentialRampToValueAtTime', value, time });
    this.#record('exponential', value, time);
    return this;
  }

  setTargetAtTime(value, time) {
    this.calls.push({ method: 'setTargetAtTime', value, time });
    this.#record('set', value, time);
    return this;
  }

  cancelScheduledValues(time) {
    this.calls.push({ method: 'cancelScheduledValues', time });
    this.events = this.events.filter((event) => event.time < time);
    return this;
  }

  cancelAndHoldAtTime(time) {
    this.calls.push({ method: 'cancelAndHoldAtTime', time });
    const held = this.computeAt(time);
    this.events = this.events.filter((event) => event.time < time);
    this.#record('set', held, time);
    return this;
  }

  /** Wert der Automationskurve zum Zeitpunkt `time` (Sekunden). */
  computeAt(time) {
    let value = this.baseValue;
    let anchorTime = 0;
    let anchorValue = this.baseValue;

    for (const event of this.events) {
      if (event.type === 'set') {
        if (event.time > time) break;
        value = event.value;
        anchorValue = event.value;
        anchorTime = event.time;
        continue;
      }
      if (time >= event.time) {
        value = event.value;
        anchorValue = event.value;
        anchorTime = event.time;
        continue;
      }
      if (time <= anchorTime) return anchorValue;
      const span = event.time - anchorTime;
      if (span <= 0) return event.value;
      const ratio = (time - anchorTime) / span;
      if (event.type === 'exponential' && anchorValue > 0 && event.value > 0) {
        return anchorValue * Math.pow(event.value / anchorValue, ratio);
      }
      return anchorValue + (event.value - anchorValue) * ratio;
    }
    return value;
  }

  /** Letzter eingeplanter Zielwert (für Klemmen- und Trimprüfungen). */
  lastScheduledValue() {
    for (let index = this.events.length - 1; index >= 0; index -= 1) {
      return this.events[index].value;
    }
    return this.baseValue;
  }

  eventsOf(method) {
    return this.calls.filter((call) => call.method === method);
  }
}

class FakeNode {
  constructor(context, kind) {
    this.context = context;
    this.kind = kind;
    this.outputs = [];
    this.disconnected = false;
    this.disconnectCalls = 0;
  }

  connect(target, outputIndex = 0) {
    this.outputs.push({ target, outputIndex });
    return target;
  }

  disconnect() {
    this.disconnected = true;
    this.disconnectCalls += 1;
    // Die Verdrahtung bleibt als Aufzeichnung erhalten, damit E18 die
    // Hüllkurve nach stop() noch rendern kann; disconnectCalls belegt das
    // Aufräumen (E9, E15).
  }
}

class FakeOscillator extends FakeNode {
  constructor(context) {
    super(context, 'oscillator');
    this.type = 'sine';
    this.frequency = new FakeAudioParam(context, 440);
    this.detune = new FakeAudioParam(context, 0);
    this.startTime = null;
    this.stopTime = null;
    this.startCalls = 0;
    this.stopCalls = 0;
    this.onended = null;
  }

  start(when = 0) {
    this.startCalls += 1;
    this.startTime = when;
  }

  stop(when) {
    this.stopCalls += 1;
    this.stopTime = when === undefined ? this.context.currentTime : when;
  }
}

class FakeGain extends FakeNode {
  constructor(context) {
    super(context, 'gain');
    this.gain = new FakeAudioParam(context, 1);
  }
}

class FakeStereoPanner extends FakeNode {
  constructor(context) {
    super(context, 'stereoPanner');
    this.pan = new FakeAudioParam(context, 0);
  }
}

class FakeChannelSplitter extends FakeNode {
  constructor(context, channels) {
    super(context, 'splitter');
    this.numberOfOutputs = channels;
  }
}

class FakeAnalyser extends FakeNode {
  constructor(context) {
    super(context, 'analyser');
    this.fftSize = 2048;
    this.smoothingTimeConstant = 0.8;
    this.minDecibels = -100;
    this.maxDecibels = 0;
    this.timeData = null;
    this.frequencyData = null;
  }

  getFloatTimeDomainData(target) {
    if (this.timeData && this.timeData.length === target.length) target.set(this.timeData);
    else target.fill(0);
  }

  getFloatFrequencyData(target) {
    if (this.frequencyData && this.frequencyData.length === target.length) target.set(this.frequencyData);
    else target.fill(-Infinity);
  }
}

class FakeAudioContext {
  constructor({ state = 'suspended', resumeError = null } = {}) {
    this._currentTime = 0;
    this.sampleRate = SAMPLE_RATE;
    this.state = state;
    this.resumeError = resumeError;
    this.destination = new FakeNode(this, 'destination');
    this.nodes = [];
    this.created = { oscillator: 0, gain: 0, stereoPanner: 0, analyser: 0, channelSplitter: 0 };
    this.resumeCalls = 0;
    this.closeCalls = 0;
    this.listeners = new Map();
  }

  get currentTime() {
    return this._currentTime;
  }

  advance(milliseconds) {
    this._currentTime += milliseconds / 1000;
  }

  addEventListener(type, handler) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(handler);
  }

  removeEventListener(type, handler) {
    const handlers = this.listeners.get(type);
    if (handlers) handlers.delete(handler);
  }

  dispatch(type) {
    for (const handler of this.listeners.get(type) ?? []) handler({ type });
  }

  async resume() {
    this.resumeCalls += 1;
    if (this.resumeError) throw this.resumeError;
    // Safari/iOS bleibt suspended, wenn der Nutzer-Task fehlt: hier wird
    // bewusst nur bei Erfolg auf running geschaltet.
    this.state = 'running';
    this.dispatch('statechange');
  }

  async close() {
    this.closeCalls += 1;
    this.state = 'closed';
    this.dispatch('statechange');
  }

  createOscillator() {
    const node = new FakeOscillator(this);
    this.created.oscillator += 1;
    this.nodes.push(node);
    return node;
  }

  createGain() {
    const node = new FakeGain(this);
    this.created.gain += 1;
    this.nodes.push(node);
    return node;
  }

  createStereoPanner() {
    const node = new FakeStereoPanner(this);
    this.created.stereoPanner += 1;
    this.nodes.push(node);
    return node;
  }

  createAnalyser() {
    const node = new FakeAnalyser(this);
    this.created.analyser += 1;
    this.nodes.push(node);
    return node;
  }

  createChannelSplitter(channels) {
    const node = new FakeChannelSplitter(this, channels);
    this.created.channelSplitter += 1;
    this.nodes.push(node);
    return node;
  }
}

/** Offline-Kontext: hat `startRendering`, also kein resume() (ADR §4.8). */
class FakeOfflineAudioContext extends FakeAudioContext {
  startRendering() {
    return Promise.resolve(this.render(1));
  }
}

// ------------------------------------------------------------- Signalprüfung

function waveformSample(type, phase) {
  const sine = Math.sin(phase);
  if (type === 'triangle') return (2 / Math.PI) * Math.asin(sine);
  if (type === 'square') return sine >= 0 ? 1 : -1;
  if (type === 'sawtooth') return 2 * (phase / (2 * Math.PI)) - 1;
  return sine;
}

/**
 * Rendert den aufgezeichneten Graphen samplegenau. Mono-Knoten werden wie im
 * Browser auf beide Kanäle geführt; der Panner rechnet mit Equal-Power.
 */
function renderGraph(context, seconds, sampleRate = SAMPLE_RATE) {
  const frames = Math.max(1, Math.round(seconds * sampleRate));
  const memo = new Map();

  const inputsOf = (node) =>
    context.nodes.filter((candidate) => candidate.outputs.some((output) => output.target === node));

  const sumInputs = (node) => {
    const left = new Float32Array(frames);
    const right = new Float32Array(frames);
    for (const source of inputsOf(node)) {
      const rendered = renderNode(source);
      for (let index = 0; index < frames; index += 1) {
        left[index] += rendered.left[index];
        right[index] += rendered.right[index];
      }
    }
    return { left, right };
  };

  const renderNode = (node) => {
    if (memo.has(node)) return memo.get(node);
    let result;

    if (node.kind === 'oscillator') {
      const samples = new Float32Array(frames);
      const start = node.startTime ?? 0;
      const stop = node.stopTime;
      let phase = 0;
      for (let index = 0; index < frames; index += 1) {
        const time = index / sampleRate;
        if (time < start || (stop !== null && time >= stop)) {
          samples[index] = 0;
          continue;
        }
        samples[index] = waveformSample(node.type, phase);
        const frequency = Math.max(node.frequency.computeAt(time), 0.01);
        phase += (2 * Math.PI * frequency) / sampleRate;
        if (phase > 2 * Math.PI) phase -= 2 * Math.PI;
      }
      result = { left: samples, right: samples };
    } else if (node.kind === 'gain') {
      const summed = sumInputs(node);
      for (let index = 0; index < frames; index += 1) {
        const value = node.gain.computeAt(index / sampleRate);
        summed.left[index] *= value;
        summed.right[index] *= value;
      }
      result = summed;
    } else if (node.kind === 'stereoPanner') {
      const summed = sumInputs(node);
      const left = new Float32Array(frames);
      const right = new Float32Array(frames);
      for (let index = 0; index < frames; index += 1) {
        const pan = clampValue(node.pan.computeAt(index / sampleRate), -1, 1);
        const position = (pan + 1) / 2;
        left[index] = summed.left[index] * Math.cos((position * Math.PI) / 2);
        right[index] = summed.right[index] * Math.sin((position * Math.PI) / 2);
      }
      result = { left, right };
    } else {
      result = sumInputs(node);
    }

    memo.set(node, result);
    return result;
  };

  return renderNode(context.destination);
}

/** Goertzel-Leistung: DFT bei genau einer Frequenz, ohne FFT-Bibliothek. */
function goertzelPower(samples, frequency, sampleRate = SAMPLE_RATE) {
  const omega = (2 * Math.PI * frequency) / sampleRate;
  const coefficient = 2 * Math.cos(omega);
  let previous = 0;
  let beforePrevious = 0;
  for (let index = 0; index < samples.length; index += 1) {
    const current = samples[index] + coefficient * previous - beforePrevious;
    beforePrevious = previous;
    previous = current;
  }
  return (
    (previous * previous + beforePrevious * beforePrevious - coefficient * previous * beforePrevious) /
    (samples.length * samples.length)
  );
}

function slice(samples, fromSeconds, toSeconds, sampleRate = SAMPLE_RATE) {
  return samples.subarray(Math.floor(fromSeconds * sampleRate), Math.floor(toSeconds * sampleRate));
}

function peakFrequency(samples, fromHz, toHz, stepHz = 0.25) {
  let best = { frequency: fromHz, power: -Infinity };
  for (let frequency = fromHz; frequency <= toHz; frequency += stepHz) {
    const power = goertzelPower(samples, frequency);
    if (power > best.power) best = { frequency, power };
  }
  return best.frequency;
}

function peakAmplitude(samples) {
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  return peak;
}

function envelope(samples, fromSeconds, toSeconds, bins = 10) {
  const start = Math.floor(fromSeconds * SAMPLE_RATE);
  const end = Math.min(samples.length, Math.floor(toSeconds * SAMPLE_RATE));
  const width = Math.max(1, Math.floor((end - start) / bins));
  const values = [];
  for (let index = start; index < end; index += width) {
    let peak = 0;
    for (let cursor = index; cursor < Math.min(index + width, end); cursor += 1) {
      peak = Math.max(peak, Math.abs(samples[cursor]));
    }
    values.push(peak);
  }
  return values;
}

// ------------------------------------------------------------------- Helfer

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
const dbToAmplitude = (db) => Math.pow(10, db / 20);

function gainNodes(context) {
  return context.nodes.filter((node) => node.kind === 'gain');
}

function masterGainNode(context) {
  return gainNodes(context).find((node) => node.outputs.some((output) => output.target === context.destination));
}

function voiceGainNodes(context) {
  // Stimmen-Gains hängen direkt hinter einem Oszillator; mixBus und
  // masterGain sind ebenfalls GainNodes und dürfen nicht mitzählen.
  const oscillators = oscillatorNodes(context);
  return gainNodes(context).filter((node) =>
    oscillators.some((oscillator) => oscillator.outputs.some((output) => output.target === node))
  );
}

function oscillatorNodes(context) {
  return context.nodes.filter((node) => node.kind === 'oscillator');
}

function createHarness({ context, engineOptions = {}, contextOptions = {} } = {}) {
  const fakeContext = context ?? new FakeAudioContext(contextOptions);
  const engine = engineModule.createFrequencyEngine({
    audioContextFactory: () => fakeContext,
    now: () => 1234.5,
    ...engineOptions,
  });
  return { engine, context: fakeContext };
}

function isEngineError(code) {
  return (error) => {
    assert.ok(error instanceof engineModule.FrequencyEngineError, `expected FrequencyEngineError, got ${error}`);
    assert.equal(error.code, code);
    return true;
  };
}

// -------------------------------------------------------------------- Tests

test('E1 — Import und Konstruktion erzeugen keinen AudioContext', () => {
  let factoryCalls = 0;
  const engine = engineModule.createFrequencyEngine({
    audioContextFactory: () => {
      factoryCalls += 1;
      return new FakeAudioContext();
    },
  });

  assert.equal(factoryCalls, 0);
  assert.equal(engine.state.status, 'idle');
  assert.equal(engine.state.contextState, 'none');
  assert.equal(engine.state.freqHz, 440);
  assert.equal(engine.state.waveform, 'sine');
  assert.equal(engine.state.gainDb, -20);
  assert.equal(engine.state.revision, 0);
  assert.equal(typeof engine.play, 'function');
  assert.equal(engine.isSupported(), true);
  assert.equal(factoryCalls, 0, 'isSupported() darf die Factory nicht aufrufen');
});

test('E2 — play(440) startet einen Oszillator mit 20-ms-Einblendung', async () => {
  const { engine, context } = createHarness();
  await engine.play(440);

  assert.equal(context.created.oscillator, 1);
  const oscillator = oscillatorNodes(context)[0];
  assert.equal(oscillator.type, 'sine');
  assert.equal(oscillator.frequency.value, 440);
  assert.equal(oscillator.startCalls, 1);

  assert.equal(engine.state.status, 'running');
  assert.equal(engine.state.mode, 'tone');
  assert.equal(engine.state.freqHz, 440);
  assert.deepEqual([...engine.state.frequenciesHz], [440]);

  const master = masterGainNode(context);
  const jump = master.gain.eventsOf('setValueAtTime').find((call) => call.value === 0);
  const ramp = master.gain.eventsOf('linearRampToValueAtTime')[0];
  assert.ok(jump, 'Einblendung beginnt bei 0');
  assert.equal(jump.time, 0);
  assert.ok(Math.abs(ramp.value - dbToAmplitude(-20)) < 1e-12, 'Ziel ist 10^(-20/20)');
  assert.ok(Math.abs(ramp.time - 0.02) < 1e-12, 'Einblendung dauert 20 ms');
});

test('E3 — play(5) und play(25000) klemmen auf 20 bzw. 20000 Hz', async () => {
  const { engine, context } = createHarness();

  await engine.play(5);
  context.advance(40); // Rampe abschließen, damit der gehörte Wert gilt
  assert.equal(engine.state.freqHz, 20);
  assert.equal(oscillatorNodes(context)[0].frequency.value, 20);

  await engine.play(25000);
  context.advance(40);
  assert.equal(engine.state.freqHz, 20000);
  assert.equal(context.created.oscillator, 1, 'gleicher Modus und gleiche Stimmenzahl: Umstimmen statt Neubau');
  assert.equal(oscillatorNodes(context)[0].frequency.value, 20000);
});

test('E4 — play(NaN) und play(0) werden mit invalid_frequency abgelehnt', async () => {
  const { engine, context } = createHarness();

  await assert.rejects(engine.play(NaN), isEngineError('invalid_frequency'));
  await assert.rejects(engine.play(0), isEngineError('invalid_frequency'));
  await assert.rejects(engine.play(Infinity), isEngineError('invalid_frequency'));
  await assert.rejects(engine.play(-40), isEngineError('invalid_frequency'));

  assert.equal(context.created.oscillator, 0);
  assert.equal(engine.state.status, 'idle');
});

test('E5 — setGain(10) klemmt auf den harten Deckel −6 dBFS', async () => {
  const { engine, context } = createHarness();
  await engine.play(440);
  engine.setGain(10);

  assert.equal(engine.state.gainDb, -6);
  const peak = masterGainNode(context).gain.lastScheduledValue();
  assert.ok(Math.abs(peak - dbToAmplitude(-6)) < 1e-12, `Deckel liegt bei ${dbToAmplitude(-6)}`);
  assert.ok(peak <= 0.5012, 'kein Clipping durch Konstruktion');
});

test('E6 — setGain(-100) klemmt auf −60 dBFS', () => {
  const { engine } = createHarness();
  engine.setGain(-100);
  assert.equal(engine.state.gainDb, -60);
});

test('E7 — setWaveform("square") setzt Typ und −6-dB-Trim der Stimme', async () => {
  const { engine, context } = createHarness();
  await engine.play(440);
  engine.setWaveform('square');

  assert.equal(engine.state.waveform, 'square');
  assert.equal(oscillatorNodes(context)[0].type, 'square');
  const level = voiceGainNodes(context)[0].gain.lastScheduledValue();
  assert.ok(Math.abs(level - dbToAmplitude(-6)) < 1e-12, 'Sägezahn/Rechteck werden um 6 dB abgesenkt');
});

test('E8 — sweep(200, 800, 2) plant eine exponentielle Rampe über 2 s', async () => {
  const { engine, context } = createHarness();
  const pending = engine.sweep(200, 800, 2);

  await flush();
  const oscillator = oscillatorNodes(context)[0];
  const ramp = oscillator.frequency.eventsOf('exponentialRampToValueAtTime').at(-1);
  assert.ok(ramp, 'exponentielle Rampe ist eingeplant');
  assert.equal(ramp.value, 800);
  assert.equal(ramp.time, 2, 'Zielzeit ist Start + Sekunden');
  assert.equal(engine.state.status, 'running');
  assert.equal(engine.state.sweep.curve, 'exponential');
  assert.equal(engine.state.sweep.startedAtMs, 1234.5, 'Zeitbasis kommt aus der injizierten Uhr');

  engine.cancelSweep();
  const cancelled = await pending;
  assert.equal(cancelled.completed, false);

  // Kurzer Sweep bis zum Ende: Promise löst mit completed = true.
  const finished = await engine.sweep(200, 800, 0.1);
  assert.equal(finished.completed, true);
  assert.equal(finished.endedAtHz, 800);
  assert.equal(engine.state.freqHz, 800);
  assert.equal(engine.state.sweep, null);
});

test('E9 — stop() während eines Sweeps bricht ab, räumt auf und wird idle', async () => {
  const { engine, context } = createHarness();
  const pending = engine.sweep(200, 400, 5);
  await flush();

  await engine.stop({ fadeOutMs: 0 });
  const result = await pending;

  assert.equal(result.completed, false);
  assert.equal(engine.state.status, 'idle');
  assert.equal(engine.state.sweep, null);
  const oscillator = oscillatorNodes(context)[0];
  assert.equal(oscillator.stopCalls, 1, 'Oszillator wird gestoppt');
  assert.ok(oscillator.disconnected, 'Oszillator wird getrennt');
  assert.ok(oscillator.disconnectCalls >= 1);
});

test('E10 — stop() ist idempotent', async () => {
  const { engine } = createHarness();
  await engine.play(440);
  await engine.stop({ fadeOutMs: 0 });
  await engine.stop({ fadeOutMs: 0 });
  assert.equal(engine.state.status, 'idle');
  assert.equal(engine.state.freqHz, 440, 'Parameter bleiben nach dem Stoppen erhalten');
});

test('E11 — playBinaural(200, 8) erzeugt 200/208 Hz mit harten Pannern', async () => {
  const { engine, context } = createHarness();
  await engine.playBinaural({ carrierHz: 200, deltaHz: 8 });

  const oscillators = oscillatorNodes(context);
  assert.equal(oscillators.length, 2);
  assert.equal(oscillators[0].frequency.value, 200);
  assert.equal(oscillators[1].frequency.value, 208);

  const panners = context.nodes.filter((node) => node.kind === 'stereoPanner');
  assert.equal(panners.length, 2);
  assert.equal(panners[0].pan.value, -1);
  assert.equal(panners[1].pan.value, 1);

  for (const gain of voiceGainNodes(context)) {
    assert.ok(Math.abs(gain.gain.lastScheduledValue() - 0.5) < 1e-12, 'Voice-Gain je 1/2');
  }
  assert.equal(engine.state.mode, 'binaural');
  assert.deepEqual([...engine.state.frequenciesHz], [200, 208]);
  assert.deepEqual({ ...engine.state.binaural }, { carrierHz: 200, deltaHz: 8, leftHz: 200, rightHz: 208 });
});

test('E12 — setBeatDelta im Ton-Modus wirft invalid_state', async () => {
  const { engine } = createHarness();
  await engine.play(440);
  assert.throws(() => engine.setBeatDelta(12), isEngineError('invalid_state'));
});

test('E13 — blockierter Kontext ergibt context_blocked, Status error, keine Oszillatoren', async () => {
  const blocked = new Error('The request is not allowed by the user agent.');
  blocked.name = 'NotAllowedError';
  const { engine, context } = createHarness({ contextOptions: { resumeError: blocked } });

  await assert.rejects(engine.play(440), isEngineError('context_blocked'));
  assert.equal(engine.state.status, 'error');
  assert.equal(engine.state.lastError.code, 'context_blocked');
  assert.equal(engine.state.lastError.recoverable, true);
  assert.equal(context.created.oscillator, 0);

  // Ein erneuter Versuch nach Nutzerinteraktion ist erlaubt.
  context.resumeError = null;
  await engine.play(440);
  assert.equal(engine.state.status, 'running');
  assert.equal(engine.state.lastError, null);
});

test('E14 — fehlende Web-Audio-API lehnt mit unsupported ab', async () => {
  let factoryCalls = 0;
  const engine = engineModule.createFrequencyEngine({
    audioContextFactory: () => {
      factoryCalls += 1;
      return null;
    },
  });

  await assert.rejects(engine.play(440), isEngineError('unsupported'));
  assert.equal(engine.state.status, 'unsupported');
  assert.equal(engine.state.lastError.recoverable, false);
  assert.equal(engine.isSupported(), false);
  assert.equal(factoryCalls, 1);

  // `unsupported` ist endgültig: kein zweiter Erzeugungsversuch (ADR §4.5).
  await assert.rejects(engine.play(440), isEngineError('unsupported'));
  assert.equal(factoryCalls, 1);
  assert.equal(engine.state.status, 'unsupported');
});

test('E15 — dispose() schließt den Kontext, leert Listener und sperrt play()', async () => {
  const { engine, context } = createHarness();
  await engine.play(440);

  let calls = 0;
  engine.subscribe(() => {
    calls += 1;
  });

  await engine.dispose();
  assert.equal(context.closeCalls, 1);
  assert.equal(context.state, 'closed');
  assert.equal(engine.state.status, 'disposed');
  assert.equal(engine.state.contextState, 'closed');

  const callsAfterDispose = calls;
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(calls, callsAfterDispose, 'Listener sind geleert');

  await assert.rejects(engine.play(440), isEngineError('context_closed'));
  assert.equal(engine.state.status, 'disposed');
});

test('E16 — subscribe/onstatechange: Reihenfolge, revision +1, Abmelden wirkt', async () => {
  const { engine } = createHarness();
  const order = [];
  const revisions = [];

  const unsubscribe = engine.subscribe((state) => {
    order.push('listener-a');
    revisions.push(state.revision);
  });
  engine.subscribe(() => order.push('listener-b'));
  engine.onstatechange = () => order.push('handler');

  await engine.play(440);

  const firstEmission = order.slice(0, 3);
  assert.deepEqual(firstEmission, ['listener-a', 'listener-b', 'handler'], 'Handler kommt nach den Listenern');
  for (let index = 1; index < revisions.length; index += 1) {
    assert.equal(revisions[index], revisions[index - 1] + 1, 'revision steigt je Emission um genau 1');
  }

  unsubscribe();
  unsubscribe(); // idempotent
  const before = order.length;
  engine.setGain(-30);
  assert.deepEqual(order.slice(before), ['listener-b', 'handler'], 'abgemeldeter Listener wird nicht mehr gerufen');

  // Eine Listener-Ausnahme darf die übrigen Listener nicht abbrechen.
  engine.subscribe(() => {
    throw new Error('boom');
  });
  const errors = [];
  const originalError = console.error;
  console.error = (...args) => errors.push(args);
  try {
    engine.setGain(-40);
  } finally {
    console.error = originalError;
  }
  assert.equal(errors.length, 1);
  assert.equal(order.at(-1), 'handler');
});

test('E17 — Analysator liefert im Idle Nullen bzw. −Infinity', () => {
  const { engine } = createHarness();

  const time = engine.getAnalyserData();
  assert.ok(time instanceof Float32Array);
  assert.equal(time.length, 2048);
  assert.ok(time.every((sample) => sample === 0));

  const spectrum = engine.getSpectrumData();
  assert.equal(spectrum.length, 1024);
  assert.ok(spectrum.every((value) => value === -Infinity));

  const target = new Float32Array(2048);
  assert.equal(engine.getAnalyserData('left', target), target, 'passendes Ziel wird verwendet');
  const wrong = new Float32Array(16);
  assert.notEqual(engine.getAnalyserData('mix', wrong), wrong, 'falsche Länge fällt auf den internen Puffer zurück');
  assert.throws(() => engine.getAnalyserData('mono'), isEngineError('invalid_argument'));
});

test('E18 — Offline-Render 440 Hz: FFT-Peak, Pegel ≤ 0,501 und monotone Flanken', async () => {
  const context = new FakeOfflineAudioContext();
  const engine = engineModule.createFrequencyEngine({ audioContextFactory: () => context });

  await engine.play(440);
  context.advance(800);
  const stopping = engine.stop({ fadeOutMs: 20 });
  await flush(); // Rampe ist eingeplant, der Fake-Timer läuft noch
  context.advance(20);
  await stopping;

  const rendered = renderGraph(context, 1);
  const samples = rendered.left;

  assert.ok(samples.length === SAMPLE_RATE, '1 s bei 48 kHz');
  const steady = slice(samples, 0.1, 0.7);
  const frequency = peakFrequency(steady, 430, 450);
  assert.ok(Math.abs(frequency - 440) <= 1, `FFT-Peak bei ${frequency} Hz statt 440 Hz`);

  const peak = peakAmplitude(samples);
  assert.ok(peak <= 0.5012, `Spitzenamplitude ${peak} überschreitet den Deckel`);
  assert.ok(Math.abs(peak - dbToAmplitude(-20)) < 0.005, 'Startpegel ist −20 dBFS');

  const fadeIn = envelope(samples, 0, 0.02);
  for (let index = 1; index < fadeIn.length; index += 1) {
    assert.ok(fadeIn[index] >= fadeIn[index - 1] - 1e-3, 'Einblendung ist monoton steigend');
  }
  const fadeOut = envelope(samples, 0.8, 0.82);
  for (let index = 1; index < fadeOut.length; index += 1) {
    assert.ok(fadeOut[index] <= fadeOut[index - 1] + 1e-3, 'Ausblendung ist monoton fallend');
  }
  assert.ok(peakAmplitude(slice(samples, 0.83, 1)) === 0, 'nach dem Ausblenden bleibt Stille');
});

test('E19 — playTones([440, 444]) erzeugt zwei Stimmen mit Voice-Gain 1/2', async () => {
  const { engine, context } = createHarness();
  await engine.playTones([440, 444], { gainDb: 0 });

  const oscillators = oscillatorNodes(context);
  assert.equal(oscillators.length, 2);
  assert.deepEqual([...engine.state.frequenciesHz], [440, 444]);
  assert.equal(engine.state.mode, 'tone');
  for (const gain of voiceGainNodes(context)) {
    assert.ok(Math.abs(gain.gain.lastScheduledValue() - 0.5) < 1e-12);
  }

  // Pegel-Invariante: 0,501 × (1/2 + 1/2) bleibt unter dem Deckel.
  const rendered = renderGraph(context, 0.5);
  const peak = peakAmplitude(rendered.left);
  assert.ok(peak <= 0.5012, `Summenamplitude ${peak} überschreitet −6 dBFS`);
});

test('E20 — leere Liste und mehr als vier Stimmen werden mit invalid_argument abgelehnt', async () => {
  const { engine, context } = createHarness();

  await assert.rejects(engine.playTones([]), isEngineError('invalid_argument'));
  await assert.rejects(engine.playTones([100, 200, 300, 400, 500]), isEngineError('invalid_argument'));
  assert.equal(context.created.oscillator, 0);
  assert.equal(engine.state.status, 'idle');
});

test('Zusatz — Zustand ist unveränderlich und Analysekanäle sind getrennt', async () => {
  const { engine, context } = createHarness();
  const before = engine.state;
  await engine.play(440);

  assert.notEqual(engine.state, before, 'jede Änderung ersetzt den Schnappschuss');
  assert.ok(Object.isFrozen(engine.state));
  assert.ok(Object.isFrozen(engine.state.frequenciesHz));
  assert.throws(() => {
    engine.state.gainDb = 0;
  }, TypeError);
  assert.equal(engine.state.gainDb, -20, 'Zustand lässt sich nicht mutieren');

  const analysers = context.nodes.filter((node) => node.kind === 'analyser');
  assert.equal(analysers.length, 3, 'mix, left und right');
  const payload = new Float32Array(2048).fill(0.25);
  analysers[0].timeData = payload;
  const time = engine.getAnalyserData('mix');
  assert.equal(time[0], 0.25);

  const spectrum = new Float32Array(1024).fill(-42);
  analysers[0].frequencyData = spectrum;
  assert.equal(engine.getSpectrumData('mix')[0], -42);
});
