// =============================================================
// FILE: src/components/home/FeaturedCategories.tsx
// FINAL — Featured Categories (featured-only guaranteed, cleaner)
// - categories: query is_featured=true + client-side guard
// - products: fetch enough items to cover featured categories
// - strict null-safe original_price
// =============================================================

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart } from 'lucide-react';

import { formatPrice } from '@/lib/utils';
import { useListProductsQuery, useListCategoriesQuery } from '@/integrations/hooks';

import type { Product, Category } from '@/integrations/types';

type CatRow = { id: string; name: string; slug: string };
type CatWithProducts = CatRow & { products: Product[] };

export default function FeaturedCategories() {
  /* ---------------- Categories (featured only) ---------------- */

  const {
    data: catsData,
    isLoading: isCatsLoading,
    isFetching: isCatsFetching,
  } = useListCategoriesQuery({
    is_active: true,
    is_featured: true,
    sort: 'display_order',
    order: 'asc',
    // istersen: limit: 20, offset: 0
  });

  const featuredCats: CatRow[] = useMemo(() => {
    const rows: Category[] = Array.isArray(catsData) ? catsData : [];

    // ✅ kesin filtre (backend paramı ignore etse bile)
    return rows
      .filter((c) => c.is_active === true && c.is_featured === true)
      .map((c) => ({ id: c.id, name: c.name, slug: c.slug }))
      .filter((c) => !!c.id && !!c.slug && !!c.name);
  }, [catsData]);

  const featuredCategoryIds = useMemo(() => featuredCats.map((c) => c.id), [featuredCats]);

  /* ---------------- Products ---------------- */

  // Her kategori için 4 ürün hedefliyoruz; rating desc.
  // Backend category filtre desteklemiyorsa bile yeterli ürün çekmek gerekir.
  const desiredPerCategory = 4;
  const desiredTotal = Math.max(32, featuredCategoryIds.length * desiredPerCategory * 3); // buffer

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useListProductsQuery(
    featuredCategoryIds.length
      ? {
          is_active: true,
          limit: desiredTotal,
          offset: 0,
          sort: 'rating',
          order: 'desc',
        }
      : undefined,
    { skip: featuredCategoryIds.length === 0 },
  );

  const loading = isCatsLoading || isCatsFetching || isProductsLoading || isProductsFetching;

  /* ---------------- Map category -> products ---------------- */

  const categories: CatWithProducts[] = useMemo(() => {
    if (!featuredCats.length) return [];

    const products: Product[] = Array.isArray(productsData) ? productsData : [];

    // index by category_id
    const byCat = new Map<string, Product[]>();
    for (const p of products) {
      const cid = p.category_id;
      if (!cid) continue;
      if (!byCat.has(cid)) byCat.set(cid, []);
      byCat.get(cid)!.push(p);
    }

    return featuredCats
      .map<CatWithProducts>((cat) => {
        const list = (byCat.get(cat.id) ?? []).slice(0, desiredPerCategory);
        return { ...cat, products: list };
      })
      .filter((c) => c.products.length > 0);
  }, [featuredCats, productsData, desiredPerCategory]);

  /* ---------------- Render ---------------- */

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">Yükleniyor...</div>
      </section>
    );
  }

  // Featured kategori yoksa veya ürün eşleşmediyse hiç basma
  if (categories.length === 0) return null;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 space-y-16">
        {categories.map((category) => (
          <div key={category.id}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl md:text-4xl font-bold">{category.name}</h2>

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
                const originalPrice = product.original_price;

                const hasValidOriginal =
                  typeof originalPrice === 'number' &&
                  Number.isFinite(originalPrice) &&
                  originalPrice > product.price;

                const discount =
                  hasValidOriginal && originalPrice
                    ? Math.round(((originalPrice - product.price) / originalPrice) * 100)
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
                          'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'
                        }
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                      />

                      {discount !== null ? (
                        <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                          -{discount}%
                        </Badge>
                      ) : null}
                    </div>

                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>

                      <div className="flex items-center gap-1 mb-3">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < Math.floor(product.rating)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
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

                        {hasValidOriginal ? (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(originalPrice)}
                          </span>
                        ) : null}
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
