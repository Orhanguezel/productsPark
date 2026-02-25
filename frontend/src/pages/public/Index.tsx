import React, { useMemo } from 'react';

import Navbar from '@/components/layout/Navbar';
import Hero from '@/components/home/Hero';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import FeaturedCategories from '@/components/home/FeaturedCategories';
import HowItWorks from '@/components/home/HowItWorks';
import FAQ from '@/components/home/FAQ';
import Blog from '@/components/home/Blog';
import Newsletter from '@/components/home/Newsletter';
import Footer from '@/components/layout/Footer';

import SeoHelmet from '@/seo/SeoHelmet';

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
  const ogImage = nonEmpty(flat?.og_default_image);

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
            <SeoHelmet
              title={seoTitle}
              description={seoDesc}
              ogType="website"
              url={canonicalUrl}
              imageUrl={ogImage}
            />
          ) : null}

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
