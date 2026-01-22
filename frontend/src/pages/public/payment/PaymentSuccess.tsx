// =============================================================
// FILE: src/pages/account/components/PaymentSuccess.tsx
// FINAL — Shopier callback (RTK only, idempotent)
// =============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

import { useShopierCallbackMutation } from '@/integrations/hooks';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  const [shopierCallback] = useShopierCallbackMutation();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const platform_order_id = params.get('platform_order_id');
      const status = params.get('status');
      const payment_id = params.get('payment_id');
      const signature = params.get('signature');
      const random_nr = params.get('random_nr');
      const API_key = params.get('API_key');

      const valid = !!platform_order_id && !!status && !!payment_id && !!signature;

      const guardKey = valid ? `shopier_cb:${platform_order_id}:${payment_id}` : null;

      try {
        if (valid && guardKey && !sessionStorage.getItem(guardKey)) {
          sessionStorage.setItem(guardKey, '1');

          await shopierCallback({
            platform_order_id,
            status,
            payment_id,
            signature,
            random_nr,
            API_key,
          }).unwrap();
        }
      } catch {
        // intentionally silent (UX)
      } finally {
        if (!cancelled) {
          sessionStorage.removeItem('checkoutData');
          sessionStorage.removeItem('havalepaymentData');
          localStorage.removeItem('guestCart');
          setProcessing(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [params, shopierCallback]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Ödeme Başarılı</h1>
            <p className="text-muted-foreground mb-8">
              Siparişiniz alınmıştır. Detayları hesabınızdan takip edebilirsiniz.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/hesabim')}>Siparişlerim</Button>
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
