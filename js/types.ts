// TypeScript-Typdefinitionen für Esoterik-Welt (v2)
export interface TarotCard {
  id: string;
  name: string;
  arcana: "major" | "minor";
  suit: string | null;
  number: number;
  meaning_upright: string;
  meaning_reversed: string;
  keywords: string[];
  image_placeholder: string;
}

export interface Crystal {
  id: string;
  name: string;
  chemical_formula: string;
  hardness: number;
  chakra: string;
  color: string;
  effect: string;
  description: string;
  image_placeholder: string;
  rarity: string;
}

export interface Rune {
  id: string;
  name: string;
  phoneme: string;
  meaning: string;
  divinatory_meaning: string;
  image_placeholder: string;
}

export interface MoonPhaseInfo {
  phase: string;
  label: string;
  pct: number;
  date: string;
  ritual: string;
  illumination: number;
}

export interface ArticleFrontmatter {
  title: string;
  date: string;        // YYYY-MM-DD
  category: string;
  tags: string[];
  readTime: number;    // Minuten
  excerpt: string;
  relatedPosts: string[];
}
