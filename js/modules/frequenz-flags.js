// Feature-Flags des Frequenzlabors (ADR AD-5).
// Flags sind Teil des Builds, werden nie persistiert und dürfen nur auf lokalen
// Origins per URL überschrieben werden (?fq=+cymatics,-binaural). Ein
// deaktiviertes Feature wird nicht importiert; die Importe stehen hinter dem Flag.
export const FEATURES = Object.freeze({
  labor: true,
  binaural: true,
  visualisierung: true,
  vergleich432440: true,
  cymatics: false, // P9, nicht implementiert
  meditation: false, // P10, nicht implementiert
});

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1']);

/**
 * Liefert die wirksamen Flags. Der Override gilt ausschließlich für
 * `file:` und lokale Hosts; auf der Produktionsdomain wird er ignoriert.
 */
export function resolveFeatures(search = '', origin = { protocol: 'https:', hostname: '' }) {
  const isLocal = origin.protocol === 'file:' || LOCAL_HOSTS.has(origin.hostname);
  if (!isLocal) return FEATURES;
  const override = new URLSearchParams(String(search)).get('fq');
  if (!override) return FEATURES;
  const next = { ...FEATURES };
  for (const token of override.split(',')) {
    // A leading "+" arrives as a space because "+" is URL-encoded whitespace;
    // a bare name therefore enables just like "+name".
    const rawToken = token.trim();
    const name = rawToken.replace(/^[+-]/, '');
    if (!Object.prototype.hasOwnProperty.call(next, name)) continue;
    next[name] = !rawToken.startsWith('-');
  }
  return Object.freeze(next);
}

let cached = null;

/** Wirksame Flags des aktuellen Dokuments (einmal aufgelöst). */
export function activeFeatures() {
  if (!cached) {
    const loc = typeof location === 'undefined' ? { protocol: 'https:', hostname: '', search: '' } : location;
    cached = resolveFeatures(loc.search || '', { protocol: loc.protocol, hostname: loc.hostname });
  }
  return cached;
}
