/* ============================================================================
   ESOW-RAD-04 · Werkstatt-Mockup — Verhalten
   ----------------------------------------------------------------------------
   Zweck: die Zustände und Abläufe aus WERKSTATTS-SPEC/ZUSTAENDE sichtbar und
   messbar machen. Kein Produktionscode: nichts wird gespeichert, nichts
   übertragen, keine echten Downloads im Messlauf.
   Ansteuerung: ?tool=simulator|studio|experiment|journal & state=<zustand>
   ========================================================================== */
'use strict';

(function () {
  var params = new URLSearchParams(location.search);

  var TOOLS = {
    simulator: {
      nummer: 1,
      titel: 'Pendelsimulator',
      crumb: 'Pendelsimulator',
      lead:
        'Länge, Auslenkung und Dämpfung einstellen und sehen, wie sich die Schwingungsdauer verhält. Das Modell rechnet mit der klassischen Pendelformel — es sagt nichts über Antworten oder Ausschläge auf Fragen.',
      defaultState: 'bereit',
      status: {
        bereit: 'Bereit. Das Pendel steht in der Ruhelage.',
        laeuft: 'Simulation läuft. Periode und Abweichung werden mit jedem Durchlauf neu berechnet.',
        reduziert: 'Reduzierte Bewegung aktiv: keine Animation, Werte bleiben ablesbar.',
        fehler: 'Eingabe begrenzt: Fadenlänge auf 0,05 m gesetzt. Es wird kein ungültiger Wert gezeigt.'
      }
    },
    studio: {
      nummer: 2,
      titel: 'Tafel-Studio',
      crumb: 'Tafel-Studio',
      lead:
        'Eine Tafel bauen: Typ wählen, Beschriftungen eintragen, Farbstil festlegen und als SVG sichern oder drucken. Die Tafel ist eine Zeichnung zum Ausdrucken — sie sagt nichts über Wahrscheinlichkeiten aus.',
      defaultState: 'standard',
      status: {
        standard: 'Tafel mit 2 Segmenten. Export und Druck sind verfügbar.',
        leer: 'Keine Tafel: weniger als zwei Beschriftungen. Export gesperrt, Grund steht am Knopf.',
        fehler: 'Zwei Eingaben brauchen eine Korrektur. Die Zusammenfassung steht über der Vorschau.',
        violett: 'Farbstil „Gedämpftes Violett“ aktiv. Kontrast gemessen.',
        pergament: 'Farbstil „Pergament“ aktiv: dunkle Tusche auf heller Fläche.'
      }
    },
    experiment: {
      nummer: 3,
      titel: 'Test- und Demo-Labor',
      crumb: 'Test- und Demo-Labor',
      lead:
        'Ein verblindeter Ablauf: Ziel ziehen, Antwort festhalten, speichern, erst dann aufdecken. Am Ende steht eine Trefferquote mit Zufallsvergleich — keine Aussage darüber, ob Pendeln funktioniert.',
      defaultState: 'verdeckt',
      status: {
        vorbereitet: 'Protokoll noch nicht gestartet. Testart, Zielraum und Versuchszahl sind einstellbar.',
        verdeckt: 'Ziel gezogen und verdeckt. Antwort erfassen, dann speichern.',
        antwort: 'Antwort gespeichert und gesperrt. Ziel kann jetzt aufgedeckt werden.',
        enthuellt: 'Ziel aufgedeckt. Treffer oder Nicht-Treffer steht im Ergebnis.',
        abgeschlossen: 'Lauf abgeschlossen: 40 von 40 Versuchen. Auswertung und Export verfügbar.',
        leer: 'Noch kein Lauf abgeschlossen. Es gibt keine Statistik.',
        demo: 'Demo-Modus: frei spielbar, nicht in der Statistik, kein Export.'
      }
    },
    journal: {
      nummer: 4,
      titel: 'Pendeltagebuch',
      crumb: 'Pendeltagebuch',
      lead:
        'Frage, Vorhersage und späteres Ergebnis notieren. Alles bleibt auf diesem Gerät: kein Konto, keine Übertragung, vollständige Löschung auf Wunsch.',
      defaultState: 'liste',
      status: {
        liste: '3 Einträge, neueste zuerst.',
        leer: 'Noch kein Eintrag. Das Formular ist bereit.',
        fehler: 'Zwei Pflichtfelder fehlen. Die Zusammenfassung steht über den Feldern.',
        voll: 'Speicher voll: Eintrag nicht gespeichert. Eingaben bleiben im Formular.',
        bestaetigung: 'Sicherheitsabfrage offen: alle lokalen Einträge löschen?',
        geloescht: 'Alle lokalen Einträge wurden gelöscht.'
      }
    }
  };

  var NS = 'http://www.w3.org/2000/svg';
  var state = { tool: 'simulator', state: 'bereit', ziel: 3, antwort: null, versuch: 0, treffer: 12, n: 40 };

  /* ---------------------------------------------------------------- Helfer */

  function $(sel, root) {
    return (root || document).querySelector(sel);
  }
  function $all(sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  }
  function setStatus(text) {
    var el = $('#wsStatus');
    if (el) el.textContent = text;
  }
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === 'text') node.textContent = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    return node;
  }
  function svgEl(tag, attrs) {
    var node = document.createElementNS(NS, tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        node.setAttribute(k, String(attrs[k]));
      });
    }
    return node;
  }
  function debounce(fn, ms) {
    var t = null;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(null, args);
      }, ms);
    };
  }

  /* ------------------------------------------------------------ Werkzeugwahl */

  function applyTool() {
    var meta = TOOLS[state.tool];
    document.body.setAttribute('data-tool', state.tool);
    $('#wsTitel').textContent = meta.titel;
    $('#crumbWerkzeug').textContent = meta.crumb;
    $('#wsKicker').textContent = 'Werkstatt · Werkzeug ' + meta.nummer + ' von 4';
    $('#wsLead').textContent = meta.lead;
    $all('[data-toolpanel]').forEach(function (p) {
      p.hidden = p.getAttribute('data-toolpanel') !== state.tool;
    });
    $all('.rad-ws-navlink').forEach(function (a) {
      if (a.getAttribute('data-tool') === state.tool) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ------------------------------------------------------- Zustandsschalter */

  function applyState() {
    $all('[data-show-in]').forEach(function (node) {
      var list = node.getAttribute('data-show-in').split(',');
      node.hidden = list.indexOf(state.state) === -1;
    });
    setStatus((TOOLS[state.tool].status || {})[state.state] || '');
  }

  /* ====================================================== 1 · Simulator ==== */

  var sim = { running: false };

  function simParams() {
    var L = Number($('#simLaenge').value) / 100;
    var amp = Number($('#simAmp').value);
    var zeta = Number($('#simDaempfung').value) / 100;
    return { L: L, amp: amp, zeta: zeta };
  }

  function simValues() {
    var p = simParams();
    var g = 9.81;
    var theo = 2 * Math.PI * Math.sqrt(p.L / g);
    /* Gedämpfte Kreisfrequenz: ω_d = ω0·√(1−ζ²); Periode des gedämpften Systems. */
    var w0 = (2 * Math.PI) / theo;
    var wd = w0 * Math.sqrt(Math.max(0.0001, 1 - p.zeta * p.zeta));
    var gemessen = (2 * Math.PI) / wd;
    return {
      L: p.L,
      amp: p.amp,
      zeta: p.zeta,
      theo: theo,
      gemessen: gemessen,
      abw: ((gemessen - theo) / theo) * 100,
      wd: wd
    };
  }

  function fmt(n, d) {
    return n.toFixed(d).replace('.', ',');
  }

  function drawChart() {
    var v = simValues();
    var path = $('#simChartPath');
    if (!path) return;
    var pts = [];
    var tMax = 10;
    for (var i = 0; i <= 400; i++) {
      var t = (i / 400) * tMax;
      var theta = v.amp * Math.exp(-v.zeta * (2 * Math.PI / v.theo) * t) * Math.cos(v.wd * t);
      var x = (i / 400) * 640;
      /* Auf die eingestellte Auslenkung normiert, damit die Kurve die
         Zeichenfläche füllt und nicht als flache Linie erscheint. */
      var y = 80 - (theta / Math.max(1, v.amp)) * 62;
      pts.push((i === 0 ? 'M' : 'L') + x.toFixed(1) + ' ' + y.toFixed(1));
    }
    path.setAttribute('d', pts.join(' '));
  }

  function renderSim() {
    var v = simValues();
    $('#simLaengeOut').textContent = fmt(v.L, 2) + ' m';
    $('#simAmpOut').textContent = Math.round(v.amp) + '°';
    $('#simDaempfungOut').textContent = fmt(v.zeta, 2);
    $('#simPeriode').textContent = fmt(v.gemessen, 2) + ' s';
    $('#simTheorie').textContent = fmt(v.theo, 2) + ' s';
    $('#simAbw').textContent = fmt(v.abw, 1) + ' %';
    $('#simZeta').textContent = fmt(v.zeta, 2);
    drawChart();
  }

  function setSimRunning(running) {
    sim.running = running;
    var stage = $('#simBuehne');
    var btn = $('#simStart');
    stage.setAttribute('data-running', running ? 'true' : 'false');
    btn.setAttribute('aria-pressed', running ? 'true' : 'false');
    btn.textContent = running ? 'Stopp' : 'Start';
    setStatus(
      running
        ? 'Simulation läuft. Periode ' + fmt(simValues().gemessen, 2) + ' s bei ' + fmt(simValues().L, 2) + ' m Fadenlänge.'
        : 'Simulation gestoppt. Das Pendel steht in der Ruhelage; die Werte bleiben stehen.'
    );
  }

  function initSimulator() {
    ['#simLaenge', '#simAmp', '#simDaempfung'].forEach(function (sel) {
      var input = $(sel);
      input.addEventListener('input', renderSim);
    });
    $('#simStart').addEventListener('click', function () {
      setSimRunning(!sim.running);
    });
    $('#simReset').addEventListener('click', function () {
      $('#simLaenge').value = 25;
      $('#simAmp').value = 12;
      $('#simDaempfung').value = 4;
      setSimRunning(false);
      renderSim();
      setStatus('Zurückgesetzt: 0,25 m, 12°, Dämpfung 0,04.');
    });
    renderSim();
    if (state.state === 'laeuft') setSimRunning(true);
    if (state.state === 'reduziert') {
      $('#simBuehne').setAttribute('data-running', 'false');
      setStatus(TOOLS.simulator.status.reduziert);
    }
  }

  /* ===================================================== 2 · Tafel-Studio == */

  var STUDIO_DEFAULTS = {
    jaNein: ['Ja', 'Nein'],
    zahlenkreis: ['1', '2', '3', '4', '5', '6', '7', '8', '9'],
    buchstaben: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
    segmente: ['Vergangenheit', 'Gegenwart', 'Zukunft']
  };

  function validateTafel(input) {
    var errors = [];
    var labels = (input && input.labels) || [];
    var title = (input && input.title) || '';
    if (!Array.isArray(labels)) errors.push({ field: 'labels', message: 'Beschriftungen müssen eine Liste sein.' });
    if (labels.length < 2) errors.push({ field: 'labels', message: 'Mindestens zwei Beschriftungen.' });
    if (labels.length > 24) errors.push({ field: 'labels', message: 'Höchstens 24 Beschriftungen.' });
    labels.forEach(function (raw, i) {
      var s = String(raw);
      if (s.trim() === '') errors.push({ field: 'labels[' + i + ']', message: 'Beschriftung ' + (i + 1) + ' ist leer.' });
      if (s.length > 40) errors.push({ field: 'labels[' + i + ']', message: 'Beschriftung ' + (i + 1) + ' ist länger als 40 Zeichen.' });
      if (/[\u0000-\u001F\u007F]/.test(s))
        errors.push({ field: 'labels[' + i + ']', message: 'Beschriftung ' + (i + 1) + ' enthält ein Steuerzeichen.' });
    });
    if (title.length > 60) errors.push({ field: 'title', message: 'Titel ist länger als 60 Zeichen.' });
    return { ok: errors.length === 0, errors: errors };
  }

  /* Tafel als DOM-SVG. Alle Texte über textContent — keine String-Konkatenation
     mit Nutzereingaben, damit auch "<script>" nur Text bleibt. */
  function buildTafel(type, options) {
    var opts = options || {};
    var labels = (opts.labels || STUDIO_DEFAULTS[type] || []).slice(0, 24);
    var numbering = opts.numbering !== false;
    var style = opts.style || 'gold';
    var title = opts.title || 'Pendeltafel';
    var svg = svgEl('svg', {
      xmlns: NS,
      viewBox: '0 0 600 600',
      width: '600',
      height: '600',
      role: 'img',
      'data-style': style
    });
    var t = svgEl('title');
    t.textContent = title;
    var d = svgEl('desc');
    d.textContent = 'Tafel mit ' + labels.length + ' Segmenten: ' + labels.join(', ') + '.';
    svg.appendChild(t);
    svg.appendChild(d);

    svg.appendChild(
      svgEl('circle', { cx: 300, cy: 300, r: 292, fill: 'var(--plate-face)', stroke: 'var(--plate-line)', 'stroke-width': 2 })
    );

    if (type === 'jaNein') {
      /* Trennlinie waagerecht: Ja oben, Nein unten — die Beschriftung liegt
         damit in ihrem eigenen Halbkreis. */
      svg.appendChild(
        svgEl('path', {
          d: 'M40 300 A260 260 0 0 1 560 300',
          fill: 'none',
          stroke: 'var(--plate-line)',
          'stroke-width': 2
        })
      );
      svg.appendChild(svgEl('line', { x1: 40, y1: 300, x2: 560, y2: 300, stroke: 'var(--plate-line)', 'stroke-width': 2 }));
      addText(svg, 300, 168, 'Ja', 'var(--plate-ink)', 44);
      addText(svg, 300, 452, 'Nein', 'var(--plate-ink)', 44);
      svg.appendChild(svgEl('circle', { cx: 300, cy: 300, r: 78, fill: 'var(--plate-face)', stroke: 'var(--plate-line)', 'stroke-width': 2 }));
      addText(svg, 300, 314, '?', 'var(--plate-soft)', 40);
      return { svg: svg, segments: labels };
    }

    if (type === 'zahlenkreis') {
      var rr = 196;
      labels.forEach(function (label, i) {
        var a = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        addText(svg, 300 + Math.cos(a) * rr, 300 + Math.sin(a) * rr + 12, String(label), 'var(--plate-ink)', 40);
      });
      svg.appendChild(svgEl('circle', { cx: 300, cy: 300, r: 120, fill: 'none', stroke: 'var(--plate-line)', 'stroke-width': 2 }));
      addText(svg, 300, 316, '?', 'var(--plate-soft)', 48);
      return { svg: svg, segments: labels };
    }

    if (type === 'buchstaben') {
      var rb = 232;
      labels.forEach(function (label, i) {
        var ab = (i / labels.length) * Math.PI * 2 - Math.PI / 2;
        addText(svg, 300 + Math.cos(ab) * rb, 300 + Math.sin(ab) * rb + 8, String(label), 'var(--plate-ink)', 26);
      });
      svg.appendChild(svgEl('circle', { cx: 300, cy: 300, r: 150, fill: 'none', stroke: 'var(--plate-line)', 'stroke-width': 2 }));
      addText(svg, 300, 316, '?', 'var(--plate-soft)', 44);
      return { svg: svg, segments: labels };
    }

    /* Freie Segmente: Tortenstücke mit Trennlinien, Beschriftung am Mittelwinkel. */
    var n = labels.length;
    var step = (Math.PI * 2) / n;
    labels.forEach(function (label, i) {
      var a0 = i * step - Math.PI / 2;
      var a1 = (i + 1) * step - Math.PI / 2;
      var x0 = 300 + Math.cos(a0) * 260;
      var y0 = 300 + Math.sin(a0) * 260;
      var x1 = 300 + Math.cos(a1) * 260;
      var y1 = 300 + Math.sin(a1) * 260;
      var large = a1 - a0 > Math.PI ? 1 : 0;
      svg.appendChild(
        svgEl('path', {
          d: 'M300 300 L' + x0.toFixed(1) + ' ' + y0.toFixed(1) + ' A260 260 0 ' + large + ' 1 ' + x1.toFixed(1) + ' ' + y1.toFixed(1) + ' Z',
          fill: 'none',
          stroke: 'var(--plate-line)',
          'stroke-width': 1.5
        })
      );
      var am = a0 + step / 2;
      var lx = 300 + Math.cos(am) * (n > 8 ? 178 : 150);
      var ly = 300 + Math.sin(am) * (n > 8 ? 178 : 150);
      var fs = n > 12 ? 16 : n > 8 ? 18 : n > 4 ? 22 : 26;
      var text = numbering ? String(i + 1) + ' · ' + label : String(label);
      addText(svg, lx, ly + fs / 3, text, 'var(--plate-ink)', fs);
    });
    return { svg: svg, segments: labels };
  }

  function addText(svg, x, y, text, fill, size) {
    var node = svgEl('text', {
      x: Number(x).toFixed(1),
      y: Number(y).toFixed(1),
      'text-anchor': 'middle',
      'font-family': 'Fraunces, Georgia, serif',
      'font-size': size,
      fill: fill
    });
    node.textContent = text;
    svg.appendChild(node);
    return node;
  }

  function exportString(svg) {
    var xml = new XMLSerializer().serializeToString(svg);
    if (xml.indexOf('xmlns="' + NS + '"') === -1) {
      xml = xml.replace('<svg', '<svg xmlns="' + NS + '"');
    }
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + xml + '\n';
  }

  var studio = { type: 'jaNein', labels: STUDIO_DEFAULTS.jaNein.slice(), style: 'gold', numbering: true, title: 'Pendeltafel' };

  function renderStudioLabels() {
    var list = $('#studioLabelList');
    list.textContent = '';
    studio.labels.forEach(function (label, i) {
      var li = el('li', { class: 'rad-studio-label-row' });
      var input = el('input', {
        class: 'input rad-ws-input',
        type: 'text',
        maxlength: '40',
        'aria-label': 'Beschriftung ' + (i + 1),
        id: 'studioLabel' + i
      });
      input.value = label;
      input.addEventListener('input', debounce(function () {
        studio.labels[i] = input.value;
        renderStudioPlate();
      }, 120));
      var del = el('button', { class: 'btn btn-secondary', type: 'button', 'aria-label': 'Beschriftung ' + (i + 1) + ' entfernen', text: '−' });
      del.addEventListener('click', function () {
        studio.labels.splice(i, 1);
        renderStudioLabels();
        renderStudioPlate();
        setStatus('Beschriftung entfernt. ' + studio.labels.length + ' von mindestens 2 vorhanden.');
      });
      li.appendChild(input);
      li.appendChild(del);
      list.appendChild(li);
    });
    var add = el('li', {});
    var addBtn = el('button', { class: 'btn btn-secondary', type: 'button', text: '+ Beschriftung hinzufügen' });
    addBtn.addEventListener('click', function () {
      if (studio.labels.length >= 24) {
        setStatus('Höchstens 24 Beschriftungen. Weitere Eingaben werden nicht angenommen.');
        return;
      }
      studio.labels.push('Neu');
      renderStudioLabels();
      renderStudioPlate();
    });
    add.appendChild(addBtn);
    list.appendChild(add);
    $('#studioCount').textContent = studio.labels.length + ' von 24';
    $('#studioCount').setAttribute('data-over', studio.labels.length > 24 ? 'true' : 'false');
  }

  function renderStudioPlate() {
    var result = buildTafel(studio.type, {
      labels: studio.labels,
      title: studio.title,
      style: studio.style,
      numbering: studio.numbering
    });
    var host = $('#studioPlate');
    host.setAttribute('data-style', studio.style);
    host.textContent = '';
    host.appendChild(result.svg);
    var printHost = $('#studioPrintPlate');
    if (printHost) {
      /* Druck nutzt immer die Pergament-Variante: dunkle Tusche auf hellem
         Papier, unabhängig vom Bildschirmstil. */
      printHost.setAttribute('data-style', 'pergament');
      printHost.textContent = '';
      printHost.appendChild(result.svg.cloneNode(true));
    }
    var printTitle = $('#studioPrintTitel');
    if (printTitle) printTitle.textContent = studio.title;
    studio.lastResult = result;
  }

  function initStudio() {
    $all('input[name="studioTyp"]').forEach(function (r) {
      r.addEventListener('change', function () {
        studio.type = r.value;
        studio.labels = (STUDIO_DEFAULTS[studio.type] || []).slice();
        renderStudioLabels();
        renderStudioPlate();
        setStatus('Tafeltyp gewechselt: ' + studio.type + '. Beschriftungen auf Standardwerte zurückgesetzt.');
      });
    });
    $all('input[name="studioStil"]').forEach(function (r) {
      r.addEventListener('change', function () {
        studio.style = r.value;
        renderStudioPlate();
        setStatus('Farbstil: ' + r.value + '. Angezeigt werden Tokenpaare, keine Rohfarben.');
      });
    });
    $('#studioNummern').addEventListener('change', function (e) {
      studio.numbering = e.target.checked;
      renderStudioPlate();
    });
    $('#studioTitelFeld').addEventListener('input', function (e) {
      studio.title = e.target.value || 'Pendeltafel';
      renderStudioPlate();
    });
    $('#studioExport').addEventListener('click', function () {
      var check = validateTafel({ labels: studio.labels, title: studio.title });
      if (!check.ok) {
        setStatus('Export nicht möglich: ' + check.errors[0].message);
        return;
      }
      var str = exportString(studio.lastResult.svg);
      setStatus('SVG erzeugt: radiasthesie-tafel-' + studio.type + '-2026-11-03.svg, ' + str.length + ' Zeichen, keine externen Verweise.');
    });
    $('#studioDruck').addEventListener('click', function () {
      setStatus('Druckansicht vorbereitet: nur Tafel und Titel. PDF entsteht über den Druckdialog.');
    });
    $('#studioImport').addEventListener('change', function () {
      setStatus('Import geprüft: nur eigenes JSON bis 1 MB, unbekannte Felder werden ignoriert.');
    });
    $('#studioImportBtn').addEventListener('click', function () {
      $('#studioImport').click();
    });

    if (state.state === 'leer') {
      studio.labels = [];
      renderStudioLabels();
      renderStudioPlate();
    } else if (state.state === 'violett' || state.state === 'pergament') {
      studio.style = state.state;
      var radio = document.querySelector('input[name="studioStil"][value="' + state.state + '"]');
      if (radio) radio.checked = true;
      renderStudioLabels();
      renderStudioPlate();
    } else {
      renderStudioLabels();
      renderStudioPlate();
    }
  }

  /* ============================================== 3 · Test-/Demo-Labor ==== */

  /* Exakter zweiseitiger Binomialtest und Wilson-Intervall — nur zur Anzeige.
     Die Produktion implementiert dieselben Funktionen in getesteten Modulen. */
  function logFactorial(n) {
    var s = 0;
    for (var i = 2; i <= n; i++) s += Math.log(i);
    return s;
  }
  function logChoose(n, k) {
    return logFactorial(n) - logFactorial(k) - logFactorial(n - k);
  }
  function binomialExactP(h, n, p) {
    var logPmf = function (k) {
      return logChoose(n, k) + k * Math.log(p) + (n - k) * Math.log(1 - p);
    };
    var observed = logPmf(h);
    var total = 0;
    for (var k = 0; k <= n; k++) {
      var lp = logPmf(k);
      if (lp <= observed + 1e-9) total += Math.exp(lp);
    }
    return Math.min(1, total);
  }
  function wilsonInterval(h, n, z) {
    if (n === 0) return [0, 1];
    var zz = z || 1.959963984540054;
    var ph = h / n;
    var denom = 1 + (zz * zz) / n;
    var center = (ph + (zz * zz) / (2 * n)) / denom;
    var half = (zz * Math.sqrt((ph * (1 - ph)) / n + (zz * zz) / (4 * n * n))) / denom;
    return [Math.max(0, center - half), Math.min(1, center + half)];
  }

  function expRender() {
    var n = Number($('#expN').value);
    $('#expNOut').textContent = String(n);
    $('#expZaehler').textContent = 'Versuch ' + state.versuch + ' von ' + n;
    $('#expBar').style.setProperty('--p', Math.round((state.versuch / n) * 100) + '%');
    var h = state.treffer;
    var p = binomialExactP(h, n, 0.25);
    var ci = wilsonInterval(h, n);
    if ($('#expH')) $('#expH').textContent = h + ' / ' + n;
    if ($('#expErwartung')) $('#expErwartung').textContent = (n / 4).toFixed(1).replace('.', ',');
    if ($('#expP')) $('#expP').textContent = p.toFixed(4).replace('.', ',');
    if ($('#expCI'))
      $('#expCI').textContent =
        ci[0].toFixed(2).replace('.', ',') + '–' + ci[1].toFixed(2).replace('.', ',');
  }

  function expSetStage(kind) {
    var ziel = $('#expZiel');
    var text = $('#expStageText');
    var btn = $('#expWeiter');
    if (kind === 'verdeckt' || kind === 'antwort') {
      ziel.setAttribute('data-hidden', 'true');
      ziel.textContent = '?';
      text.textContent =
        kind === 'antwort'
          ? 'Antwort gespeichert und gesperrt. Das Ziel ist noch verdeckt — jetzt aufdecken.'
          : 'Ziel gezogen und verdeckt. Bitte die Antwort wählen; sie wird vor dem Aufdecken gespeichert.';
      btn.textContent = kind === 'antwort' ? 'Ziel aufdecken' : 'Antwort speichern';
    } else if (kind === 'enthuellt' || kind === 'abgeschlossen') {
      ziel.setAttribute('data-hidden', 'false');
      ziel.textContent = String(state.ziel);
      text.textContent =
        'Ziel ' + state.ziel + ' · Antwort ' + (state.antwort === null ? '—' : state.antwort) + '. Die Antwort war vor dem Aufdecken gespeichert.';
      btn.textContent = kind === 'abgeschlossen' ? 'Nächster Lauf' : 'Nächster Versuch';
    } else {
      ziel.setAttribute('data-hidden', 'true');
      ziel.textContent = '?';
      text.textContent = 'Noch kein Ziel gezogen. Im Testmodus wird das Ziel verdeckt gezogen, die Antwort gespeichert und erst danach aufgedeckt.';
      btn.textContent = 'Protokoll starten';
    }
  }

  function expLock(locked) {
    $all('.rad-exp-answer').forEach(function (b) {
      b.disabled = locked;
    });
    $all('input[name="expModusWahl"], input[name="expArt"], #expN').forEach(function (i) {
      i.disabled = locked;
    });
  }

  function expApplyState() {
    var locked = ['antwort', 'enthuellt', 'abgeschlossen'].indexOf(state.state) !== -1;
    if (state.state === 'vorbereitet') {
      expSetStage('vorbereitet');
      state.versuch = 0;
      state.antwort = null;
    } else if (state.state === 'verdeckt') {
      expSetStage('verdeckt');
      state.versuch = 6;
      state.antwort = null;
    } else if (state.state === 'antwort') {
      expSetStage('antwort');
      state.versuch = 7;
      state.antwort = 2;
    } else if (state.state === 'enthuellt') {
      expSetStage('enthuellt');
      state.versuch = 7;
      state.antwort = 3;
      expResult(true);
    } else if (state.state === 'abgeschlossen') {
      expSetStage('abgeschlossen');
      state.versuch = 40;
      state.antwort = 3;
      state.treffer = 12;
      expResult(true);
    } else if (state.state === 'leer') {
      expSetStage('vorbereitet');
    }
    expLock(locked);
    expRender();
  }

  function expResult(hit) {
    var box = $('#expResult');
    box.setAttribute('data-hit', hit ? 'true' : 'false');
    $('#expResultTitel').textContent = hit ? 'Treffer.' : 'Nicht getroffen.';
    $('#expResultText').textContent =
      'Ziel ' + state.ziel + ', Antwort ' + (state.antwort === null ? '—' : state.antwort) + '. Die Antwort war vor dem Aufdecken gespeichert und ist gesperrt.';
  }

  function initExperiment() {
    $('#expWeiter').addEventListener('click', function () {
      var s = state.state;
      if (s === 'vorbereitet' || s === 'leer') {
        state.state = 'verdeckt';
        state.versuch = 1;
        expSetStage('verdeckt');
      } else if (s === 'verdeckt') {
        if (state.antwort === null) {
          setStatus('Zuerst eine Antwort wählen. Ohne gespeicherte Antwort wird nicht aufgedeckt.');
          return;
        }
        state.state = 'antwort';
        expSetStage('antwort');
      } else if (s === 'antwort') {
        state.state = 'enthuellt';
        expSetStage('enthuellt');
        expResult(state.antwort === state.ziel);
      } else {
        state.versuch += 1;
        state.antwort = null;
        if (state.versuch > Number($('#expN').value)) {
          state.state = 'abgeschlossen';
          expSetStage('abgeschlossen');
        } else {
          state.state = 'verdeckt';
          expSetStage('verdeckt');
        }
      }
      applyState();
      expLock(['antwort', 'enthuellt', 'abgeschlossen'].indexOf(state.state) !== -1);
      expRender();
    });

    $all('.rad-exp-answer').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (state.state !== 'verdeckt') {
          setStatus('Antworten sind in diesem Schritt gesperrt.');
          return;
        }
        $all('.rad-exp-answer').forEach(function (b) {
          b.setAttribute('aria-pressed', 'false');
        });
        btn.setAttribute('aria-pressed', 'true');
        state.antwort = Number(btn.textContent);
        state.state = 'antwort';
        expSetStage('antwort');
        expLock(true);
        applyState();
        setStatus('Antwort ' + state.antwort + ' gespeichert und gesperrt. Ziel noch verdeckt.');
      });
    });

    $('#expN').addEventListener('input', expRender);
    expApplyState();
  }

  /* ===================================================== 4 · Journal ====== */

  var ENTRIES = [
    {
      date: '2026-11-02',
      question: 'Finde ich den verlorenen Schlüssel im Flur?',
      method: 'Pendel über Tafel',
      prediction: 'Ja, im Flur',
      confidence: 4,
      result: 'Nicht im Flur gefunden, lag im Auto.',
      experiment: null
    },
    {
      date: '2026-10-28',
      question: 'Kommt heute Post von der Versicherung?',
      method: 'Winkelrute',
      prediction: 'Nein',
      confidence: 3,
      result: 'Ja, ein Brief lag im Kasten.',
      experiment: null
    },
    {
      date: '2026-10-21',
      question: 'Testlauf Richtung: links oder rechts?',
      method: 'Pendel über Tafel',
      prediction: 'links',
      confidence: 2,
      result: 'Treffer im Lauf 3 (Versuch 7).',
      experiment: 'exp-2026-10-21-01'
    }
  ];

  function renderJournal() {
    var list = $('#journalListe');
    if (!list) return;
    list.textContent = '';
    var filter = (document.querySelector('input[name="journalFilter"]:checked') || {}).value || 'alle';
    ENTRIES.filter(function (e) {
      return filter === 'alle' || e.experiment;
    }).forEach(function (entry) {
      var li = el('li', {});
      var det = el('details', { class: 'rad-journal-entry' });
      var sum = el('summary', {});
      var d = el('span', { class: 'rad-journal-date', text: entry.date });
      var q = el('span', { class: 'rad-journal-question', text: entry.question });
      sum.appendChild(d);
      sum.appendChild(q);
      var body = el('div', { class: 'rad-journal-body' });
      body.appendChild(el('p', { text: 'Methode: ' + entry.method }));
      body.appendChild(el('p', { text: 'Vorhersage: ' + entry.prediction }));
      body.appendChild(el('p', { text: 'Sicherheit: ' + entry.confidence + ' von 5' }));
      body.appendChild(el('p', { text: 'Ergebnis: ' + entry.result }));
      if (entry.experiment) {
        var p = el('p', {});
        var b = el('b', { text: 'Experimentbezug: ' });
        var a = el('a', { href: '#pendeln/experimente', text: entry.experiment });
        p.appendChild(b);
        p.appendChild(a);
        body.appendChild(p);
      }
      det.appendChild(sum);
      det.appendChild(body);
      li.appendChild(det);
      list.appendChild(li);
    });
    if (!list.children.length) {
      var empty = el('li', { class: 'rad-ws-empty' });
      empty.appendChild(el('p', { text: 'Kein Eintrag mit Experimentbezug. Filter zurücksetzen, um alle zu sehen.' }));
      list.appendChild(empty);
    }
  }

  function journalValidate() {
    var errors = [];
    if (!$('#journalFrage').value.trim()) errors.push('#journalFrage');
    if (!$('#journalVorhersage').value.trim()) errors.push('#journalVorhersage');
    return errors;
  }

  function initJournal() {
    renderJournal();
    $('#journalFrage').addEventListener('input', function (e) {
      $('#journalFrageZaehler').textContent = e.target.value.length + ' / 200';
    });
    $all('input[name="journalFilter"]').forEach(function (r) {
      r.addEventListener('change', renderJournal);
    });
    $('#journalSpeichern').addEventListener('click', function () {
      var errs = journalValidate();
      if (errs.length) {
        errs.forEach(function (sel) {
          $(sel).setAttribute('aria-invalid', 'true');
        });
        setStatus('Nicht gespeichert: ' + errs.length + ' Pflichtfeld(er) fehlen. Die Zusammenfassung steht über den Feldern.');
        state.state = 'fehler';
        applyState();
        return;
      }
      setStatus('Eintrag gespeichert: lokal, ohne Konto. Er erscheint oben in der Liste.');
      state.state = 'liste';
      applyState();
    });
    $('#journalAlles').addEventListener('click', function () {
      state.state = 'bestaetigung';
      applyState();
      $('#journalAbbrechen').focus();
    });
    $('#journalAbbrechen').addEventListener('click', function () {
      state.state = 'liste';
      applyState();
      setStatus('Löschen abgebrochen. Es wurde nichts entfernt.');
    });
    $('#journalLoeschen').addEventListener('click', function () {
      ENTRIES.length = 0;
      state.state = 'geloescht';
      applyState();
      renderJournal();
      setStatus('Alle lokalen Einträge gelöscht: esot_rad_journal_v1, esot_rad_experiment_v1, esot_rad_studio_v1.');
    });
  }

  /* --------------------------------------------------------------- Start -- */

  function boot() {
    var tool = params.get('tool');
    state.tool = TOOLS[tool] ? tool : 'simulator';
    var wanted = params.get('state');
    state.state = wanted || TOOLS[state.tool].defaultState;

    applyTool();
    applyState();

    if (state.tool === 'simulator') initSimulator();
    if (state.tool === 'studio') initStudio();
    if (state.tool === 'experiment') initExperiment();
    if (state.tool === 'journal') initJournal();

    applyState();
    if ((TOOLS[state.tool].status || {})[state.state]) setStatus(TOOLS[state.tool].status[state.state]);
  }

  /* Für die Messung: reine Funktionen und Export prüfbar machen. */
  window.RadWerkstatt = {
    buildTafel: buildTafel,
    validateTafel: validateTafel,
    exportString: exportString,
    binomialExactP: binomialExactP,
    wilsonInterval: wilsonInterval,
    getState: function () {
      return state;
    }
  };

  /* Druck: alle Journal-Einträge offen zeigen. Der CSS-Weg (::details-content)
     deckt moderne Browser ab; ältere ignorieren die Regel, deshalb zusätzlich
     beim Drucken öffnen und danach den Bildschirmzustand wiederherstellen. */
  window.addEventListener('beforeprint', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.rad-journal-entry'), function (d) {
      if (!d.open) {
        d.dataset.printOpened = '1';
        d.open = true;
      }
    });
  });
  window.addEventListener('afterprint', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.rad-journal-entry[data-print-opened]'), function (d) {
      d.open = false;
      delete d.dataset.printOpened;
    });
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
