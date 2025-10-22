import { useEffect, useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart, Eye } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  category_id: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  rating: number;
  review_count: number;
  categories?: {
    name: string;
  };
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    home_featured_badge: "Öne Çıkan Ürünler",
    home_featured_title: "En çok satan ürünlerimize göz atın",
    home_featured_button: "Tüm Ürünleri Görüntüle",
  });

  useEffect(() => {
    fetchFeaturedProducts();
    fetchSettings();

    // Subscribe to real-time updates
    const channel = metahub
      .channel('featured-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = ['home_featured_badge', 'home_featured_title', 'home_featured_button'];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Featured settings updated:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = ['home_featured_badge', 'home_featured_title', 'home_featured_button'];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Featured settings inserted:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", ["home_featured_badge", "home_featured_title", "home_featured_button"]);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error("Error fetching featured settings:", error);
    }
  };

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await metahub
        .from("products")
        .select("*, categories(name)")
        .eq("is_active", true)
        .eq("show_on_homepage", true)
        .order("review_count", { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section id="urunler" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          Yükleniyor...
        </div>
      </section>
    );
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
          <Badge className="mb-4 gradient-primary text-white shadow-elegant" variant="default">
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
            const discount = product.original_price
              ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
              : null;

            return (
              <Card
                key={product.id}
                className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                onClick={() => window.location.href = `/urun/${product.slug}`}
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <img
                    src={product.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                  {discount && (
                    <Badge className="absolute top-3 left-3 bg-destructive text-destructive-foreground">
                      -{discount}%
                    </Badge>
                  )}
                  {discount && (
                    <Badge className="absolute top-3 right-3 bg-success text-success-foreground">
                      İndirimde
                    </Badge>
                  )}
                  {product.review_count > 100 && !discount && (
                    <Badge className="absolute top-3 right-3 gradient-primary text-white">
                      En Çok Satan
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
                      {[...Array(5)].map((_, i) => (
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
            onClick={() => window.location.href = "/urunler"}
          >
            {settings.home_featured_button}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;