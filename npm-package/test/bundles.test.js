import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { describe, it } from "node:test";

const require = createRequire(import.meta.url);

describe("published bundles", () => {
  it("loads the CommonJS build in Node without a browser", () => {
    const RSMLAnnotator = require("../rsml.cjs");
    assert.equal(typeof RSMLAnnotator, "function");
    assert.equal(RSMLAnnotator.default, RSMLAnnotator);
  });

  it("exports the annotator as a real ES module default", async () => {
    const { default: RSMLAnnotator } = await import("../rsml.esm.js");
    assert.equal(typeof RSMLAnnotator, "function");
    assert.equal(typeof RSMLAnnotator.prototype.setRenderMode, "function");
  });

  it("serves the same core from CommonJS and ES module builds", async () => {
    const cjs = require("../core.cjs");
    const esm = await import("../core.js");
    assert.deepEqual(cjs.defaultVocabulary(), esm.defaultVocabulary());
    assert.equal(cjs.VERSION, esm.VERSION);
  });
});
