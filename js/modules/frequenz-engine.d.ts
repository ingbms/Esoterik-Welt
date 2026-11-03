/**
 * Verbindlicher Schnittstellenvertrag der Frequenzlabor-Audio-Engine.
 *
 * Diese Datei ist reine Typdokumentation. Das Projekt hat keinen
 * TypeScript-Build; die Datei wird weder kompiliert noch gebundelt noch von
 * CI geprüft. Die Implementierung liegt in `frequenz-engine.js`; Typen und
 * Implementierung werden nur gemeinsam geändert.
 *
 * Kanonische Prosa-Fassung mit Semantik, Fehlerfällen und Pegelregeln:
 * `docs/adr-frequenzlabor.md`, Abschnitt 4.
 */

/** Erlaubte Oszillator-Wellenformen. */
export type WaveformType = 'sine' | 'triangle' | 'square' | 'sawtooth';

/** Verlauf eines Frequenz-Sweeps. */
export type SweepCurve = 'linear' | 'exponential';

/** Analysator-Kanal: Summe (mono) oder einzelne Stereoseite. */
export type AnalyserChannel = 'mix' | 'left' | 'right';

/**
 * `idle`     – keine Stimmen; ein AudioContext darf fehlen.
 * `starting` – play()/playBinaural() läuft, Kontext wird erzeugt/resumiert.
 * `running`  – Stimmen laufen.
 * `unsupported` – Web Audio API fehlt; play() lehnt ab.
 * `error`    – letzter Startversuch ist fehlgeschlagen; play() darf erneut versuchen.
 * `disposed` – Instanz ist endgültig beendet; play() lehnt ab.
 */
export type EngineStatus = 'idle' | 'starting' | 'running' | 'unsupported' | 'error' | 'disposed';

/** Stabile Fehlercodes. Die UI übersetzt Codes, niemals `message`. */
export type EngineErrorCode =
  | 'unsupported'
  | 'context_blocked'
  | 'context_closed'
  | 'invalid_frequency'
  | 'invalid_argument'
  | 'invalid_state'
  | 'internal';

/** Serialisierbarer Fehlerzustand in `EngineState.lastError`. */
export interface FrequencyEngineErrorInfo {
  readonly code: EngineErrorCode;
  /** Technischer Text (englisch); nicht ungefiltert als UI-Text rendern. */
  readonly message: string;
  /** true, wenn ein erneuter Versuch nach Nutzerinteraktion sinnvoll ist. */
  readonly recoverable: boolean;
}

export interface BinauralState {
  readonly carrierHz: number;
  /** Differenzfrequenz; immer positiv. */
  readonly deltaHz: number;
  /** Linker Kanal; identisch mit carrierHz. */
  readonly leftHz: number;
  /** Rechter Kanal; leftHz + deltaHz, auf maxHz begrenzt. */
  readonly rightHz: number;
}

export interface SweepState {
  readonly fromHz: number;
  readonly toHz: number;
  readonly seconds: number;
  readonly curve: SweepCurve;
  /** Zeitbasis `performance.now()` beim Start; den Fortschritt rechnet die UI. */
  readonly startedAtMs: number;
}

/**
 * Unveränderlicher Zustands-Schnappschuss. Jede Emission erhöht `revision`
 * um genau eins; `state` wird bei jeder Änderung ersetzt, nie mutiert.
 */
export interface EngineState {
  readonly status: EngineStatus;
  /** null, solange keine Stimmen laufen. */
  readonly mode: 'tone' | 'binaural' | null;
  /** Primärfrequenz bzw. Trägerfrequenz; immer auf [minHz, maxHz] geklemmt. */
  readonly freqHz: number;
  /** Aktive Stimmen in Hz (1..maxVoices); bei binaural [leftHz, rightHz]; sonst []. */
  readonly frequenciesHz: ReadonlyArray<number>;
  readonly waveform: WaveformType;
  /** Auf [minGainDb, hardCapGainDb] geklemmt. */
  readonly gainDb: number;
  readonly binaural: BinauralState | null;
  readonly sweep: SweepState | null;
  readonly contextState: 'none' | 'suspended' | 'running' | 'closed';
  /** Bleibt bis zur nächsten erfolgreichen Operation gesetzt. */
  readonly lastError: FrequencyEngineErrorInfo | null;
  readonly revision: number;
}

export interface PlayOptions {
  readonly waveform?: WaveformType;
  readonly gainDb?: number;
  /** Einblendzeit in ms; auf [0, 1000] geklemmt, Standard `fadeMs`. */
  readonly fadeInMs?: number;
}

export interface BinauralOptions {
  readonly carrierHz: number;
  readonly deltaHz: number;
  readonly waveform?: WaveformType;
  readonly gainDb?: number;
  readonly fadeInMs?: number;
}

export interface StopOptions {
  /** Ausblendzeit in ms; auf [0, 1000] geklemmt, Standard `fadeMs`. */
  readonly fadeOutMs?: number;
}

export interface RampOptions {
  /** Rampendauer in ms; auf [0, 1000] geklemmt, Standard `rampMs`. */
  readonly rampMs?: number;
}

export interface SweepOptions {
  readonly curve?: SweepCurve;
  readonly rampMs?: number;
}

export interface SweepResult {
  /** false, wenn der Sweep durch stop(), cancelSweep() oder dispose() endete. */
  readonly completed: boolean;
  readonly endedAtHz: number;
}

export interface FrequencyEngineOptions {
  /**
   * Nur für Tests: ersetzt `new AudioContext()`. Ein `OfflineAudioContext`
   * schaltet den Testmodus ein (kein resume(), Status wird direkt `running`).
   * `null` simuliert eine fehlende Web-Audio-API.
   */
  readonly audioContextFactory?: () => AudioContext | OfflineAudioContext | null;
  /** Nur für Tests: Zeitquelle für `SweepState.startedAtMs`; Standard performance.now. */
  readonly now?: () => number;
}

export interface FrequencyEngineLimits {
  readonly minHz: number;
  readonly maxHz: number;
  readonly defaultHz: number;
  readonly minGainDb: number;
  readonly defaultGainDb: number;
  readonly hardCapGainDb: number;
  readonly fadeMs: number;
  readonly rampMs: number;
  readonly maxVoices: number;
  readonly fftSize: number;
  readonly analyserSmoothing: number;
  readonly minSweepSeconds: number;
  readonly maxSweepSeconds: number;
  readonly minBinauralDeltaHz: number;
  readonly maxBinauralDeltaHz: number;
}

/** Normative Zahlenwerte; siehe ADR §4.3. */
export declare const FREQUENCY_LIMITS: FrequencyEngineLimits;

/** Pegelabsenkung je Wellenform in dB: sine 0, triangle 0, square -6, sawtooth -6. */
export declare const WAVEFORM_TRIM_DB: Readonly<Record<WaveformType, number>>;

/** Fehlerklasse für synchrone Setter und abgelehnte Promises. */
export declare class FrequencyEngineError extends Error {
  readonly code: EngineErrorCode;
  readonly recoverable: boolean;
  constructor(code: EngineErrorCode, message: string, recoverable?: boolean);
}

export type StateListener = (state: EngineState) => void;

/**
 * Einzige Audioquelle der Seite. Es existiert höchstens eine Instanz pro
 * Dokument (`getFrequencyEngine()`); alle Methoden laufen auf derselben
 * Zustandsmaschine.
 */
export interface FrequencyEngine {
  /** Aktueller Schnappschuss; nie mutieren. */
  readonly state: EngineState;

  /** Prüft die Web Audio API, ohne einen AudioContext zu erzeugen. */
  isSupported(): boolean;

  /**
   * Startet einen Ton oder übernimmt die Parameter, wenn bereits ein
   * Ein-Ton-Lauf aktiv ist. Kurzform für `playTones([freqHz])`. Ohne `freqHz`
   * gilt `state.freqHz` (Standard 440 Hz). Der erste Aufruf muss aus einem
   * Nutzerereignis heraus erfolgen.
   */
  play(freqHz?: number, options?: PlayOptions): Promise<void>;

  /**
   * Startet 1 bis `maxVoices` Stimmen im selben Kanal (z. B. 440 + 444 Hz für
   * eine Schwebung). Leere Liste oder mehr als `maxVoices` Einträge werden mit
   * `invalid_argument` abgelehnt.
   */
  playTones(frequenciesHz: ReadonlyArray<number>, options?: PlayOptions): Promise<void>;

  /** Startet zwei kanalgetrennte Töne (Kopfhörer nötig, wird nicht geprüft). */
  playBinaural(options: BinauralOptions): Promise<void>;

  /** Blendet aus und gibt alle Stimmen frei; idempotent. Parameter bleiben erhalten. */
  stop(options?: StopOptions): Promise<void>;

  /** Setzt die Primärfrequenz (bei mehreren Stimmen proportional skaliert). */
  setFrequency(freqHz: number, options?: RampOptions): void;

  /** Setzt die Wellenform aller Stimmen; darf keinen AudioContext erzeugen. */
  setWaveform(type: WaveformType): void;

  /** Setzt den Gesamtpegel in dBFS; klemmt auf [minGainDb, hardCapGainDb]. */
  setGain(gainDb: number): void;

  /** Ändert die Differenzfrequenz im Binaural-Modus; sonst `invalid_state`. */
  setBeatDelta(deltaHz: number, options?: RampOptions): void;

  /**
   * Fährt die Primärstimme von `fromHz` nach `toHz`. Nur im Ein-Ton-Modus;
   * startet den Ton, wenn noch keiner läuft. Das Promise löst beim Ende des
   * Rampen aus (auch bei Abbruch), `SweepResult.completed` unterscheidet die Fälle.
   */
  sweep(fromHz: number, toHz: number, seconds: number, options?: SweepOptions): Promise<SweepResult>;

  /** Bricht einen laufenden Sweep ab; idempotent. */
  cancelSweep(): void;

  /**
   * Zeitbereichsdaten des Analysators (Float32, [-1, 1], Länge `fftSize`).
   * Ohne laufenden Ton: Nullarray. Ein übergebenes `target` wird nur benutzt,
   * wenn seine Länge exakt `fftSize` ist; sonst wird der interne Puffer
   * zurückgegeben, der bei jedem Aufruf überschrieben wird.
   */
  getAnalyserData(channel?: AnalyserChannel, target?: Float32Array): Float32Array;

  /**
   * Spektraldaten in dBFS (Float32, Länge `fftSize / 2`), wie
   * `AnalyserNode.getFloatFrequencyData`. Ohne laufenden Ton: -Infinity.
   */
  getSpectrumData(channel?: AnalyserChannel, target?: Float32Array): Float32Array;

  /** Einzelner Handler; wird nach allen `subscribe`-Listenern aufgerufen. */
  onstatechange: StateListener | null;

  /** Mehrfach-Abonnement; gibt eine idempotente Abmeldefunktion zurück. */
  subscribe(listener: StateListener): () => void;

  /** Beendet Stimmen, schließt den AudioContext und leert alle Listener. */
  dispose(): Promise<void>;
}

/** Fabrik für Tests und Isolation; erzeugt genau eine Engine. */
export declare function createFrequencyEngine(options?: FrequencyEngineOptions): FrequencyEngine;

/** Prozessweite Singleton-Instanz (eine pro Dokument). */
export declare function getFrequencyEngine(): FrequencyEngine;

/** Modulweite Support-Prüfung ohne Seiteneffekte. */
export declare function isWebAudioSupported(): boolean;
