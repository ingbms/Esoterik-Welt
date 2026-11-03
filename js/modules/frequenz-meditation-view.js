// Ansicht „Meditationssitzung“ (P10, ADR-Nachtrag §13).
//
// Eine Sitzung ist ein Timer mit einem Klangpreset aus der Allowlist, einer
// Ein- und Ausblendung und lokalen Favoriten. Es gibt keine Registrierung,
// keine Cloud, keine Übertragung von Nutzungsdaten und keine Wirkversprechen.
//
// Audio entsteht ausschließlich im Klick auf „Sitzung starten“ oder
// „Fortsetzen“ (NFR-12). Beim Verlassen der Seite, beim Tabwechsel und beim
// Wechsel in eine andere Ansicht stoppt der Ton; die Restzeit wird – wenn
// localStorage verfügbar ist – lokal als Wiederaufnahme angeboten.
import { FREQUENCY_LIMITS } from './frequenz-engine.js';
import {
  DEFAULT_SESSION,
  DURATION_OPTIONS,
  FADE_OPTIONS,
  MAX_FAVORITES,
  MAX_NAME_LENGTH,
  SESSION_PRESETS,
  createMeditationStore,
  fadeGainSteps,
  findPreset,
  formatClock,
  nextFavoriteId,
  presetNeedsHeadphones,
  remainingSeconds,
  summarizeSession,
  validateSession,
} from './frequenz-meditation-model.js';

const ENGINE_ERROR_TEXTS = Object.freeze({
  unsupported: 'Dieser Browser unterstützt die Web Audio API nicht. Die Sitzung zeigt nur den Timer.',
  context_blocked: 'Der Browser hat die Audioausgabe blockiert. Bitte erneut auf „Sitzung starten“ tippen.',
  context_closed: 'Die Audioausgabe ist beendet. Bitte die Seite neu laden.',
  internal: 'Die Audioausgabe ist fehlgeschlagen. Bitte erneut versuchen.',
});

const TICK_MS = 250;
const FADE_STEP_MS = 100;

function formatDb(value) {
  return `${Number(value).toLocaleString('de-DE', { maximumFractionDigits: 0 })} dBFS`;
}

function optionList(values, selected, label) {
  return values
    .map((value) => `<option value="${value}"${value === selected ? ' selected' : ''}>${label(value)}</option>`)
    .join('');
}

export class MeditationView {
  /**
   * @param {HTMLElement} root Zielcontainer im Frequenzbereich
   * @param {{ engine: object, reducedMotion?: boolean, cymatics?: boolean, onSessionEnd?: () => void }} options
   */
  constructor(root, { engine, reducedMotion = false, cymatics = false } = {}) {
    this.root = root;
    this.engine = engine;
    this.reducedMotion = Boolean(reducedMotion);
    this.cymatics = Boolean(cymatics);
    this.store = createMeditationStore();
    this.stored = this.store.read();
    this.session = null;
    this.refs = {};
    this.timer = 0;
    this.fadeTimer = 0;
    this.lastAnnounce = 0;
    this.nextPresetId = DEFAULT_SESSION.presetId;
  }

  /* ------------------------------------------------------------------ Aufbau */

  navHtml() {
    const link = (href, label, current = false) =>
      `<a href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="fq-nav" aria-label="Frequenzbereich">
      ${link('#frequenzen', '← Bibliothek')}
      ${link('#frequenzen/labor', 'Frequenzlabor')}
      ${this.cymatics ? link('#frequenzen/cymatics', 'Chladni-Muster') : ''}
      ${link('#frequenzen/meditation', 'Meditation', true)}
    </nav>`;
  }

  render() {
    const presetGroups = {
      tone: SESSION_PRESETS.filter((preset) => preset.mode === 'tone'),
      binaural: SESSION_PRESETS.filter((preset) => preset.mode === 'binaural'),
    };
    const presetOptions = [
      `<optgroup label="Einzeltöne">${presetGroups.tone
        .map(
          (preset) =>
            `<option value="${preset.id}"${preset.id === this.nextPresetId ? ' selected' : ''}>${preset.label}</option>`
        )
        .join('')}</optgroup>`,
      `<optgroup label="Binaurale Differenz (Kopfhörer nötig)">${presetGroups.binaural
        .map(
          (preset) =>
            `<option value="${preset.id}"${preset.id === this.nextPresetId ? ' selected' : ''}>${preset.label}</option>`
        )
        .join('')}</optgroup>`,
    ].join('');

    this.root.innerHTML = `
      ${this.navHtml()}
      <section class="fq-section" aria-labelledby="fqMedTitle">
        <div class="fq-section-head">
          <h2 id="fqMedTitle">Meditationssitzung</h2>
          <p class="label">Timer · Einzeltöne oder binaurale Differenz</p>
        </div>
        <p class="fq-lede">
          Eine Sitzung ist ein Timer mit einem Ton, einer Ein- und einer Ausblendung. Alles bleibt auf diesem Gerät:
          keine Anmeldung, keine Cloud, keine Übertragung von Nutzungsdaten.
        </p>
      </section>
      <div class="fq-med">
        <div class="fq-med-form">
          <div class="fq-field">
            <label class="fq-field" for="fqMedDuration">Dauer</label>
            <select id="fqMedDuration" class="select">
              ${optionList(DURATION_OPTIONS, Math.round(DEFAULT_SESSION.durationSeconds / 60), (value) => `${value} Minuten`)}
            </select>
          </div>
          <div class="fq-field">
            <label class="fq-field" for="fqMedPreset">Klangpreset</label>
            <select id="fqMedPreset" class="select">${presetOptions}</select>
          </div>
          <div class="fq-field">
            <label class="fq-field" for="fqMedFadeIn">Einblenden</label>
            <select id="fqMedFadeIn" class="select">
              ${optionList(FADE_OPTIONS, DEFAULT_SESSION.fadeInSeconds, (value) => (value === 0 ? 'ohne' : `${value} s`))}
            </select>
          </div>
          <div class="fq-field">
            <label class="fq-field" for="fqMedFadeOut">Ausblenden</label>
            <select id="fqMedFadeOut" class="select">
              ${optionList(FADE_OPTIONS, DEFAULT_SESSION.fadeOutSeconds, (value) => (value === 0 ? 'ohne' : `${value} s`))}
            </select>
          </div>
        </div>
        <div class="fq-med-transport">
          <button type="button" class="btn btn-primary" id="fqMedStart">Sitzung starten</button>
          <button type="button" class="btn btn-secondary" id="fqMedStop" disabled>Sitzung beenden</button>
          <p class="fq-med-timer" id="fqMedTimer" role="timer" aria-live="off">${formatClock(DEFAULT_SESSION.durationSeconds)}</p>
          <p class="fq-note" id="fqMedPresetNote"></p>
        </div>
        <p class="fq-status" id="fqMedStatus" role="status" aria-live="polite"></p>
        <p class="fq-error" id="fqMedError" role="alert" hidden></p>
        <div class="fq-med-resume" id="fqMedResume" hidden>
          <p>Unterbrochene Sitzung: <span id="fqMedResumeText"></span></p>
          <div class="fq-actions">
            <button type="button" class="btn btn-secondary btn-sm" id="fqMedResumeStart">Fortsetzen</button>
            <button type="button" class="btn btn-ghost btn-sm" id="fqMedResumeDiscard">Verwerfen</button>
          </div>
        </div>
        <section class="fq-section" aria-labelledby="fqMedFavTitle">
          <h2 id="fqMedFavTitle">Lokale Favoriten</h2>
          <p class="fq-note">
            Favoriten liegen ausschließlich im localStorage dieses Browsers (Schlüssel
            <span class="fq-mono">esoterik-welt:frequenzlabor:meditation:v1</span>). Sie verlassen das Gerät nicht und
            lassen sich jederzeit über die Browser-Einstellungen löschen.
          </p>
          <ul class="fq-favorites" id="fqMedFavorites"></ul>
          <p class="fq-empty" id="fqMedFavoritesEmpty" hidden>Noch keine Favoriten gespeichert.</p>
          <div class="fq-field-row fq-field-row--inline">
            <label class="fq-field" for="fqMedFavName">Name für die aktuellen Einstellungen</label>
            <input type="text" id="fqMedFavName" class="input" maxlength="${MAX_NAME_LENGTH}" autocomplete="off" />
          </div>
          <p class="fq-actions">
            <button type="button" class="btn btn-secondary btn-sm" id="fqMedFavSave">Einstellungen speichern</button>
          </p>
        </section>
        <section class="fq-section fq-hinweis" aria-labelledby="fqMedSafetyTitle">
          <h2 id="fqMedSafetyTitle">Hinweise</h2>
          <ul class="fq-prose fq-list">
            <li>Kein Medizinprodukt, keine Heilversprechen. Die Töne sind Hörangebote, keine Behandlung.</li>
            <li>Tief starten, Gehör schützen, Pausen machen. Der Pegel bleibt auf ${formatDb(FREQUENCY_LIMITS.defaultGainDb)} begrenzt; die harte Grenze des Labors ist ${formatDb(FREQUENCY_LIMITS.hardCapGainDb)}.</li>
            <li>Binaurale Differenzen sind nur mit Kopfhörern hörbar; eine EEG-Wirkung ist damit nicht belegt.</li>
            <li>Der Ton stoppt beim Verlassen der Seite, beim Tabwechsel und am Ende der Sitzung.</li>
            <li>Ohne localStorage (Datenschutzmodus, <span class="fq-mono">file://</span> in einigen Browsern) bleiben Sitzung und Timer nutzbar; Favoriten und Fortsetzen entfallen.</li>
          </ul>
        </section>
      </div>
    `;

    const byId = (id) => document.getElementById(id);
    this.refs = {
      duration: byId('fqMedDuration'),
      preset: byId('fqMedPreset'),
      fadeIn: byId('fqMedFadeIn'),
      fadeOut: byId('fqMedFadeOut'),
      start: byId('fqMedStart'),
      stop: byId('fqMedStop'),
      timer: byId('fqMedTimer'),
      presetNote: byId('fqMedPresetNote'),
      status: byId('fqMedStatus'),
      error: byId('fqMedError'),
      resume: byId('fqMedResume'),
      resumeText: byId('fqMedResumeText'),
      resumeStart: byId('fqMedResumeStart'),
      resumeDiscard: byId('fqMedResumeDiscard'),
      favorites: byId('fqMedFavorites'),
      favoritesEmpty: byId('fqMedFavoritesEmpty'),
      favName: byId('fqMedFavName'),
      favSave: byId('fqMedFavSave'),
    };
    this.bind();
    this.renderFavorites();
    this.renderResume();
    this.renderPresetNote();
    this.syncControls();
  }

  bind() {
    this.refs.start.addEventListener('click', () => this.startSession(null));
    this.refs.stop.addEventListener('click', () => this.stopSession());
    this.refs.preset.addEventListener('change', () => this.renderPresetNote());
    this.refs.duration.addEventListener('change', () => {
      if (!this.session) this.refs.timer.textContent = formatClock(this.readForm().durationSeconds);
    });
    this.refs.resumeStart.addEventListener('click', () => this.startSession(this.stored.resume));
    this.refs.resumeDiscard.addEventListener('click', () => {
      this.stored = { ...this.stored, resume: null };
      this.store.write({ favorites: this.stored.favorites, resume: null });
      this.renderResume();
      this.announce('Wiederaufnahme verworfen.');
    });
    this.refs.favSave.addEventListener('click', () => this.saveFavorite());
    this.refs.favorites.addEventListener('click', (event) => {
      const load = event.target.closest('[data-fav-load]');
      const remove = event.target.closest('[data-fav-delete]');
      if (load) this.loadFavorite(load.getAttribute('data-fav-load'));
      else if (remove) this.deleteFavorite(remove.getAttribute('data-fav-delete'));
    });
  }

  /* -------------------------------------------------------------- Formular */

  readForm() {
    return {
      durationSeconds: Number(this.refs.duration.value) * 60,
      presetId: this.refs.preset.value,
      fadeInSeconds: Number(this.refs.fadeIn.value),
      fadeOutSeconds: Number(this.refs.fadeOut.value),
    };
  }

  fillForm(config) {
    this.refs.duration.value = String(Math.round(config.durationSeconds / 60));
    this.refs.preset.value = config.presetId;
    this.refs.fadeIn.value = String(config.fadeInSeconds);
    this.refs.fadeOut.value = String(config.fadeOutSeconds);
    this.renderPresetNote();
    if (!this.session) this.refs.timer.textContent = formatClock(config.durationSeconds);
  }

  renderPresetNote() {
    const preset = findPreset(this.refs.preset.value);
    if (!this.refs.presetNote || !preset) return;
    this.refs.presetNote.textContent = presetNeedsHeadphones(preset)
      ? `${preset.label}: zwei kanalgetrennte Töne, nur mit Kopfhörern hörbar. Keine belegte EEG-Wirkung.`
      : `${preset.label}: einzelner Sinuston. Die Zuordnung ist eine Konvention, keine Wirkaussage.`;
  }

  showError(message) {
    if (this.refs.error) {
      this.refs.error.textContent = message;
      this.refs.error.hidden = false;
    }
  }

  clearError() {
    if (this.refs.error) this.refs.error.hidden = true;
  }

  announce(message) {
    if (!this.refs.status || !message) return;
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - this.lastAnnounce));
    const apply = () => {
      this.refs.status.textContent = message;
      this.lastAnnounce = Date.now();
    };
    if (wait === 0) apply();
    else setTimeout(apply, wait);
  }

  /* ------------------------------------------------------------- Sitzungen */

  syncControls() {
    const running = Boolean(this.session);
    if (this.refs.start) this.refs.start.disabled = running;
    if (this.refs.stop) this.refs.stop.disabled = !running;
    for (const control of [this.refs.duration, this.refs.preset, this.refs.fadeIn, this.refs.fadeOut]) {
      if (control) control.disabled = running;
    }
    if (this.refs.resumeStart) this.refs.resumeStart.disabled = running;
  }

  renderTimer(seconds) {
    if (this.refs.timer) this.refs.timer.textContent = formatClock(seconds);
  }

  async startSession(resume) {
    if (this.session) return;
    let config;
    try {
      config = validateSession(resume ? resume : this.readForm());
    } catch (error) {
      this.showError(error.message);
      return;
    }
    const preset = findPreset(config.presetId);
    if (!preset) {
      this.showError('Dieses Klangpreset ist nicht verfügbar.');
      return;
    }
    this.clearError();
    const total = resume ? resume.remainingSeconds : config.durationSeconds;
    this.session = {
      config,
      preset,
      totalSeconds: total,
      startedAtMs: performance.now(),
      announcedMinute: false,
    };
    this.syncControls();
    this.renderTimer(total);
    if (resume) {
      this.stored = { ...this.stored, resume: null };
      this.store.write({ favorites: this.stored.favorites, resume: null });
      this.renderResume();
    }

    const targetDb = FREQUENCY_LIMITS.defaultGainDb;
    const startDb = config.fadeInSeconds > 0 ? FREQUENCY_LIMITS.minGainDb : targetDb;
    try {
      this.engine.setGain(startDb);
      if (preset.mode === 'binaural') {
        await this.engine.playBinaural({
          carrierHz: preset.carrierHz,
          deltaHz: preset.deltaHz,
          gainDb: startDb,
          fadeInMs: 20,
        });
      } else {
        await this.engine.play(preset.hz, { waveform: 'sine', gainDb: startDb, fadeInMs: 20 });
      }
    } catch (error) {
      this.session = null;
      this.syncControls();
      const code = error && error.code ? error.code : 'internal';
      this.showError(ENGINE_ERROR_TEXTS[code] || ENGINE_ERROR_TEXTS.internal);
      return;
    }

    this.runFade(config.fadeInSeconds, targetDb, 'in');
    this.announce(
      `Sitzung gestartet: ${Math.round(total / 60) === 0 ? 'weniger als eine Minute' : `${Math.round(total / 60)} Minuten`}, ${preset.label}.`
    );
    this.startTimer();
  }

  startTimer() {
    clearInterval(this.timer);
    const tick = () => {
      if (!this.session) return;
      const left = remainingSeconds(this.session.startedAtMs, this.session.totalSeconds, performance.now());
      this.renderTimer(left);
      if (!this.session.announcedMinute && left <= 60) {
        this.session.announcedMinute = true;
        if (left > 0) this.announce('Noch eine Minute.');
      }
      if (left <= 0) this.finishSession();
    };
    tick();
    this.timer = setInterval(tick, TICK_MS);
  }

  runFade(seconds, targetDb, direction) {
    clearInterval(this.fadeTimer);
    this.fadeTimer = 0;
    const steps = fadeGainSteps({ targetDb, seconds, stepMs: FADE_STEP_MS, direction });
    if (steps.length <= 1) {
      this.safeGain(targetDb);
      return;
    }
    let index = 0;
    this.fadeTimer = setInterval(() => {
      index += 1;
      if (index >= steps.length) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = 0;
        return;
      }
      this.safeGain(steps[index]);
    }, FADE_STEP_MS);
  }

  safeGain(db) {
    try {
      this.engine.setGain(db);
    } catch {
      // Engine beendet: der Timer läuft weiter, Audio ist bereits weg.
    }
  }

  finishSession() {
    if (!this.session) return;
    const seconds = this.session.config.fadeOutSeconds;
    this.stopAudio(seconds);
    this.session = null;
    this.renderTimer(0);
    this.clearResume(true);
    this.syncControls();
    this.announce('Sitzung beendet.');
  }

  stopSession() {
    if (!this.session) return;
    this.stopAudio(this.session.config.fadeOutSeconds);
    this.session = null;
    clearInterval(this.timer);
    this.clearResume(true);
    this.syncControls();
    this.announce('Sitzung beendet.');
  }

  stopAudio(fadeOutSeconds) {
    clearInterval(this.timer);
    clearInterval(this.fadeTimer);
    this.fadeTimer = 0;
    const targetDb = FREQUENCY_LIMITS.defaultGainDb;
    const steps = fadeGainSteps({ targetDb, seconds: fadeOutSeconds, stepMs: FADE_STEP_MS, direction: 'out' });
    if (steps.length <= 1) {
      this.engine.stop().catch(() => {});
      return;
    }
    let index = 0;
    this.fadeTimer = setInterval(() => {
      index += 1;
      if (index >= steps.length) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = 0;
        this.engine.stop().catch(() => {});
        return;
      }
      this.safeGain(steps[index]);
    }, FADE_STEP_MS);
  }

  /**
   * Wird vom Controller gerufen, bevor er Audio stoppt (Tabwechsel,
   * pagehide, Verlassen der Ansicht). Sichert die Restzeit lokal.
   */
  onInterrupt() {
    if (!this.session) return;
    const left = remainingSeconds(this.session.startedAtMs, this.session.totalSeconds, performance.now());
    const config = this.session.config;
    this.session = null;
    clearInterval(this.timer);
    clearInterval(this.fadeTimer);
    this.fadeTimer = 0;
    if (left > 0) this.store.write({ favorites: this.stored.favorites, resume: { ...config, remainingSeconds: left } });
    this.stored = this.store.read();
    this.syncControls();
    this.renderResume();
    this.announce('Sitzung unterbrochen. Fortsetzen ist möglich.');
  }

  /* ------------------------------------------------------------- Favoriten */

  renderFavorites() {
    if (!this.refs.favorites || !this.refs.favoritesEmpty) return;
    this.refs.favorites.textContent = '';
    const favorites = this.stored.favorites || [];
    this.refs.favoritesEmpty.hidden = favorites.length > 0;
    for (const favorite of favorites) {
      const item = document.createElement('li');
      item.className = 'fq-favorite';
      const text = document.createElement('span');
      text.textContent = `${favorite.name} — ${summarizeSession(favorite)}`;
      const load = document.createElement('button');
      load.type = 'button';
      load.className = 'btn btn-ghost btn-sm';
      load.setAttribute('data-fav-load', favorite.id);
      load.textContent = 'Laden';
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.className = 'btn btn-ghost btn-sm';
      remove.setAttribute('data-fav-delete', favorite.id);
      remove.textContent = 'Entfernen';
      item.append(text, load, remove);
      this.refs.favorites.append(item);
    }
  }

  renderResume() {
    const resume = this.stored ? this.stored.resume : null;
    if (!this.refs.resume) return;
    this.refs.resume.hidden = !resume;
    if (resume && this.refs.resumeText) {
      this.refs.resumeText.textContent = `${formatClock(resume.remainingSeconds)} übrig, ${summarizeSession(resume)}.`;
    }
  }

  saveFavorite() {
    if (!this.stored.available) {
      this.showError('localStorage ist blockiert. Favoriten können in diesem Browser nicht gespeichert werden.');
      return;
    }
    const name = (this.refs.favName.value || '').replace(/\s+/g, ' ').trim();
    if (!name) {
      this.showError('Bitte einen Namen für den Favoriten eingeben.');
      this.refs.favName.focus();
      return;
    }
    if (this.stored.favorites.length >= MAX_FAVORITES) {
      this.showError(`Es sind höchstens ${MAX_FAVORITES} Favoriten möglich. Bitte zuerst einen entfernen.`);
      return;
    }
    let config;
    try {
      config = validateSession(this.readForm());
    } catch (error) {
      this.showError(error.message);
      return;
    }
    const favorite = {
      id: nextFavoriteId(this.stored.favorites),
      name: name.slice(0, MAX_NAME_LENGTH),
      ...config,
    };
    const ok = this.store.write({ favorites: [...this.stored.favorites, favorite], resume: this.stored.resume });
    if (!ok) {
      this.showError('Der Favorit konnte nicht gespeichert werden (localStorage blockiert).');
      return;
    }
    this.stored = this.store.read();
    this.clearError();
    this.refs.favName.value = '';
    this.renderFavorites();
    this.announce(`Favorit gespeichert: ${favorite.name}.`);
  }

  loadFavorite(id) {
    const favorite = this.stored.favorites.find((entry) => entry.id === id);
    if (!favorite) return;
    this.fillForm(favorite);
    this.announce(`Favorit geladen: ${favorite.name}.`);
  }

  deleteFavorite(id) {
    const favorite = this.stored.favorites.find((entry) => entry.id === id);
    if (!favorite) return;
    const ok = this.store.write({
      favorites: this.stored.favorites.filter((entry) => entry.id !== id),
      resume: this.stored.resume,
    });
    if (!ok) {
      this.showError('Der Favorit konnte nicht entfernt werden (localStorage blockiert).');
      return;
    }
    this.stored = this.store.read();
    this.renderFavorites();
    this.announce(`Favorit entfernt: ${favorite.name}.`);
  }

  clearResume(alsoStore) {
    this.stored = { ...this.stored, resume: null };
    if (alsoStore) this.store.write({ favorites: this.stored.favorites, resume: null });
    this.renderResume();
  }

  /* ---------------------------------------------------------------- Abbau */

  dispose() {
    if (this.session) {
      const left = remainingSeconds(this.session.startedAtMs, this.session.totalSeconds, performance.now());
      if (left > 0) {
        this.store.write({
          favorites: this.stored.favorites,
          resume: { ...this.session.config, remainingSeconds: left },
        });
      }
    }
    this.session = null;
    clearInterval(this.timer);
    clearInterval(this.fadeTimer);
    this.timer = 0;
    this.fadeTimer = 0;
    this.refs = {};
  }
}
