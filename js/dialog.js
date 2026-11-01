// One lifecycle for all detail dialogs, independent of animation timing.
let activeDialog = null;

export class DialogController {
  constructor(backdrop, closeButton, { onClose = null } = {}) {
    this.backdrop = backdrop;
    this.closeButton = closeButton;
    this.onClose = typeof onClose === 'function' ? onClose : null;
    this.panel = backdrop.querySelector('.modal');
    this.panel.tabIndex = -1;
    backdrop.dialogController = this;
    closeButton.addEventListener('click', () => this.close());
    backdrop.addEventListener('click', (event) => {
      if (event.target === backdrop) this.close();
    });
    this.onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        this.close();
      } else if (event.key === 'Tab') {
        const items = this.focusables();
        const index = items.indexOf(document.activeElement);
        const next = event.shiftKey ? (index <= 0 ? items.length - 1 : index - 1) : (index + 1) % items.length;
        event.preventDefault();
        event.stopImmediatePropagation();
        (items[next] || this.panel).focus();
      }
    };
    this.onFocus = (event) => {
      if (!backdrop.contains(event.target)) this.focusInitial();
    };
  }

  focusables() {
    return [...this.backdrop.querySelectorAll('button, [href], input, select, textarea, [tabindex]')].filter(
      (element) =>
        element.tabIndex >= 0 &&
        !element.matches(':disabled') &&
        !element.closest('[inert]') &&
        element.getClientRects().length &&
        getComputedStyle(element).visibility !== 'hidden'
    );
  }

  focusInitial() {
    (this.focusables()[0] || this.panel).focus({ preventScroll: true });
  }

  open() {
    if (activeDialog && activeDialog !== this) activeDialog.close();
    if (activeDialog !== this) {
      this.trigger = document.activeElement;
      this.previousOverflow = document.body.style.overflow;
      // Preserve existing inert states, including on siblings owned by other features.
      this.background = [...document.body.children]
        .filter((element) => element !== this.backdrop && !['SCRIPT', 'STYLE', 'TEMPLATE'].includes(element.tagName))
        .map((element) => [element, element.inert]);
      this.background.forEach(([element]) => {
        element.inert = true;
      });
      document.addEventListener('keydown', this.onKeyDown, true);
      document.addEventListener('focusin', this.onFocus, true);
    }
    activeDialog = this;
    this.backdrop.hidden = false;
    this.backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    this.focusInitial();
  }

  close() {
    if (activeDialog !== this) return;
    document.removeEventListener('keydown', this.onKeyDown, true);
    document.removeEventListener('focusin', this.onFocus, true);
    this.backdrop.classList.remove('open');
    this.backdrop.hidden = true;
    this.background.forEach(([element, wasInert]) => {
      element.inert = wasInert;
    });
    document.body.style.overflow = this.previousOverflow;
    activeDialog = null;
    const trigger = this.trigger;
    this.trigger = null;
    if (trigger?.isConnected && !trigger.closest('[inert]')) trigger.focus({ preventScroll: true });
    if (this.onClose) this.onClose();
  }
}
