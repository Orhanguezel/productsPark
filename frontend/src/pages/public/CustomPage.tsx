// =============================================================
// FILE: src/pages/custom/CustomPage.tsx
// =============================================================
import { useMemo } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

import { useGetCustomPageBySlugQuery } from "@/integrations/metahub/rtk/endpoints/custom_pages.endpoints";

function stripHtml(s: string) {
  return (s || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}
function truncate(s: string, n: number) {
  if (!s) return s;
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default function CustomPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();
  const hasParams = useMemo(() => Array.from(searchParams.keys()).length > 0, [searchParams]);

  const {
    data: page,
    isLoading,
    isError,
    error,
  } = useGetCustomPageBySlugQuery(
    { slug: slug as string, locale: undefined },
    { skip: !slug }
  );

  const notFound = isError && (error as any)?.status === 404;

  const metaTitle = page?.meta_title?.trim() || page?.title || "";
  const metaDescription =
    (page?.meta_description?.trim() ||
      (page?.content ? truncate(stripHtml(page.content), 160) : "")) || "";

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <p>Yükleniyor...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!slug || notFound || !page) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">404</h1>
            <p className="text-muted-foreground">Sayfa bulunamadı</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{metaTitle}</title>
        {metaDescription && <meta name="description" content={metaDescription} />}
        {hasParams && <meta name="robots" content="noindex, follow" />}
      </Helmet>

      <Navbar />

      <main className="flex-grow container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          {/* Kapak görseli (varsa) */}
          {page.featured_image && (
            <img
              src={page.featured_image}
              alt={page.featured_image_alt || page.title}
              className="w-full h-64 object-cover rounded-lg border mb-8"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
          )}

          <h1 className="text-4xl font-bold mb-8">{page.title}</h1>

          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            // İçerik admin panelden kontrol edildiği varsayımıyla render ediliyor.
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>

      <Footer />
    </div>
  );
}
