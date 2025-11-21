// =============================================================
// FILE: src/pages/Sitemap.tsx
// =============================================================
import { useEffect } from "react";
import { useSitemapQuery } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";

const Sitemap = () => {
  const {
    data: sitemapXml = "",
    isLoading,
    isError,
  } = useSitemapQuery();

  useEffect(() => {
    if (!isLoading && sitemapXml) {
      // XML içeriğini bir Blob'a çevirip tarayıcıda direkt XML olarak göster
      const blob = new Blob([sitemapXml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);

      // Mevcut sayfayı XML içeriği ile değiştir
      window.location.replace(url);
    }
  }, [isLoading, sitemapXml]);

  if (isLoading) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        Loading sitemap...
      </div>
    );
  }

  if (isError || !sitemapXml) {
    return (
      <div style={{ padding: "20px", fontFamily: "monospace" }}>
        Failed to load sitemap.
      </div>
    );
  }

  // Normalde buraya hiç düşmeyecek (location.replace çalıştığı için),
  // ama fallback olarak XML'i düz text olarak gösterelim.
  return (
    <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
      {sitemapXml}
    </pre>
  );
};

export default Sitemap;
