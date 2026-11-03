// Winziger Lazy-Proxy für den Bereich Pendeln/Radiästhesie. Einziger statischer
// Import dieses Bereichs im Initialpfad (NFR-1, gleiches Muster wie
// frequenzlabor-loader.js): Das Modul und seine Daten laden erst, wenn die
// Kategorie zum ersten Mal geöffnet wird.
export class RadiasthesieLoader {
  constructor(root) {
    this.root = root;
    this.instance = null;
    this.loading = null;
  }

  async load() {
    if (this.instance) return this.instance;
    if (!this.loading) {
      this.loading = import('./radiasthesie.js').then(({ RadiasthesieModule }) => {
        this.instance = new RadiasthesieModule(this.root);
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
          this.root.textContent = 'Der Bereich Pendeln konnte nicht geladen werden. Bitte die Seite neu laden.';
        }
        throw error;
      }
    );
  }

  onShow() {
    return this.show([], '', { focus: false });
  }

  onHide() {
    if (this.instance && typeof this.instance.onHide === 'function') this.instance.onHide();
  }
}
