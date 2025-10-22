import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ShoppingCart } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { formatPrice } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  rating: number;
  review_count: number;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  products: Product[];
}

const FeaturedCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedCategories();
  }, []);

  const fetchFeaturedCategories = async () => {
    try {
      // Fetch featured categories ordered by display_order
      const { data: categoriesData, error: catError } = await metahub
        .from("categories")
        .select("id, name, slug")
        .eq("is_featured", true)
        .order("display_order", { ascending: true })
        .order("name", { ascending: true }); // Secondary sort by name

      if (catError) throw catError;

      if (!categoriesData || categoriesData.length === 0) {
        setLoading(false);
        return;
      }

      // For each category, fetch 4 products that should be shown on homepage
      const categoriesWithProducts = await Promise.all(
        categoriesData.map(async (category) => {
          const { data: productsData, error: prodError } = await metahub
            .from("products")
            .select("id, name, slug, price, original_price, image_url, rating, review_count")
            .eq("category_id", category.id)
            .eq("is_active", true)
            .limit(4);

          if (prodError) throw prodError;

          return {
            ...category,
            products: productsData || [],
          };
        })
      );

      // Filter out categories with no products
      setCategories(categoriesWithProducts.filter((cat) => cat.products.length > 0));
    } catch (error) {
      console.error("Error fetching featured categories:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          Yükleniyor...
        </div>
      </section>
    );
  }

  if (categories.length === 0) {
    return null;
  }

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
                onClick={() => window.location.href = `/kategoriler/${category.slug}`}
              >
                Tümünü Gör
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {category.products.map((product) => {
                const discount = product.original_price
                  ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
                  : null;

                return (
                  <Card
                    key={product.id}
                    className="group hover:shadow-elegant transition-smooth overflow-hidden cursor-pointer"
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
                    </div>

                    <CardContent className="p-4">
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
                          ({product.review_count})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-bold text-primary">
                          {formatPrice(product.price)}
                        </span>
                        {product.original_price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {formatPrice(product.original_price)}
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
};

export default FeaturedCategories;
