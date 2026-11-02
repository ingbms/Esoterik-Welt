// Tarot deck registry.
//
// Two decks ship, both with the same 78 stable card ids (0-77 in the canonical
// order): "Nachtatelier" (v1) stays the default, "Gartenbrevier" (v2) is an
// optional, human-approved colour variant. Adding a third deck only needs an
// entry here — the gallery, the dialog, the draws and the deck picker read every
// path from this registry and never hardcode a deck id or a file name.
//
// Storage is deliberately forgiving: an unknown or outdated stored id falls back
// to the default deck instead of breaking the view or losing history.

export const TAROT_DECK_STORAGE_KEY = 'esoterik_tarot_deck';

const DECKS = {
  'nachtatelier-v1': {
    id: 'nachtatelier-v1',
    label: 'Nachtatelier',
    meta: '78 Karten · 3:5',
    badge: 'Standard',
    version: '1.0.0',
    cardCount: 78,
    aspect: '3:5',
    // Relative on purpose: the HTTP edition resolves it through <base href>,
    // the file:// edition through the document directory. Never absolute.
    basePath: 'assets/tarot/nachtatelier-v1/',
    levels: { thumb: '300', detail: '600', zoom: '1200' },
    backFile: 'Ruecken.jpg',
    previewCardId: 0,
    width: 3,
    height: 5,
  },
  'gartenbrevier-v2': {
    id: 'gartenbrevier-v2',
    label: 'Gartenbrevier',
    meta: 'Farbvariante · 78 Karten · 3:5',
    badge: 'Optional',
    version: '2026-11-02',
    cardCount: 78,
    aspect: '3:5',
    basePath: 'assets/tarot/gartenbrevier-v2/',
    levels: { thumb: '300', detail: '600', zoom: '1200' },
    backFile: 'Ruecken.jpg',
    previewCardId: 0,
    width: 3,
    height: 5,
  },
};

export const DEFAULT_DECK_ID = 'nachtatelier-v1';
export const SUPPORTED_DECK_IDS = Object.keys(DECKS);

export function isSupportedDeckId(deckId) {
  return typeof deckId === 'string' && Object.prototype.hasOwnProperty.call(DECKS, deckId);
}

// Always returns a usable deck id; the caller never has to branch on validity.
export function resolveDeckId(storedDeckId) {
  return isSupportedDeckId(storedDeckId) ? storedDeckId : DEFAULT_DECK_ID;
}

export function getDeck(deckId) {
  return DECKS[resolveDeckId(deckId)];
}

// Registry order = picker order; the default deck stays first.
export function listDecks() {
  return SUPPORTED_DECK_IDS.map((deckId) => DECKS[deckId]);
}

export function readStoredDeckId(storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return DEFAULT_DECK_ID;
    return resolveDeckId(store.getItem(TAROT_DECK_STORAGE_KEY));
  } catch {
    return DEFAULT_DECK_ID;
  }
}

// Write back the resolved id so an unknown stored value heals instead of
// lingering (and keeps the preference key meaningful for a future deck choice).
export function storeDeckId(deckId, storage) {
  try {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    if (!store) return resolveDeckId(deckId);
    const resolved = resolveDeckId(deckId);
    store.setItem(TAROT_DECK_STORAGE_KEY, resolved);
    return resolved;
  } catch {
    return resolveDeckId(deckId);
  }
}

export function cardFileName(cardId) {
  return String(cardId).padStart(2, '0') + '.jpg';
}

export function cardAssetPath(deck, cardId, level = 'thumb') {
  const step = deck.levels[level] || deck.levels.thumb;
  return `${deck.basePath}${step}/${cardFileName(cardId)}`;
}

export function backAssetPath(deck, level = 'thumb') {
  const step = deck.levels[level] || deck.levels.thumb;
  return `${deck.basePath}${step}/${deck.backFile}`;
}

// The picker shows one small preview per deck: the first card of that deck,
// never a master and never a second copy of the whole deck.
export function deckPreviewPath(deck) {
  const cardId = Object.prototype.hasOwnProperty.call(deck, 'previewCardId') ? deck.previewCardId : 0;
  return cardAssetPath(deck, cardId, 'thumb');
}

export function cardAspectRatio(deck) {
  return `${deck.width} / ${deck.height}`;
}
