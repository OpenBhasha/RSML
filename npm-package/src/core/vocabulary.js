import {
  CATEGORY_SPECS,
  DEFAULT_DISFLUENCY_SPANS,
  DEFAULT_ENTITY_MAP,
  DEFAULT_HESITATIONS,
  DEFAULT_ISOLATED_OTHER,
  DEFAULT_ISOLATED_PARALINGUISTICS,
  DEFAULT_LANGS,
  DEFAULT_PARALINGUISTIC_SPANS,
  DEFAULT_PROSODY_SPANS,
} from "./defaults.js";

// Every vocabulary category, in display order.
export const CATEGORIES = Object.keys(CATEGORY_SPECS);

// A tag or span name: letters, digits, "_" and "-".
const NAME_RE = /^[\w-]+$/;
// A code for a bracket tag (#CODE[...], !code[...], $$CODE[...], !!CODE[...],
// $ID[...]): must start with a letter, exactly as the parser reads it.
const CODE_RE = /^[A-Za-z][\w-]*$/;

// Thrown for an unknown category or a value the rules reject. `message` is
// written for the person who typed the value.
export class VocabularyError extends Error {
  constructor(message) {
    super(message);
    this.name = "VocabularyError";
  }
}

export function categorySpec(category) {
  const spec = CATEGORY_SPECS[category];
  if (!spec) {
    throw new VocabularyError(
      `Unknown category: "${category}". Expected one of: ${CATEGORIES.join(", ")}`
    );
  }
  return spec;
}

export function isValidName(name) {
  return typeof name === "string" && NAME_RE.test(name);
}

export function isValidCode(code) {
  return typeof code === "string" && CODE_RE.test(code);
}

// A fresh copy of the built-in vocabulary; safe to mutate.
export function defaultVocabulary() {
  return {
    hesitations: DEFAULT_HESITATIONS.slice(),
    isolatedParalinguistics: DEFAULT_ISOLATED_PARALINGUISTICS.slice(),
    isolatedOther: DEFAULT_ISOLATED_OTHER.slice(),
    disfluencySpans: DEFAULT_DISFLUENCY_SPANS.slice(),
    paralinguisticSpans: DEFAULT_PARALINGUISTIC_SPANS.slice(),
    prosodySpans: DEFAULT_PROSODY_SPANS.slice(),
    entities: Object.assign({}, DEFAULT_ENTITY_MAP),
    languages: Object.assign({}, DEFAULT_LANGS),
    dialects: {},
    domains: {},
  };
}

// The defaults with some categories replaced wholesale, the way the
// annotator's constructor options work: a category present in `overrides`
// replaces the default list or map; one that's absent keeps the defaults.
export function vocabularyFrom(overrides) {
  const vocabulary = defaultVocabulary();
  for (const category of CATEGORIES) {
    const value = overrides && overrides[category];
    if (value == null) continue;
    vocabulary[category] = Array.isArray(value) ? value.slice() : Object.assign({}, value);
  }
  return vocabulary;
}

const stripAt = (tag) => (tag[0] === "@" ? tag.slice(1) : tag);

// Which tag category (e.g. "hesitation") already owns `name` among the
// categories of one kind. Isolated tags and span names each share one flat
// namespace across their sibling categories.
function ownerOf(vocabulary, kind, name) {
  for (const category of CATEGORIES) {
    const spec = CATEGORY_SPECS[category];
    if (spec.kind !== kind) continue;
    const names = kind === "isolated" ? vocabulary[category].map(stripAt) : vocabulary[category];
    if (names.includes(name)) return spec.tagCategory;
  }
  return null;
}

function addIsolatedTag(vocabulary, category, spec, rawTag) {
  if (typeof rawTag !== "string" || !rawTag.trim()) {
    throw new VocabularyError(`add("${category}", ...) needs a non-empty tag name.`);
  }
  const bare = stripAt(rawTag);
  if (!isValidName(bare)) {
    throw new VocabularyError(
      `Invalid tag name "@${bare}" — only letters, numbers, "_" and "-" are allowed.`
    );
  }
  const owner = ownerOf(vocabulary, "isolated", bare);
  if (owner && owner !== spec.tagCategory) {
    throw new VocabularyError(
      `"@${bare}" is already registered as a ${owner} tag. Remove it first or choose a different name.`
    );
  }
  const stored = `@${bare}`;
  if (vocabulary[category].includes(stored)) return false;
  vocabulary[category].push(stored);
  return true;
}

function addSpanName(vocabulary, category, spec, base) {
  if (!isValidName(base)) {
    throw new VocabularyError(
      `Invalid span name "${base}" — only letters, numbers, "_" and "-" are allowed.`
    );
  }
  const owner = ownerOf(vocabulary, "span", base);
  if (owner && owner !== spec.tagCategory) {
    throw new VocabularyError(
      `"${base}" is already registered as a ${owner} span. Remove it first or choose a different name.`
    );
  }
  if (vocabulary[category].includes(base)) return false;
  vocabulary[category].push(base);
  return true;
}

function mapKey(spec, code) {
  return spec.lowercaseKey ? code.toLowerCase() : code;
}

function setMapEntry(vocabulary, category, spec, code, label) {
  if (typeof code !== "string" || !code.trim()) {
    throw new VocabularyError(`add("${category}", ...) needs a non-empty code.`);
  }
  if (!isValidCode(code)) {
    throw new VocabularyError(
      `Invalid code "${code}" — start with a letter, then use only letters, numbers, "_" and "-".`
    );
  }
  const key = mapKey(spec, code);
  vocabulary[category][key] = label == null || label === "" ? key : label;
  return true;
}

// Adds `value` to `category`, enforcing RSML's rules. Mutates `vocabulary`.
// Returns false when it was already there (an isolated tag or span name),
// true otherwise. Throws a VocabularyError for an unknown category, an
// invalid value, or an isolated tag / span name already used by a sibling
// category.
export function addEntry(vocabulary, category, value, label) {
  const spec = categorySpec(category);
  if (spec.kind === "isolated") return addIsolatedTag(vocabulary, category, spec, value);
  if (spec.kind === "span") return addSpanName(vocabulary, category, spec, value);
  return setMapEntry(vocabulary, category, spec, value, label);
}

// Removes `value` from `category`. Mutates `vocabulary`. Returns false when
// there was nothing by that name. Throws a VocabularyError for an unknown
// category.
export function removeEntry(vocabulary, category, value) {
  const spec = categorySpec(category);
  if (typeof value !== "string") return false;
  if (spec.kind === "map") {
    const key = mapKey(spec, value);
    if (!(key in vocabulary[category])) return false;
    delete vocabulary[category][key];
    return true;
  }
  const stored = spec.kind === "isolated" ? `@${stripAt(value)}` : value;
  const index = vocabulary[category].indexOf(stored);
  if (index === -1) return false;
  vocabulary[category].splice(index, 1);
  return true;
}
