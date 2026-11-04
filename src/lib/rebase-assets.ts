/**
 * Macht relative Bestandsassets in einer gerenderten Insel absolut.
 *
 * Die Bestandsmodule rendern Bildpfade wie `assets/radiasthesie/pendel.svg`.
 * Im Bestand standen sie auf der Startseite, dort löste der Browser sie gegen
 * `/` auf. Auf einer Unterseite (`/pendeln/labor.html`) würde daraus
 * `/pendeln/assets/...` und damit ein 404. Die Funktion schreibt `src`,
 * `data-src` und `href` von `assets/…` auf `/assets/…` um — nur für lokale
 * Pfade, externe URLs bleiben unberührt.
 */
export function rebaseAssets(root: ParentNode): void {
  const attributes = ['src', 'data-src', 'href', 'poster'];
  root.querySelectorAll('*').forEach((element) => {
    for (const attribute of attributes) {
      const value = element.getAttribute(attribute);
      if (!value) continue;
      if (value.startsWith('assets/')) element.setAttribute(attribute, `/${value}`);
      else if (value.startsWith('./assets/')) element.setAttribute(attribute, `/${value.slice(2)}`);
      else if (value.startsWith('../assets/')) element.setAttribute(attribute, `/${value.slice(3)}`);
    }
  });
}
