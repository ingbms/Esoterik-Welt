// Frequenzlabor — Audio-Engine.
//
// Verbindlicher Vertrag: docs/adr-frequenzlabor.md §4 (Prosa und Zahlen) und
// js/modules/frequenz-engine.d.ts (Typen). Beide Stellen und diese Datei werden
// nur gemeinsam geändert.
//
// Dieses Modul kennt weder DOM noch Frequenzdaten noch UI-Texte: es nimmt
// Hertz-Zahlen und Optionen entgegen und gibt einen unveränderlichen Zustand
// heraus. `message` ist ein technischer englischer Text für Logs; die deutschen
// UI-Texte leben im Controller (ADR §4.7).
//
// Autoplay-Invariante (NFR-12, ADR §4.4): Ein AudioContext entsteht
// ausschließlich in play()/playTones()/playBinaural() — und dort synchron, vor
// dem ersten await, damit er im Nutzer-Task liegt. Setter und isSupported()
// erzeugen nie einen Kontext und sind deshalb auch ohne Nutzerinteraktion
// gefahrlos aufrufbar.

/** Normative Zahlenwerte, ADR §4.2. */
export const FREQUENCY_LIMITS = Object.freeze({
  minHz: 20,
  maxHz: 20000,
  defaultHz: 440,
  minGainDb: -60,
  defaultGainDb: -20,
  hardCapGainDb: -6,
  fadeMs: 20,
  rampMs: 25,
  maxVoices: 4,
  fftSize: 2048,
  analyserSmoothing: 0.8,
  minSweepSeconds: 0.1,
  maxSweepSeconds: 60,
  minBinauralDeltaHz: 0.1,
  maxBinauralDeltaHz: 100,
});

/**
 * Pegelabsenkung je Wellenform in dB (ADR §4.2): Rechteck und Sägezahn haben
 * bei gleichem Spitzenwert mehr Effektivleistung und Harmonische.
 */
export const WAVEFORM_TRIM_DB = Object.freeze({
  sine: 0,
  triangle: 0,
  square: -6,
  sawtooth: -6,
});

const LIMITS = FREQUENCY_LIMITS;
const WAVEFORMS = new Set(Object.keys(WAVEFORM_TRIM_DB));
const ANALYSER_CHANNELS = new Set(['mix', 'left', 'right']);

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const dbToAmplitude = (db) => Math.pow(10, db / 20);

/** Stabile Fehlerklasse für synchrone Setter und abgelehnte Promises. */
export class FrequencyEngineError extends Error {
  constructor(code, message, recoverable = true) {
    super(message);
    this.name = 'FrequencyEngineError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * Browser-Ausnahmen werden nach ADR §4.7 klassifiziert. Nur der Code wandert
 * in den Zustand, nie der Originaltext.
 */
function classifyBrowserError(error) {
  const name = error && typeof error.name === 'string' ? error.name : '';
  if (name === 'NotAllowedError') return 'context_blocked';
  if (name === 'InvalidStateError') return 'context_closed';
  if (name === 'NotSupportedError') return 'unsupported';
  return 'internal';
}

function errorInfo(code, message, recoverable) {
  return Object.freeze({ code, message, recoverable });
}

/** Modulweite Support-Prüfung ohne Seiteneffekte (erzeugt keinen Kontext). */
export function isWebAudioSupported() {
  if (typeof window === 'undefined') return false;
  const Ctor = window.AudioContext || window.webkitAudioContext;
  return typeof Ctor === 'function';
}

function initialState() {
  return Object.freeze({
    status: 'idle',
    mode: null,
    freqHz: LIMITS.defaultHz,
    frequenciesHz: Object.freeze([]),
    waveform: 'sine',
    gainDb: LIMITS.defaultGainDb,
    binaural: null,
    sweep: null,
    contextState: 'none',
    lastError: null,
    revision: 0,
  });
}

class FrequencyEngineImpl {
  #options;
  #now;
  #state;
  #listeners = new Set();
  /** FIFO-Kette für play/stop/sweep/dispose (ADR §4.4, Serialisierung). */
  #queue = Promise.resolve();

  #context = null;
  #offline = false;
  #supported = null;
  #resumePromise = null;
  #onContextStateChange = null;

  #mixBus = null;
  #masterGain = null;
  #analysers = null;

  /** Aktive Stimmen: { osc, gain, panner }. */
  #voices = [];
  #sweep = null;
  /** Puffer für Analysatorabfragen ohne AudioContext (Vertrag §4.1). */
  #silence = { time: {}, spectrum: {} };

  constructor(options = {}) {
    this.#options = options && typeof options === 'object' ? options : {};
    this.#now =
      typeof this.#options.now === 'function'
        ? this.#options.now
        : () => (typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now());
    this.#state = initialState();
  }

  get state() {
    return this.#state;
  }

  onstatechange = null;

  // ---------------------------------------------------------------- Zustand

  #emit(patch) {
    const next = Object.freeze({
      ...this.#state,
      ...patch,
      revision: this.#state.revision + 1,
    });
    this.#state = next;
    for (const listener of [...this.#listeners]) {
      try {
        listener(next);
      } catch (error) {
        // Eine Ausnahme darf die übrigen Listener nicht abbrechen (ADR §4.5).
        console.error('[frequenz-engine] state listener failed', error);
      }
    }
    if (typeof this.onstatechange === 'function') {
      try {
        this.onstatechange(next);
      } catch (error) {
        console.error('[frequenz-engine] onstatechange failed', error);
      }
    }
  }

  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new FrequencyEngineError('invalid_argument', 'listener must be a function.');
    }
    this.#listeners.add(listener);
    let active = true;
    return () => {
      if (!active) return;
      active = false;
      this.#listeners.delete(listener);
    };
  }

  #enqueue(task) {
    const run = this.#queue.then(task, task);
    // Die Kette überlebt Ablehnungen; der Aufrufer bekommt das Original-Promise.
    this.#queue = run.then(
      () => undefined,
      () => undefined
    );
    return run;
  }

  #wait(milliseconds) {
    if (!(milliseconds > 0)) return Promise.resolve();
    return new Promise((resolve) => setTimeout(resolve, milliseconds));
  }

  #assertUsable() {
    if (this.#state.status === 'disposed') {
      throw new FrequencyEngineError('context_closed', 'The engine has been disposed.', false);
    }
  }

  // ------------------------------------------------------------- Validierung
  //
  // Endliche Zahlen außerhalb des Bereichs werden geklemmt (ADR §4.2);
  // abgelehnt werden nur Nicht-Endliches, falsche Typen, unbekannte
  // Enum-Werte und Frequenzen ≤ 0.

  #readFrequency(value, label) {
    if (typeof value !== 'number') {
      throw new FrequencyEngineError('invalid_argument', `${label} must be a number.`);
    }
    if (!Number.isFinite(value)) {
      throw new FrequencyEngineError('invalid_frequency', `${label} must be a finite number.`);
    }
    if (value <= 0) {
      throw new FrequencyEngineError('invalid_frequency', `${label} must be greater than 0 Hz.`);
    }
    return clamp(value, LIMITS.minHz, LIMITS.maxHz);
  }

  #readGain(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new FrequencyEngineError('invalid_argument', 'gainDb must be a finite number.');
    }
    return clamp(value, LIMITS.minGainDb, LIMITS.hardCapGainDb);
  }

  #readWaveform(value) {
    if (typeof value !== 'string' || !WAVEFORMS.has(value)) {
      throw new FrequencyEngineError('invalid_argument', `Unknown waveform: ${String(value)}.`);
    }
    return value;
  }

  #readCurve(value) {
    if (value !== 'linear' && value !== 'exponential') {
      throw new FrequencyEngineError('invalid_argument', `Unknown sweep curve: ${String(value)}.`);
    }
    return value;
  }

  #readDelta(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new FrequencyEngineError('invalid_argument', 'deltaHz must be a finite number.');
    }
    return clamp(value, LIMITS.minBinauralDeltaHz, LIMITS.maxBinauralDeltaHz);
  }

  #readSweepSeconds(value) {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new FrequencyEngineError('invalid_argument', 'seconds must be a finite number.');
    }
    return clamp(value, LIMITS.minSweepSeconds, LIMITS.maxSweepSeconds);
  }

  #readDuration(value, fallback) {
    if (value === undefined) return fallback;
    if (typeof value !== 'number' || !Number.isFinite(value)) {
      throw new FrequencyEngineError('invalid_argument', 'Durations must be finite milliseconds.');
    }
    return clamp(value, 0, 1000);
  }

  #readChannel(value) {
    if (value === undefined) return 'mix';
    if (typeof value !== 'string' || !ANALYSER_CHANNELS.has(value)) {
      throw new FrequencyEngineError('invalid_argument', `Unknown analyser channel: ${String(value)}.`);
    }
    return value;
  }

  // --------------------------------------------------------------- Kontext

  isSupported() {
    if (this.#supported === false) return false;
    // Eine injizierte Factory gilt als Unterstützung: die Prüfung darf sie
    // nicht aufrufen, weil das einen Kontext erzeugen würde.
    if (typeof this.#options.audioContextFactory === 'function') return true;
    const supported = isWebAudioSupported();
    if (!supported) this.#supported = false;
    return supported;
  }

  #readContextState() {
    if (!this.#context) return 'none';
    const state = this.#context.state;
    return state === 'suspended' || state === 'running' || state === 'closed' ? state : 'none';
  }

  #syncContextState() {
    const contextState = this.#readContextState();
    if (contextState !== this.#state.contextState) this.#emit({ contextState });
  }

  /**
   * Erzeugt Kontext und Graph, falls nötig. Wird ausschließlich aus den
   * Startpfaden aufgerufen und läuft dort synchron im Nutzer-Task.
   */
  #ensureContext() {
    if (this.#context) return this.#context;
    // Status `unsupported` ist endgültig: kein zweiter Factory-Versuch
    // (ADR §4.5), also auch kein erneutes Erzeugen.
    if (this.#supported === false) {
      throw new FrequencyEngineError('unsupported', 'Web Audio API is not available in this environment.', false);
    }
    let context = null;
    if (typeof this.#options.audioContextFactory === 'function') {
      context = this.#options.audioContextFactory();
    } else if (typeof window !== 'undefined') {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      context = typeof Ctor === 'function' ? new Ctor() : null;
    }
    if (!context || typeof context.createOscillator !== 'function') {
      this.#supported = false;
      const info = errorInfo('unsupported', 'Web Audio API is not available in this environment.', false);
      this.#emit({ status: 'unsupported', lastError: info, contextState: 'none' });
      throw new FrequencyEngineError(info.code, info.message, info.recoverable);
    }
    this.#context = context;
    // Ein OfflineAudioContext trägt startRendering; er wird nicht fortgesetzt
    // und nicht in Echtzeit erwartet (ADR §4.8).
    this.#offline = typeof context.startRendering === 'function';

    const mixBus = context.createGain();
    mixBus.gain.value = 1;
    // Zweikanalig, damit die Analysatoren "left"/"right" auch im Ton-Modus
    // ein sinnvolles Signal sehen (Mono-Quellen werden hochgemischt).
    mixBus.channelCount = 2;
    mixBus.channelCountMode = 'explicit';
    mixBus.channelInterpretation = 'speakers';

    const masterGain = context.createGain();
    masterGain.gain.value = 0;
    mixBus.connect(masterGain);
    masterGain.connect(context.destination);

    this.#mixBus = mixBus;
    this.#masterGain = masterGain;
    this.#analysers = this.#createAnalysers(context, masterGain);

    if (!this.#offline && typeof context.addEventListener === 'function') {
      this.#onContextStateChange = () => this.#syncContextState();
      context.addEventListener('statechange', this.#onContextStateChange);
    }
    this.#syncContextState();
    return context;
  }

  #createAnalysers(context, masterGain) {
    const make = () => {
      const node = context.createAnalyser();
      node.fftSize = LIMITS.fftSize;
      node.smoothingTimeConstant = LIMITS.analyserSmoothing;
      node.minDecibels = -100;
      node.maxDecibels = 0;
      return node;
    };
    const mix = make();
    masterGain.connect(mix);

    const splitter = context.createChannelSplitter(2);
    masterGain.connect(splitter);
    const left = make();
    const right = make();
    splitter.connect(left, 0);
    splitter.connect(right, 1);

    const timeBuffers = {};
    const spectrumBuffers = {};
    for (const channel of ANALYSER_CHANNELS) {
      timeBuffers[channel] = new Float32Array(LIMITS.fftSize);
      spectrumBuffers[channel] = new Float32Array(LIMITS.fftSize / 2);
    }
    return { mix, left, right, timeBuffers, spectrumBuffers };
  }

  /**
   * Startet resume() synchron im Nutzer-Task. Der Fehler wird erst in der
   * Warteschlange ausgewertet, damit `play()` nicht still scheitert.
   */
  #requestContextStart() {
    const context = this.#ensureContext();
    if (context.state === 'closed') {
      const info = errorInfo('context_closed', 'The audio context is closed.', false);
      this.#emit({ status: 'error', lastError: info, contextState: 'closed' });
      throw new FrequencyEngineError(info.code, info.message, info.recoverable);
    }
    if (this.#offline) {
      this.#resumePromise = null;
      return context;
    }
    if (context.state === 'suspended') {
      let promise;
      try {
        promise = Promise.resolve(context.resume());
      } catch (error) {
        promise = Promise.reject(error);
      }
      // Vorab abgefangen, damit zwischen Start und Auswertung keine
      // unbehandelte Rejection entsteht; ausgewertet wird sie weiter unten.
      promise.catch(() => {});
      this.#resumePromise = promise;
    } else {
      this.#resumePromise = null;
    }
    return context;
  }

  /** Wartet auf einen laufenden Kontext; wirft sonst den klassifizierten Fehler. */
  async #awaitRunning() {
    const context = this.#context;
    if (!context) throw new FrequencyEngineError('internal', 'No audio context.', true);
    if (this.#offline) return;
    if (this.#resumePromise) {
      try {
        await this.#resumePromise;
      } catch (error) {
        const code = classifyBrowserError(error);
        throw new FrequencyEngineError(
          code === 'internal' ? 'context_blocked' : code,
          'Audio output could not be started.',
          code !== 'context_closed' && code !== 'unsupported'
        );
      } finally {
        this.#resumePromise = null;
      }
    }
    if (context.state === 'closed') {
      throw new FrequencyEngineError('context_closed', 'The audio context is closed.', false);
    }
    // Safari/iOS kann nach dem Resume suspended bleiben: das ist ein Fehler,
    // kein stiller Erfolg (ADR §4.4).
    if (context.state !== 'running') {
      throw new FrequencyEngineError('context_blocked', 'Audio output is blocked by the browser.', true);
    }
  }

  // ---------------------------------------------------------- Audio-Helfer

  /** Hält den aktuellen Automationswert an, statt ihn springen zu lassen. */
  #hold(param, time) {
    if (typeof param.cancelAndHoldAtTime === 'function') {
      param.cancelAndHoldAtTime(time);
      return;
    }
    const current = param.value;
    if (typeof param.cancelScheduledValues === 'function') param.cancelScheduledValues(time);
    param.setValueAtTime(current, time);
  }

  #fadeIn(gainDb, fadeMs) {
    const context = this.#context;
    if (!context || !this.#masterGain) return;
    const now = context.currentTime;
    const param = this.#masterGain.gain;
    if (typeof param.cancelScheduledValues === 'function') param.cancelScheduledValues(now);
    param.setValueAtTime(0, now);
    const target = dbToAmplitude(gainDb);
    if (fadeMs > 0) param.linearRampToValueAtTime(target, now + fadeMs / 1000);
    else param.setValueAtTime(target, now);
  }

  #rampMaster(gainDb) {
    const context = this.#context;
    if (!context || !this.#masterGain) return;
    const now = context.currentTime;
    const param = this.#masterGain.gain;
    this.#hold(param, now);
    param.linearRampToValueAtTime(dbToAmplitude(gainDb), now + LIMITS.rampMs / 1000);
  }

  #createVoices(specs, waveform) {
    const context = this.#context;
    const count = specs.length;
    const level = dbToAmplitude(WAVEFORM_TRIM_DB[waveform]) / count;
    const now = context.currentTime;
    return specs.map((spec) => {
      const osc = context.createOscillator();
      osc.type = waveform;
      osc.frequency.setValueAtTime(spec.freq, now);

      const gain = context.createGain();
      gain.gain.setValueAtTime(level, now);
      osc.connect(gain);

      let panner = null;
      if (spec.pan === -1 || spec.pan === 1) {
        panner = context.createStereoPanner();
        panner.pan.setValueAtTime(spec.pan, now);
        gain.connect(panner);
        panner.connect(this.#mixBus);
      } else {
        gain.connect(this.#mixBus);
      }

      osc.start(now);
      return { osc, gain, panner };
    });
  }

  #disconnectNodes(voice) {
    // stop() vor disconnect(): ein getrennter, aber laufender Oszillator würde
    // weiter Rechenzeit verbrauchen (Leak) und beim erneuten Verbinden wieder
    // hörbar werden.
    if (voice.osc && typeof voice.osc.stop === 'function') {
      try {
        voice.osc.stop();
      } catch (error) {
        // Ein bereits gestoppter Oszillator ist kein Fehlerfall.
      }
    }
    for (const node of [voice.osc, voice.gain, voice.panner]) {
      if (node && typeof node.disconnect === 'function') {
        try {
          node.disconnect();
        } catch (error) {
          // Bereits getrennte Knoten dürfen kein zweites Aufräumen verhindern.
        }
      }
    }
  }

  /** Blendet Stimmen aus und gibt sie frei, ohne den Aufrufer zu blockieren. */
  #releaseVoices(voices, seconds) {
    const context = this.#context;
    if (!context) {
      for (const voice of voices) this.#disconnectNodes(voice);
      return;
    }
    const now = context.currentTime;
    for (const voice of voices) {
      const param = voice.gain.gain;
      this.#hold(param, now);
      if (seconds > 0) param.linearRampToValueAtTime(0, now + seconds);
      else param.setValueAtTime(0, now);
      try {
        voice.osc.stop(now + Math.max(seconds, 0));
      } catch (error) {
        // Ein bereits gestoppter Oszillator ist kein Fehlerfall.
      }
      voice.osc.onended = () => this.#disconnectNodes(voice);
    }
    const timer = setTimeout(
      () => {
        for (const voice of voices) this.#disconnectNodes(voice);
      },
      Math.max(seconds, 0) * 1000 + 20
    );
    if (timer && typeof timer.unref === 'function') timer.unref();
  }

  #setWaveformOnVoices(waveform) {
    const count = this.#voices.length;
    if (!count || !this.#context) return;
    const level = dbToAmplitude(WAVEFORM_TRIM_DB[waveform]) / count;
    const now = this.#context.currentTime;
    for (const voice of this.#voices) {
      voice.osc.type = waveform;
      const param = voice.gain.gain;
      this.#hold(param, now);
      param.linearRampToValueAtTime(level, now + LIMITS.rampMs / 1000);
    }
  }

  #retuneVoices(frequencies, seconds) {
    if (!this.#context) return;
    const now = this.#context.currentTime;
    this.#voices.forEach((voice, index) => {
      const param = voice.osc.frequency;
      this.#hold(param, now);
      const target = frequencies[index];
      if (seconds > 0) param.linearRampToValueAtTime(target, now + seconds);
      else param.setValueAtTime(target, now);
    });
  }

  // ------------------------------------------------------------ Startpfade

  #startPatch(request) {
    const binaural =
      request.mode === 'binaural'
        ? Object.freeze({
            carrierHz: request.freqs[0],
            deltaHz: request.delta,
            leftHz: request.freqs[0],
            rightHz: request.freqs[1],
          })
        : null;
    return {
      status: 'running',
      mode: request.mode,
      freqHz: request.freqs[0],
      frequenciesHz: Object.freeze(request.freqs.slice()),
      waveform: request.waveform,
      gainDb: request.gainDb,
      binaural,
      sweep: null,
      lastError: null,
      contextState: this.#readContextState(),
    };
  }

  #applyStart(request) {
    const { freqs, waveform, gainDb, fadeMs, mode } = request;
    // Ein neuer Start beendet einen laufenden Sweep: sonst konkurrieren zwei
    // Automationen um denselben Frequenz-Parameter.
    this.#cancelSweepInternal(false);
    // Wiederverwendung statt Neubau (ADR §4.4) entscheidet sich an den
    // tatsächlich vorhandenen Stimmen, nicht am Status: ein zweiter Aufruf
    // trifft den Zustand `starting` an, obwohl der erste Satz schon läuft.
    const reuse = this.#voices.length > 0 && this.#voices.length === freqs.length && this.#state.mode === mode;

    if (reuse) {
      // Wiederverwendung statt Neubau (ADR §4.4): vorhandene Oszillatoren
      // werden umgestimmt, es entstehen keine zweiten Stimmen.
      this.#setWaveformOnVoices(waveform);
      this.#retuneVoices(freqs, LIMITS.rampMs / 1000);
      this.#rampMaster(gainDb);
      this.#emit(this.#startPatch(request));
      return;
    }

    if (this.#voices.length > 0) {
      this.#releaseVoices(this.#voices, Math.max(fadeMs, LIMITS.fadeMs) / 1000);
      this.#voices = [];
    }

    const specs = freqs.map((freq, index) => ({
      freq,
      pan: mode === 'binaural' ? (index === 0 ? -1 : 1) : null,
    }));
    this.#voices = this.#createVoices(specs, waveform);
    this.#fadeIn(gainDb, fadeMs);
    this.#emit(this.#startPatch(request));
  }

  /** Baut den Startantrag; erzeugt den Kontext synchron im Nutzer-Task. */
  #prepareTones(frequenciesHz, options, mode) {
    this.#assertUsable();
    if (!frequenciesHz || typeof frequenciesHz.length !== 'number') {
      throw new FrequencyEngineError('invalid_argument', 'frequenciesHz must be an array of numbers.');
    }
    const list = Array.from(frequenciesHz);
    if (list.length < 1 || list.length > LIMITS.maxVoices) {
      throw new FrequencyEngineError('invalid_argument', `Exactly 1 to ${LIMITS.maxVoices} frequencies are required.`);
    }
    const freqs = list.map((value, index) => this.#readFrequency(value, `frequenciesHz[${index}]`));
    const settings = options && typeof options === 'object' ? options : {};
    const waveform = settings.waveform === undefined ? this.#state.waveform : this.#readWaveform(settings.waveform);
    const gainDb = settings.gainDb === undefined ? this.#state.gainDb : this.#readGain(settings.gainDb);
    const fadeMs = this.#readDuration(settings.fadeInMs, LIMITS.fadeMs);

    this.#requestContextStart();
    this.#emit({ status: 'starting', lastError: null, contextState: this.#readContextState() });
    return { freqs, waveform, gainDb, fadeMs, mode };
  }

  async #runStart(request) {
    try {
      await this.#awaitRunning();
      this.#applyStart(request);
    } catch (error) {
      const code = error instanceof FrequencyEngineError ? error.code : classifyBrowserError(error);
      const recoverable = error instanceof FrequencyEngineError ? error.recoverable : code !== 'unsupported';
      const info = errorInfo(code, error && error.message ? error.message : 'Audio start failed.', recoverable);
      // Kein halber Graph: es bleiben keine Oszillatoren zurück (E13).
      for (const voice of this.#voices) this.#disconnectNodes(voice);
      this.#voices = [];
      this.#cancelSweepInternal(false);
      this.#emit({
        status: code === 'unsupported' ? 'unsupported' : 'error',
        mode: null,
        frequenciesHz: Object.freeze([]),
        binaural: null,
        sweep: null,
        lastError: info,
        contextState: this.#readContextState(),
      });
      throw new FrequencyEngineError(info.code, info.message, info.recoverable);
    }
  }

  play(freqHz, options) {
    try {
      const target = freqHz === undefined ? this.#state.freqHz : this.#readFrequency(freqHz, 'freqHz');
      const request = this.#prepareTones([target], options, 'tone');
      return this.#enqueue(() => this.#runStart(request));
    } catch (error) {
      return Promise.reject(error);
    }
  }

  playTones(frequenciesHz, options) {
    let request;
    try {
      request = this.#prepareTones(frequenciesHz, options, 'tone');
    } catch (error) {
      return Promise.reject(error);
    }
    return this.#enqueue(() => this.#runStart(request));
  }

  playBinaural(options = {}) {
    let request;
    try {
      this.#assertUsable();
      if (!options || typeof options !== 'object') {
        throw new FrequencyEngineError('invalid_argument', 'options are required.');
      }
      const carrier = this.#readFrequency(options.carrierHz, 'carrierHz');
      const delta = this.#readDelta(options.deltaHz);
      const right = carrier + delta;
      if (right > LIMITS.maxHz) {
        throw new FrequencyEngineError('invalid_argument', `carrierHz + deltaHz must not exceed ${LIMITS.maxHz} Hz.`);
      }
      const waveform = options.waveform === undefined ? this.#state.waveform : this.#readWaveform(options.waveform);
      const gainDb = options.gainDb === undefined ? this.#state.gainDb : this.#readGain(options.gainDb);
      const fadeMs = this.#readDuration(options.fadeInMs, LIMITS.fadeMs);

      this.#requestContextStart();
      this.#emit({ status: 'starting', lastError: null, contextState: this.#readContextState() });
      request = { freqs: [carrier, right], waveform, gainDb, fadeMs, mode: 'binaural', delta };
    } catch (error) {
      return Promise.reject(error);
    }
    return this.#enqueue(() => this.#runStart(request));
  }

  // ------------------------------------------------------------------ Stop

  async #stopVoices(fadeMs) {
    this.#cancelSweepInternal(false);
    const voices = this.#voices;
    this.#voices = [];
    const context = this.#context;
    const seconds = fadeMs / 1000;

    if (context && this.#masterGain && voices.length > 0) {
      const param = this.#masterGain.gain;
      this.#hold(param, context.currentTime);
      if (seconds > 0) param.linearRampToValueAtTime(0, context.currentTime + seconds);
      else param.setValueAtTime(0, context.currentTime);
    }
    if (voices.length > 0 && seconds > 0) await this.#wait(fadeMs);
    for (const voice of voices) this.#disconnectNodes(voice);

    if (this.#state.status !== 'idle' && this.#state.status !== 'disposed') {
      this.#emit({
        status: 'idle',
        mode: null,
        frequenciesHz: Object.freeze([]),
        binaural: null,
        sweep: null,
        lastError: null,
        contextState: this.#readContextState(),
      });
    }
  }

  stop(options = {}) {
    let fadeMs;
    try {
      this.#assertUsable();
      fadeMs = this.#readDuration(options.fadeOutMs, LIMITS.fadeMs);
    } catch (error) {
      return Promise.reject(error);
    }
    return this.#enqueue(() => this.#stopVoices(fadeMs));
  }

  // ---------------------------------------------------------------- Setter
  //
  // Setter sind synchron, laufen nicht über die FIFO-Kette und erzeugen nie
  // einen AudioContext (ADR §4.4).

  setFrequency(freqHz, options = {}) {
    this.#assertUsable();
    const target = this.#readFrequency(freqHz, 'freqHz');
    const rampMs = this.#readDuration(options && options.rampMs, LIMITS.rampMs);
    // Ein Setter während eines Sweeps beendet den Sweep, sonst konkurrieren
    // zwei Automationen um denselben Parameter.
    this.#cancelSweepInternal(false);

    const state = this.#state;
    if (state.mode === 'binaural' && state.binaural) {
      const delta = state.binaural.deltaHz;
      const carrier = clamp(target, LIMITS.minHz, LIMITS.maxHz - delta);
      if (state.status === 'running') this.#retuneVoices([carrier, carrier + delta], rampMs / 1000);
      this.#emit({
        freqHz: carrier,
        frequenciesHz: Object.freeze([carrier, carrier + delta]),
        binaural: Object.freeze({ carrierHz: carrier, deltaHz: delta, leftHz: carrier, rightHz: carrier + delta }),
      });
      return;
    }

    if (state.status === 'running' && this.#voices.length > 0) {
      if (this.#voices.length === 1) {
        this.#retuneVoices([target], rampMs / 1000);
        this.#emit({ freqHz: target, frequenciesHz: Object.freeze([target]) });
        return;
      }
      // Mehrere Stimmen: proportional skalieren, Intervalle bleiben erhalten,
      // Ziele werden einzeln geklemmt (am Bereichsrand stauchen sie).
      const ratio = target / state.freqHz;
      const scaled = state.frequenciesHz.map((hz) => clamp(hz * ratio, LIMITS.minHz, LIMITS.maxHz));
      this.#retuneVoices(scaled, rampMs / 1000);
      this.#emit({ freqHz: target, frequenciesHz: Object.freeze(scaled) });
      return;
    }

    this.#emit({ freqHz: target });
  }

  setWaveform(type) {
    this.#assertUsable();
    const waveform = this.#readWaveform(type);
    if (this.#state.status === 'running') this.#setWaveformOnVoices(waveform);
    this.#emit({ waveform });
  }

  setGain(gainDb) {
    this.#assertUsable();
    const value = this.#readGain(gainDb);
    if (this.#state.status === 'running') this.#rampMaster(value);
    this.#emit({ gainDb: value });
  }

  setBeatDelta(deltaHz, options = {}) {
    this.#assertUsable();
    const delta = this.#readDelta(deltaHz);
    const rampMs = this.#readDuration(options && options.rampMs, LIMITS.rampMs);
    const state = this.#state;
    if (state.mode !== 'binaural' || !state.binaural) {
      throw new FrequencyEngineError('invalid_state', 'Beat delta is only available in binaural mode.');
    }
    const left = state.binaural.leftHz;
    // Der rechte Kanal darf die Obergrenze nicht überschreiten.
    const maxDelta = Math.max(LIMITS.minBinauralDeltaHz, LIMITS.maxHz - left);
    const effective = Math.min(delta, maxDelta);
    const right = left + effective;
    if (state.status === 'running' && this.#voices.length === 2) {
      if (this.#context) {
        const now = this.#context.currentTime;
        const param = this.#voices[1].osc.frequency;
        this.#hold(param, now);
        param.linearRampToValueAtTime(right, now + rampMs / 1000);
      }
    }
    this.#emit({
      frequenciesHz: Object.freeze([left, right]),
      binaural: Object.freeze({ carrierHz: left, deltaHz: effective, leftHz: left, rightHz: right }),
    });
  }

  // ---------------------------------------------------------------- Sweep

  #clearSweep() {
    if (!this.#sweep) return;
    clearTimeout(this.#sweep.timer);
    this.#sweep = null;
  }

  #cancelSweepInternal(completed) {
    if (!this.#sweep) return;
    const { settle, voice } = this.#sweep;
    this.#clearSweep();
    let held = this.#state.freqHz;
    if (this.#context && voice) {
      const now = this.#context.currentTime;
      this.#hold(voice.osc.frequency, now);
      const value = voice.osc.frequency.value;
      if (typeof value === 'number' && Number.isFinite(value)) held = clamp(value, LIMITS.minHz, LIMITS.maxHz);
    }
    this.#emit({ sweep: null, freqHz: held, frequenciesHz: Object.freeze(voice ? [held] : []) });
    settle(Object.freeze({ completed, endedAtHz: held }));
  }

  cancelSweep() {
    if (this.#state.status === 'disposed') return;
    this.#cancelSweepInternal(false);
  }

  #startSweep(from, to, seconds, curve, rampMs) {
    this.#cancelSweepInternal(false);
    const context = this.#context;
    const voice = this.#voices[0];
    if (!context || !voice) {
      throw new FrequencyEngineError('internal', 'No voice available for the sweep.', true);
    }
    const now = context.currentTime;
    const param = voice.osc.frequency;
    this.#hold(param, now);
    param.setValueAtTime(from, now);
    if (curve === 'exponential') param.exponentialRampToValueAtTime(to, now + seconds);
    else param.linearRampToValueAtTime(to, now + seconds);

    let settle = null;
    const promise = new Promise((resolve) => {
      settle = resolve;
    });
    const timer = setTimeout(
      () => {
        this.#sweep = null;
        this.#emit({
          sweep: null,
          freqHz: to,
          frequenciesHz: Object.freeze([to]),
          status: 'running',
        });
        settle(Object.freeze({ completed: true, endedAtHz: to }));
      },
      seconds * 1000 + rampMs
    );
    if (timer && typeof timer.unref === 'function') timer.unref();

    this.#sweep = { settle, timer, voice };
    this.#emit({
      status: 'running',
      mode: 'tone',
      freqHz: from,
      frequenciesHz: Object.freeze([from]),
      binaural: null,
      lastError: null,
      sweep: Object.freeze({ fromHz: from, toHz: to, seconds, curve, startedAtMs: this.#now() }),
    });
    return promise;
  }

  sweep(fromHz, toHz, seconds, options = {}) {
    let plan;
    try {
      this.#assertUsable();
      const state = this.#state;
      if (state.mode === 'binaural') {
        throw new FrequencyEngineError('invalid_state', 'Sweeps are not available in binaural mode.');
      }
      if (this.#voices.length > 1) {
        throw new FrequencyEngineError('invalid_state', 'Sweeps require a single voice.');
      }
      const from = this.#readFrequency(fromHz, 'fromHz');
      const to = this.#readFrequency(toHz, 'toHz');
      const duration = this.#readSweepSeconds(seconds);
      const settings = options && typeof options === 'object' ? options : {};
      const curve = settings.curve === undefined ? 'exponential' : this.#readCurve(settings.curve);
      const rampMs = this.#readDuration(settings.rampMs, LIMITS.rampMs);
      const needsStart = state.status !== 'running' || this.#voices.length === 0;
      plan = {
        from,
        to,
        duration,
        curve,
        rampMs,
        request: needsStart ? this.#prepareTones([from], {}, 'tone') : null,
      };
    } catch (error) {
      return Promise.reject(error);
    }

    // Die Warteschlange gibt sofort frei: der Sweep-Zustand liegt in #sweep,
    // damit stop()/cancelSweep() während der Rampe laufen können. Der
    // Rückgabewert wird deshalb erst nach dem Start aus der Kette gehängt und
    // nicht in ihr abgewartet.
    let pending = null;
    const started = this.#enqueue(async () => {
      if (plan.request) {
        await this.#runStart(plan.request);
      }
      pending = this.#startSweep(plan.from, plan.to, plan.duration, plan.curve, plan.rampMs);
    });
    return started.then(() => pending);
  }

  // ------------------------------------------------------------- Analysator

  #analyserBuffer(channel, kind) {
    const size = kind === 'spectrum' ? LIMITS.fftSize / 2 : LIMITS.fftSize;
    // Ohne Kontext gibt es keinen Analysator, aber der Vertrag verlangt einen
    // internen Puffer fester Länge, den jeder Aufruf überschreibt.
    if (!this.#analysers) {
      const store = kind === 'spectrum' ? this.#silence.spectrum : this.#silence.time;
      if (!store[channel]) store[channel] = new Float32Array(size);
      return store[channel];
    }
    const store = kind === 'spectrum' ? this.#analysers.spectrumBuffers : this.#analysers.timeBuffers;
    const buffer = store[channel];
    if (!buffer || buffer.length !== size) {
      const replacement = new Float32Array(size);
      store[channel] = replacement;
      return replacement;
    }
    return buffer;
  }

  getAnalyserData(channel = 'mix', target) {
    const key = this.#readChannel(channel);
    const size = LIMITS.fftSize;
    const useTarget = target instanceof Float32Array && target.length === size;
    const buffer = useTarget ? target : this.#analyserBuffer(key, 'time');
    if (this.#state.status !== 'running' || !this.#analysers) {
      buffer.fill(0);
      return buffer;
    }
    this.#analysers[key].getFloatTimeDomainData(buffer);
    return buffer;
  }

  getSpectrumData(channel = 'mix', target) {
    const key = this.#readChannel(channel);
    const size = LIMITS.fftSize / 2;
    const useTarget = target instanceof Float32Array && target.length === size;
    const buffer = useTarget ? target : this.#analyserBuffer(key, 'spectrum');
    if (this.#state.status !== 'running' || !this.#analysers) {
      buffer.fill(-Infinity);
      return buffer;
    }
    this.#analysers[key].getFloatFrequencyData(buffer);
    return buffer;
  }

  // --------------------------------------------------------------- Dispose

  dispose() {
    return this.#enqueue(async () => {
      if (this.#state.status === 'disposed') return;
      this.#cancelSweepInternal(false);
      const voices = this.#voices;
      this.#voices = [];
      for (const voice of voices) this.#disconnectNodes(voice);

      const context = this.#context;
      this.#emit({
        status: 'disposed',
        mode: null,
        frequenciesHz: Object.freeze([]),
        binaural: null,
        sweep: null,
        contextState: 'closed',
      });

      if (context && !this.#offline) {
        if (typeof context.removeEventListener === 'function' && this.#onContextStateChange) {
          context.removeEventListener('statechange', this.#onContextStateChange);
        }
        if (typeof context.close === 'function') {
          try {
            await context.close();
          } catch (error) {
            console.error('[frequenz-engine] closing the audio context failed', error);
          }
        }
      }
      this.#onContextStateChange = null;
      this.#context = null;
      this.#masterGain = null;
      this.#mixBus = null;
      this.#analysers = null;
      this.#listeners.clear();
      this.onstatechange = null;
    });
  }
}

/** Fabrik für Tests und Isolation; erzeugt genau eine Engine. */
export function createFrequencyEngine(options) {
  return new FrequencyEngineImpl(options);
}

let singleton = null;

/**
 * Prozessweite Singleton-Instanz (eine pro Dokument). Eine endgültig beendete
 * Engine wird nicht wiederverwendet, weil sie jeden Start mit `context_closed`
 * ablehnen würde.
 */
export function getFrequencyEngine() {
  if (!singleton || singleton.state.status === 'disposed') {
    singleton = createFrequencyEngine();
  }
  return singleton;
}
