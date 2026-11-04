/**
 * Annotationsebene für Entwurfs-Screenshots — nur mit ?annotate=1 aktiv.
 * Setzt Zahlenmarken an die im Dokument (01-design.md §7) beschriebenen
 * Stellen. Positionen in Dokumentkoordinaten, damit Vollseiten-Screenshots
 * korrekt bleiben.
 */
window.addEventListener('load', () => {
  if (!new URLSearchParams(window.location.search).has('annotate')) return;
  const rail = document.querySelector('.page-toc');
  if (!rail) return;
  const railLeft = rail.getBoundingClientRect().left + window.scrollX;

  const marks = [
    { n: 1, sel: '.page-toc', dx: -30 },
    { n: 2, sel: '.page-toc__title', dx: -56 },
    { n: 3, sel: '.page-toc__link[aria-current]', dx: -82 },
    { n: 4, sel: '.page-toc__list .page-toc__list .page-toc__link', dx: -30 },
    { n: 5, sel: '.page-toc__body', dx: -56 },
    { n: 6, sel: '.page-toc__summary', dx: -30 },
  ];

  for (const mark of marks) {
    const el = document.querySelector(mark.sel);
    if (!el) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue; // im Breakpoint ausgeblendet
    const note = document.createElement('span');
    note.className = 'toc-note';
    note.textContent = String(mark.n);
    note.setAttribute('aria-hidden', 'true');
    note.style.left = `${Math.round(railLeft + mark.dx)}px`;
    note.style.top = `${Math.round(rect.top + window.scrollY)}px`;
    document.body.appendChild(note);
  }
});
