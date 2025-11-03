import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { metahub } from "@/integrations/metahub/client";
import { useSeoSettings } from "@/hooks/useSeoSettings";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/integrations/metahub/db/types/categories";

const colorMap: Record<string, string> = {
  steam: "from-blue-500 to-cyan-500",
  epic: "from-purple-500 to-pink-500",
  ubisoft: "from-indigo-500 to-blue-500",
  software: "from-green-500 to-emerald-500",
  design: "from-orange-500 to-red-500",
  development: "from-gray-700 to-gray-900",
  music: "from-pink-500 to-rose-500",
  streaming: "from-red-500 to-orange-500",
  education: "from-cyan-500 to-blue-500",
  other: "from-teal-500 to-green-500",
};


const Categories = () => {
  const [searchParams] = useSearchParams();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const { settings } = useSeoSettings();

  // Check if has any query params for noindex
  const hasParams = Array.from(searchParams.keys()).length > 0;

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("*")
        .order("product_count", { ascending: false });

      if (error) throw error;

      console.log("All categories:", data);

      // Organize categories with subcategories
      const allCategories = data || [];
      const mainCategories = allCategories.filter(cat => !cat.parent_id);

      console.log("Main categories:", mainCategories);

      const categoriesWithSubs = mainCategories.map(mainCat => ({
        ...mainCat,
        subcategories: allCategories.filter(cat => cat.parent_id === mainCat.id)
      }));

      console.log("Categories with subs:", categoriesWithSubs);

      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error("Error fetching categories:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateItemListSchema = () => {
    if (categories.length === 0) return null;

    return {
      "@context": "https://schema.org/",
      "@type": "ItemList",
      "itemListElement": categories.map((category, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "Thing",
          "name": category.name,
          "url": `${window.location.origin}/kategoriler/${category.slug}`,
          "description": category.description || ""
        }
      }))
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_categories_title}</title>
        <meta name="description" content={settings.seo_categories_description} />
        <meta property="og:title" content={settings.seo_categories_title} />
        <meta property="og:description" content={settings.seo_categories_description} />
        <meta property="og:type" content="website" />
        {hasParams && <meta name="robots" content="noindex, follow" />}
        {categories.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify(generateItemListSchema())}
          </script>
        )}
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Ürün Kategorileri</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Tüm Kategoriler
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Dijital ürünlerimizi kategorilere göre keşfedin
          </p>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {loading ? (
            <div className="text-center py-12">Yükleniyor...</div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {categories.map((category) => {
                  const color = colorMap[category.slug] || "from-gray-500 to-gray-700";
                  const imageUrl = category.image_url || "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop";

                  return (
                    <Card
                      key={category.id}
                      className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                      onClick={() => window.location.href = `/kategoriler/${category.slug}`}
                    >
                      <div className="relative overflow-hidden aspect-[4/3]">
                        <img
                          src={imageUrl}
                          alt={category.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                        />
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-1">
                          {category.name}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {category.description}
                        </p>
                      </CardContent>

                      <CardFooter className="p-4 pt-0">
                        <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all w-full justify-between">
                          <span>Ürünleri Görüntüle</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Categories;