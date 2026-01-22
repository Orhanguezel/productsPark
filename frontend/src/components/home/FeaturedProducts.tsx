// =============================================================
// FILE: src/components/public/FeaturedProducts.tsx
// FINAL — Featured Products (featured-only, single settings fetch)
// - settings fetched via listSiteSettings(keys=...)
// - products filtered by is_featured=true (query + client-side guard)
// - strict null-safe original_price
// =============================================================

import React, { useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ShoppingCart, Eye } from 'lucide-react';

import { formatPrice } from '@/lib/utils';

import { useListProductsQuery, useListSiteSettingsQuery } from '@/integrations/hooks';
import type { Product, JsonLike } from '@/integrations/types';
import { toStr } from '@/integrations/types';

type FeaturedSettings = {
  home_featured_badge: string;
  home_featured_title: string;
  home_featured_button: string;
};

const DEFAULT_SETTINGS: FeaturedSettings = {
  home_featured_badge: 'Öne Çıkan Ürünler',
  home_featured_title: 'En çok satan ürünlerimize göz atın',
  home_featured_button: 'Tüm Ürünleri Görüntüle',
};

const SETTINGS_KEYS = [
  'home_featured_badge',
  'home_featured_title',
  'home_featured_button',
] as const;

export default function FeaturedProducts() {
  /* ------------ Site settings (single RTK call) ------------ */

  const {
    data: settingsList,
    isLoading: isSettingsLoading,
    isFetching: isSettingsFetching,
  } = useListSiteSettingsQuery({
    keys: SETTINGS_KEYS as unknown as string[],
    order: 'key.asc',
    limit: 50,
    offset: 0,
  });

  const settings = useMemo<FeaturedSettings>(() => {
    const map = new Map<string, JsonLike>();
    for (const row of settingsList ?? []) map.set(row.key, row.value);

    return {
      home_featured_badge:
        toStr(map.get('home_featured_badge')).trim() || DEFAULT_SETTINGS.home_featured_badge,
      home_featured_title:
        toStr(map.get('home_featured_title')).trim() || DEFAULT_SETTINGS.home_featured_title,
      home_featured_button:
        toStr(map.get('home_featured_button')).trim() || DEFAULT_SETTINGS.home_featured_button,
    };
  }, [settingsList]);

  /* ------------ Featured products (RTK) ------------ */

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useListProductsQuery({
    is_active: true,
    is_featured: true,

    sort: 'rating',
    order: 'desc',
    limit: 24, // featured sayısı azsa da sorun değil; client-side 8'e düşecek
    offset: 0,
  });

  const loading =
    isSettingsLoading || isSettingsFetching || isProductsLoading || isProductsFetching;

  const products = useMemo<Product[]>(() => {
    const rows: Product[] = Array.isArray(productsData) ? productsData : [];

    // ✅ featured-only garanti (backend filtreyi ignore etse bile)
    return rows.filter((p) => p.is_active === true && p.is_featured === true).slice(0, 8);
  }, [productsData]);

  if (loading) {
    return (
      <section id="urunler" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">Yükleniyor...</div>
      </section>
    );
  }

  if (!products.length) return null;

  return (
    <section id="urunler" className="py-20 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 animate-gradient" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge className="mb-4 gradient-primary text-white shadow-elegant" variant="default">
            {settings.home_featured_badge}
          </Badge>

          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {settings.home_featured_title}
          </h2>

          {/* Not: burada title tekrar basılmış; istersen ayrı bir subtitle setting ekleyebilirsin. */}
          <p className="text-muted-foreground max-w-2xl mx-auto">{settings.home_featured_title}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const original = product.original_price;

            const hasValidOriginal =
              typeof original === 'number' && Number.isFinite(original) && original > product.price;

            const discount =
              hasValidOriginal && original
                ? Math.round(((original - product.price) / original) * 100)
                : null;

            return (
              <Card
                key={product.id}
                className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
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

                  {discount !== null ? (
                    <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                      İndirimde
                    </Badge>
                  ) : product.review_count > 100 ? (
                    <Badge className="absolute top-3 right-3 gradient-primary text-white">
                      En Çok Değerlendirilen Satış
                    </Badge>
                  ) : null}

                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-smooth flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary" type="button">
                      <Eye className="w-4 h-4 mr-2" />
                      Detayları Gör
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {product.categories?.name || 'Genel'}
                  </Badge>

                  <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>

                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-3 h-3 ${
                            index < Math.floor(product.rating)
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.sales_count} Satış)
                    </span>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>

                    {hasValidOriginal ? (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(original)}
                      </span>
                    ) : null}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 gap-2">
                  <Button className="flex-1 gradient-primary text-white" type="button">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Sepete Ekle
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            onClick={() => {
              window.location.href = '/urunler';
            }}
          >
            {settings.home_featured_button}
          </Button>
        </div>
      </div>
    </section>
  );
}
