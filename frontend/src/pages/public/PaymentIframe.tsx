// =============================================================
// FILE: src/pages/account/components/PaymentIframe.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

import { useGetPaymentSessionByIdQuery } from "@/integrations/metahub/rtk/endpoints/payment_sessions.endpoints";

type PaymentType = "card" | "havale";

const PaymentIframe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<PaymentType>("card");

  // url paramlarını normalize et
  const urlParams = useMemo(() => {
    const token = searchParams.get("token") ?? undefined;
    const iframe_param = searchParams.get("iframe_url") ?? undefined;
    const sid =
      searchParams.get("session_id") ?? searchParams.get("sid") ?? undefined;
    const order_id =
      searchParams.get("order_id") ?? searchParams.get("orderId") ?? "";
    const typeRaw = (searchParams.get("type") ?? "card").toLowerCase();

    const type: PaymentType =
      typeRaw === "havale" ? "havale" : "card";

    return { token, iframe_param, sid, order_id, type };
  }, [searchParams]);

  const sessionId = urlParams.sid;
  const shouldFetchSession =
    !!sessionId && !urlParams.token && !urlParams.iframe_param;

  // 🔗 RTK ile payment_session fetch
  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
  } = useGetPaymentSessionByIdQuery(sessionId as string, {
    skip: !shouldFetchSession,
  });

  // URL / session datasına göre iframe + sipariş bilgisi set et
  useEffect(() => {
    setPaymentType(urlParams.type);
    setOrderId(urlParams.order_id);

    // 1) iframe_url direkt URL'de geldiyse onu kullan
    if (urlParams.iframe_param) {
      setIframeUrl(urlParams.iframe_param);
      return;
    }

    // 2) token geldiyse PayTR public URL'yi kur
    if (urlParams.token) {
      const base =
        urlParams.type === "havale"
          ? "https://www.paytr.com/odeme/havale/"
          : "https://www.paytr.com/odeme/guvenli/";
      setIframeUrl(base + urlParams.token);
      return;
    }

    // 3) session_id varsa ve RTK'den session geldiyse
    if (shouldFetchSession && session) {
      const found = session.iframe_url || session.redirect_url || "";
      if (found) {
        setIframeUrl(found);
      }
      return;
    }
  }, [urlParams, session, shouldFetchSession]);

  // session fetch başarısızsa sepete at
  useEffect(() => {
    if (!shouldFetchSession) return;
    if (sessionLoading) return;
    if (iframeUrl) return; // URL bulunduysa dokunma

    if (sessionError || (!session && !sessionLoading)) {
      navigate("/sepet");
    }
  }, [shouldFetchSession, sessionLoading, sessionError, iframeUrl, session, navigate]);

  // iFrameResizer sadece PayTR domainleri için initialize
  useEffect(() => {
    if (!iframeUrl) return;
    if (!/paytr\.com/i.test(iframeUrl)) return;

    const script = document.createElement("script");
    script.src = "https://www.paytr.com/js/iframeResizer.min.js";
    script.async = true;
    script.onload = () => {
      (window as any)?.iFrameResize?.(
        {
          log: false,
          checkOrigin: false,
          heightCalculationMethod: "bodyScroll",
          scrolling: true,
          autoResize: true,
          sizeHeight: true,
          sizeWidth: false,
          tolerance: 10,
        },
        "#paytriframe"
      );
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) document.body.removeChild(script);
    };
  }, [iframeUrl]);

  // Session’dan yükleniyorsa basit bir loading göstergesi
  if (!iframeUrl && shouldFetchSession && sessionLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center text-muted-foreground">
            Ödeme sayfanız hazırlanıyor…
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // URL hiç bulunamadıysa (ve redirect yapılmadıysa)
  if (!iframeUrl) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/sepet")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sepete Dön
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>
                {paymentType === "havale"
                  ? "Havale/EFT Bilgileri"
                  : "Güvenli Ödeme"}
              </CardTitle>
              {orderId && (
                <p className="text-sm text-muted-foreground">
                  Sipariş No: {orderId}
                </p>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <iframe
                  id="paytriframe"
                  src={iframeUrl}
                  frameBorder="0"
                  scrolling="no"
                  style={{ width: "100%", minHeight: "600px", border: "none" }}
                  title="Ödeme Formu"
                  allow="payment"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Ödeme işleminiz güvenli altyapı üzerinden gerçekleştirilmektedir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentIframe;
