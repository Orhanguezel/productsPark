// =============================================================
// FILE: src/pages/public/components/ProductsHero.tsx
// FINAL — CategoryRow extended for UI meta (description + badges)
// =============================================================
import { Badge } from '@/components/ui/badge';
import type { CategoryRow } from '@/integrations/types';

type CategoryHeroBadge = { text: string; active: boolean };

type CategoryWithMeta = CategoryRow & {
  description?: string | null; // ✅ UI uses this
  badges?: CategoryHeroBadge[] | null;
};

interface ProductsHeroProps {
  currentCategory: CategoryWithMeta | null;
}

const ProductsHero = ({ currentCategory }: ProductsHeroProps) => {
  const title = currentCategory?.name ?? 'En Çok Satan Ürünlerimiz';
  const desc = currentCategory?.description ?? null;
  const badges = Array.isArray(currentCategory?.badges) ? currentCategory!.badges : [];

  return (
    <section className="gradient-hero text-white py-16">
      <div className="container mx-auto px-4">
        <div className="text-center py-12">
          <h1 className="text-4xl font-bold mb-4">{title}</h1>

          {desc ? <p className="text-muted-foreground max-w-2xl mx-auto mb-6">{desc}</p> : null}

          {badges.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-4 mt-6">
              {badges
                .filter((b) => Boolean(b?.active))
                .map((b, index) => (
                  <Badge
                    key={`${b.text}-${index}`}
                    variant="secondary"
                    className="px-4 py-2 text-white bg-white/20"
                  >
                    {b.text}
                  </Badge>
                ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default ProductsHero;
