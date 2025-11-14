// =============================================================
// FILE: src/pages/public/components/ProductMediaSection.tsx
// =============================================================
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Zap,
  Shield,
  Clock,
  Headphones,
  Sparkles,
} from "lucide-react";
import type { Product } from "./productDetail.types";

interface ProductMediaSectionProps {
  product: Product;
  gallery: (string | null)[];
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

const ProductMediaSection = ({
  product,
  gallery,
  selectedImage,
  onSelectImage,
}: ProductMediaSectionProps) => {
  const placeholder =
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop";

  const iconMap: Record<string, any> = {
    Zap,
    Shield,
    Clock,
    Headphones,
    Sparkles,
  };

  return (
    <div className="space-y-4">
      {/* Ana görsel */}
      <div className="relative aspect-video rounded-lg overflow-hidden shadow-card">
        {product.original_price && (
          <Badge className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground">
            İndirimde
          </Badge>
        )}
        <img
          src={gallery[selectedImage] || placeholder}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail galerisi */}
      {gallery.length > 1 && (
        <div className="grid grid-cols-3 gap-4">
          {gallery.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onSelectImage(idx)}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                selectedImage === idx
                  ? "border-primary shadow-elegant"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <img
                src={img || placeholder}
                alt={`Gallery ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Ürün rozetleri */}
      {product.badges && product.badges.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {product.badges
            .filter((badge) => badge.active)
            .map((badge, index) => {
              const Icon = iconMap[badge.icon] || Zap;
              return (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {badge.text}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
};

export default ProductMediaSection;
