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
}
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
  display: inline !important;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.95em;
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
/* Pitch-contour spans: no background — just a small arrow above the text. */
.rsml-span.rsml-span-raising-pitch,
.rsml-span.rsml-span-falling-pitch {
  background: rgb(252, 122, 0, 0.1);
  color:#000;
  border: 1px solid rgb(252, 122, 0);
  padding: 1px 2px;
  position: relative;
  display: inline-block;
}
.rsml-span.rsml-span-raising-pitch::before,
.rsml-span.rsml-span-falling-pitch::before {
  position: absolute;
  top: -0.65em;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.8em;
  font-weight: 700;
  line-height: 1;
  pointer-events: none;
}
.rsml-span.rsml-span-raising-pitch::before { content: "↗"; color:#c22; }
.rsml-span.rsml-span-falling-pitch::before { content: "↘"; color:#06c; }
/* Speaker: no highlight box, just a small "Speaker N" label at the turn start. */
.rsml-speaker { background: transparent; border: none; padding: 0; border-radius: 0; }
.rsml-speaker-label {
  display: inline-block;
  font-size: 0.7em;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: #5a4dd0;
  padding: 1px 6px;
  border: 1px solid #cfc7ff;
  border-radius: 3px;
  margin-right: 4px;
  vertical-align: baseline;
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
              const verbatim = text.slice(openBracket + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              out += this._buildTaggedHTML(prefix, type, verbatim, normalized);
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
              const verbatim = text.slice(i + 1, closeBracket);
              const normalized = text.slice(closeBracket + 2, closeParen);
              out += this._buildTaggedHTML("[", "", verbatim, normalized);
              i = closeParen + 1;
              continue;
            }
          }
        }

        // @tag / @name-start / @name-end
        if (text[i] === "@") {
          const at = /^@([\w-]+)/.exec(text.slice(i));
          if (at) {
            out += this._buildAtToken(at[1]);
            i += at[0].length;
            continue;
          }
        }

        // Speaker span: &sN-start / &sN-end
        if (text[i] === "&") {
          const sp = /^&(s\d+)-(start|end)(?![\w-])/.exec(text.slice(i));
          if (sp) {
            if (sp[2] === "start") {
              const num = sp[1].slice(1);
              out += `<span class="rsml-speaker" data-speaker="${this._esc(sp[1])}">`
                   + `<span class="rsml-speaker-label" data-bs-toggle="tooltip" data-bs-title="speaker turn: ${this._esc(sp[1])}">Speaker ${this._esc(num)}</span> `;
            } else {
              out += `</span>`;
            }
            i += sp[0].length;
            continue;
          }
        }

        // Literal character (escape only the HTML-sensitive ones).
        const c = text[i];
        out += (c === "&") ? "&amp;" : (c === "<") ? "&lt;" : (c === ">") ? "&gt;" : c;
        i++;
      }

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

    _buildTaggedHTML(prefix, type, verbatim, normalized) {
      const tag = this._prefixToTagName(prefix);
      // Bracket slots are rendered as literal text — no nested tag parsing.
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

      const body = `<span class="rsml-verbatim">${vInner}</span><span class="rsml-normalized">${nInner}</span>`;
      return `<${tag}${dataAttrs} data-bs-toggle="tooltip" data-bs-title="${this._esc(title)}">${body}</${tag}>`;
    }

    // Isolated @tag or the opening/closing of a span pair.
    _buildAtToken(name) {
      if (name.endsWith("-start")) {
        return this._openSpan(name.slice(0, -6));
      }
      if (name.endsWith("-end")) {
        return `</span>`;
      }
      return this._buildNoiseTag(name);
    }

    _openSpan(base) {
      const category = this._spanCategory.get(base) || "other";
      const title = `${category}: ${base}`;
      return `<span class="rsml-span rsml-span-${this._esc(base)} rsml-${this._esc(category)}"`
           + ` data-span="${this._esc(base)}" data-category="${this._esc(category)}"`
           + ` data-bs-toggle="tooltip" data-bs-title="${this._esc(title)}">`;
    }

    _buildNoiseTag(type) {
      const category = this._atCategory.get(type) || "unknown";
      const t = this._esc(type);
      return `<span class="rsml-at rsml-at-${category}"`
           + ` data-token="@${t}" data-category="${category}"`
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

    // ---------- Internal: Misc ----------
    _esc(s) {
      return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
    }
  }

  // Named + default export (for ESM interop via bundlers)
  RSMLAnnotator.default = RSMLAnnotator;
  return RSMLAnnotator;
})