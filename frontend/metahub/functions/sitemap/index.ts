import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "@/integrations/metahub/client";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const metahubUrl = Deno.env.get('METAHUB_URL')!;
    const metahubKey = Deno.env.get('METAHUB_SERVICE_ROLE_KEY')!;
    const metahub = createClient(metahubUrl, metahubKey);

    const baseUrl = new URL(req.url).origin;

    // Fetch categories
    const { data: categories } = await metahub
      .from('categories')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false });

    // Fetch products
    const { data: products } = await metahub
      .from('products')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    // Fetch custom pages
    const { data: pages } = await metahub
      .from('custom_pages')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('updated_at', { ascending: false });

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/kategoriler</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/urunler</loc>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/iletisim</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Add categories
    if (categories) {
      for (const category of categories) {
        sitemap += `  <url>
    <loc>${baseUrl}/kategoriler/${category.slug}</loc>
    <lastmod>${new Date(category.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add products
    if (products) {
      for (const product of products) {
        sitemap += `  <url>
    <loc>${baseUrl}/urun/${product.slug}</loc>
    <lastmod>${new Date(product.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
      }
    }

    // Add custom pages
    if (pages) {
      for (const page of pages) {
        sitemap += `  <url>
    <loc>${baseUrl}/${page.slug}</loc>
    <lastmod>${new Date(page.updated_at || Date.now()).toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
`;
      }
    }

    sitemap += `</urlset>`;

    return new Response(sitemap, {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
