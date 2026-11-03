// Experimentierlabor (RAD-09) — Zufallsquelle.
//
// Das Labor zieht Ziele ausschließlich über Web Crypto
// (`crypto.getRandomValues`) und rechnet den 32-Bit-Wert auf [0,1) um. Der
// Vertrag (radiasthesie-vertraege.js) verwendet diese Zahl nur als Eingang für
// sein Rejection Sampling; dadurch bleibt die Verteilung gleichmäßig.
//
// Es gibt hier bewusst KEINEN Math.random-Fallback: Fehlt Web Crypto, bricht
// das Labor mit einer sichtbaren Meldung ab, statt still schwächeren Zufall zu
// verwenden. Deterministische Zufallsfolgen (mulberry32) leben ausschließlich
// in den Tests.

const SCALE = 0x100000000;

/**
 * Liefert eine Funktion, die bei jedem Aufruf eine neue Zahl aus [0,1) zieht.
 * @param {Crypto} [cryptoObject] injizierbar für Tests
 */
export function createCryptoRng(cryptoObject = globalThis.crypto) {
  if (!cryptoObject || typeof cryptoObject.getRandomValues !== 'function') {
    throw new Error('Web Crypto (crypto.getRandomValues) ist in dieser Umgebung nicht verfügbar');
  }
  const buffer = new Uint32Array(1);
  return function nextRandom() {
    cryptoObject.getRandomValues(buffer);
    return buffer[0] / SCALE;
  };
}

/** Prüft ohne Nebenwirkung, ob eine brauchbare Zufallsquelle vorhanden ist. */
export function cryptoAvailable(cryptoObject = globalThis.crypto) {
  return Boolean(cryptoObject && typeof cryptoObject.getRandomValues === 'function');
}

/**
 * Gleichmäßiger Index aus 0..k-1 mit Rejection Sampling (kein Modulo-Bias).
 * Dieselbe Regel wie im Vertrag; hier für den Spielmodus und für Tests.
 */
export function drawIndex(k, rng) {
  if (!Number.isInteger(k) || k < 1) throw new RangeError('k muss eine ganze Zahl >= 1 sein');
  const limit = Math.floor(SCALE / k) * k;
  for (let attempt = 0; attempt < 64; attempt += 1) {
    const value = rng();
    if (!Number.isFinite(value) || value < 0 || value >= 1) {
      throw new Error('Zufallsquelle muss Werte in [0,1) liefern');
    }
    const raw = Math.floor(value * SCALE);
    if (raw < limit) return raw % k;
  }
  throw new Error('Zufallsquelle liefert keine verwendbaren Werte (Rejection Sampling)');
}

/**
 * Zufallskennung für die Sitzung (batchId) und Lauf-IDs. Sie dient der
 * Zuordnung von Läufen, nicht der Verblindung, und enthält keine Zielinformation.
 */
export function randomToken(cryptoObject = globalThis.crypto, bytes = 4) {
  const rng = createCryptoRng(cryptoObject);
  let token = '';
  for (let index = 0; index < bytes; index += 1) {
    token += Math.floor(rng() * 256)
      .toString(16)
      .padStart(2, '0');
  }
  return token;
}
