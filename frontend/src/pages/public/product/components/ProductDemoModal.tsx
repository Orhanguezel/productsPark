// =============================================================
// FILE: src/pages/public/components/ProductDemoModal.tsx
// =============================================================
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Sparkles } from "lucide-react";
import type { Product } from '@/integrations/types';

interface ProductDemoModalProps {
  product: Product;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProductDemoModal = ({
  product,
  open,
  onOpenChange,
}: ProductDemoModalProps) => {
  if (!product.demo_url) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent" />
            {product.name} - Canlı Demo
          </DialogTitle>
        </DialogHeader>
        <div className="relative w-full flex-1 rounded-lg overflow-hidden border">
          <iframe
            src={product.demo_url}
            className="w-full h-full"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            title={`${product.name} - Demo`}
            loading="lazy"
          />
        </div>
        <div className="flex justify-between items-center pt-6 mt-4 border-t">
          <p className="text-sm text-muted-foreground">
            ℹ️ Canlı demo önizlemesi - satın almadan önce ürünü tam olarak
            deneyimleyin
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              window.open(product.demo_url || "", "_blank")
            }
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Yeni Sekmede Aç
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDemoModal;
