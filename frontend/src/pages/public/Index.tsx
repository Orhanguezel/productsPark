import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import HowItWorks from '@/components/home/HowItWorks';
import FAQ from '@/components/home/FAQ';
import Blog from '@/components/home/Blog';
import Newsletter from '@/components/home/Newsletter';
import Footer from '@/components/layout/Footer';

import SeoJsonLd from '@/components/seo/SeoJsonLd';

import { useSeoSettings } from '@/hooks/useSeoSettings';
import { nonEmpty, getOrigin } from '@/integrations/types';

export default function Index() {
 const { settings, flat, loading } = useSeoSettings();

 const origin = useMemo(
   () => nonEmpty(flat?.canonical_base_url) || getOrigin(),
   [flat?.canonical_base_url],
 );


  const canonicalUrl = useMemo(() => (origin ? `${origin}/` : ''), [origin]);

  // Home SEO (no fallbacks)
  const seoTitle = nonEmpty(settings?.seo_home_title);
  const seoDesc = nonEmpty(settings?.seo_home_description);

  const shouldEmitSeo = !!(canonicalUrl || seoTitle || seoDesc);

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p>Yükleniyor...</p>
        </div>
      ) : (
        <>
          {shouldEmitSeo ? (
            <Helmet>
              {seoTitle ? <title>{seoTitle}</title> : null}
              {seoDesc ? <meta name="description" content={seoDesc} /> : null}
              {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}

              {/* OG/Twitter (only if same fields exist; no fallbacks) */}
              {seoTitle ? <meta property="og:title" content={seoTitle} /> : null}
              {seoDesc ? <meta property="og:description" content={seoDesc} /> : null}
              <meta property="og:type" content="website" />
              {seoTitle ? <meta name="twitter:title" content={seoTitle} /> : null}
              {seoDesc ? <meta name="twitter:description" content={seoDesc} /> : null}
            </Helmet>
          ) : null}

          <SeoJsonLd settings={settings} />

          <Navbar />
          <Hero />
          <FeaturedProducts />
          <FeaturedCategories />
          <HowItWorks />
          <FAQ />
          <Blog />
          <Newsletter />
          <Footer />
        </>
      )}
    </div>
  );
}
