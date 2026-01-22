// =============================================================
// FILE: src/pages/public/components/ProductMediaSection.tsx
// FINAL — central types safe (no null index) + typed icon map
// =============================================================
import { Badge as UiBadge } from '@/components/ui/badge';
import { Zap, Shield, Clock, Headphones, Sparkles } from 'lucide-react';
import type { Product } from '@/integrations/types';

interface ProductMediaSectionProps {
  product: Product;
  gallery: string[]; // ✅ no nulls
  selectedImage: number;
  onSelectImage: (index: number) => void;
}

type IconName = 'Zap' | 'Shield' | 'Clock' | 'Headphones' | 'Sparkles';
type IconComponent = typeof Zap;

const ICON_MAP: Record<IconName, IconComponent> = {
  Zap,
  Shield,
  Clock,
  Headphones,
  Sparkles,
};

const ProductMediaSection = ({
  product,
  gallery,
  selectedImage,
  onSelectImage,
}: ProductMediaSectionProps) => {
  const placeholder =
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800&h=600&fit=crop';

  // ✅ clamp index (gallery boş olsa bile güvenli)
  const safeIndex =
    gallery.length > 0 ? Math.min(Math.max(0, selectedImage), gallery.length - 1) : 0;

  const mainSrc = gallery.length > 0 ? gallery[safeIndex] : product.image_url ?? placeholder;

  return (
    <div className="space-y-4">
      {/* Ana görsel */}
      <div className="relative aspect-video rounded-lg overflow-hidden shadow-card">
        {typeof product.original_price === 'number' && product.original_price > 0 ? (
          <UiBadge className="absolute top-4 left-4 z-10 bg-primary text-primary-foreground">
            İndirimde
          </UiBadge>
        ) : null}

        <img
          src={mainSrc || placeholder}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Thumbnail galerisi */}
      {gallery.length > 1 ? (
        <div className="grid grid-cols-3 gap-4">
          {gallery.map((img, idx) => (
            <button
              key={`${img}-${idx}`}
              onClick={() => onSelectImage(idx)}
              className={`aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                safeIndex === idx
                  ? 'border-primary shadow-elegant'
                  : 'border-border hover:border-primary/50'
              }`}
              type="button"
            >
              <img
                src={img || placeholder}
                alt={`${product.name} görsel ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}

      {/* Ürün rozetleri */}
      {Array.isArray(product.badges) && product.badges.length > 0 ? (
        <div className="grid grid-cols-2 gap-3">
          {product.badges
            .filter((b) => Boolean(b?.active))
            .map((b, index) => {
              const iconName = (b.icon ?? '') as IconName;
              const Icon = iconName && ICON_MAP[iconName] ? ICON_MAP[iconName] : Zap;

              return (
                <div
                  key={`${b.text}-${index}`}
                  className="group relative overflow-hidden rounded-lg bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative flex items-center gap-3">
                    <div className="rounded-full bg-primary/10 p-2 group-hover:bg-primary/20 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                      {b.text}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>
      ) : null}
    </div>
  );
};

export default ProductMediaSection;
