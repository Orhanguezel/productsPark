// =============================================================
// FILE: src/pages/public/components/ProductLoadingState.tsx
// =============================================================
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const ProductLoadingState = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center">
        Yükleniyor...
      </div>
      <Footer />
    </div>
  );
};

export default ProductLoadingState;
