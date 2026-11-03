// Ansicht „Chladni-Muster / Cymatics“ (P9, ADR-Nachtrag §13).
//
// Die Ansicht ist reine Darstellung: Sie liest Modi, zeichnet das Feld und die
// Knotenlinien und liefert die textliche Entsprechung. Es gibt keine
// Animation und keinen Frequenzbezug; damit ist `prefers-reduced-motion`
// strukturell erfüllt (es existiert keine rAF-Schleife) und die Aussage
// „Frequenz X erzeugt Muster Y“ ist ausgeschlossen.
import {
  CHLADNI_MODEL_LABEL,
  DEFAULT_MODE_A,
  DEFAULT_MODE_B,
  MAX_MODE,
  MIN_MODE,
  assertMode,
  buildField,
  describeMode,
  nodeSegments,
} from './frequenz-chladni.js';

const FIELD_RESOLUTION = 200;

function selectOptions(selected) {
  let html = '';
  for (let value = MIN_MODE; value <= MAX_MODE; value += 1) {
    html += `<option value="${value}"${value === selected ? ' selected' : ''}>${value}</option>`;
  }
  return html;
}

function parseHex(value, fallback) {
  const match = /^#?([0-9a-f]{6})$/i.exec(String(value || '').trim());
  if (!match) return fallback;
  const number = parseInt(match[1], 16);
  return [(number >> 16) & 255, (number >> 8) & 255, number & 255];
}

function css(colour) {
  return `rgb(${colour[0]}, ${colour[1]}, ${colour[2]})`;
}

function mix(base, target, amount) {
  const ratio = Math.max(0, Math.min(1, amount));
  return [
    Math.round(base[0] + (target[0] - base[0]) * ratio),
    Math.round(base[1] + (target[1] - base[1]) * ratio),
    Math.round(base[2] + (target[2] - base[2]) * ratio),
  ];
}

export class CymaticsView {
  /**
   * @param {HTMLElement} root Zielcontainer im Frequenzbereich
   * @param {{ reducedMotion?: boolean, meditation?: boolean }} options
   */
  constructor(root, { reducedMotion = false, meditation = false } = {}) {
    this.root = root;
    this.reducedMotion = Boolean(reducedMotion);
    this.meditation = Boolean(meditation);
    this.modes = { a: { ...DEFAULT_MODE_A }, b: { ...DEFAULT_MODE_B } };
    this.showNodes = true;
    this.refs = {};
    this.palette = null;
    this.resizeTimer = 0;
    this.onResize = () => {
      clearTimeout(this.resizeTimer);
      this.resizeTimer = setTimeout(() => this.drawAll(), 150);
    };
  }

  navHtml(current) {
    const link = (href, label, id) => `<a href="${href}"${current === id ? ' aria-current="page"' : ''}>${label}</a>`;
    return `<nav class="fq-nav" aria-label="Frequenzbereich">
      ${link('#frequenzen', '← Bibliothek', 'hub')}
      ${link('#frequenzen/labor', 'Frequenzlabor', 'labor')}
      ${link('#frequenzen/cymatics', 'Chladni-Muster', 'cymatics')}
      ${this.meditation ? link('#frequenzen/meditation', 'Meditation', 'meditation') : ''}
    </nav>`;
  }

  render() {
    this.root.innerHTML = `
      ${this.navHtml('cymatics')}
      <p class="fq-notice" id="fqCyNotice" role="status" hidden></p>
      <section class="fq-section" aria-labelledby="fqCyTitle">
        <div class="fq-section-head">
          <h2 id="fqCyTitle">Chladni-Muster auf einer idealisierten Platte</h2>
          <p class="label">Modell · keine Frequenzzuordnung</p>
        </div>
        <p class="fq-lede">
          Knotenlinien entstehen dort, wo eine schwingende Platte in Ruhe bleibt. Die Bilder hier folgen einer
          Modellfunktion für eine quadratische Platte mit freien Rändern. Gewählt werden die Modenzahlen n und m –
          nicht eine Frequenz.
        </p>
        <p class="fq-note">
          Modell: <span class="fq-mono">f(u,v) = cos(nπu)·cos(mπv) − cos(mπu)·cos(nπv)</span>, ${CHLADNI_MODEL_LABEL}.
        </p>
      </section>
      <div class="fq-figures">
        <figure class="fq-figure">
          <figcaption class="fq-figure-title">Muster A</figcaption>
          <canvas id="fqCyCanvasA" class="fq-square" width="360" height="360" aria-hidden="true"></canvas>
          <div class="fq-figure-controls">
            <label class="fq-field" for="fqCyNA">n (A)</label>
            <select id="fqCyNA" class="select">${selectOptions(this.modes.a.n)}</select>
            <label class="fq-field" for="fqCyMA">m (A)</label>
            <select id="fqCyMA" class="select">${selectOptions(this.modes.a.m)}</select>
          </div>
          <p class="fq-figcaption" id="fqCyTextA"></p>
        </figure>
        <figure class="fq-figure">
          <figcaption class="fq-figure-title">Muster B zum Vergleich</figcaption>
          <canvas id="fqCyCanvasB" class="fq-square" width="360" height="360" aria-hidden="true"></canvas>
          <div class="fq-figure-controls">
            <label class="fq-field" for="fqCyNB">n (B)</label>
            <select id="fqCyNB" class="select">${selectOptions(this.modes.b.n)}</select>
            <label class="fq-field" for="fqCyMB">m (B)</label>
            <select id="fqCyMB" class="select">${selectOptions(this.modes.b.m)}</select>
          </div>
          <p class="fq-figcaption" id="fqCyTextB"></p>
        </figure>
      </div>
      <div class="fq-chladni-options">
        <label class="fq-check" for="fqCyNodes">
          <input type="checkbox" id="fqCyNodes" checked />
          <span>Knotenlinien hervorheben</span>
        </label>
        <p class="fq-note" id="fqCyMotionNote" ${this.reducedMotion ? '' : 'hidden'}>
          Statische Darstellung: Die Muster werden nur bei einer Änderung neu gezeichnet, nie animiert.
        </p>
      </div>
      <p class="fq-error" id="fqCyError" role="alert" hidden></p>
      <section class="fq-section" aria-labelledby="fqCyLimitsTitle">
        <h2 id="fqCyLimitsTitle">Was dieses Modell nicht aussagt</h2>
        <ul class="fq-prose fq-list">
          <li>Es gibt <strong>keine</strong> Zuordnung „Frequenz X erzeugt Muster Y“: die Modenform hängt von Geometrie, Material, Dicke und Halterung ab.</li>
          <li>Die Anregungsfrequenz einer realen Platte wird hier nicht berechnet; die Modenzahlen sind keine Hertz-Werte.</li>
          <li>Reale Chladni-Figuren weichen ab, weil Ränder nicht ideal frei sind und die Platte endlich dick ist.</li>
          <li>Die Bilder sind eine Modellrechnung, keine Messung und keine künstlerische Simulation.</li>
        </ul>
      </section>
    `;
    const byId = (id) => document.getElementById(id);
    this.refs = {
      canvasA: byId('fqCyCanvasA'),
      canvasB: byId('fqCyCanvasB'),
      nA: byId('fqCyNA'),
      mA: byId('fqCyMA'),
      nB: byId('fqCyNB'),
      mB: byId('fqCyMB'),
      nodes: byId('fqCyNodes'),
      textA: byId('fqCyTextA'),
      textB: byId('fqCyTextB'),
      error: byId('fqCyError'),
      notice: byId('fqCyNotice'),
    };
    this.palette = null;
    this.bind();
    this.drawAll();
    window.addEventListener('resize', this.onResize);
  }

  bind() {
    const readSlot = (slot) => {
      const n = Number(this.refs[`n${slot.toUpperCase()}`].value);
      const m = Number(this.refs[`m${slot.toUpperCase()}`].value);
      this.modes[slot] = { n, m };
      this.update(slot);
    };
    this.refs.nA.addEventListener('change', () => readSlot('a'));
    this.refs.mA.addEventListener('change', () => readSlot('a'));
    this.refs.nB.addEventListener('change', () => readSlot('b'));
    this.refs.mB.addEventListener('change', () => readSlot('b'));
    this.refs.nodes.addEventListener('change', () => {
      this.showNodes = this.refs.nodes.checked;
      this.drawAll();
    });
  }

  update(slot) {
    const mode = this.modes[slot];
    const canvas = this.refs[`canvas${slot.toUpperCase()}`];
    const caption = this.refs[`text${slot.toUpperCase()}`];
    try {
      assertMode(mode.n, mode.m);
    } catch (error) {
      const message = error && error.message ? error.message : 'Diese Modenkombination ist nicht darstellbar.';
      if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      if (caption) caption.textContent = `Kein Bild: ${message}`;
      if (this.refs.error) {
        this.refs.error.textContent = `${message} Bitte für n und m verschiedene Werte wählen.`;
        this.refs.error.hidden = false;
      }
      return;
    }
    if (this.refs.error) this.refs.error.hidden = true;
    if (caption) caption.textContent = describeMode(mode.n, mode.m).text;
    this.draw(slot);
  }

  drawAll() {
    this.update('a');
    this.update('b');
  }

  draw(slot) {
    const mode = this.modes[slot];
    const canvas = this.refs[`canvas${slot.toUpperCase()}`];
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    const field = buildField(mode.n, mode.m, FIELD_RESOLUTION);
    const palette = this.palette || this.readPalette(canvas);
    this.palette = palette;

    const ratio = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
    const cssSize = Math.max(120, Math.round(canvas.clientWidth || 360));
    if (canvas.width !== Math.round(cssSize * ratio) || canvas.height !== canvas.width) {
      canvas.width = Math.round(cssSize * ratio);
      canvas.height = canvas.width;
    }
    const size = canvas.width;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = css(palette.background);
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = true;

    const cells = field.cells;
    const offscreen = document.createElement('canvas');
    offscreen.width = cells;
    offscreen.height = cells;
    const offCtx = offscreen.getContext('2d');
    const image = offCtx.createImageData(cells, cells);
    for (let row = 0; row < cells; row += 1) {
      for (let column = 0; column < cells; column += 1) {
        const value = field.values[row * field.size + column];
        const intensity = Math.min(1, Math.abs(value));
        const colour =
          value >= 0
            ? mix(palette.background, palette.primary, 0.08 + 0.34 * intensity)
            : mix(palette.background, palette.muted, 0.05 + 0.2 * intensity);
        const target = (row * cells + column) * 4;
        image.data[target] = colour[0];
        image.data[target + 1] = colour[1];
        image.data[target + 2] = colour[2];
        image.data[target + 3] = 255;
      }
    }
    offCtx.putImageData(image, 0, 0);
    ctx.drawImage(offscreen, 0, 0, cells, cells, 0, 0, size, size);

    if (this.showNodes) {
      ctx.strokeStyle = css(palette.primary);
      ctx.lineWidth = Math.max(1, ratio);
      ctx.lineCap = 'round';
      ctx.beginPath();
      for (const segment of nodeSegments(field)) {
        ctx.moveTo(segment.x1 * size, segment.y1 * size);
        ctx.lineTo(segment.x2 * size, segment.y2 * size);
      }
      ctx.stroke();
    }
  }

  readPalette(canvas) {
    const fallback = { background: '#0b1012', primary: '#c6b38e', muted: '#82928e' };
    if (typeof getComputedStyle !== 'function' || !canvas) return fallback;
    const styles = getComputedStyle(canvas);
    const read = (name, value) => parseHex(styles.getPropertyValue(name), parseHex(value, [0, 0, 0]));
    return {
      background: read('--color-bg-deep', fallback.background),
      primary: read('--color-primary', fallback.primary),
      muted: read('--color-line-strong', fallback.muted),
    };
  }

  dispose() {
    clearTimeout(this.resizeTimer);
    window.removeEventListener('resize', this.onResize);
    this.refs = {};
    this.palette = null;
  }
}
