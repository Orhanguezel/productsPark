// =============================================================
// FILE: src/pages/public/payment/PaymentFail.tsx
// Ödeme başarısız sayfası — PayTR / Shopier fail_url hedefi
// =============================================================

import { useNavigate } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function PaymentFail() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Ödeme Başarısız</h1>
            <p className="text-muted-foreground mb-8">
              Ödeme işlemi tamamlanamadı. Kart bilgilerinizi kontrol edip tekrar deneyebilirsiniz.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/sepet')}>Sepete Dön</Button>
              <Button variant="outline" onClick={() => navigate('/urunler')}>
                Alışverişe Devam
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
