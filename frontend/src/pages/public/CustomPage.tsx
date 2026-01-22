// =============================================================
// FILE: src/pages/custom/CustomPage.tsx
// FINAL — Custom page renderer (RTK + CustomPageView aligned, SEO via SeoHelmet)
// - Uses image_url / image_alt (CustomPageView standard)
// - Route-level SEO via SeoHelmet (no Helmet here)
// - Canonical/hreflang are handled globally by RouteSeoLinks
// - noindex when query params exist
// - Meta description: meta_description OR stripped/truncated content
// - No duplicate OG/Twitter defaults: GlobalSeo already provides site-wide defaults (og_default_image etc.)
// =============================================================
import { useMemo } from 'react';
import { useParams, useSearchParams, useLocation } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import SeoHelmet from '@/components/seo/SeoHelmet';

import { useGetCustomPageBySlugQuery } from '@/integrations/hooks';
import type { PageState } from '@/integrations/types';
import { nonEmpty, imgSrc, getOrigin } from '@/integrations/types';
import { stripHtmlToText, truncateText } from '@/integrations/types';

function getHttpStatus(err: unknown): number | null {
  if (!err || typeof err !== 'object') return null;
  const anyErr = err as { status?: unknown; originalStatus?: unknown };
  const s = anyErr.status ?? anyErr.originalStatus;
  if (typeof s === 'number') return s;
  if (typeof s === 'string') {
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function computeMetaDescription(args: {
  meta_description?: string | null;
  content?: string | null;
}): string {
  const fromMeta = nonEmpty(args.meta_description);
  if (fromMeta) return fromMeta;

  const plain = args.content ? stripHtmlToText(args.content) : '';
  const trimmed = nonEmpty(plain);
  return trimmed ? truncateText(trimmed, 160) : '';
}

export default function CustomPage() {
  const { slug } = useParams<{ slug?: string }>();
  const [searchParams] = useSearchParams();
  const loc = useLocation();

  const hasParams = useMemo(() => Array.from(searchParams.keys()).length > 0, [searchParams]);

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = useGetCustomPageBySlugQuery({ slug: slug as string }, { skip: !slug });

  const status = useMemo(() => getHttpStatus(error), [error]);
  const notFound = isError && status === 404;

  const pageState: PageState = useMemo(() => {
    if (!slug) return 'empty';
    if (isLoading) return 'loading';
    if (notFound) return 'empty';
    if (isError) return 'error';
    if (!page) return 'empty';
    return 'ready';
  }, [slug, isLoading, notFound, isError, page]);

  // Route URL for OG (canonical is global via RouteSeoLinks)
  // NOTE: should NOT include querystring for SEO identity
  const url = useMemo(() => {
    const origin = getOrigin();
    const path = nonEmpty(loc?.pathname) || '';
    return origin && path ? `${origin}${path}` : '';
  }, [loc?.pathname]);

  const metaTitle = useMemo(() => {
    return nonEmpty(page?.meta_title) || nonEmpty(page?.title) || '';
  }, [page?.meta_title, page?.title]);

  const metaDescription = useMemo(() => {
    return computeMetaDescription({
      meta_description: page?.meta_description ?? null,
      content: page?.content ?? null,
    });
  }, [page?.meta_description, page?.content]);

  // Only page image here; global defaults (og_default_image/twitter_card) are handled in GlobalSeo
  const coverUrl = useMemo(() => imgSrc(page?.image_url) || null, [page?.image_url]);
  const coverAlt = useMemo(
    () => nonEmpty(page?.image_alt) || nonEmpty(page?.title) || 'Kapak görseli',
    [page?.image_alt, page?.title],
  );

  // If query params exist, explicitly noindex this URL variant
  const robots = hasParams ? 'noindex,follow' : null;

  const renderMain = () => {
    if (pageState === 'loading') {
      return (
        <main className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </main>
      );
    }

    if (pageState === 'error') {
      return (
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Hata</h1>
            <p className="text-muted-foreground">Sayfa yüklenirken bir hata oluştu.</p>
          </div>
        </main>
      );
    }

    if (pageState === 'empty') {
      return (
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground">Sayfa bulunamadı</p>
          </div>
        </main>
      );
    }

    // ready
    return (
      <main className="flex-grow container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={coverAlt}
              className="w-full h-64 object-cover rounded-lg border mb-8"
              loading="lazy"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : null}

          <h1 className="text-4xl font-bold mb-8">{page?.title}</h1>

          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: page?.content ?? '' }}
          />
        </article>
      </main>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Route-level SEO (no fallbacks): SeoHelmet handles OG/Twitter basics; canonical is global */}
      <SeoHelmet
        title={metaTitle || null}
        description={metaDescription || null}
        ogType="article"
        url={url || null}
        imageUrl={coverUrl}
        robots={robots}
      />

      <Navbar />
      {renderMain()}
      <Footer />
    </div>
  );
}
