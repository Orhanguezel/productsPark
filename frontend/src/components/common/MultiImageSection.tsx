// =============================================================
// FILE: src/components/common/MultiImageSection.tsx
// FINAL — Multi gallery images (URL + upload) + reorder (index-safe)
// - Controlled: urls: string[] , assetIds: (string|null)[] | null  (index preserved)
// - Preview rule (FIX): Prefer URL preview ALWAYS if url exists
//                       Fallback to ThumbById only when url missing
// - Cache busting for URL preview
// - URL text: break-words
// - exactOptionalPropertyTypes-safe
// =============================================================

'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ImagePlus, Trash2, ArrowUp, ArrowDown, X } from 'lucide-react';
import { Section } from './Section';
import { ThumbById } from './ThumbById';

export type GalleryItem = {
  url: string;
  asset_id?: string | null;
};

type GalleryRow = {
  url: string;
  assetId: string | null;
};

export type MultiImageSectionProps = {
  title?: string;

  /** Controlled values */
  urls: string[];
  assetIds?: (string | null)[] | null;

  /** UX */
  saving?: boolean;
  accept?: string;
  inputId?: string;

  /** Storage preview toggle (still shown as fallback only) */
  showStoragePreview?: boolean;

  /** Upload callback */
  onUpload: (files: File[]) => Promise<GalleryItem[]> | GalleryItem[];

  /** Controlled setter (index preserved) */
  onChange: (next: { urls: string[]; assetIds: (string | null)[] | null }) => void;
};

const clean = (v: unknown): string => String(v ?? '').trim();

const normalizeRows = (
  urls: string[],
  assetIds: (string | null)[] | null | undefined,
): GalleryRow[] => {
  const a = Array.isArray(assetIds) ? assetIds : [];
  const rows: GalleryRow[] = [];

  for (let i = 0; i < urls.length; i++) {
    const u = clean(urls[i]);
    if (!u) continue;

    const aid = i < a.length && a[i] ? clean(a[i]) : null;
    rows.push({ url: u, assetId: aid });
  }

  // ❗ Dedup yok: index/assetId eşleşmesi bozulmasın
  return rows;
};

const withCacheBuster = (url: string, nonce: number): string => {
  const u = clean(url);
  if (!u) return '';
  const sep = u.includes('?') ? '&' : '?';
  return `${u}${sep}v=${encodeURIComponent(String(nonce))}`;
};

export function MultiImageSection({
  title = 'Ürün Galerisi (çoklu görsel)',
  urls,
  assetIds,
  saving = false,
  accept = 'image/*',
  inputId = 'file-gallery',
  showStoragePreview = true,
  onUpload,
  onChange,
}: MultiImageSectionProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [urlDraft, setUrlDraft] = React.useState('');

  // ✅ local cache-buster
  const [previewNonce, setPreviewNonce] = React.useState<number>(() => Date.now());

  React.useEffect(() => {
    setPreviewNonce(Date.now());
  }, [urls, assetIds]);

  const rows = React.useMemo(() => normalizeRows(urls ?? [], assetIds ?? null), [urls, assetIds]);

  const commit = React.useCallback(
    (nextRows: GalleryRow[]) => {
      const cleaned = nextRows
        .map((r) => ({
          url: clean(r.url),
          assetId: r.assetId ? clean(r.assetId) : null,
        }))
        .filter((r) => Boolean(r.url));

      const nextUrls = cleaned.map((r) => r.url);
      const nextAssetIds = cleaned.map((r) => (r.assetId ? r.assetId : null));

      onChange({
        urls: nextUrls,
        assetIds: nextAssetIds.some(Boolean) ? nextAssetIds : null,
      });
    },
    [onChange],
  );

  const openPicker = () => fileInputRef.current?.click();

  const handleFiles: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const files = Array.from(e.currentTarget.files ?? []);
    e.currentTarget.value = '';
    if (!files.length) return;

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (!imageFiles.length) return;

    const uploaded = await onUpload(imageFiles);

    const mapped: GalleryRow[] = (uploaded ?? [])
      .map((x) => {
        const u = clean(x?.url);
        if (!u) return null;
        const aid = x?.asset_id ? clean(x.asset_id) : null;
        return { url: u, assetId: aid };
      })
      .filter((x): x is GalleryRow => Boolean(x));

    if (!mapped.length) return;

    commit([...rows, ...mapped]);
  };

  const addByUrl = () => {
    const u = clean(urlDraft);
    if (!u) return;
    commit([...rows, { url: u, assetId: null }]);
    setUrlDraft('');
  };

  const removeAt = (idx: number) => {
    if (idx < 0 || idx >= rows.length) return;
    commit(rows.filter((_r, i) => i !== idx));
  };

  const move = (from: number, to: number) => {
    if (from < 0 || from >= rows.length) return;
    if (to < 0 || to >= rows.length) return;

    const next = [...rows];
    const [picked] = next.splice(from, 1);
    if (!picked) return;
    next.splice(to, 0, picked);
    commit(next);
  };

  return (
    <Section
      title={title}
      action={
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            className="hidden"
            accept={accept}
            multiple
            onChange={handleFiles}
          />

          <Button type="button" onClick={openPicker} className="inline-flex items-center gap-2">
            <ImagePlus className="h-4 w-4" />
            Galeri Yükle
          </Button>

          {saving ? <span className="text-xs text-muted-foreground">Kaydediliyor…</span> : null}
        </div>
      }
    >
      <div className="space-y-4">
        {/* URL ile ekleme */}
        <div className="space-y-2">
          <Label>Galeri URL ekle (opsiyonel)</Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://…"
              value={urlDraft}
              onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addByUrl();
                }
              }}
            />
            {urlDraft ? (
              <Button type="button" variant="ghost" onClick={() => setUrlDraft('')} title="Temizle">
                <X className="h-4 w-4" />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={addByUrl}
              disabled={!clean(urlDraft)}
            >
              Ekle
            </Button>
          </div>
        </div>

        {/* Liste */}
        {rows.length ? (
          <div className="grid grid-cols-1 gap-3">
            {rows.map((r, idx) => {
              const url = clean(r.url);
              const hasUrl = Boolean(url);
              const hasStorage = Boolean(r.assetId);
              const canShowStorage = !!showStoragePreview && hasStorage;

              return (
                <div
                  key={`${r.url}-${idx}`}
                  className="flex flex-col sm:flex-row gap-3 rounded-md border p-3"
                >
                  {/* ✅ Preview: URL primary, ThumbById fallback */}
                  <div className="flex gap-3">
                    {hasUrl ? (
                      <img
                        src={withCacheBuster(url, previewNonce)}
                        alt={`gallery-${idx + 1}`}
                        className="h-24 w-40 rounded border object-cover"
                        loading="lazy"
                      />
                    ) : canShowStorage ? (
                      <div className="w-[160px]">
                        <div className="text-xs text-muted-foreground mb-1 truncate">
                          Storage ID: {r.assetId}
                        </div>
                        <ThumbById id={r.assetId as string} />
                      </div>
                    ) : (
                      <div className="h-24 w-40 rounded border flex items-center justify-center text-xs text-muted-foreground">
                        Önizleme yok
                      </div>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex-1 min-w-0 space-y-1">
                    {r.assetId ? (
                      <div className="text-xs text-muted-foreground truncate">
                        Storage ID: {r.assetId}
                      </div>
                    ) : null}

                    <div className="text-xs text-muted-foreground">URL</div>
                    <div className="text-sm break-words">{r.url}</div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => move(idx, idx - 1)}
                      disabled={idx === 0}
                      title="Yukarı"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => move(idx, idx + 1)}
                      disabled={idx === rows.length - 1}
                      title="Aşağı"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeAt(idx)}
                      className="text-rose-600"
                      title="Sil"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Henüz galeri görseli eklenmedi.</div>
        )}
      </div>
    </Section>
  );
}
