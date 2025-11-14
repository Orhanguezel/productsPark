// =============================================================
// FILE: src/pages/public/components/ProductsHero.tsx
// =============================================================
import { Badge } from "@/components/ui/badge";
import type { CategoryRow } from "@/integrations/metahub/db/types/categories";

type CategoryWithMeta = CategoryRow & {
  badges?: Array<{ text: string; active: boolean }>;
};

interface ProductsHeroProps {
  currentCategory: CategoryWithMeta | null;
}

const ProductsHero = ({ currentCategory }: ProductsHeroProps) => {
  return (
    <section className="gradient-hero text-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">
            {currentCategory?.name || "En Çok Satan Ürünlerimiz"}
          </h1>

          {currentCategory?.description && (
            <p className="text-muted-foreground max-w-2xl mx-auto mb-6">
              {currentCategory.description}
            </p>
          )}

          {currentCategory?.badges && currentCategory.badges.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {currentCategory.badges
                .filter((badge) => badge.active)
                .map((badge, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="px-4 py-2 text-white bg-white/20"
                  >
                    {badge.text}
                  </Badge>
                ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductsHero;
