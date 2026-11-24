// Built-in vocabulary shipped with RSML. Shared by the browser annotator and
// the DOM-free core, so both always agree on the defaults.

// Isolated @-tokens (rendered as a single <noise> element).
export const DEFAULT_HESITATIONS = [
  "@umm", "@uhh", "@hmm", "@ugh", "@huh", "@tsk", "@uh-huh", "@ehh", "@ooh", "@uhh-oh", "@ohh", "@ho",
];

export const DEFAULT_ISOLATED_PARALINGUISTICS = [
  "@laughter", "@cry", "@hum", "@breathe", "@sniff", "@nose-blowing",
  "@cough", "@sneeze", "@throat-clearing", "@yawn",
  "@eating-sounds", "@snore", "@groan", "@sigh",
];

export const DEFAULT_ISOLATED_OTHER = [
  "@unintelligible", "@stutter-block", "@short-pause", "@long-pause",
];

// Span pairs written as @<name>-start ... @<name>-end.
export const DEFAULT_DISFLUENCY_SPANS = [
  "filler", "repetition", "broken-word", "repair", "false-start", "prolongation",
];

export const DEFAULT_PARALINGUISTIC_SPANS = [
  "crying", "yelling", "laughing", "singing", "humming", "whistling", "whispering", "chanting",
];

export const DEFAULT_PROSODY_SPANS = [
  "emphasis", "falling-pitch", "raising-pitch", "high-pitch", "low-pitch",
  "fast-speech", "slow-speech",
];


export const DEFAULT_ENTITY_MAP = {
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
  ID: "Identifier",
};

export const DEFAULT_LANGS = {
  en:"English", hi:"Hindi", bn:"Bengali", mr:"Marathi", te:"Telugu", ta:"Tamil", gu:"Gujarati",
  ur:"Urdu", kn:"Kannada", or:"Odia", ml:"Malayalam", pa:"Punjabi", as:"Assamese", mai:"Maithili",
  sat:"Santali", ks:"Kashmiri", ne:"Nepali", sd:"Sindhi", doi:"Dogri", kok:"Konkani", mni:"Manipuri",
  brx:"Bodo", sa:"Sanskrit",
};

// Dialect (prefix `$$`) and domain (prefix `!!`) ship with no default
// vocabulary — unlike languages/entities there's no universal taxonomy to
// bundle, so opts.dialects / opts.domains start empty and are populated
// via add("dialects", ...) / add("domains", ...).

// Drives the generic add()/remove() dispatch below: `category` is always
// an opts property name, `kind` picks which shared helper owns it.
export const CATEGORY_SPECS = {
  hesitations:             { kind: "isolated", tagCategory: "hesitation" },
  isolatedParalinguistics: { kind: "isolated", tagCategory: "paralinguistic" },
  isolatedOther:           { kind: "isolated", tagCategory: "other" },
  disfluencySpans:         { kind: "span", tagCategory: "disfluency" },
  paralinguisticSpans:     { kind: "span", tagCategory: "paralinguistic" },
  prosodySpans:            { kind: "span", tagCategory: "prosody" },
  entities:                { kind: "map" },
  languages:               { kind: "map", lowercaseKey: true },
  dialects:                { kind: "map" },
  domains:                 { kind: "map" },
};
