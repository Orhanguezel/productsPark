// FILE: src/pages/Categories.tsx
import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { Category } from "@/integrations/metahub/db/types/categories";
import { useSeoSettings } from "@/hooks/useSeoSettings";
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";

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

function parseBoolParam(v: string | null): boolean | undefined {
  if (v == null) return undefined;
  const s = v.toLowerCase();
  if (["1","true","yes","y","on"].includes(s)) return true;
  if (["0","false","no","n","off"].includes(s)) return false;
  return undefined;
}

export default function Categories() {
  const [sp] = useSearchParams();
  const { settings } = useSeoSettings();

  // URL → RTK param
  const only = sp.get("only"); // "main" | "sub" | null
  const q = sp.get("q") || undefined;
  const parentInUrl = sp.get("parent_id");
  const is_featured = parseBoolParam(sp.get("featured"));
  const sort = (sp.get("sort") as "display_order" | "name" | "created_at" | "updated_at") || "display_order";
  const order = (sp.get("order") as "asc" | "desc") || "asc";

  // only=main/sub override: BE'ye net sinyal göndermek için parent_id paramı belirle
  const parent_id =
    only === "main" ? null :
    only === "sub" ? "__non_null__" : // BE: özel bir değer yoksa FE filtreleyecek
    parentInUrl ?? undefined;

  const { data = [], isFetching } = useListCategoriesQuery(
    {
      q,
      // BE parent filter'ınızı "null" string ile ana kategoriler, değer ile eşleşen altlar gibi çalışıyorsa:
      parent_id: parent_id === "__non_null__" ? undefined : parent_id ?? undefined,
      is_active: true,
      is_featured,
      sort,
      order,
    },
  );

  // FE tarafı alt/ana ayrımı (BE non_null desteği yoksa):
  const rows = useMemo(() => {
    // URL'de only=sub ise parent_id ≠ null filtrele
    if (only === "sub") return data.filter((c) => c.parent_id !== null);
    if (only === "main") return data.filter((c) => c.parent_id === null);
    return data;
  }, [data, only]);

  // main + alt gruplama (SEO şeması için kullanışlı)
  const mainCats = useMemo(() => rows.filter((c) => !c.parent_id), [rows]);
  const subsByParent = useMemo(() => {
    const map = new Map<string, Category[]>();
    rows.forEach((c) => {
      if (c.parent_id) {
        const arr = map.get(c.parent_id) ?? [];
        arr.push(c);
        map.set(c.parent_id, arr);
      }
    });
    return map;
  }, [rows]);

  const hasParams = Array.from(sp.keys()).length > 0;

  const itemListSchema =
    mainCats.length > 0
      ? {
          "@context": "https://schema.org/",
          "@type": "ItemList",
          itemListElement: mainCats.map((category, index) => ({
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": "Thing",
              name: category.name,
              url: `${window.location.origin}/kategoriler/${category.slug}`,
              description: category.description || "",
            },
          })),
        }
      : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_categories_title}</title>
        <meta name="description" content={settings.seo_categories_description} />
        <meta property="og:title" content={settings.seo_categories_title} />
        <meta property="og:description" content={settings.seo_categories_description} />
        <meta property="og:type" content="website" />
        {hasParams && <meta name="robots" content="noindex, follow" />}
        {itemListSchema && (
          <script type="application/ld+json">
            {JSON.stringify(itemListSchema)}
          </script>
        )}
      </Helmet>

      <Navbar />

      {/* Hero */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Ürün Kategorileri</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Tüm Kategoriler</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">Dijital ürünlerimizi kategorilere göre keşfedin</p>
        </div>
      </section>

      {/* Grid */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          {isFetching ? (
            <div className="text-center py-12">Yükleniyor...</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {rows.map((category) => {
                const color = colorMap[category.slug] || "from-gray-500 to-gray-700";
                const imageUrl =
                  category.image_url ||
                  "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop";

                return (
                  <Card
                    key={category.id}
                    className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                    onClick={() => (window.location.href = `/kategoriler/${category.slug}`)}
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-smooth"
                      />
                      {/* renk şeridi */}
                      <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r ${color}`} />
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{category.name}</h3>
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

                    {/* Alt kategoriler varsa küçük satır */}
                    {subsByParent.get(category.id) && subsByParent.get(category.id)!.length > 0 && (
                      <div className="px-4 pb-4 text-xs text-muted-foreground">
                        {subsByParent.get(category.id)!.slice(0, 3).map((s) => s.name).join(" • ")}
                        {subsByParent.get(category.id)!.length > 3 ? " • …" : ""}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
