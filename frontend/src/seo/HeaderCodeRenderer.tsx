// =============================================================
// FILE: src/seo/HeaderCodeRenderer.tsx
// Execute custom_header_code into document.head
// - parses HTML and appends nodes directly to <head>
// - re-creates <script> tags so browser executes them
// - cleans up on change/unmount
// =============================================================

import { useEffect } from 'react';

export function HeaderCodeRenderer({ html }: { html: string }) {
  useEffect(() => {
    const raw = (html || '').trim();
    if (!raw) return;

    const tpl = document.createElement('template');
    tpl.innerHTML = raw;

    const inserted: Node[] = [];

    for (const child of Array.from(tpl.content.childNodes)) {
      if (child.nodeType === Node.ELEMENT_NODE && (child as Element).tagName === 'SCRIPT') {
        // Re-create script elements so the browser executes them
        const orig = child as HTMLScriptElement;
        const s = document.createElement('script');
        for (const attr of Array.from(orig.attributes)) {
          s.setAttribute(attr.name, attr.value);
        }
        s.text = orig.text || orig.textContent || '';
        document.head.appendChild(s);
        inserted.push(s);
      } else {
        const clone = child.cloneNode(true);
        document.head.appendChild(clone);
        inserted.push(clone);
      }
    }

    return () => {
      for (const node of inserted) {
        node.parentNode?.removeChild(node);
      }
    };
  }, [html]);

  return null;
}
