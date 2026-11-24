# RSML Annotator

RSML (Rich Speech Markup Language) annotation UI widget for transcription and speech datasets.

### Install

```sh
npm install rsml
````

### Browser Usage

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RSML Example</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/css/bootstrap.min.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.8/dist/js/bootstrap.bundle.min.js"></script>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/font/bootstrap-icons.min.css" />
  

</head>

<body>
<div class="container mt-4">

  <!-- Textarea + Render -->
  <div class="row mt-3">
    <div class="col-12 col-md-6 mb-3 mb-md-0">
      <textarea id="tag-textarea" class="form-control" rows="10"
        placeholder="Type @ for tags, # for entities, ! for languages..."
      ></textarea>
    </div>

    <div class="col-12 col-md-6">
      <div id="rendered-transcript"
           class="card p-3"
           style="height: 250px; overflow-y: auto; background: #f9f9f9"></div>
    </div>
  </div>

</div>


<script type="module">
  import RSMLAnnotator from "https://cdn.jsdelivr.net/npm/rsml@latest/rsml.esm.js";

  new RSMLAnnotator({
    textarea: "#tag-textarea",
    output: "#rendered-transcript"
  });
</script>

</body>
</html>

```
### React Usage

```bash
npm install rsml
```

```jsx
import { useEffect, useRef } from "react";
import RSMLAnnotator from "rsml"; 
export default function App() {
  const textareaRef = useRef(null);
  const outputRef = useRef(null);
  const annotatorRef = useRef(null); // 👈 prevent multiple initializations

  useEffect(() => {
    if (
      textareaRef.current &&
      outputRef.current &&
      !annotatorRef.current 
    ) {
      annotatorRef.current = new RSMLAnnotator({
        textarea: textareaRef.current,
        output: outputRef.current,
      });
    }
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🗣️ RSML Annotator (React + Vite + CDN ESM)</h2>

      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <textarea
          ref={textareaRef}
          rows="10"
          style={{ flex: 1, minWidth: "300px", padding: "1rem" }}
          placeholder="Type @ for tags, # for entities, ! for languages..."
        />

        <div
          ref={outputRef}
          className="rsml-output"
          style={{
            flex: 1,
            minWidth: "300px",
            minHeight: "250px",
            overflowY: "auto",
            padding: "1rem",
            background: "#f9f9f9",
            border: "1px solid #ccc",
          }}
        />
      </div>
    </div>
  );
}
```

### Extending the vocabulary

Every configurable tag/entity/language list can be grown after construction
with `add(category, value, label)` / `remove(category, value)` — an
already-open editor picks up the change immediately, with no re-render or
retyping needed.

```js
annotator.add("hesitations", "@meh");
annotator.add("entities", "PRODUCT", "Product Name");
annotator.add("languages", "kok", "Konkani");
annotator.remove("entities", "PRODUCT");
```

`category` is one of:

| category | what `value` is | what `label` is |
|---|---|---|
| `hesitations` | an `@tag` (with or without the `@`) | — |
| `isolatedParalinguistics` | an `@tag` | — |
| `isolatedOther` | an `@tag` | — |
| `disfluencySpans` | a span base name (no `@`, no `-start`/`-end`) | — |
| `paralinguisticSpans` | a span base name | — |
| `prosodySpans` | a span base name | — |
| `entities` | a `#`-prefixed entity type code | display label (optional) |
| `languages` | a `!`-prefixed language code | display label (optional) |
| `dialects` | a `$$`-prefixed dialect code | display label (optional) |
| `domains` | a `!!`-prefixed domain code | display label (optional) |

`add`/`remove` return `true` if they changed something, `false` for a no-op
(e.g. removing a name that wasn't registered). They throw on an unknown
`category`, an invalid/empty value (map codes must start with a letter,
then use letters, digits, `_` or `-`, which is what the parser reads), or — for the `@tag` and span families,
which each share one namespace across their sibling categories — a name
already registered under a *different* category in that family.

### Dialect and domain markup

Alongside `!` (code-mix / language) and `#` (entity), two more bracket
prefixes are available, each backed by its own vocabulary registered via
`add`/`remove` above:

- **`$$` — dialect**: `$$TG[వస్తున్నా](వస్తున్నాను)` marks a phrase as a
  specific dialect (e.g. `add("dialects", "TG", "Telangana Telugu")`).
- **`!!` — domain**: `!!MED[BP](రక్తపోటు)` marks a phrase as belonging to a
  specific domain/register (e.g. `add("domains", "MED", "Medical")`).

Like `!`/`#`/`$`, the type code after the prefix is optional — `$$[…](…)`
and `!![…](…)` render as "unspecified" dialect/domain.

### Display settings

A settings button next to the Verbatim/Normalized switch opens a small
popup with a **Hide disfluencies** checkbox. It hides `hesitations`,
`disfluencySpans`, and `isolatedOther` tags in the rendered output —
the source text and editor are untouched, so switching it on/off never
loses anything.

A `repair` span written with the documented `reparandum - repair`
convention is a special case: only the reparandum (and the ` - `
separator) is hidden, keeping the corrected text visible.

```
Source:  @repair-start ఢిల్లీ కాదు - ముంబై @repair-end వెళ్ళాను.
Shown (disfluencies visible): ఢిల్లీ కాదు - ముంబై వెళ్ళాను.
Shown (disfluencies hidden):  ముంబై వెళ్ళాను.
```

A `repair` span with no ` - ` separator is hidden wholesale, like any
other disfluency.

### Options

Besides `textarea`, `output` and the vocabulary lists above, the constructor
accepts:

| option | default | what it does |
|---|---|---|
| `renderMode` | `"normalized"` | Show the preview as `"normalized"` or `"verbatim"` text |
| `hideDisfluencies` | `true` | Hide disfluencies in the preview |
| `toolbar` | `true` | Show the preview's own Normalized/Verbatim switch and settings button. Set `false` when your app has its own controls |
| `alwaysShowStatus` | `false` | Keep the status line visible, showing "✓ 0 errors" when there are no issues |
| `onChange` | — | `(value) => {}`, called after each edit made by typing (not by `setValue()`) |
| `preferredLanguage` | — | A language code ranked first in the `!` completions |
| `accents` | `{}` | `{ id: name }` offered by the `$` completions |

They can be changed later:

```js
annotator.setRenderMode("verbatim");
annotator.setHideDisfluencies(false);
annotator.setPreferredLanguage("en");
annotator.setAccents({ east: "Eastern" });
```

### `rsml/core`: vocabulary rules without a browser

`rsml/core` holds the default vocabulary, the `add`/`remove` rules and a tag
scanner, with no DOM. Use it on a server to validate a project's tag sets
with exactly the rules the editor applies.

```js
import { addEntry, removeEntry, vocabularyFrom, countEntryUses, VERSION } from "rsml/core";

const vocabulary = vocabularyFrom({ dialects: { TG: "Telangana Telugu" } }); // defaults + overrides
addEntry(vocabulary, "hesitations", "@meh");     // true; throws VocabularyError on invalid input
removeEntry(vocabulary, "entities", "URL");      // true
countEntryUses("@meh ok @meh", "hesitations", "meh"); // 2
```

| export | what it does |
|---|---|
| `VERSION` | the library version |
| `CATEGORIES`, `CATEGORY_SPECS`, `DEFAULT_*` | the categories and the built-in vocabulary |
| `defaultVocabulary()` | a fresh copy of the built-in vocabulary |
| `vocabularyFrom(overrides)` | the defaults with some categories replaced |
| `addEntry` / `removeEntry` | the same rules as `annotator.add` / `remove`, on a plain vocabulary object |
| `isValidName` / `isValidCode` | the character rules for tag names and bracket-tag codes |
| `findTagUses(text)` | every vocabulary tag used in a text, including nested ones |
| `countEntryUses(text, category, value)` | how often a text uses one vocabulary entry |

### Development

The library source is in `src/` (`src/core/` has no DOM). `npm run build`
writes `rsml.js` (UMD, for `<script>` tags and CDNs), `rsml.cjs`, `rsml.esm.js`,
`core.js` and `core.cjs`; `npm test` builds and runs the tests.
