/**
 * Macht relative Bestandsassets in einer gerenderten Insel absolut.
 *
 * Die Bestandsmodule rendern Bildpfade wie `assets/radiasthesie/pendel.svg`.
 * Im Bestand standen sie auf der Startseite, dort löste der Browser sie gegen
 * `/` auf. Auf einer Unterseite (`/pendeln/labor.html`) würde daraus
 * `/pendeln/assets/...` und damit ein 404. Die Funktion schreibt `src`,
 * `data-src`, `href` und `poster` von `assets/…` auf `<app-base>assets/…` um.
 *
 * `app-base` steht als Meta-Tag im Layout (`/` im Quellbuild, `/velarkana/`
 * im GitHub-Pages-Artefakt). Nur lokale Pfade werden angefasst, externe URLs
 * bleiben unberührt.
 */
export function rebaseAssets(root: ParentNode): void {
  const base = document.querySelector('meta[name="app-base"]')?.getAttribute('content') || '/';
  const normalized = base.endsWith('/') ? base : `${base}/`;
  const attributes = ['src', 'data-src', 'href', 'poster'];
  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      if (value.startsWith('assets/')) element.setAttribute(attribute, `${normalized}${value}`);
      else if (value.startsWith('./assets/')) element.setAttribute(attribute, `${normalized}${value.slice(2)}`);
      else if (value.startsWith('../assets/')) element.setAttribute(attribute, `${normalized}${value.slice(3)}`);
    }
  });
}
