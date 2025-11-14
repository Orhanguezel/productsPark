// =============================================================
// FILE: src/pages/public/components/ProductNotFoundState.tsx
// =============================================================
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

const ProductNotFoundState = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            Ürün Bulunamadı
          </h2>
          <Button
            onClick={() => (window.location.href = "/urunler")}
          >
            Ürünlere Dön
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ProductNotFoundState;
