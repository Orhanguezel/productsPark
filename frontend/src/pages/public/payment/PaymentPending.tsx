// =============================================================
// FILE: src/pages/account/components/PaymentPending.tsx
// FINAL — Havale bekleme ekranı (UI only)
// =============================================================

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

export default function PaymentPending() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('checkoutData');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <Card className="max-w-xl w-full">
          <CardContent className="pt-12 pb-12 text-center">
            <Clock className="w-16 h-16 text-yellow-600 mx-auto mb-6" />
            <h1 className="text-2xl font-bold mb-4">Ödeme Bildiriminiz Alındı</h1>
            <p className="text-muted-foreground mb-8">
              Havale/EFT ödemeniz admin onayı beklemektedir.
            </p>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => navigate('/hesabim')}>Siparişlerim</Button>
              <Button variant="outline" onClick={() => navigate('/')}>
                Ana Sayfa
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
