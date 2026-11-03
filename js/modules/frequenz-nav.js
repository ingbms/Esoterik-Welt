// Gemeinsame Bereichsnavigation des Frequenzbereichs (ADR §7.4, NFR-17).
//
// Alle fünf Ansichten tragen dieselbe Reihenfolge und dieselbe Beschriftung und
// genau ein `aria-current="page"`. Nach dem Zusammenführen der Quellenansicht
// (P11) mit der Folgestufe (P9/P10) liefen die Leisten auseinander: drei,
// vier und fünf Einträge je nach Ansicht. Diese Datei ist deshalb die einzige
// Quelle für die Leiste; sie wird nur aus den Lazy-Modulen importiert und
// berührt den Initialgraphen (NFR-1) nicht.
//
// `always` markiert die drei festen Ansichten. `cymatics` und `meditation`
// erscheinen nur, wenn ihr Feature-Flag aktiv ist.

export const FREQUENCY_VIEWS = Object.freeze([
  ['hub', '#frequenzen', 'Bibliothek', true],
  ['labor', '#frequenzen/labor', 'Frequenzlabor', true],
  ['quellen', '#frequenzen/quellen', 'Quellen & Methodik', true],
  ['cymatics', '#frequenzen/cymatics', 'Chladni-Muster', false],
  ['meditation', '#frequenzen/meditation', 'Meditation', false],
]);

export function renderViewNav(current, features = {}) {
  const items = FREQUENCY_VIEWS.filter(([name, , , always]) => always || Boolean(features[name])).map(
    ([name, href, label]) =>
      name === current
        ? `<span class="fq-nav-current" aria-current="page">${label}</span>`
        : `<a href="${href}">${label}</a>`
  );
  return `<nav class="fq-nav" aria-label="Frequenzbereich">${items.join('')}</nav>`;
}
