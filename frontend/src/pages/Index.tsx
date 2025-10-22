import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import HowItWorks from "@/components/home/HowItWorks";
import FAQ from "@/components/home/FAQ";
import Blog from "@/components/home/Blog";
import Newsletter from "@/components/home/Newsletter";
import Footer from "@/components/layout/Footer";
import { useSeoSettings } from "@/hooks/useSeoSettings";

const Index = () => {
  const { settings, loading } = useSeoSettings();
  
  const generateOrganizationSchema = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "Organization",
      "name": settings.site_title,
      "url": window.location.origin,
      "logo": `${window.location.origin}/logo.png`,
      "description": settings.site_description,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+90-555-555-5555",
        "contactType": "customer service",
        "availableLanguage": ["Turkish"],
        "areaServed": "TR"
      },
      "sameAs": []
    };
  };

  const generateWebSiteSchema = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "WebSite",
      "name": settings.site_title,
      "url": window.location.origin,
      "description": settings.site_description,
      "potentialAction": {
        "@type": "SearchAction",
        "target": `${window.location.origin}/urunler?q={search_term_string}`,
        "query-input": "required name=search_term_string"
      }
    };
  };

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <p>Yükleniyor...</p>
        </div>
      ) : (
        <>
          <Helmet key={`${settings.site_title}-${settings.site_description}`}>
            <title>{settings.site_title}</title>
            <meta name="description" content={settings.site_description} />
            <meta property="og:title" content={settings.site_title} />
            <meta property="og:description" content={settings.site_description} />
            <meta property="og:type" content="website" />
            <meta name="twitter:title" content={settings.site_title} />
            <meta name="twitter:description" content={settings.site_description} />
            <script type="application/ld+json">
              {JSON.stringify(generateOrganizationSchema())}
            </script>
            <script type="application/ld+json">
              {JSON.stringify(generateWebSiteSchema())}
            </script>
          </Helmet>
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
};

export default Index;
