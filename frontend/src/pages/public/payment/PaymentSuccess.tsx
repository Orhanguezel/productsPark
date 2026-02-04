// =============================================================
// FILE: src/pages/account/components/PaymentSuccess.tsx
// FINAL — Shopier callback (RTK only, idempotent)
// - tolerant param names
// - deterministic cache cleanup
// =============================================================

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';

import { useShopierNotifyMutation } from '@/integrations/hooks';

const pick = (p: URLSearchParams, keys: string[]): string | null => {
  for (const k of keys) {
    const v = p.get(k);
    if (v && v.trim()) return v.trim();
  }
  return null;
};

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  const [shopierNotify] = useShopierNotifyMutation();

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const platform_order_id = pick(params, ['platform_order_id', 'platformOrderId']);
      const status = pick(params, ['status']);
      const payment_id = pick(params, ['payment_id', 'paymentId']);
      const signature = pick(params, ['signature']);
      const random_nr = pick(params, ['random_nr', 'randomNr']);
      const API_key = pick(params, ['API_key', 'api_key', 'apiKey']);

      const valid = !!platform_order_id && !!status && !!payment_id && !!signature;
      const guardKey = valid ? `shopier_cb:${platform_order_id}:${payment_id}` : null;

      try {
        if (valid && guardKey && !sessionStorage.getItem(guardKey)) {
          sessionStorage.setItem(guardKey, '1');

          await shopierNotify({
            platform_order_id,
            status,
            payment_id,
            signature,
            random_nr,
            API_key,
          } as any).unwrap();
        }
      } catch {
        // intentionally silent (UX)
      } finally {
        if (!cancelled) {
          sessionStorage.removeItem('checkoutData');
          sessionStorage.removeItem('havalepaymentData');
          sessionStorage.removeItem('bankTransferKind');
          sessionStorage.removeItem('bankTransferConfig');
          localStorage.removeItem('guestCart');
          setProcessing(false);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [params, shopierNotify]);

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
