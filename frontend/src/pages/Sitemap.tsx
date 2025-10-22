import { useEffect, useState } from 'react';
import { metahub } from '@/integrations/metahub/client';

const Sitemap = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        const { data, error } = await metahub.functions.invoke('sitemap');

        if (error) {
          console.error('Sitemap fetch error:', error);
          setSitemapXml('<?xml version="1.0" encoding="UTF-8"?><error>Failed to load sitemap</error>');
        } else {
          setSitemapXml(data);
        }
      } catch (err) {
        console.error('Sitemap fetch error:', err);
        setSitemapXml('<?xml version="1.0" encoding="UTF-8"?><error>Failed to load sitemap</error>');
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  useEffect(() => {
    if (!loading && sitemapXml) {
      // Set content type to XML
      const blob = new Blob([sitemapXml], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);

      // Replace current page with XML content
      window.location.replace(url);
    }
  }, [loading, sitemapXml]);

  if (loading) {
    return (
      <div style={{ padding: '20px', fontFamily: 'monospace' }}>
        Loading sitemap...
      </div>
    );
  }

  return (
    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
      {sitemapXml}
    </div>
  );
};

export default Sitemap;
