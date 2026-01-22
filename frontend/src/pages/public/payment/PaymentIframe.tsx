// =============================================================
// FILE: src/pages/account/components/PaymentIframe.tsx
// FINAL — Card / PayTR iframe
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { useGetPaymentSessionByIdQuery } from '@/integrations/hooks';

export default function PaymentIframe() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const sessionId = params.get('session_id') ?? undefined;

  const { data: session, isLoading } = useGetPaymentSessionByIdQuery(sessionId!, {
    skip: !sessionId,
  });

  const iframeUrl = session?.iframe_url || session?.redirect_url || '';

  useEffect(() => {
    if (!iframeUrl || !/paytr\.com/i.test(iframeUrl)) return;

    const s = document.createElement('script');
    s.src = 'https://www.paytr.com/js/iframeResizer.min.js';
    s.async = true;
    s.onload = () => {
      (window as any)?.iFrameResize?.({ checkOrigin: false, scrolling: true }, '#paytriframe');
    };
    document.body.appendChild(s);
    return () => {
      document.body.removeChild(s);
    };
  }, [iframeUrl]);

  if (isLoading || !iframeUrl) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Ödeme hazırlanıyor…</div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto px-4 py-8 flex-1">
        <Button variant="ghost" onClick={() => navigate('/sepet')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Sepete Dön
        </Button>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Güvenli Ödeme</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <iframe
              id="paytriframe"
              src={iframeUrl}
              style={{ width: '100%', minHeight: 600, border: 'none' }}
              title="Ödeme"
            />
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
