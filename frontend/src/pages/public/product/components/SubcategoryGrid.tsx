// =============================================================
// FILE: src/pages/public/components/SubcategoryGrid.tsx
// =============================================================
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import type { CategoryRow } from "@/integrations/metahub/rtk/types/categories";

type Subcategory = CategoryRow & {
  product_count?: number;
};

interface SubcategoryGridProps {
  subcategories: Subcategory[];
}

const colorMap: Record<string, string> = {
  pubg: "from-orange-500 to-red-500",
  uc: "from-yellow-500 to-orange-500",
  "mobile-legends": "from-blue-500 to-purple-500",
  valorant: "from-red-500 to-pink-500",
  steam: "from-gray-700 to-blue-500",
};

const SubcategoryGrid = ({ subcategories }: SubcategoryGridProps) => {
  return (
    <section className="py-12 flex-1">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {subcategories.map((subcat) => {
            const color = colorMap[subcat.slug] || "from-gray-500 to-gray-700";
            const imageUrl =
              (subcat as any).image_url ||
              "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&h=400&fit=crop";

            return (
              <Card
                key={subcat.id}
                className="group hover:shadow-2xl hover:shadow-primary/20 transition-all duration-500 overflow-hidden cursor-pointer border-2 border-transparent hover:border-primary/20 bg-card/80 backdrop-blur-sm"
                onClick={() =>
                  (window.location.href = `/kategoriler/${subcat.slug}`)
                }
              >
                <div className="relative overflow-hidden aspect-[4/3]">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`}
                  />
                  <img
                    src={imageUrl}
                    alt={subcat.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-smooth"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-smooth flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <Button size="sm" variant="secondary">
                      <ArrowRight className="w-4 h-4 mr-2" />
                      Ürünleri Gör
                    </Button>
                  </div>
                </div>

                <CardContent className="p-4">
                  <h3 className="font-semibold mb-2 line-clamp-1">
                    {subcat.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {subcat.description}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-0">
                  <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all w-full justify-between">
                    <span>Ürünleri Görüntüle</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default SubcategoryGrid;
