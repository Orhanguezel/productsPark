// =============================================================
// FILE: src/pages/Categories.tsx
// FINAL — Categories List (same SEO pattern as Blog, no duplication)
// - GlobalSeo is handled in App.tsx
// - Route-level: title/description (site_settings), canonical (/kategoriler)
// - If query params exist => robots: noindex,follow
// - ItemList JSON-LD for main categories (guarded origin)
// - No fallback images: render only if API provides image_url
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

import { useSeoSettings } from '@/hooks/useSeoSettings';
import { useListCategoriesQuery } from '@/integrations/hooks';

import type { Category, CategoryListParams, PageState } from '@/integrations/types';
import { hasText, nonEmpty, imgSrc, getOrigin } from '@/integrations/types';

const colorMap: Record<string, string> = {
  steam: 'from-blue-500 to-cyan-500',
  epic: 'from-purple-500 to-pink-500',
  ubisoft: 'from-indigo-500 to-blue-500',
  software: 'from-green-500 to-emerald-500',
  design: 'from-orange-500 to-red-500',
  development: 'from-gray-700 to-gray-900',
  music: 'from-pink-500 to-rose-500',
  streaming: 'from-red-500 to-orange-500',
  education: 'from-cyan-500 to-blue-500',
  other: 'from-teal-500 to-green-500',
};

function parseBoolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off'].includes(s)) return false;
  return undefined;
}

/** exactOptionalPropertyTypes için: undefined olanları objeden at */
function cleanParams<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) out[k] = v;
  }
  return out as Partial<T>;
}

export default function Categories() {
  const navigate = useNavigate();
  const [sp] = useSearchParams();
  const { settings } = useSeoSettings();

  // URL → param
  const only = sp.get('only'); // "main" | "sub" | null
  const qRaw = sp.get('q');
  const q = qRaw && qRaw.trim() ? qRaw.trim() : undefined;

  const parentInUrl = sp.get('parent_id');
  const is_featured = parseBoolParam(sp.get('featured'));

  const sort = (sp.get('sort') as CategoryListParams['sort']) || 'display_order';
  const order = (sp.get('order') as CategoryListParams['order']) || 'asc';

  /**
   * only=main => parent_id = null
   * only=sub  => backend non_null desteklemiyorsa param göndermeyip FE filtreleyeceğiz
   * aksi      => url parent_id varsa gönder
   */
  const parent_id: CategoryListParams['parent_id'] | undefined =
    only === 'main' ? null : parentInUrl ? parentInUrl : undefined;

  const queryParams = useMemo(() => {
    const base: CategoryListParams = {
      ...(q ? { q } : {}),
      ...(parent_id !== undefined ? { parent_id } : {}),
      is_active: true,
      ...(typeof is_featured === 'boolean' ? { is_featured } : {}),
      sort,
      order,
    };

    return cleanParams(base) as CategoryListParams;
  }, [q, parent_id, is_featured, sort, order]);

  const { data = [], isFetching, isError } = useListCategoriesQuery(queryParams);

  const pageState: PageState = useMemo(() => {
    if (isFetching) return 'loading';
    if (isError) return 'error';
    if (!data.length) return 'empty';
    return 'ready';
  }, [isFetching, isError, data.length]);

  // FE filtre (BE non_null yoksa):
  const rows = useMemo(() => {
    if (only === 'sub') return data.filter((c) => c.parent_id !== null);
    if (only === 'main') return data.filter((c) => c.parent_id === null);
    return data;
  }, [data, only]);

  // ItemList: sadece ana kategoriler
  const mainCats = useMemo(() => rows.filter((c) => c.parent_id == null), [rows]);

  const subsByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    rows.forEach((c) => {
      if (c.parent_id) {
        const arr = map.get(c.parent_id) ?? [];
        arr.push(c);
        map.set(c.parent_id, arr);
      }
    });
    return map;
  }, [rows]);

  const hasParams = Array.from(sp.keys()).length > 0;

  // SEO (no fallbacks)
  const seoTitle = nonEmpty(settings?.seo_categories_title);
  const seoDesc = nonEmpty(settings?.seo_categories_description);

  const canonicalUrl = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}/kategoriler` : '';
  }, []);

  const itemListSchema = useMemo(() => {
    const origin = getOrigin();
    if (!origin) return null;
    if (!mainCats.length) return null;

    return {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: mainCats.map((category, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Thing',
          name: category.name,
          url: `${origin}/kategoriler/${category.slug}`,
          ...(hasText(category.description) ? { description: category.description } : {}),
        },
      })),
    };
  }, [mainCats]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Same pattern as Blog: canonical + optional title/description, plus conditional robots + json-ld */}
      {canonicalUrl || seoTitle || seoDesc || hasParams || itemListSchema ? (
        <Helmet>
          {seoTitle ? <title>{seoTitle}</title> : null}
          {seoDesc ? <meta name="description" content={seoDesc} /> : null}
          {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
          {hasParams ? <meta name="robots" content="noindex,follow" /> : null}
          {itemListSchema ? (
            <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
          ) : null}
        </Helmet>
      ) : null}

      <Navbar />

      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Ürün Kategorileri</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tüm Kategoriler</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Dijital ürünlerimizi kategorilere göre keşfedin
          </p>
        </div>
      </section>

      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {pageState === 'loading' ? <div className="text-center py-12">Yükleniyor...</div> : null}

          {pageState === 'error' ? (
            <div className="text-center py-12 text-muted-foreground">
              Kategoriler yüklenirken bir hata oluştu.
            </div>
          ) : null}

          {pageState === 'empty' ? (
            <div className="text-center py-12 text-muted-foreground">
              Şu anda görüntülenecek kategori bulunamadı.
            </div>
          ) : null}

          {pageState === 'ready' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rows.map((category) => {
                const color = colorMap[category.slug] || 'from-gray-500 to-gray-700';
                const subs = subsByParent.get(category.id) ?? [];

                const image = imgSrc(category.image_url);
                const alt = nonEmpty(category.image_alt) || category.name;

                return (
                  <Card
                    key={category.id}
                    className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                    onClick={() => navigate(`/kategoriler/${category.slug}`)}
                    role="button"
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      {image ? (
                        <img
                          src={image}
                          alt={alt}
                          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                          loading="lazy"
                        />
                      ) : null}

                      <div
                        className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${color}`}
                      />
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{category.name}</h3>
                      {hasText(category.description) ? (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      ) : null}
                    </CardContent>

                    <CardFooter className="p-4 pt-0">
                      <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all w-full justify-between">
                        <span>Ürünleri Görüntüle</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardFooter>

                    {subs.length > 0 ? (
                      <div className="px-4 pb-4 text-xs text-muted-foreground">
                        {subs
                          .slice(0, 3)
                          .map((s) => s.name)
                          .join(' • ')}
                        {subs.length > 3 ? ' • …' : ''}
                      </div>
                    ) : null}
                  </Card>
                );
              })}
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </div>
  );
}
