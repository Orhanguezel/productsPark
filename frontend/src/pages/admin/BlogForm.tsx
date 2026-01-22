// =============================================================
// FILE: src/pages/admin/BlogForm.tsx
// FINAL — Admin Blog Form (SEO meta uyumlu, no mapper duplication)
// - FE only builds UpsertBlogBody (NO toBlogUpsertApiBody here)
// - Single source of truth: RTK endpoints map via toBlogUpsertApiBody
// - exactOptionalPropertyTypes friendly: omit untouched optional fields; never assign undefined
// - meta auto-fill (title/excerpt/content) until user touches meta fields
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useGetBlogPostAdminByIdQuery,
  useCreateBlogPostAdminMutation,
  useUpdateBlogPostAdminMutation,
  useCreateAssetAdminMutation,
} from '@/integrations/hooks';

import type { BlogPost, UpsertBlogBody } from '@/integrations/types';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import '@/styles/richtext.css';

/* ---------------- local-only UI helpers ---------------- */

const slugify = (v: string) =>
  (v || '')
    .toLowerCase()
    .trim()
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ı/g, 'i')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const stripHtml = (s: string) =>
  (s || '')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const escapeHtml = (s: string) =>
  (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toNumberSafe = (v: unknown) => {
  const n = Number(String(v ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const trimOrEmpty = (v: string) => (v || '').trim();

const toNullIfEmpty = (v: string): string | null => {
  const t = trimOrEmpty(v);
  return t ? t : null;
};

/* ---------------- state ---------------- */

type FormState = {
  title: string;
  slug: string;

  excerpt: string;
  content_html: string;

  author_name: string;

  image_url: string;
  image_asset_id: string;
  image_alt: string;

  meta_title: string;
  meta_description: string;

  is_published: boolean;

  category: string;
  is_featured: boolean;

  // UI-only (backend’de yoksa göndermiyoruz)
  display_order: number;
};

const initialState: FormState = {
  title: '',
  slug: '',

  excerpt: '',
  content_html: '',

  author_name: 'Admin',

  image_url: '',
  image_asset_id: '',
  image_alt: '',

  meta_title: '',
  meta_description: '',

  is_published: false,

  category: '',
  is_featured: false,

  display_order: 0,
};

function fromPostToForm(p: BlogPost): FormState {
  return {
    title: p.title ?? '',
    slug: p.slug ?? '',

    excerpt: p.excerpt ?? '',
    content_html: p.content ?? '',

    author_name: p.author_name ?? 'Admin',

    image_url: p.image_url ?? '',
    image_asset_id: p.image_asset_id ?? '',
    image_alt: p.image_alt ?? '',

    meta_title: p.meta_title ?? '',
    meta_description: p.meta_description ?? '',

    is_published: !!p.is_published,

    category: p.category ?? '',
    is_featured: !!p.is_featured,

    display_order: toNumberSafe(p.display_order),
  };
}

/* ---------------- touched bookkeeping ---------------- */

type TouchKey =
  | 'slug'
  | 'excerpt'
  | 'content_html'
  | 'author_name'
  | 'category'
  | 'image_url'
  | 'image_asset_id'
  | 'image_alt'
  | 'meta_title'
  | 'meta_description'
  | 'is_published'
  | 'is_featured'
  | 'display_order';

function makeTouchedMap() {
  const m: Record<TouchKey, boolean> = {
    slug: false,
    excerpt: false,
    content_html: false,
    author_name: false,
    category: false,
    image_url: false,
    image_asset_id: false,
    image_alt: false,
    meta_title: false,
    meta_description: false,
    is_published: false,
    is_featured: false,
    display_order: false,
  };
  return m;
}

/**
 * Build UpsertBlogBody WITHOUT undefined assignment.
 * - create: include most fields (nulls allowed) except those truly empty & not meaningful
 * - update: include ONLY touched optional fields to prevent accidental clears
 */
function buildUpsertBody(args: {
  s: FormState;
  isEdit: boolean;
  touched: Record<TouchKey, boolean>;
}): UpsertBlogBody {
  const { s, isEdit, touched } = args;

  const title = trimOrEmpty(s.title);
  const computedSlug = trimOrEmpty(s.slug) || slugify(title);

  const out: UpsertBlogBody = { title };

  // slug (UI required). Update’te de gönderiyoruz (URL/preview ve backend davranışı için tutarlı)
  if (computedSlug) out.slug = computedSlug;

  // booleans: her zaman gönder
  out.is_published = s.is_published;
  out.is_featured = s.is_featured;

  // ----- helpers: update’te sadece touched ise gönder -----
  const includeIfTouched = <K extends keyof UpsertBlogBody>(
    key: K,
    isTouched: boolean,
    value: UpsertBlogBody[K],
  ) => {
    if (!isEdit) {
      // create: her alanı göndermek problem değil (backend optional+nullable)
      // ama içerik/özet gibi alanlarda null gönderebiliriz.
      (out as Record<string, unknown>)[key as string] = value as unknown;
      return;
    }
    if (isTouched) (out as Record<string, unknown>)[key as string] = value as unknown;
  };

  // excerpt/content: create’te null gönder; update’te sadece dokunulduysa (boşsa null ile temizler)
  includeIfTouched('excerpt', touched.excerpt, toNullIfEmpty(s.excerpt));
  includeIfTouched('content', touched.content_html, toNullIfEmpty(s.content_html));

  // category
  includeIfTouched('category', touched.category, toNullIfEmpty(s.category));

  // images (legacy mapping RTK’de yapılacak)
  includeIfTouched('image_url', touched.image_url, toNullIfEmpty(s.image_url));
  includeIfTouched('image_asset_id', touched.image_asset_id, toNullIfEmpty(s.image_asset_id));
  includeIfTouched('image_alt', touched.image_alt, toNullIfEmpty(s.image_alt));

  // author
  includeIfTouched('author_name', touched.author_name, toNullIfEmpty(s.author_name));

  // meta
  includeIfTouched('meta_title', touched.meta_title, toNullIfEmpty(s.meta_title));
  includeIfTouched('meta_description', touched.meta_description, toNullIfEmpty(s.meta_description));

  // display_order backend destekliyorsa aç (touched + number)
  // if (!isEdit || touched.display_order) out.display_order = Number.isFinite(s.display_order) ? s.display_order : 0;

  return out;
}

export default function BlogForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormState>(initialState);

  const slugTouchedRef = useRef(false);

  const metaTitleTouchedRef = useRef(false);
  const metaDescTouchedRef = useRef(false);

  const touchedRef = useRef<Record<TouchKey, boolean>>(makeTouchedMap());

  const quillRef = useRef<ReactQuill | null>(null);
  const inlineImageUploadRef = useRef<(file: File) => Promise<void> | void>();

  const { data: postData, isFetching } = useGetBlogPostAdminByIdQuery(id as string, {
    skip: !isEdit,
  });

  const [createPost, { isLoading: creating }] = useCreateBlogPostAdminMutation();
  const [updatePost, { isLoading: updating }] = useUpdateBlogPostAdminMutation();
  const [uploadAsset, { isLoading: uploading }] = useCreateAssetAdminMutation();

  const loading = isFetching || creating || updating;

  const markTouched = (k: TouchKey) => {
    touchedRef.current[k] = true;
  };

  const updateField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // ---- edit modunda veriyi forma bas ----
  useEffect(() => {
    if (!postData) return;

    const next = fromPostToForm(postData);

    // UI convenience: meta boşsa otomatik doldur (ama touched sayma)
    if (!trimOrEmpty(next.meta_title)) next.meta_title = trimOrEmpty(next.title);
    if (!trimOrEmpty(next.meta_description)) {
      const fallback = trimOrEmpty(next.excerpt) || stripHtml(next.content_html);
      next.meta_description = fallback.slice(0, 500);
    }

    setFormData(next);

    slugTouchedRef.current = true;

    metaTitleTouchedRef.current = false;
    metaDescTouchedRef.current = false;

    touchedRef.current = makeTouchedMap();
  }, [postData]);

  // ---- title değişince slug auto (elle dokunulmadıysa) ----
  useEffect(() => {
    if (!formData.title) return;
    if (slugTouchedRef.current) return;
    setFormData((prev) => ({ ...prev, slug: slugify(prev.title) }));
  }, [formData.title]);

  // ---- meta auto-fill (user dokunmadıysa) ----
  useEffect(() => {
    if (metaTitleTouchedRef.current) return;
    setFormData((prev) => {
      if (trimOrEmpty(prev.meta_title)) return prev;
      return { ...prev, meta_title: trimOrEmpty(prev.title) };
    });
  }, [formData.title]);

  useEffect(() => {
    if (metaDescTouchedRef.current) return;
    setFormData((prev) => {
      if (trimOrEmpty(prev.meta_description)) return prev;
      const fallback = trimOrEmpty(prev.excerpt) || stripHtml(prev.content_html);
      return { ...prev, meta_description: fallback.slice(0, 500) };
    });
  }, [formData.excerpt, formData.content_html]);

  /* --------------- Cover upload --------------- */
  const handleCoverUpload = async (file: File) => {
    try {
      const folderSafe = (formData.slug || slugify(formData.title) || 'posts').replace(
        /[^a-z0-9/_-]/g,
        '',
      );
      const folder = `blog/${folderSafe}`;

      const asset = await uploadAsset({
        file,
        bucket: 'blog',
        folder,
        metadata: { module: 'blog', kind: 'cover' },
      }).unwrap();

      setFormData((prev) => ({
        ...prev,
        image_url: asset.url ?? prev.image_url,
        image_asset_id: asset.id ?? prev.image_asset_id,
      }));

      // upload ile değişti → touched say
      markTouched('image_url');
      markTouched('image_asset_id');

      toast.success('Kapak görseli yüklendi.');
    } catch (err) {
      console.error(err);
      toast.error('Görsel yüklenirken hata oluştu.');
    }
  };

  /* --------------- Quill inline image --------------- */
  const insertImageIntoQuill = (url: string, alt?: string) => {
    const q = quillRef.current?.getEditor();
    if (!q) return;

    const range = q.getSelection(true);
    const index = range ? range.index : q.getLength();

    if (alt && alt.trim()) {
      const safeAlt = escapeHtml(alt.trim());
      const html = `<img src="${url}" alt="${safeAlt}" />`;
      q.clipboard.dangerouslyPasteHTML(index, html);
      q.setSelection(index + 1, 0);
      return;
    }

    q.insertEmbed(index, 'image', url, 'user');
    q.setSelection(index + 1, 0);
  };

  const handleInlineImageUpload = async (file: File) => {
    try {
      const folderSafe = (formData.slug || slugify(formData.title) || 'posts').replace(
        /[^a-z0-9/_-]/g,
        '',
      );
      const folder = `blog/${folderSafe}/inline`;

      const asset = await uploadAsset({
        file,
        bucket: 'blog',
        folder,
        metadata: { module: 'blog', kind: 'inline' },
      }).unwrap();

      const alt = window.prompt('Görsel alt metni (SEO için opsiyonel):') || '';
      if (asset.url) insertImageIntoQuill(asset.url, alt);

      toast.success('Görsel eklendi.');
    } catch (err) {
      console.error(err);
      toast.error('İçerik görseli yüklenirken hata oluştu.');
    }
  };

  useEffect(() => {
    inlineImageUploadRef.current = handleInlineImageUpload;
  }, [handleInlineImageUpload]);

  const quillModules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ color: [] }, { background: [] }],
          ['link', 'image'],
          ['clean'],
        ],
        handlers: {
          image: () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = async () => {
              const file = input.files?.[0] || null;
              if (!file) return;
              await inlineImageUploadRef.current?.(file);
            };
            input.click();
          },
        },
      },
    }),
    [],
  );

  const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'color',
    'background',
    'link',
    'image',
  ];

  /* --------------- SEO preview --------------- */
  const effectiveSlug = (formData.slug || slugify(formData.title) || 'blog-yazisi').trim();
  const seoTitle = (formData.meta_title || formData.title || '').trim();
  const rawDesc = (
    formData.meta_description ||
    formData.excerpt ||
    stripHtml(formData.content_html)
  ).trim();
  const seoDesc = rawDesc.slice(0, 160);

  const wordCount = useMemo(() => {
    return stripHtml(formData.content_html).split(/\s+/).filter(Boolean).length;
  }, [formData.content_html]);

  /* --------------- Submit --------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = trimOrEmpty(formData.title);
    const slug = trimOrEmpty(formData.slug) || slugify(title);

    if (!title) {
      toast.error('Başlık zorunludur.');
      return;
    }
    if (!slug) {
      toast.error('Slug üretilemedi. Başlık veya slug giriniz.');
      return;
    }

    const body = buildUpsertBody({
      s: { ...formData, title, slug },
      isEdit,
      touched: touchedRef.current,
    });

    try {
      if (isEdit && id) {
        await updatePost({ id, body }).unwrap();
        toast.success('Blog yazısı güncellendi.');
      } else {
        await createPost(body).unwrap();
        toast.success('Blog yazısı oluşturuldu.');
      }
      navigate('/admin/blog');
    } catch (err) {
      console.error(err);
      toast.error('Kaydedilirken bir hata oluştu.');
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Blog Yazısını Düzenle' : 'Yeni Blog Yazısı'}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/blog')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* FORM */}
          <Card className="lg:col-span-7">
            <CardHeader>
              <CardTitle>Blog Yazısı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title / Slug */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Başlık *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug (URL) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) => {
                        slugTouchedRef.current = true;
                        markTouched('slug');
                        updateField('slug', e.target.value);
                      }}
                      required
                    />
                    <p className="text-xs text-muted-foreground">site.com/{effectiveSlug}</p>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Özet</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) => {
                      markTouched('excerpt');
                      updateField('excerpt', e.target.value);
                    }}
                    rows={2}
                  />
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <Label>İçerik (HTML) *</Label>
                  <div className="overflow-hidden rounded border">
                    <ReactQuill
                      ref={quillRef as unknown as React.RefObject<ReactQuill>}
                      theme="snow"
                      value={formData.content_html}
                      onChange={(value) => {
                        markTouched('content_html');
                        updateField('content_html', value);
                      }}
                      className="bg-background richtext"
                      modules={quillModules}
                      formats={quillFormats}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Metin, başlık, liste, bağlantı ve <strong>görsel</strong> ekleyebilirsiniz.
                  </p>
                </div>

                {/* Cover */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="image_upload">Kapak Fotoğrafı</Label>
                    <Input
                      id="image_upload"
                      type="file"
                      accept="image/*"
                      disabled={uploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        await handleCoverUpload(file);
                      }}
                    />
                    {formData.image_url ? (
                      <img
                        src={formData.image_url}
                        alt={formData.image_alt || 'Kapak'}
                        className="mt-2 w-full max-w-md rounded border object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image_alt">Kapak Alt Metni (SEO)</Label>
                    <Input
                      id="image_alt"
                      value={formData.image_alt}
                      onChange={(e) => {
                        markTouched('image_alt');
                        updateField('image_alt', e.target.value);
                      }}
                      placeholder='Örn: "Blog yazısı kapak görseli"'
                    />
                    {formData.image_asset_id ? (
                      <p className="text-xs text-muted-foreground">
                        Asset ID: {formData.image_asset_id}
                      </p>
                    ) : null}
                  </div>
                </div>

                {/* Author / Category */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="author_name">Yazar Adı *</Label>
                    <Input
                      id="author_name"
                      value={formData.author_name}
                      onChange={(e) => {
                        markTouched('author_name');
                        updateField('author_name', e.target.value);
                      }}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori (opsiyonel)</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => {
                        markTouched('category');
                        updateField('category', e.target.value);
                      }}
                      placeholder="Genel"
                    />
                  </div>
                </div>

                {/* SEO Meta */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">SEO Meta</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="meta_title">Meta Başlık</Label>
                      <Input
                        id="meta_title"
                        value={formData.meta_title}
                        onChange={(e) => {
                          metaTitleTouchedRef.current = true;
                          markTouched('meta_title');
                          updateField('meta_title', e.target.value);
                        }}
                        placeholder="Arama sonuçlarında görünen başlık"
                      />
                      <p className="text-xs text-muted-foreground">
                        Boş bırakırsanız başlık kullanılır.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meta_description">Meta Açıklama</Label>
                      <Textarea
                        id="meta_description"
                        value={formData.meta_description}
                        onChange={(e) => {
                          metaDescTouchedRef.current = true;
                          markTouched('meta_description');
                          updateField('meta_description', e.target.value);
                        }}
                        rows={3}
                        placeholder="Arama sonuçlarında görünen açıklama (öneri: 120–160 karakter)"
                      />
                      <div className="text-xs text-muted-foreground flex justify-between">
                        <span>Boş bırakırsanız özet/içerikten üretilecek.</span>
                        <span>{(formData.meta_description || '').length}/160</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Publish + Featured + Order */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_published"
                        checked={!!formData.is_published}
                        onCheckedChange={(checked) => {
                          markTouched('is_published');
                          updateField('is_published', checked);
                        }}
                      />
                      <Label htmlFor="is_published">Yayınla</Label>
                    </div>
                    <div className="text-xs text-muted-foreground">{wordCount} kelime</div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is_featured"
                        checked={!!formData.is_featured}
                        onCheckedChange={(checked) => {
                          markTouched('is_featured');
                          updateField('is_featured', checked);
                        }}
                      />
                      <Label htmlFor="is_featured">Öne Çıkar</Label>
                    </div>
                    <div className="text-xs text-muted-foreground">opsiyonel</div>
                  </div>

                  <div className="space-y-2 rounded-lg border p-3">
                    <Label htmlFor="display_order">Sıra</Label>
                    <Input
                      id="display_order"
                      type="number"
                      value={String(formData.display_order ?? 0)}
                      onChange={(e) => {
                        markTouched('display_order');
                        updateField('display_order', toNumberSafe(e.target.value));
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Backend desteklemiyorsa API’ye gönderilmez.
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => navigate('/admin/blog')}>
                    İptal
                  </Button>
                  <Button type="submit" className="gradient-primary" disabled={loading}>
                    {loading ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Oluştur'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* PREVIEW */}
          <Card className="lg:col-span-5">
            <CardHeader>
              <CardTitle>Önizleme</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-lg border p-4">
                <div className="text-xs text-muted-foreground break-words overflow-wrap:anywhere">
                  {(typeof window !== 'undefined' ? window.location.origin : 'site.com') +
                    `/${effectiveSlug}`}
                </div>
                <div className="mt-1 text-base font-semibold leading-snug break-words overflow-wrap:anywhere">
                  {seoTitle || 'Meta başlık (örnek)'}
                </div>
                <div className="mt-1 text-sm text-muted-foreground break-words overflow-wrap:anywhere">
                  {seoDesc || 'Meta açıklama veya içerik özeti burada görünecek.'}
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-3 text-sm font-medium">İçerik</div>
                <div className="prose max-w-none p-4 break-words overflow-wrap:anywhere">
                  <article
                    dangerouslySetInnerHTML={{
                      __html: formData.content_html || '<p>Önizleme yok.</p>',
                    }}
                  />
                </div>
              </div>

              <div className="rounded-lg border">
                <div className="border-b p-3 text-sm font-medium">Kapak Görseli</div>
                <div className="p-4">
                  {formData.image_url ? (
                    <img
                      src={formData.image_url}
                      alt={formData.image_alt || 'Kapak'}
                      className="w-full max-w-lg rounded border object-cover"
                    />
                  ) : (
                    <p className="text-sm text-muted-foreground">Görsel seçilmedi.</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
