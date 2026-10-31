/**
 * Typdefinitionen für Esoterik-Welt (Datenlayer v2)
 * @file js/types.js
 */

/** @typedef {Object} TarotCard
 * @property {string} id
 * @property {string} name
 * @property {"major"|"minor"} arcana
 * @property {string|null} suit
 * @property {number} number
 * @property {string} meaning_upright
 * @property {string} meaning_reversed
 * @property {string[]} keywords
 * @property {string} image_placeholder
 */

/** @typedef {Object} Crystal
 * @property {string} id
 * @property {string} name
 * @property {string} chemical_formula
 * @property {number} hardness
 * @property {string} chakra
 * @property {string} color
 * @property {string} effect
 * @property {string} description
 * @property {string} image_placeholder
 * @property {string} rarity
 */

/** @typedef {Object} Rune
 * @property {string} id
 * @property {string} name
 * @property {string} phoneme
 * @property {string} meaning
 * @property {string} divinatory_meaning
 * @property {string} image_placeholder
 */

/** @typedef {Object} MoonPhaseInfo
 * @property {string} phase
 * @property {string} label
 * @property {number} pct
 * @property {string} date
 * @property {string} ritual
 * @property {number} illumination
 */

/** @typedef {Object} ArticleFrontmatter
 * @property {string} title
 * @property {string} date   // ISO 8601
 * @property {string} category
 * @property {string[]} tags
 * @property {number} readTime  // Minuten
 * @property {string} excerpt
 * @property {string[]} relatedPosts  // IDs anderer Artikel
 */

export const TYPES = { TarotorCard: null, Crystal: null, Rune: null };
