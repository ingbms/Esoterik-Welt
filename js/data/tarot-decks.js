// Tarot deck registry.
//
// The website ships exactly one approved deck: "Nachtatelier" (v1, 78 cards,
// 3:5, sRGB). The registry is keyed by deck id so a second deck can be added
// without touching the gallery, the dialog or the draw logic — but no V2 deck is
// registered, offered or advertised here: that is a separate human gate.
//
// Storage is deliberately forgiving: an unknown or outdated stored id falls back
// to the default deck instead of breaking the view or losing history, because
// the card ids are stable across decks (0-77 in the canonical order).

export const TAROT_DECK_STORAGE_KEY = 'esoterik_tarot_deck';

const DECKS = {
  'nachtatelier-v1': {
    id: 'nachtatelier-v1',
    label: 'Nachtatelier',
    version: '1.0.0',
    cardCount: 78,
    aspect: '3:5',
    // Relative on purpose: the HTTP edition resolves it through <base href>,
    // the file:// edition through the document directory. Never absolute.
    basePath: 'assets/tarot/nachtatelier-v1/',
    levels: { thumb: '300', detail: '600', zoom: '1200' },
    backFile: 'Ruecken.jpg',
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

export function cardAspectRatio(deck) {
  return `${deck.width} / ${deck.height}`;
}
