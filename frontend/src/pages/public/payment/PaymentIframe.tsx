// =============================================================
// FILE: src/pages/account/components/PaymentIframe.tsx
// FINAL — Payment iframe (provider-aware, robust session resolution)
// Fixes:
// - sessionId resolution: query (session_id|sessionId|id) OR sessionStorage.payment_session.id
// - if session exists in storage but query missing: auto-navigate to include query param
// - never crashes when session missing/404: shows friendly UI
// - avoids inline style (tailwind classes)
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

import { useGetPaymentSessionByIdQuery } from '@/integrations/hooks';

type StoredPaymentSession = {
  id?: string;
  provider_key?: string;
  order_id?: string | null;
  iframe_url?: string | null;
  redirect_url?: string | null;
  client_secret?: string | null;
  extra?: Record<string, unknown> | null;
};

const pickSessionIdFromQuery = (params: URLSearchParams): string | null => {
  const v = params.get('session_id') ?? params.get('sessionId') ?? params.get('id');
  const s = (v ?? '').trim();
  return s ? s : null;
};

const pickSessionIdFromStorage = (): string | null => {
  const raw = sessionStorage.getItem('payment_session');
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as StoredPaymentSession;
    const id = String(obj?.id ?? '').trim();
    return id ? id : null;
  } catch {
    return null;
  }
};

const isPaytrLike = (providerKey: string, iframeUrl: string): boolean => {
  const pk = providerKey.trim().toLowerCase();
  if (pk === 'paytr') return true;
  return /paytr\.com/i.test(iframeUrl);
};

const isFormDataRecord = (v: unknown): v is Record<string, string | number> => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return false;
  for (const val of Object.values(v as Record<string, unknown>)) {
    const t = typeof val;
    if (t !== 'string' && t !== 'number') return false;
  }
  return true;
};

export default function PaymentIframe() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const shopierFormRef = useRef<HTMLFormElement | null>(null);

  const queryId = useMemo(() => pickSessionIdFromQuery(params), [params]);
  const [storageId, setStorageId] = useState<string | null>(() => pickSessionIdFromStorage());

  const sessionId = useMemo(() => queryId ?? storageId, [queryId, storageId]);

  // Re-sync storageId (same-tab sessionStorage writes don't fire "storage" event)
  useEffect(() => {
    if (queryId || storageId) return;

    let cancelled = false;
    let idx = 0;
    const delays = [100, 200, 400, 800, 1200, 1600, 2000]; // ~6s total

    const tick = () => {
      if (cancelled) return;
      const id = pickSessionIdFromStorage();
      if (id) {
        setStorageId(id);
        return;
      }

      const nextDelay = delays[Math.min(idx, delays.length - 1)];
      idx += 1;
      setTimeout(tick, nextDelay);
    };

    const t = setTimeout(tick, delays[0]);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [queryId, storageId]);

  // Also re-check on focus/visibility (if storage is set later)
  useEffect(() => {
    const sync = () => {
      const id = pickSessionIdFromStorage();
      if (id && id !== storageId) setStorageId(id);
    };
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('storage', sync);
    };
  }, [storageId]);

  // If storage has id but URL missing -> normalize URL (replace)
  useEffect(() => {
    if (!queryId && storageId) {
      navigate(`/odeme-iframe?session_id=${encodeURIComponent(storageId)}`, { replace: true });
    }
  }, [queryId, storageId, navigate]);

  const {
    data: session,
    isLoading,
    isError,
    error,
  } = useGetPaymentSessionByIdQuery(sessionId as string, { skip: !sessionId });

  const providerKey = String(session?.provider_key ?? '')
    .trim()
    .toLowerCase();
  const iframeUrl = String(session?.iframe_url ?? session?.redirect_url ?? '').trim();

  const shopierForm = useMemo(() => {
    const extra = (session as any)?.extra as Record<string, unknown> | null;
    const shopier = (extra && typeof extra === 'object' ? (extra as any).shopier : null) as
      | Record<string, unknown>
      | null;

    const form_action =
      (typeof shopier?.form_action === 'string' && shopier.form_action.trim()) || '';
    const form_data = shopier?.form_data;

    if (!form_action || !isFormDataRecord(form_data)) return null;
    return { form_action, form_data };
  }, [session]);

  const shouldAutoSubmitShopier = providerKey === 'shopier' && !!shopierForm;

  useEffect(() => {
    if (!shouldAutoSubmitShopier) return;
    const f = shopierFormRef.current;
    if (!f) return;
    const t = setTimeout(() => {
      try {
        f.submit();
      } catch {
        // ignore
      }
    }, 300);
    return () => clearTimeout(t);
  }, [shouldAutoSubmitShopier]);

  // PayTR iframeResizer
  useEffect(() => {
    if (!iframeUrl || !isPaytrLike(providerKey, iframeUrl)) return;

    const s = document.createElement('script');
    s.src = 'https://www.paytr.com/js/iframeResizer.min.js';
    s.async = true;
    s.onload = () => {
      (window as unknown as { iFrameResize?: (...args: any[]) => void }).iFrameResize?.(
        { checkOrigin: false, scrolling: true },
        '#paytriframe',
      );
    };
    document.body.appendChild(s);

    return () => {
      try {
        document.body.removeChild(s);
      } catch {
        // ignore
      }
    };
  }, [iframeUrl, providerKey]);

  // ---------------- UI: no session id ----------------
  if (!sessionId) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <div className="font-semibold">Ödeme oturumu bulunamadı.</div>
            <div className="text-sm text-muted-foreground">
              Checkout’tan geldiysen URL’e <code>session_id</code> eklenmemiş olabilir.
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => navigate('/odeme')}>
                Ödeme sayfası
              </Button>
              <Button onClick={() => navigate('/sepet')}>Sepete dön</Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ---------------- UI: error / not found ----------------
  if (isError) {
    const status = (error as any)?.status;
    const msg =
      status === 404
        ? 'Oturum bulunamadı (404).'
        : status
          ? `Sunucu hatası (HTTP ${String(status)}).`
          : 'Beklenmeyen hata.';

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-3 max-w-md">
            <div className="font-semibold">Ödeme oturumu okunamadı.</div>
            <div className="text-sm text-muted-foreground">{msg}</div>
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() =>
                  navigate(`/odeme-iframe?session_id=${encodeURIComponent(sessionId)}`, {
                    replace: true,
                  })
                }
              >
                Yenile
              </Button>
              <Button variant="outline" onClick={() => navigate('/odeme')}>
                Ödemeye dön
              </Button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // ---------------- UI: Shopier auto-submit ----------------
  if (shouldAutoSubmitShopier && shopierForm) {
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
              <CardTitle>Shopier Ödeme</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <p>Ödeme sayfasına yönlendiriliyorsunuz…</p>

              <form ref={shopierFormRef} method="POST" action={shopierForm.form_action}>
                {Object.entries(shopierForm.form_data).map(([k, v]) => (
                  <input key={k} type="hidden" name={k} value={String(v)} />
                ))}
                <Button type="submit">Devam Et</Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // ---------------- UI: loading / missing iframeUrl ----------------
  if (isLoading || !iframeUrl) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">Ödeme hazırlanıyor…</div>
        <Footer />
      </div>
    );
  }

  const paytr = isPaytrLike(providerKey, iframeUrl);
  const iframeId = paytr ? 'paytriframe' : 'payiframe';

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
              id={iframeId}
              src={iframeUrl}
              className="w-full min-h-[600px] border-0"
              title="Ödeme"
              // PayTR resizer zaten height ayarlar; diğer provider’larda da scroll kalsın
              scrolling="yes"
            />
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
