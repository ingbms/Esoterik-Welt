#!/usr/bin/env node
/**
 * lib/js-blocks.cjs — Klammerblock-Erkennung fuer die Baseline-Messung.
 *
 * Der Scanner kennt Zeilen- und Blockkommentare, ein-/doppelte Strings,
 * Template-Literale mit verschachtelten `${...}`-Ausdruecken (auch weitere
 * Templates darin) und Regex-Literale. Eine naive Zaehlung verschiebt sich an
 * `tarot.js` um 600 Zeilen, weil ein Template-Ausdruck ein zweites Template
 * enthaelt; die gemessenen Zeilenbereiche waeren dann falsch.
 *
 * Der Rumpf beginnt erst mit der Klammer ausserhalb der Parameterliste, damit
 * `function f(a = {}) {` den Block nicht schon in der Signatur beendet.
 *
 * Dies ist die einzige Implementierung; measure-functions.cjs, ranges.cjs und
 * check-decl-ranges.cjs nutzen sie gemeinsam.
 *
 * Oeffentliche Funktion: findBlockEnd(lines, startLine) -> 1-basierte Endzeile.
 */
'use strict';

const REGEX_PRECEDERS = new Set(['', '(', ',', '=', ':', '[', '!', '&', '|', '?', '{', '}', ';', '+', '-', '*', '%', '<', '>']);
const REGEX_KEYWORDS = /(?:^|[\s(,=:[!&|?{};])(?:return|typeof|instanceof|case|in|of)$/;

function findBlockEnd(lines, startLine) {
  let depth = 0;
  let seen = false;
  let started = false;
  let parenDepth = 0;
  let mode = 'code';
  let prevSig = '';
  let inClass = false;
  const exprStack = [];

  for (let i = startLine; i < lines.length; i += 1) {
    const line = lines[i];
    for (let j = 0; j < line.length; j += 1) {
      const c = line[j];
      const next = line[j + 1];

      if (mode === 'linecomment') break;
      if (mode === 'blockcomment') {
        if (c === '*' && next === '/') {
          mode = 'code';
          j += 1;
        }
        continue;
      }
      if (mode === 'single' || mode === 'double') {
        if (c === '\\') {
          j += 1;
          continue;
        }
        if ((mode === 'single' && c === "'") || (mode === 'double' && c === '"')) mode = 'code';
        continue;
      }
      if (mode === 'template') {
        if (c === '\\') {
          j += 1;
          continue;
        }
        if (c === '`') {
          mode = 'code';
          continue;
        }
        if (c === '$' && next === '{') {
          depth += 1;
          exprStack.push(depth);
          mode = 'code';
          j += 1;
        }
        continue;
      }
      if (mode === 'regex') {
        if (c === '\\') {
          j += 1;
          continue;
        }
        if (c === '[') inClass = true;
        else if (c === ']') inClass = false;
        else if (c === '/' && !inClass) mode = 'code';
        continue;
      }

      // code
      if (c === '/' && next === '/') {
        mode = 'linecomment';
        break;
      }
      if (c === '/' && next === '*') {
        mode = 'blockcomment';
        j += 1;
        continue;
      }
      if (c === "'") {
        mode = 'single';
        continue;
      }
      if (c === '"') {
        mode = 'double';
        continue;
      }
      if (c === '`') {
        mode = 'template';
        continue;
      }
      if (c === '/') {
        if (REGEX_PRECEDERS.has(prevSig) || REGEX_KEYWORDS.test(line.slice(0, j).trimEnd())) {
          mode = 'regex';
          inClass = false;
          continue;
        }
      }
      if (c === '(' || c === '[') {
        parenDepth += 1;
      } else if (c === ')' || c === ']') {
        if (parenDepth > 0) parenDepth -= 1;
      }
      if (c === '{') {
        if (!started) {
          // `options = {}` in der Signatur darf den Block nicht beenden.
          if (parenDepth > 0) continue;
          started = true;
          depth = 1;
          seen = true;
          continue;
        }
        depth += 1;
        seen = true;
      } else if (c === '}') {
        if (!started) continue;
        if (exprStack.length && exprStack[exprStack.length - 1] === depth) {
          // Schliesst `${...}`: zurueck in das umgebende Template.
          exprStack.pop();
          depth -= 1;
          mode = 'template';
          continue;
        }
        depth -= 1;
        if (seen && depth === 0) return i + 1;
      }
      if (!/\s/.test(c)) prevSig = c;
    }
    if (mode === 'linecomment') mode = 'code';
  }
  return null;
}

module.exports = { findBlockEnd };
