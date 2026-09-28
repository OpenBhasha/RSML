(function (root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RSMLAnnotator = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  // ---------- Utilities ----------
  function $(elOrSelector) {
    if (!elOrSelector) return null;
    return typeof elOrSelector === "string"
      ? document.querySelector(elOrSelector)
      : elOrSelector;
  }

  function injectCoreStyles() {
    const STYLE_ID = "rsml-annotator-core-css";
    if (document.getElementById(STYLE_ID)) return;

    const css = `
/* === RSML Annotator Core Styles === */
.rsml-content {
  white-space: pre-wrap;   /* preserves \n */
  word-break: break-word;
  line-height: 1.9;
}
.rsml-content > * { line-height: inherit; }
@keyframes rsmlFadeIn { from { opacity:0; transform: translateY(-3px);} to { opacity:1; transform:none;} }

code-mix, accent, mispronunciation, entity, dialect, domain,
.rsml-span, .rsml-at {
  /* inline-block keeps a chip atomic: if it doesn't fit at the current
     line position it moves to the next line as a whole unit, never split. */
  display: inline-block !important;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.95em;
  /* Don't inherit the container's 2.1 line-height — that would make each
     chip's box tall vertically. Chips stay compact; the extra breathing
     room lives in the space between wrapped lines of chips. */
  line-height: 1.35;
  vertical-align: baseline;
  /* Prevent internal word-wrap so a chip stays on a single line where
     possible; overrideable per-category if very long content is expected. */
  white-space: nowrap;
}
code-mix { background-color:#c8f7ff; border:1px solid #7fd7ea; }
accent { background-color:#e2caff; border:1px solid #c18eff; }
mispronunciation { background-color:#ffd1a8; border:1px solid #ffae70; }
entity { background-color:#fff7a8; border:1px solid #e6db65; color:#444; position:relative; cursor:help; }
dialect { background-color:#dbe4ff; border:1px solid #8fa8f5; }
domain { background-color:#d4f5e9; border:1px solid #7cc9a8; }
/* Span-pair categories. */
.rsml-disfluency { background-color:#ffe0b3; border:1px solid #ffb84d; }
.rsml-paralinguistic { background-color:#e6ffb3; border:1px solid #b3d977; }
.rsml-prosody { background-color:#ffd6f0; border:1px solid #f095c8; }
/* Isolated @-token categories. */
.rsml-at-hesitation      { background-color:#fff0b3; border:1px solid #e5c96b; color:#5a4a10; }
.rsml-at-paralinguistic  { background-color:#e6ffb3; border:1px solid #b3d977; color:#3a5a10; }
.rsml-at-other           { background-color:#e0e6f0; border:1px solid #9aacc9; color:#324056; font-style:italic; }
.rsml-at-unknown         { background-color:#888; color:#fff; border:1px solid #666; }

/* "Hide disfluencies" display setting — combines opts.disfluencySpans,
   opts.hesitations and opts.isolatedOther into one toggle. A repair span
   that has a detected reparandum/repair split (rsml-repair-has-split) is
   excluded from the wholesale rule below: its outer chip stays visible and
   only its reparandum + separator children are hidden, leaving the
   corrected text in place. A repair span with no detected split falls
   through to the wholesale rule like any other disfluency. */
/* !important: overrides the base chip rule's own display:inline-block
   !important above (shared by every .rsml-span/.rsml-at element). */
.rsml-content.rsml-hide-disfluencies .rsml-disfluency:not(.rsml-repair-has-split) { display: none !important; }
.rsml-content.rsml-hide-disfluencies .rsml-at-hesitation { display: none !important; }
.rsml-content.rsml-hide-disfluencies .rsml-at-other { display: none !important; }
.rsml-content.rsml-hide-disfluencies .rsml-repair-has-split .rsml-reparandum,
.rsml-content.rsml-hide-disfluencies .rsml-repair-has-split .rsml-repair-sep { display: none; }

/* ===== Source-textarea syntax highlight overlay ===== */
.rsml-hl-container { position: relative; display: block; }
.rsml-hl-container > textarea.rsml-hl-textarea {
  position: relative;
  z-index: 2;
  background: transparent;
  color: transparent;
  -webkit-text-fill-color: transparent;
  caret-color: #212529;
}
/* Selection is drawn on the textarea (which is on top); a translucent
   background lets the highlighted source below stay visible. */
.rsml-hl-container > textarea.rsml-hl-textarea::selection {
  background: rgba(35, 132, 232, 0.28);
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.rsml-hl-container > textarea.rsml-hl-textarea::-moz-selection {
  background: rgba(35, 132, 232, 0.28);
  color: transparent;
}
.rsml-hl-container > .rsml-hl-highlights {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  color: #212529;
  border-color: transparent !important;
}
.rsml-hl-content {
  padding: 0;
  margin: 0;
  font: inherit;
  line-height: inherit;
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
  will-change: transform;
}
/* Text-shaping settings must match on both layers or complex scripts
   (Devanagari / Telugu conjuncts) drift character by character. */
.rsml-hl-container > textarea.rsml-hl-textarea,
.rsml-hl-content {
  font-kerning: normal;
  font-variant-ligatures: normal;
  font-variant-numeric: normal;
  font-variant-caps: normal;
  font-variant-east-asian: normal;
  font-feature-settings: normal;
  font-synthesis: none;
  font-optical-sizing: auto;
  text-rendering: auto;
  text-orientation: mixed;
  unicode-bidi: isolate;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
  tab-size: 4;
  hanging-punctuation: none;
  text-size-adjust: 100%;
}
/* Token colors — every category in its own hue so tags never blur into
   each other. Lexical content (verbatim/normalized/plain text) is default. */
/* Bracket-form tags */
.tok-code-mix         { color:#0e8fbf; }   /* teal      — ! */
.tok-entity           { color:#b8860b; }   /* gold      — # */
.tok-accent           { color:#7a3fbf; }   /* violet    — $ */
.tok-dialect          { color:#3949ab; }   /* indigo    — $$ */
.tok-domain           { color:#00695c; }   /* deep teal — !! */
.tok-mispronunciation { color:#c62828; }   /* red       — bare [](  ) */
/* Isolated @-tokens */
.tok-at-hesitation     { color:#8a7a10; }  /* olive     — @umm @uhh @hmm … */
.tok-at-paralinguistic { color:#2e7d32; }  /* green     — @laughter @cough … */
.tok-at-other          { color:#455a64; font-style: italic; }
                                            /* slate     — @silence @unintelligible @stutter-block */
.tok-at-unknown        { color:#616161; }
/* Span-pair @-tokens */
.tok-span-disfluency    { color:#6d4c41; }  /* brown     — @filler-* @repair-* … */
.tok-span-paralinguistic{ color:#2e7d32; }  /* green     — @laughing-* @crying-* … */
.tok-span-prosody       { color:#c2185b; }  /* magenta   — @emphasis-* @*-pitch-* */
.tok-span-speaker       { color:#4527a0; }  /* purple    — &sN-* */
.tok-span-unknown       { color:#616161; }
/* IDE-style match highlight — a subtle translucent background that
   doesn't move the glyphs. Applied to all syntax fragments of the
   tag under the caret (bracket-form opener/mid/closer, and to both
   siblings of any -start/-end pair). */
.tok-match {
  background-color: rgba(255, 213, 0, 0.28);
  border-radius: 3px;
}
/* Editor-side error / warning indicators.
   Errors (structural — orphan, unclosed bracket): red wavy underline.
   Warnings (semantic — unknown type / lang / @-tag): amber wavy underline. */
.tok-orphan, .tok-error {
  text-decoration: underline wavy #dc3545;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}
.tok-warning {
  text-decoration: underline wavy #f0ad4e;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
}
/* Status bar under the editor. */
.rsml-editor-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  font-size: 0.8em;
  color: #6c757d;
  font-family: system-ui, -apple-system, sans-serif;
}
.rsml-editor-status .rsml-error-count { color: #dc3545; font-weight: 600; }
.rsml-editor-status .rsml-warning-count { color: #d68910; font-weight: 600; }
.rsml-editor-status .rsml-status-sep { color: #adb5bd; }
/* Hover tooltip for issues (CM6's hoverTooltip wraps this in .cm-tooltip). */
.rsml-hover-tip {
  padding: 8px 12px;
  max-width: 340px;
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.85em;
  line-height: 1.4;
  color: #212529;
}
.rsml-hover-tip .rsml-hover-badge {
  display: inline-block;
  font-size: 0.68em;
  font-weight: 700;
  letter-spacing: 0.06em;
  padding: 2px 7px;
  border-radius: 3px;
  color: #fff;
  vertical-align: middle;
  margin-right: 6px;
}
.rsml-hover-tip-error   .rsml-hover-badge { background: #dc3545; }
.rsml-hover-tip-warning .rsml-hover-badge { background: #d68910; }
.rsml-hover-tip .rsml-hover-kind {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
  color: #6c757d;
  vertical-align: middle;
}
.rsml-hover-tip .rsml-hover-msg {
  margin-top: 6px;
  color: #212529;
  font-weight: 500;
}
.rsml-hover-tip .rsml-hover-action {
  margin-top: 6px;
  color: #495057;
  font-style: italic;
  border-top: 1px solid #dee2e6;
  padding-top: 6px;
}
.cm-tooltip:has(.rsml-hover-tip) {
  background: #fff !important;
  border: 1px solid #dee2e6 !important;
  border-radius: 6px !important;
  box-shadow: 0 6px 14px rgba(0,0,0,.18) !important;
  overflow: hidden;
}
/* Pitch-contour spans: inline (wraps naturally with content) with an inline
   arrow prefix — no absolute positioning, so the arrow can never orphan
   at the end of a line while its content wraps to the next. */
.rsml-span.rsml-span-raising-pitch,
.rsml-span.rsml-span-falling-pitch {
  background: rgba(252, 122, 0, 0.1);
  color:#000;
  border: 1px solid rgb(252, 122, 0);
  padding: 1px 4px;
  border-radius: 3px;
}
.rsml-span.rsml-span-raising-pitch::before {
  content: "↗\\00a0"; color:#c22; font-weight: 700;
}
.rsml-span.rsml-span-falling-pitch::before {
  content: "↘\\00a0"; color:#06c; font-weight: 700;
}
/* Whitespace-only literal runs between block-level tags (typically the
   space or newline between consecutive speaker turns) collapse so they
   don't render as a blank line. */
.rsml-lit-ws { white-space: normal; }
/* Speaker: the label sits on its own line before the turn content. */
.rsml-speaker { background: transparent; border: none; padding: 0; border-radius: 0; display: block; margin-top: 10px; }
.rsml-speaker:first-child { margin-top: 0; }
.rsml-speaker-label {
  display: block;
  width: fit-content;
  font-size: 0.7em;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #5a4dd0;
  padding: 2px 8px;
  border: 1px solid #cfc7ff;
  border-radius: 3px;
  margin: 6px 0 4px;
  text-transform: uppercase;
}
.rsml-span-orphan { outline:1px dashed #d33; }
/* Unpaired @X-start / @X-end / &sN-start / &sN-end — a visible red-dashed
   chip in the render pane so annotators can spot broken pairs. */
.rsml-orphan {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  background: rgba(220, 53, 69, 0.08);
  border: 1px dashed #dc3545;
  color: #a01818;
  font-weight: 600;
  font-size: 0.9em;
}
.rsml-orphan::before { content: "⚠ "; }
/* Verbatim / normalized layer switch — nested tags inherit the mode via CSS. */
.rsml-content .rsml-verbatim,
.rsml-content .rsml-normalized { display: inline; }
.rsml-content.rsml-mode-normalized .rsml-verbatim { display: none; }
.rsml-content.rsml-mode-verbatim .rsml-normalized { display: none; }
[data-bs-toggle="tooltip"] { cursor: help; }
.rsml-bg-gray { background-color: rgba(231,231,232,0.4); }
.form-check-label {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
/* Toolbar row: render-mode switch + settings button, side by side. */
.rsml-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.rsml-settings { position: relative; }
.rsml-settings-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  margin: 2px;
  border: 1px solid #ced4da;
  border-radius: 6px;
  background: #fff;
  color: #495057;
  cursor: pointer;
}
.rsml-settings-btn:hover { background: #f1f3f5; }
.rsml-settings-popup {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  z-index: 20;
  min-width: 200px;
  padding: 10px 12px;
  background: #fff;
  border: 1px solid #dee2e6;
  border-radius: 6px;
  box-shadow: 0 6px 14px rgba(0,0,0,.18);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 0.85em;
  color: #212529;
}
.rsml-settings-item {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  cursor: pointer;
}
`;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Get pixel coords for caret in a textarea
  // Optional Bootstrap tooltip activation — no-op if Bootstrap not present.
  function activateTooltips(rootEl) {
    if (!rootEl) return;
    const hasBootstrap =
      typeof window !== "undefined" &&
      window.bootstrap &&
      typeof window.bootstrap.Tooltip === "function";
    if (!hasBootstrap) return;

    const nodes = rootEl.querySelectorAll('[data-bs-toggle="tooltip"]');
    nodes.forEach((el) => new window.bootstrap.Tooltip(el));
  }

  // ---------- Defaults ----------
  // Isolated @-tokens (rendered as a single <noise> element).
  const DEFAULT_HESITATIONS = [
    "@umm", "@uhh", "@hmm", "@ugh", "@huh", "@tsk", "@uh-huh", "@ehh",
  ];

  const DEFAULT_ISOLATED_PARALINGUISTICS = [
    "@laughter", "@cry", "@hum", "@breathe", "@sniff", "@nose-blowing",
    "@cough", "@sneeze", "@throat-clearing", "@yawn",
    "@eating-sounds", "@snore", "@groan", "@sigh",
  ];

  const DEFAULT_ISOLATED_OTHER = [
    "@silence", "@unintelligible", "@stutter-block", "@pause", "@short-pause", "@long-pause",
  ];

  // Span pairs written as @<name>-start ... @<name>-end.
  const DEFAULT_DISFLUENCY_SPANS = [
    "filler", "repetition", "broken-word", "repair", "false-start", "prolongation",
  ];

  const DEFAULT_PARALINGUISTIC_SPANS = [
    "crying", "yelling", "laughing", "singing", "humming", "whistling", "whispering",
  ];

  const DEFAULT_PROSODY_SPANS = [
    "emphasis", "falling-pitch", "raising-pitch", "fast-speech", "slow-speech",
  ];


  const DEFAULT_ENTITY_MAP = {
    PER: "Person",
    GPE: "Geo Political Entity",
    FAC: "Facility",
    LOC: "Location",
    ITEM: "Item",
    WOA: "Work of Art",
    EVENT: "Event",
    SPORTS: "Sports",
    ORG: "Organization",
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

  const DEFAULT_LANGS = {
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
  const CATEGORY_SPECS = {
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

  // ---------- Core Class ----------
  class RSMLAnnotator {
    /**
     * @param {Object} opts
     * @param {HTMLTextAreaElement|string} opts.textarea - element or selector
     * @param {HTMLElement|string} opts.output - element or selector
     * @param {Array<string>} [opts.hesitations]
     * @param {Array<string>} [opts.isolatedParalinguistics]
     * @param {Array<string>} [opts.isolatedOther]
     * @param {Array<string>} [opts.disfluencySpans]
     * @param {Array<string>} [opts.paralinguisticSpans]
     * @param {Array<string>} [opts.prosodySpans]
     * @param {Object} [opts.entities]
     * @param {Object} [opts.languages]
     * @param {Object} [opts.dialects] - code -> label, matched by the `$$` prefix
     * @param {Object} [opts.domains] - code -> label, matched by the `!!` prefix
     * @param {boolean} [opts.demoText=false]
     *
     * Every list/map above can also be grown after construction with
     * add(category, value, label) / remove(category, value) — see the
     * "Public API: dynamic registration" section below. `opts.tags` is
     * derived automatically and should not be passed in.
     */
    constructor(opts) {
      injectCoreStyles();

      // --- Options & Elements ---
      this.opts = Object.assign(
        {
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
          demoText: false,
        },
        opts || {}
      );

      this._rebuildTagCaches();

      this.textarea = $(this.opts.textarea);
      this.output = $(this.opts.output);

      if (!this.textarea || !this.output) {
        throw new Error(
          "[RSMLAnnotator] textarea and output are required (DOM elements or selectors)."
        );
      }

      // Make the render pane user-resizable to match the editor's resize handle.
      // Only set when the host hasn't already specified `resize`.
      const outCs = getComputedStyle(this.output);
      if (outCs.resize === "none") {
        this.output.style.resize = "vertical";
        if (outCs.overflow === "visible") this.output.style.overflow = "auto";
        if (!this.output.style.minHeight) this.output.style.minHeight = "80px";
      }

      // Double-click a rendered word/tag → jump the caret to its source span.
      this._onOutputDblclick = (e) => this._jumpToSource(e);
      this.output.addEventListener("dblclick", this._onOutputDblclick);

      this.renderMode = "normalized"; // or "verbatim"
      this._toggleInjected = false;
      // Pure view-state, not persisted — same treatment as renderMode.
      this._displaySettings = { hideDisfluencies: false };
      this._settingsPopupOpen = false;

      // Textarea `input` is the fallback path: if CodeMirror never mounts
      // the render pane still updates as the user types.
      this._onInput = this._onInput.bind(this);
      this.textarea.addEventListener("input", this._onInput);

      // Initial render/demo
      if (this.opts.demoText) {
        this.textarea.value = `मुझे @umm लगता है कि यह सही है। मैं @filler-start मतलब @filler-end कल आऊंगा। @repetition-start मैं @repetition-end मैं जा रहा हूँ। मैं @broken-word-start ज @broken-word-end जाना चाहता हूँ। मैं @repair-start दिल्ली मतलब - मुंबई @repair-end गया। मुझे @prolongation-start बहुत @prolongation-end पसंद है। वह @laughing-start बहुत मज़ेदार है @laughing-end बोला। यह @emphasis-start सच में @emphasis-end अच्छा है। उसने [सक्रीन](स्क्रीन) तोड़ दी। क्या आप !en[लोकेशन](location) पर पहुँच गया? वे #GPE[हैदराबाद](हैदराबाद) में रहते हैं। उसने $[नईं](नहीं) कहा।

&s1-start आप कैसे हैं? &s1-end &s2-start मैं ठीक हूँ। @laughter &s2-end`;
      }
      this._render();
      // Prefer CodeMirror 6 as the editing surface (single-layer render, no
      // overlay drift). Fall back to the plain textarea if CM6 can't load
      // (offline, strict CSP, etc.).
      this._bootCM().catch((err) => {
        console.warn("[RSMLAnnotator] CodeMirror unavailable, using plain textarea:", err);
      });
    }

    // ---------- Public API ----------
    destroy() {
      this.textarea.removeEventListener("input", this._onInput);
      if (this.view) { this.view.destroy(); this.view = null; }
      if (this._statusEl && this._statusEl.parentNode) {
        this._statusEl.parentNode.removeChild(this._statusEl);
        this._statusEl = null;
      }
      if (this._onOutputDblclick && this.output) {
        this.output.removeEventListener("dblclick", this._onOutputDblclick);
        this._onOutputDblclick = null;
      }
      this._closeSettingsPopup();
    }
    setValue(str) {
      const value = str || "";
      this.textarea.value = value;
      if (this.view && this._cm) {
        this.view.dispatch({
          changes: { from: 0, to: this.view.state.doc.length, insert: value },
        });
      }
      this._render();
    }
    getValue() {
      return this.textarea.value;
    }
    undo() {
      if (this.view && this._cm) return this._cm.commands.undo(this.view);
    }
    redo() {
      if (this.view && this._cm) return this._cm.commands.redo(this.view);
    }

    // ---------- Public API: dynamic registration ----------
    // Register or unregister a value in one of the configured vocabularies.
    //   category: "hesitations" | "isolatedParalinguistics" | "isolatedOther"
    //           | "disfluencySpans" | "paralinguisticSpans" | "prosodySpans"
    //           | "entities" | "languages" | "dialects" | "domains"
    //   value:    the @tag / span base name / map code to add or remove
    //   label:    map categories only (entities/languages/dialects/domains) —
    //             the display label; defaults to `value` itself if omitted
    // Returns true if state changed, false for a no-op remove (nothing by
    // that name was registered). Throws on an unknown category, an invalid
    // value, or — for the @tag and span-pair families, which each share one
    // flat namespace across their sibling categories — a name already
    // registered under a *different* category in that family. An
    // already-mounted editor reflects the change immediately; no re-render
    // or retyping needed.
    add(category, value, label) {
      const spec = CATEGORY_SPECS[category];
      if (!spec) {
        throw new Error(
          `[RSMLAnnotator] Unknown category: "${category}". Expected one of: ${Object.keys(CATEGORY_SPECS).join(", ")}`
        );
      }
      if (spec.kind === "isolated") return this._addIsolatedTag(category, spec.tagCategory, value);
      if (spec.kind === "span")     return this._addSpanName(category, spec.tagCategory, value);
      return this._setMapEntry(category, value, label, spec.lowercaseKey);
    }
    remove(category, value) {
      const spec = CATEGORY_SPECS[category];
      if (!spec) {
        throw new Error(
          `[RSMLAnnotator] Unknown category: "${category}". Expected one of: ${Object.keys(CATEGORY_SPECS).join(", ")}`
        );
      }
      if (spec.kind === "isolated") return this._removeIsolatedTag(category, value);
      if (spec.kind === "span")     return this._removeSpanName(category, value);
      return this._deleteMapEntry(category, value, spec.lowercaseKey);
    }

    // ---------- Internal: dynamic registration helpers ----------
    // Rebuilds every cache derived from the opts lists/maps above. Called
    // once at construction and again after any add()/remove().
    _rebuildTagCaches() {
      // Cache category lookup for span base names.
      this._spanCategory = new Map();
      for (const b of this.opts.disfluencySpans)     this._spanCategory.set(b, "disfluency");
      for (const b of this.opts.paralinguisticSpans) this._spanCategory.set(b, "paralinguistic");
      for (const b of this.opts.prosodySpans)        this._spanCategory.set(b, "prosody");

      // Cache category lookup for isolated @-tokens (with and without the '@' prefix).
      this._atCategory = new Map();
      const stripAt = (t) => (t[0] === "@" ? t.slice(1) : t);
      for (const t of this.opts.hesitations)              this._atCategory.set(stripAt(t), "hesitation");
      for (const t of this.opts.isolatedParalinguistics)  this._atCategory.set(stripAt(t), "paralinguistic");
      for (const t of this.opts.isolatedOther)            this._atCategory.set(stripAt(t), "other");

      // Full @-tag completion list: isolated tokens plus both ends of every span pair.
      const spanTokens = [];
      for (const b of this.opts.disfluencySpans.concat(this.opts.paralinguisticSpans, this.opts.prosodySpans)) {
        spanTokens.push(`@${b}-start`, `@${b}-end`);
      }
      this.opts.tags = this.opts.hesitations
        .concat(this.opts.isolatedParalinguistics)
        .concat(this.opts.isolatedOther)
        .concat(spanTokens);
    }

    // Re-render the output pane and, if CM6 is mounted, force its highlight/
    // warning decorations to recompute (they otherwise only refresh on a
    // doc change — see the `_cmRefreshEffect` dispatched here, defined
    // alongside `decoField` in `_mountCM`).
    _refreshAfterConfigChange() {
      this._render();
      if (this.view && this._cmRefreshEffect) {
        this.view.dispatch({ effects: this._cmRefreshEffect.of(null) });
      }
      this._updateStatus();
    }

    _addIsolatedTag(listKey, category, rawTag) {
      if (typeof rawTag !== "string" || !rawTag.trim()) {
        throw new Error(`[RSMLAnnotator] add("${listKey}", ...) needs a non-empty tag name.`);
      }
      const bare = rawTag[0] === "@" ? rawTag.slice(1) : rawTag;
      if (!/^[\w-]+$/.test(bare)) {
        throw new Error(
          `[RSMLAnnotator] Invalid tag name "@${bare}" — only letters, numbers, "_" and "-" are allowed.`
        );
      }
      const existingCategory = this._atCategory.get(bare);
      if (existingCategory && existingCategory !== category) {
        throw new Error(
          `[RSMLAnnotator] "@${bare}" is already registered as a ${existingCategory} tag. Remove it first or choose a different name.`
        );
      }
      const stored = `@${bare}`;
      if (this.opts[listKey].includes(stored)) return false;
      this.opts[listKey].push(stored);
      this._rebuildTagCaches();
      this._refreshAfterConfigChange();
      return true;
    }

    _removeIsolatedTag(listKey, rawTag) {
      if (typeof rawTag !== "string") return false;
      const bare = rawTag[0] === "@" ? rawTag.slice(1) : rawTag;
      const idx = this.opts[listKey].indexOf(`@${bare}`);
      if (idx === -1) return false;
      this.opts[listKey].splice(idx, 1);
      this._rebuildTagCaches();
      this._refreshAfterConfigChange();
      return true;
    }

    _addSpanName(listKey, category, base) {
      if (typeof base !== "string" || !/^[\w-]+$/.test(base)) {
        throw new Error(
          `[RSMLAnnotator] Invalid span name "${base}" — only letters, numbers, "_" and "-" are allowed.`
        );
      }
      const existingCategory = this._spanCategory.get(base);
      if (existingCategory && existingCategory !== category) {
        throw new Error(
          `[RSMLAnnotator] "${base}" is already registered as a ${existingCategory} span. Remove it first or choose a different name.`
        );
      }
      if (this.opts[listKey].includes(base)) return false;
      this.opts[listKey].push(base);
      this._rebuildTagCaches();
      this._refreshAfterConfigChange();
      return true;
    }

    _removeSpanName(listKey, base) {
      if (typeof base !== "string") return false;
      const idx = this.opts[listKey].indexOf(base);
      if (idx === -1) return false;
      this.opts[listKey].splice(idx, 1);
      this._rebuildTagCaches();
      this._refreshAfterConfigChange();
      return true;
    }

    _setMapEntry(mapKey, code, label, lowercaseKey) {
      if (typeof code !== "string" || !code.trim()) {
        throw new Error(`[RSMLAnnotator] add("${mapKey}", ...) needs a non-empty code.`);
      }
      const key = lowercaseKey ? code.toLowerCase() : code;
      this.opts[mapKey][key] = label == null || label === "" ? key : label;
      this._refreshAfterConfigChange();
      return true;
    }

    _deleteMapEntry(mapKey, code, lowercaseKey) {
      if (typeof code !== "string") return false;
      const key = lowercaseKey ? code.toLowerCase() : code;
      if (!(key in this.opts[mapKey])) return false;
      delete this.opts[mapKey][key];
      this._refreshAfterConfigChange();
      return true;
    }

    // ---------- Internal: Events ----------
    _onInput() {
      // Fallback path used only when CodeMirror hasn't mounted; the
      // CM updateListener drives re-render directly otherwise.
      this._render();
    }

    // Build the &-trigger suggestion list. Every speaker that already appears
    // in the buffer stays available for reuse — using a tag once doesn't
    // remove it from the list. s1 and s2 are always offered as defaults, and
    // the last entry adds a fresh speaker beyond the current maximum.
    _buildSpeakerSuggestions(query) {
      const text = this.textarea.value || "";
      const used = new Set([1, 2]);
      for (const m of text.matchAll(/&s(\d+)-(?:start|end)/g)) {
        used.add(parseInt(m[1], 10));
      }
      const speakers = [...used].sort((a, b) => a - b);
      const nextNew = speakers[speakers.length - 1] + 1;
      const list = [];
      for (const n of speakers) {
        list.push(`s${n}-start`);
        list.push(`s${n}-end`);
      }
      list.push(`s${nextNew}-start  (add new speaker)`);
      list.push(`s${nextNew}-end  (add new speaker)`);
      if (!query) return list;
      const q = query.toLowerCase();
      const filtered = list.filter((item) => item.toLowerCase().startsWith(q));
      return filtered.length ? filtered : list;
    }

 /* =========================
       Toggle UI
    ========================= */
    _createRenderToggle() {const wrap = document.createElement("div");
      wrap.className = "form-check form-switch m-2";
      
      const toggleId = `rsml-mode-${Math.random().toString(36).slice(2, 9)}`;
      
      wrap.innerHTML = `
        <input
          class="form-check-input"
          type="checkbox"
          id="${toggleId}"
          checked
        >
        <label class="form-check-label" for="${toggleId}">
          Normalized
        </label>
      `;

      const input = wrap.querySelector("input");
      const label = wrap.querySelector("label");

      input.addEventListener("change", () => {
        this.renderMode = input.checked ? "normalized" : "verbatim";
        label.textContent = input.checked ? "Normalized" : "Verbatim";
        this._applyRenderMode(this.output);
      });

      return wrap;
    }

    // Gear button + popup, sitting beside the render-mode switch in the
    // shared toolbar row. Currently one checkbox; more can be added later
    // without restructuring (just another <label> + CSS rule).
    _createSettingsControl() {
      const wrap = document.createElement("div");
      wrap.className = "rsml-settings";
      wrap.innerHTML = `
        <button type="button" class="rsml-settings-btn" aria-haspopup="true" aria-expanded="false" title="Display settings" aria-label="Display settings">
          <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
            <path fill="currentColor" d="M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm7.94 2.19-1.6-.28a6.4 6.4 0 0 0-.55-1.33l.95-1.32a.6.6 0 0 0-.06-.77l-1.16-1.16a.6.6 0 0 0-.77-.06l-1.32.95a6.4 6.4 0 0 0-1.33-.55l-.28-1.6A.6.6 0 0 0 11.23 2H9.6a.6.6 0 0 0-.6.5l-.28 1.6c-.47.14-.92.33-1.33.55L6.07 3.7a.6.6 0 0 0-.77.06L4.14 4.92a.6.6 0 0 0-.06.77l.95 1.32c-.22.41-.4.86-.55 1.33l-1.6.28a.6.6 0 0 0-.5.6v1.63c0 .3.21.55.5.6l1.6.28c.14.47.33.92.55 1.33l-.95 1.32a.6.6 0 0 0 .06.77l1.16 1.16c.2.2.53.23.77.06l1.32-.95c.41.22.86.4 1.33.55l.28 1.6c.05.29.3.5.6.5h1.63c.3 0 .55-.21.6-.5l.28-1.6c.47-.14.92-.33 1.33-.55l1.32.95c.24.17.57.14.77-.06l1.16-1.16a.6.6 0 0 0 .06-.77l-.95-1.32c.22-.41.4-.86.55-1.33l1.6-.28a.6.6 0 0 0 .5-.6V9.3a.6.6 0 0 0-.5-.6Z"/>
          </svg>
        </button>
        <div class="rsml-settings-popup" hidden>
          <label class="rsml-settings-item">
            <input type="checkbox" data-setting="hideDisfluencies">
            Hide disfluencies
          </label>
        </div>
      `;

      const btn = wrap.querySelector(".rsml-settings-btn");
      const checkbox = wrap.querySelector('[data-setting="hideDisfluencies"]');
      checkbox.checked = this._displaySettings.hideDisfluencies;

      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        if (this._settingsPopupOpen) this._closeSettingsPopup();
        else this._openSettingsPopup(wrap);
      });
      checkbox.addEventListener("change", () => {
        this._displaySettings.hideDisfluencies = checkbox.checked;
        this._applyDisplaySettings(this.output);
      });

      this._settingsWrap = wrap;
      return wrap;
    }

    _openSettingsPopup(wrap) {
      const popup = wrap.querySelector(".rsml-settings-popup");
      const btn = wrap.querySelector(".rsml-settings-btn");
      if (!popup || !btn) return;
      popup.hidden = false;
      btn.setAttribute("aria-expanded", "true");
      this._settingsPopupOpen = true;

      // Close on outside click or Escape. Added only while open; removed on
      // close and in destroy() so nothing leaks past the widget's lifetime.
      this._onDocPointerDown = (e) => {
        if (!wrap.contains(e.target)) this._closeSettingsPopup();
      };
      this._onDocKeydown = (e) => {
        if (e.key === "Escape") this._closeSettingsPopup();
      };
      document.addEventListener("mousedown", this._onDocPointerDown);
      document.addEventListener("keydown", this._onDocKeydown);
    }

    _closeSettingsPopup() {
      if (this._onDocPointerDown) {
        document.removeEventListener("mousedown", this._onDocPointerDown);
        this._onDocPointerDown = null;
      }
      if (this._onDocKeydown) {
        document.removeEventListener("keydown", this._onDocKeydown);
        this._onDocKeydown = null;
      }
      this._settingsPopupOpen = false;
      if (this._settingsWrap) {
        const popup = this._settingsWrap.querySelector(".rsml-settings-popup");
        const btn = this._settingsWrap.querySelector(".rsml-settings-btn");
        if (popup) popup.hidden = true;
        if (btn) btn.setAttribute("aria-expanded", "false");
      }
    }

    // Toolbar row: render-mode switch + settings button, side by side.
    // Built once and preserved across re-renders (see _render()), just like
    // the switch alone was before.
    _createToolbar() {
      const bar = document.createElement("div");
      bar.className = "rsml-toolbar";
      bar.appendChild(this._createRenderToggle());
      bar.appendChild(this._createSettingsControl());
      return bar;
    }

    /* =========================
       Render Pipeline
    ========================= */
    _render() {
      const text = this.textarea.value || "";
      const html = this._transformRSML(text);

      // Preserve the toolbar (render-mode switch + settings button) across re-renders.
      const toolbar = this.output.querySelector(".rsml-toolbar");
      this.output.innerHTML = "";
      if (toolbar) this.output.appendChild(toolbar);
      if (!toolbar && !this._toggleInjected) {
        this.output.appendChild(this._createToolbar());
        this._toggleInjected = true;
      }

      const content = document.createElement("div");
      content.className = `rsml-content rsml-mode-${this.renderMode}`
        + (this._displaySettings.hideDisfluencies ? " rsml-hide-disfluencies" : "");
      content.innerHTML = html;
      this.output.appendChild(content);

      requestAnimationFrame(() => activateTooltips(this.output));
    }

    /* =========================
       Render Mode Switch
    ========================= */
    _applyRenderMode(root) {
      // Toggle a class on the content container; nested tags inherit via CSS.
      const content = root.querySelector(".rsml-content");
      if (!content) return;
      content.classList.remove("rsml-mode-normalized", "rsml-mode-verbatim");
      content.classList.add(`rsml-mode-${this.renderMode}`);
    }

    // Toggle the hide-disfluencies class; CSS does the rest (see
    // injectCoreStyles). A pure class flip, no re-render — scroll/caret
    // position in the output pane is untouched.
    _applyDisplaySettings(root) {
      const content = root.querySelector(".rsml-content");
      if (!content) return;
      content.classList.toggle("rsml-hide-disfluencies", this._displaySettings.hideDisfluencies);
    }

    /* =========================
       RSML Parser
       -------------------------
       Bracket forms (!, #, $) and bare [v](n) mispronunciation recurse
       through their payloads so any depth of nesting renders correctly.
       Span pairs (@name-start/@name-end and &sN-start/&sN-end) emit bare
       <span> open/close markers — the DOM parser stitches them across
       surrounding text.
    ========================= */
    _transformRSML(text) {
      let out = "";
      let i = 0;
      const n = text.length;
      let literalStart = -1;
      const orphans = this._findOrphans(text);
      // Consumed by _openSpan() (repair-start) and the boundary checks
      // below (repair-end side) — see _findRepairSplits().
      this._repairSplits = this._findRepairSplits(text);
      const flushLiteral = (end) => {
        if (literalStart === -1) return;
        const chunk = text.slice(literalStart, end);
        const esc = chunk
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        // Whitespace-only runs collapse at block-level boundaries (between
        // speaker turns, mostly) so they don't render as extra blank lines.
        const wsOnly = !/\S/.test(chunk);
        const cls = wsOnly ? "rsml-lit rsml-lit-ws" : "rsml-lit";
        out += `<span class="${cls}" data-src="${literalStart}:${end}">${esc}</span>`;
        literalStart = -1;
      };

      while (i < n) {
        // Zero-width repair-span boundaries (see _findRepairSplits): these
        // don't consume any characters or `continue` — whatever's actually
        // at position i still gets handled normally by the checks below.
        if (this._repairSplits.dashStart.has(i)) {
          flushLiteral(i);
          out += `</span><span class="rsml-repair-sep">`;
        }
        if (this._repairSplits.dashEnd.has(i)) {
          flushLiteral(i);
          out += `</span><span class="rsml-repair-fix">`;
        }
        if (this._repairSplits.fixEnd.has(i)) {
          flushLiteral(i);
          out += `</span>`;
        }

        // Prefixed bracket form:  ! # $  + optional type + [v](n)
        const pm = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const prefix = pm[1];
          const type = pm[2] || "";
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              flushLiteral(i);
              const verbatim = text.slice(openBracket + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              out += this._buildTaggedHTML(prefix, type, verbatim, normalized, i, closeParen + 1);
              i = closeParen + 1;
              continue;
            }
          }
        }

        // Bare mispronunciation:  [v](n)
        if (text[i] === "[") {
          const closeBracket = this._matchBracket(text, i, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              flushLiteral(i);
              const verbatim = text.slice(i + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              out += this._buildTaggedHTML("[", "", verbatim, normalized, i, closeParen + 1);
              i = closeParen + 1;
              continue;
            }
          }
        }

        // @tag / @name-start / @name-end
        if (text[i] === "@") {
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (at) {
            flushLiteral(i);
            if (orphans.has(i)) {
              out += this._buildOrphanChip(at[0], i, i + at[0].length);
            } else {
              out += this._buildAtToken(at[1], i, i + at[0].length);
            }
            i += at[0].length;
            continue;
          }
        }

        // Speaker span: &sN-start / &sN-end
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            flushLiteral(i);
            if (orphans.has(i)) {
              out += this._buildOrphanChip(sp[0], i, i + sp[0].length);
            } else if (sp[2] === "start") {
              const num = sp[1].slice(1);
              out += `<span class="rsml-speaker" data-speaker="${this._esc(sp[1])}" data-src="${i}:${i + sp[0].length}">`
                   + `<span class="rsml-speaker-label" data-bs-toggle="tooltip" data-bs-title="speaker turn: ${this._esc(sp[1])}" data-src="${i}:${i + sp[0].length}">Speaker ${this._esc(num)}:</span>`;
            } else {
              out += `</span>`;
            }
            i += sp[0].length;
            continue;
          }
        }

        // Track literal-text runs so we can wrap them in a data-src span later.
        if (literalStart === -1) literalStart = i;
        i++;
      }
      flushLiteral(i);
      return out;
    }

    // Returns a Set of source positions for every `@X-start`, `@X-end`,
    // `&sN-start`, `&sN-end` token that has no matching sibling. Pairs are
    // matched name-by-name with LIFO stacks — the first `-start` of a given
    // base pairs with the first `-end` of the same base, etc. Anything left
    // in a stack after the scan (or a `-end` that hits an empty stack) is
    // reported as an orphan.
    _findOrphans(text) {
      const orphans = new Set();
      const stacks = new Map();
      const re = /@([\w-]+?)(-start|-end)(?![\w-])|&(s\d+)-(start|end)(?![\w-])/g;
      let m;
      while ((m = re.exec(text))) {
        const name = m[1] || m[3];
        const role = m[2] ? m[2].slice(1) : m[4];
        const pos = m.index;
        if (role === "start") {
          if (!stacks.has(name)) stacks.set(name, []);
          stacks.get(name).push(pos);
        } else {
          const stk = stacks.get(name);
          if (stk && stk.length) stk.pop();
          else orphans.add(pos);
        }
      }
      for (const positions of stacks.values()) {
        for (const p of positions) orphans.add(p);
      }
      return orphans;
    }

    // Pairs up @repair-start/@repair-end (innermost-first, same LIFO
    // approach as _findOrphans) and, for each matched span, looks for the
    // documented `reparandum - repair` convention inside it. Drives the
    // "hide disfluencies" rendering split in _transformRSML()/_openSpan():
    // a repair span with a detected dash keeps its corrected half visible
    // even when disfluencies are hidden; one without falls back to being
    // hidden wholesale like any other disfluency span.
    //
    // Returns four Sets of *source positions*, each a zero-width boundary
    // consulted by _transformRSML's main loop:
    //   openExtra — right after "@repair-start": _openSpan() opens an extra
    //               <span class="rsml-reparandum"> here.
    //   dashStart — closes reparandum, opens <span class="rsml-repair-sep">.
    //   dashEnd   — closes the separator, opens <span class="rsml-repair-fix">.
    //   fixEnd    — closes repair-fix early (trimmed of trailing
    //               whitespace) so the space before "@repair-end" doesn't
    //               double up with the literal space that follows it once
    //               the reparandum is hidden.
    _findRepairSplits(text) {
      const openExtra = new Set();
      const dashStart = new Set();
      const dashEnd = new Set();
      const fixEnd = new Set();

      const re = /@repair-(start|end)(?![\w-])/g;
      const stack = [];
      const pairs = [];
      let m;
      while ((m = re.exec(text))) {
        if (m[1] === "start") {
          stack.push(m.index + m[0].length);
        } else {
          const contentStart = stack.pop();
          if (contentStart == null) continue; // orphan -end; ignored here
          pairs.push([contentStart, m.index]);
        }
      }

      for (const [contentStart, contentEnd] of pairs) {
        const dash = this._findTopLevelDash(text, contentStart, contentEnd);
        if (!dash) continue; // no convention found — render/hide as a whole
        let trimmedEnd = contentEnd;
        while (trimmedEnd > dash.end && /\s/.test(text[trimmedEnd - 1])) trimmedEnd--;
        openExtra.add(contentStart);
        dashStart.add(dash.start);
        dashEnd.add(dash.end);
        fixEnd.add(trimmedEnd);
      }

      return { openExtra, dashStart, dashEnd, fixEnd };
    }

    // First top-level (not inside a nested [...]/(...) tag payload)
    // whitespace-hyphen-whitespace run in text.slice(from, to) — the
    // reparandum/repair separator convention, e.g. "दिल्ली मतलब - मुंबई".
    // Expands to consume full surrounding whitespace runs so both sides
    // trim clean. Returns null if no such run exists in range.
    _findTopLevelDash(text, from, to) {
      let depth = 0;
      for (let i = from; i < to; i++) {
        const c = text[i];
        if (c === "[" || c === "(") { depth++; continue; }
        if (c === "]" || c === ")") { depth = Math.max(0, depth - 1); continue; }
        if (depth === 0 && c === "-" && /\s/.test(text[i - 1] || "") && /\s/.test(text[i + 1] || "")) {
          let start = i, end = i + 1;
          while (start > from && /\s/.test(text[start - 1])) start--;
          while (end < to && /\s/.test(text[end])) end++;
          return { start, end };
        }
      }
      return null;
    }

    // Full validation pass. Returns:
    //   { errors:   [{ start, end, kind, message }, ...],   // structural
    //     warnings: [{ start, end, kind, message }, ...] }  // semantic
    //
    // Errors: orphan -start/-end, unclosed `[`, unclosed `(`, `]` not
    // followed by `(` after a prefix.
    // Warnings: unknown entity type (#XYZ), unknown language code (!xy),
    // unknown @-tag (@foo, @bar-start with no such span, …).
    _findIssues(text) {
      const errors = [];
      const warnings = [];
      const seenOrphan = new Set();

      // 1) Orphan -start / -end (reuse the existing detector).
      for (const pos of this._findOrphans(text)) {
        seenOrphan.add(pos);
        const rest = text.slice(pos);
        const m = /^@[\w-]+|^&s\d+-(?:start|end)/.exec(rest);
        if (!m) continue;
        const token = m[0];
        const role = token.endsWith("-start") ? "start" : "end";
        const missing = role === "start" ? "-end" : "-start";
        errors.push({
          start: pos, end: pos + token.length,
          kind: "orphan",
          message: `Unpaired ${role}: no matching ${missing}`,
        });
      }

      // 2) Structural + unknown-type walk.
      let i = 0;
      const n = text.length;
      while (i < n) {
        // Prefix immediately followed by a close bracket — always malformed
        // (`!)`, `#]`, `$}`, etc). No legitimate use.
        const pmClose = /^(\$\$|!!|[!#$])[\])}]/.exec(text.slice(i));
        if (pmClose) {
          errors.push({
            start: i, end: i + pmClose[0].length,
            kind: "stray-bracket",
            message: `Stray \`${pmClose[0]}\` — a prefix must be followed by \`[verbatim](normalized)\``,
          });
          i += pmClose[0].length;
          continue;
        }

        // Prefix followed by `(` instead of `[` — user typed `!en(foo)` etc.
        // Flag it before the normal prefix-`[` match so we don't drop through
        // to per-character walking.
        const pmParen = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\(/.exec(text.slice(i));
        if (pmParen) {
          const openParen = i + pmParen[0].length - 1;
          const closeParen = this._matchBracket(text, openParen, "(", ")");
          const endPos = closeParen === -1 ? openParen + 1 : closeParen + 1;
          errors.push({
            start: i, end: endPos,
            kind: "missing-bracket",
            message: `Prefix \`${pmParen[1]}\` followed by \`(\` — expected \`[verbatim](normalized)\``,
          });
          i = endPos;
          continue;
        }

        // Prefix bracket form
        const pm = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const prefix = pm[1];
          const type = pm[2] || "";
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket === -1) {
            errors.push({
              start: i, end: openBracket + 1,
              kind: "unclosed-bracket",
              message: "Unclosed `[` — expected matching `]`",
            });
            i = openBracket + 1;
            continue;
          }
          if (text[closeBracket + 1] !== "(") {
            errors.push({
              start: closeBracket, end: closeBracket + 1,
              kind: "missing-paren",
              message: "Expected `(` after `]`",
            });
            i = closeBracket + 1;
            continue;
          }
          const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
          if (closeParen === -1) {
            errors.push({
              start: closeBracket + 1, end: closeBracket + 2,
              kind: "unclosed-paren",
              message: "Unclosed `(`",
            });
            i = closeBracket + 2;
            continue;
          }
          // Verbatim uses the same prose rules as the outer text — specials
          // are only allowed inside the normalized slot.
          this._flagProseSlice(text, openBracket + 1, closeBracket, errors);
          // Nested tag inside normalized (an inner `](` gives it away).
          if (text.slice(closeBracket + 2, closeParen).includes("](")) {
            errors.push({
              start: i, end: closeParen + 1,
              kind: "nested-tag",
              message: "Nested tag inside `(normalized)`",
            });
          }
          // Warn on unknown type / lang / dialect / domain (only if the
          // user actually typed one). Offsets use prefix.length so this
          // works for both single-char (!, #) and doubled ($$, !!) prefixes.
          if (type) {
            const typeStart = i + prefix.length;
            const typeEnd = typeStart + type.length;
            if (prefix === "#" && !this.opts.entities[type]) {
              warnings.push({
                start: typeStart, end: typeEnd,
                kind: "unknown-entity",
                message: `Unknown entity type: \`#${type}\``,
              });
            } else if (prefix === "!" && !this.opts.languages[type.toLowerCase()]) {
              warnings.push({
                start: typeStart, end: typeEnd,
                kind: "unknown-language",
                message: `Unknown language code: \`!${type}\``,
              });
            } else if (prefix === "$$" && !this.opts.dialects[type]) {
              warnings.push({
                start: typeStart, end: typeEnd,
                kind: "unknown-dialect",
                message: `Unknown dialect code: \`$$${type}\``,
              });
            } else if (prefix === "!!" && !this.opts.domains[type]) {
              warnings.push({
                start: typeStart, end: typeEnd,
                kind: "unknown-domain",
                message: `Unknown domain code: \`!!${type}\``,
              });
            }
            // $ accents are free-form; no warning.
          }
          i = closeParen + 1;
          continue;
        }

        // Bare `[…](…)` — plain brackets aren't prose either, so flag any
        // `[` that doesn't form a valid mispronunciation tag.
        if (text[i] === "[") {
          const closeBracket = this._matchBracket(text, i, "[", "]");
          if (closeBracket === -1) {
            errors.push({
              start: i, end: i + 1,
              kind: "stray-char",
              message: "Stray `[`",
            });
            i++;
            continue;
          }
          if (text[closeBracket + 1] !== "(") {
            // `[X]` not followed by `(` — brackets in prose are still stray.
            errors.push({ start: i, end: i + 1, kind: "stray-char", message: "Stray `[`" });
            errors.push({ start: closeBracket, end: closeBracket + 1, kind: "stray-char", message: "Stray `]`" });
            this._flagProseSlice(text, i + 1, closeBracket, errors);
            i = closeBracket + 1;
            continue;
          }
          const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
          if (closeParen === -1) {
            errors.push({
              start: closeBracket + 1, end: closeBracket + 2,
              kind: "unclosed-paren",
              message: "Unclosed `(`",
            });
            i = closeBracket + 2;
            continue;
          }
          // Valid `[v](n)` — flag prose issues in verbatim; look for nested
          // tag shapes in normalized.
          this._flagProseSlice(text, i + 1, closeBracket, errors);
          if (text.slice(closeBracket + 2, closeParen).includes("](")) {
            errors.push({
              start: i, end: closeParen + 1,
              kind: "nested-tag",
              message: "Nested tag inside `(normalized)`",
            });
          }
          i = closeParen + 1;
          continue;
        }

        // @tag — email-context `@` (preceded by a word char) is stray in
        // prose. Otherwise try `@word` and warn on unknown names.
        if (text[i] === "@") {
          const prev = i > 0 ? text[i - 1] : " ";
          if (/\w/.test(prev)) {
            errors.push({ start: i, end: i + 1, kind: "stray-at", message: "Stray `@` in prose" });
            i++;
            continue;
          }
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (!at) {
            errors.push({ start: i, end: i + 1, kind: "stray-at", message: "Stray `@` — must be followed by a tag name" });
            i++;
            continue;
          }
          const name = at[1];
          const isStart = name.endsWith("-start");
          const isEnd = !isStart && name.endsWith("-end");
          let known;
          if (isStart || isEnd) {
            const base = name.slice(0, isStart ? -6 : -4);
            known = this._spanCategory.has(base);
          } else {
            known = this._atCategory.has(name);
          }
          if (!known && !seenOrphan.has(i)) {
            warnings.push({
              start: i, end: i + at[0].length,
              kind: "unknown-tag",
              message: `Unknown \`@${name}\` — not in configured lists`,
            });
          }
          i += at[0].length;
          continue;
        }

        // Speaker — the only accepted shape is &sN-start / &sN-end.
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) { i += sp[0].length; continue; }
          const partial = /^&s\d+[\w-]*/.exec(text.slice(i));
          if (partial) {
            errors.push({
              start: i, end: i + partial[0].length,
              kind: "malformed-speaker",
              message:
                `Malformed speaker: expected \`${partial[0].split("-")[0]}-start\``
                + ` or \`${partial[0].split("-")[0]}-end\``,
            });
            i += partial[0].length;
            continue;
          }
          // Any other `&` is stray in prose.
          errors.push({ start: i, end: i + 1, kind: "stray-amp", message: "Stray `&`" });
          i++;
          continue;
        }

        // Prose stray characters. `#word` / `$word` / `!word` runs are
        // highlighted as a single range so the whole broken sequence is
        // visible; lone specials get a one-char range.
        const c = text[i];
        if (c === "#" || c === "$") {
          const m = /^[#$][\w-]*/.exec(text.slice(i));
          const len = m[0].length;
          errors.push({
            start: i, end: i + len,
            kind: "stray-char",
            message: `Stray \`${m[0]}\` — specials only belong inside \`(normalized)\``,
          });
          i += len;
          continue;
        }
        if (c === "!") {
          const prev = i > 0 ? text[i - 1] : "";
          const next = text[i + 1] || "";
          // OK when trailing a word, isolated, or repeated. Error only when
          // it's a bare-word prefix like `!hello` / `!500`.
          if (/\w/.test(prev) || !/\w/.test(next)) {
            i++;
            continue;
          }
          const m = /^!\w[\w-]*/.exec(text.slice(i));
          const len = m ? m[0].length : 1;
          errors.push({
            start: i, end: i + len,
            kind: "stray-prefix",
            message: `Stray \`${text.slice(i, i + len)}\` — \`!\` may only trail a word or repeat`,
          });
          i += len;
          continue;
        }
        if (c === "*" || c === "(" || c === ")" || c === "]" || c === "{" || c === "}") {
          errors.push({
            start: i, end: i + 1,
            kind: "stray-char",
            message: `Stray \`${c}\``,
          });
        }
        i++;
      }

      return { errors, warnings };
    }

    // Scan a slice of `text` under prose rules and push stray-char /
    // stray-prefix / stray-at / stray-amp errors into `errors`. Used for
    // `[verbatim]` slots (which follow the same rules as free prose).
    _flagProseSlice(text, from, to, errors) {
      let i = from;
      while (i < to) {
        const c = text[i];
        if (c === "#" || c === "$") {
          const m = /^[#$][\w-]*/.exec(text.slice(i, to));
          const len = m[0].length;
          errors.push({ start: i, end: i + len, kind: "stray-char", message: `Stray \`${m[0]}\`` });
          i += len;
          continue;
        }
        if (c === "!") {
          const prev = i > from ? text[i - 1] : "";
          const next = text[i + 1] || "";
          if (/\w/.test(prev) || !/\w/.test(next)) { i++; continue; }
          const m = /^!\w[\w-]*/.exec(text.slice(i, to));
          const len = m ? m[0].length : 1;
          errors.push({ start: i, end: i + len, kind: "stray-prefix", message: `Stray \`${text.slice(i, i + len)}\`` });
          i += len;
          continue;
        }
        if (c === "@") {
          errors.push({ start: i, end: i + 1, kind: "stray-at", message: "Stray `@`" });
        } else if (c === "&") {
          errors.push({ start: i, end: i + 1, kind: "stray-amp", message: "Stray `&`" });
        } else if (c === "*" || c === "(" || c === ")" || c === "[" || c === "]" || c === "{" || c === "}") {
          errors.push({ start: i, end: i + 1, kind: "stray-char", message: `Stray \`${c}\`` });
        }
        i++;
      }
    }

    _buildOrphanChip(rawToken, srcStart, srcEnd) {
      const role = rawToken.endsWith("-start") ? "start" : "end";
      const missing = role === "start" ? "-end" : "-start";
      return `<span class="rsml-orphan"`
           + ` data-src="${srcStart}:${srcEnd}"`
           + ` data-bs-toggle="tooltip" data-bs-title="orphan ${role}: no matching ${missing}">`
           + `${this._esc(rawToken)}</span>`;
    }

    // Returns the index of the balanced closing bracket, or -1 if unbalanced.
    _matchBracket(text, start, open, close) {
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

    _prefixToTagName(prefix) {
      switch (prefix) {
        case "!": return "code-mix";
        case "#": return "entity";
        case "$": return "accent";
        case "$$": return "dialect";
        case "!!": return "domain";
        case "[": return "mispronunciation";
      }
      return "span";
    }

    _buildTaggedHTML(prefix, type, verbatim, normalized, srcStart, srcEnd) {
      const tag = this._prefixToTagName(prefix);
      const vInner = this._esc(verbatim);
      // An empty normalized slot mirrors the verbatim so the render doesn't
      // go blank when the user hasn't typed a normalized form yet.
      const nInner = this._esc(normalized.trim() === "" ? verbatim : normalized);

      let title = "";
      let dataAttrs = "";
      switch (prefix) {
        case "!": {
          title = `code-mix: ${type || "unspecified"}`;
          dataAttrs = ` data-lang="${this._esc(type)}"`;
          break;
        }
        case "#": {
          const t = type.trim();
          const label = t
            ? (this.opts.entities[t] || "Unknown Entity")
            : "Entity";
          title = `entity: ${label}`;
          dataAttrs = ` data-type="${this._esc(t)}"`;
          break;
        }
        case "$": {
          title = `accent: ${type || "unspecified"}`;
          dataAttrs = ` data-accent="${this._esc(type)}"`;
          break;
        }
        case "$$": {
          const t = type.trim();
          const label = t
            ? (this.opts.dialects[t] || "Unknown Dialect")
            : "Dialect";
          title = `dialect: ${label}`;
          dataAttrs = ` data-dialect="${this._esc(t)}"`;
          break;
        }
        case "!!": {
          const t = type.trim();
          const label = t
            ? (this.opts.domains[t] || "Unknown Domain")
            : "Domain";
          title = `domain: ${label}`;
          dataAttrs = ` data-domain="${this._esc(t)}"`;
          break;
        }
        case "[": {
          title = "mispronunciation";
          break;
        }
      }

      const srcAttr = srcStart != null ? ` data-src="${srcStart}:${srcEnd}"` : "";
      const body = `<span class="rsml-verbatim">${vInner}</span><span class="rsml-normalized">${nInner}</span>`;
      return `<${tag}${dataAttrs}${srcAttr} data-bs-toggle="tooltip" data-bs-title="${this._esc(title)}">${body}</${tag}>`;
    }

    // Isolated @tag or the opening/closing of a span pair.
    _buildAtToken(name, srcStart, srcEnd) {
      if (name.endsWith("-start")) {
        return this._openSpan(name.slice(0, -6), srcStart, srcEnd);
      }
      if (name.endsWith("-end")) {
        return `</span>`;
      }
      return this._buildNoiseTag(name, srcStart, srcEnd);
    }

    _openSpan(base, srcStart, srcEnd) {
      const category = this._spanCategory.get(base) || "other";
      const title = `${category}: ${base}`;
      const srcAttr = srcStart != null ? ` data-src="${srcStart}:${srcEnd}"` : "";
      // A repair span with a detected reparandum/repair split (see
      // _findRepairSplits) gets an extra marker class — excluded from the
      // wholesale "hide disfluencies" rule so only its reparandum/separator
      // children hide, not the corrected text — and immediately opens the
      // reparandum wrapper; _transformRSML's boundary checks close it and
      // open the separator/repair-fix wrappers as the loop reaches them.
      const hasSplit = base === "repair" && this._repairSplits && this._repairSplits.openExtra.has(srcEnd);
      const extraClass = hasSplit ? " rsml-repair-has-split" : "";
      const openTag = `<span class="rsml-span rsml-span-${this._esc(base)} rsml-${this._esc(category)}${extraClass}"`
           + ` data-span="${this._esc(base)}" data-category="${this._esc(category)}"${srcAttr}`
           + ` data-bs-toggle="tooltip" data-bs-title="${this._esc(title)}">`;
      return hasSplit ? openTag + `<span class="rsml-reparandum">` : openTag;
    }

    _buildNoiseTag(type, srcStart, srcEnd) {
      const category = this._atCategory.get(type) || "unknown";
      const t = this._esc(type);
      const srcAttr = srcStart != null ? ` data-src="${srcStart}:${srcEnd}"` : "";
      return `<span class="rsml-at rsml-at-${category}"`
           + ` data-token="@${t}" data-category="${category}"${srcAttr}`
           + ` data-bs-toggle="tooltip" data-bs-title="${category}: ${t}">@${t}</span>`;
    }

    // Walk up from the dblclick target to the nearest [data-src] element,
    // then focus the editor and select that source range.
    _jumpToSource(e) {
      let el = e.target;
      while (el && el !== this.output) {
        if (el.nodeType === 1 && el.hasAttribute("data-src")) break;
        el = el.parentNode;
      }
      if (!el || el === this.output || !el.hasAttribute || !el.hasAttribute("data-src")) return;
      const [aStr, bStr] = el.getAttribute("data-src").split(":");
      const start = parseInt(aStr, 10);
      const end = parseInt(bStr, 10);
      if (isNaN(start) || isNaN(end)) return;
      if (this.view && this._cm && this._cm.view) {
        this.view.focus();
        this.view.dispatch({
          selection: { anchor: start, head: end },
          effects: this._cm.view.EditorView.scrollIntoView(start, { y: "center" }),
        });
      } else if (this.textarea) {
        this.textarea.focus();
        this.textarea.setSelectionRange(start, end);
      }
    }

    // ---------- Internal: Misc ----------
    // Human-readable next-step for each issue kind — shown at the bottom
    // of the hover tooltip.
    _actionForKind(kind) {
      switch (kind) {
        case "orphan":            return "Add the matching -start or -end, or remove this tag.";
        case "unclosed-bracket":  return "Close with a matching ].";
        case "unclosed-paren":    return "Close with a matching ).";
        case "missing-paren":     return "Add (normalized) after the ].";
        case "missing-bracket":   return "A prefix must be followed by [verbatim](normalized), not (…).";
        case "stray-bracket":     return "A prefix must be followed by [verbatim](normalized).";
        case "stray-char":        return "Move this into a (normalized) slot, or remove it.";
        case "stray-at":          return "Use a valid @tag, or move the @ into a (normalized) slot.";
        case "stray-amp":         return "Use &sN-start / &sN-end, or move the & into a (normalized) slot.";
        case "stray-prefix":      return "! may only trail a word, stand alone, or repeat — not prefix another word.";
        case "malformed-speaker": return "Speaker tag must be &sN-start or &sN-end.";
        case "nested-tag":        return "Nested tags aren't allowed. Split the tag apart or move the inner tag out.";
        case "unknown-entity":    return "Not in configured entity types. Call add(\"entities\", type, label) or use a known type.";
        case "unknown-language":  return "Not in configured languages. Call add(\"languages\", code, label) or use a known code.";
        case "unknown-dialect":   return "Not in configured dialects. Call add(\"dialects\", code, label) or use a known code.";
        case "unknown-domain":    return "Not in configured domains. Call add(\"domains\", code, label) or use a known code.";
        case "unknown-tag":       return "Not in configured @-tag lists. Call add(\"hesitations\" | \"isolatedParalinguistics\" | \"isolatedOther\", name) or use a known name.";
        default:                  return "";
      }
    }

    _esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }

    /* =========================
       CodeMirror 6 integration
       -------------------------
       Loaded lazily via dynamic ESM imports. When it mounts, the plain
       textarea is hidden and CM becomes the editing surface — a single
       DOM layer, no overlay, so text and highlights cannot drift.
    ========================= */
    async _bootCM() {
      if (this._cmMounted) return;
      // Skip if the caller opted out.
      if (this.opts.disableCodeMirror) return;

      const V = "6";
      const [stateMod, viewMod, commandsMod, autocompleteMod, languageMod, searchMod] =
        await Promise.all([
          import(`https://esm.sh/@codemirror/state@${V}`),
          import(`https://esm.sh/@codemirror/view@${V}`),
          import(`https://esm.sh/@codemirror/commands@${V}`),
          import(`https://esm.sh/@codemirror/autocomplete@${V}`),
          import(`https://esm.sh/@codemirror/language@${V}`),
          import(`https://esm.sh/@codemirror/search@${V}`),
        ]);

      this._cm = {
        state: stateMod, view: viewMod, commands: commandsMod,
        autocomplete: autocompleteMod, language: languageMod, search: searchMod,
      };
      this._mountCM();
      this._cmMounted = true;
    }

    _mountCM() {
      const { state, view, commands, autocomplete, language } = this._cm;
      const self = this;
      const ta = this.textarea;

      // Dispatched (with no doc change) by _refreshAfterConfigChange() so a
      // running editor picks up add()/remove() calls without a keystroke.
      this._cmRefreshEffect = state.StateEffect.define();

      // ----- Highlight decorations (StateField) -----
      const buildDeco = (doc) => {
        const text = doc.toString();
        const marks = [];
        self._walkTokens(text, (from, to, cls) => {
          marks.push(view.Decoration.mark({ class: cls }).range(from, to));
        });
        const { errors, warnings } = self._findIssues(text);
        for (const e of errors) {
          marks.push(view.Decoration.mark({
            class: "tok-error",
            attributes: { title: e.message.replace(/`/g, "") },
          }).range(e.start, e.end));
        }
        for (const w of warnings) {
          marks.push(view.Decoration.mark({
            class: "tok-warning",
            attributes: { title: w.message.replace(/`/g, "") },
          }).range(w.start, w.end));
        }
        marks.sort((a, b) => a.from - b.from || a.startSide - b.startSide);
        return view.Decoration.set(marks);
      };
      const decoField = state.StateField.define({
        create: (st) => buildDeco(st.doc),
        update: (deco, tr) =>
          (tr.docChanged || tr.effects.some((e) => e.is(self._cmRefreshEffect)))
            ? buildDeco(tr.state.doc)
            : deco.map(tr.changes),
        provide: (f) => view.EditorView.decorations.from(f),
      });

      // ----- Match highlight (ViewPlugin, tracks caret) -----
      const matchPlugin = view.ViewPlugin.fromClass(
        class {
          constructor(v) { this.decorations = self._computeCMMatch(v); }
          update(u) {
            if (u.docChanged || u.selectionSet) {
              this.decorations = self._computeCMMatch(u.view);
            }
          }
        },
        { decorations: (v) => v.decorations }
      );

      // ----- Hover-tooltip for errors / warnings -----
      const hoverTip = view.hoverTooltip((v, pos) => {
        const { errors, warnings } = self._findIssues(v.state.doc.toString());
        const all = [
          ...errors.map((e) => ({ ...e, severity: "error" })),
          ...warnings.map((w) => ({ ...w, severity: "warning" })),
        ];
        // Prefer the tightest range containing the caret so an outer
        // nested-tag range doesn't overshadow the inner stray char.
        const hits = all.filter((x) => pos >= x.start && pos <= x.end);
        if (!hits.length) return null;
        hits.sort((a, b) => (a.end - a.start) - (b.end - b.start));
        const hit = hits[0];
        return {
          pos: hit.start,
          end: hit.end,
          above: true,
          create() {
            const dom = document.createElement("div");
            dom.className = `rsml-hover-tip rsml-hover-tip-${hit.severity}`;
            dom.innerHTML =
              `<span class="rsml-hover-badge">${hit.severity === "error" ? "ERROR" : "WARNING"}</span>`
              + `<span class="rsml-hover-kind">${self._esc(hit.kind)}</span>`
              + `<div class="rsml-hover-msg">${self._esc(hit.message.replace(/`/g, ""))}</div>`
              + `<div class="rsml-hover-action">${self._esc(self._actionForKind(hit.kind))}</div>`;
            return { dom };
          },
        };
      }, { hideOnChange: true });

      // ----- Autocomplete source -----
      const rsmlComplete = autocomplete.autocompletion({
        override: [(ctx) => self._cmComplete(ctx)],
        activateOnTyping: true,
        icons: false,
      });

      // ----- Wrap-selection / bracket-scaffold handler -----
      // When the user types `!`, `#`, `$`, or `[` while text is selected,
      // wrap that selection as the verbatim slot of the corresponding tag
      // and drop the caret in the right place for the next step.
      //
      // When the user types `[` with no selection AND the immediately
      // preceding characters look like a fresh prefix (`!`, `#`, `$`,
      // optionally followed by a type name — must be at line start or
      // after whitespace so plain `[` prose isn't hijacked), the handler
      // auto-scaffolds `[]()` and drops the caret between the brackets.
      // This is what makes typing `![` followed by anything (or just
      // pressing Enter) render as a code-mix without needing to pick from
      // the popup.
      const wrapPrefixes = new Set(["!", "#", "$", "["]);
      const wrapHandler = view.EditorView.inputHandler.of((v, from, to, insert) => {
        if (!wrapPrefixes.has(insert)) return false;

        // Case 1: selection is active — wrap it as verbatim.
        if (from !== to) {
          const selected = v.state.sliceDoc(from, to);
          let scaffold, caret;
          if (insert === "[") {
            scaffold = `[${selected}]()`;
            caret = from + 1 + selected.length + 2; // inside `(`
          } else {
            scaffold = `${insert}[${selected}]()`;
            caret = from + 1; // right after the prefix char
          }
          v.dispatch({
            changes: { from, to, insert: scaffold },
            selection: { anchor: caret },
            userEvent: "input.type",
          });
          if (insert !== "[") {
            setTimeout(() => autocomplete.startCompletion(v), 0);
          }
          return true;
        }

        // Case 2: typing `[` with no selection — auto-close the whole
        // scaffold as `[]()`. This covers three flows uniformly:
        //   - Bare mispronunciation:  `[` → `[]()`
        //   - After a bare prefix:    `!` `[` → `![]()`
        //   - After a typed prefix:   `#PER` `[` → `#PER[]()`
        // In every case the caret lands between `[` and `]` ready for
        // verbatim input.
        if (insert === "[") {
          const doc = v.state.doc;
          // Don't re-scaffold if a `[]()` shell already sits at the caret.
          const after = doc.sliceString(from, Math.min(from + 3, doc.length));
          if (after.startsWith("[")) return false;
          v.dispatch({
            changes: { from, to, insert: "[]()" },
            selection: { anchor: from + 1 },
            userEvent: "input.type",
          });
          return true;
        }

        return false;
      });

      // ----- Theme: match the textarea's Bootstrap form-control look -----
      const cs = getComputedStyle(ta);
      const editorFont = this.opts.editorFontFamily || cs.fontFamily;
      const themeExt = view.EditorView.theme({
        "&": {
          background: cs.backgroundColor || "#fff",
          border: cs.borderTopStyle && cs.borderTopWidth !== "0px"
            ? `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`
            : "1px solid #ced4da",
          borderRadius: cs.borderTopLeftRadius || "0.375rem",
          fontFamily: editorFont,
          fontSize: cs.fontSize,
          color: cs.color || "#212529",
          height: cs.height || "250px",
          resize: "vertical",
          overflow: "hidden",
          minHeight: "80px",
        },
        "&.cm-focused": {
          outline: "none",
          borderColor: "#86b7fe",
          boxShadow: "0 0 0 0.25rem rgba(13,110,253,.25)",
        },
        ".cm-scroller": { fontFamily: "inherit", lineHeight: cs.lineHeight },
        ".cm-content": { padding: `${cs.paddingTop} ${cs.paddingRight}` },
        ".cm-line": { padding: 0 },

        // Autocomplete popup — mirror the pre-CM6 `.rsml-suggestions` look.
        ".cm-tooltip.cm-tooltip-autocomplete": {
          background: "#fff",
          border: "1px solid #ccc",
          borderRadius: "6px",
          boxShadow: "0 6px 14px rgba(0,0,0,.15)",
          overflow: "hidden",
          fontFamily: `"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`,
          fontSize: "0.9rem",
          color: "#222",
          animation: "rsmlFadeIn .12s ease-in",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul": {
          minWidth: "160px",
          maxWidth: "320px",
          maxHeight: "200px",
          overflowY: "auto",
          padding: "4px 0",
          margin: 0,
          fontFamily: "inherit",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li": {
          padding: "5px 10px",
          cursor: "pointer",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: "1.35",
          borderRadius: 0,
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li:hover": {
          background: "#0d6efd",
          color: "#fff",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected]": {
          background: "#0d6efd",
          color: "#fff",
        },
        ".cm-completionLabel": {
          fontFamily: "inherit",
        },
        ".cm-completionDetail": {
          fontStyle: "normal",
          color: "#777",
          fontSize: "0.85em",
          marginLeft: "8px",
          fontFamily: "inherit",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul > li[aria-selected] .cm-completionDetail, .cm-tooltip.cm-tooltip-autocomplete > ul > li:hover .cm-completionDetail": {
          color: "rgba(255,255,255,0.85)",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar": {
          width: "6px",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb": {
          background: "#bbb",
          borderRadius: "3px",
        },
        ".cm-tooltip.cm-tooltip-autocomplete > ul::-webkit-scrollbar-thumb:hover": {
          background: "#999",
        },
      });

      const startState = state.EditorState.create({
        doc: ta.value || "",
        extensions: [
          view.drawSelection(),
          view.EditorView.lineWrapping,
          commands.history(),
          rsmlComplete,
          wrapHandler,
          view.keymap.of([
            ...commands.defaultKeymap,
            ...commands.historyKeymap,
            ...autocomplete.completionKeymap,
            { key: "Mod-z", run: commands.undo, preventDefault: true },
            { key: "Mod-Shift-z", run: commands.redo, preventDefault: true },
            { key: "Mod-y", run: commands.redo, preventDefault: true },
          ]),
          decoField,
          matchPlugin,
          hoverTip,
          themeExt,
          view.EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            ta.value = update.state.doc.toString();
            self._render();
            self._updateStatus();
          }),
        ],
      });

      // Hide the original textarea; mount CM immediately after it.
      ta.style.display = "none";
      this.view = new view.EditorView({
        state: startState,
        parent: ta.parentNode,
      });
      // Insert CM's DOM right after the (now hidden) textarea so layout
      // slots into the same place.
      ta.parentNode.insertBefore(this.view.dom, ta.nextSibling);

      // Status bar directly under the editor — shows the current error count.
      this._statusEl = document.createElement("div");
      this._statusEl.className = "rsml-editor-status";
      ta.parentNode.insertBefore(this._statusEl, this.view.dom.nextSibling);
      this._updateStatus();
    }

    // Recompute error + warning counts and paint the status bar.
    _updateStatus() {
      if (!this._statusEl) return;
      const { errors, warnings } = this._findIssues(this.textarea.value || "");
      if (errors.length === 0 && warnings.length === 0) {
        this._statusEl.textContent = "";
        this._statusEl.style.display = "none";
        return;
      }
      this._statusEl.style.display = "";
      const parts = [];
      if (errors.length) {
        parts.push(
          `<span class="rsml-error-count">✕ ${errors.length} error${errors.length === 1 ? "" : "s"}</span>`
        );
      }
      if (warnings.length) {
        parts.push(
          `<span class="rsml-warning-count">⚠ ${warnings.length} warning${warnings.length === 1 ? "" : "s"}</span>`
        );
      }
      this._statusEl.innerHTML = parts.join(`<span class="rsml-status-sep">·</span>`);
    }

    // Shared token walker: emits (from, to, class) tuples for every syntax
    // fragment. Used by CM decorations; same rules as the parser.
    _walkTokens(text, add) {
      let i = 0;
      const n = text.length;
      const orphans = this._findOrphans(text);
      while (i < n) {
        const pm = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const prefix = pm[1];
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              const cat = prefix === "$$" ? "dialect"
                        : prefix === "!!" ? "domain"
                        : prefix === "!"  ? "code-mix"
                        : prefix === "#"  ? "entity" : "accent";
              const cls = `tok-${cat}`;
              add(i, openBracket + 1, cls);
              add(closeBracket, closeBracket + 2, cls);
              add(closeParen, closeParen + 1, cls);
              i = closeParen + 1;
              continue;
            }
          }
        }
        if (text[i] === "[") {
          const closeBracket = this._matchBracket(text, i, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              add(i, i + 1, "tok-mispronunciation");
              add(closeBracket, closeBracket + 2, "tok-mispronunciation");
              add(closeParen, closeParen + 1, "tok-mispronunciation");
              i = closeParen + 1;
              continue;
            }
          }
        }
        if (text[i] === "@") {
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (at) {
            const name = at[1];
            const isStart = name.endsWith("-start");
            const isEnd = !isStart && name.endsWith("-end");
            let cls;
            if (isStart || isEnd) {
              const base = name.slice(0, isStart ? -6 : -4);
              const cat = this._spanCategory.get(base) || "unknown";
              cls = `tok-span-${cat}${orphans.has(i) ? " tok-orphan" : ""}`;
            } else {
              const cat = this._atCategory.get(name) || "unknown";
              cls = `tok-at-${cat}`;
            }
            add(i, i + at[0].length, cls);
            i += at[0].length;
            continue;
          }
        }
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            const cls = `tok-span-speaker${orphans.has(i) ? " tok-orphan" : ""}`;
            add(i, i + sp[0].length, cls);
            i += sp[0].length;
            continue;
          }
        }
        i++;
      }
    }

    // Match highlight — find the group containing the caret and mark all
    // its fragments with `.tok-match`.
    _computeCMMatch(view) {
      const { state, view: viewMod } = this._cm;
      const doc = view.state.doc;
      const text = doc.toString();
      const pos = view.state.selection.main.head;

      // Rebuild the group table from the current doc.
      const groups = [];
      const startCount = new Map();
      const endCount = new Map();
      let bracketCounter = 0;
      let i = 0;
      const n = text.length;
      const pushGroup = (ranges, key) => groups.push({ ranges, key });
      while (i < n) {
        const pm = /^(\$\$|!!|[!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              pushGroup(
                [[i, openBracket + 1], [closeBracket, closeBracket + 2], [closeParen, closeParen + 1]],
                `b${bracketCounter++}`
              );
              i = closeParen + 1;
              continue;
            }
          }
        }
        if (text[i] === "[") {
          const closeBracket = this._matchBracket(text, i, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              pushGroup(
                [[i, i + 1], [closeBracket, closeBracket + 2], [closeParen, closeParen + 1]],
                `b${bracketCounter++}`
              );
              i = closeParen + 1;
              continue;
            }
          }
        }
        if (text[i] === "@") {
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (at) {
            const name = at[1];
            const isStart = name.endsWith("-start");
            const isEnd = !isStart && name.endsWith("-end");
            if (isStart || isEnd) {
              const base = name.slice(0, isStart ? -6 : -4);
              const map = isStart ? startCount : endCount;
              const idx = map.get(base) || 0;
              map.set(base, idx + 1);
              pushGroup([[i, i + at[0].length]], `p:${base}:${idx}`);
            } else {
              // Isolated @-token — self-contained group so it still highlights.
              pushGroup([[i, i + at[0].length]], `iso:${i}`);
            }
            i += at[0].length;
            continue;
          }
        }
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            const base = sp[1];
            const map = sp[2] === "start" ? startCount : endCount;
            const idx = map.get(base) || 0;
            map.set(base, idx + 1);
            pushGroup([[i, i + sp[0].length]], `p:${base}:${idx}`);
            i += sp[0].length;
            continue;
          }
        }
        i++;
      }

      // Collapse groups with the same key (start/end pairs) into one.
      const byKey = new Map();
      for (const g of groups) {
        if (!byKey.has(g.key)) byKey.set(g.key, []);
        byKey.get(g.key).push(...g.ranges);
      }

      // Find the group whose any range contains the caret.
      let hit = null;
      for (const [key, ranges] of byKey) {
        if (ranges.some(([a, b]) => pos >= a && pos <= b)) {
          hit = ranges;
          break;
        }
      }
      const marks = [];
      if (hit) {
        for (const [a, b] of hit) {
          marks.push(viewMod.Decoration.mark({ class: "tok-match" }).range(a, b));
        }
      }
      marks.sort((a, b) => a.from - b.from || a.startSide - b.startSide);
      return viewMod.Decoration.set(marks);
    }

    // CM completion source for @ # ! $ & prefixes, plus the doubled $$
    // (dialect) and !! (domain) prefixes.
    _cmComplete(ctx) {
      const trigger = ctx.matchBefore(/\$\$[\w-]*|!![\w-]*|[@#!$&][\w-]*/);
      if (!trigger) return null;
      const prefix = trigger.text.startsWith("$$") ? "$$"
                   : trigger.text.startsWith("!!") ? "!!"
                   : trigger.text[0];
      let options = [];

      // Scaffold-aware apply for the bracket-form prefixes (!, #, $).
      // If a `[verbatim]()` (or `[verbatim](normalized)`) already sits
      // immediately after the trigger — the shape produced when the user
      // wrapped a selection with the prefix — insert only the type name
      // and land the caret at the end of the verbatim slot.
      // Otherwise, insert the full scaffold and drop the caret inside `[`.
      const bracketApply = (typeSegment) =>
        (view, completion, from, to) => {
          const doc = view.state.doc;
          const after = doc.sliceString(to, Math.min(to + 500, doc.length));
          const scaf = /^\[([^\]]*)\](\([^)]*\))?/.exec(after);
          if (scaf) {
            // Preserve existing wrapped selection.
            const verbatim = scaf[1];
            view.dispatch({
              changes: { from, to, insert: typeSegment },
              // caret just before the `]` (end of verbatim)
              selection: { anchor: from + typeSegment.length + 1 + verbatim.length },
              userEvent: "input.complete",
            });
          } else {
            const insert = `${typeSegment}[]()`;
            view.dispatch({
              changes: { from, to, insert },
              // caret between `[` and `]`
              selection: { anchor: from + typeSegment.length + 1 },
              userEvent: "input.complete",
            });
          }
        };

      const simpleApply = (insert, cursorRel) =>
        (view, completion, from, to) => {
          view.dispatch({
            changes: { from, to, insert },
            selection: { anchor: from + cursorRel },
          });
        };

      switch (prefix) {
        case "@":
          options = this.opts.tags.map((t) => ({
            label: t,
            apply: simpleApply(t + " ", t.length + 1),
          }));
          break;
        case "#":
          options = [
            {
              label: "# (unspecified type)",
              detail: "entity — type left blank",
              apply: bracketApply(`#`),
              boost: 1,
            },
            ...Object.keys(this.opts.entities).map((k) => ({
              label: `#${k}`,
              detail: this.opts.entities[k],
              apply: bracketApply(`#${k}`),
            })),
          ];
          break;
        case "!":
          options = [
            {
              label: "! (unspecified language)",
              detail: "code-mix — language left blank",
              apply: bracketApply(`!`),
              boost: 1,
            },
            ...Object.keys(this.opts.languages).map((c) => ({
              label: `!${c}`,
              detail: this.opts.languages[c],
              apply: bracketApply(`!${c}`),
            })),
          ];
          break;
        case "$":
          options = [{
            label: "$ (unspecified accent)",
            detail: "accent — name is free-form or blank",
            apply: bracketApply(`$`),
            boost: 1,
          }];
          break;
        case "$$":
          options = [
            {
              label: "$$ (unspecified dialect)",
              detail: "dialect — code left blank",
              apply: bracketApply(`$$`),
              boost: 1,
            },
            ...Object.keys(this.opts.dialects).map((k) => ({
              label: `$$${k}`,
              detail: this.opts.dialects[k],
              apply: bracketApply(`$$${k}`),
            })),
          ];
          break;
        case "!!":
          options = [
            {
              label: "!! (unspecified domain)",
              detail: "domain — code left blank",
              apply: bracketApply(`!!`),
              boost: 1,
            },
            ...Object.keys(this.opts.domains).map((k) => ({
              label: `!!${k}`,
              detail: this.opts.domains[k],
              apply: bracketApply(`!!${k}`),
            })),
          ];
          break;
        case "&":
          options = this._buildSpeakerSuggestions("").map((s) => {
            const clean = s.replace(/ .*/, "");
            return {
              label: `&${clean}`,
              detail: s.includes("(") ? "new speaker" : null,
              apply: simpleApply(`&${clean} `, clean.length + 2),
            };
          });
          break;
      }
      return { from: trigger.from, to: trigger.to, options };
    }
  }

  // Named + default export (for ESM interop via bundlers)
  RSMLAnnotator.default = RSMLAnnotator;
  return RSMLAnnotator;
})