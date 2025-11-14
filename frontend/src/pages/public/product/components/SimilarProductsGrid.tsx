// =============================================================
// FILE: src/pages/public/components/SimilarProductsGrid.tsx
// =============================================================
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Star } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Product } from "./productDetail.types";

interface SimilarProductsGridProps {
  products: Product[];
}

const SimilarProductsGrid = ({ products }: SimilarProductsGridProps) => {
  if (!products || products.length === 0) return null;

  return (
    <div className="mb-16">
      <h2 className="text-3xl font-bold mb-8">
        Benzer Ürünler
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card
            key={product.id}
            className="group hover:shadow-elegant transition-all duration-300 overflow-hidden cursor-pointer"
            onClick={() =>
              (window.location.href = `/urun/${product.slug}`)
            }
          >
            <CardHeader className="p-0">
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={
                    product.image_url ||
                    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop"
                  }
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <p className="text-sm text-muted-foreground mb-1">
                {product.categories?.name}
              </p>
              <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                {product.name}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${
                      i < product.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex items-center justify-between">
              <div>
                {product.original_price && (
                  <p className="text-xs text-muted-foreground line-through">
                    {formatPrice(product.original_price)}
                  </p>
                )}
                <p className="text-xl font-bold text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SimilarProductsGrid;
