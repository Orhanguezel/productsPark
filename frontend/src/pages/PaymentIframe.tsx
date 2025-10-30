import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { metahub } from "@/integrations/metahub/client";

const PaymentIframe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [iframeUrl, setIframeUrl] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<"card" | "havale">("card");

  // url paramlarını normalize et
  const urlParams = useMemo(() => {
    const token = searchParams.get("token") ?? undefined;
    const iframe_param = searchParams.get("iframe_url") ?? undefined;
    const sid = searchParams.get("session_id") ?? searchParams.get("sid") ?? undefined;
    const order_id = searchParams.get("order_id") ?? searchParams.get("orderId") ?? "";
    const type = (searchParams.get("type") ?? "card").toLowerCase();
    return { token, iframe_param, sid, order_id, type: type === "havale" ? "havale" : "card" as const };
  }, [searchParams]);

  useEffect(() => {
    setPaymentType(urlParams.type === "havale" ? "havale" : "card");
    setOrderId(urlParams.order_id);

    (async () => {
      // 1) iframe_url direkt geldiyse onu kullan
      if (urlParams.iframe_param) {
        setIframeUrl(urlParams.iframe_param);
        return;
      }

      // 2) token geldiyse PayTR public URL'yi kur
      if (urlParams.token) {
        const base = urlParams.type === "havale"
          ? "https://www.paytr.com/odeme/havale/"
          : "https://www.paytr.com/odeme/guvenli/";
        setIframeUrl(base + urlParams.token);
        return;
      }

      // 3) session_id geldiyse BE'den oku (public endpoint veya gateway)
      if (urlParams.sid) {
        try {
          // Public okumayı kendi client’ınıza göre uyarlayın:
          // Örn: GET /api/payments/sessions/:id
          const { data, error } = await metahub
            .from("payment_sessions")
            .select("iframe_url, redirect_url")
            .eq("id", urlParams.sid)
            .single();

          if (error) throw error;
          const found = (data?.iframe_url || data?.redirect_url) as string | undefined;
          if (!found) throw new Error("Oturum URL’i bulunamadı");
          setIframeUrl(found);
          return;
        } catch {
          navigate("/sepet");
          return;
        }
      }

      // Hiçbiri yoksa
      navigate("/sepet");
    })();
  }, [urlParams, navigate]);

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

  if (!iframeUrl) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button variant="ghost" onClick={() => navigate("/sepet")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sepete Dön
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{paymentType === "havale" ? "Havale/EFT Bilgileri" : "Güvenli Ödeme"}</CardTitle>
              {orderId && <p className="text-sm text-muted-foreground">Sipariş No: {orderId}</p>}
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
