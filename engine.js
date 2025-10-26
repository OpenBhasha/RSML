import { RSML_TAGS } from './schema.js';

class RSMLViewer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const src = this.getAttribute('src');
    if (!src) return;

    try {
      const response = await fetch(src);
      const text = await response.text();
      const parsed = new DOMParser().parseFromString(text, 'application/xml');
      const rendered = this.cloneRSML(parsed.documentElement);

      const style = document.createElement('link');
      style.setAttribute('rel', 'stylesheet');
      style.setAttribute('href', './rsml.css');

      this.shadowRoot.appendChild(style);
      this.shadowRoot.appendChild(rendered);

      this.setupTooltips(this.shadowRoot); // Tooltip setup moved here

    } catch (e) {
      this.shadowRoot.innerHTML = `<p style="color: red">Error loading RSML: ${e.message}</p>`;
    }
  }

  // Tooltip initialization using Bootstrap
  setupTooltips(root) {
    const tooltipTriggerList = root.querySelectorAll('[data-bs-toggle="tooltip"]');
    for (const triggerEl of tooltipTriggerList) {
      new bootstrap.Tooltip(triggerEl);
    }
  }

  cloneRSML(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent);
    }

    const spec = RSML_TAGS[node.nodeName];
    const el = document.createElement(spec ? node.nodeName : 'span');

    if (spec) {
      el.className = spec.class;

      // Tooltip for highlight tags
      if (spec.class === 'highlight-tag' || spec.class === 'entity-tag') {
        const tooltipParts = spec.attributes.map(attr =>
          node.getAttribute(attr) ? `${attr}="${node.getAttribute(attr)}"` : null
        ).filter(Boolean);
        const tooltipText = `${spec.displayName}${tooltipParts.length ? ': ' + tooltipParts.join(', ') : ''}`;
        el.setAttribute('title', tooltipText);
        el.setAttribute('data-bs-toggle', 'tooltip');
        el.setAttribute('data-bs-placement', 'top');
      }

      // Metadata for speech/noise segments
      if (node.nodeName === 'speech-segment' || node.nodeName === 'noise-segment') {
        const start = node.getAttribute('start') || '?';
        const end = node.getAttribute('end') || '?';
        const timeDiv = document.createElement('div');
        timeDiv.className = 'segment-meta';
        timeDiv.innerHTML = `<i class="bi bi-clock"></i> ${start} – ${end}`;
        el.appendChild(timeDiv);

        const speakerNode = Array.from(node.childNodes).find(n => n.nodeName === 'speaker');
        const speakerSpec = RSML_TAGS['speaker'];
        if (speakerNode && speakerSpec) {
          const speakerDiv = document.createElement('div');
          speakerDiv.className = 'segment-speaker';
          const speakerInfo = speakerSpec.attributes.map(attr =>
            speakerNode.getAttribute(attr) ? `${attr}: ${speakerNode.getAttribute(attr)}` : null
          ).filter(Boolean).join(' · ');
          speakerDiv.textContent = `${speakerInfo || 'Unknown speaker'}`;
          el.appendChild(speakerDiv);
        }
      }
    }

    // Recursively render children
    for (const child of node.childNodes) {
      // Avoid duplicating speaker node content
      if (node.nodeName === 'speech-segment' && child.nodeName === 'speaker') continue;
      el.appendChild(this.cloneRSML(child));
    }

    return el;
  }
}

customElements.define('rsml-viewer', RSMLViewer);
