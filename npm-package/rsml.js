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
.rsml-suggestions {
  position: absolute; /* <--- CHANGED FROM fixed TO absolute */
  z-index: 2147483000;
  background: #fff;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-shadow: 0 6px 14px rgba(0,0,0,.15);
  min-width: 160px;
  max-width: 280px;
  max-height: 200px;
  overflow-y: auto;
  display: none;
  font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.9rem;
  color: #222;
  padding: 4px 0;
  animation: rsmlFadeIn .12s ease-in;
  pointer-events: auto;
}
.rsml-suggestions::-webkit-scrollbar { width: 6px; }
.rsml-suggestions::-webkit-scrollbar-thumb { background: #bbb; border-radius: 3px; }
.rsml-suggestions::-webkit-scrollbar-thumb:hover { background: #999; }
.rsml-suggestion-item { padding: 5px 10px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.rsml-suggestion-item:hover, .rsml-suggestion-item.active { background:#0d6efd; color:#fff; }

@keyframes rsmlFadeIn { from { opacity:0; transform: translateY(-3px);} to { opacity:1; transform:none;} }

code-mix, accent, mispronunciation, entity,
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
/* Span-pair categories. */
.rsml-disfluency { background-color:#ffe0b3; border:1px solid #ffb84d; }
.rsml-paralinguistic { background-color:#e6ffb3; border:1px solid #b3d977; }
.rsml-prosody { background-color:#ffd6f0; border:1px solid #f095c8; }
/* Isolated @-token categories. */
.rsml-at-hesitation      { background-color:#fff0b3; border:1px solid #e5c96b; color:#5a4a10; }
.rsml-at-paralinguistic  { background-color:#e6ffb3; border:1px solid #b3d977; color:#3a5a10; }
.rsml-at-other           { background-color:#e0e6f0; border:1px solid #9aacc9; color:#324056; font-style:italic; }
.rsml-at-unknown         { background-color:#888; color:#fff; border:1px solid #666; }

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
`;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Get pixel coords for caret in a textarea
  function getCaretCoordinates(el, position) {
    const div = document.createElement("div");
    const style = getComputedStyle(el);
    for (const prop of style) div.style[prop] = style[prop];

    div.style.position = "absolute";
    div.style.visibility = "hidden";
    div.style.whiteSpace = "pre-wrap";
    div.style.wordWrap = "break-word";
    div.style.overflow = "auto";
    div.style.height = el.offsetHeight + "px";
    div.style.width = el.offsetWidth + "px";

    const span = document.createElement("span");
    const text = el.value.substring(0, position);
    const remainder = el.value.substring(position) || ".";
    div.textContent = text;
    span.textContent = remainder;
    div.appendChild(span);
    document.body.appendChild(div);

    const top = span.offsetTop - el.scrollTop;
    const left = span.offsetLeft - el.scrollLeft;
    document.body.removeChild(div);

    return { top, left };
  }

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
    "@silence", "@unintelligible", "@stutter-block",
  ];

  // Span pairs written as @<name>-start ... @<name>-end.
  const DEFAULT_DISFLUENCY_SPANS = [
    "filler", "repetition", "broken-word", "repair", "false-start", "prolongation",
  ];

  const DEFAULT_PARALINGUISTIC_SPANS = [
    "crying", "yelling", "laughing", "singing", "humming", "whistling", "whispering",
  ];

  const DEFAULT_PROSODY_SPANS = [
    "emphasis", "falling-pitch", "raising-pitch",
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

  // ---------- Core Class ----------
  class RSMLAnnotator {
    /**
     * @param {Object} opts
     * @param {HTMLTextAreaElement|string} opts.textarea - element or selector
     * @param {HTMLElement|string} opts.output - element or selector
     * @param {Array<string>} [opts.tags]
     * @param {Object} [opts.entities]
     * @param {Object} [opts.languages]
     * @param {boolean} [opts.enableUndoRedo=true]
     * @param {boolean} [opts.demoText=false]
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
          enableUndoRedo: true,
          demoText: false,
        },
        opts || {}
      );

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

      // --- Suggestion state ---
      this.suggestionsBox = document.createElement("div");
      this.suggestionsBox.className = "rsml-suggestions";
      document.body.appendChild(this.suggestionsBox);

      this.currentTrigger = "";
      this.selectedIndex = -1;
      this.currentSuggestions = [];

      // --- Undo/Redo state ---
      this.isApplyingHistory = false;
      this.history = [this._snapshot()];
      this.hIndex = 0;

      // --- Bindings ---
      this._onInput = this._onInput.bind(this);
      this._onKeydown = this._onKeydown.bind(this);
      this._onScrollOrResize = this._onScrollOrResize.bind(this);

      // --- Wire up ---
      this.textarea.addEventListener("input", this._onInput);
      this.textarea.addEventListener("keydown", this._onKeydown);
      window.addEventListener("scroll", this._onScrollOrResize, true);
      window.addEventListener("resize", this._onScrollOrResize);

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
      this.textarea.removeEventListener("keydown", this._onKeydown);
      window.removeEventListener("scroll", this._onScrollOrResize, true);
      window.removeEventListener("resize", this._onScrollOrResize);
      if (this.suggestionsBox && this.suggestionsBox.parentNode) {
        this.suggestionsBox.parentNode.removeChild(this.suggestionsBox);
      }
      if (this._hlResizeObserver) {
        this._hlResizeObserver.disconnect();
        this._hlResizeObserver = null;
      }
      if (this._onSelectionChange) {
        document.removeEventListener("selectionchange", this._onSelectionChange);
        this._onSelectionChange = null;
      }
      if (this._onOutputDblclick && this.output) {
        this.output.removeEventListener("dblclick", this._onOutputDblclick);
        this._onOutputDblclick = null;
      }
    }
    setValue(str) {
      this.textarea.value = str || "";
      this._recordState();
      this._render();
    }
    getValue() {
      return this.textarea.value;
    }
    undo() {
      if (!this.opts.enableUndoRedo) return;
      if (this.hIndex > 0) {
        this.isApplyingHistory = true;
        this.hIndex--;
        this._applySnapshot(this.history[this.hIndex]);
        this.isApplyingHistory = false;
        this._render();
      }
    }
    redo() {
      if (!this.opts.enableUndoRedo) return;
      if (this.hIndex < this.history.length - 1) {
        this.isApplyingHistory = true;
        this.hIndex++;
        this._applySnapshot(this.history[this.hIndex]);
        this.isApplyingHistory = false;
        this._render();
      }
    }

    // ---------- Internal: Events ----------
    _onInput() {
      this._render();
      if (this.opts.enableUndoRedo) this._recordState();
      this._handleTriggers();
    }
    _onKeydown(e) {
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      const selectedText = this.textarea.value.slice(start, end);

      // Insert entity scaffold with '#'  -> #[verbatim](normalized)
      if (e.key === "#") {
        e.preventDefault();
        const insert = selectedText ? `#[${selectedText}]()` : `#[]()`;
        this.textarea.setRangeText(insert, start, end, "end");
        this.textarea.setSelectionRange(start + 1, start + 1);
        this.currentTrigger = "#";
        this._showSuggestions(
          Object.keys(this.opts.entities).map(
            (k) => `${k} (${this.opts.entities[k]})`
          )
        );
        return;
      }

      // Insert code-mix scaffold with '!'  -> !lang[verbatim](normalized)
      if (e.key === "!") {
        e.preventDefault();
        const insert = selectedText ? `![${selectedText}]()` : `![]()`;
        this.textarea.setRangeText(insert, start, end, "end");
        this.textarea.setSelectionRange(start + 1, start + 1);
        this.currentTrigger = "!";
        this._showSuggestions(
          Object.keys(this.opts.languages).map(
            (c) => `${c} (${this.opts.languages[c]})`
          )
        );
        return;
      }

      // Insert accent scaffold with '$'  -> $accent-name[verbatim](normalized)
      if (e.key === "$") {
        e.preventDefault();
        const insert = selectedText ? `$[${selectedText}]()` : `$[]()`;
        this.textarea.setRangeText(insert, start, end, "end");
        this.textarea.setSelectionRange(start + 1, start + 1);
        this.currentTrigger = "$";
        return;
      }

      // Speaker span with '&'  -> shows sN-start / sN-end suggestions.
      if (e.key === "&") {
        e.preventDefault();
        this.textarea.setRangeText("&", start, end, "end");
        this.textarea.setSelectionRange(start + 1, start + 1);
        this.currentTrigger = "&";
        this._showSuggestions(this._buildSpeakerSuggestions(""));
        return;
      }

      // Suggestion navigation
      if (this.suggestionsBox.style.display !== "none") {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          this.selectedIndex =
            (this.selectedIndex + 1) % this.currentSuggestions.length;
          this._updateSelection();
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          this.selectedIndex =
            (this.selectedIndex - 1 + this.currentSuggestions.length) %
            this.currentSuggestions.length;
          this._updateSelection();
          return;
        }
        if (
          e.key === "Enter" ||
          (e.key === "Tab" && this.selectedIndex >= 0)
        ) {
          e.preventDefault();
          this._insertTag(this.currentSuggestions[this.selectedIndex]);
          return;
        }
        if (e.key === "Escape") {
          this._hideSuggestions();
          return;
        }
      }

      // Bracket wrapping shortcuts
      //   `[` -> [selection](  )   (bare mispronunciation scaffold)
      //   `(` -> (selection)
      if (["[", "("].includes(e.key)) {
        e.preventDefault();
        let wrapInsert = "", cursorOffset;
        if (e.key === "[") {
          wrapInsert = selectedText ? `[${selectedText}]()` : `[]()`;
          cursorOffset = start + (selectedText ? selectedText.length + 3 : 1);
        } else {
          wrapInsert = selectedText ? `(${selectedText})` : `()`;
          cursorOffset = start + (selectedText ? selectedText.length + 2 : 1);
        }
        this.textarea.setRangeText(wrapInsert, start, end, "end");
        this.textarea.setSelectionRange(cursorOffset, cursorOffset);
        this.textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
        return;
      }

      // Undo/Redo keyboard shortcuts
      if (this.opts.enableUndoRedo) {
        const isMod = e.metaKey || e.ctrlKey;
        if (isMod && e.key.toLowerCase() === "z" && !e.shiftKey) {
          e.preventDefault();
          this.undo();
          return;
        }
        const isRedoKey = e.key.toLowerCase() === "y";
        const isRedoShiftZ = e.shiftKey && e.key.toLowerCase() === "z";
        if (isMod && (isRedoKey || isRedoShiftZ)) {
          e.preventDefault();
          this.redo();
          return;
        }
      }
    }
    _onScrollOrResize() {
      if (this.suggestionsBox.style.display !== "none") {
        this._positionBoxAtCaret();
      }
    }

    // ---------- Internal: Suggestions ----------
    _handleTriggers() {
      const cursorPos = this.textarea.selectionStart;
      const before = this.textarea.value.slice(0, cursorPos);

      const matchAt = before.match(/@[\w-]*$/);
      const matchHash = before.match(/#[A-Za-z_]*$/);
      const matchBang = before.match(/![A-Za-z_]*$/);
      const matchAmp = before.match(/&[\w-]*$/);

      if (matchAmp) {
        this.currentTrigger = "&";
        this._showSuggestions(this._buildSpeakerSuggestions(matchAmp[0].substring(1)));
        return;
      }
      if (matchAt) {
        this.currentTrigger = "@";
        const query = matchAt[0];
        const filtered = this.opts.tags.filter((t) => t.startsWith(query));
        this._showSuggestions(filtered.length ? filtered : this.opts.tags);
        return;
      }
      if (matchHash) {
        this.currentTrigger = "#";
        const q = matchHash[0].substring(1).toUpperCase();
        const keys = Object.keys(this.opts.entities);
        const filtered = keys.filter((k) => k.startsWith(q));
        this._showSuggestions(filtered.map((k) => `${k} (${this.opts.entities[k]})`));
        return;
      }
      if (matchBang) {
        this.currentTrigger = "!";
        const q = matchBang[0].substring(1).toLowerCase();
        const codes = Object.keys(this.opts.languages);
        const filtered = codes.filter((c) => c.startsWith(q));
        this._showSuggestions(filtered.map((c) => `${c} (${this.opts.languages[c]})`));
        return;
      }
      this._hideSuggestions();
    }

    _showSuggestions(list) {
      // Clear previous suggestions
      this.suggestionsBox.innerHTML = "";
      this.currentSuggestions = list.slice();
      this.selectedIndex = list.length ? 0 : -1;
    
      // Hide if empty
      if (!list.length || !this.textarea || !document.body.contains(this.textarea)) {
        return this._hideSuggestions();
      }
    
      // Populate suggestion items
      list.forEach((item, i) => {
        const div = document.createElement("div");
        div.className = "rsml-suggestion-item";
        if (i === 0) div.classList.add("active");
        div.textContent = item;
    
        // Handle click (mousedown preferred to prevent blur)
        div.addEventListener("mousedown", (e) => {
          e.preventDefault(); // prevent blur
          this._insertTag(item);
        });
    
        this.suggestionsBox.appendChild(div);
      });
    
      // --- FIX START ---
      // 1. Make it part of the layout so it has dimensions for calculation
      this.suggestionsBox.style.display = "block";
      this.suggestionsBox.style.visibility = "hidden"; 
    
      // 2. Position at caret (Now it can safely measure width/height for boundary checks)
      try {
        this._positionBoxAtCaret();
      } catch (err) {
        console.warn("Caret positioning failed:", err);
        // If positioning fails, hide it again to prevent a broken UI
        this.suggestionsBox.style.display = "none";
        this.suggestionsBox.style.visibility = "visible";
        return this._hideSuggestions(); 
      }
    
      // 3. Make it visible to the user
      this.suggestionsBox.style.visibility = "visible";
      // --- FIX END ---
    }

    _updateSelection() {
      const items = Array.from(this.suggestionsBox.children);
      items.forEach((el, i) => {
        el.classList.toggle("active", i === this.selectedIndex);
        if (i === this.selectedIndex)
          el.scrollIntoView({ block: "nearest" });
      });
    }

    _hideSuggestions() {
      this.suggestionsBox.innerHTML = "";
      this.suggestionsBox.style.display = "none";
      this.selectedIndex = -1;
      this.currentSuggestions = [];
    }

    _positionBoxAtCaret() {
      const coords = getCaretCoordinates(this.textarea, this.textarea.selectionStart);
      const rect = this.textarea.getBoundingClientRect();
      this.suggestionsBox.style.left = `${coords.left + rect.left + window.scrollX}px`;
      this.suggestionsBox.style.top = `${coords.top + rect.top + 24 + window.scrollY}px`;
    }

    _insertTag(raw) {
      const tagOnly = raw.includes("(") ? raw.split(" ")[0] : raw;
      const cursorPos = this.textarea.selectionStart;
      const value = this.textarea.value;

      // Insert the type name between a prefix char and the following '['.
      const prefixInsert = (prefixChar) => {
        const iPre = value.lastIndexOf(prefixChar, cursorPos);
        const iBr = value.indexOf("[", iPre);
        if (iPre === -1 || iBr <= iPre) return false;
        const before = value.slice(0, iPre + 1);
        const after = value.slice(iBr);
        const newText = `${before}${tagOnly}${after}`;
        this.textarea.value = newText;
        const caret = newText.indexOf("()", iBr) + 1;
        this.textarea.setSelectionRange(caret, caret);
        this._hideSuggestions();
        this.textarea.focus();
        this._render();
        if (this.opts.enableUndoRedo) this._recordState();
        return true;
      };

      if (this.currentTrigger === "#" && prefixInsert("#")) return;
      if (this.currentTrigger === "!" && prefixInsert("!")) return;

      if (this.currentTrigger === "@") {
        const start =
          cursorPos -
          (value.slice(0, cursorPos).match(/@[\w-]*$/)?.[0].length || 1);
        this.textarea.setRangeText(tagOnly + " ", start, cursorPos, "end");
        const newPos = start + tagOnly.length + 1;
        this.textarea.setSelectionRange(newPos, newPos);
        this._hideSuggestions();
        this.textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
        return;
      }

      if (this.currentTrigger === "&") {
        const start =
          cursorPos -
          (value.slice(0, cursorPos).match(/&[\w-]*$/)?.[0].length || 1);
        const insert = `&${tagOnly} `;
        this.textarea.setRangeText(insert, start, cursorPos, "end");
        const newPos = start + insert.length;
        this.textarea.setSelectionRange(newPos, newPos);
        this._hideSuggestions();
        this.textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
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

    /* =========================
       Render Pipeline
    ========================= */
    _render() {
      const text = this.textarea.value || "";
      const html = this._transformRSML(text);

      // Preserve toggle across re-renders.
      const toggle = this.output.querySelector(".form-check");
      this.output.innerHTML = "";
      if (toggle) this.output.appendChild(toggle);
      if (!toggle && !this._toggleInjected) {
        this.output.appendChild(this._createRenderToggle());
        this._toggleInjected = true;
      }

      const content = document.createElement("div");
      content.className = `rsml-content rsml-mode-${this.renderMode}`;
      content.innerHTML = html;
      this.output.appendChild(content);

      this._paintHighlight();
      requestAnimationFrame(() => activateTooltips(this.output));
    }

    /* =========================
       Source Highlight Overlay
    ========================= */
    _installHighlightOverlay() {
      if (this._hlInstalled) return;
      this._hlInstalled = true;

      const ta = this.textarea;
      const container = document.createElement("div");
      container.className = "rsml-hl-container";
      ta.parentNode.insertBefore(container, ta);
      container.appendChild(ta);

      const highlights = document.createElement("div");
      highlights.className = "rsml-hl-highlights";
      highlights.setAttribute("aria-hidden", "true");
      const content = document.createElement("div");
      content.className = "rsml-hl-content";
      highlights.appendChild(content);
      container.insertBefore(highlights, ta);

      this._hlContainer = container;
      this._hlHighlights = highlights;
      this._hlContent = content;
      ta.classList.add("rsml-hl-textarea");

      ta.addEventListener("scroll", () => this._syncHighlightScroll());

      // Caret-position tracking. `selectionStart` isn't reliably updated by
      // the time `click` / `keyup` fire, so listen to `selectionchange`
      // (which fires AFTER the caret has actually moved) as the primary
      // signal, and defer the pointer/keyboard fallbacks to the next frame.
      this._onSelectionChange = () => {
        if (document.activeElement === ta) this._updateMatchHighlight();
      };
      document.addEventListener("selectionchange", this._onSelectionChange);
      const deferred = () => requestAnimationFrame(() => this._updateMatchHighlight());
      ta.addEventListener("click", deferred);
      ta.addEventListener("keyup", deferred);
      ta.addEventListener("focus", deferred);
      ta.addEventListener("blur", () => this._clearMatchHighlight());

      if (typeof ResizeObserver !== "undefined") {
        this._hlResizeObserver = new ResizeObserver(() => this._syncHighlightStyles());
        this._hlResizeObserver.observe(ta);
      }

      this._syncHighlightStyles();
    }

    _syncHighlightStyles() {
      if (!this._hlHighlights) return;
      const cs = getComputedStyle(this.textarea);
      const hl = this._hlHighlights;
      const props = [
        // Font metrics
        "fontFamily","fontSize","fontWeight","fontStyle",
        "fontVariant","fontStretch","fontOpticalSizing",
        "fontKerning","fontFeatureSettings","fontVariationSettings",
        "fontVariantLigatures","fontVariantNumeric","fontVariantCaps",
        "fontVariantEastAsian","fontSynthesis",
        // Text metrics
        "lineHeight","letterSpacing","wordSpacing","tabSize",
        "textIndent","textTransform","textAlign","textRendering",
        "direction","unicodeBidi","writingMode",
        // Layout
        "boxSizing",
        "paddingTop","paddingRight","paddingBottom","paddingLeft",
        "borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth",
        "borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle",
        "borderTopLeftRadius","borderTopRightRadius",
        "borderBottomLeftRadius","borderBottomRightRadius",
      ];
      for (const p of props) {
        const v = cs[p];
        if (v !== undefined && v !== "") hl.style[p] = v;
      }
      // Border must not paint (backdrop is behind the textarea's border already).
      hl.style.borderColor = "transparent";
    }

    _syncHighlightScroll() {
      if (!this._hlContent) return;
      const ta = this.textarea;
      this._hlContent.style.transform =
        `translate(${-ta.scrollLeft}px, ${-ta.scrollTop}px)`;
    }

    _paintHighlight() {
      if (!this._hlContent) return;
      this._hlContent.innerHTML = this._highlightSource(this.textarea.value || "");
      this._syncHighlightScroll();
      this._updateMatchHighlight();
    }

    // Character-preserving tokenizer. Only the SYNTAX gets a color; lexical
    // content (verbatim/normalized slots and plain text) stays default.
    // Every syntax fragment carries a `data-group` attribute so all fragments
    // belonging to the same tag (bracket-form opener/mid/closer, or a
    // -start/-end pair) can be co-highlighted when the caret lands on one.
    _highlightSource(text) {
      let out = "";
      let i = 0;
      const n = text.length;
      const esc = (s) => this._esc(s);

      // Reset per-render range table: maps a source-character range to the
      // group id shared by every syntax fragment of that tag.
      this._synRanges = [];
      const startCount = new Map();
      const endCount = new Map();
      let bracketCounter = 0;
      const record = (start, end, group) => {
        this._synRanges.push({ start, end, group });
      };
      const pairGroup = (name, role) => {
        const map = role === "start" ? startCount : endCount;
        const idx = map.get(name) || 0;
        map.set(name, idx + 1);
        return `p:${name}:${idx}`;
      };

      while (i < n) {
        // Prefixed bracket form:  ! # $  + optional type + [v](n)
        const pm = /^([!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const prefix = pm[1];
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              const cat = prefix === "!" ? "code-mix"
                        : prefix === "#" ? "entity"
                        : "accent";
              const g = `b${bracketCounter++}`;
              const head = text.slice(i, openBracket + 1);          // "!en["
              const verbatim = text.slice(openBracket + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              record(i, openBracket + 1, g);
              record(closeBracket, closeBracket + 2, g);
              record(closeParen, closeParen + 1, g);
              out += `<span class="tok-${cat}" data-group="${g}">${esc(head)}</span>`;
              out += esc(verbatim);
              out += `<span class="tok-${cat}" data-group="${g}">${esc("](")}</span>`;
              out += esc(normalized);
              out += `<span class="tok-${cat}" data-group="${g}">${esc(")")}</span>`;
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
              const g = `b${bracketCounter++}`;
              const verbatim = text.slice(i + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              record(i, i + 1, g);
              record(closeBracket, closeBracket + 2, g);
              record(closeParen, closeParen + 1, g);
              out += `<span class="tok-mispronunciation" data-group="${g}">${esc("[")}</span>`;
              out += esc(verbatim);
              out += `<span class="tok-mispronunciation" data-group="${g}">${esc("](")}</span>`;
              out += esc(normalized);
              out += `<span class="tok-mispronunciation" data-group="${g}">${esc(")")}</span>`;
              i = closeParen + 1;
              continue;
            }
          }
        }

        // @tag / @name-start / @name-end
        if (text[i] === "@") {
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (at) {
            const name = at[1];
            const isStart = name.endsWith("-start");
            const isEnd = !isStart && name.endsWith("-end");
            let cls, dataAttrs = "";
            if (isStart || isEnd) {
              const base = name.slice(0, isStart ? -6 : -4);
              const cat = this._spanCategory.get(base) || "unknown";
              cls = `tok-span-${cat}`;
              const g = pairGroup(base, isStart ? "start" : "end");
              record(i, i + at[0].length, g);
              dataAttrs = ` data-group="${g}"`;
            } else {
              const cat = this._atCategory.get(name) || "unknown";
              cls = `tok-at-${cat}`;
            }
            out += `<span class="${cls}"${dataAttrs}>${esc(at[0])}</span>`;
            i += at[0].length;
            continue;
          }
        }

        // Speaker span: &sN-start / &sN-end
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            const g = pairGroup(sp[1], sp[2]);
            record(i, i + sp[0].length, g);
            out += `<span class="tok-span-speaker" data-group="${g}">`
                 + `${esc(sp[0])}</span>`;
            i += sp[0].length;
            continue;
          }
        }

        // Literal character.
        const c = text[i];
        out += (c === "&") ? "&amp;" : (c === "<") ? "&lt;" : (c === ">") ? "&gt;" : c;
        i++;
      }

      // Trailing newline: textareas render an empty final line after '\n',
      // pre-wrap doesn't unless we add a sentinel.
      if (text.endsWith("\n")) out += " ";
      return out;
    }

    _updateMatchHighlight() {
      if (!this._hlContent) return;
      this._clearMatchHighlight();
      if (!this._synRanges || !this._synRanges.length) return;
      const pos = this.textarea.selectionStart;
      const hit = this._synRanges.find((r) => pos >= r.start && pos <= r.end);
      if (!hit) return;
      this._hlContent
        .querySelectorAll(`[data-group="${CSS.escape(hit.group)}"]`)
        .forEach((el) => el.classList.add("tok-match"));
    }

    _clearMatchHighlight() {
      if (!this._hlContent) return;
      this._hlContent
        .querySelectorAll(".tok-match")
        .forEach((el) => el.classList.remove("tok-match"));
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
        // Prefixed bracket form:  ! # $  + optional type + [v](n)
        const pm = /^([!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
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
            out += this._buildAtToken(at[1], i, i + at[0].length);
            i += at[0].length;
            continue;
          }
        }

        // Speaker span: &sN-start / &sN-end
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            flushLiteral(i);
            if (sp[2] === "start") {
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
        case "[": return "mispronunciation";
      }
      return "span";
    }

    _buildTaggedHTML(prefix, type, verbatim, normalized, srcStart, srcEnd) {
      const tag = this._prefixToTagName(prefix);
      const vInner = this._esc(verbatim);
      const nInner = this._esc(normalized);

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
      return `<span class="rsml-span rsml-span-${this._esc(base)} rsml-${this._esc(category)}"`
           + ` data-span="${this._esc(base)}" data-category="${this._esc(category)}"${srcAttr}`
           + ` data-bs-toggle="tooltip" data-bs-title="${this._esc(title)}">`;
    }

    _buildNoiseTag(type, srcStart, srcEnd) {
      const category = this._atCategory.get(type) || "unknown";
      const t = this._esc(type);
      const srcAttr = srcStart != null ? ` data-src="${srcStart}:${srcEnd}"` : "";
      return `<span class="rsml-at rsml-at-${category}"`
           + ` data-token="@${t}" data-category="${category}"${srcAttr}`
           + ` data-bs-toggle="tooltip" data-bs-title="${category}: ${t}">@${t}</span>`;
    }



    // ---------- Internal: Undo/Redo ----------
    _snapshot() {
      return {
        value: this.textarea.value,
        start: this.textarea.selectionStart || 0,
        end: this.textarea.selectionEnd || 0,
      };
    }
    _applySnapshot(s) {
      this.textarea.value = s.value;
      this.textarea.setSelectionRange(s.start, s.end);
    }
    _recordState() {
      if (this.isApplyingHistory) return;
      const s = this._snapshot();
      const latest = this.history[this.hIndex];
      if (s.value !== latest.value) {
        if (this.hIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.hIndex + 1);
        }
        this.history.push(s);
        this.hIndex = this.history.length - 1;
      }
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

      // ----- Highlight decorations (StateField) -----
      const buildDeco = (doc) => {
        const text = doc.toString();
        const marks = [];
        self._walkTokens(text, (from, to, cls) => {
          marks.push(view.Decoration.mark({ class: cls }).range(from, to));
        });
        marks.sort((a, b) => a.from - b.from || a.startSide - b.startSide);
        return view.Decoration.set(marks);
      };
      const decoField = state.StateField.define({
        create: (st) => buildDeco(st.doc),
        update: (deco, tr) =>
          tr.docChanged ? buildDeco(tr.state.doc) : deco.map(tr.changes),
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

      // ----- Autocomplete source -----
      const rsmlComplete = autocomplete.autocompletion({
        override: [(ctx) => self._cmComplete(ctx)],
        activateOnTyping: true,
        icons: false,
      });

      // ----- Wrap-selection-with-prefix handler -----
      // When the user types `!`, `#`, `$`, or `[` while text is selected,
      // wrap that selection as the verbatim slot of the corresponding tag
      // and drop the caret in the right place for the next step.
      const wrapPrefixes = new Set(["!", "#", "$", "["]);
      const wrapHandler = view.EditorView.inputHandler.of((v, from, to, insert) => {
        if (!wrapPrefixes.has(insert)) return false;
        if (from === to) return false; // no selection — fall through
        const selected = v.state.sliceDoc(from, to);
        let scaffold, caret;
        if (insert === "[") {
          // Bare mispronunciation: [SELECTION]()  — caret in the normalized slot.
          scaffold = `[${selected}]()`;
          caret = from + 1 + selected.length + 2; // just after `(`
        } else {
          // Prefixed form: X[SELECTION]() — caret right after X so the user
          // can type (or pick) the type name; the scaffold-aware `apply`
          // below will preserve the wrapped selection.
          scaffold = `${insert}[${selected}]()`;
          caret = from + 1; // right after the prefix char
        }
        v.dispatch({
          changes: { from, to, insert: scaffold },
          selection: { anchor: caret },
          userEvent: "input.type",
        });
        // Open the completion popup on the next tick so it sees the new state.
        if (insert !== "[") {
          setTimeout(() => autocomplete.startCompletion(v), 0);
        }
        return true;
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
          themeExt,
          view.EditorView.updateListener.of((update) => {
            if (!update.docChanged) return;
            ta.value = update.state.doc.toString();
            self._render();
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
    }

    // Shared token walker: emits (from, to, class) tuples for every syntax
    // fragment. Used by CM decorations; same rules as the parser.
    _walkTokens(text, add) {
      let i = 0;
      const n = text.length;
      while (i < n) {
        const pm = /^([!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
        if (pm) {
          const prefix = pm[1];
          const openBracket = i + pm[0].length - 1;
          const closeBracket = this._matchBracket(text, openBracket, "[", "]");
          if (closeBracket !== -1 && text[closeBracket + 1] === "(") {
            const closeParen = this._matchBracket(text, closeBracket + 1, "(", ")");
            if (closeParen !== -1) {
              const cat = prefix === "!" ? "code-mix"
                        : prefix === "#" ? "entity" : "accent";
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
              cls = `tok-span-${cat}`;
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
            add(i, i + sp[0].length, "tok-span-speaker");
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
        const pm = /^([!#$])([A-Za-z][\w-]*)?\[/.exec(text.slice(i));
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

    // CM completion source for @ # ! $ & prefixes.
    _cmComplete(ctx) {
      const trigger = ctx.matchBefore(/[@#!$&][\w-]*/);
      if (!trigger) return null;
      const prefix = trigger.text[0];
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
          options = Object.keys(this.opts.entities).map((k) => ({
            label: `#${k}`,
            detail: this.opts.entities[k],
            apply: bracketApply(`#${k}`),
          }));
          break;
        case "!":
          options = Object.keys(this.opts.languages).map((c) => ({
            label: `!${c}`,
            detail: this.opts.languages[c],
            apply: bracketApply(`!${c}`),
          }));
          break;
        case "$":
          options = [{
            label: "$ (accent)",
            detail: "accent-name is free-form",
            apply: bracketApply(`$`),
          }];
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