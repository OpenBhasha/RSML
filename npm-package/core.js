// src/core/version.js
var VERSION = "3.5.0";

// src/core/defaults.js
var DEFAULT_HESITATIONS = [
  "@umm",
  "@uhh",
  "@hmm",
  "@ugh",
  "@huh",
  "@tsk",
  "@uh-huh",
  "@ehh",
  "@ooh",
  "@uhh-oh",
  "@ohh",
  "@ho"
];
var DEFAULT_ISOLATED_PARALINGUISTICS = [
  "@laughter",
  "@cry",
  "@hum",
  "@breathe",
  "@sniff",
  "@nose-blowing",
  "@cough",
  "@sneeze",
  "@throat-clearing",
  "@yawn",
  "@eating-sounds",
  "@snore",
  "@groan",
  "@sigh"
];
var DEFAULT_ISOLATED_OTHER = [
  "@unintelligible",
  "@stutter-block",
  "@short-pause",
  "@long-pause"
];
var DEFAULT_DISFLUENCY_SPANS = [
  "filler",
  "repetition",
  "broken-word",
  "repair",
  "false-start",
  "prolongation"
];
var DEFAULT_PARALINGUISTIC_SPANS = [
  "crying",
  "yelling",
  "laughing",
  "singing",
  "humming",
  "whistling",
  "whispering",
  "chanting"
];
var DEFAULT_PROSODY_SPANS = [
  "emphasis",
  "falling-pitch",
  "raising-pitch",
  "high-pitch",
  "low-pitch",
  "fast-speech",
  "slow-speech"
];
var DEFAULT_ENTITY_MAP = {
  PER: "Person",
  GPE: "Geo Political Entity",
  FAC: "Facility",
  LOC: "Location",
  ITEM: "Item",
  WOA: "Work of Art",
  EVENT: "Event",
  SPORTS: "Sports",
  ORG: "Organization",
  GROUP: "Group",
  URL: "URL",
  BRAND: "Brand",
  HON: "Honorific",
  DATETIME: "Date/Time",
  MONEY: "Money",
  QUANT: "Quantity",
  NUM: "Number",
  LANG: "Language",
  LAW: "Law/Policy",
  ID: "Identifier"
};
var DEFAULT_LANGS = {
  en: "English",
  hi: "Hindi",
  bn: "Bengali",
  mr: "Marathi",
  te: "Telugu",
  ta: "Tamil",
  gu: "Gujarati",
  ur: "Urdu",
  kn: "Kannada",
  or: "Odia",
  ml: "Malayalam",
  pa: "Punjabi",
  as: "Assamese",
  mai: "Maithili",
  sat: "Santali",
  ks: "Kashmiri",
  ne: "Nepali",
  sd: "Sindhi",
  doi: "Dogri",
  kok: "Konkani",
  mni: "Manipuri",
  brx: "Bodo",
  sa: "Sanskrit"
};
var CATEGORY_SPECS = {
  hesitations: { kind: "isolated", tagCategory: "hesitation" },
  isolatedParalinguistics: { kind: "isolated", tagCategory: "paralinguistic" },
  isolatedOther: { kind: "isolated", tagCategory: "other" },
  disfluencySpans: { kind: "span", tagCategory: "disfluency" },
  paralinguisticSpans: { kind: "span", tagCategory: "paralinguistic" },
  prosodySpans: { kind: "span", tagCategory: "prosody" },
  entities: { kind: "map" },
  languages: { kind: "map", lowercaseKey: true },
  dialects: { kind: "map" },
  domains: { kind: "map" }
};

// src/core/vocabulary.js
var CATEGORIES = Object.keys(CATEGORY_SPECS);
var NAME_RE = /^[\w-]+$/;
var CODE_RE = /^[A-Za-z][\w-]*$/;
var VocabularyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "VocabularyError";
  }
};
function categorySpec(category) {
  const spec = CATEGORY_SPECS[category];
  if (!spec) {
    throw new VocabularyError(
      `Unknown category: "${category}". Expected one of: ${CATEGORIES.join(", ")}`
    );
  }
  return spec;
}
function isValidName(name) {
  return typeof name === "string" && NAME_RE.test(name);
}
function isValidCode(code) {
  return typeof code === "string" && CODE_RE.test(code);
}
function defaultVocabulary() {
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
    domains: {}
  };
}
function vocabularyFrom(overrides) {
  const vocabulary = defaultVocabulary();
  for (const category of CATEGORIES) {
    const value = overrides && overrides[category];
    if (value == null) continue;
    vocabulary[category] = Array.isArray(value) ? value.slice() : Object.assign({}, value);
  }
  return vocabulary;
}
var stripAt = (tag) => tag[0] === "@" ? tag.slice(1) : tag;
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
      `Invalid tag name "@${bare}" \u2014 only letters, numbers, "_" and "-" are allowed.`
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
      `Invalid span name "${base}" \u2014 only letters, numbers, "_" and "-" are allowed.`
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
      `Invalid code "${code}" \u2014 start with a letter, then use only letters, numbers, "_" and "-".`
    );
  }
  const key = mapKey(spec, code);
  vocabulary[category][key] = label == null || label === "" ? key : label;
  return true;
}
function addEntry(vocabulary, category, value, label) {
  const spec = categorySpec(category);
  if (spec.kind === "isolated") return addIsolatedTag(vocabulary, category, spec, value);
  if (spec.kind === "span") return addSpanName(vocabulary, category, spec, value);
  return setMapEntry(vocabulary, category, spec, value, label);
}
function removeEntry(vocabulary, category, value) {
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

// src/core/tags.js
var BRACKET_TAG_RE = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/;
var AT_TAG_RE = /^@([\w-]+)/;
var SPEAKER_TAG_RE = /^&(s\d+)-(start|end)(?![\w-])/;
var BRACKET_KINDS = { "#": "entity", "!": "language", "$$": "dialect", "!!": "domain", "$": "accent" };
var MAP_CATEGORY_KINDS = { entities: "entity", languages: "language", dialects: "dialect", domains: "domain" };
function matchBracket(text, start, open, close) {
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
  return closeBracket !== -1 && text[closeBracket + 1] === "(" && matchBracket(text, closeBracket + 1, "(", ")") !== -1;
}
function atTagUse(name) {
  if (name.endsWith("-start")) return { kind: "span", name: name.slice(0, -6) };
  if (name.endsWith("-end")) return { kind: "span", name: name.slice(0, -4) };
  return { kind: "isolated", name };
}
function findTagUses(text) {
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
function usesEntry(use, category, value) {
  const spec = categorySpec(category);
  if (spec.kind === "isolated") {
    return use.kind === "isolated" && use.name === (value[0] === "@" ? value.slice(1) : value);
  }
  if (spec.kind === "span") return use.kind === "span" && use.name === value;
  if (use.kind !== MAP_CATEGORY_KINDS[category]) return false;
  return CATEGORY_SPECS[category].lowercaseKey ? use.name.toLowerCase() === value.toLowerCase() : use.name === value;
}
function countEntryUses(text, category, value) {
  return findTagUses(text).filter((use) => usesEntry(use, category, value)).length;
}
export {
  AT_TAG_RE,
  BRACKET_TAG_RE,
  CATEGORIES,
  CATEGORY_SPECS,
  DEFAULT_DISFLUENCY_SPANS,
  DEFAULT_ENTITY_MAP,
  DEFAULT_HESITATIONS,
  DEFAULT_ISOLATED_OTHER,
  DEFAULT_ISOLATED_PARALINGUISTICS,
  DEFAULT_LANGS,
  DEFAULT_PARALINGUISTIC_SPANS,
  DEFAULT_PROSODY_SPANS,
  SPEAKER_TAG_RE,
  VERSION,
  VocabularyError,
  addEntry,
  categorySpec,
  countEntryUses,
  defaultVocabulary,
  findTagUses,
  isValidCode,
  isValidName,
  matchBracket,
  removeEntry,
  usesEntry,
  vocabularyFrom
};
