// Frequenzlabor: Controller und View (ADR-0001 §6.2/§8).
//
// Der Controller hält den UI-Zustand, die Engine ist der autoritative
// Audiozustand. Die Ansicht wird aus dem Modul gerendert; die Hülle in
// index.html bleibt ohne JavaScript lesbar (`<noscript>`).
import { FREQUENCY_LIMITS, getFrequencyEngine } from './frequenz-engine.js';
import { activeFeatures } from './frequenz-flags.js';
import {
  BINAURAL_PRESETS,
  EVIDENZ_STUFEN,
  createPreferenceStore,
  formatHz,
  formatRange,
  loadFrequencies,
} from './frequenz-presets.js';
import { FrequenzVisualisierung } from './frequenz-visualisierung.js';
import { renderViewNav } from './frequenz-nav.js';
import { renderMarkdown, escapeHtml } from './markdown-lite.js';

const WAVEFORMS = Object.freeze([
  ['sine', 'Sinus'],
  ['triangle', 'Dreieck'],
  ['square', 'Rechteck'],
  ['sawtooth', 'Sägezahn'],
]);

// Fehlercodes → deutsche Texte (ADR §4.7, verbindlich).
const ERROR_TEXTS = Object.freeze({
  unsupported: 'Dieser Browser unterstützt die Web Audio API nicht. Das Frequenzlabor zeigt die Inhalte ohne Ton.',
  context_blocked: 'Der Browser hat die Audioausgabe blockiert. Bitte erneut auf „Ton starten“ tippen.',
  context_closed: 'Die Audioausgabe ist beendet. Bitte die Seite neu laden.',
  invalid_frequency: 'Diese Frequenz ist ungültig. Erlaubt sind 20 bis 20.000 Hz.',
  invalid_argument: 'Einstellung nicht gültig.',
  invalid_state: 'Diese Aktion ist in der aktuellen Betriebsart nicht verfügbar.',
  internal: 'Die Audioausgabe ist fehlgeschlagen. Bitte erneut versuchen.',
});

const STATE_TEXTS = Object.freeze({
  idle: 'bereit',
  starting: 'startet …',
  running: 'läuft',
  unsupported: 'ohne Ton',
  error: 'Fehler',
  disposed: 'beendet',
});

const DISCLAIMER_FALLBACK = Object.freeze({
  kurz: 'Bildungs- und Experimentierangebot, kein Medizinprodukt. Keine Heil- oder Gesundheitsversprechen. Leise hören, Pausen machen.',
  lang: 'Dieses Frequenzlabor ist ein Bildungs- und Experimentierangebot. Es ersetzt keine ärztliche Beratung, Diagnose oder Behandlung und ist kein Medizinprodukt. Aus der Wiedergabe von Tönen werden keine Heil-, Gesundheits- oder Wirkversprechen abgeleitet. Höre nur bei angenehmer Lautstärke, beginne leise und mache regelmäßig Pausen.',
});

const SPEED_OF_SOUND_M_S = 343; // Luft bei 20 °C, gerundet (OpenStax College Physics 2e).

// Das Quellendokument liegt als Markdown im Repository. Relative Ziele werden
// für die Ansicht auf den Build umgeschrieben; was nicht mit ausgeliefert wird
// (tests/, scripts/), verweist auf die öffentliche Quelle im Repository.
const REPOSITORY_BLOB = 'https://github.com/ingbms/Esoterik-Welt/blob/main/';

function resolveDocHref(href) {
  if (/^\.\.\/(?:tests|scripts)\//.test(href)) return REPOSITORY_BLOB + href.replace(/^\.\.\//, '');
  return href.replace(/^\.\.\//, '');
}

// Statisches Erklärstück (<= 400 Wörter). Quellen sind im Datenbestand und in
// docs/frequenz-quellen.md belegt; die Links zeigen auf die Primärquellen.
const EXPLAIN_HTML = `
  <p class="fq-lede">
    Eine Schwingung ist eine periodische Änderung um einen Ruhewert. Ihre Frequenz gibt an, wie oft
    sich dieser Vorgang pro Sekunde wiederholt; die Einheit ist Hertz (Hz), also „einmal pro Sekunde“.
    Es gilt <span class="fq-formula">f = 1 / T</span>: Eine Periode von 2,27 ms entspricht 440 Hz.
  </p>
  <div class="fq-prose">
    <h3>Schall ist Druck, nicht Zahl</h3>
    <p>
      Hörbarer Schall ist eine Druckschwankung in der Luft. Ihre Wellenlänge folgt aus der Schallgeschwindigkeit:
      <span class="fq-formula">λ = c / f</span>. Bei 20 °C und rund 343 m/s ist ein 440-Hz-Ton etwa 78 cm lang,
      ein 20-kHz-Ton nur 1,7 cm. Der übliche Hörbereich liegt zwischen etwa 20 Hz und 20 kHz; die Grenzen sind
      Konventionen und weichen individuell ab. Unter 20 Hz spricht man von Infraschall – unhörbar ist er deshalb
      nicht, sondern nur nicht genormt hörbar (<a href="https://openstax.org/books/college-physics-2e/pages/17-6-hearing" target="_blank" rel="noopener noreferrer">OpenStax, Hearing</a>).
    </p>
    <h3>Überlagerung und Schwebung</h3>
    <p>
      Zwei Töne addieren sich als Wellen. Liegen sie dicht beieinander, schwillt die Lautstärke mit der Differenz
      der beiden Frequenzen: 440 Hz und 444 Hz ergeben viermal pro Sekunde einen Schweller, also 4 Hz
      (<a href="https://openstax.org/books/college-physics-2e/pages/16-10-superposition-and-interference" target="_blank" rel="noopener noreferrer">OpenStax, Superposition</a>).
      Das ist Akustik und keine Hirnleistung. Werden die Töne getrennt auf beide Ohren gegeben, entsteht ein
      Differenzton im Hörsystem; seine Wahrnehmung ist belegt, eine dauerhafte Wirkung auf Hirnwellen nicht.
    </p>
    <h3>Stimmton und Zuordnungen</h3>
    <p>
      Genormt ist genau eine Zahl: Das A über dem mittleren C ist seit ISO 16:1975 auf 440 Hz festgelegt
      (<a href="https://www.iso.org/standard/3601.html" target="_blank" rel="noopener noreferrer">ISO 16</a>).
      Andere Stimmungen wie 432 Hz sind historisch oder praktisch begründet, aber nicht gesundheitlich wirksamer.
      Planetenfrequenzen nach Cousto sind korrekt oktavierte Umlaufperioden – die Zahlen lassen sich nachrechnen,
      die zugeschriebenen Bedeutungen nicht. Schumann-Resonanzen (7,83 Hz) sind elektromagnetische Eigenmoden der
      Erde-Ionosphären-Kaverne und kein hörbarer Ton
      (<a href="https://science.nasa.gov/wp-content/uploads/2023/05/154_48a5766284d47dc2523cb38d856654f6_STOLCVIKTOR.pdf" target="_blank" rel="noopener noreferrer">NASA-White-Paper</a>).
    </p>
    <h3>Was daraus folgt</h3>
    <p>
      Eine Frequenz ist zuerst eine Messgröße. Ob eine Aussage darüber hinaus belegt ist, steht bei jedem Eintrag
      als Evidenzstatus – von „belegt“ bis „nicht belegt“. Das Labor macht Töne hörbar und Zahlen nachvollziehbar;
      es verspricht keine Wirkung.
    </p>
    <h3>Traditionelle Zuordnungen</h3>
    <p>
      Viele Frequenzlisten verbinden Töne mit Farben, Planeten oder Chakren. Diese Zuordnungen sind überliefert
      oder gesetzt und folgen keiner akustischen Notwendigkeit. Wer sie als Symbolsystem weiterlesen will, findet
      die Planeten- und Zeichendeutung im <a href="#astrologie">Astrologie-Bereich</a> und die Chakra-Zuordnung
      der Steine im <a href="#blog/3">Wissensartikel „Kristalle für jedes Chakra“</a>; der
      <a href="#crystals">Kristall-Katalog</a> filtert dieselben Steine nach Chakra und Farbe.
    </p>
  </div>
`;

function h(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === null || value === undefined || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'dataset') Object.assign(node.dataset, value);
    else if (key === 'html') node.innerHTML = value;
    else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (value === true) node.setAttribute(key, '');
    else node.setAttribute(key, String(value));
  }
  for (const child of Array.isArray(children) ? children : [children]) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child && child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function formatDb(value) {
  const rounded = Math.round(value);
  return `${rounded === 0 ? '0' : `−${Math.abs(rounded)}`} dBFS`;
}

export class FrequenzlaborModule {
  constructor(root) {
    this.root = root;
    this.features = activeFeatures();
    this.engine = getFrequencyEngine();
    this.store = createPreferenceStore();
    this.prefs = this.store.read();
    this.data = null;
    this.dataError = null;
    this.dataPromise = null;
    this.view = 'hub';
    this.filterKategorie = 'alle';
    this.filterEvidenz = 'alle';
    this.waveform = this.prefs.waveform || 'sine';
    this.gainDb = clamp(
      this.prefs.gainDb === null ? FREQUENCY_LIMITS.defaultGainDb : this.prefs.gainDb,
      FREQUENCY_LIMITS.minGainDb,
      FREQUENCY_LIMITS.hardCapGainDb
    );
    this.freqHz = clamp(
      this.prefs.freqHz || FREQUENCY_LIMITS.defaultHz,
      FREQUENCY_LIMITS.minHz,
      FREQUENCY_LIMITS.maxHz
    );
    this.carrierHz = this.prefs.binaural && this.prefs.binaural.carrierHz ? this.prefs.binaural.carrierHz : 200;
    this.deltaHz = this.prefs.binaural && this.prefs.binaural.deltaHz ? this.prefs.binaural.deltaHz : 8;
    this.sweepTimer = 0;
    this.sweepStartedAt = 0;
    this.sweepSeconds = 0;
    // Reine UI-Merke: „Pause“ ist stop() plus dieses Merkzeichen, es gibt
    // keinen dritten Audiozustand (ADR §4.4).
    this.paused = false;
    this.lastAnnounce = 0;
    this.announceTimer = 0;
    this.viz = null;
    this.refs = {};
    this.featureView = null;
    this.unsubscribe = null;
    installDebugHandle(this.engine);
    this.reducedMotionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.reducedMotion = Boolean(this.reducedMotionQuery && this.reducedMotionQuery.matches);
    this.onVisibility = () => {
      if (document.visibilityState === 'hidden') this.halt('Seite im Hintergrund — Ton gestoppt.');
    };
    this.onPageHide = () => this.halt(null);
    this.onMotionChange = (event) => {
      this.reducedMotion = event.matches;
      if (this.viz) {
        this.viz.setReducedMotion(this.reducedMotion);
        if (this.reducedMotion) {
          const status = this.engine.state.status;
          this.viz.render(this.engine.state);
          if (status === 'running' && this.refs.motionNote) this.refs.motionNote.hidden = false;
        } else if (this.engine.state.status === 'running') {
          this.viz.start(() => this.engine.state);
        }
      }
    };
  }

  /** Lädt die Presets (bei HTTP per fetch, offline aus dem eingebetteten JSON). */
  load() {
    if (!this.dataPromise) {
      this.dataPromise = loadFrequencies()
        .then((result) => {
          this.data = result;
          if (result.error) this.dataError = result.error;
          return result;
        })
        .catch((error) => {
          this.dataError = error && error.message ? error.message : 'Frequenzdaten nicht verfügbar';
          return { entries: [], rejected: 0, error: this.dataError, disclaimer: null, definitions: {} };
        });
    }
    return this.dataPromise;
  }

  async show(segments = [], query = '', { focus = true } = {}) {
    const segment = Array.isArray(segments) && segments[0] ? segments[0] : '';
    this.query = String(query || '');
    // Ansichten der Kategorie: Labor und Quellendokument sind immer verfügbar,
    // P9/P10 (ADR-Nachtrag §13) nur bei aktivem Feature-Flag. Unbekannte oder
    // deaktivierte Segmente rendern den Hub mit sichtbarem Hinweis.
    const known = ['labor', 'quellen', 'cymatics', 'meditation'];
    const enabled = (name) => name === 'labor' || name === 'quellen' || Boolean(this.features[name]);
    let nextView = 'hub';
    let notice = '';
    if (segment) {
      if (!known.includes(segment)) {
        notice = `„#frequenzen/${segment}“ ist keine eigene Ansicht. Du siehst die Bibliothek.`;
      } else if (!enabled(segment)) {
        notice = `„#frequenzen/${segment}“ ist in diesem Build nicht aktiviert. Du siehst die Bibliothek.`;
      } else {
        nextView = segment;
      }
    }
    const previousView = this.view;
    this.view = nextView;
    // Jeder Aufruf von show() baut die Kategorieansicht neu auf. Ein Ton aus
    // der bisherigen Ansicht gehört zu Bedienelementen, die gleich verschwinden
    // (ADR-Nachtrag §13.4, Doku §4.3): Er endet deshalb sofort, die Restzeit
    // einer Sitzung wird genau einmal gesichert. Ohne diesen Schritt bliebe ein
    // laufender Oszillator ohne Start/Stopp in der Zielansicht zurück.
    if ((previousView === 'labor' && nextView !== 'labor') || this.featureView || this.engine.state.status !== 'idle') {
      this.halt(null);
    }
    if (!this.unsubscribe) {
      this.unsubscribe = this.engine.subscribe((state) => this.onEngineState(state));
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('pagehide', this.onPageHide);
      if (this.reducedMotionQuery && this.reducedMotionQuery.addEventListener) {
        this.reducedMotionQuery.addEventListener('change', this.onMotionChange);
      }
    }
    await this.load();
    this.prefs = { ...this.prefs, view: nextView };
    this.store.write(this.prefs);
    if (nextView === 'labor') {
      this.disposeFeatureView();
      this.renderLab();
    } else if (nextView === 'quellen') {
      this.disposeFeatureView();
      await this.renderQuellen();
    } else if (nextView === 'cymatics') {
      await this.renderCymatics();
    } else if (nextView === 'meditation') {
      await this.renderMeditation();
    } else {
      this.disposeFeatureView();
      this.renderHub();
    }
    if (notice && this.refs.notice) {
      this.refs.notice.textContent = notice;
      this.refs.notice.hidden = false;
    }
    this.onEngineState(this.engine.state);
    if (focus) {
      const title = document.getElementById('frequenzen-title');
      if (title && typeof title.focus === 'function') title.focus({ preventScroll: true });
    }
  }

  /** Baut eine Ansicht der Folgestufe (P9/P10) lazy auf. */
  async renderCymatics() {
    this.disposeFeatureView();
    const { CymaticsView } = await import('./frequenz-cymatics-view.js');
    this.featureView = new CymaticsView(this.root, {
      reducedMotion: this.reducedMotion,
      meditation: this.features.meditation,
    });
    this.featureView.render();
    this.refs = { notice: document.getElementById('fqCyNotice') };
  }

  async renderMeditation() {
    this.disposeFeatureView();
    const { MeditationView } = await import('./frequenz-meditation-view.js');
    this.featureView = new MeditationView(this.root, {
      engine: this.engine,
      reducedMotion: this.reducedMotion,
      cymatics: this.features.cymatics,
    });
    this.featureView.render();
    this.refs = { notice: null };
  }

  disposeFeatureView() {
    if (this.featureView && typeof this.featureView.dispose === 'function') this.featureView.dispose();
    this.featureView = null;
  }

  onHide() {
    this.halt(null);
    if (this.viz) this.viz.stop();
    clearInterval(this.sweepTimer);
    this.disposeFeatureView();
  }

  /** Stoppt Audio, Sweep und Animation; `message` wird angesagt, wenn gesetzt. */
  halt(message) {
    if (this.featureView && typeof this.featureView.onInterrupt === 'function') this.featureView.onInterrupt();
    clearInterval(this.sweepTimer);
    this.sweepTimer = 0;
    // Jedes automatische oder ausdrückliche Stoppen beendet den Pause-Zustand;
    // nur `pause()` setzt das Merkzeichen danach wieder (ADR §4.4).
    this.paused = false;
    this.engine.stop().catch(() => {});
    if (this.viz) {
      this.viz.stop();
      this.viz.render(this.engine.state);
    }
    if (message) this.announce(message);
    this.syncTransport();
  }

  announce(message) {
    const target = this.refs.status;
    if (!target || !message) return;
    clearTimeout(this.announceTimer);
    const now = Date.now();
    const wait = Math.max(0, 1000 - (now - this.lastAnnounce));
    const apply = () => {
      target.textContent = message;
      this.lastAnnounce = Date.now();
    };
    if (wait === 0) apply();
    else this.announceTimer = setTimeout(apply, wait);
  }

  engineErrorText(error) {
    const code = error && error.code ? error.code : 'internal';
    return ERROR_TEXTS[code] || ERROR_TEXTS.internal;
  }

  showError(error) {
    const text = this.engineErrorText(error);
    if (this.refs.error) {
      this.refs.error.textContent = text;
      this.refs.error.hidden = false;
    }
    this.announce(text);
    console.warn('Frequenzlabor:', error && error.message ? error.message : error);
  }

  persist(patch) {
    this.prefs = { ...this.prefs, ...patch };
    this.store.write(this.prefs);
  }

  /* ---------------------------------------------------------------- Ansichten */

  renderHub() {
    const entries = this.data ? this.data.entries : [];
    const playable = entries.filter((entry) => entry.playback.mode !== 'none').length;
    this.root.innerHTML = `
      ${renderViewNav('hub', this.features)}
      <p class="fq-notice" id="fqNotice" role="status" hidden></p>
      <div class="fq-disclaimer" role="note">
        <p class="fq-disclaimer-kurz" id="fqDisclaimerKurz"></p>
      </div>
      <section class="fq-section" aria-labelledby="fq-intro-title">
        <div class="fq-section-head">
          <h2 id="fq-intro-title">Was ist Schwingung?</h2>
          <p class="label">Grundlagen · quellenbasiert</p>
        </div>
        ${EXPLAIN_HTML}
        <p class="fq-actions">
          <a class="btn btn-primary" href="#frequenzen/labor">Frequenzlabor öffnen <span aria-hidden="true">→</span></a>
        </p>
      </section>
      <section class="fq-section" aria-labelledby="fq-library-title">
        <div class="fq-section-head">
          <h2 id="fq-library-title">Frequenzbibliothek</h2>
          <p class="label">${entries.length} Einträge · ${playable} hörbar</p>
        </div>
        <p class="fq-lede">
          Jeder Eintrag nennt Frequenz oder Bereich, Evidenzstatus und Quelle. Nur Einträge, deren Wiedergabe
          fachlich trägt, haben einen Hör-Knopf; Bereiche und nicht abspielbare Werte bleiben reine Information.
        </p>
        <div class="fq-filters">
          <label class="fq-field" for="fqFilterKategorie"><span>Kategorie</span></label>
          <select id="fqFilterKategorie" class="select">
            <option value="alle">Alle Kategorien</option>
            <option value="physikalisch">Physikalisch</option>
            <option value="esoterisch">Esoterisch / traditionell</option>
          </select>
          <label class="fq-field" for="fqFilterEvidenz"><span>Evidenz</span></label>
          <select id="fqFilterEvidenz" class="select">
            <option value="alle">Alle Stufen</option>
            ${Object.entries(EVIDENZ_STUFEN)
              .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
              .join('')}
          </select>
          <p class="fq-filter-status" id="fqLibraryStatus" role="status"></p>
        </div>
        <div class="fq-playback-bar" id="fqHubPlayback" hidden>
          <p id="fqHubPlaybackText">Es läuft ein Ton.</p>
          <button type="button" class="btn btn-secondary btn-sm" id="fqHubStop">Ton stoppen</button>
        </div>
        <ul class="fq-library" id="fqLibrary"></ul>
        <p class="fq-empty" id="fqLibraryEmpty" hidden>Kein Eintrag passt zu diesen Filtern.</p>
      </section>
      <section class="fq-section" id="fq-quellen" aria-labelledby="fq-quellen-title">
        <h2 id="fq-quellen-title">Quellen und Methode</h2>
        <p class="fq-lede">
          Der Datenbestand ist quellengeprüft. Herleitung, Suchstrategie und Grenzen stehen im
          <a href="#frequenzen/quellen">Quellendokument</a>; die Daten selbst in
          <a href="data/frequencies.json">data/frequencies.json</a>.${this.offlineSource() ? '' : ' Die Rohfassung liegt als <a href="docs/frequenz-quellen.md">Markdown-Datei</a> im Projekt.'}
        </p>
        <p class="fq-note">
          Ein Wert als „nicht belegt“ einzuordnen, ist eine Aussage über den Suchstand, keine Widerlegung –
          Begründung und Quellenverzeichnis stehen im <a href="#frequenzen/quellen">Quellendokument</a>.
          Hintergrundartikel zu Kristallen, Chakren und Planeten sammelt der <a href="#blog">Wissensbereich</a>.
        </p>
      </section>
      <section class="fq-section fq-hinweis" id="fq-hinweis" aria-labelledby="fq-hinweis-title">
        <h2 id="fq-hinweis-title">Hinweis zur Nutzung</h2>
        <p class="fq-disclaimer-lang" id="fqDisclaimerLang"></p>
        <p class="fq-note">
          Diese Seite ist kein Medizinprodukt und ersetzt keine ärztliche Beratung. Einträge mit dem Status
          „nicht belegt“ oder „traditionell“ sind ausdrücklich als solche gekennzeichnet.
        </p>
      </section>
    `;
    this.collectHubRefs();
    this.fillDisclaimer();
    this.bindHub();
    this.renderLibrary();
    if (this.dataError) {
      this.refs.notice.hidden = false;
      this.refs.notice.textContent = `Die Frequenzbibliothek ist nicht verfügbar (${this.dataError}). Der manuelle Tongenerator im Labor funktioniert weiterhin.`;
    }
  }

  collectHubRefs() {
    const byId = (id) => document.getElementById(id);
    this.refs.notice = byId('fqNotice');
    this.refs.status = byId('fqLibraryStatus');
    this.refs.library = byId('fqLibrary');
    this.refs.libraryEmpty = byId('fqLibraryEmpty');
    this.refs.filterKategorie = byId('fqFilterKategorie');
    this.refs.filterEvidenz = byId('fqFilterEvidenz');
    this.refs.hubPlayback = byId('fqHubPlayback');
    this.refs.hubPlaybackText = byId('fqHubPlaybackText');
    this.refs.hubStop = byId('fqHubStop');
    this.refs.disclaimerKurz = byId('fqDisclaimerKurz');
    this.refs.disclaimerLang = byId('fqDisclaimerLang');
    this.refs.error = null;
    this.refs.status = byId('fqLibraryStatus');
  }

  fillPresetSelect() {
    const select = this.refs.presetSelect;
    if (!select) return;
    select.textContent = '';
    const playable = this.data ? this.data.entries.filter((entry) => entry.playback.mode !== 'none') : [];
    if (!playable.length) {
      select.append(h('option', { value: '', text: 'Keine hörbaren Presets verfügbar' }));
      return;
    }
    for (const entry of playable) {
      select.append(
        h('option', {
          value: entry.id,
          text: `${entry.name} — ${formatRange(entry)} (${EVIDENZ_STUFEN[entry.evidenzstatus].label})`,
        })
      );
    }
    const saved = this.prefs.presetId;
    if (saved && playable.some((entry) => entry.id === saved)) select.value = saved;
  }

  fillDisclaimer() {
    const disclaimer = (this.data && this.data.disclaimer) || DISCLAIMER_FALLBACK;
    if (this.refs.disclaimerKurz) {
      this.refs.disclaimerKurz.textContent = disclaimer.kurz || DISCLAIMER_FALLBACK.kurz;
    }
    if (this.refs.disclaimerLang) {
      this.refs.disclaimerLang.textContent = disclaimer.lang || DISCLAIMER_FALLBACK.lang;
    }
  }

  bindHub() {
    this.refs.filterKategorie.addEventListener('change', () => {
      this.filterKategorie = this.refs.filterKategorie.value;
      this.renderLibrary();
    });
    this.refs.filterEvidenz.addEventListener('change', () => {
      this.filterEvidenz = this.refs.filterEvidenz.value;
      this.renderLibrary();
    });
    this.refs.hubStop.addEventListener('click', () => {
      this.engine.stop().catch(() => {});
      this.announce('Ton gestoppt.');
    });
    this.refs.library.addEventListener('click', (event) => {
      const button = event.target.closest('button[data-play-id]');
      if (button) this.playEntry(button.dataset.playId);
    });
  }

  renderLibrary() {
    if (!this.refs.library) return;
    const entries = this.data ? this.data.entries : [];
    const filtered = entries.filter(
      (entry) =>
        (this.filterKategorie === 'alle' || entry.kategorie === this.filterKategorie) &&
        (this.filterEvidenz === 'alle' || entry.evidenzstatus === this.filterEvidenz)
    );
    const list = this.refs.library;
    list.textContent = '';
    for (const entry of filtered) list.append(this.entryNode(entry));
    if (this.refs.libraryEmpty) this.refs.libraryEmpty.hidden = filtered.length > 0;
    if (this.refs.status) {
      this.refs.status.textContent = `${filtered.length} von ${entries.length} Einträgen sichtbar`;
    }
  }

  entryNode(entry) {
    const stufe = EVIDENZ_STUFEN[entry.evidenzstatus];
    const playable = entry.playback.mode !== 'none';
    const source = entry.quelleUrl
      ? h('a', {
          class: 'fq-source-link',
          href: entry.quelleUrl,
          target: '_blank',
          rel: 'noopener noreferrer',
          text: entry.quelleTitel || 'Quelle öffnen',
        })
      : h('span', { class: 'fq-source-text', text: entry.quelleTitel || 'Quelle nicht verlinkbar' });
    const children = [
      h('div', { class: 'fq-entry-head' }, [
        h('h3', { class: 'fq-entry-title', text: entry.name }),
        h('p', { class: 'fq-entry-hz', text: formatRange(entry) }),
      ]),
      h('p', { class: `badge fq-badge fq-badge--${entry.evidenzstatus.replace(' ', '-')}`, text: stufe.label }),
      h('p', { class: 'fq-entry-desc', text: entry.beschreibung }),
      h('p', { class: 'fq-entry-source' }, [h('span', { class: 'fq-entry-source-label', text: 'Quelle: ' }), source]),
    ];
    if (entry.warnhinweis) {
      children.push(
        h('p', {
          class: 'fq-entry-hint',
          text: 'Hinweis: keine belegte Wirkung — nicht zur Behandlung von Krankheiten. Zahlenwert zur Einordnung.',
        })
      );
    }
    if (playable) {
      children.push(
        h('div', { class: 'fq-entry-actions' }, [
          h('button', {
            type: 'button',
            class: 'btn btn-secondary btn-sm',
            dataset: { playId: entry.id },
            text: entry.playback.mode === 'binaural' ? 'Binaural hören (Kopfhörer)' : 'Hören',
          }),
          h('a', { class: 'fq-entry-link', href: '#frequenzen/labor', text: 'Im Labor öffnen' }),
        ])
      );
    } else {
      children.push(h('p', { class: 'fq-entry-none', text: 'Nicht abspielbar: Zahlenwert zur Einordnung.' }));
    }
    return h('li', { class: 'fq-entry card', dataset: { evidenz: entry.evidenzstatus } }, children);
  }

  /* --------------------------------------------------- Quellendokument */

  /** Im Offline-Exemplar ist das Markdown eingebettet (build-local.cjs). */
  offlineSource() {
    const node = document.getElementById('local-frequenz-quellen');
    return node && node.textContent && node.textContent.trim() ? node.textContent : null;
  }

  async loadQuellen() {
    // Ein Promise als Cache: Klick und hashchange lösen die Ansicht zweimal aus,
    // beide Aufrufe müssen dasselbe Dokument sehen statt einmal leer zu bleiben.
    if (!this.quellenPromise) this.quellenPromise = this.readQuellen();
    return this.quellenPromise;
  }

  async readQuellen() {
    const embedded = this.offlineSource();
    if (embedded) return embedded;
    try {
      const response = await fetch(new URL('docs/frequenz-quellen.md', document.baseURI));
      if (!response || !response.ok) throw new Error(`HTTP ${response ? response.status : '—'}`);
      return await response.text();
    } catch (error) {
      this.quellenError = error && error.message ? error.message : 'unbekannter Fehler';
      console.warn('Frequenzlabor: Quellendokument nicht geladen', error);
      return null;
    }
  }

  /** Dritte Ansicht: das geprüfte Quellendokument als lesbare Seite. */
  async renderQuellen() {
    const offline = Boolean(this.offlineSource());
    this.root.innerHTML = `
      ${renderViewNav('quellen', this.features)}
      <p class="fq-notice" id="fqNotice" role="status" hidden></p>
      <p class="fq-lede">
        Das Quellendokument belegt für jeden Eintrag, woher der Wert stammt, was behauptet wird und wie
        belastbar die Behauptung ist. Diese Ansicht gibt <code>docs/frequenz-quellen.md</code> wieder;${
          offline
            ? ' im Offline-Exemplar ist die Datei eingebettet.'
            : ' verbindlich bleibt die <a href="docs/frequenz-quellen.md">Markdown-Datei im Projekt</a>.'
        }
      </p>
      <p class="fq-note">
        Tabellen lassen sich waagerecht scrollen und sind per Tastatur erreichbar; Quellen öffnen in einem neuen Tab.
      </p>
      <div class="fq-quellen-body" id="fqQuellenBody">
        <p>Dokument wird geladen …</p>
      </div>
    `;
    this.refs.notice = document.getElementById('fqNotice');
    this.refs.status = null;
    const body = document.getElementById('fqQuellenBody');
    const text = await this.loadQuellen();
    if (!body || !body.isConnected) return;
    if (!text) {
      body.innerHTML = `
        <p class="fq-notice" role="status">
          Das Quellendokument konnte nicht geladen werden (${escapeHtml(this.quellenError || 'unbekannter Fehler')}).
          Die Datei liegt im Projekt unter <code>docs/frequenz-quellen.md</code>.
        </p>
      `;
      return;
    }
    body.innerHTML = renderMarkdown(text, { headingOffset: 1, resolveHref: resolveDocHref });
  }

  /* ------------------------------------------------------------------ Labor */

  renderLab() {
    const playable = this.data ? this.data.entries.filter((entry) => entry.playback.mode !== 'none') : [];
    this.root.innerHTML = `
      ${renderViewNav('labor', this.features)}
      <p class="fq-notice" id="fqNotice" role="status" hidden></p>
      <div class="fq-disclaimer" role="note">
        <p class="fq-disclaimer-kurz" id="fqDisclaimerKurz"></p>
      </div>
      <div class="fq-transport" role="group" aria-label="Wiedergabe">
        <button type="button" class="btn btn-primary" id="fqPlay">Ton starten</button>
        <button type="button" class="btn btn-secondary" id="fqPause" disabled title="Hält den Ton an; die Einstellungen bleiben erhalten">Pause</button>
        <button type="button" class="btn btn-secondary" id="fqStop">Stopp</button>
        <p class="fq-live" id="fqLiveStatus">bereit</p>
        <p class="fq-live-hz" id="fqLiveHz">${formatHz(this.freqHz)}</p>
      </div>
      <p class="fq-status" id="fqStatus" role="status" aria-live="polite"></p>
      <p class="fq-error" id="fqError" role="alert" hidden></p>
      <div class="fq-lab-grid">
        <div class="fq-controls">
          <section class="fq-panel" aria-labelledby="fq-freq-title">
            <h2 class="fq-panel-title" id="fq-freq-title">Frequenz</h2>
            <p class="fq-readout" id="fqFreqReadout">${formatHz(this.freqHz)}</p>
            <label class="fq-field" for="fqFreqRange">Frequenz, logarithmisch 20–20.000 Hz</label>
            <input type="range" id="fqFreqRange" class="fq-range" min="0" max="1000" step="1" value="${this.hzToSlider(this.freqHz)}" />
            <div class="fq-field-row fq-field-row--inline">
              <label class="fq-field" for="fqFreqNumber">Frequenz in Hz</label>
              <input type="number" id="fqFreqNumber" class="input fq-number" min="${FREQUENCY_LIMITS.minHz}" max="${FREQUENCY_LIMITS.maxHz}" step="0.1" inputmode="decimal" value="${this.freqHz}" />
            </div>
            <p class="fq-note">20 kHz ist für viele Menschen unhörbar. Das Labor zeigt den Wert trotzdem korrekt an, ohne eine Wahrnehmung zu behaupten.</p>
          </section>
          <section class="fq-panel" aria-labelledby="fq-sound-title">
            <h2 class="fq-panel-title" id="fq-sound-title">Klang und Pegel</h2>
            <label class="fq-field" for="fqWaveform">Wellenform</label>
            <select id="fqWaveform" class="select">
              ${WAVEFORMS.map(([value, label]) => `<option value="${value}"${value === this.waveform ? ' selected' : ''}>${label}</option>`).join('')}
            </select>
            <label class="fq-field" for="fqGainRange">Lautstärke</label>
            <input type="range" id="fqGainRange" class="fq-range" min="${FREQUENCY_LIMITS.minGainDb}" max="${FREQUENCY_LIMITS.hardCapGainDb}" step="1" value="${this.gainDb}" />
            <p class="fq-gain-row">
              <output id="fqGainReadout" for="fqGainRange">${formatDb(this.gainDb)}</output>
              <span class="fq-gain-cap">Deckel: ${formatDb(FREQUENCY_LIMITS.hardCapGainDb)}</span>
            </p>
            <p class="fq-note">Startpegel ${formatDb(FREQUENCY_LIMITS.defaultGainDb)}. Tief starten, Gehör schützen, Pausen machen. Kopfhörer sind nur für binaurale Töne nötig.</p>
          </section>
          <section class="fq-panel" aria-labelledby="fq-sweep-title">
            <h2 class="fq-panel-title" id="fq-sweep-title">Sweep</h2>
            <p class="fq-note">Fährt die Frequenz exponentiell von einem Wert zum anderen. Dauer 0,1 bis 60 Sekunden.</p>
            <div class="fq-field-row fq-field-row--3">
              <label class="fq-field" for="fqSweepFrom">Von (Hz)</label>
              <label class="fq-field" for="fqSweepTo">Bis (Hz)</label>
              <label class="fq-field" for="fqSweepSeconds">Dauer (s)</label>
              <input type="number" id="fqSweepFrom" class="input fq-number" min="20" max="20000" step="1" value="200" />
              <input type="number" id="fqSweepTo" class="input fq-number" min="20" max="20000" step="1" value="800" />
              <input type="number" id="fqSweepSeconds" class="input fq-number" min="0.1" max="60" step="0.1" value="4" />
            </div>
            <div class="fq-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="fqSweepStart">Sweep starten</button>
              <button type="button" class="btn btn-ghost btn-sm" id="fqSweepCancel" disabled>Sweep abbrechen</button>
            </div>
            <div class="fq-progress" id="fqSweepWrap" hidden>
              <div class="fq-progress-track" role="progressbar" id="fqSweepProgress" aria-label="Sweep-Fortschritt" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div>
            </div>
          </section>
          <section class="fq-panel" aria-labelledby="fq-beat-title">
            <h2 class="fq-panel-title" id="fq-beat-title">Schwebung: zwei Töne</h2>
            <p class="fq-note">Zweiter Ton als Schwebungs-Demo. Der Differenzton ist die Differenz beider Frequenzen und wird hörbar als Schweller.</p>
            <div class="fq-field-row fq-field-row--3">
              <label class="fq-field" for="fqBeatBase">Grundton (Hz)</label>
              <label class="fq-field" for="fqBeatDelta">Differenz (Hz)</label>
              <span class="fq-field" aria-hidden="true"></span>
              <input type="number" id="fqBeatBase" class="input fq-number" min="20" max="19900" step="1" value="440" />
              <input type="number" id="fqBeatDelta" class="input fq-number" min="0.1" max="20" step="0.1" value="4" />
              <button type="button" class="btn btn-secondary btn-sm" id="fqBeatPlay">Schwebung hören</button>
            </div>
            <p class="fq-note" id="fqBeatInfo">440 Hz + 444 Hz → 4 Hz Schwellung.</p>
          </section>
          <section class="fq-panel" aria-labelledby="fq-preset-title">
            <h2 class="fq-panel-title" id="fq-preset-title">Preset aus der Bibliothek</h2>
            <label class="fq-field" for="fqPresetSelect">Hörbares Preset</label>
            <select id="fqPresetSelect" class="select"></select>
            <div class="fq-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="fqPresetPlay"${playable.length ? '' : ' disabled'}>Preset abspielen</button>
            </div>
          </section>
          ${
            this.features.binaural
              ? `
          <section class="fq-panel" aria-labelledby="fq-binaural-title">
            <h2 class="fq-panel-title" id="fq-binaural-title">Binaurale Demonstration</h2>
            <p class="fq-note">Zwei kanalgetrennte Töne (links/rechts). Nur mit Kopfhörern hörbar. Demonstration einer Differenzfrequenz; keine belegte EEG-Wirkung.</p>
            <label class="fq-field" for="fqBinauralPreset">Band-Konvention</label>
            <select id="fqBinauralPreset" class="select">
              ${BINAURAL_PRESETS.map((preset) => `<option value="${preset.id}">${preset.label}</option>`).join('')}
            </select>
            <div class="fq-field-row fq-field-row--3">
              <label class="fq-field" for="fqCarrier">Träger (Hz)</label>
              <label class="fq-field" for="fqDelta">Differenz (Hz)</label>
              <span class="fq-field" aria-hidden="true"></span>
              <input type="number" id="fqCarrier" class="input fq-number" min="20" max="19900" step="1" value="${this.carrierHz}" />
              <input type="number" id="fqDelta" class="input fq-number" min="${FREQUENCY_LIMITS.minBinauralDeltaHz}" max="${FREQUENCY_LIMITS.maxBinauralDeltaHz}" step="0.1" value="${this.deltaHz}" />
              <button type="button" class="btn btn-secondary btn-sm" id="fqBinauralPlay">Binaural starten</button>
            </div>
          </section>`
              : ''
          }
          ${
            this.features.vergleich432440
              ? `
          <section class="fq-panel" aria-labelledby="fq-compare-title">
            <h2 class="fq-panel-title" id="fq-compare-title">432 Hz / 440 Hz</h2>
            <p class="fq-note">Verglichen werden einzelne Sinustöne mit gleichem Pegel und gleicher Dauer – keine vollständigen Stimmungen.</p>
            <div class="fq-actions">
              <button type="button" class="btn btn-secondary btn-sm" id="fqCompare432">432 Hz hören</button>
              <button type="button" class="btn btn-secondary btn-sm" id="fqCompare440">440 Hz hören</button>
            </div>
          </section>`
              : ''
          }
        </div>
        <section class="fq-panel fq-visual" aria-labelledby="fq-visual-title">
          <h2 class="fq-panel-title" id="fq-visual-title">Oszillogramm</h2>
          <canvas id="fqCanvas" class="fq-canvas" aria-hidden="true"></canvas>
          <dl class="fq-readout-list">
            <div><dt>Frequenz</dt><dd id="fqReadFreq">${formatHz(this.freqHz)}</dd></div>
            <div><dt>Periode</dt><dd id="fqReadPeriod">—</dd></div>
            <div><dt>Wellenlänge in Luft</dt><dd id="fqReadWavelength">—</dd></div>
            <div><dt>Pegel</dt><dd id="fqReadGain">${formatDb(this.gainDb)}</dd></div>
            <div><dt>Zustand</dt><dd id="fqReadState">bereit</dd></div>
          </dl>
          <p class="fq-note" id="fqMotionNote" hidden>Bewegung ist reduziert: Das Oszillogramm zeigt eine statische Welle und einmalige Messwerte.</p>
          <p class="fq-note">Das Canvas ist rein visuell; alle Messwerte stehen als Text daneben und sind auch für Screenreader lesbar.</p>
        </section>
      </div>
      <section class="fq-section" id="fq-hinweis" aria-labelledby="fq-hinweis-title">
        <h2 id="fq-hinweis-title">Hinweis zur Nutzung</h2>
        <p class="fq-disclaimer-lang" id="fqDisclaimerLang"></p>
        <p class="fq-note">Quellen und Methodik: <a href="#frequenzen/quellen">Quellendokument</a>.</p>
      </section>
    `;
    this.collectLabRefs();
    this.fillPresetSelect();
    this.fillDisclaimer();
    this.bindLab();
    this.viz = new FrequenzVisualisierung(this.refs.canvas, {
      engine: this.engine,
      reducedMotion: this.reducedMotion,
    });
    if (this.reducedMotion && this.refs.motionNote) this.refs.motionNote.hidden = false;
    this.syncControls();
    this.viz.render(this.engine.state);
  }

  collectLabRefs() {
    const byId = (id) => document.getElementById(id);
    this.refs.notice = byId('fqNotice');
    this.refs.status = byId('fqStatus');
    this.refs.error = byId('fqError');
    this.refs.play = byId('fqPlay');
    this.refs.pause = byId('fqPause');
    this.refs.stop = byId('fqStop');
    this.refs.live = byId('fqLiveStatus');
    this.refs.liveHz = byId('fqLiveHz');
    this.refs.freqRange = byId('fqFreqRange');
    this.refs.freqNumber = byId('fqFreqNumber');
    this.refs.freqReadout = byId('fqFreqReadout');
    this.refs.waveform = byId('fqWaveform');
    this.refs.gainRange = byId('fqGainRange');
    this.refs.gainReadout = byId('fqGainReadout');
    this.refs.sweepFrom = byId('fqSweepFrom');
    this.refs.sweepTo = byId('fqSweepTo');
    this.refs.sweepSeconds = byId('fqSweepSeconds');
    this.refs.sweepStart = byId('fqSweepStart');
    this.refs.sweepCancel = byId('fqSweepCancel');
    this.refs.sweepWrap = byId('fqSweepWrap');
    this.refs.sweepProgress = byId('fqSweepProgress');
    this.refs.beatBase = byId('fqBeatBase');
    this.refs.beatDelta = byId('fqBeatDelta');
    this.refs.beatPlay = byId('fqBeatPlay');
    this.refs.beatInfo = byId('fqBeatInfo');
    this.refs.presetSelect = byId('fqPresetSelect');
    this.refs.presetPlay = byId('fqPresetPlay');
    this.refs.canvas = byId('fqCanvas');
    this.refs.readFreq = byId('fqReadFreq');
    this.refs.readPeriod = byId('fqReadPeriod');
    this.refs.readWavelength = byId('fqReadWavelength');
    this.refs.readGain = byId('fqReadGain');
    this.refs.readState = byId('fqReadState');
    this.refs.motionNote = byId('fqMotionNote');
    this.refs.disclaimerKurz = byId('fqDisclaimerKurz');
    this.refs.disclaimerLang = byId('fqDisclaimerLang');
    this.refs.binauralPreset = byId('fqBinauralPreset');
    this.refs.carrier = byId('fqCarrier');
    this.refs.delta = byId('fqDelta');
    this.refs.binauralPlay = byId('fqBinauralPlay');
    this.refs.compare432 = byId('fqCompare432');
    this.refs.compare440 = byId('fqCompare440');
  }

  bindLab() {
    this.refs.play.addEventListener('click', () => this.play());
    this.refs.pause.addEventListener('click', () => {
      if (this.paused) this.resume();
      else this.pause();
    });
    this.refs.stop.addEventListener('click', () => this.stopTone());
    this.refs.freqRange.addEventListener('input', () => {
      this.setFrequency(this.sliderToHz(Number(this.refs.freqRange.value)));
    });
    this.refs.freqRange.addEventListener('change', () => this.persist({ freqHz: this.freqHz }));
    this.refs.freqNumber.addEventListener('change', () => {
      const value = Number(this.refs.freqNumber.value);
      if (!Number.isFinite(value) || value <= 0) {
        this.refs.freqNumber.value = String(this.freqHz);
        this.showError({ code: 'invalid_frequency' });
        return;
      }
      this.setFrequency(clamp(value, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz));
      this.persist({ freqHz: this.freqHz });
    });
    this.refs.waveform.addEventListener('change', () => {
      this.waveform = this.refs.waveform.value;
      try {
        this.engine.setWaveform(this.waveform);
      } catch (error) {
        this.showError(error);
      }
      this.persist({ waveform: this.waveform });
    });
    this.refs.gainRange.addEventListener('input', () => {
      this.gainDb = clamp(
        Number(this.refs.gainRange.value),
        FREQUENCY_LIMITS.minGainDb,
        FREQUENCY_LIMITS.hardCapGainDb
      );
      this.syncGain();
      try {
        this.engine.setGain(this.gainDb);
      } catch (error) {
        this.showError(error);
      }
    });
    this.refs.gainRange.addEventListener('change', () => this.persist({ gainDb: this.gainDb }));
    this.refs.sweepStart.addEventListener('click', () => this.startSweep());
    this.refs.sweepCancel.addEventListener('click', () => {
      this.engine.cancelSweep();
      this.announce('Sweep abgebrochen.');
    });
    this.refs.beatPlay.addEventListener('click', () => this.playBeat());
    this.refs.beatBase.addEventListener('input', () => this.updateBeatInfo());
    this.refs.beatDelta.addEventListener('input', () => this.updateBeatInfo());
    this.refs.presetSelect.addEventListener('change', () => this.persist({ presetId: this.refs.presetSelect.value }));
    this.refs.presetPlay.addEventListener('click', () => this.playEntry(this.refs.presetSelect.value));
    if (this.refs.binauralPreset) {
      this.refs.binauralPreset.addEventListener('change', () => {
        const preset = BINAURAL_PRESETS.find((item) => item.id === this.refs.binauralPreset.value);
        if (!preset) return;
        this.carrierHz = preset.carrierHz;
        this.deltaHz = preset.deltaHz;
        this.refs.carrier.value = String(preset.carrierHz);
        this.refs.delta.value = String(preset.deltaHz);
      });
      this.refs.binauralPlay.addEventListener('click', () => this.playBinaural());
    }
    if (this.refs.compare432) this.refs.compare432.addEventListener('click', () => this.playFixed(432));
    if (this.refs.compare440) this.refs.compare440.addEventListener('click', () => this.playFixed(440));
    this.updateBeatInfo();
    window.addEventListener('resize', () => {
      if (this.viz) this.viz.render(this.engine.state);
    });
  }

  /* --------------------------------------------------------------- Steuerung */

  hzToSlider(hz) {
    const { minHz, maxHz } = FREQUENCY_LIMITS;
    return Math.round((Math.log(hz / minHz) / Math.log(maxHz / minHz)) * 1000);
  }

  sliderToHz(value) {
    const { minHz, maxHz } = FREQUENCY_LIMITS;
    return minHz * Math.pow(maxHz / minHz, clamp(value, 0, 1000) / 1000);
  }

  roundedHz(hz) {
    return hz >= 100 ? Math.round(hz * 10) / 10 : Math.round(hz * 100) / 100;
  }

  setFrequency(hz) {
    this.freqHz = clamp(hz, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz);
    // U5/NFR-14: Slider und Zahlenfeld zeigen jederzeit denselben Wert. Beide
    // Richtungen schreiben deshalb in das Zahlenfeld; beim Tippen selbst greift
    // nur der `change`-Handler, sodass keine Eingabe mitten im Tippen überschrieben wird.
    this.syncFrequency(true);
    try {
      this.engine.setFrequency(this.freqHz);
    } catch (error) {
      this.showError(error);
    }
  }

  async play(options = {}) {
    this.refs.error.hidden = true;
    try {
      await this.engine.play(this.freqHz, { waveform: this.waveform, gainDb: this.gainDb });
      this.announce(options.message || `Ton läuft: ${formatHz(this.freqHz)}, ${formatDb(this.gainDb)}.`);
      return true;
    } catch (error) {
      this.showError(error);
      return false;
    }
  }

  async playFixed(hz) {
    this.refs.error.hidden = true;
    this.freqHz = hz;
    this.syncFrequency(true);
    try {
      await this.engine.play(hz, { waveform: 'sine', gainDb: this.gainDb });
      this.announce(`Vergleichston: ${formatHz(hz)}.`);
    } catch (error) {
      this.showError(error);
    }
  }

  async playBeat() {
    const base = clamp(Number(this.refs.beatBase.value) || 440, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz - 20);
    const delta = clamp(Number(this.refs.beatDelta.value) || 4, 0.1, 20);
    const partner = clamp(base + delta, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz);
    this.refs.error.hidden = true;
    try {
      await this.engine.playTones([base, partner], { waveform: this.waveform, gainDb: this.gainDb });
      this.announce(`Schwebung ${formatHz(base)} und ${formatHz(partner)}: ${delta} Hz Differenz.`);
    } catch (error) {
      this.showError(error);
    }
  }

  async playBinaural() {
    const carrier = clamp(Number(this.refs.carrier.value) || 200, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz - 1);
    const delta = clamp(
      Number(this.refs.delta.value) || 8,
      FREQUENCY_LIMITS.minBinauralDeltaHz,
      FREQUENCY_LIMITS.maxBinauralDeltaHz
    );
    this.carrierHz = carrier;
    this.deltaHz = delta;
    this.persist({ binaural: { carrierHz: carrier, deltaHz: delta } });
    this.refs.error.hidden = true;
    try {
      await this.engine.playBinaural({ carrierHz: carrier, deltaHz: delta, waveform: 'sine', gainDb: this.gainDb });
      this.announce(`Binaural: ${formatHz(carrier)} links, ${formatHz(carrier + delta)} rechts. Kopfhörer nötig.`);
    } catch (error) {
      this.showError(error);
    }
  }

  async playEntry(id) {
    const entry = this.data ? this.data.entries.find((item) => item.id === id) : null;
    if (!entry || entry.playback.mode === 'none') return;
    if (this.refs.error) this.refs.error.hidden = true;
    const playback = entry.playback;
    try {
      if (playback.mode === 'binaural') {
        await this.engine.playBinaural({
          carrierHz: playback.carrierHz,
          deltaHz: playback.deltaHz,
          waveform: 'sine',
          gainDb: this.gainDb,
        });
      } else if (playback.partnerHz) {
        await this.engine.playTones([playback.hz, playback.partnerHz], {
          waveform: this.waveform,
          gainDb: this.gainDb,
        });
      } else {
        await this.engine.play(playback.hz, { waveform: this.waveform, gainDb: this.gainDb });
      }
      this.announce(`Preset läuft: ${entry.name}.`);
    } catch (error) {
      this.showError(error);
    }
  }

  stopTone() {
    this.paused = false;
    this.engine.stop().catch(() => {});
    this.announce('Ton gestoppt.');
    this.syncTransport();
  }

  /**
   * „Pause“ ist keine Engine-Methode: der Ton wird über `stop()` beendet, die
   * Einstellungen bleiben im Controller. Es entsteht kein dritter Audiozustand
   * (ADR §4.4, Review B3).
   */
  pause() {
    const status = this.engine.state.status;
    if (status !== 'running' && status !== 'starting') return;
    this.halt(null);
    this.paused = true;
    this.announce(`Ton pausiert bei ${formatHz(this.freqHz)}. „Weiter“ setzt mit denselben Werten fort.`);
    this.syncTransport();
  }

  /** „Weiter“ ruft `play()` mit den aktuell gemerkten Werten des Controllers. */
  async resume() {
    if (!this.paused) return;
    const ok = await this.play({
      message: `Weiter: Ton läuft: ${formatHz(this.freqHz)}, ${formatDb(this.gainDb)}.`,
    });
    if (ok) this.paused = false;
    this.syncTransport();
  }

  startSweep() {
    const from = clamp(Number(this.refs.sweepFrom.value) || 200, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz);
    const to = clamp(Number(this.refs.sweepTo.value) || 800, FREQUENCY_LIMITS.minHz, FREQUENCY_LIMITS.maxHz);
    const seconds = clamp(
      Number(this.refs.sweepSeconds.value) || 4,
      FREQUENCY_LIMITS.minSweepSeconds,
      FREQUENCY_LIMITS.maxSweepSeconds
    );
    this.refs.error.hidden = true;
    // NFR-15: der Sweep-Start wird angesagt, nicht nur das Ende (Befund m-1).
    // Die Zahlen kommen aus `formatHz`, damit Ansage und Anzeige dieselbe
    // deutsche Schreibweise verwenden.
    const hzValue = (value) => formatHz(value).replace(/\s*Hz$/, '');
    this.announce(`Sweep läuft: ${hzValue(from)} → ${formatHz(to)}, ${seconds.toLocaleString('de-DE')} s.`);
    this.engine
      .sweep(from, to, seconds, { curve: 'exponential' })
      .then((result) => {
        if (result && result.completed) this.announce(`Sweep beendet bei ${formatHz(result.endedAtHz)}.`);
      })
      .catch((error) => this.showError(error));
    this.persist({ sweep: { seconds, curve: 'exponential' } });
  }

  /* -------------------------------------------------------------- Zustand/UI */

  syncFrequency(updateNumberField) {
    const label = formatHz(this.freqHz);
    if (this.refs.freqReadout) this.refs.freqReadout.textContent = label;
    if (this.refs.freqRange) this.refs.freqRange.value = String(this.hzToSlider(this.freqHz));
    if (updateNumberField && this.refs.freqNumber) this.refs.freqNumber.value = String(this.roundedHz(this.freqHz));
    if (this.refs.liveHz) this.refs.liveHz.textContent = label;
    this.syncMetrics();
  }

  syncGain() {
    const label = formatDb(this.gainDb);
    if (this.refs.gainReadout) this.refs.gainReadout.textContent = label;
    if (this.refs.gainRange) this.refs.gainRange.value = String(this.gainDb);
    if (this.refs.readGain) this.refs.readGain.textContent = label;
  }

  syncMetrics() {
    const period = 1000 / this.freqHz;
    const wavelength = SPEED_OF_SOUND_M_S / this.freqHz;
    if (this.refs.readFreq) this.refs.readFreq.textContent = formatHz(this.freqHz);
    if (this.refs.readPeriod) this.refs.readPeriod.textContent = `${period.toFixed(period < 1 ? 2 : 1)} ms`;
    if (this.refs.readWavelength) {
      this.refs.readWavelength.textContent = `${wavelength.toFixed(wavelength < 1 ? 2 : 1)} m`;
    }
  }

  /**
   * Transportleiste aus dem Engine-Zustand plus dem Pause-Merkzeichen ableiten.
   * Es gibt bewusst nur die Engine-Zustände; „pausiert“ ist kein Statuswert,
   * sondern nur die Beschriftung des zweiten Knopfs (ADR §4.4, Review B3).
   */
  syncTransport() {
    const status = this.engine.state.status;
    const running = status === 'running';
    const starting = status === 'starting';
    const paused = this.paused && !running && !starting;
    if (this.refs.play) this.refs.play.disabled = running || starting;
    if (this.refs.pause) {
      this.refs.pause.disabled = !(running || starting || paused);
      this.refs.pause.textContent = paused ? 'Weiter' : 'Pause';
      this.refs.pause.title = paused
        ? 'Setzt den Ton mit den aktuellen Einstellungen fort'
        : 'Hält den Ton an; die Einstellungen bleiben erhalten';
    }
    if (this.refs.stop) this.refs.stop.disabled = !(running || starting || paused);
  }

  syncControls() {
    this.syncFrequency(true);
    this.syncGain();
    this.syncTransport();
    if (this.refs.waveform) this.refs.waveform.value = this.waveform;
    if (this.refs.notice && this.dataError) {
      this.refs.notice.hidden = false;
      this.refs.notice.textContent = `Presets nicht verfügbar (${this.dataError}); der manuelle Generator funktioniert.`;
    }
  }

  updateBeatInfo() {
    if (!this.refs.beatInfo) return;
    const base = Number(this.refs.beatBase.value) || 440;
    const delta = Number(this.refs.beatDelta.value) || 4;
    this.refs.beatInfo.textContent = `${formatHz(base)} + ${formatHz(base + delta)} → ${delta} Hz Schwellung.`;
  }

  onEngineState(state) {
    if (!state) return;
    const running = state.status === 'running';
    if (running) this.paused = false;
    if (this.view === 'labor') {
      this.syncTransport();
      if (this.refs.live) this.refs.live.textContent = STATE_TEXTS[state.status] || state.status;
      if (this.refs.readState) this.refs.readState.textContent = STATE_TEXTS[state.status] || state.status;
      if (Number.isFinite(state.freqHz) && state.status === 'running' && Math.abs(state.freqHz - this.freqHz) > 0.5) {
        // Sweep oder Binaural: die Engine ist autoritativ.
        this.freqHz = state.freqHz;
        this.syncFrequency(true);
      }
      const sweeping = Boolean(state.sweep);
      if (this.refs.sweepCancel) this.refs.sweepCancel.disabled = !sweeping;
      if (this.refs.sweepStart) this.refs.sweepStart.disabled = sweeping;
      if (this.refs.sweepWrap) this.refs.sweepWrap.hidden = !sweeping;
      if (sweeping) this.startSweepProgress(state);
      else this.stopSweepProgress();
      if (state.lastError) this.showError(state.lastError);
      if (this.viz) {
        if (running && !this.reducedMotion) this.viz.start(() => this.engine.state);
        else {
          this.viz.stop();
          this.viz.render(state);
        }
      }
      if (this.refs.motionNote) this.refs.motionNote.hidden = !(this.reducedMotion && running);
    }
    if (this.view === 'hub' && this.refs.hubPlayback) {
      this.refs.hubPlayback.hidden = !running;
      if (running && this.refs.hubPlaybackText) {
        const voices = state.frequenciesHz && state.frequenciesHz.length ? state.frequenciesHz : [state.freqHz];
        this.refs.hubPlaybackText.textContent = `Es läuft: ${voices.map((hz) => formatHz(hz)).join(' · ')} (${formatDb(state.gainDb)}). Beim Verlassen der Seite stoppt der Ton.`;
      }
    }
  }

  startSweepProgress(state) {
    this.sweepStartedAt = state.sweep.startedAtMs;
    this.sweepSeconds = state.sweep.seconds;
    if (this.sweepTimer) return;
    const tick = () => {
      const live = this.engine.state.sweep;
      if (!live) return this.stopSweepProgress();
      const progress = clamp((performance.now() - live.startedAtMs) / (live.seconds * 1000), 0, 1);
      const percent = Math.round(progress * 100);
      if (this.refs.sweepProgress) this.refs.sweepProgress.setAttribute('aria-valuenow', String(percent));
      const bar = this.refs.sweepProgress && this.refs.sweepProgress.firstElementChild;
      if (bar) bar.style.width = `${percent}%`;
    };
    tick();
    this.sweepTimer = setInterval(tick, 200);
  }

  stopSweepProgress() {
    clearInterval(this.sweepTimer);
    this.sweepTimer = 0;
    if (this.refs.sweepProgress) {
      this.refs.sweepProgress.setAttribute('aria-valuenow', '0');
      const bar = this.refs.sweepProgress.firstElementChild;
      if (bar) bar.style.width = '0%';
    }
  }
}

/**
 * Read-only Messschnittstelle für QA und Tests (ADR §6.2.8). Sie liegt im
 * Lazy-Modul statt in js/main.js, weil die Engine dort nicht statisch
 * importiert werden darf: NFR-1/NFR-5 verlangen, dass vor der Navigation zur
 * Kategorie kein `frequenz-engine.js`-Request entsteht. Die Schnittstelle
 * steuert nichts, sie liest nur.
 */
function installDebugHandle(engine) {
  if (typeof window === 'undefined') return;
  window.EsoterikWelt = window.EsoterikWelt || {};
  window.EsoterikWelt.frequenz = Object.freeze({
    getState: () => engine.state,
    getAnalyserData: (channel = 'mix') => engine.getAnalyserData(channel),
  });
}
