// =============================================================
// FILE: src/components/admin/common/safeQuill.ts
// =============================================================
/**
 * Quill için güvenli modüller: paste/drop ile gelen <img> etiketlerini bloklar,
 * sadece toolbar'dan yüklenen görselleri kabul eder.
 *
 * Kullanım:
 *   const quillModules = buildSafeQuillModules(() => {
 *     // burada sizin gizli <input type="file"> tetiklenir
 *     contentImageInputRef.current?.click();
 *   }, (q) => { lastQuillRef.current = q });
 */

export const QUILL_FORMATS = [
  "header",
  "bold", "italic", "underline", "strike",
  "list",
  "color", "background",
  "link",
  "image", // toolbar'dan yükleyip URL olarak embed edeceğiz
] as const;

type QuillEditor = {
  getSelection: (focus?: boolean) => { index: number } | null;
  clipboard: { dangerouslyPasteHTML: (index: number, html: string) => void };
  insertEmbed: (index: number, type: string, value: string, source?: string) => void;
  getLength: () => number;
  setSelection: (index: number, length: number) => void;
  root?: HTMLElement;
};

type ToolbarCtx = { quill?: unknown };
const isQuill = (x: unknown): x is QuillEditor =>
  !!x && typeof (x as QuillEditor).getSelection === "function" &&
  typeof (x as QuillEditor).insertEmbed === "function" &&
  typeof (x as QuillEditor).getLength === "function";

const pickSafeAttributes = (attrs?: Record<string, any>) => {
  if (!attrs) return attrs;
  const safe: Record<string, any> = {};
  // yalın whitelist
  if (attrs.bold) safe.bold = true;
  if (attrs.italic) safe.italic = true;
  if (attrs.underline) safe.underline = true;
  if (attrs.strike) safe.strike = true;
  if (attrs.header) safe.header = attrs.header;
  if (attrs.list) safe.list = attrs.list;
  if (attrs.link) safe.link = attrs.link;
  if (attrs.color) safe.color = attrs.color;
  if (attrs.background) safe.background = attrs.background;
  return Object.keys(safe).length ? safe : undefined;
};

/**
 * IMG matcher → tamamen yok say.
 * Diğer elementlerde attributes'i whitelist'e indir.
 */
const sanitizeDelta = (delta: any) => {
  if (!delta || !Array.isArray(delta.ops)) return delta;
  delta.ops = delta.ops.map((op: any) => {
    if (op && op.attributes) {
      const cleaned = pickSafeAttributes(op.attributes);
      return cleaned ? { ...op, attributes: cleaned } : { ...op, attributes: undefined };
    }
    return op;
  });
  return delta;
};

export function buildSafeQuillModules(
  openFilePicker: () => void,
  rememberQuill?: (q: QuillEditor) => void
) {
  return {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ color: [] }, { background: [] }],
        ["link", "image"],
        ["clean"],
      ],
      handlers: {
        image: function (this: ToolbarCtx) {
          const q = (this as any)?.quill;
          if (isQuill(q) && rememberQuill) rememberQuill(q);
          openFilePicker();
        },
      },
    },
    clipboard: {
      matchers: [
        // 1) Tüm IMG'leri blokla (paste/drop)
        ["IMG", () => ({ ops: [] })],
        // 2) Genel element → attr whitelist
        [Node.ELEMENT_NODE, (_node: Node, delta: any) => sanitizeDelta(delta)],
      ],
    },
  } as const;
}
