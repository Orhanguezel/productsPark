// =============================================================
// FILE: src/pages/public/components/CategoryNotFoundState.tsx
// =============================================================
import { Button } from "@/components/ui/button";

const CategoryNotFoundState = () => {
  return (
    <section className="py-12 flex-1">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Kategori Bulunamadı</h2>
        <p className="text-muted-foreground mb-6">
          Aradığınız kategori mevcut değil.
        </p>
        <Button onClick={() => (window.location.href = "/kategoriler")}>
          Tüm Kategorilere Dön
        </Button>
      </div>
    </section>
  );
};

export default CategoryNotFoundState;
