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
