import { CATEGORY_SPECS } from "./defaults.js";
import { categorySpec } from "./vocabulary.js";

// Token shapes, shared with the annotator's highlighter so the two can't
// disagree about what counts as a tag.
export const BRACKET_TAG_RE = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/;
export const AT_TAG_RE = /^@([\w-]+)/;
export const SPEAKER_TAG_RE = /^&(s\d+)-(start|end)(?![\w-])/;

const BRACKET_KINDS = { "#": "entity", "!": "language", "$$": "dialect", "!!": "domain", "$": "accent" };
const MAP_CATEGORY_KINDS = { entities: "entity", languages: "language", dialects: "dialect", domains: "domain" };

// Index of the bracket that closes the one at `start`, or -1 if unbalanced.
export function matchBracket(text, start, open, close) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === open) depth++;
    else if (text[i] === close) {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function closesBracketTag(text, openBracket) {
  const closeBracket = matchBracket(text, openBracket, "[", "]");
  return closeBracket !== -1 && text[closeBracket + 1] === "(" &&
    matchBracket(text, closeBracket + 1, "(", ")") !== -1;
}

function atTagUse(name) {
  if (name.endsWith("-start")) return { kind: "span", name: name.slice(0, -6) };
  if (name.endsWith("-end")) return { kind: "span", name: name.slice(0, -4) };
  return { kind: "isolated", name };
}

// Every vocabulary tag used in `text`, in order, including tags nested
// inside another tag's [verbatim](normalized) payload:
//   { kind: "isolated", name }   @name
//   { kind: "span", name }       @name-start / @name-end (one use per marker)
//   { kind: "entity" | "language" | "dialect" | "domain" | "accent", name }
//                                #CODE[..](..), !code[..](..), $$CODE, !!CODE, $ID
// Unspecified bracket tags (#[..](..)), mispronunciations and speaker
// markers carry no vocabulary entry and are not reported.
export function findTagUses(text) {
  const uses = [];
  let i = 0;
  while (i < text.length) {
    const rest = text.slice(i);
    const bracket = BRACKET_TAG_RE.exec(rest);
    if (bracket) {
      const openBracket = i + bracket[0].length - 1;
      if (closesBracketTag(text, openBracket) && bracket[2]) {
        uses.push({ kind: BRACKET_KINDS[bracket[1]], name: bracket[2] });
      }
      i = openBracket + 1;
      continue;
    }
    const at = text[i] === "@" ? AT_TAG_RE.exec(rest) : null;
    if (at) {
      uses.push(atTagUse(at[1]));
      i += at[0].length;
      continue;
    }
    i++;
  }
  return uses;
}

// Whether a use reported by findTagUses() refers to `value` in `category`.
export function usesEntry(use, category, value) {
  const spec = categorySpec(category);
  if (spec.kind === "isolated") {
    return use.kind === "isolated" && use.name === (value[0] === "@" ? value.slice(1) : value);
  }
  if (spec.kind === "span") return use.kind === "span" && use.name === value;
  if (use.kind !== MAP_CATEGORY_KINDS[category]) return false;
  return CATEGORY_SPECS[category].lowercaseKey
    ? use.name.toLowerCase() === value.toLowerCase()
    : use.name === value;
}

// How many times `text` uses `value` from `category`.
export function countEntryUses(text, category, value) {
  return findTagUses(text).filter((use) => usesEntry(use, category, value)).length;
}
