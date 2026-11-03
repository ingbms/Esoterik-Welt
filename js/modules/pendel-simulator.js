// Pendellabor — Physik und Bedienung des Fadenpendels.
//
// Zwei klar getrennte Teile:
//
// 1. Reine Rechenfunktionen (oben): Zustand, Ableitung, Runge-Kutta-Schritt,
//    Zeitfortschreibung mit festem Zeitschritt, Periodenmessung über
//    Nulldurchgänge, Energie. Diese Funktionen kennen kein DOM und sind in
//    Node vollständig prüfbar (tests/radiasthesie-simulator.mjs).
//
// 2. Die Bedienung (unten): mountPendulumSimulator() verbindet die von
//    radiasthesie-views.js gerenderte Bühne mit Reglern, Start/Stop und
//    requestAnimationFrame. Das Modul wird beim Verlassen der Route oder beim
//    Neu-Rendern über destroy() beendet; kein Timer und kein Frame überlebt.
//
// Modell (bewusst nachvollziehbar, nicht kurvig „poliert“):
//
//   θ″(t) = −(g/L)·sin θ(t) − 2ζω₀·θ′(t),   ω₀ = √(g/L)
//
// Das ist das nichtlineare Fadenpendel mit viskoser Dämpfung, Punktmasse am
// masselosen Faden. Die Kleinwinkel-Näherung T₀ = 2π√(L/g) wird nur als
// Vergleichswert angezeigt, nicht als Bewegungsgleichung benutzt. Dadurch
// bleibt die Anzeige bei großen Auslenkungen ehrlich: die gemessene Dauer ist
// dort länger als T₀, und zwar um den Betrag, den die Reihenentwicklung
// T ≈ T₀·(1 + θ₀²/16 + 11θ₀⁴/3072) vorhersagt.
//
// Zeitschritt: fester Schritt 1/480 s mit Akkumulator. Die simulierte Zeit
// hängt damit nur von der verstrichenen Zeit ab, nicht von der Bildrate und
// nicht von der Aufteilung in Frames. Ein einzelner Aufruf verarbeitet
// höchstens SIM.maxFrameSeconds, damit ein zurückgekehrter Tab keinen Sprung
// erzeugt.

export const SIM = Object.freeze({
  // Mittlere Fallbeschleunigung, fest gesetzt. Keine Ortsabhängigkeit, kein
  // Eingabefeld: eine zweite Stellschraube würde die Nachvollziehbarkeit
  // nicht erhöhen.
  gravity: 9.81,
  // Fester Integrationsschritt in Sekunden (≈ 2,08 ms).
  fixedStep: 1 / 480,
  // Obergrenze für einen einzelnen advance()-Aufruf (Sekunden).
  maxFrameSeconds: 0.25,
  // Notbremse gegen Endlosschleifen bei fehlerhaften Aufrufen.
  maxSubSteps: 240,
  // Bereich der Anfangsauslenkung in Radiant, ab der die Simulation als
  // „zur Ruhe gekommen“ gilt (nur bei Dämpfung > 0).
  settleAngle: 0.0015,
  settleOmega: 0.01,
  lengthM: Object.freeze({ min: 0.05, max: 2, step: 0.01, initial: 0.25 }),
  amplitudeDeg: Object.freeze({ min: 0, max: 80, step: 1, initial: 25 }),
  damping: Object.freeze({ min: 0, max: 0.2, step: 0.005, initial: 0.02 }),
});

export const PENDEL_STYLES = Object.freeze(['klassisch', 'kugel', 'ring']);

// --- Prüfung der Eingaben -------------------------------------------------

function assertFinite(name, value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${name} muss eine endliche Zahl sein`);
  }
  return value;
}

function assertRange(name, value, range, unit) {
  assertFinite(name, value);
  if (value < range.min || value > range.max) {
    throw new RangeError(`${name} muss zwischen ${range.min} und ${range.max}${unit} liegen`);
  }
  return value;
}

export function validateLength(lengthM) {
  return assertRange('Pendellänge', lengthM, SIM.lengthM, ' m');
}

export function validateAmplitudeDeg(amplitudeDeg) {
  return assertRange('Anfangsauslenkung', amplitudeDeg, SIM.amplitudeDeg, '°');
}

export function validateDamping(damping) {
  return assertRange('Dämpfungsgrad', damping, SIM.damping, '');
}

export function validateGravity(gravity = SIM.gravity) {
  assertFinite('Fallbeschleunigung', gravity);
  if (gravity <= 0) throw new RangeError('Fallbeschleunigung muss größer als 0 sein');
  return gravity;
}

/** Prüft und friert einen vollständigen Parametersatz ein. */
export function normalizeParams({ lengthM, amplitudeDeg, damping }) {
  return Object.freeze({
    lengthM: validateLength(lengthM),
    amplitudeDeg: validateAmplitudeDeg(amplitudeDeg),
    damping: validateDamping(damping),
  });
}

// --- Geschlossene Näherungen ---------------------------------------------

/**
 * Schwingungsdauer der Kleinwinkel-Näherung: T₀ = 2π·√(L/g).
 * Gültig für θ₀ → 0; bei endlicher Auslenkung ist die echte Dauer länger.
 */
export function periodSmallAngle(lengthM, gravity = SIM.gravity) {
  validateLength(lengthM);
  validateGravity(gravity);
  return 2 * Math.PI * Math.sqrt(lengthM / gravity);
}

/** Eigenkreisfrequenz ω₀ = √(g/L) in rad/s. */
export function angularFrequency(lengthM, gravity = SIM.gravity) {
  validateLength(lengthM);
  validateGravity(gravity);
  return Math.sqrt(gravity / lengthM);
}

/**
 * Periodendauer der gedämpften Schwingung: T = 2π / (ω₀·√(1−ζ²)).
 * Für ζ = 0 identisch mit T₀.
 */
export function periodDamped(lengthM, damping, gravity = SIM.gravity) {
  validateLength(lengthM);
  validateDamping(damping);
  validateGravity(gravity);
  if (damping >= 1) throw new RangeError('Dämpfungsgrad muss kleiner als 1 sein');
  return (2 * Math.PI) / (angularFrequency(lengthM, gravity) * Math.sqrt(1 - damping * damping));
}

// --- Zustand und Integration ---------------------------------------------

/**
 * Startzustand: Pendel ruht in der Anfangsauslenkung, wird losgelassen.
 * `theta` in rad, `omega` = θ′ in rad/s, `t` in s, `carry` = Restzeit, der
 * noch keinen vollen Zeitschritt ergeben hat.
 */
export function createState({ lengthM, amplitudeDeg, damping }) {
  const params = normalizeParams({ lengthM, amplitudeDeg, damping });
  return {
    theta: (params.amplitudeDeg * Math.PI) / 180,
    omega: 0,
    t: 0,
    carry: 0,
    steps: 0,
    lengthM: params.lengthM,
    amplitudeDeg: params.amplitudeDeg,
    damping: params.damping,
  };
}

/** Ableitung [θ′, θ″] des nichtlinearen Fadenpendels mit viskoser Dämpfung. */
export function derivatives(theta, omega, params) {
  const omega0 = Math.sqrt(SIM.gravity / params.lengthM);
  return [omega, -(SIM.gravity / params.lengthM) * Math.sin(theta) - 2 * params.damping * omega0 * omega];
}

/** Ein klassischer Runge-Kutta-Schritt 4. Ordnung mit fester Schrittweite. */
export function stepFixed(state, params, dt = SIM.fixedStep) {
  assertFinite('Zeitschritt', dt);
  if (dt <= 0) throw new RangeError('Zeitschritt muss größer als 0 sein');
  const k1 = derivatives(state.theta, state.omega, params);
  const k2 = derivatives(state.theta + (dt / 2) * k1[0], state.omega + (dt / 2) * k1[1], params);
  const k3 = derivatives(state.theta + (dt / 2) * k2[0], state.omega + (dt / 2) * k2[1], params);
  const k4 = derivatives(state.theta + dt * k3[0], state.omega + dt * k3[1], params);
  return {
    ...state,
    theta: state.theta + (dt / 6) * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]),
    omega: state.omega + (dt / 6) * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]),
    t: state.t + dt,
    steps: state.steps + 1,
  };
}

/**
 * Schreibt den Zustand um `seconds` fort — immer in ganzen festen Schritten.
 * Negative oder unsinnige Werte zählen als 0; ein Aufruf verarbeitet
 * höchstens SIM.maxFrameSeconds. Der Rest bleibt in `carry` und wird beim
 * nächsten Aufruf verbraucht. Dadurch ist das Ergebnis unabhängig davon, ob
 * 60 oder 144 Frames pro Sekunde ankommen.
 */
export function advance(state, params, seconds) {
  const raw = Number(seconds);
  const elapsed = Number.isFinite(raw) && raw > 0 ? Math.min(raw, SIM.maxFrameSeconds) : 0;
  const total = state.carry + elapsed;
  // +1e-9 fängt Fließkomma-Reste an der Schrittgrenze ab (z. B. 119,9999999).
  let steps = Math.floor(total / SIM.fixedStep + 1e-9);
  if (steps > SIM.maxSubSteps) steps = SIM.maxSubSteps;
  if (steps < 0) steps = 0;
  let next = state;
  for (let i = 0; i < steps; i += 1) next = stepFixed(next, params);
  const consumed = steps * SIM.fixedStep;
  return {
    ...next,
    t: state.t + consumed,
    carry: total - consumed,
    steps: state.steps + steps,
  };
}

/** Spezifische mechanische Energie in J/kg (Masse 1 kg herausgekürzt). */
export function specificEnergy(state, params) {
  const { lengthM } = params;
  return 0.5 * lengthM * lengthM * state.omega * state.omega + SIM.gravity * lengthM * (1 - Math.cos(state.theta));
}

// --- Periodenmessung ------------------------------------------------------

/**
 * Misst die Dauer zwischen zwei Aufwärts-Nulldurchgängen (θ von negativ nach
 * positiv). Erwartet zwei Zustände { theta, t }; der Nulldurchgang wird
 * zwischen den Abtastpunkten linear interpoliert, damit die Anzeige nicht von
 * der Frame-Rate abhängt. Das ist die tatsächliche Dauer der berechneten
 * Bewegung, nicht die Formel. Bei ζ > 0 ist sie etwas länger als T₀/√(1−ζ²),
 * weil die Amplitude abnimmt.
 */
export function createPeriodMeter() {
  return { lastCrossing: null, period: null, periods: [], crossings: 0 };
}

export function updatePeriodMeter(meter, previous, current) {
  if (!(previous.theta < 0 && current.theta >= 0)) return meter;
  const span = current.theta - previous.theta;
  const fraction = span === 0 ? 0 : -previous.theta / span;
  const crossing = previous.t + (current.t - previous.t) * fraction;
  const period = meter.lastCrossing == null ? null : crossing - meter.lastCrossing;
  return {
    lastCrossing: crossing,
    period: period == null ? meter.period : period,
    periods: period == null ? meter.periods : [...meter.periods, period],
    crossings: meter.crossings + 1,
  };
}

/**
 * Führt eine vollständige Simulation in gleichmäßigen Frames aus.
 * Dient Tests und Diagnose; die Oberfläche ruft advance() selbst auf.
 */
export function simulate(params, durationSeconds, { fps = 60 } = {}) {
  const normalized = normalizeParams(params);
  const duration = assertFinite('Simulationsdauer', durationSeconds);
  if (duration < 0) throw new RangeError('Simulationsdauer darf nicht negativ sein');
  assertFinite('Bildrate', fps);
  if (fps <= 0) throw new RangeError('Bildrate muss größer als 0 sein');

  let state = createState(normalized);
  const startEnergy = specificEnergy(state, normalized);
  let meter = createPeriodMeter();
  const peaks = [];
  const frame = Math.min(1 / fps, SIM.maxFrameSeconds);
  let elapsed = 0;
  while (elapsed < duration - 1e-12) {
    const chunk = Math.min(frame, duration - elapsed);
    const previous = state;
    state = advance(state, normalized, chunk);
    // Wendepunkt: θ′ wechselt das Vorzeichen, |θ| ist dort maximal.
    if (previous.omega !== 0 && Math.sign(state.omega) !== Math.sign(previous.omega)) {
      peaks.push({ time: previous.t, angleDeg: Math.abs((previous.theta * 180) / Math.PI) });
    }
    meter = updatePeriodMeter(meter, previous, state);
    elapsed += chunk;
  }
  return {
    state,
    params: normalized,
    period: meter.period,
    periods: meter.periods,
    crossings: meter.crossings,
    peaks,
    energy: specificEnergy(state, normalized),
    startEnergy,
  };
}

// --- Anzeigeformate -------------------------------------------------------

const decimal = (value, digits) => value.toFixed(digits).replace('.', ',');

/** Zahl mit deutschem Dezimalkomma; negative Werte mit typografischem Minus. */
export function formatNumber(value, digits = 2) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '—';
  return decimal(value, digits).replace('-', '−');
}

export const formatTime = (seconds) => `${formatNumber(seconds, 2)} s`;
export const formatAngle = (degrees) => `${formatNumber(degrees, 1)}°`;
export const formatPeriod = (seconds) => (Number.isFinite(seconds) ? `${formatNumber(seconds, 3)} s` : '—');
export const formatLengthCm = (meters) => `${formatNumber(meters * 100, 0)} cm`;
export const formatDamping = (value) => formatNumber(value, 3);

// --- Bedienung (DOM) ------------------------------------------------------

const PIVOT_X = 240;
const PIVOT_Y = 52;
const ARM_MIN_PX = 120;
const ARM_MAX_PX = 272;
const ARC_RADIUS = 62;
const REDUCED_STEP_SECONDS = 0.5;

/**
 * Verbindet die gerenderte Bühne (#pendelLabor) mit ihren Reglern.
 * Gibt ein Steuerobjekt mit destroy() zurück; bei fehlendem Markup null.
 */
export function mountPendulumSimulator(container) {
  if (!container || typeof container.querySelector !== 'function') return null;
  const find = (id) => container.querySelector(`#${id}`);
  const lengthInput = find('psimLength');
  const amplitudeInput = find('psimAmplitude');
  const dampingInput = find('psimDamping');
  const toggleButton = find('psimToggle');
  const resetButton = find('psimReset');
  const stepButton = find('psimStep');
  const statusLine = find('psimStatus');
  const scene = find('psimScene');
  const arm = find('psimArm');
  const thread = find('psimThread');
  const arc = find('psimArc');
  const bobs = [...container.querySelectorAll('[data-psim-bob]')];
  const readout = {
    time: find('psimTime'),
    theta: find('psimTheta'),
    period: find('psimPeriodMeasured'),
    ideal: find('psimPeriodIdeal'),
    length: find('psimLengthValue'),
    amplitude: find('psimAmplitudeValue'),
    damping: find('psimDampingValue'),
  };

  if (
    !lengthInput ||
    !amplitudeInput ||
    !dampingInput ||
    !toggleButton ||
    !resetButton ||
    !stepButton ||
    !statusLine ||
    !scene ||
    !arm ||
    !thread ||
    !readout.time
  ) {
    return null;
  }

  const win =
    container.ownerDocument && container.ownerDocument.defaultView ? container.ownerDocument.defaultView : window;
  const motion = typeof win.matchMedia === 'function' ? win.matchMedia('(prefers-reduced-motion: reduce)') : null;
  let reduced = Boolean(motion && motion.matches);
  let destroyed = false;
  let running = false;
  let rafId = 0;
  let lastFrameTime = 0;
  let mode = 'idle';
  let params = normalizeParams({
    lengthM: Number(lengthInput.value) / 100,
    amplitudeDeg: Number(amplitudeInput.value),
    damping: Number(dampingInput.value),
  });
  let state = createState(params);
  let meter = createPeriodMeter();

  // --- Darstellung --------------------------------------------------------

  function armLengthPx() {
    const span = SIM.lengthM.max - SIM.lengthM.min;
    const ratio = (params.lengthM - SIM.lengthM.min) / span;
    return ARM_MIN_PX + ratio * (ARM_MAX_PX - ARM_MIN_PX);
  }

  function renderScene() {
    const degrees = (state.theta * 180) / Math.PI;
    const bobY = PIVOT_Y + armLengthPx();
    // SVG dreht im Uhrzeigersinn; ein positiver Winkel soll nach rechts zeigen,
    // damit Zeichnung und Winkelbogen dieselbe Richtung meinen.
    arm.setAttribute('transform', `rotate(${(-degrees).toFixed(3)} ${PIVOT_X} ${PIVOT_Y})`);
    thread.setAttribute('y2', bobY.toFixed(2));
    for (const bob of bobs) bob.setAttribute('transform', `translate(${PIVOT_X} ${bobY.toFixed(2)})`);
    if (arc) {
      if (Math.abs(degrees) < 0.4) {
        arc.setAttribute('d', '');
      } else {
        const rad = (degrees * Math.PI) / 180;
        const endX = PIVOT_X + ARC_RADIUS * Math.sin(rad);
        const endY = PIVOT_Y + ARC_RADIUS * Math.cos(rad);
        const sweep = degrees > 0 ? 1 : 0;
        arc.setAttribute(
          'd',
          `M ${PIVOT_X} ${PIVOT_Y + ARC_RADIUS} A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 ${sweep} ${endX.toFixed(2)} ${endY.toFixed(2)}`
        );
      }
    }
    container.dataset.psimAngle = degrees.toFixed(1);
  }

  function renderReadout() {
    const degrees = (state.theta * 180) / Math.PI;
    readout.time.textContent = formatTime(state.t);
    readout.theta.textContent = formatAngle(degrees);
    if (readout.period) readout.period.textContent = formatPeriod(meter.period);
    if (readout.ideal) readout.ideal.textContent = formatPeriod(periodSmallAngle(params.lengthM));
    if (readout.length) readout.length.textContent = formatLengthCm(params.lengthM);
    if (readout.amplitude) readout.amplitude.textContent = formatAngle(params.amplitudeDeg);
    if (readout.damping) readout.damping.textContent = formatDamping(params.damping);
  }

  function setStatus(nextMode, text) {
    mode = nextMode;
    container.dataset.psimState = nextMode;
    if (statusLine) statusLine.textContent = text;
    toggleButton.textContent = nextMode === 'running' ? 'Pause' : 'Start';
    toggleButton.setAttribute('aria-pressed', String(nextMode === 'running'));
  }

  function idleStatus() {
    if (reduced) {
      return `Reduzierte Bewegung aktiv: Das Pendel rückt nur auf Klick um ${formatNumber(REDUCED_STEP_SECONDS, 1)} s vor.`;
    }
    return `Ruhelage bei ${formatAngle(params.amplitudeDeg)}. Start setzt die Bewegung in Gang.`;
  }

  function render() {
    renderScene();
    renderReadout();
  }

  // --- Simulation ---------------------------------------------------------

  function resetState() {
    state = createState(params);
    meter = createPeriodMeter();
    lastFrameTime = 0;
    render();
  }

  function settleIfResting() {
    if (!running || params.damping <= 0) return;
    if (Math.abs(state.theta) < SIM.settleAngle && Math.abs(state.omega) < SIM.settleOmega) {
      stop('settled', `Zur Ruhe gekommen nach ${formatTime(state.t)}. Die Dämpfung hat die Bewegung aufgebraucht.`);
    }
  }

  function frame(now) {
    if (!running || destroyed) return;
    if (!lastFrameTime) {
      lastFrameTime = now;
      rafId = win.requestAnimationFrame(frame);
      return;
    }
    const elapsed = (now - lastFrameTime) / 1000;
    lastFrameTime = now;
    const previous = state;
    state = advance(state, params, elapsed);
    meter = updatePeriodMeter(meter, previous, state);
    render();
    settleIfResting();
    if (running && !destroyed) rafId = win.requestAnimationFrame(frame);
  }

  function start() {
    if (destroyed || running) return;
    if (mode === 'settled') resetState();
    running = true;
    lastFrameTime = 0;
    setStatus(
      'running',
      `Läuft: ${formatAngle(params.amplitudeDeg)} Startauslenkung, ${formatLengthCm(params.lengthM)} Fadenlänge.`
    );
    rafId = win.requestAnimationFrame(frame);
  }

  function stop(nextMode = 'paused', text = null) {
    running = false;
    if (rafId) {
      win.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    setStatus(nextMode, text || `Pausiert bei ${formatTime(state.t)}. Start setzt die Bewegung fort.`);
  }

  function stepReduced() {
    if (destroyed) return;
    if (mode === 'settled') resetState();
    const chunks = Math.round(REDUCED_STEP_SECONDS / SIM.maxFrameSeconds);
    for (let i = 0; i < chunks; i += 1) {
      const previous = state;
      state = advance(state, params, SIM.maxFrameSeconds);
      meter = updatePeriodMeter(meter, previous, state);
      settleIfResting();
    }
    if (mode !== 'settled') {
      setStatus(
        'paused',
        `Schritt ausgeführt: ${formatTime(state.t)} simuliert, Auslenkung ${formatAngle((state.theta * 180) / Math.PI)}.`
      );
    }
    render();
  }

  function toggle() {
    if (destroyed) return;
    if (running) stop();
    else if (reduced) stepReduced();
    else start();
  }

  // --- Regler -------------------------------------------------------------

  function readParams() {
    return normalizeParams({
      lengthM: Number(lengthInput.value) / 100,
      amplitudeDeg: Number(amplitudeInput.value),
      damping: Number(dampingInput.value),
    });
  }

  function onInitialParameterChange() {
    const wasRunning = running;
    if (wasRunning) {
      running = false;
      if (rafId) win.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    params = readParams();
    resetState();
    if (wasRunning && !reduced) start();
    else {
      setStatus(wasRunning ? 'paused' : 'idle', idleStatus());
      render();
    }
  }

  function onDampingChange() {
    params = readParams();
    render();
  }

  function onStyleChange(event) {
    const target = event.target;
    if (!target || target.name !== 'psimStyle') return;
    const style = PENDEL_STYLES.includes(target.value) ? target.value : PENDEL_STYLES[0];
    for (const bob of bobs) {
      if (bob.getAttribute('data-psim-bob') === style) bob.setAttribute('data-active', '');
      else bob.removeAttribute('data-active');
    }
    container.dataset.psimStyle = style;
  }

  function onSceneKeydown(event) {
    if (event.target !== scene) return;
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    toggle();
  }

  function applyMotionMode() {
    reduced = Boolean(motion && motion.matches);
    stepButton.hidden = !reduced;
    toggleButton.hidden = reduced;
    container.dataset.psimMotion = reduced ? 'reduced' : 'full';
    scene.setAttribute(
      'aria-label',
      reduced
        ? 'Pendelbühne. Leertaste oder Eingabetaste rückt um 0,5 Sekunden vor.'
        : 'Pendelbühne. Leertaste oder Eingabetaste startet und pausiert.'
    );
    if (reduced && running) stop('paused', 'Reduzierte Bewegung: die laufende Animation wurde angehalten.');
    else if (mode !== 'running') setStatus(mode, idleStatus());
  }

  function onHashChange() {
    const hash = win.location ? win.location.hash : '';
    if (!hash.startsWith('#pendeln/labor')) destroy();
  }

  // --- Aufbau -------------------------------------------------------------

  lengthInput.addEventListener('input', onInitialParameterChange);
  amplitudeInput.addEventListener('input', onInitialParameterChange);
  dampingInput.addEventListener('input', onDampingChange);
  toggleButton.addEventListener('click', toggle);
  resetButton.addEventListener('click', () => {
    if (running) stop('paused', 'Zurückgesetzt.');
    params = readParams();
    resetState();
    setStatus('idle', idleStatus());
  });
  stepButton.addEventListener('click', stepReduced);
  container.addEventListener('change', onStyleChange);
  scene.addEventListener('keydown', onSceneKeydown);
  win.addEventListener('hashchange', onHashChange);
  win.addEventListener('pagehide', onHashChange);
  if (motion && typeof motion.addEventListener === 'function') motion.addEventListener('change', applyMotionMode);

  container.dataset.psimStyle = 'klassisch';
  applyMotionMode();
  setStatus('idle', idleStatus());
  render();

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    running = false;
    if (rafId) {
      win.cancelAnimationFrame(rafId);
      rafId = 0;
    }
    lengthInput.removeEventListener('input', onInitialParameterChange);
    amplitudeInput.removeEventListener('input', onInitialParameterChange);
    dampingInput.removeEventListener('input', onDampingChange);
    toggleButton.removeEventListener('click', toggle);
    stepButton.removeEventListener('click', stepReduced);
    container.removeEventListener('change', onStyleChange);
    scene.removeEventListener('keydown', onSceneKeydown);
    win.removeEventListener('hashchange', onHashChange);
    win.removeEventListener('pagehide', onHashChange);
    if (motion && typeof motion.removeEventListener === 'function')
      motion.removeEventListener('change', applyMotionMode);
    delete container.dataset.psimState;
  }

  return {
    destroy,
    getState: () => ({ ...state }),
    getPeriod: () => meter.period,
    isRunning: () => running,
  };
}
