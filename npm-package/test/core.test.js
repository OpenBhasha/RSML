import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CATEGORIES,
  VERSION,
  VocabularyError,
  addEntry,
  countEntryUses,
  defaultVocabulary,
  findTagUses,
  isValidCode,
  removeEntry,
  vocabularyFrom,
} from "../core.js";

describe("vocabulary defaults", () => {
  it("lists the ten categories in display order", () => {
    assert.deepEqual(CATEGORIES, [
      "hesitations",
      "isolatedParalinguistics",
      "isolatedOther",
      "disfluencySpans",
      "paralinguisticSpans",
      "prosodySpans",
      "entities",
      "languages",
      "dialects",
      "domains",
    ]);
  });

  it("returns a fresh copy every time", () => {
    const first = defaultVocabulary();
    first.hesitations.push("@new");
    first.entities.NEW = "New";
    const second = defaultVocabulary();
    assert.ok(!second.hesitations.includes("@new"));
    assert.ok(!("NEW" in second.entities));
  });

  it("replaces only the categories given as overrides", () => {
    const vocabulary = vocabularyFrom({ hesitations: ["@umm"], dialects: { TG: "Telangana" } });
    assert.deepEqual(vocabulary.hesitations, ["@umm"]);
    assert.deepEqual(vocabulary.dialects, { TG: "Telangana" });
    assert.deepEqual(vocabulary.languages, defaultVocabulary().languages);
  });

  it("reports the library version", () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+$/);
  });
});

describe("addEntry and removeEntry", () => {
  it("stores isolated tags with an @ prefix and reports duplicates as no change", () => {
    const vocabulary = defaultVocabulary();
    assert.equal(addEntry(vocabulary, "hesitations", "mm-hmm"), true);
    assert.ok(vocabulary.hesitations.includes("@mm-hmm"));
    assert.equal(addEntry(vocabulary, "hesitations", "@mm-hmm"), false);
  });

  it("keeps isolated tags unique across their sibling categories", () => {
    const vocabulary = defaultVocabulary();
    assert.throws(
      () => addEntry(vocabulary, "hesitations", "@laughter"),
      /already registered as a paralinguistic tag/,
    );
  });

  it("keeps span names unique across their sibling categories", () => {
    const vocabulary = defaultVocabulary();
    assert.throws(
      () => addEntry(vocabulary, "prosodySpans", "filler"),
      /already registered as a disfluency span/,
    );
    assert.equal(addEntry(vocabulary, "prosodySpans", "monotone"), true);
  });

  it("rejects names with characters outside letters, digits, _ and -", () => {
    const vocabulary = defaultVocabulary();
    assert.throws(() => addEntry(vocabulary, "hesitations", "um m"), VocabularyError);
    assert.throws(() => addEntry(vocabulary, "disfluencySpans", "false start"), VocabularyError);
    assert.throws(() => addEntry(vocabulary, "hesitations", "  "), VocabularyError);
  });

  it("accepts map codes the parser can read, and rejects the rest", () => {
    const vocabulary = defaultVocabulary();
    assert.equal(addEntry(vocabulary, "dialects", "TG", "Telangana"), true);
    assert.equal(vocabulary.dialects.TG, "Telangana");
    for (const code of ["my code", "2W", "-x", "a.b"]) {
      assert.throws(() => addEntry(vocabulary, "entities", code, "Bad"), /Invalid code/);
    }
    assert.equal(isValidCode("en-IN"), true);
  });

  it("lowercases language codes and labels a blank entry with its code", () => {
    const vocabulary = defaultVocabulary();
    addEntry(vocabulary, "languages", "FR", "");
    assert.equal(vocabulary.languages.fr, "fr");
    assert.equal(removeEntry(vocabulary, "languages", "FR"), true);
    assert.ok(!("fr" in vocabulary.languages));
  });

  it("removes entries and reports a missing one as no change", () => {
    const vocabulary = defaultVocabulary();
    assert.equal(removeEntry(vocabulary, "hesitations", "umm"), true);
    assert.ok(!vocabulary.hesitations.includes("@umm"));
    assert.equal(removeEntry(vocabulary, "hesitations", "@umm"), false);
    assert.equal(removeEntry(vocabulary, "entities", "PER"), true);
    assert.equal(removeEntry(vocabulary, "entities", "PER"), false);
  });

  it("rejects an unknown category", () => {
    assert.throws(() => addEntry(defaultVocabulary(), "accents", "x"), /Unknown category/);
  });
});

describe("findTagUses", () => {
  it("finds isolated tags, span markers and coded bracket tags", () => {
    const text =
      "@umm hello @filler-start you know @filler-end #PER[Ravi](Ravi) !en[office](office) $$TG[x](y) !!LAW[a](b) $east[c](d)";
    assert.deepEqual(findTagUses(text), [
      { kind: "isolated", name: "umm" },
      { kind: "span", name: "filler" },
      { kind: "span", name: "filler" },
      { kind: "entity", name: "PER" },
      { kind: "language", name: "en" },
      { kind: "dialect", name: "TG" },
      { kind: "domain", name: "LAW" },
      { kind: "accent", name: "east" },
    ]);
  });

  it("looks inside tag payloads and skips unspecified tags, mispronunciations and speakers", () => {
    const text = "!en[@umm hotel](hotel) #[x](y) [skreen](screen) &s1-start hi &s1-end #PER[unclosed";
    assert.deepEqual(findTagUses(text), [
      { kind: "language", name: "en" },
      { kind: "isolated", name: "umm" },
    ]);
  });

  it("counts uses of one vocabulary entry", () => {
    const text = "@umm a @umm b !EN[x](y) !en[z](w) @laughing-start c @laughing-end";
    assert.equal(countEntryUses(text, "hesitations", "@umm"), 2);
    assert.equal(countEntryUses(text, "languages", "en"), 2);
    assert.equal(countEntryUses(text, "paralinguisticSpans", "laughing"), 2);
    assert.equal(countEntryUses(text, "entities", "PER"), 0);
  });
});
