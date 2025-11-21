// =============================================================
// FILE: src/components/public/FeaturedProducts.tsx
// =============================================================
import { useMemo } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";

import type { Product } from "@/integrations/metahub/rtk/types/products";
import { formatPrice } from "@/lib/utils";

// RTK hooks
import {
  useListProductsQuery,
} from "@/integrations/metahub/rtk/endpoints/products.endpoints";
import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

type FeaturedSettings = {
  home_featured_badge: string;
  home_featured_title: string;
  home_featured_button: string;
};

const DEFAULT_SETTINGS: FeaturedSettings = {
  home_featured_badge: "Öne Çıkan Ürünler",
  home_featured_title: "En çok satan ürünlerimize göz atın",
  home_featured_button: "Tüm Ürünleri Görüntüle",
};

const FeaturedProducts = () => {
  /* ------------ Site settings (RTK) ------------ */

  const { data: badgeSetting, isLoading: isBadgeLoading } =
    useGetSiteSettingByKeyQuery("home_featured_badge");
  const { data: titleSetting, isLoading: isTitleLoading } =
    useGetSiteSettingByKeyQuery("home_featured_title");
  const { data: buttonSetting, isLoading: isButtonLoading } =
    useGetSiteSettingByKeyQuery("home_featured_button");

  const settings: FeaturedSettings = useMemo(
    () => ({
      home_featured_badge: badgeSetting?.value
        ? String(badgeSetting.value)
        : DEFAULT_SETTINGS.home_featured_badge,
      home_featured_title: titleSetting?.value
        ? String(titleSetting.value)
        : DEFAULT_SETTINGS.home_featured_title,
      home_featured_button: buttonSetting?.value
        ? String(buttonSetting.value)
        : DEFAULT_SETTINGS.home_featured_button,
    }),
    [badgeSetting, titleSetting, buttonSetting],
  );

  /* ------------ Featured products (RTK) ------------ */

  const {
    data: productsData = [],
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
  } = useListProductsQuery(
    {
      is_active: true,
      // Burada backend tarafında rating / review_count’a göre sıralama var
      sort: "rating",
      order: "desc",
      limit: 8,
      offset: 0,
    },
  );

  const products = productsData as Product[];

  const loading =
    isBadgeLoading ||
    isTitleLoading ||
    isButtonLoading ||
    isProductsLoading ||
    isProductsFetching;

  if (loading) {
    return (
      <section id="urunler" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          Yükleniyor...
        </div>
      </section>
    );
  }

  if (!products.length) {
    return null;
  }

  return (
    <section id="urunler" className="py-20 relative overflow-hidden">
      {/* Animated gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 animate-gradient" />

      {/* Decorative shapes */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <Badge
            className="mb-4 gradient-primary text-white shadow-elegant"
            variant="default"
          >
            {settings.home_featured_badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {settings.home_featured_title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {settings.home_featured_title}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const discount =
              product.original_price && product.original_price > product.price
                ? Math.round(
                  ((product.original_price - product.price) /
                    product.original_price) *
                  100,
                )
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
                  {discount !== null && (
                    <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                      İndirimde
                    </Badge>
                  )}
                  {product.review_count > 100 && discount === null && (
                    <Badge className="absolute top-3 right-3 gradient-primary text-white">
                      En Çok Değerlendirilen Satış
                    </Badge>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-smooth flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary">
                      <Eye className="w-4 h-4 mr-2" />
                      Detayları Gör
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <Badge variant="outline" className="mb-2 text-xs">
                    {product.categories?.name || "Genel"}
                  </Badge>
                  <h3 className="font-semibold mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 mb-3">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <Star
                          key={index}
                          className={`w-3 h-3 ${index < Math.floor(product.rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-300"
                            }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      ({product.review_count} Satış)
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-primary">
                      {formatPrice(product.price)}
                    </span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.original_price)}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="p-4 pt-0 gap-2">
                  <Button className="flex-1 gradient-primary text-white">
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
              window.location.href = "/urunler";
            }}
          >
            {settings.home_featured_button}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
