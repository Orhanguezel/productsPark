// =============================================================
// FILE: src/components/home/FeaturedCategories.tsx
// =============================================================
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";

import { formatPrice } from "@/lib/utils";

// RTK
import { useListCategoriesQuery } from "@/integrations/metahub/rtk/endpoints/categories.endpoints";
import {
  useListProductsQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";

import type { Product } from "@/integrations/metahub/rtk/types/products";
import type { Category } from "@/integrations/metahub/rtk/types/categories";

interface CatRow {
  id: string;
  name: string;
  slug: string;
}

type CatWithProducts = CatRow & { products: Product[] };

export default function FeaturedCategories() {
  /* ---------------- Kategoriler (RTK) ---------------- */

  const {
    data: catsData = [],
    isLoading: isCatsLoading,
    isFetching: isCatsFetching,
  } = useListCategoriesQuery({
    is_active: true,
    is_featured: true,
    sort: "display_order",
    order: "asc",
  });

  const featuredCats: CatRow[] = useMemo(
    () =>
      (catsData as Category[]).map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
      })),
    [catsData],
  );

  const featuredCategoryIds = useMemo(
    () => featuredCats.map((c) => c.id),
    [featuredCats],
  );

  /* ---------------- Ürünler (RTK) ---------------- */

  const {
    data: productsData = [],
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useListProductsQuery(
    featuredCategoryIds.length
      ? {
        is_active: true,
        // birden fazla kategori için yeterince yüksek bir limit
        limit: Math.max(32, featuredCategoryIds.length * 8),
        offset: 0,
        sort: "rating",
        order: "desc",
      }
      : undefined,
    {
      skip: featuredCategoryIds.length === 0,
    },
  );

  const loading =
    isCatsLoading || isCatsFetching || isProductsLoading || isProductsFetching;

  /* ------------- Kategori -> ürün eşleme ------------- */

  const categories: CatWithProducts[] = useMemo(() => {
    if (!featuredCats.length) return [];
    const products = productsData as Product[];

    return featuredCats
      .map<CatWithProducts>((category) => {
        const productsForCategory = products
          .filter((p) => p.category_id === category.id)
          .slice(0, 4); // her kategori için max 4 ürün

        return { ...category, products: productsForCategory };
      })
      .filter((c) => c.products.length > 0);
  }, [featuredCats, productsData]);

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">Yükleniyor...</div>
      </section>
    );
  }

  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 space-y-16">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">
                {category.name}
              </h2>
              <Button
                variant="outline"
                onClick={() => {
                  window.location.href = `/kategoriler/${category.slug}`;
                }}
              >
                Tümünü Gör
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.products.map((product) => {
                const hasValidOriginal =
                  product.original_price != null &&
                  product.original_price > product.price;

                const discount = hasValidOriginal
                  ? Math.round(
                    ((product.original_price - product.price) /
                      product.original_price) *
                    100,
                  )
                  : null;

                return (
                  <Card
                    key={product.id}
                    className="group hover:shadow-elegant transition-smooth overflow-hidden cursor-pointer"
                    onClick={() => {
                      window.location.href = `/urun/${product.slug}`;
                    }}
                  >
                    <div className="relative overflow-hidden aspect-[4/3]">
                      <img
                        src={
                          product.image_url ||
                          "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                      />
                      {discount !== null && (
                        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                          -{discount}%
                        </Badge>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < Math.floor(product.rating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                                }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ({product.review_count})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {hasValidOriginal && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.original_price!)}
                          </span>
                        )}
                      </div>
                      <Button className="w-full gradient-primary text-white">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Sepete Ekle
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
