// Pendeltafel-Studio — Bedienung (RAD-08).
//
// Trennung wie beim Pendellabor: Datenmodell, Prüfung, Geometrie und
// SVG-Erzeugung stehen in pendeltafel-model.js und sind ohne DOM prüfbar.
// Dieses Modul verbindet die von radiasthesie-views.js gerenderte Oberfläche
// mit diesem Modell: Vorschau, Farbstil, Export, Import und Druck.
//
// Es gibt keinen Timer außer dem kurzen Entprellen der Textfelder, keine
// Animation und keine Netzwerkanfrage. destroy() beendet den Entpreller; die
// Ereignislistener hängen an Knoten, die beim Neu-Rendern der Route entfernt
// werden.

import {
  BOARD_LIMITS,
  BOARD_PRESETS,
  PALETTES,
  PRESET_IDS,
  buildSvg,
  defaultConfigForPreset,
  fileStem,
  layoutBoard,
  maxLabelLengthFor,
  parseBoardJson,
  presetById,
  serializeBoard,
  validateBoard,
} from './pendeltafel-model.js';

const DEBOUNCE_MS = 120;

function readLabels(textarea) {
  const lines = String(textarea || '')
    .replace(/\r\n/g, '\n')
    .split('\n');
  // Eine abschließende Leerzeile ist beim Tippen normal und keine leere
  // Beschriftung; Leerzeilen in der Mitte bleiben ein Fehler.
  while (lines.length > 1 && lines[lines.length - 1].trim() === '') lines.pop();
  return lines;
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('de-DE', { day: '2-digit', month: 'long', year: 'numeric' }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

export function mountPendeltafelStudio(container) {
  if (!container) return { destroy() {} };

  // Die Druckansicht steht bewusst außerhalb des Bedienfeldes (eigene
  // A4-Fläche unter der Werkstatt). Deshalb wird sie über den Modulwurzel-
  // knoten gesucht, nicht über das Bedienfeld.
  const scope = container.closest('.rad') || container;
  const root = document.documentElement;
  if (root) root.classList.add('ptf-print-active');

  const presetSelect = container.querySelector('#ptfPreset');
  const titleInput = container.querySelector('#ptfTitle');
  const labelsInput = container.querySelector('#ptfLabels');
  const paletteInputs = [...container.querySelectorAll('input[name="ptfPalette"]')];
  const preview = container.querySelector('#ptfPreview');
  const sheetBoard = scope.querySelector('#ptfSheetBoard');
  const sheet = scope.querySelector('#ptfSheet');
  const sheetTitle = scope.querySelector('#ptfSheetTitle');
  const sheetDate = scope.querySelector('#ptfSheetDate');
  const sheetPalette = scope.querySelector('#ptfSheetPalette');
  const status = container.querySelector('#ptfStatus');
  const limitsFace = container.querySelector('[data-ptf-limits]');
  const errorList = container.querySelector('#ptfErrors');
  const labelError = container.querySelector('#ptfLabelError');
  const importFile = container.querySelector('#ptfImportFile');
  const importText = container.querySelector('#ptfImportText');
  const buttons = {
    svg: container.querySelector('#ptfDownloadSvg'),
    json: container.querySelector('#ptfDownloadJson'),
    print: container.querySelector('#ptfPrint'),
    importApply: container.querySelector('#ptfImportApply'),
  };

  let current = defaultConfigForPreset('janain');
  let timer = null;

  const announce = (message) => {
    if (status) status.textContent = message;
  };

  const clearErrors = () => {
    if (errorList) {
      errorList.innerHTML = '';
      errorList.hidden = true;
    }
    if (labelError) {
      labelError.textContent = '';
      labelError.hidden = true;
    }
    if (labelsInput) labelsInput.removeAttribute('aria-invalid');
    if (titleInput) titleInput.removeAttribute('aria-invalid');
  };

  const showErrors = (errors) => {
    clearErrors();
    if (errorList) {
      errorList.innerHTML = '';
      for (const message of errors) {
        const item = document.createElement('li');
        item.textContent = message;
        errorList.append(item);
      }
      errorList.hidden = false;
    }
    const joined = errors.join(' ');
    if (labelError) {
      labelError.textContent = joined;
      labelError.hidden = false;
    }
    if (labelsInput && errors.some((message) => /Beschriftung|Segmente|labels/.test(message))) {
      labelsInput.setAttribute('aria-invalid', 'true');
    }
    if (titleInput && errors.some((message) => /Überschrift/.test(message))) {
      titleInput.setAttribute('aria-invalid', 'true');
    }
  };

  const paint = (config, { announceChange = false } = {}) => {
    const layout = layoutBoard(config);
    if (preview) preview.innerHTML = buildSvg(config);
    // Die Druckansicht setzt Überschrift und Fußzeile als HTML; die Grafik
    // kommt ohne diese Bildunterschrift, damit nichts doppelt erscheint.
    if (sheetBoard) sheetBoard.innerHTML = buildSvg(config, { caption: false });
    if (sheetTitle) sheetTitle.textContent = config.title;
    if (sheetDate) sheetDate.textContent = formatDate(new Date());
    if (sheetPalette) sheetPalette.textContent = PALETTES[config.palette].label;
    if (sheet) sheet.setAttribute('data-ptf-palette', config.palette);
    if (limitsFace) {
      limitsFace.textContent = `${config.labels.length} Segmente · ${
        BOARD_LIMITS.maxTitleLength
      } Zeichen Überschrift · höchstens ${maxLabelLengthFor(config.labels.length)} Zeichen je Beschriftung · erlaubt sind ${
        BOARD_LIMITS.minSegments
      }–${BOARD_LIMITS.maxSegments} Segmente`;
    }
    current = config;
    syncPresetDisplay(config);
    if (announceChange) {
      announce(`Vorschau aktualisiert: ${layout.segments} Segmente, Farbstil ${PALETTES[config.palette].label}.`);
    }
  };

  const draftFromForm = () => ({
    schema: 'esow.pendeltafel/1',
    // „custom“ ist nur ein Anzeigezustand: Die Konfiguration behält die zuletzt
    // geladene Vorlage, damit Schema und Dateiname gültig bleiben.
    preset: presetSelect && presetSelect.value !== 'custom' ? presetSelect.value : current.preset,
    title: titleInput ? titleInput.value : current.title,
    palette: paletteInputs.find((input) => input.checked)?.value || current.palette,
    labels: labelsInput ? readLabels(labelsInput.value) : [...current.labels],
  });

  /** Zeigt im Auswahlfeld, ob die Zeilen noch der geladenen Vorlage entsprechen. */
  const syncPresetDisplay = (config) => {
    if (!presetSelect) return;
    const preset = presetById(config.preset);
    const matches =
      preset &&
      preset.labels.length === config.labels.length &&
      preset.labels.every((label, index) => label === config.labels[index]);
    presetSelect.value = matches ? config.preset : 'custom';
  };

  const applyPreset = (id, { silent = false } = {}) => {
    const preset = presetById(id);
    if (!preset) {
      // „Eigene Beschriftungen“ ist keine Vorlage: Auswahl auf den echten
      // Stand zurücksetzen, statt eine Änderung vorzutäuschen.
      syncPresetDisplay(current);
      return;
    }
    const palette = paletteInputs.find((input) => input.checked)?.value || current.palette;
    const config = defaultConfigForPreset(preset.id, palette);
    if (titleInput) titleInput.value = config.title;
    if (labelsInput) labelsInput.value = [...config.labels].join('\n');
    clearErrors();
    paint(config);
    if (!silent) {
      announce(`Vorlage „${preset.title}“ geladen: ${config.labels.length} Segmente, Beschriftungen ersetzt.`);
    }
  };

  const syncDraft = () => {
    const draft = draftFromForm();
    const result = validateBoard(draft);
    if (!result.ok) {
      showErrors(result.errors);
      announce('Die Eingabe ist noch nicht gültig. Die Vorschau zeigt den letzten gültigen Stand.');
      return false;
    }
    clearErrors();
    paint(result.value);
    if (result.warnings.length > 0 && labelError) {
      labelError.textContent = result.warnings.join(' ');
      labelError.hidden = false;
    }
    return true;
  };

  const scheduleSync = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      syncDraft();
    }, DEBOUNCE_MS);
  };

  const download = (filename, blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.rel = 'noopener';
    container.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return filename;
  };

  const applyImported = (result, source) => {
    if (!result.ok) {
      showErrors(result.errors);
      announce(`Import aus ${source} abgelehnt: ${result.errors.length} Fehler. Die Tafel blieb unverändert.`);
      return false;
    }
    const config = result.value;
    if (presetSelect && PRESET_IDS.includes(config.preset)) presetSelect.value = config.preset;
    if (titleInput) titleInput.value = config.title;
    if (labelsInput) labelsInput.value = [...config.labels].join('\n');
    for (const input of paletteInputs) input.checked = input.value === config.palette;
    clearErrors();
    paint(config);
    const size = result.bytes ? ` (${result.bytes} Bytes)` : '';
    announce(
      `Import aus ${source} übernommen${size}: ${config.labels.length} Segmente, Farbstil ${PALETTES[config.palette].label}.`
    );
    return true;
  };

  const handleFile = async () => {
    const file = importFile && importFile.files && importFile.files[0];
    if (!file) return;
    if (file.size > BOARD_LIMITS.maxBytes) {
      showErrors([
        `Die Datei ist ${file.size} Bytes groß; erlaubt sind höchstens ${BOARD_LIMITS.maxBytes} Bytes (${Math.round(
          BOARD_LIMITS.maxBytes / 1024
        )} KiB).`,
      ]);
      announce('Import abgelehnt: Datei zu groß. Die Tafel blieb unverändert.');
      importFile.value = '';
      return;
    }
    let text;
    try {
      text = await file.text();
    } catch (error) {
      showErrors([`Die Datei konnte nicht gelesen werden: ${String(error && error.message ? error.message : error)}`]);
      announce('Import abgelehnt: Datei nicht lesbar.');
      importFile.value = '';
      return;
    }
    applyImported(parseBoardJson(text), `Datei „${file.name}“`);
    importFile.value = '';
  };

  const handleImportText = () => {
    applyImported(parseBoardJson(importText ? importText.value : ''), 'Textfeld');
  };

  const handlers = [];

  const on = (element, type, handler) => {
    if (!element) return;
    element.addEventListener(type, handler);
    handlers.push([element, type, handler]);
  };

  on(presetSelect, 'change', () => applyPreset(presetSelect.value));
  for (const input of paletteInputs) {
    on(input, 'change', () => {
      if (input.checked) syncDraft();
    });
  }
  on(titleInput, 'input', scheduleSync);
  on(labelsInput, 'input', scheduleSync);
  on(buttons.svg, 'click', () => {
    const result = validateBoard(draftFromForm());
    if (!result.ok) {
      showErrors(result.errors);
      announce('SVG-Export abgelehnt: Die Eingabe ist nicht gültig.');
      return;
    }
    clearErrors();
    paint(result.value);
    const filename = `${fileStem(result.value.title)}.svg`;
    download(filename, new Blob([buildSvg(result.value)], { type: 'image/svg+xml;charset=utf-8' }));
    announce(`SVG heruntergeladen: ${filename} (${result.value.labels.length} Segmente).`);
  });
  on(buttons.json, 'click', () => {
    const result = validateBoard(draftFromForm());
    if (!result.ok) {
      showErrors(result.errors);
      announce('JSON-Export abgelehnt: Die Eingabe ist nicht gültig.');
      return;
    }
    clearErrors();
    paint(result.value);
    const filename = `${fileStem(result.value.title)}.json`;
    download(filename, new Blob([serializeBoard(result.value)], { type: 'application/json;charset=utf-8' }));
    announce(
      `Konfiguration heruntergeladen: ${filename}. Sie lässt sich über „Konfiguration importieren“ wieder laden.`
    );
  });
  on(buttons.print, 'click', () => {
    announce('Druckdialog geöffnet. Als Ziel „Als PDF speichern“ wählen — die Druckansicht enthält nur die Tafel.');
    if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  });
  on(importFile, 'change', handleFile);
  on(buttons.importApply, 'click', handleImportText);

  // Startzustand: Vorlage Ja/Nein, Messing. Bewusst ohne Statusmeldung beim
  // Laden, damit die Seite nicht unaufgefordert spricht.
  if (labelsInput) labelsInput.value = [...current.labels].join('\n');
  if (titleInput) titleInput.value = current.title;
  paint(current);

  return {
    destroy() {
      if (timer) clearTimeout(timer);
      timer = null;
      for (const [element, type, handler] of handlers) element.removeEventListener(type, handler);
      handlers.length = 0;
      if (root) root.classList.remove('ptf-print-active');
    },
    get config() {
      return current;
    },
    get presets() {
      return BOARD_PRESETS.map((preset) => preset.id);
    },
  };
}
