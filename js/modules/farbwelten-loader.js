// Winziger Lazy-Proxy für den Bereich Farben/Farbwelten. Einziger statischer
// Import dieses Bereichs im Initialpfad (NFR-1, gleiches Muster wie
// frequenzlabor-loader.js): Modul und Daten laden erst beim ersten Öffnen.
export class FarbweltenLoader {
  constructor(root) {
    this.root = root;
    this.instance = null;
    this.loading = null;
  }

  async load() {
    if (this.instance) return this.instance;
    if (!this.loading) {
      this.loading = import('./farbwelten.js').then(({ FarbweltenModule }) => {
        this.instance = new FarbweltenModule(this.root);
        return this.instance;
      });
    }
    return this.loading;
  }

  show(segments, query, options) {
    return this.load().then(
      (module) => module.show(segments, query, options),
      (error) => {
        if (this.root) {
          this.root.textContent = 'Der Bereich Farben konnte nicht geladen werden. Bitte die Seite neu laden.';
        }
        throw error;
      }
    );
  }

  onHide() {
    if (this.instance && typeof this.instance.onHide === 'function') this.instance.onHide();
  }
}
