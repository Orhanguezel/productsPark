import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { metahub } from "@/integrations/metahub/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

interface PageData {
  title: string;
  content: string;
  meta_description?: string | null; 
}

export default function CustomPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const [page, setPage] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Check if has any query params for noindex
  const hasParams = Array.from(searchParams.keys()).length > 0;

  useEffect(() => {
    fetchPage();
  }, [slug]);

  const fetchPage = async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("custom_pages")
        .select("title, content, meta_description")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (error) throw error;

      if (data) {
        setPage(data);
        document.title = data.title;
        if (data.meta_description) {
          const metaDesc = document.querySelector('meta[name="description"]');
          if (metaDesc) {
            metaDesc.setAttribute("content", data.meta_description);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching page:", error);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
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

  if (notFound || !page) {
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
        <title>{page.title}</title>
        <meta name="description" content={page.meta_description || page.title} />
        {hasParams && <meta name="robots" content="noindex, follow" />}
      </Helmet>
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">{page.title}</h1>
          <div
            className="prose prose-lg max-w-none dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </article>
      </main>
      <Footer />
    </div>
  );
}
