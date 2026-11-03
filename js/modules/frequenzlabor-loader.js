// Winziger Lazy-Proxy für das Frequenzlabor (ADR §6.3). Einziger statischer
// Import des Features im Initialpfad; alles Weitere lädt der Browser erst,
// wenn die Kategorie zum ersten Mal geöffnet wird.
export class FrequenzlaborLoader {
  constructor(root) {
    this.root = root;
    this.instance = null;
    this.loading = null;
  }

  async load() {
    if (this.instance) return this.instance;
    if (!this.loading) {
      this.loading = import('./frequenzlabor.js').then(({ FrequenzlaborModule }) => {
        this.instance = new FrequenzlaborModule(this.root);
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
          this.root.textContent = 'Das Frequenzlabor konnte nicht geladen werden. Bitte die Seite neu laden.';
        }
        throw error;
      }
    );
  }

  onHide() {
    if (this.instance) this.instance.onHide();
  }
}
