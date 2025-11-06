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
  <title>RSML Annotation UX</title>

</head>

<body>
<div class="container mt-4">

  <!-- ✅ Textarea + Render -->
  <div class="row mt-3">
    <div class="col-12 col-md-6 mb-3 mb-md-0">
      <textarea id="tag-textarea" class="form-control" rows="10"
        placeholder="Type @ for tags, # for entities, ! for languages..."
      ></textarea>
      <div id="tag-suggestions"></div>
    </div>

    <div class="col-12 col-md-6">
      <div id="rendered-transcript"
           class="card p-3"
           style="height: 250px; overflow-y: auto; background: #f9f9f9"></div>
    </div>
  </div>

</div>


<script type="module">
  import RSMLAnnotator from "https://cdn.jsdelivr.net/npm/rsml/rsml.esm.js";

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
import RSMLAnnotator from "rsml";
import { useRef, useEffect } from "react";

export default function App() {
  const ta = useRef(null);
  const out = useRef(null);

  useEffect(() => {
    RSMLAnnotator.init({
      textarea: ta.current,
      output: out.current
    });
  }, []);

  return (
    <>
      <textarea ref={ta} rows="6" />
      <div ref={out} />
    </>
  );
}
```
