/** Minimaler Klassen-Helfer für typisierte `class`-Props. */
export type ClassValue = string | false | null | undefined;

/**
 * Verkettet die gesetzten Klassenwerte. `false`, `null`, `undefined` und leere
 * Strings entfallen, damit bedingte Klassen ohne Template-Tricks lesbar sind.
 */
export function cx(...values: ClassValue[]): string {
  return values.filter((value): value is string => typeof value === 'string' && value.length > 0).join(' ');
}
