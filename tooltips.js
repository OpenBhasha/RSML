export function setupTagTooltips(root) {
    const elements = root.querySelectorAll('[data-bs-toggle="tooltip"]');
    elements.forEach(el => {
      new bootstrap.Tooltip(el);
    });
  }
  