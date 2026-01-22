// =============================================================
// FILE: src/components/seo/FooterCodeRenderer.tsx
// FINAL — Execute custom_footer_code safely (body-end)
// - parses HTML and appends nodes to a dedicated container
// - cleans up on change/unmount
// =============================================================

import { useEffect } from 'react';

export function FooterCodeRenderer({ html }: { html: string }) {
  useEffect(() => {
    const raw = (html || '').trim();
    if (!raw) return;

    const container = document.createElement('div');
    container.setAttribute('data-custom-footer', '1');

    // Parse string -> nodes
    const tpl = document.createElement('template');
    tpl.innerHTML = raw;

    container.appendChild(tpl.content.cloneNode(true));
    document.body.appendChild(container);

    // Execute inline <script> tags by recreating them (browser won’t run cloned scripts reliably)
    const scripts = Array.from(container.querySelectorAll('script'));
    for (const oldScript of scripts) {
      const s = document.createElement('script');

      // copy attributes
      for (const attr of Array.from(oldScript.attributes)) {
        s.setAttribute(attr.name, attr.value);
      }

      // copy content
      s.text = oldScript.text || '';

      oldScript.replaceWith(s);
    }

    return () => {
      container.remove();
    };
  }, [html]);

  return null;
}
