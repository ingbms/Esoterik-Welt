// Canvas-Renderer für das Oszillogramm. Liest ausschließlich aus der Engine
// (ADR §4.4 getAnalyserData) und schreibt nichts zurück.
//
// Regeln: eine rAF-Schleife nur bei laufendem Ton und sichtbarer Seite
// (NFR-23), DPR auf 2 begrenzt, kein Allokieren pro Frame außer dem
// wiederverwendeten Float32Array. Bei prefers-reduced-motion wird nie
// animiert, sondern eine statische Welle des aktuellen Sollwerts gezeichnet
// (NFR-18).
export class FrequenzVisualisierung {
  constructor(canvas, { engine, reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.engine = engine;
    this.reducedMotion = reducedMotion;
    this.context = canvas ? canvas.getContext('2d') : null;
    this.frame = 0;
    this.active = false;
    this.buffer = null;
    this.width = 0;
    this.height = 0;
    this.colors = null;
  }

  setReducedMotion(value) {
    this.reducedMotion = Boolean(value);
    if (this.reducedMotion) this.stop();
  }

  /** Zeichnet einmalig – auch ohne laufenden Ton (statische Erklärung). */
  render(state) {
    if (!this.context) return;
    this.resize();
    const ctx = this.context;
    const { width, height } = this;
    if (!width || !height) return;
    const colors = this.colors || this.readColors();
    this.colors = colors;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = colors.background;
    ctx.fillRect(0, 0, width, height);

    // Raster: eine Mittellinie und vier Zeitmarken, 1px, keine Dekoration.
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 1; i < 5; i += 1) {
      const x = Math.round((width / 5) * i) + 0.5;
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    ctx.moveTo(0, Math.round(height / 2) + 0.5);
    ctx.lineTo(width, Math.round(height / 2) + 0.5);
    ctx.stroke();

    const running = state && state.status === 'running';
    if (this.reducedMotion) {
      this.drawStaticWave(ctx, state, colors);
      return;
    }
    if (!running || !this.engine || typeof this.engine.getAnalyserData !== 'function') {
      this.drawSilence(ctx, colors);
      return;
    }
    if (!this.buffer || this.buffer.length !== 2048) this.buffer = new Float32Array(2048);
    const data = this.engine.getAnalyserData('mix', this.buffer);
    this.drawSamples(ctx, data, colors);
  }

  drawSamples(ctx, data, colors) {
    if (!data || !data.length) return;
    const { width, height } = this;
    const mid = height / 2;
    // Der Analysator liefert [-1, 1]; die Hälfte der Höhe bleibt als Rand.
    const scale = mid * 0.88;
    ctx.strokeStyle = colors.wave;
    ctx.lineWidth = 2;
    ctx.beginPath();
    const step = width / (data.length - 1);
    for (let i = 0; i < data.length; i += 1) {
      const value = Math.max(-1, Math.min(1, data[i]));
      const x = i * step;
      const y = mid - value * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  drawStaticWave(ctx, state, colors) {
    const freq = state && Number.isFinite(state.freqHz) ? state.freqHz : 440;
    const { width, height } = this;
    const mid = height / 2;
    // Zwei Perioden, unabhängig von der Frequenz: die Achse ist normiert,
    // die konkreten Werte stehen als Text im DOM (Periode, Wellenlänge).
    ctx.strokeStyle = colors.wave;
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 1) {
      const phase = (x / width) * Math.PI * 4;
      const y = mid - Math.sin(phase) * mid * 0.62;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Zwei Perioden sind eingezeichnet; ohne Beschriftung im Canvas (aria-hidden).
    ctx.fillStyle = colors.caption;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText(`statisch · ${Math.round(freq)} Hz`, 12, 22);
  }

  drawSilence(ctx, colors) {
    const { width, height } = this;
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, Math.round(height / 2) + 0.5);
    ctx.lineTo(width, Math.round(height / 2) + 0.5);
    ctx.stroke();
    ctx.fillStyle = colors.caption;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('kein Ton', 12, 22);
  }

  readColors() {
    const fallback = {
      background: '#0b1012',
      grid: '#3c484b',
      wave: '#c6b38e',
      caption: '#babdb7',
    };
    if (typeof getComputedStyle !== 'function' || !this.canvas) return fallback;
    const styles = getComputedStyle(this.canvas);
    const pick = (name, value) => styles.getPropertyValue(name).trim() || value;
    return {
      background: pick('--color-bg-deep', fallback.background),
      grid: pick('--color-border', fallback.grid),
      wave: pick('--color-primary', fallback.wave),
      caption: pick('--color-text-secondary', fallback.caption),
    };
  }

  resize() {
    if (!this.canvas) return;
    const ratio = Math.min(typeof devicePixelRatio === 'number' ? devicePixelRatio : 1, 2);
    const cssWidth = this.canvas.clientWidth || 640;
    const cssHeight = this.canvas.clientHeight || 240;
    const width = Math.round(cssWidth * ratio);
    const height = Math.round(cssHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.width = width;
    this.height = height;
  }

  /** Startet die Animationsschleife; im Reduced-Motion-Modus passiert nichts. */
  start(getState) {
    if (this.reducedMotion || this.active) return;
    this.active = true;
    const tick = () => {
      if (!this.active) return;
      this.render(typeof getState === 'function' ? getState() : null);
      this.frame = requestAnimationFrame(tick);
    };
    this.frame = requestAnimationFrame(tick);
  }

  stop() {
    this.active = false;
    if (this.frame && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  dispose() {
    this.stop();
    this.buffer = null;
    this.context = null;
  }
}
