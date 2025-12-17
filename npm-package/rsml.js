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

code-mix, mispronunciation, entity, noise, persistent-noise {
  display: inline-block !important;
  padding: 1px 4px;
  border-radius: 4px;
  font-size: 0.95em;
}
code-mix { background-color:#c8f7ff; border:1px solid #7fd7ea; }
mispronunciation { background-color:#ffd1a8; border:1px solid #ffae70; }
noise { background-color:#888; color:#fff; border:1px solid #666; }
persistent-noise { background-color:#d7d7d7; color:#000; border:1px solid #d7d7d7; }
entity { background-color:#fff7a8; border:1px solid #e6db65; color:#444; position:relative; cursor:help; }
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
  const NOISE_TAGS = [

    // -------------------------
    // Generic noisy environment (fallback only)
    // -------------------------
    "@noise-start",
    "@noise-end",
    "@noise",
  
    // -------------------------
    // Backround noisy environments (persistent)
    // -------------------------
    "@chatter-start",
    "@chatter-end",
  
    "@tv-start",
    "@tv-end",
  
    "@traffic-start",
    "@traffic-end",
  
    "@music-start",
    "@music-end",


    // -------------------------
    // Speaker noises (persistent)
    // -------------------------
    "@crying-start",
    "@crying-end",
  
    "@yelling-start",
    "@yelling-end",
  
    "@laughing-start",
    "@laughing-end",

    "@singing-start",
    "@singing-end",

    "@humming-start",
    "@humming-end",

    "@whistling-start",
    "@whistling-end",

    "@whisper-start",
    "@whisper-end",


  
    // -------------------------
    // Speaker disfluencies (paralinguistic)
    // -------------------------
    "@ugh",
    "@uhh",
    "@umm",
    "@hmm",
    "@uh-huh",
    "@tsk",
  
    "@stammer-start",
    "@stammer-end",
    "@prolongation-start",
    "@prolongation-end",
    "@repair-start",
    "@repair-end",
    "@repetition-start",
    "@repetition-end",
    "@false-start-start",
    "@false-start-end",
    "@pause",

  
    // -------------------------
    // Speaker-produced sounds 
    // -------------------------
    "@humming",
    "@breathing",
    "@inhaling",
    "@sniffing",
    "@nose-blowing",
    "@cough",
    "@sneezing",
    "@throat-clearing",
    "@yawning",
    "@eating",
    "@snoring",
  

    "@groan",
    

    //
    //  -------------------------
    // Background noises (non-speaker)
    // -------------------------
    "@background-traffic", 
    "@background-chatter",
    "@background-tv",
    "@background-laughter",
    "@background-yelling",
    "@background-applause",
    "@background-cheering",
    "@background-sighing",
    "@background-crying",
    "@background-singing",
    "@background-whistling",
    "@background-humming",
    "@background-music",
    "@animal-sounds",
    "@bird-sounds",
    "@vehicle-noise",
    "@mechanical-noise",
    "@typing",
    "@footsteps",

    "@click",
    "@tapping",
    "@scratching",
    "@squeak",
    "@clinking",
    "@clanking",
    "@clanging",
    "@thumping",
    "@pounding",
    "@screeching",
    "@rattling",
    "@rustling",
  
    "@static",
    "@hiss",
    "@beep",
    "@bell",
    "@buzz",
    "@ringing",
    "@phone-ringing",
    "@horn",
    "@siren",
    "@chiming",
  
  
    // -------------------------
    // Other
    // -------------------------
    "@unintelligible"
  ];
  
  

  const DEFAULT_ENTITY_MAP = {
    PER: "Person", ORG: "Organization", FAC: "Facility", GPE: "Geo Political Entity",
    LOC: "Location", BRAND: "Brand", PRODUCT: "Product", ACRONYM: "Acronym", TITLE: "Title", EVENT: "Event", WORK_OF_ART: "Artwork",
    DATE: "Date", YEAR: "Year", MONTH: "Month", Day: "Day", TIME: "Time", MONEY: "Money",
    PERCENT: "Percentage", NUMBER: "Number", EMAIL: "Email ID", PHONE: "Phone Number",
    URL: "Link/URL", LAW: "Law/Policy", ENTITY: "Generic Entity",
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
          tags: NOISE_TAGS.slice(),
          entities: Object.assign({}, DEFAULT_ENTITY_MAP),
          languages: Object.assign({}, DEFAULT_LANGS),
          enableUndoRedo: true,
          demoText: false,
        },
        opts || {}
      );

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
        this.textarea.value = `బట్టలు [జీన్స్](jeans) వేసుకోవడం @umm అమ్మాయిలు అబ్బాయిలు కూడా [జీన్స్](jeans) వేసుకొని <ఏందంటే>(ఏంటంటే) లుంగీ పంచెలు ఎక్కువ వేసుకోకుండా ఉండడం అలాంటివి చేస్తారనమాట #GPE{రాయలసీమ}(రాయలసీమ)లో

यहाँ पर मैं अपनी [स्टडी](study) के @noise-start बारे में बात कर रहा हूँ। <समझनाहीं>(समझ नहीं) कि @noise-end यह कैसे होगा। {भारतीय रयिलवे}(भारतीय रेल्वे) और #ORG{इंडियन रेलवे}(Indian Railway) बहुत बड़ा [नेटवर्क](network) है।@background-laughter`;
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

      // Insert entity scaffold with '#'
      if (e.key === "#") {
        e.preventDefault();
        const insert = selectedText ? `#{${selectedText}}()` : `#{}()`;
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

      // Insert language scaffold with '!'
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
      if (["[", "{", "<", "("].includes(e.key)) {
        e.preventDefault();
        let wrapInsert = "", cursorOffset;
        if (e.key === "[") {
          wrapInsert = selectedText ? `[${selectedText}]()` : `[]()`;
          cursorOffset = start + (selectedText ? selectedText.length + 3 : 1);
        } else if (e.key === "{") {
          wrapInsert = selectedText ? `{${selectedText}}()` : `{}()`;
          cursorOffset = start + (selectedText ? selectedText.length + 3 : 1);
        } else if (e.key === "<") {
          wrapInsert = selectedText ? `<${selectedText}>()` : `<>()`;
          cursorOffset = start + (selectedText ? selectedText.length + 3 : 1);
        } else if (e.key === "(") {
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

      if (matchAt) {
        this.currentTrigger = "@";
        const query = matchAt[0];
        const filtered = this.opts.tags.filter((t) => t.startsWith(query));
        this._showSuggestions(filtered.length ? filtered : this.opts.tags);
        console.log("Pressed @")
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

      if (this.currentTrigger === "#") {
        const iHash = value.lastIndexOf("#", cursorPos);
        const iBrace = value.indexOf("{", iHash);
        if (iHash !== -1 && iBrace > iHash) {
          const before = value.slice(0, iHash + 1);
          const after = value.slice(iBrace);
          const newText = `${before}${tagOnly}${after}`;
          this.textarea.value = newText;
          const caret = newText.indexOf("()", iBrace) + 1;
          this.textarea.setSelectionRange(caret, caret);
          this._hideSuggestions();
          this.textarea.focus();
          this._render();
          if (this.opts.enableUndoRedo) this._recordState();
          return;
        }
      }

      if (this.currentTrigger === "!") {
        const iEx = value.lastIndexOf("!", cursorPos);
        const iBr = value.indexOf("[", iEx);
        if (iEx !== -1 && iBr > iEx) {
          const before = value.slice(0, iEx + 1);
          const after = value.slice(iBr);
          const newText = `${before}${tagOnly}${after}`;
          this.textarea.value = newText;
          const caret = newText.indexOf("()", iBr) + 1;
          this.textarea.setSelectionRange(caret, caret);
          this._hideSuggestions();
          this.textarea.focus();
          this._render();
          if (this.opts.enableUndoRedo) this._recordState();
          return;
        }
      }

      if (this.currentTrigger === "@") {
        const start =
          cursorPos -
          (value.slice(0, cursorPos).match(/@[\w-]*$/)?.[0].length || 1);
        this.textarea.setRangeText(tagOnly + " ", start, cursorPos, "end");
        const newPos = start + tagOnly.length + 1;
        this.textarea.setSelectionRange(newPos, newPos);
        this._hideSuggestions();
        this.textarea.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
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
      let html = (this.textarea.value || "").replace(/\n/g, "<br>");
    
      html = this._applyCodeMix(html);
      html = this._applyMispronunciation(html);
      html = this._applyTypedEntities(html);
      html = this._applyGenericEntities(html);
      html = this._applyNoiseTags(html);
    
      // Preserve toggle
      const toggle = this.output.querySelector(".form-check");
      this.output.innerHTML = "";
      if (toggle) this.output.appendChild(toggle);
    
      if (!toggle && !this._toggleInjected) {
        this.output.appendChild(this._createRenderToggle());
        this._toggleInjected = true;
      }
    
      const content = document.createElement("div");
      content.innerHTML = `<p>${html}</p>`;
      this.output.appendChild(content);
    
      this._applyRenderMode(this.output);
    }

    /* =========================
       Render Mode Switch
    ========================= */
    _applyRenderMode(root) {
      root.querySelectorAll("code-mix, mispronunciation, entity").forEach(el => {
        const txt =
          this.renderMode === "verbatim"
            ? el.dataset.verbatim
            : el.dataset.normalized;
        if (txt !== undefined) el.textContent = txt;
      });
    }

    /* =========================
       RSML Transforms
    ========================= */

    // [native](romanized)
    _applyCodeMix(text) {
      return text.replace(
        /\[([^\]]+?)\]\(([^)]*?)\)/g,
        (_, native, romanized) => {
          const norm = romanized || native;
          return `<code-mix
            data-verbatim="${this._esc(native)}"
            data-normalized="${this._esc(norm)}"
            title="code-mix"
          >${this._esc(norm)}</code-mix>`;
        }
      );
    }

    // <wrong>(correct)
    _applyMispronunciation(text) {
      return text.replace(
        /<([^>]+?)>\(([^)]*?)\)/g,
        (_, wrong, correct) => {
          const norm = correct || wrong;
          return `<mispronunciation
            data-verbatim="${this._esc(wrong)}"
            data-normalized="${this._esc(norm)}"
            title="mispronunciation"
          >${this._esc(norm)}</mispronunciation>`;
        }
      );
    }

    // #TYPE{original}(normalized)
    _applyTypedEntities(text) {
      return text.replace(
        /#(\w+)\{([^}]+?)\}\(([^)]*?)\)/g,
        (_, type, original, normalized) => {
          const norm = normalized || original;
          return `<entity
            data-verbatim="${this._esc(original)}"
            data-normalized="${this._esc(norm)}"
            title="entity: ${this._esc(type)}"
          >${this._esc(norm)}</entity>`;
        }
      );
    }

    // {original}(normalized)
    _applyGenericEntities(text) {
      return text.replace(
        /\{([^}]+?)\}\(([^)]*?)\)/g,
        (_, original, normalized) => {
          const norm = normalized || original;
          return `<entity
            data-verbatim="${this._esc(original)}"
            data-normalized="${this._esc(norm)}"
            title="entity"
          >${this._esc(norm)}</entity>`;
        }
      );
    }

    // Noise
    _applyNoiseTags(text) {
      return text.replace(/@([\w-]+)/g, (_, n) => {
        if (n.endsWith("-start")) return `<persistent-noise>`;
        if (n.endsWith("-end")) return `</persistent-noise>`;
        return `<noise>@${this._esc(n)}</noise>`;
      });
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
});